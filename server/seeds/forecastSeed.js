import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import ForecastService from '../services/forecastService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedForecasts = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Get all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products. Scanning for transactions...`);

        let count = 0;
        let skipped = 0;

        for (const product of products) {
            // Check if product has any OUT transactions (minimum required for forecast)
            const transactions = await StockTransaction.find({
                productId: product._id,
                type: 'OUT'
            }).limit(2);

            if (transactions.length >= 2) {
                console.log(`Generating forecast for: ${product.name} (${product.sku})...`);
                const result = await ForecastService.triggerForecast(product._id);
                if (result) {
                    count++;
                } else {
                    skipped++;
                }
            } else {
                skipped++;
            }
        }

        console.log('═══════════════════════════════════════');
        console.log(' Forecast Seeding Completed ');
        console.log(`Total Products:    ${products.length}`);
        console.log(`Forecasts Created: ${count}`);
        console.log(`Skipped (data):   ${skipped}`);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('Seeding Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedForecasts();
