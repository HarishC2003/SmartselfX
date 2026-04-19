import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import csvParser from 'csv-parser';
import stream from 'stream';
import fs from 'fs';
import path from 'path';

// @desc    Create a product
// @route   POST /api/products
// @access  Public (protected via UI routing usually, but ADMIN/MANAGER here)
export const createProduct = async (req, res) => {
    try {
        const {
            name, sku, description, categoryId, vendorId, unit,
            costPrice, sellingPrice, currentStock, reorderLevel,
            reorderQuantity, maxStockLevel, isPerishable, expiryDate,
            tags, barcode, location, isActive
        } = req.body;

        // Verify SKU Uniqueness
        const skuExists = await Product.findOne({ sku });
        if (skuExists) {
            return res.status(409).json({ message: 'Product with this SKU already exists' });
        }

        // Verify Vendor
        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'VENDOR') {
            return res.status(400).json({ message: 'Invalid vendor ID or user is not a VENDOR' });
        }

        // Verify Category
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const product = await Product.create({
            name, sku, description, categoryId, vendorId, unit,
            costPrice, sellingPrice, currentStock, reorderLevel,
            reorderQuantity, maxStockLevel, isPerishable: isPerishable || false,
            expiryDate, tags, barcode, location, isActive: isActive !== undefined ? isActive : true,
            createdBy: req.user.id
        });

        // Update category count
        await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });

        const populatedProduct = await Product.findById(product._id)
            .populate('vendorId', 'name email')
            .populate('categoryId', 'name color icon');

        res.locals.createdId = product._id;
        res.locals.createdName = product.name;
        res.status(201).json({ product: populatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getAllProducts = async (req, res, next) => {
  try {
    const filter = { isActive: true }

    // VENDOR: only sees products assigned to them
    if (req.user.role === 'VENDOR') {
      filter.vendorId = req.user.id
    }

    // Apply additional query filters from req.query
    if (req.query.category)    filter.categoryId = req.query.category
    if (req.query.stockStatus) filter.stockStatus = req.query.stockStatus
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku:  { $regex: req.query.search, $options: 'i' } }
      ]
    }

    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 10
    const skip  = (page - 1) * limit
    const sortBy    = req.query.sortBy    || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name color icon')
        .populate('vendorId', 'name email')
        .populate('createdBy', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ])

    res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    if (next) next(error)
    else res.status(500).json({ message: 'Error retrieving products', error: error.message })
  }
}

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name color icon')
            .populate('vendorId', 'name email')
            .populate('createdBy', 'name email');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (req.user.role === 'VENDOR' && product.vendorId._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You do not own this product.' });
        }

        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: 'Error finding product', error: error.message });
    }
};

// @desc    Update a product (partial)
// @route   PUT /api/products/:id
// @access  Private (ADMIN, MANAGER)
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if SKU is changing uniquely
        if (req.body.sku && req.body.sku !== product.sku) {
            const skuExists = await Product.findOne({ sku: req.body.sku });
            if (skuExists) {
                return res.status(409).json({ message: 'Another product with this SKU already exists' });
            }
        }

        // Revalidate category if changing
        if (req.body.categoryId && req.body.categoryId !== product.categoryId.toString()) {
            const category = await Category.findById(req.body.categoryId);
            if (!category) return res.status(400).json({ message: 'Invalid category ID' });

            // Manage category product counts
            await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
            await Category.findByIdAndUpdate(req.body.categoryId, { $inc: { productCount: 1 } });
        }

        // Apply new properties (pre-save handles the stockStatus logic)
        Object.keys(req.body).forEach(key => {
            product[key] = req.body[key];
        });

        const updatedProduct = await product.save();

        await updatedProduct.populate('categoryId', 'name color icon');
        await updatedProduct.populate('vendorId', 'name email');

        res.locals.updatedId = updatedProduct._id;
        res.locals.updatedName = updatedProduct.name;
        res.status(200).json({ product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

// @desc    Delete a product (Soft Delete)
// @route   DELETE /api/products/:id
// @access  Private (ADMIN)
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.isActive = false;
        await product.save();

        res.locals.deletedId = product._id;
        res.locals.deletedName = product.name;
        res.status(200).json({ message: 'Product deactivated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deactivating product', error: error.message });
    }
};

