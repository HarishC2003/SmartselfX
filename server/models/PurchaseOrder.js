import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        unique: true
        // format generated in pre-save hook
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
        type: Number,
        required: true,
        min: [0, 'Unit price cannot be negative']
    },
    totalAmount: {
        type: Number
        // auto-calculated in pre-save hook
    },

    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISPATCHED', 'RECEIVED', 'CANCELLED'],
        default: 'DRAFT'
    },

    suggestedByAI: {
        type: Boolean,
        default: false
    },
    forecastDataId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForecastData',
        default: null
    },

    vendorNote: { type: String, default: '' },
    internalNote: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },

    expectedDeliveryDate: { type: Date, default: null },
    actualDeliveryDate: { type: Date, default: null },
    stockTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockTransaction',
        default: null
    },

    sentToVendorAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    dispatchedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    emailSentToVendor: { type: Boolean, default: false },
    emailSentToManager: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// PRE-SAVE HOOKS
purchaseOrderSchema.pre('save', async function () {
    const po = this;

    // 1. Auto-generate poNumber if new
    if (po.isNew) {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        // Find highest sequence from this month
        const latestPO = await mongoose.model('PurchaseOrder').findOne({
            poNumber: { $regex: `^PO-${yearMonth}-` }
        }).sort({ poNumber: -1 });

        let sequence = 1;
        if (latestPO && latestPO.poNumber) {
            const parts = latestPO.poNumber.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2], 10) + 1;
            }
        }

        po.poNumber = `PO-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
    }

    // 2. Auto-calculate totalAmount
    if (po.isModified('quantity') || po.isModified('unitPrice')) {
        po.totalAmount = po.quantity * po.unitPrice;
    }

    // 3. Update updatedAt
    po.updatedAt = new Date();

    // Timestamp handlers (automatically set timestamp if status changes)
    if (po.isModified('status')) {
        const now = new Date();
        if (po.status === 'PENDING' && !po.sentToVendorAt) po.sentToVendorAt = now;
        if (po.status === 'APPROVED' && !po.approvedAt) po.approvedAt = now;
        if (po.status === 'REJECTED' && !po.rejectedAt) po.rejectedAt = now;
        if (po.status === 'DISPATCHED' && !po.dispatchedAt) po.dispatchedAt = now;
        if (po.status === 'RECEIVED' && !po.receivedAt) po.receivedAt = now;
        if (po.status === 'CANCELLED' && !po.cancelledAt) po.cancelledAt = now;
    }
});

// INDEXES
purchaseOrderSchema.index({ productId: 1, status: 1 });
purchaseOrderSchema.index({ vendorId: 1, status: 1 });
purchaseOrderSchema.index({ createdAt: -1, status: 1 });
purchaseOrderSchema.index({ suggestedByAI: 1 });

// STATIC METHODS
purchaseOrderSchema.statics.hasActivePO = async function (productId) {
    const activePO = await this.findOne({
        productId,
        status: { $in: ['DRAFT', 'PENDING', 'APPROVED', 'DISPATCHED'] }
    });
    return !!activePO;
};

purchaseOrderSchema.statics.getPOsByVendor = async function (vendorId, status) {
    const query = { vendorId };
    if (status) query.status = status;
    return this.find(query).sort({ createdAt: -1 });
};

purchaseOrderSchema.statics.getMonthlyStats = async function (year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' }
            }
        }
    ]);
};

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
