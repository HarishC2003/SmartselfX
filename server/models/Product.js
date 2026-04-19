import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: '' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unit: {
        type: String,
        enum: ['PCS', 'KG', 'LTR', 'BOX', 'CARTON', 'DOZEN', 'MTR'],
        default: 'PCS'
    },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    reorderQuantity: { type: Number, required: true, min: 1 },
    maxStockLevel: { type: Number, required: true, min: 1 },
    isPerishable: { type: Boolean, default: false },
    expiryDate: { type: Date, default: null },
    imageUrl: { type: String, default: null },
    tags: [{ type: String }],
    barcode: { type: String, default: null },
    location: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    stockStatus: {
        type: String,
        enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCKED'],
        default: 'IN_STOCK'
    },
    lastRestockedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    forecast: {
        dailyDemand: { type: Number, default: 0 },
        recommendedReorderPoint: { type: Number, default: 0 },
        safetyStock: { type: Number, default: 0 },
        nextRestockDate: { type: Date, default: null },
        lastCalculatedAt: { type: Date, default: null },
        confidenceLevel: { type: Number, default: 0 },
        confidenceLabel: { type: String, default: '' },
        stockoutRisk: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', ''], default: '' },
        forecastArray: [{
            date: String,
            predictedDemand: Number,
            lower: Number,
            upper: Number
        }],
        warnings: [{ type: String }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals
productSchema.virtual('profitMargin').get(function () {
    if (this.sellingPrice && this.costPrice !== undefined) {
        if (this.sellingPrice === 0) return "0.00";
        return (((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100).toFixed(2);
    }
    return "0.00";
});

productSchema.virtual('isLowStock').get(function () {
    return this.currentStock <= this.reorderLevel;
});

productSchema.virtual('stockValue').get(function () {
    return this.currentStock * this.costPrice;
});

// Pre-save hook to calculate stockStatus
productSchema.pre('save', function () {
    if (this.currentStock === 0) {
        this.stockStatus = 'OUT_OF_STOCK';
    } else if (this.currentStock <= this.reorderLevel) {
        this.stockStatus = 'LOW_STOCK';
    } else if (this.currentStock > this.maxStockLevel) {
        this.stockStatus = 'OVERSTOCKED';
    } else {
        this.stockStatus = 'IN_STOCK';
    }
});

// Indexes
productSchema.index({ categoryId: 1 });
productSchema.index({ vendorId: 1 });
productSchema.index({ stockStatus: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Static methods
productSchema.statics.findLowStockProducts = function () {
    return this.find({ stockStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } });
};

productSchema.statics.findByVendor = function (vendorId) {
    return this.find({ vendorId });
};

productSchema.statics.searchProducts = function (query) {
    return this.find({ $text: { $search: query } });
};

const Product = mongoose.model('Product', productSchema);

export default Product;
