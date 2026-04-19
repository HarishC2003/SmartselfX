import Product from '../models/Product.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import User from '../models/User.js';
import Alert from '../models/Alert.js';

export const globalSearch = async (req, res) => {
    try {
        const startMs = Date.now();
        const { q, limit: queryLimit } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search term must be at least 2 characters long' });
        }

        const limit = parseInt(queryLimit) || 5;

        const isVendor = req.user.role === 'VENDOR';
        const isAdmin = req.user.role === 'ADMIN';
        const vendorId = req.user.id; // or _id depending on token setup

        const regexObj = { $regex: q, $options: 'i' };

        // 1. Products Query Setup
        const productQuery = {
            $or: [
                { name: regexObj },
                { sku: regexObj },
                { description: regexObj }
            ],
            // Only search active products to avoid confusing results
            isActive: true
        };
        if (isVendor) productQuery.vendorId = vendorId;

        // 2. Purchase Orders Query Setup
        const poQuery = {
            $or: [
                { poNumber: regexObj }
            ]
        };
        if (isVendor) poQuery.vendorId = vendorId;

        // 3. Alerts Query Setup
        const alertQuery = {
            message: regexObj,
            isDismissed: false
        };

        // We run these in parallel
        const promises = [
            // Prom 1: Products
            Product.find(productQuery)
                .populate('categoryId', 'name')
                .limit(limit)
                .lean(),

            // Prom 2: POs
            PurchaseOrder.find(poQuery)
                .populate({
                    path: 'productId',
                    match: { name: regexObj },
                    select: 'name'
                })
                .limit(limit)
                .lean(),

            // Prom 3: Users (Only if admin, else return empty resolving immediately)
            isAdmin ? User.find({
                $or: [
                    { name: regexObj },
                    { email: regexObj }
                ]
            }).limit(3).lean() : Promise.resolve([]),

            // Prom 4: Alerts
            Alert.find(alertQuery)
                .populate('productId', 'name')
                .limit(3)
                .lean()
        ];

        // Also we want to catch POs where the product name matches the search query.
        // Mongoose populate matches filter out the populated doc if no match but don't filter the root doc.
        // To make it fully search by PO product name we can do an independent product text lookup first OR 
        // a secondary aggregate. For simplicity and following prompt we match just by poNumber and populated productName client side or combined lookup.
        // Actually prompt says: `$or: [ { poNumber: regex } ] + populate product name match`
        
        const [rawProducts, rawPOs, rawUsers, rawAlerts] = await Promise.all(promises);

        // Map Products
        const products = rawProducts.map(p => ({
            type: 'product',
            id: p._id,
            name: p.name,
            sku: p.sku,
            currentStock: p.currentStock,
            stockStatus: p.stockStatus,
            categoryName: p.categoryId ? p.categoryId.name : 'Uncategorized',
            imageUrl: p.imageUrl || null
        }));

        // Map Purchase Orders
        const purchaseOrders = rawPOs.map(po => ({
            type: 'purchaseOrder',
            id: po._id,
            poNumber: po.poNumber,
            productName: po.productId ? po.productId.name : 'Unknown Product',
            status: po.status,
            totalAmount: po.totalAmount,
            createdAt: po.createdAt
        }));

        // Map Users
        const users = rawUsers.map(u => ({
            type: 'user',
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive
        }));

        // Map Alerts
        const alerts = rawAlerts.map(a => ({
            type: 'alert',
            id: a._id,
            message: a.message,
            severity: a.severity,
            alertType: a.type,
            productName: a.productId ? a.productId.name : null
        }));

        const endMs = Date.now();
        const searchTimeMs = endMs - startMs;
        const totalResults = products.length + purchaseOrders.length + users.length + alerts.length;

        // Structured output
        res.status(200).json({
            query: q,
            results: {
                products,
                purchaseOrders,
                users,
                alerts
            },
            totalResults,
            searchTime: `${searchTimeMs}ms`
        });

    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};
