import Category from '../models/Category.js';
import Product from '../models/Product.js';

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (ADMIN, MANAGER)
export const createCategory = async (req, res) => {
    try {
        const { name, description, color, icon, isActive } = req.body;

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            description,
            color,
            icon,
            isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private (ALL authenticated)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('createdBy', 'name email').lean();

        // Build a real-time count of products per category from the Product collection
        const productCounts = await Product.aggregate([
            { $group: { _id: '$categoryId', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        productCounts.forEach(({ _id, count }) => {
            if (_id) countMap[_id.toString()] = count;
        });

        // Attach the live count (overrides the stale stored value)
        const result = categories.map(cat => ({
            ...cat,
            productCount: countMap[cat._id.toString()] || 0
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (ADMIN, MANAGER)
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const { name, description, color, icon, isActive } = req.body;

        if (name && name !== category.name) {
            const nameExists = await Category.findOne({ name });
            if (nameExists) {
                return res.status(400).json({ message: 'Another category with this name already exists' });
            }
            category.name = name;
        }

        if (description !== undefined) category.description = description;
        if (color !== undefined) category.color = color;
        if (icon !== undefined) category.icon = icon;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (ADMIN only)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const productsCount = await Product.countDocuments({ categoryId: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({
                message: `Cannot delete category. There are ${productsCount} products associated with it.`
            });
        }

        await Category.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};
