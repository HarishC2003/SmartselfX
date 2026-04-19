import mongoose from 'mongoose';
import ForecastData from '../models/ForecastData.js';
import Product from '../models/Product.js';
import ForecastService from '../services/forecastService.js';

/**
 * @desc Get latest forecast for a specific product
 * @route GET /api/forecast/:productId
 * @access Private (ADMIN, MANAGER, VENDOR)
 */
export const getProductForecast = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId)
            .populate('categoryId', 'name')
            .populate('vendorId', 'name contactPerson');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Vendor can only see their own products
        if (req.user.role === 'VENDOR' && product.vendorId?._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this forecast' });
        }

        const latestForecast = await ForecastService.getLatestForecast(productId);

        const activePO = await mongoose.model('PurchaseOrder').findOne({
            productId,
            status: { $in: ['DRAFT', 'PENDING', 'APPROVED', 'DISPATCHED'] }
        }).select('poNumber status createdAt').lean();

        if (!latestForecast) {
            return res.status(200).json({
                hasForecast: false,
                message: "No forecast available yet. Record some OUT transactions to generate AI insights.",
                product,
                activePO
            });
        }

        res.status(200).json({
            success: true,
            hasForecast: true,
            forecast: latestForecast,
            product,
            activePO
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Manually refresh forecast for a product
 * @route POST /api/forecast/:productId/refresh
 * @access Private (ADMIN, MANAGER)
 */
export const refreshForecast = async (req, res) => {
    try {
        const { productId } = req.params;

        const result = await ForecastService.triggerForecast(productId);

        if (!result) {
            return res.status(400).json({
                message: 'Failed to generate forecast. Ensure sufficient "OUT" transaction history (min 2 days).'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Forecast refreshed successfully',
            forecast: result
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get latest forecasts for all products with filtering
 * @route GET /api/forecast
 * @access Private (ADMIN, MANAGER)
 *
 * KEY FIX: Also includes products that are OUT_OF_STOCK or LOW_STOCK
 * but have no ForecastData entries. These are shown as CRITICAL risk
 * with 0 daysUntilStockout so admins can take action.
 */
export const getAllForecasts = async (req, res) => {
    try {
        const { stockoutRisk, page = 1, limit = 100 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Get the latest forecast ID per product
        const latestForecastsPipeline = [
            { $sort: { generatedAt: -1 } },
            {
                $group: {
                    _id: "$productId",
                    latestId: { $first: "$_id" }
                }
            }
        ];

        const results = await ForecastData.aggregate(latestForecastsPipeline);
        const latestIds = results.map(r => r.latestId);
        const forecastedProductIds = results.map(r => r._id);

        // 2. Query actual ForecastData docs
        let forecastQuery = { _id: { $in: latestIds } };
        if (stockoutRisk) {
            forecastQuery.stockoutRisk = stockoutRisk;
        }

        let forecasts = await ForecastData.find(forecastQuery)
            .populate({
                path: 'productId',
                select: 'name sku currentStock unit image imageUrl categoryId reorderLevel reorderQuantity maxStockLevel costPrice stockStatus',
                populate: { path: 'categoryId', select: 'name' }
            })
            .sort({ daysUntilStockout: 1 })
            .lean();

        // Filter out forecasts where the product was deleted
        forecasts = forecasts.filter(f => f.productId != null);

        // 3. Find active products that are OUT_OF_STOCK or LOW_STOCK but have NO forecast data
        const unforecastedProducts = await Product.find({
            isActive: true,
            _id: { $nin: forecastedProductIds },
            stockStatus: { $in: ['OUT_OF_STOCK', 'LOW_STOCK'] }
        })
            .populate('categoryId', 'name')
            .lean();

        // 4. Build synthetic forecast entries for unforecasted critical products
        const syntheticForecasts = unforecastedProducts.map(product => {
            const isCritical = product.currentStock === 0;
            return {
                _id: `synthetic_${product._id}`,
                productId: {
                    _id: product._id,
                    name: product.name,
                    sku: product.sku,
                    currentStock: product.currentStock,
                    unit: product.unit,
                    image: product.imageUrl || product.image || null,
                    categoryId: product.categoryId
                },
                avgDailyDemand: 0,
                wmaDemand: 0,
                sesDemand: 0,
                ensembleDemand: 0,
                safetyStock: 0,
                reorderPoint: product.reorderLevel || 0,
                suggestedOrderQty: product.reorderQuantity || 0,
                daysUntilStockout: 0,
                stockoutRisk: isCritical ? 'CRITICAL' : 'HIGH',
                forecast: [],
                dataPointsUsed: 0,
                confidenceScore: 0,
                confidenceLabel: 'No Data',
                method: 'stock_status_fallback',
                warnings: [
                    isCritical
                        ? 'Product is completely out of stock. No transaction history available for AI forecasting.'
                        : 'Product is below reorder level. No transaction history available for AI forecasting.'
                ],
                generatedAt: new Date(),
                isSynthetic: true
            };
        });

        // 5. If a stockoutRisk filter is set, also filter synthetic entries
        let filteredSynthetics = syntheticForecasts;
        if (stockoutRisk) {
            filteredSynthetics = syntheticForecasts.filter(s => s.stockoutRisk === stockoutRisk);
        }

        // 6. Merge and sort: real forecasts first, then synthetics, all sorted by urgency
        let allForecasts = [...forecasts, ...filteredSynthetics].sort((a, b) => {
            return (a.daysUntilStockout || 0) - (b.daysUntilStockout || 0);
        });

        // 6.5. Attach active PO info to each forecast
        const pids = allForecasts.map(f => f.productId._id);
        const activePOs = await mongoose.model('PurchaseOrder').find({
            productId: { $in: pids },
            status: { $in: ['DRAFT', 'PENDING', 'APPROVED', 'DISPATCHED'] }
        }).select('productId poNumber status').lean();

        const poMap = {};
        activePOs.forEach(po => {
            poMap[po.productId.toString()] = po;
        });

        allForecasts = allForecasts.map(f => ({
            ...f,
            activePO: poMap[f.productId._id.toString()] || null
        }));

        // 7. Paginate
        const total = allForecasts.length;
        const paginatedForecasts = allForecasts.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            forecasts: paginatedForecasts,
            pagination: {
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc Get global forecasting summary
 * @route GET /api/forecast/summary
 * @access Private (ADMIN, MANAGER)
 *
 * KEY FIX: Also counts products that are OUT_OF_STOCK or LOW_STOCK
 * but have no ForecastData entries in the risk counts.
 */
export const getForecastSummary = async (req, res) => {
    try {
        // Get the latest forecast for each product
        const latestForecasts = await ForecastService.getAllProductsLatestForecast();
        const forecastedProductIds = latestForecasts.map(f => f.productId.toString());

        // Find unforecasted products that are in critical/high-risk states
        const unforecastedCritical = await Product.find({
            isActive: true,
            _id: { $nin: forecastedProductIds },
            stockStatus: { $in: ['OUT_OF_STOCK', 'LOW_STOCK'] }
        }).select('name currentStock stockStatus reorderLevel').lean();

        const unforecastedCriticalCount = unforecastedCritical.filter(p => p.currentStock === 0).length;
        const unforecastedHighCount = unforecastedCritical.filter(p => p.currentStock > 0).length;

        const summary = {
            totalProductsForecasted: latestForecasts.length + unforecastedCritical.length,
            criticalRisk: latestForecasts.filter(f => f.stockoutRisk === 'CRITICAL').length + unforecastedCriticalCount,
            highRisk: latestForecasts.filter(f => f.stockoutRisk === 'HIGH').length + unforecastedHighCount,
            mediumRisk: latestForecasts.filter(f => f.stockoutRisk === 'MEDIUM').length,
            lowRisk: latestForecasts.filter(f => f.stockoutRisk === 'LOW').length,
            avgConfidence: latestForecasts.reduce((acc, f) => acc + (f.confidenceScore || 0), 0) / (latestForecasts.length || 1),
            productsNeedingReorder: []
        };

        // Products from real forecasts that need reorder
        for (const f of latestForecasts) {
            const product = await Product.findById(f.productId).select('name currentStock');
            if (product && product.currentStock <= f.reorderPoint) {
                summary.productsNeedingReorder.push({
                    productId: product._id,
                    name: product.name,
                    currentStock: product.currentStock,
                    reorderPoint: f.reorderPoint,
                    risk: f.stockoutRisk
                });
            }
        }

        // Unforecasted products that need reorder
        for (const p of unforecastedCritical) {
            summary.productsNeedingReorder.push({
                productId: p._id,
                name: p.name,
                currentStock: p.currentStock,
                reorderPoint: p.reorderLevel || 0,
                risk: p.currentStock === 0 ? 'CRITICAL' : 'HIGH'
            });
        }

        res.status(200).json({
            success: true,
            summary
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