// @desc    Get global product statistics
// @route   GET /api/products/stats
// @access  Private (ADMIN, MANAGER)
export const getProductStats = async (req, res) => {
    try {
        const matchStage = { isActive: true };
        const mongoose = (await import('mongoose')).default;
        
        if (req.user.role === 'VENDOR') {
            matchStage.vendorId = new mongoose.Types.ObjectId(req.user.id);
        } else if (req.query.vendor) {
            try { matchStage.vendorId = new mongoose.Types.ObjectId(req.query.vendor); } catch(e) {}
        }

        if (req.query.search) {
            matchStage.$text = { $search: req.query.search };
        }
        if (req.query.category) {
            try { matchStage.categoryId = new mongoose.Types.ObjectId(req.query.category); } catch(e) {}
        }
        if (req.query.stockStatus) {
            matchStage.stockStatus = req.query.stockStatus;
        }
        if (req.query.isActive !== undefined && req.query.isActive !== '') {
            matchStage.isActive = req.query.isActive === 'true' || req.query.isActive === true;
        }
        if (req.query.isPerishable !== undefined && req.query.isPerishable !== '') {
            matchStage.isPerishable = req.query.isPerishable === 'true' || req.query.isPerishable === true;
        }
        if (req.query.minStock || req.query.maxStock) {
            matchStage.currentStock = {};
            if (req.query.minStock) matchStage.currentStock.$gte = Number(req.query.minStock);
            if (req.query.maxStock) matchStage.currentStock.$lte = Number(req.query.maxStock);
        }

        // Run aggregation pipeline
        const basicStats = await Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStockValue: { $sum: { $multiply: ["$currentStock", "$costPrice"] } },
                }
            }
        ]);

        const stockStatusCount = await Product.aggregate([
            { $match: matchStage },
            { $group: { _id: "$stockStatus", count: { $sum: 1 } } }
        ]);

        const byCategory = await Product.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$categoryId",
                    count: { $sum: 1 },
                    stockValue: { $sum: { $multiply: ["$currentStock", "$costPrice"] } }
                }
            },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { _id: 0, categoryName: "$category.name", count: 1, stockValue: 1 } },
            { $sort: { count: -1 } }
        ]);

        const byVendor = await Product.aggregate([
            { $match: matchStage },
            { $group: { _id: "$vendorId", count: { $sum: 1 }, totalStock: { $sum: "$currentStock" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "vendor" } },
            { $unwind: "$vendor" },
            { $project: { _id: 0, vendorName: "$vendor.name", count: 1, totalStock: 1 } },
            { $sort: { totalStock: -1 } }
        ]);

        const topValueProducts = await Product.aggregate([
            { $match: matchStage },
            { $project: { name: 1, sku: 1, stockValue: { $multiply: ["$currentStock", "$costPrice"] } } },
            { $sort: { stockValue: -1 } },
            { $limit: 5 }
        ]);

        // Transform arrays to object for O(1) reads
        const statusMap = stockStatusCount.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { LOW_STOCK: 0, OUT_OF_STOCK: 0, OVERSTOCKED: 0, IN_STOCK: 0 });

        res.status(200).json({
            stats: {
                totalProducts: basicStats[0]?.totalProducts || 0,
                totalStockValue: basicStats[0]?.totalStockValue || 0,
                lowStockCount: statusMap.LOW_STOCK,
                outOfStockCount: statusMap.OUT_OF_STOCK,
                overstockedCount: statusMap.OVERSTOCKED,
                inStockCount: statusMap.IN_STOCK,
                byCategory,
                byVendor,
                topValueProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error gathering product statistics', error: error.message });
    }
};

// @desc    Export Products as CSV
// @route   GET /api/products/export
// @access  Private (ADMIN, MANAGER)
export const exportProductsCSV = async (req, res) => {
    try {
        // Query logic identical to getAllProducts (omitting pagination entirely since we stream all)
        let query = {};
        const { search, category, vendor, stockStatus, isActive, isPerishable, minStock, maxStock } = req.query;

        // VENDOR role check
        if (req.user.role === 'VENDOR') query.vendorId = req.user.id;

        if (search) query.$text = { $search: search };
        if (category) query.categoryId = category;
        if (vendor && req.user.role !== 'VENDOR') query.vendorId = vendor;
        if (stockStatus) query.stockStatus = stockStatus;
        
        if (isActive !== undefined && isActive !== '') {
            query.isActive = isActive === 'true' || isActive === true;
        } else {
            query.isActive = true;
        }

        if (isPerishable !== undefined && isPerishable !== '') {
            query.isPerishable = isPerishable === 'true' || isPerishable === true;
        }

        if (minStock || maxStock) {
            query.currentStock = {};
            if (minStock) query.currentStock.$gte = Number(minStock);
            if (maxStock) query.currentStock.$lte = Number(maxStock);
        }

        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .populate('vendorId', 'email');

        const headers = [
            'SKU', 'Name', 'Category', 'Vendor Email', 'Unit', 'Cost Price', 'Selling Price',
            'Current Stock', 'Stock Status', 'Reorder Level', 'Reorder Qty', 'Max Stock Level',
            'Is Active', 'Is Perishable'
        ];

        let csvString = headers.join(',') + '\n';

        products.forEach(p => {
            const row = [
                p.sku,
                // Escape commas with quotes
                `"${p.name.replace(/"/g, '""')}"`,
                `"${p.categoryId?.name || 'N/A'}"`,
                p.vendorId?.email || 'N/A',
                p.unit,
                p.costPrice,
                p.sellingPrice,
                p.currentStock,
                p.stockStatus,
                p.reorderLevel,
                p.reorderQuantity,
                p.maxStockLevel,
                p.isActive,
                p.isPerishable
            ];
            csvString += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="smartshelfx-products-${new Date().toISOString().split('T')[0]}.csv"`);
        res.status(200).send(csvString);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting CSV', error: error.message });
    }
};

// @desc    Import Products via CSV Upload
// @route   POST /api/products/import
// @access  Private (ADMIN, MANAGER)
export const importProductsCSV = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }

        const results = [];
        const errors = [];

        // Cache object IDs to prevent excessive db traffic per row
        const categoryCache = {};
        const vendorCache = {};

        // Parse from buffer
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let imported = 0;
                let updated = 0;

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        const { name, sku, category, vendor: vendorEmail, costPrice, sellingPrice, currentStock, reorderLevel, reorderQuantity, maxStockLevel } = row;

                        // Validation
                        if (!name || !sku || !category || !vendorEmail || !costPrice || !sellingPrice || !reorderLevel || !reorderQuantity || !maxStockLevel) {
                            errors.push({ row: i + 1, sku, reason: 'Missing required columns in row' });
                            continue;
                        }

                        // Vendor Map
                        let vendorId = vendorCache[vendorEmail.toLowerCase()];
                        if (!vendorId) {
                            const foundVendor = await User.findOne({ email: vendorEmail.toLowerCase(), role: 'VENDOR' });
                            if (!foundVendor) {
                                errors.push({ row: i + 1, sku, reason: `Vendor email ${vendorEmail} NOT found or is not a VENDOR` });
                                continue;
                            }
                            vendorId = foundVendor._id;
                            vendorCache[vendorEmail.toLowerCase()] = vendorId;
                        }

                        // Category Map (create if missing)
                        let categoryId = categoryCache[category];
                        if (!categoryId) {
                            let foundCategory = await Category.findOne({ name: category });
                            if (!foundCategory) {
                                foundCategory = await Category.create({ name: category, createdBy: req.user.id });
                            }
                            categoryId = foundCategory._id;
                            categoryCache[category] = categoryId;
                        }

                        // Save or update mapping
                        const productData = {
                            name,
                            categoryId,
                            vendorId,
                            costPrice: Number(costPrice),
                            sellingPrice: Number(sellingPrice),
                            currentStock: currentStock ? Number(currentStock) : 0,
                            reorderLevel: Number(reorderLevel),
                            reorderQuantity: Number(reorderQuantity),
                            maxStockLevel: Number(maxStockLevel),
                            description: row.description || '',
                            unit: row.unit || 'PCS',
                            isPerishable: row.isPerishable && row.isPerishable.toString().toLowerCase() === 'true',
                            location: row.location || null,
                            barcode: row.barcode || null,
                            tags: row.tags ? row.tags.split(';').map(t => t.trim()) : [],
                        };

                        const existing = await Product.findOne({ sku });
                        if (existing) {
                            Object.keys(productData).forEach(key => existing[key] = productData[key]);
                            await existing.save(); // Utilizing pre-saves to set stockStatus
                            updated++;
                        } else {
                            const newProduct = new Product({ sku, ...productData, createdBy: req.user.id });
                            await newProduct.save();
                            // Update category product count
                            await Category.findByIdAndUpdate(categoryId, { $inc: { productCount: 1 } });
                            imported++;
                        }

                    } catch (err) {
                        errors.push({ row: i + 1, sku: row.sku, reason: err.message });
                    }
                } // End for loop

                res.status(200).json({
                    summary: { imported, updated, failed: errors.length },
                    errors
                });
            });

    } catch (error) {
        res.status(500).json({ message: 'Error processing the file', error: error.message });
    }
};

// @desc    Upload product image locally specific
// @route   POST /api/products/:id/image
// @access  Private (ADMIN, MANAGER)
export const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No valid image provided' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            // Cleanup the file that multer just wrote
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Product not found' });
        }

        // We know multer dumped it as something generic in req.file.path
        // We need to rename it to `{sku}-{timestamp}.{ext}`
        const ext = path.extname(req.file.originalname);
        const newFilename = `${product.sku}-${Date.now()}${ext}`;
        const newPath = path.join(req.file.destination, newFilename);

        fs.renameSync(req.file.path, newPath);
        const imageUrl = `/uploads/products/${newFilename}`;

        // If product already has an image, attempt to delete old file explicitly to save space
        if (product.imageUrl) {
            const oldPath = path.join(process.cwd(), product.imageUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        product.imageUrl = imageUrl;
        await product.save();

        res.status(200).json({ imageUrl });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
};
