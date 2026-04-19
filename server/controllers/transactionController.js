import mongoose from 'mongoose';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import Alert from '../models/Alert.js';
import ForecastService from '../services/forecastService.js';
import { log } from '../services/auditService.js';

const createStockAlert = async (product, currentStock) => {
  try {
    const alertType = currentStock === 0
      ? 'OUT_OF_STOCK'
      : 'LOW_STOCK'

    // Check if unresolved alert already exists
    const existing = await Alert.findOne({
      productId: product._id,
      type: alertType,
      isDismissed: false
    })
    if (existing) return  // Don't create duplicate

    const severity = currentStock === 0 ? 'CRITICAL' : 'HIGH'
    const message = currentStock === 0
      ? `${product.name} is OUT OF STOCK. Immediate restock required.`
      : `${product.name} is LOW on stock. Only ${currentStock} units remaining (Reorder level: ${product.reorderLevel}).`

    await Alert.create({
      type: alertType,
      productId: product._id,
      message,
      severity,
      currentStock,
      reorderLevel: product.reorderLevel,
      targetRoles: ['ADMIN', 'MANAGER'],
      isRead: false,
      isDismissed: false
    })
  } catch (err) {
    console.warn('Alert creation failed:', err.message)
    // Never throw — don't break transaction
  }
}

const processTransaction = async (
  productId, type, quantity, referenceType,
  referenceId = null, handledBy, note = ''
) => {
  // 1. Find product
  const product = await Product.findById(productId)
  if (!product) throw new Error('Product not found')

  // 2. Validate stock for OUT
  if (type === 'OUT' && quantity > product.currentStock) {
    const err = new Error(
      `Insufficient stock. Available: ${product.currentStock}, Requested: ${quantity}`
    )
    err.status = 400
    throw err
  }

  // 3. Calculate new stock
  const previousStock = product.currentStock
  const newStock = type === 'IN'
    ? previousStock + quantity
    : previousStock - quantity

  // 4. Save transaction
  const cleanedRefId = (!referenceId || String(referenceId).trim() === '') ? null : referenceId;
  const transaction = await StockTransaction.create({
    productId,
    type,
    quantity,
    previousStock,
    newStock,
    referenceType,
    referenceId: cleanedRefId,
    handledBy,
    note,
    timestamp: new Date()
  })

  // 5. Update product stock and status
  product.currentStock = newStock
  if (type === 'IN') product.lastRestockedAt = new Date()

  // Recalculate stock status
  if (newStock === 0) {
    product.stockStatus = 'OUT_OF_STOCK'
  } else if (newStock <= product.reorderLevel) {
    product.stockStatus = 'LOW_STOCK'
  } else if (newStock > product.maxStockLevel) {
    product.stockStatus = 'OVERSTOCKED'
  } else {
    product.stockStatus = 'IN_STOCK'
  }
  await product.save()

  // 6. ✅ DATA FLOW STEP: Trigger alert if low stock
  if (product.stockStatus === 'LOW_STOCK' ||
      product.stockStatus === 'OUT_OF_STOCK') {
    await createStockAlert(product, newStock)
  }

  // 7. ✅ DATA FLOW STEP: Trigger AI forecast (non-blocking)
  ForecastService.triggerForecast(productId)
    .catch(err => console.warn('Forecast trigger failed:', err.message))

  return { transaction, product }
}

// ---------------------------------------------------------
// CONTROLLERS
// ---------------------------------------------------------

