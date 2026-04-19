import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ForecastService from './services/forecastService.js';
import Product from './models/Product.js';
import ForecastData from './models/ForecastData.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const product = await Product.findOne({ name: 'Wireless Headset' });
        if (!product) {
            console.log('No products found to test.');
            return;
        }

        console.log(`Testing forecast for: ${product.name} (${product._id})`);

        // Trigger manual forecast refresh
        const result = await ForecastService.triggerForecast(product._id);

        if (result) {
            console.log('Ensemble Demand:', result.ensembleDemand);

            // Verify historical storage
            const historical = await ForecastData.findOne({ productId: product._id }).sort({ generatedAt: -1 });
            console.log('Stored in ForecastData history:', !!historical);
            console.log('Stockout Risk:', historical?.stockoutRisk);
        } else {
            console.log('Forecast failed or skipped due to low data.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

test();
