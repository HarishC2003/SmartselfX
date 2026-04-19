import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366F1' },
    icon: { type: String, default: '📦' },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Pre-save hook to auto-generate slug from name
categorySchema.pre('save', function () {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
});

// Static method to find active categories
categorySchema.statics.findActiveCategories = function () {
    return this.find({ isActive: true });
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
