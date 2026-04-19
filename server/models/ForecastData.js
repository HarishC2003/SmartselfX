import mongoose from 'mongoose';

const forecastDataSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    avgDailyDemand: {
        type: Number
    },
    wmaDemand: {
        type: Number
    },
    sesDemand: {
        type: Number
    },
    ensembleDemand: {
        type: Number
    },
    safetyStock: {
        type: Number
    },
    reorderPoint: {
        type: Number
    },
    suggestedOrderQty: {
        type: Number
    },
    daysUntilStockout: {
        type: Number
    },
    stockoutRisk: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    forecast: [{
        date: String,
        predictedDemand: Number,
        lower: Number,
        upper: Number
    }],
    dataPointsUsed: {
        type: Number
    },
    confidenceScore: {
        type: Number
    },
    confidenceLabel: {
        type: String
    },
    method: {
        type: String
    },
    warnings: [{
        type: String
    }],
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast lookup of the latest forecast
forecastDataSchema.index({ productId: 1, generatedAt: -1 });

const ForecastData = mongoose.model('ForecastData', forecastDataSchema);

export default ForecastData;
