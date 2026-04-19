import mongoose from 'mongoose';

const vendorStockDeclarationSchema = new mongoose.Schema({
    vendorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    productName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    sku: { 
        type: String, 
        required: true, 
        trim: true, 
        uppercase: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    unit: {
        type: String,
        enum: ['PCS','KG','LTR','BOX','CARTON','DOZEN','MTR'],
        default: 'PCS'
    },
    availableQty: { 
        type: Number, 
        required: true, 
        min: 0, 
        default: 0 
    },
    unitPrice: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

vendorStockDeclarationSchema.index({ vendorId: 1 });
vendorStockDeclarationSchema.index({ sku: 1, vendorId: 1 }, { unique: true });
vendorStockDeclarationSchema.index({ productName: 'text', description: 'text' });
vendorStockDeclarationSchema.index({ productName: 1 });

// Schema static methods
vendorStockDeclarationSchema.statics.searchByProductName = async function(query) {
    if (!query || query.length < 2) return [];
    
    // First try a text search, fallback to regex if needed
    const regexQuery = new RegExp(query, 'i');
    
    return this.find({ 
        isActive: true,
        $or: [
            { $text: { $search: query } },
            { productName: { $regex: regexQuery } }
        ]
    })
    .populate('vendorId', 'name email phone company')
    .sort({ score: { $meta: 'textScore' } }) // Optional if using text search
    .select('_id productName sku description unit availableQty unitPrice updatedAt vendorId');
};

vendorStockDeclarationSchema.statics.getByVendor = async function(vendorId) {
    return this.find({ vendorId, isActive: true }).sort({ updatedAt: -1 });
};

vendorStockDeclarationSchema.statics.decreaseQty = async function(vendorId, sku, quantity) {
    const declaration = await this.findOne({ vendorId, sku, isActive: true });
    if (!declaration) return null;

    declaration.availableQty = Math.max(0, declaration.availableQty - quantity);
    return await declaration.save();
};

const VendorStockDeclaration = mongoose.model('VendorStockDeclaration', vendorStockDeclarationSchema);
export default VendorStockDeclaration;
