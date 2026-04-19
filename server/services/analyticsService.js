import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Alert from '../models/Alert.js';
import ForecastData from '../models/ForecastData.js';
import Category from '../models/Category.js';

export const analyticsService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. getExecutiveSummary
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getExecutiveSummary: async ({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // --- Inventory ---
    const invData = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
          totalRetailValue: { $sum: { $multiply: ['$currentStock', '$sellingPrice'] } },
          lowStockCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'LOW_STOCK'] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'OUT_OF_STOCK'] }, 1, 0] } },
          overstockedCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'OVERSTOCKED'] }, 1, 0] } },
          healthyStockCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'IN_STOCK'] }, 1, 0] } }
        }
      }
    ]);
    const inventory = invData[0] || {
      totalProducts: 0, totalStockValue: 0, totalRetailValue: 0, lowStockCount: 0,
      outOfStockCount: 0, overstockedCount: 0, healthyStockCount: 0
    };
    inventory.potentialProfit = inventory.totalRetailValue - inventory.totalStockValue;

    // --- Transactions ---
    const txData = await StockTransaction.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                totalTransactions: { $sum: 1 }
              }
            }
          ],
          dailyOut: [
            { $match: { type: 'OUT' } },
            {
              $group: {
                _id: {
                  year: { $year: '$timestamp' },
                  month: { $month: '$timestamp' },
                  day: { $dayOfMonth: '$timestamp' }
                },
                quantity: { $sum: '$quantity' },
                date: { $first: '$timestamp' }
              }
            },
            { $sort: { quantity: -1 } }
          ],
          refType: [
            {
              $group: {
                _id: '$referenceType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ]);

    const txTotals = txData[0]?.totals[0] || { totalIn: 0, totalOut: 0, totalTransactions: 0 };
    const peakDay = txData[0]?.dailyOut[0] || null;
    const topRef = txData[0]?.refType[0]?._id || null;

    const daysInRange = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    const transactions = {
      totalIn: txTotals.totalIn,
      totalOut: txTotals.totalOut,
      totalTransactions: txTotals.totalTransactions,
      netMovement: txTotals.totalIn - txTotals.totalOut,
      avgDailyOut: txTotals.totalOut / daysInRange,
      peakDayOut: peakDay ? { date: peakDay.date, quantity: peakDay.quantity } : null,
      topReferenceType: topRef
    };

    // --- Purchase Orders ---
    const poData = await PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalPOs: { $sum: 1 },
          totalPOValue: { $sum: '$totalAmount' },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
          approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
          receivedCount: { $sum: { $cond: [{ $eq: ['$status', 'RECEIVED'] }, 1, 0] } },
          rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
          aiSuggestedCount: { $sum: { $cond: [{ $eq: ['$suggestedByAI', true] }, 1, 0] } },
          aiSuggestedValue: { $sum: { $cond: [{ $eq: ['$suggestedByAI', true] }, '$totalAmount', 0] } },
          totalDeliveryDays: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'RECEIVED'] }, { $ne: ['$actualDeliveryDate', null] }] },
                { $divide: [{ $subtract: ['$actualDeliveryDate', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                0
              ]
            }
          },
          onTimeCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'RECEIVED'] },
                    { $lte: ['$actualDeliveryDate', '$expectedDeliveryDate'] }
                  ]
                }, 1, 0
              ]
            }
          }
        }
      }
    ]);
    const po = poData[0] || {
      totalPOs: 0, totalPOValue: 0, pendingCount: 0, approvedCount: 0,
      receivedCount: 0, rejectedCount: 0, aiSuggestedCount: 0, aiSuggestedValue: 0,
      totalDeliveryDays: 0, onTimeCount: 0
    };

    const purchaseOrders = {
      ...po,
      avgDeliveryDays: po.receivedCount > 0 ? po.totalDeliveryDays / po.receivedCount : 0,
      onTimeDeliveryRate: po.receivedCount > 0 ? (po.onTimeCount / po.receivedCount) * 100 : 0
    };
    delete purchaseOrders.totalDeliveryDays;
    delete purchaseOrders.onTimeCount;
    delete purchaseOrders._id;

    // --- Alerts ---
    const alertData = await Alert.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          unresolvedCount: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }, // Assuming isRead implies resolved for now
          criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } }
        }
      }
    ]);
    const alerts = alertData[0] || { totalAlerts: 0, unresolvedCount: 0, criticalCount: 0, resolvedCount: 0 };
    delete alerts._id;

    // --- Forecast ---
    const forecastData = await ForecastData.aggregate([
      {
        $group: {
          _id: null,
          productsForecasted: { $sum: 1 },
          criticalRiskCount: { $sum: { $cond: [{ $eq: ['$stockoutRisk', 'CRITICAL'] }, 1, 0] } },
          highRiskCount: { $sum: { $cond: [{ $eq: ['$stockoutRisk', 'HIGH'] }, 1, 0] } },
          totalConfidence: { $sum: '$confidenceScore' },
          totalDaysUntilStockout: { $sum: '$daysUntilStockout' }
        }
      }
    ]);
    const fc = forecastData[0] || { productsForecasted: 0, criticalRiskCount: 0, highRiskCount: 0, totalConfidence: 0, totalDaysUntilStockout: 0 };
    
    const forecast = {
      productsForecasted: fc.productsForecasted,
      criticalRiskCount: fc.criticalRiskCount,
      highRiskCount: fc.highRiskCount,
      avgConfidenceScore: fc.productsForecasted > 0 ? fc.totalConfidence / fc.productsForecasted : 0,
      avgDaysUntilStockout: fc.productsForecasted > 0 ? fc.totalDaysUntilStockout / fc.productsForecasted : 0
    };

    return { inventory, transactions, purchaseOrders, alerts, forecast };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. getInventoryHealthReport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getInventoryHealthReport: async ({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stockStatusBreakdown = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$stockStatus',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          statuses: { $push: '$$ROOT' }
        }
      },
      { $unwind: '$statuses' },
      {
        $project: {
          _id: 0,
          status: '$statuses._id',
          count: '$statuses.count',
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$statuses.count', '$total'] }, 100] },
              0
            ]
          },
          totalValue: '$statuses.totalValue'
        }
      }
    ]);

    const categoryBreakdown = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          color: { $first: '$category.color' },
          productCount: { $sum: 1 },
          totalStock: { $sum: '$currentStock' },
          totalValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
          lowStockCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'LOW_STOCK'] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockStatus', 'OUT_OF_STOCK'] }, 1, 0] } }
        }
      },
      { $project: { _id: 0 } }
    ]);

    const topValueProducts = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          name: 1,
          sku: 1,
          currentStock: 1,
          stockStatus: 1,
          categoryName: '$category.name',
          stockValue: { $multiply: ['$currentStock', '$costPrice'] }
        }
      },
      { $sort: { stockValue: -1 } },
      { $limit: 10 }
    ]);

    // Transaction-based metrics
    const txOutStats = await StockTransaction.aggregate([
      { $match: { type: 'OUT', timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$productId',
          totalOutQty: { $sum: '$quantity' }
        }
      }
    ]);

    const txOutObj = {};
    txOutStats.forEach(stat => { txOutObj[stat._id.toString()] = stat.totalOutQty; });

    const activeProducts = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'forecastdatas',
            localField: '_id',
            foreignField: 'productId',
            as: 'forecast'
          }
        },
        { $unwind: { path: '$forecast', preserveNullAndEmptyArrays: true } }
    ]);

    const daysInRange = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    let fastMovingProducts = [];
    let slowMovingProducts = [];

    activeProducts.forEach(prod => {
      const pid = prod._id.toString();
      const totalOutQty = txOutObj[pid] || 0;
      
      const pData = {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        totalOutQty,
        avgDailyOut: totalOutQty / daysInRange,
        currentStock: prod.currentStock,
        daysUntilStockout: prod.forecast?.daysUntilStockout || 0,
        stockValue: prod.currentStock * prod.costPrice,
        lastMovementDate: prod.lastRestockedAt // simplify
      };

      if (totalOutQty > 0) {
        fastMovingProducts.push(pData);
        slowMovingProducts.push({...pData}); // will sort bottom 10
      }
    });

    fastMovingProducts.sort((a, b) => b.totalOutQty - a.totalOutQty);
    fastMovingProducts = fastMovingProducts.slice(0, 10);

    slowMovingProducts.sort((a, b) => a.totalOutQty - b.totalOutQty);
    slowMovingProducts = slowMovingProducts.slice(0, 10);

    // Dead stock
    const deadStockProductsGroups = await Product.aggregate([
        { $match: { isActive: true, currentStock: { $gt: 0 } } },
        {
            $lookup: {
                from: 'stocktransactions',
                localField: '_id',
                foreignField: 'productId',
                pipeline: [
                    { $match: { type: 'OUT', timestamp: { $gte: thirtyDaysAgo } } }
                ],
                as: 'recentOutTx'
            }
        },
        { $match: { recentOutTx: { $size: 0 } } },
        {
            $lookup: {
                from: 'stocktransactions',
                localField: '_id',
                foreignField: 'productId',
                pipeline: [
                    { $match: { type: 'OUT' } },
                    { $sort: { timestamp: -1 } },
                    { $limit: 1 }
                ],
                as: 'lastOutTx'
            }
        },
        { $unwind: { path: '$lastOutTx', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                productId: '$_id',
                name: 1,
                sku: 1,
                currentStock: 1,
                stockValue: { $multiply: ['$currentStock', '$costPrice'] },
                lastMovementDate: '$lastOutTx.timestamp'
            }
        }
    ]);
    const deadStockProducts = deadStockProductsGroups.map(p => ({
        ...p,
        daysSinceLastMovement: p.lastMovementDate ? Math.floor((new Date() - new Date(p.lastMovementDate)) / (1000 * 60 * 60 * 24)) : 'N/A'
    }));

    // Expiry risk
    const expiryRisk = await Product.aggregate([
      { 
          $match: { 
              isActive: true, 
              isPerishable: true, 
              expiryDate: { $lte: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) } 
          } 
      },
      {
          $project: {
              productId: '$_id',
              name: 1,
              sku: 1,
              expiryDate: 1,
              daysUntilExpiry: { $floor: { $divide: [{ $subtract: ['$expiryDate', new Date()] }, 1000 * 60 * 60 * 24] } },
              currentStock: 1,
              stockValue: { $multiply: ['$currentStock', '$costPrice'] }
          }
      },
      { $sort: { daysUntilExpiry: 1 } }
    ]);

    return {
      stockStatusBreakdown,
      categoryBreakdown,
      topValueProducts,
      fastMovingProducts,
      slowMovingProducts,
      deadStockProducts,
      expiryRisk
    };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. getTransactionReport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getTransactionReport: async ({ startDate, endDate, groupBy = 'day' }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let periodGroup;
    if (groupBy === 'day') {
        periodGroup = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
    } else if (groupBy === 'week') {
        periodGroup = { $dateToString: { format: "%Y-W%V", date: "$timestamp" } };
    } else if (groupBy === 'month') {
        periodGroup = { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
    }

    const timelineRaw = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: periodGroup,
                totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                transactionCount: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    const timeline = timelineRaw.map(t => ({
        period: t._id,
        totalIn: t.totalIn,
        totalOut: t.totalOut,
        netMovement: t.totalIn - t.totalOut,
        transactionCount: t.transactionCount
    }));

    const byProduct = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$productId',
                totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                transactionCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.categoryId',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                productId: '$_id',
                name: '$product.name',
                sku: '$product.sku',
                totalIn: 1,
                totalOut: 1,
                netMovement: { $subtract: ['$totalIn', '$totalOut'] },
                transactionCount: 1,
                categoryName: '$category.name'
            }
        },
        { $sort: { transactionCount: -1 } },
        { $limit: 20 }
    ]);

    const txTotals = timeline.reduce((acc, curr) => acc + curr.transactionCount, 0);

    const byReferenceTypeRaw = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$referenceType',
                count: { $sum: 1 },
                totalQty: { $sum: '$quantity' }
            }
        },
        { $sort: { count: -1 } }
    ]);
    const byReferenceType = byReferenceTypeRaw.map(r => ({
        referenceType: r._id,
        count: r.count,
        totalQty: r.totalQty,
        percentage: txTotals > 0 ? (r.count / txTotals) * 100 : 0
    }));

    const byHandler = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$handledBy',
                totalIn: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                totalOut: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                transactionCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $project: {
                userId: '$_id',
                name: '$user.name',
                role: '$user.role',
                totalIn: 1,
                totalOut: 1,
                transactionCount: 1,
                avgQtyPerTransaction: { $divide: [{ $add: ['$totalIn', '$totalOut'] }, '$transactionCount'] }
            }
        },
        { $sort: { transactionCount: -1 } }
    ]);

    const hourlyPatternRaw = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: { $hour: '$timestamp' },
                count: { $sum: 1 },
                totalQty: { $sum: '$quantity' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    const hourlyPattern = hourlyPatternRaw.map(h => ({ hour: h._id, count: h.count, totalQty: h.totalQty }));

    const weekdayPatternRaw = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: { $dayOfWeek: '$timestamp' }, // 1 (Sun) - 7 (Sat)
                count: { $sum: 1 },
                totalQty: { $sum: '$quantity' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayPattern = weekdayPatternRaw.map(w => ({
        weekday: w._id - 1, // 0-6
        label: dayLabels[w._id - 1],
        count: w.count,
        totalQty: w.totalQty
    }));

    return { timeline, byProduct, byReferenceType, byHandler, hourlyPattern, weekdayPattern };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. getPurchaseOrderReport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getPurchaseOrderReport: async ({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const timeline = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                poCount: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' },
                approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
                rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                period: '$_id', poCount: 1, totalValue: 1, approvedCount: 1, rejectedCount: 1, _id: 0
            }
        }
    ]);

    const vendorPerformance = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$vendorId',
                totalPOs: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' },
                approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } },
                receivedCount: { $sum: { $cond: [{ $eq: ['$status', 'RECEIVED'] }, 1, 0] } },
                rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
                totalQtySupplied: { $sum: { $cond: [{ $eq: ['$status', 'RECEIVED'] }, '$quantity', 0] } },
                totalDeliveryDays: {
                    $sum: {
                      $cond: [
                        { $and: [{ $eq: ['$status', 'RECEIVED'] }, { $ne: ['$actualDeliveryDate', null] }] },
                        { $divide: [{ $subtract: ['$actualDeliveryDate', '$createdAt'] }, 1000 * 60 * 60 * 24] },
                        0
                      ]
                    }
                },
                onTimeCount: {
                    $sum: {
                        $cond: [
                        {
                            $and: [
                            { $eq: ['$status', 'RECEIVED'] },
                            { $lte: ['$actualDeliveryDate', '$expectedDeliveryDate'] }
                            ]
                        }, 1, 0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $project: {
                vendorId: '$_id',
                vendorName: '$vendor.name',
                totalPOs: 1,
                totalValue: 1,
                approvedCount: 1,
                rejectedCount: 1,
                approvalRate: { $cond: [{ $gt: ['$totalPOs', 0] }, { $multiply: [{ $divide: ['$approvedCount', '$totalPOs'] }, 100] }, 0] },
                avgDeliveryDays: { $cond: [{ $gt: ['$receivedCount', 0] }, { $divide: ['$totalDeliveryDays', '$receivedCount'] }, 0] },
                onTimeCount: 1,
                onTimeRate: { $cond: [{ $gt: ['$receivedCount', 0] }, { $multiply: [{ $divide: ['$onTimeCount', '$receivedCount'] }, 100] }, 0] },
                totalQtySupplied: 1
            }
        },
        { $sort: { totalValue: -1 } }
    ]);

    const byProduct = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$productId',
                poCount: { $sum: 1 },
                totalQtyOrdered: { $sum: '$quantity' },
                totalValue: { $sum: '$totalAmount' },
                lastPODate: { $max: '$createdAt' }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $project: {
                productId: '$_id',
                name: '$product.name',
                sku: '$product.sku',
                poCount: 1,
                totalQtyOrdered: 1,
                totalValue: 1,
                lastPODate: 1
            }
        },
        { $sort: { poCount: -1 } },
        { $limit: 20 }
    ]);

    const statusCounts = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    const totalStatusCount = statusCounts.reduce((acc, curr) => acc + curr.count, 0);
    const statusFunnel = statusCounts.map(s => ({
        status: s._id,
        count: s.count,
        percentage: totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0,
        avgDaysInStatus: 0 // advanced calculation not trivial in simple agg, stubbing.
    }));

    const aiManualData = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $group: {
                _id: '$suggestedByAI',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' },
                approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'APPROVED'] }, 1, 0] } }
            }
        }
    ]);

    const aiStats = aiManualData.find(d => d._id === true) || { count: 0, totalValue: 0, approvedCount: 0 };
    const manualStats = aiManualData.find(d => d._id === false) || { count: 0, totalValue: 0, approvedCount: 0 };

    const aiVsManual = {
        aiSuggestedCount: aiStats.count,
        aiSuggestedValue: aiStats.totalValue,
        aiApprovalRate: aiStats.count > 0 ? (aiStats.approvedCount / aiStats.count) * 100 : 0,
        manualCount: manualStats.count,
        manualValue: manualStats.totalValue,
        manualApprovalRate: manualStats.count > 0 ? (manualStats.approvedCount / manualStats.count) * 100 : 0,
        aiSavingsEstimate: aiStats.totalValue * 0.15 // example heuristic 15% saving estimation
    };

    return { timeline, vendorPerformance, byProduct, statusFunnel, aiVsManual };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. getCategoryReport
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getCategoryReport: async ({ startDate, endDate }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const categoriesRaw = await Category.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'categoryId',
                as: 'products'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                color: 1,
                icon: 1,
                products: 1,
                productCount: { $size: '$products' }
            }
        }
    ]);

    const txStats = await StockTransaction.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.categoryId',
                totalInQty: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                totalOutQty: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } }
            }
        }
    ]);

    const poStats = await PurchaseOrder.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.categoryId',
                poCount: { $sum: 1 },
                poValue: { $sum: '$totalAmount' }
            }
        }
    ]);

    const categories = categoriesRaw.map(cat => {
        let totalStockValue = 0;
        let totalRetailValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let maxValProduct = null;
        let maxVal = -1;

        cat.products.forEach(p => {
            const sv = p.currentStock * p.costPrice;
            totalStockValue += sv;
            totalRetailValue += p.currentStock * p.sellingPrice;
            if (p.stockStatus === 'LOW_STOCK') lowStockCount++;
            if (p.stockStatus === 'OUT_OF_STOCK') outOfStockCount++;
            
            if (sv > maxVal) {
                maxVal = sv;
                maxValProduct = { name: p.name, sku: p.sku, stockValue: sv };
            }
        });

        const tx = txStats.find(t => t._id && t._id.toString() === cat._id.toString()) || { totalInQty: 0, totalOutQty: 0 };
        const po = poStats.find(p => p._id && p._id.toString() === cat._id.toString()) || { poCount: 0, poValue: 0 };

        return {
            categoryId: cat._id,
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            productCount: cat.productCount,
            totalStockValue,
            totalRetailValue,
            totalOutQty: tx.totalOutQty,
            totalInQty: tx.totalInQty,
            poCount: po.poCount,
            poValue: po.poValue,
            lowStockCount,
            outOfStockCount,
            topProduct: maxValProduct
        };
    });

    return { categories };
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. getWeeklySummary
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  getWeeklySummary: async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
    const prevEnd = new Date(start);

    // Current Week
    const execCurrent = await analyticsService.getExecutiveSummary({ startDate: start, endDate: end });
    const healthCurrent = await analyticsService.getInventoryHealthReport({ startDate: start, endDate: end });

    // Previous Week
    const execPrev = await analyticsService.getExecutiveSummary({ startDate: prevStart, endDate: prevEnd });

    // Deltas
    const txCurrent = execCurrent.transactions.totalTransactions;
    const txPrev = execPrev.transactions.totalTransactions;
    const transactionsDelta = txPrev > 0 ? ((txCurrent - txPrev) / txPrev) * 100 : (txCurrent > 0 ? 100 : 0);

    const svCurrent = execCurrent.inventory.totalStockValue;
    const svPrev = execPrev.inventory.totalStockValue;
    const stockValueDelta = svPrev > 0 ? ((svCurrent - svPrev) / svPrev) * 100 : (svCurrent > 0 ? 100 : 0);

    const poCurrent = execCurrent.purchaseOrders.totalPOValue;
    const poPrev = execPrev.purchaseOrders.totalPOValue;
    const poValueDelta = poPrev > 0 ? ((poCurrent - poPrev) / poPrev) * 100 : (poCurrent > 0 ? 100 : 0);

    // Low stock array
    const lowStockProducts = await Product.find({ stockStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } })
                                          .select('name sku currentStock')
                                          .limit(10);

    return {
        period: { start, end },
        highlights: {
            totalTransactions: txCurrent,
            totalStockIn: execCurrent.transactions.totalIn,
            totalStockOut: execCurrent.transactions.totalOut,
            newPOs: execCurrent.purchaseOrders.totalPOs,
            approvedPOs: execCurrent.purchaseOrders.approvedCount,
            receivedPOs: execCurrent.purchaseOrders.receivedCount,
            newAlerts: execCurrent.alerts.totalAlerts,
            criticalAlerts: execCurrent.alerts.criticalCount,
            lowStockProducts,
            topMovingProducts: healthCurrent.fastMovingProducts.map(p => ({
                name: p.name,
                sku: p.sku,
                totalOut: p.totalOutQty
            }))
        },
        vsLastWeek: {
            transactionsDelta,
            stockValueDelta,
            poValueDelta
        }
    };
  }
};

export default analyticsService;
