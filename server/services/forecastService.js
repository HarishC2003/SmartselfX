import axios from 'axios';
import StockTransaction from '../models/StockTransaction.js';
import Product from '../models/Product.js';
import ForecastData from '../models/ForecastData.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

const FORECAST_SERVICE_URL = process.env.FORECAST_SERVICE_URL || 'http://localhost:8000';

class ForecastService {
    /**
     * Trigger a background forecast calculation for a specific product
     */
    static async triggerForecast(productId) {
        try {
            const product = await Product.findById(productId)
                .populate('categoryId')
                .populate('vendorId');

            if (!product) return null;

            // Fetch last 60 days of usage transactions (OUT)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

            const transactions = await StockTransaction.find({
                productId,
                timestamp: { $gte: sixtyDaysAgo }
            }).sort({ timestamp: 1 });

            if (transactions.filter(t => t.type === 'OUT').length < 2) {
                if (process.env.NODE_ENV !== 'production') console.log(`Not enough 'OUT' transaction data for forecasting product ${productId}`);
                return null;
            }

            const payload = {
                product: {
                    productId: product._id.toString(),
                    name: product.name,
                    sku: product.sku,
                    currentStock: product.currentStock,
                    reorderLevel: product.reorderLevel,
                    reorderQuantity: product.reorderQuantity,
                    maxStockLevel: product.maxStockLevel,
                    unit: product.unit,
                    leadTimeDays: product.leadTimeDays || 3,
                    isPerishable: product.isPerishable || false,
                    expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null
                },
                transactions: transactions.map(t => ({
                    date: t.timestamp.toISOString(),
                    type: t.type,
                    quantity: t.quantity,
                    referenceType: t.referenceType
                })),
                forecastDays: 7
            };

            const response = await axios.post(`${FORECAST_SERVICE_URL}/forecast/predict`, payload, {
                timeout: 10000 // 10 seconds timeout
            });

            if (response.data.success) {
                const result = response.data.data;

                // 1. Save detailed forecast history
                const forecastHistory = new ForecastData({
                    productId,
                    avgDailyDemand: result.avgDailyDemand,
                    wmaDemand: result.wmaDemand,
                    sesDemand: result.sesDemand,
                    ensembleDemand: result.ensembleDemand,
                    safetyStock: result.safetyStock,
                    reorderPoint: result.reorderPoint,
                    suggestedOrderQty: result.suggestedOrderQty,
                    daysUntilStockout: result.daysUntilStockout,
                    stockoutRisk: result.stockoutRisk,
                    forecast: result.forecast,
                    dataPointsUsed: result.dataPointsUsed,
                    confidenceScore: result.confidenceScore,
                    confidenceLabel: result.confidenceLabel,
                    method: result.method,
                    warnings: result.warnings,
                    generatedAt: new Date(result.generatedAt)
                });
                await forecastHistory.save();

                // 2. Update Product model for fast access (summary)
                await Product.findByIdAndUpdate(productId, {
                    forecast: {
                        dailyDemand: result.ensembleDemand,
                        recommendedReorderPoint: result.reorderPoint,
                        safetyStock: result.safetyStock,
                        confidenceLevel: result.confidenceScore,
                        confidenceLabel: result.confidenceLabel,
                        stockoutRisk: result.stockoutRisk,
                        forecastArray: result.forecast,
                        warnings: result.warnings,
                        nextRestockDate: result.forecast.length > 0 ? new Date(result.forecast[0].date) : null,
                        lastCalculatedAt: new Date(result.generatedAt)
                    }
                });

                if (process.env.NODE_ENV !== 'production') console.log(`✅ Forecast updated for product: ${product.name} | Risk: ${result.stockoutRisk}`);
                return result;
            }

            return null;

        } catch (error) {
            if (error.response) {
                console.warn('⚠️ Forecast service error body:', JSON.stringify(error.response.data, null, 2));
            }
            console.warn('⚠️ Forecast service unavailable or error:', error.message);
            return null;
        }
    }

    /**
     * Get the most recent forecast for a product
     */
    static async getLatestForecast(productId) {
        return await ForecastData.findOne({ productId }).sort({ generatedAt: -1 });
    }

    /**
     * Aggregate the latest forecast for all products
     */
    static async getAllProductsLatestForecast() {
        return await ForecastData.aggregate([
            { $sort: { generatedAt: -1 } },
            {
                $group: {
                    _id: "$productId",
                    latestForecast: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$latestForecast" } }
        ]);
    }
}

export default ForecastService;
