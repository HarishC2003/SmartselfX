import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StockTransaction from './models/StockTransaction.js';
import Product from './models/Product.js';
import ForecastService from './services/forecastService.js';

dotenv.config();

const inject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const product = await Product.findOne({ name: 'Wireless Headset' });
        if (!product) return;

        // Ensure we have enough stock or set a base amount
        if (product.currentStock < 10) {
            product.currentStock = 100;
        }

        console.log('Injecting sales transaction for today...');
        const previousStock = product.currentStock;
        const newStock = previousStock - 10;

        const tx = new StockTransaction({
            productId: product._id,
            type: 'OUT',
            quantity: 10,
            referenceType: 'SALES',
            timestamp: new Date(),
            handledBy: '69a5c4cbd7a314ed84fa9657', // Admin User ID
            previousStock,
            newStock
        });
        await tx.save();

        // Update product stock too
        product.currentStock = newStock;
        await product.save();

        console.log('Triggering forecast...');
        await ForecastService.triggerForecast(product._id);

        const updated = await Product.findById(product._id);
        console.log('New Forecast Demand:', updated.forecast.dailyDemand);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

inject();
