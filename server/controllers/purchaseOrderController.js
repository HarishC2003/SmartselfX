import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Alert from '../models/Alert.js';
import ForecastData from '../models/ForecastData.js';
import VendorStockDeclaration from '../models/VendorStockDeclaration.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {
    sendPOCreatedToVendor,
    sendPOApprovedToManager,
    sendPORejectedToManager,
    sendPOReceivedToVendor,
    sendPOCancelledEmail
} from '../utils/sendMail.js';
import ForecastService from '../services/forecastService.js';
import { log } from '../services/auditService.js';

// 1. createPO
export const createPO = async (req, res) => {
    try {
        const { productId, quantity, internalNote, expectedDeliveryDate, suggestedByAI, forecastDataId, status } = req.body;

        const product = await Product.findById(productId).populate('vendorId', 'name email');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Ensure product has a valid vendor assigned (the populate will be null if user doesn't exist)
        if (!product.vendorId) {
            return res.status(400).json({ message: 'This product has no valid vendor assigned. Please assign a vendor before creating a purchase order.' });
        }

        const unitPrice = product.costPrice || 0;
        const totalAmount = unitPrice * quantity;

        const isDraft = status === 'DRAFT';

        const po = new PurchaseOrder({
            productId,
            vendorId: product.vendorId._id,
            createdBy: req.user.id,
            quantity,
            unitPrice,
            totalAmount,
            status: isDraft ? 'DRAFT' : 'PENDING',
            sentToVendorAt: isDraft ? null : new Date(),
            internalNote,
            expectedDeliveryDate,
            suggestedByAI,
            forecastDataId
        });

        await po.save();

        if (suggestedByAI) {
            await Alert.updateMany(
                { productId, status: 'UNREAD', type: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
                { status: 'DISMISSED' }
            );
        }

        const vendorToken = jwt.sign(
            { vendorId: product.vendorId._id, poId: po._id, role: 'VENDOR' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        const approveUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/vendor-portal/po/${po._id}/approve?token=${vendorToken}`;
        const rejectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/vendor-portal/po/${po._id}/reject?token=${vendorToken}`;

        if (!isDraft && product.vendorId.email) {
            await sendPOCreatedToVendor(product.vendorId.email, {
                poNumber: po.poNumber,
                vendorName: product.vendorId.name,
                productName: product.name,
                sku: product.sku,
                quantity,
                unitPrice,
                totalAmount,
                internalNote,
                createdByName: req.user.name || 'Manager',
                approveUrl,
                rejectUrl
            });
            po.emailSentToVendor = true;
            await po.save();
        }

        await log(req.user.id, 'PO_CREATED', 'PurchaseOrder', po._id, po.poNumber, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'INFO');

        res.status(201).json({ po, message: isDraft ? `Draft PO ${po.poNumber} saved.` : `PO ${po.poNumber} sent to vendor.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllPOs = async (req, res, next) => {
  try {
    const filter = {}

    // VENDOR: only sees their own POs
    if (req.user.role === 'VENDOR') {
      filter.vendorId = req.user.id
    }

    // Apply status filter
    if (req.query.status) filter.status = req.query.status

    // Apply search
    if (req.query.search) {
      filter.poNumber = { $regex: req.query.search, $options: 'i' }
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 20
    const skip  = (page - 1) * limit

    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('productId', 'name sku imageUrl currentStock unit')
        .populate('vendorId', 'name email phone')
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseOrder.countDocuments(filter)
    ])

    // Calculate total amount for this filter
    const totalAmountAgg = await PurchaseOrder.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const totalAmount = totalAmountAgg[0]?.total || 0

    res.status(200).json({
      purchaseOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      totalAmount
    })
  } catch (error) {
    if (next) next(error)
    else res.status(500).json({ message: error.message })
  }
}

// 3. getPOById
export const getPOById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('productId')
            .populate('vendorId')
            .populate('createdBy')
            .populate('stockTransactionId');

        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (req.user && req.user.role === 'VENDOR' && po.vendorId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({ po });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper for token overrides verification
const verifyVendorPO = (req, po) => {
    if (req.user && req.user.role === 'VENDOR') {
        const vId = po.vendorId._id ? po.vendorId._id.toString() : po.vendorId.toString();
        return vId === req.user.id;
    }
    // If not standard vendor context but they have token, verifyToken middleware injected req.user from token
    if (req.user && req.user.poId === po._id.toString()) {
        return true;
    }
    return false;
};

// 4. approvePO
export const approvePO = async (req, res) => {
    try {
        const { vendorNote, expectedDeliveryDate } = req.body;
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('productId')
            .populate('vendorId', 'name email')
            .populate('createdBy', 'name email');

        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.status !== 'PENDING') return res.status(400).json({ message: 'PO is not pending approval' });

        if (!verifyVendorPO(req, po)) return res.status(403).json({ message: 'Not authorized for this PO' });
        if (!expectedDeliveryDate) return res.status(400).json({ message: 'Expected delivery date is required' });

        po.status = 'DISPATCHED'; // Vendor accepts and "sends to warehouse" (dispatched)
        po.vendorNote = vendorNote || '';
        po.expectedDeliveryDate = expectedDeliveryDate;
        po.dispatchedAt = new Date();
        await po.save();

        if (po.createdBy.email) {
            await sendPOApprovedToManager(po.createdBy.email, {
                poNumber: po.poNumber,
                managerName: po.createdBy.name,
                vendorName: po.vendorId.name,
                productName: po.productId.name,
                quantity: po.quantity,
                totalAmount: po.totalAmount,
                expectedDeliveryDate,
                vendorNote,
                viewUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/purchase-orders`
            });
        }

        // Create alert for manager
        await Alert.create({
            productId: po.productId._id,
            type: 'RESTOCK_NEEDED', // Reusing appropriate type
            severity: 'INFO',
            message: `PO ${po.poNumber} accepted & shipped by vendor. Expected: ${new Date(expectedDeliveryDate).toLocaleDateString()}`,
            targetRoles: ['ADMIN', 'MANAGER']
        });

        // Auto-decrease vendor's declared stock (Logic moved from markDispatched)
        VendorStockDeclaration.decreaseQty(
            po.vendorId._id,
            po.productId.sku,
            po.quantity
        ).catch(err =>
            console.warn('Could not decrease vendor declaration qty:', err.message)
        );

        // Extract real user ID from context (manager or vendor token)
        const approverId = req.user.id || req.user.vendorId || req.user._id;
        await log(approverId, 'PO_APPROVED_AND_SHIPPED', 'PurchaseOrder', po._id, po.poNumber, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'INFO');

        res.status(200).json({ po, message: "PO accepted and marked as dispatched to warehouse." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. rejectPO
export const rejectPO = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('productId')
            .populate('vendorId', 'name email')
            .populate('createdBy', 'name email');

        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.status !== 'PENDING') return res.status(400).json({ message: 'PO is not pending' });
        if (!verifyVendorPO(req, po)) return res.status(403).json({ message: 'Not authorized for this PO' });
        if (!rejectionReason) return res.status(400).json({ message: 'Rejection reason is required' });

        po.status = 'REJECTED';
        po.rejectionReason = rejectionReason;
        await po.save();

        if (po.createdBy.email) {
            await sendPORejectedToManager(po.createdBy.email, {
                poNumber: po.poNumber,
                managerName: po.createdBy.name,
                vendorName: po.vendorId.name,
                productName: po.productId.name,
                rejectionReason,
                viewUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/purchase-orders`
            });
        }

        await Alert.create({
            productId: po.productId._id,
            type: 'RESTOCK_NEEDED', // Using existing valid type
            severity: 'HIGH',
            message: `URGENT: PO ${po.poNumber} rejected by vendor. Reason: ${rejectionReason}`,
            targetRoles: ['ADMIN', 'MANAGER']
        });

        const rejectorId = req.user.id || req.user.vendorId || req.user._id;
        await log(rejectorId, 'PO_REJECTED', 'PurchaseOrder', po._id, po.poNumber, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'WARNING');

        res.status(200).json({ po });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. markDispatched
export const markDispatched = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (po.status !== 'APPROVED') return res.status(400).json({ message: 'Only APPROVED POs can be dispatched' });

        if (req.user.role === 'VENDOR' && po.vendorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        po.status = 'DISPATCHED';
        await po.save();

        await Alert.create({
            productId: po.productId,
            type: 'SYSTEM_INFO',
            severity: 'INFO',
            message: `Shipment for PO ${po.poNumber} has been dispatched by the vendor.`
        });

        // Auto-decrease vendor's declared stock
        const product = await Product.findById(po.productId);
        if (product) {
            VendorStockDeclaration.decreaseQty(
                po.vendorId,
                product.sku,
                po.quantity
            ).catch(err =>
                console.warn('Could not decrease vendor declaration qty:', err.message)
            );
        }

        res.status(200).json({ po });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. markReceived
export const markReceived = async (req, res) => {
    try {
        const { actualQuantityReceived, note } = req.body;
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendorId')
            .populate('productId');

        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (!['DISPATCHED', 'APPROVED'].includes(po.status)) {
            return res.status(400).json({ message: 'PO cannot be received from its current status' });
        }

        const quantityReceived = actualQuantityReceived || po.quantity;
        po.status = 'RECEIVED';
        po.actualDeliveryDate = new Date();

        // Add to product stock
        const product = po.productId;
        const previousStock = product.currentStock;
        const newStock = previousStock + quantityReceived;
        
        product.currentStock = newStock;
        product.stockStatus = product.currentStock > product.maxStockLevel ? 'OVERSTOCKED' : 'IN_STOCK';
        await product.save();

        // Create transaction
        const transaction = new StockTransaction({
            productId: product._id,
            type: 'IN',
            quantity: quantityReceived,
            previousStock,
            newStock,
            referenceType: 'PURCHASE_ORDER',
            referenceId: po._id,
            handledBy: req.user.id,
            note: note || `Auto-recorded from PO ${po.poNumber}`
        });
        await transaction.save();

        po.stockTransactionId = transaction._id;
        await po.save();

        if (po.vendorId.email) {
            await sendPOReceivedToVendor(po.vendorId.email, {
                poNumber: po.poNumber,
                vendorName: po.vendorId.name,
                productName: product.name,
                quantity: quantityReceived,
                receivedByName: req.user.name || 'Manager',
                receivedAt: new Date()
            });
        }

        // Trigger forecast update
        ForecastService.triggerForecast(product._id).catch(err => console.error(err));

        await log(req.user.id, 'PO_RECEIVED', 'PurchaseOrder', po._id, po.poNumber, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'INFO');

        res.status(200).json({ po, transaction, message: "Stock received and inventory updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. cancelPO
export const cancelPO = async (req, res) => {
    try {
        const { reason } = req.body;
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendorId')
            .populate('productId');

        if (!po) return res.status(404).json({ message: 'PO not found' });
        if (['RECEIVED', 'CANCELLED'].includes(po.status)) {
            return res.status(400).json({ message: 'Cannot cancel a PO that is already received or cancelled' });
        }

        po.status = 'CANCELLED';
        await po.save();

        if (po.vendorId.email) {
            await sendPOCancelledEmail(po.vendorId.email, {
                poNumber: po.poNumber,
                recipientName: po.vendorId.name,
                productName: po.productId.name,
                cancelledByName: req.user.name || 'Manager',
                reason: reason || 'Cancelled by administration'
            });
        }

        res.status(200).json({ po });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Internal helper for stats/badges
const _getCurrentRecommendationsCount = async () => {
    const urgentForecasts = await ForecastData.find({
        stockoutRisk: { $in: ['HIGH', 'CRITICAL'] }
    });
    
    // Unique by productId
    const uniqueProductIds = [...new Set(urgentForecasts.map(f => f.productId.toString()))];
    
    let count = 0;
    for (const pid of uniqueProductIds) {
        const p = await Product.findById(pid);
        if (p && p.isActive) count++;
    }
    return count;
};

// 9. getPOStats
export const getPOStats = async (req, res) => {
    try {
        // Scope all aggregations to vendor's own POs if role is VENDOR
        const matchFilter = {};
        if (req.user.role === 'VENDOR') {
            const mongoose = (await import('mongoose')).default;
            matchFilter.vendorId = new mongoose.Types.ObjectId(req.user.id);
        }

        const totalAmountRes = await PurchaseOrder.aggregate([
            { $match: matchFilter },
            { $group: { _id: null, totalPOs: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
        ]);
        const totals = totalAmountRes[0] || { totalPOs: 0, totalAmount: 0 };

        const byStatusRes = await PurchaseOrder.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const byStatus = {};
        byStatusRes.forEach(s => byStatus[s._id] = s.count);

        const aiSuggestedCount = req.user.role === 'VENDOR' ? 0 : await _getCurrentRecommendationsCount();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthRes = await PurchaseOrder.aggregate([
            { $match: { ...matchFilter, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
        ]);
        const thisMonth = thisMonthRes[0] || { count: 0, amount: 0 };

        const topVendors = req.user.role === 'VENDOR' ? [] : await PurchaseOrder.aggregate([
            { $group: { _id: '$vendorId', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { vendorName: '$vendor.name', company: '$vendor.company', count: 1, totalAmount: 1 } }
        ]);

        const deliveryTimes = await PurchaseOrder.aggregate([
            { $match: { ...matchFilter, status: 'RECEIVED', actualDeliveryDate: { $ne: null } } },
            { $project: { deliveryDays: { $divide: [{ $subtract: ['$actualDeliveryDate', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
            { $group: { _id: null, avgDeliveryDays: { $avg: '$deliveryDays' } } }
        ]);
        const avgDeliveryDays = deliveryTimes[0]?.avgDeliveryDays || 0;

        res.status(200).json({
            totalPOs: totals.totalPOs,
            totalAmount: totals.totalAmount,
            byStatus,
            aiSuggestedCount,
            thisMonthPOs: thisMonth.count,
            thisMonthAmount: thisMonth.amount,
            topVendors,
            avgDeliveryDays
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 10. getAIRecommendations
export const getAIRecommendations = async (req, res) => {
    try {
        const query = {
            stockoutRisk: { $in: ['HIGH', 'CRITICAL'] }
        };

        // If Vendor, limit to only THEIR products
        if (req.user.role === 'VENDOR') {
            const myProductIds = await Product.find({ vendorId: req.user.id, isActive: true }).distinct('_id');
            query.productId = { $in: myProductIds };
        }

        const urgentForecasts = await ForecastData.find(query).sort({ generatedAt: -1 });

        const recMap = new Map();

        for (const forecast of urgentForecasts) {
            const pid = forecast.productId.toString();
            // If we already have a recommendation for this product, skip (we take the most recent one due to sort)
            if (recMap.has(pid)) continue;

            const product = await Product.findById(forecast.productId).populate('vendorId', 'name company');
            if (!product || !product.isActive) continue;

            const hasVendor = !!product.vendorId;

            const activePO = await PurchaseOrder.findOne({
                productId: product._id,
                status: { $in: ['DRAFT', 'PENDING', 'APPROVED', 'DISPATCHED'] }
            });
            const hasActivePO = !!activePO;

            const baseQty = product.reorderQuantity || Math.ceil(forecast.ensembleDemand * 30) || Math.max(1, (product.maxStockLevel - product.currentStock));
            const leadTime = product.leadTimeDays || 3;

            let suggestedQty = baseQty;
            if (forecast.daysUntilStockout <= leadTime) suggestedQty = Math.ceil(suggestedQty * 1.5);
            if (product.maxStockLevel) {
                const maxAllowed = product.maxStockLevel - product.currentStock;
                if (suggestedQty > maxAllowed && maxAllowed > 0) suggestedQty = maxAllowed;
            }

            let urgencyScore = 0;
            let reason = '';

            if (forecast.stockoutRisk === 'CRITICAL' && forecast.daysUntilStockout <= 0) {
                urgencyScore = 100;
                reason = `Stock empty. Urgent restock required.`;
            } else if (forecast.stockoutRisk === 'CRITICAL') {
                urgencyScore = 85;
                reason = `Stockout expected in ${forecast.daysUntilStockout} days (CRITICAL).`;
            } else if (forecast.stockoutRisk === 'HIGH' && forecast.daysUntilStockout <= leadTime) {
                urgencyScore = 75;
                reason = `Stock will run out in ${forecast.daysUntilStockout} days before ${leadTime}-day lead time.`;
            } else {
                urgencyScore = 60;
                reason = `Stockout approaching in ${forecast.daysUntilStockout} days. Plan purchase soon.`;
            }

            recMap.set(pid, {
                productId: product._id,
                productName: product.name,
                sku: product.sku,
                imageUrl: product.image,
                vendorId: product.vendorId?._id,
                vendorName: product.vendorId?.name || 'NO VENDOR ASSIGNED',
                company: product.vendorId?.company || 'N/A',
                currentStock: product.currentStock,
                forecastDataId: forecast._id,
                daysUntilStockout: forecast.daysUntilStockout,
                stockoutRisk: forecast.stockoutRisk,
                suggestedQty,
                unitPrice: product.costPrice || 0,
                leadTimeDays: leadTime,
                urgencyScore,
                reason: hasVendor ? reason : `URGENT! ${reason} Assign a vendor to generate PO.`,
                hasVendor,
                hasActivePO,
                activePONumber: activePO?.poNumber,
                activePOStatus: activePO?.status
            });
        }

        const recommendations = Array.from(recMap.values()).sort((a, b) => b.urgencyScore - a.urgencyScore);
        const urgentCount = recommendations.filter(r => r.urgencyScore >= 75).length;

        res.status(200).json({
            recommendations,
            totalRecommendations: recommendations.length,
            urgentCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
