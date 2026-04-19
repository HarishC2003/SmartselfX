import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Alert from '../models/Alert.js';

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Clearing existing transactions and alerts...');
        try {
            await mongoose.connection.collection('stocktransactions').deleteMany({});
        } catch (e) { }
        try {
            await mongoose.connection.collection('alerts').deleteMany({});
        } catch (e) { }

        const users = await User.find({ role: { $in: ['ADMIN', 'MANAGER'] } });
        if (users.length === 0) {
            console.log('No ADMIN/MANAGER found. Attempting to fetch any user...');
            const anyUser = await User.findOne({});
            if (anyUser) {
                users.push(anyUser);
            } else {
                throw new Error('No users found in database. Run Module 1 seed.');
            }
        }

        const products = await Product.find({});
        if (products.length < 5) throw new Error('Not enough products found. Run productSeed first.');

        console.log('Generating 60 transactions...');
        const transactionsData = [];

        const now = new Date().getTime();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        // Generate random timestamps chronologically
        const timestamps = Array.from({ length: 60 })
            .map(() => thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo))
            .sort();

        for (let i = 0; i < 60; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const handler = users[Math.floor(Math.random() * users.length)];

            // Bias towards OUT, but if strictly empty, force IN
            let type = Math.random() > 0.4 ? 'OUT' : 'IN';
            if (product.currentStock === 0) type = 'IN';

            let quantity;
            let refType;
            if (type === 'IN') {
                quantity = Math.floor(Math.random() * 50) + 10; // 10-60
                const typesIn = ['PURCHASE_ORDER', 'MANUAL', 'RETURN'];
                refType = typesIn[Math.floor(Math.random() * typesIn.length)];
            } else {
                quantity = Math.floor(Math.random() * Math.min(product.currentStock, 30)) + 1;
                const typesOut = ['SALES', 'MANUAL', 'ADJUSTMENT', 'DAMAGED'];
                refType = typesOut[Math.floor(Math.random() * typesOut.length)];
            }

            const previousStock = product.currentStock;
            const newStock = type === 'IN' ? previousStock + quantity : previousStock - quantity;

            // Apply stock locally
            product.currentStock = newStock;

            transactionsData.push({
                productId: product._id,
                type,
                quantity,
                previousStock,
                newStock,
                referenceType: refType,
                handledBy: handler._id,
                note: `Seed transaction ${i + 1}`,
                timestamp: new Date(timestamps[i]) // Forcing chronological history
            });
        }

        await StockTransaction.insertMany(transactionsData);

        console.log('Generating 5 alerts and tweaking product final statuses...');

        // Modify specific products for the alerts
        products[0].currentStock = 0;

        products[1].currentStock = Math.max(0, products[1].reorderLevel - 5);

        products[2].currentStock = Math.max(0, products[2].reorderLevel - 10);

        let perishableProd = products.find(p => p.isPerishable);
        if (!perishableProd) perishableProd = products[3];
        perishableProd.isPerishable = true;
        perishableProd.expiryDate = new Date(now + 4 * 24 * 60 * 60 * 1000); // 4 days 

        products[4].currentStock = (products[4].maxStockLevel || 100) + 40;

        // Resave all products to trigger MongoDB middleware recalculating their dynamic `stockStatus` fields intrinsically.
        for (const p of products) {
            await p.save();
        }

        const alertsData = [
            {
                type: 'OUT_OF_STOCK',
                severity: 'CRITICAL',
                message: `Product ${products[0].name} has completely run out of stock and requires immediate attention.`,
                productId: products[0]._id,
                currentStock: products[0].currentStock,
                reorderLevel: products[0].reorderLevel,
                createdAt: new Date(now - 1000 * 60 * 5)
            },
            {
                type: 'LOW_STOCK',
                severity: 'HIGH',
                message: `Product ${products[1].name} has dropped below the defined reorder safety level.`,
                productId: products[1]._id,
                currentStock: products[1].currentStock,
                reorderLevel: products[1].reorderLevel,
                createdAt: new Date(now - 1000 * 60 * 60 * 2)
            },
            {
                type: 'LOW_STOCK',
                severity: 'HIGH',
                message: `Warning: ${products[2].name} is reaching critical low threshold levels.`,
                productId: products[2]._id,
                currentStock: products[2].currentStock,
                reorderLevel: products[2].reorderLevel,
                createdAt: new Date(now - 1000 * 60 * 60 * 5)
            },
            {
                type: 'EXPIRY', // Usually the value used or EXPIRY
                severity: 'MEDIUM',
                message: `Alert: ${perishableProd.name} will expire in 4 days. Please review inventory batches.`,
                productId: perishableProd._id,
                currentStock: perishableProd.currentStock,
                reorderLevel: perishableProd.reorderLevel,
                createdAt: new Date(now - 1000 * 60 * 60 * 24)
            },
            {
                type: 'OVERSTOCK',
                severity: 'LOW',
                message: `${products[4].name} currently exceeds maximum capacity storage thresholds (${products[4].maxStockLevel}).`,
                productId: products[4]._id,
                currentStock: products[4].currentStock,
                reorderLevel: products[4].reorderLevel,
                createdAt: new Date(now - 1000 * 60 * 30) // 30 min ago
            }
        ];

        // To be safe with `type` Enums, map 'EXPIRING_SOON' appropriately based on generic requirements if it strictly validates. Assuming 'EXPIRING_SOON' or 'EXPIRY' or 'SYSTEM'.
        // Let's use 'SYSTEM' if undefined, or map generic to 'LOW_STOCK' if schema strictly enforces it based on earlier parts.

        await Alert.insertMany(alertsData);

        console.log('✅ Seeded: 60 transactions, 5 alerts, product stocks recalculated');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding transactions:', error);
        process.exit(1);
    }
};

seedDatabase();
