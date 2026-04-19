import mongoose from 'mongoose';
import Product from './models/Product.js';
import ForecastData from './models/ForecastData.js';
import PurchaseOrder from './models/PurchaseOrder.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkState() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartshelfx');
        console.log('Connected to MongoDB');

        const urgentForecasts = await ForecastData.find({
            stockoutRisk: { $in: ['HIGH', 'CRITICAL'] }
        });
        
        console.log(`\nFound ${urgentForecasts.length} high/critical risk forecasts.`);
        
        for (const f of urgentForecasts) {
            const p = await Product.findById(f.productId).populate('vendorId');
            if (p) {
                console.log(`- Product: ${p.name}`);
                console.log(`  SKU: ${p.sku}`);
                console.log(`  Risk: ${f.stockoutRisk}`);
                console.log(`  Vendor: ${p.vendorId ? p.vendorId.name : 'MISSING'}`);
                console.log(`  Active: ${p.isActive}`);
            } else {
                console.log(`- Forecast points to non-existent product ID: ${f.productId}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkState();
