import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import StockTransaction from '../models/StockTransaction.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedPurchaseOrders = async () => {
    try {
        await connectDB();

        // Cleanup
        await PurchaseOrder.deleteMany({});
        console.log('Cleared existing purchase orders.');

        // Reference Data
        const admin = await User.findOne({ role: 'ADMIN' });
        const manager = await User.findOne({ role: 'MANAGER' });
        const vendor = await User.findOne({ role: 'VENDOR' });
        const products = await Product.find({}).limit(12);

        if (!admin || !vendor || products.length < 12) {
            console.error('Missing prerequisites: Need Admin, Vendor, and at least 12 products.');
            process.exit(1);
        }

        const now = new Date();
        const pastDate = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const futureDate = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const posToSeed = [];

        // 2 DRAFT
        for (let i = 0; i < 2; i++) {
            const prod = products[i];
            posToSeed.push({
                productId: prod._id,
                vendorId: vendor._id,
                createdBy: admin._id,
                quantity: 10 + i * 5,
                unitPrice: prod.costPrice,
                status: 'DRAFT',
                suggestedByAI: i === 0,
                internalNote: 'Draft PO waiting for review',
                createdAt: pastDate(1)
            });
        }

        // 3 PENDING
        for (let i = 2; i < 5; i++) {
            const prod = products[i];
            posToSeed.push({
                productId: prod._id,
                vendorId: vendor._id,
                createdBy: manager._id,
                quantity: 20 + i * 10,
                unitPrice: prod.costPrice,
                status: 'PENDING',
                suggestedByAI: i === 2,
                sentToVendorAt: pastDate(i),
                internalNote: 'Urgent restocking required',
                createdAt: pastDate(i + 1)
            });
        }

        // 2 APPROVED
        for (let i = 5; i < 7; i++) {
            const prod = products[i];
            posToSeed.push({
                productId: prod._id,
                vendorId: vendor._id,
                createdBy: admin._id,
                quantity: 50,
                unitPrice: prod.costPrice,
                status: 'APPROVED',
                suggestedByAI: false,
                sentToVendorAt: pastDate(10),
                approvedAt: pastDate(8),
                expectedDeliveryDate: futureDate(i),
                vendorNote: 'Will ship as soon as possible',
                createdAt: pastDate(11)
            });
        }

        // 1 DISPATCHED
        const prodDispatched = products[7];
        posToSeed.push({
            productId: prodDispatched._id,
            vendorId: vendor._id,
            createdBy: manager._id,
            quantity: 100,
            unitPrice: prodDispatched.costPrice,
            status: 'DISPATCHED',
            suggestedByAI: true,
            sentToVendorAt: pastDate(15),
            approvedAt: pastDate(14),
            dispatchedAt: pastDate(2),
            expectedDeliveryDate: futureDate(1),
            vendorNote: 'Dispatched via freight',
            createdAt: pastDate(16)
        });

        // 2 RECEIVED 
        for (let i = 8; i < 10; i++) {
            const prod = products[i];
            const p = new PurchaseOrder({
                productId: prod._id,
                vendorId: vendor._id,
                createdBy: admin._id,
                quantity: 200,
                unitPrice: prod.costPrice,
                status: 'RECEIVED',
                suggestedByAI: true,
                sentToVendorAt: pastDate(30),
                approvedAt: pastDate(29),
                dispatchedAt: pastDate(25),
                receivedAt: pastDate(i),
                expectedDeliveryDate: pastDate(i),
                internalNote: 'Completed successfully',
                createdAt: pastDate(31)
            });
            await p.save(); // triggers pre-save auto totalAmount, poNumber

            // Link a stock transaction
            const st = await StockTransaction.create({
                productId: prod._id,
                type: 'IN',
                quantity: 200,
                unitPrice: prod.costPrice,
                previousStock: prod.currentStock,
                newStock: prod.currentStock + 200,
                handledBy: admin._id,
                referenceId: p._id,
                referenceModel: 'PurchaseOrder',
                notes: `Auto received from PO ${p.poNumber}`
            });

            p.stockTransactionId = st._id;
            await p.save();
        }

        // 1 REJECTED
        const prodRejected = products[10];
        posToSeed.push({
            productId: prodRejected._id,
            vendorId: vendor._id,
            createdBy: manager._id,
            quantity: 50,
            unitPrice: prodRejected.costPrice,
            status: 'REJECTED',
            suggestedByAI: false,
            sentToVendorAt: pastDate(5),
            rejectedAt: pastDate(4),
            rejectionReason: 'Product discontinued by supplier',
            createdAt: pastDate(6)
        });

        // 1 CANCELLED
        const prodCancelled = products[11];
        posToSeed.push({
            productId: prodCancelled._id,
            vendorId: vendor._id,
            createdBy: admin._id,
            quantity: 30,
            unitPrice: prodCancelled.costPrice,
            status: 'CANCELLED',
            suggestedByAI: true,
            createdAt: pastDate(3),
            internalNote: 'Cancelled due to budget cuts'
        });

        // Insert non-received ones
        for (const data of posToSeed) {
            const p = new PurchaseOrder(data);
            await p.save();
        }

        console.log('✅ Seeded: 12 purchase orders');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding purchase orders:', error);
        process.exit(1);
    }
};

seedPurchaseOrders();
