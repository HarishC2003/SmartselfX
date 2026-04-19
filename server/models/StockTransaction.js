import mongoose from 'mongoose';

const stockTransactionSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    type: {
        type: String,
        enum: ['IN', 'OUT'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    previousStock: {
        type: Number,
        required: true
    },
    newStock: {
        type: Number,
        required: true
    },
    referenceType: {
        type: String,
        enum: ['PURCHASE_ORDER', 'MANUAL', 'SALES', 'RETURN', 'ADJUSTMENT', 'DAMAGED', 'EXPIRED'],
        default: 'MANUAL'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
stockTransactionSchema.index({ productId: 1, timestamp: -1 });
stockTransactionSchema.index({ handledBy: 1 });
stockTransactionSchema.index({ type: 1 });
stockTransactionSchema.index({ timestamp: -1, type: 1 });

// Static methods
stockTransactionSchema.statics.getProductHistory = function (productId, limit = 20) {
    return this.find({ productId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('handledBy', 'name email');
};

stockTransactionSchema.statics.getDailySummary = async function (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.aggregate([
        {
            $match: {
                timestamp: { $gte: startOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
                _id: "$type",
                totalQuantity: { $sum: "$quantity" },
                transactionCount: { $sum: 1 }
            }
        }
    ]);
};

stockTransactionSchema.statics.getTransactionsByDateRange = function (startDate, endDate) {
    return this.find({
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ timestamp: 1 }).populate('productId', 'name sku').populate('handledBy', 'name email');
};

// Immutability Hooks
stockTransactionSchema.pre('save', function () {
    if (!this.isNew) {
        throw new Error('StockTransactions are immutable and cannot be updated.');
    }
});

stockTransactionSchema.pre('findOneAndUpdate', function () {
    throw new Error('StockTransactions are immutable and cannot be updated.');
});

stockTransactionSchema.pre('updateOne', function () {
    throw new Error('StockTransactions are immutable and cannot be updated.');
});

stockTransactionSchema.pre('deleteMany', function () {
    throw new Error('StockTransactions are immutable and cannot be deleted.');
});

stockTransactionSchema.pre('deleteOne', function () {
    throw new Error('StockTransactions are immutable and cannot be deleted.');
});

stockTransactionSchema.pre('findOneAndDelete', function () {
    throw new Error('StockTransactions are immutable and cannot be deleted.');
});

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
