import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY', 'RESTOCK_NEEDED', 'OVERSTOCK'],
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        required: true
    },
    currentStock: {
        type: Number
    },
    reorderLevel: {
        type: Number
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDismissed: {
        type: Boolean,
        default: false
    },
    targetRoles: [{
        type: String,
        enum: ['ADMIN', 'MANAGER', 'VENDOR']
    }],
    resolvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
alertSchema.index({ productId: 1 });
alertSchema.index({ isRead: 1, isDismissed: 1 });
alertSchema.index({ type: 1 });
alertSchema.index({ createdAt: -1 });

// Static methods
alertSchema.statics.getUnreadCount = function (roles) {
    return this.countDocuments({
        targetRoles: { $in: roles },
        isRead: false,
        isDismissed: false
    });
};

alertSchema.statics.getActiveAlerts = function (roles, page = 1, limit = 20) {
    const startIndex = (page - 1) * limit;

    return this.find({
        targetRoles: { $in: roles },
        isDismissed: false
    })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit)
        .populate('productId', 'name sku currentStock reorderLevel');
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