export const stockIn = async (req, res) => {
    try {
        const { productId, quantity, referenceType, referenceId, note } = req.body;

        if (!productId || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid productId or quantity' });
        }

        const result = await processTransaction(productId, 'IN', quantity, referenceType, referenceId, req.user.id, note);

        await log(req.user.id, 'STOCK_IN', 'Product', productId, result.product.name, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'INFO');

        res.status(201).json({
            message: 'Stock added successfully',
            transaction: result.transaction,
            product: result.product
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const stockOut = async (req, res) => {
    try {
        const { productId, quantity, referenceType, referenceId, note } = req.body;

        if (!productId || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid productId or quantity' });
        }

        const result = await processTransaction(productId, 'OUT', quantity, referenceType, referenceId, req.user.id, note);

        await log(req.user.id, 'STOCK_OUT', 'Product', productId, result.product.name, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'INFO');

        res.status(201).json({
            message: 'Stock removed successfully',
            transaction: result.transaction,
            product: result.product
        });

    } catch (error) {
        // Will catch "Insufficient stock" errors cleanly
        res.status(400).json({ message: error.message });
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        let query = {};
        const { productId, type, referenceType, handledBy, startDate, endDate, search, sortBy, sortOrder, page, limit } = req.query;

        // VENDOR limitation
        if (req.user.role === 'VENDOR') {
            const vendorProducts = await Product.find({ vendorId: req.user.id }).select('_id');
            const productIds = vendorProducts.map(p => p._id);
            query.productId = { $in: productIds };
        }

        if (productId) {
            // Re-enforce VENDOR boundary if productId passed explicitly
            if (req.user.role === 'VENDOR' && !query.productId.$in.some(id => id.toString() === productId)) {
                return res.status(403).json({ message: 'Access denied to this product\'s transactions' });
            }
            query.productId = productId;
        }

        if (type) query.type = type;
        if (referenceType) query.referenceType = referenceType;
        if (handledBy) query.handledBy = handledBy;

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                query.timestamp.$lte = endOfDay;
            }
        }

        // Search requires joining with Product, but we can manage via implicit populates or multi-step if simple search
        if (search) {
            const matchingProducts = await Product.find({ $text: { $search: search } }).select('_id');
            const productIds = matchingProducts.map(p => p._id);

            if (query.productId && query.productId.$in) { // intersect
                query.productId.$in = query.productId.$in.filter(id => productIds.some(pid => pid.equals(id)));
            } else {
                query.productId = { $in: productIds };
            }
        }

        const p = parseInt(page) || 1;
        const l = Math.min(parseInt(limit) || 20, 100);
        const startIndex = (p - 1) * l;

        const sortField = sortBy || 'timestamp';
        const sortOptions = {};
        sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

        const total = await StockTransaction.countDocuments(query);
        const transactions = await StockTransaction.find(query)
            .populate('productId', 'name sku categoryId')
            .populate('handledBy', 'name role')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(l);

        res.status(200).json({
            transactions,
            pagination: {
                total,
                page: p,
                limit: l,
                totalPages: Math.ceil(total / l)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const transaction = await StockTransaction.findById(req.params.id)
            .populate('productId')
            .populate('handledBy', 'name email role');

        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

        if (req.user.role === 'VENDOR' && transaction.productId.vendorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({ transaction });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transaction', error: error.message });
    }
};

export const getTransactionSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;

        let match = {};
        if (startDate || endDate) {
            match.timestamp = {};
            if (startDate) match.timestamp.$gte = new Date(startDate);
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setUTCHours(23, 59, 59, 999);
                match.timestamp.$lte = endOfDay;
            }
        }

        const dateGroupFormat = groupBy === 'week' ? "%Y-%w" : groupBy === 'month' ? "%Y-%m" : "%Y-%m-%d";

        const [summaryResults, byDate, byProduct, byReferenceType, byHandler] = await Promise.all([
            StockTransaction.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
                        totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } },
                        totalTransactions: { $sum: 1 }
                    }
                }
            ]),
            StockTransaction.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { $dateToString: { format: dateGroupFormat, date: "$timestamp" } },
                        totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
                        totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } },
                        transactionCount: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: "$_id", _id: 0, totalIn: 1, totalOut: 1, transactionCount: 1 } }
            ]),
            StockTransaction.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$productId",
                        totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
                        totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } }
                    }
                },
                { $sort: { totalOut: -1, totalIn: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                { $unwind: "$product" },
                { $project: { _id: 0, productId: "$_id", name: "$product.name", sku: "$product.sku", totalIn: 1, totalOut: 1 } }
            ]),
            StockTransaction.aggregate([
                { $match: match },
                { $group: { _id: "$referenceType", count: { $sum: 1 } } },
                { $project: { _id: 0, referenceType: "$_id", count: 1 } }
            ]),
            StockTransaction.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$handledBy",
                        count: { $sum: 1 },
                        totalIn: { $sum: { $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0] } },
                        totalOut: { $sum: { $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0] } }
                    }
                },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: "$user" },
                { $project: { _id: 0, name: "$user.name", role: "$user.role", count: 1, totalIn: 1, totalOut: 1 } },
                { $sort: { count: -1 } }
            ])
        ]);

        const stats = summaryResults[0] || { totalIn: 0, totalOut: 0, totalTransactions: 0 };
        const netMovement = stats.totalIn - stats.totalOut;

        res.status(200).json({
            summary: {
                totalIn: stats.totalIn,
                totalOut: stats.totalOut,
                totalTransactions: stats.totalTransactions,
                netMovement,
                byDate,
                byProduct,
                byReferenceType,
                byHandler
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving summary', error: error.message });
    }
};

export const getProductTransactionHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).select('name sku vendorId currentStock');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user.role === 'VENDOR' && product.vendorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const transactions = await StockTransaction.find({ productId })
            .sort({ timestamp: -1 })
            .limit(50)
            .populate('handledBy', 'name');

        res.status(200).json({
            transactions,
            currentStock: product.currentStock,
            product: { name: product.name, sku: product.sku }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
};
