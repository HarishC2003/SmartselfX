import VendorStockDeclaration from '../models/VendorStockDeclaration.js';
import Product from '../models/Product.js';

// @desc    Get products assigned to vendor by admin
// @route   GET /api/declarations/assigned
// @access  VENDOR
export const getAssignedProducts = async (req, res) => {
    try {
        if (req.user.role !== 'VENDOR') return res.status(403).json({ message: 'Access denied' });

        // Find all active products assigned to this vendor
        const assignedProducts = await Product.find({ 
            vendorId: req.user.id, 
            isActive: true 
        }).populate('categoryId', 'name');

        // Find all current declarations by this vendor (including inactive/rejected ones)
        const myDeclarations = await VendorStockDeclaration.find({ 
            vendorId: req.user.id
        });

        const declaredSkus = new Set(myDeclarations.map(d => d.sku.toUpperCase()));

        // Filter out products that are already declared
        const pendingAssignments = assignedProducts.filter(p => !declaredSkus.has(p.sku.toUpperCase()));

        res.status(200).json({ 
            count: pendingAssignments.length,
            products: pendingAssignments 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Add a declaration
// @route   POST /api/declarations
// @access  VENDOR
export const addDeclaration = async (req, res) => {
    try {
        if (req.user.role !== 'VENDOR') return res.status(403).json({ message: 'Access denied' });

        const { productName, sku, description, unit, availableQty, unitPrice } = req.body;
        
        const existing = await VendorStockDeclaration.findOne({ sku: sku.toUpperCase(), vendorId: req.user.id });
        if (existing) {
            if (!existing.isActive) {
                // Reactivate previously rejected or deleted declaration
                existing.productName = productName;
                existing.description = description;
                existing.unit = unit;
                existing.availableQty = Number(availableQty);
                existing.unitPrice = Number(unitPrice);
                existing.isActive = true;
                await existing.save();
                return res.status(201).json({ declaration: existing, message: "Stock declaration added successfully." });
            }
            return res.status(409).json({ message: `You already have a declaration with SKU ${sku}. Edit the existing one instead.` });
        }

        const declaration = await VendorStockDeclaration.create({
            vendorId: req.user.id,
            productName,
            sku,
            description,
            unit,
            availableQty: Number(availableQty),
            unitPrice: Number(unitPrice)
        });

        res.status(201).json({ declaration, message: "Stock declaration added successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my declarations
// @route   GET /api/declarations/mine
// @access  VENDOR
export const getMyDeclarations = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        let query = { vendorId: req.user.id, isActive: true };

        if (search) {
            query.$or = [
                { productName: { $regex: new RegExp(search, 'i') } },
                { sku: { $regex: new RegExp(search, 'i') } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const declarations = await VendorStockDeclaration.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await VendorStockDeclaration.countDocuments(query);
        
        // Calculate total value
        const allMyDeclarations = await VendorStockDeclaration.find(query);
        const totalValue = allMyDeclarations.reduce((sum, item) => sum + (item.availableQty * item.unitPrice), 0);

        res.status(200).json({
            declarations,
            pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) },
            summary: { total, totalValue }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a declaration
// @route   PUT /api/declarations/:id
// @access  VENDOR
export const updateDeclaration = async (req, res) => {
    try {
        const declaration = await VendorStockDeclaration.findById(req.params.id);
        
        if (!declaration) return res.status(404).json({ message: 'Declaration not found' });
        if (declaration.vendorId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        if (req.body.sku && req.body.sku.toUpperCase() !== declaration.sku) {
            const existing = await VendorStockDeclaration.findOne({ sku: req.body.sku.toUpperCase(), vendorId: req.user.id });
            if (existing) {
                return res.status(409).json({ message: `You already have a declaration with SKU ${req.body.sku}.` });
            }
        }

        const { productName, sku, description, unit, availableQty, unitPrice } = req.body;
        if (productName !== undefined) declaration.productName = productName;
        if (sku !== undefined) declaration.sku = sku;
        if (description !== undefined) declaration.description = description;
        if (unit !== undefined) declaration.unit = unit;
        if (availableQty !== undefined) declaration.availableQty = Number(availableQty);
        if (unitPrice !== undefined) declaration.unitPrice = Number(unitPrice);

        await declaration.save();

        res.status(200).json({ declaration, message: "Declaration updated." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update qty only
// @route   PATCH /api/declarations/:id/qty
// @access  VENDOR
export const updateQtyOnly = async (req, res) => {
    try {
        const { availableQty } = req.body;
        const parsedQty = Number(availableQty);
        
        if (availableQty === undefined || isNaN(parsedQty) || parsedQty < 0) {
            return res.status(400).json({ message: 'Valid available quantity is required' });
        }

        const declaration = await VendorStockDeclaration.findById(req.params.id);
        if (!declaration) return res.status(404).json({ message: 'Declaration not found' });
        if (declaration.vendorId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        declaration.availableQty = parsedQty;
        await declaration.save();

        res.status(200).json({ 
            availableQty: declaration.availableQty, 
            updatedAt: declaration.updatedAt,
            message: `Available quantity updated to ${parsedQty} units.` 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a declaration
// @route   DELETE /api/declarations/:id
// @access  VENDOR
export const deleteDeclaration = async (req, res) => {
    try {
        const declaration = await VendorStockDeclaration.findById(req.params.id);
        if (!declaration) return res.status(404).json({ message: 'Declaration not found' });
        if (declaration.vendorId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' });

        declaration.isActive = false;
        await declaration.save();

        res.status(200).json({ message: "Declaration removed." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search vendors by product name
// @route   GET /api/declarations/search
// @access  ADMIN, MANAGER
export const searchVendorsForProduct = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.status(400).json({ message: 'Search query minimum length is 2 characters' });

        const declarations = await VendorStockDeclaration.searchByProductName(q);

        // Group by vendor
        const groupedMap = new Map();
        declarations.forEach(dec => {
            const vendorIdStr = dec.vendorId._id.toString();
            if (!groupedMap.has(vendorIdStr)) {
                groupedMap.set(vendorIdStr, {
                    vendor: dec.vendorId, // populated obj
                    declarations: []
                });
            }
            // Add declaration (but we don't need nested populated vendor inside it anymore)
            const decObj = dec.toObject();
            delete decObj.vendorId;
            groupedMap.get(vendorIdStr).declarations.push(decObj);
        });

        let groupedResults = Array.from(groupedMap.values());
        
        // Sort by vendors with most availableQty overall
        groupedResults.sort((a, b) => {
            const sumA = a.declarations.reduce((sum, d) => sum + d.availableQty, 0);
            const sumB = b.declarations.reduce((sum, d) => sum + d.availableQty, 0);
            return sumB - sumA;
        });

        res.status(200).json({
            query: q,
            vendors: groupedResults,
            totalVendors: groupedResults.length,
            totalDeclarations: declarations.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all declarations
// @route   GET /api/declarations
// @access  ADMIN, MANAGER
export const getAllDeclarations = async (req, res) => {
    try {
        const { search, vendorId, page = 1, limit = 20 } = req.query;
        let query = { isActive: true };

        if (vendorId) query.vendorId = vendorId;

        if (search) {
            query.$or = [
                { productName: { $regex: new RegExp(search, 'i') } },
                { sku: { $regex: new RegExp(search, 'i') } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const declarations = await VendorStockDeclaration.find(query)
            .populate('vendorId', 'name email company')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await VendorStockDeclaration.countDocuments(query);
        
        res.status(200).json({
            declarations,
            pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a product assignment
// @route   POST /api/declarations/reject-assignment
// @access  VENDOR
export const rejectAssignment = async (req, res) => {
    try {
        const { productId, reason } = req.body;
        if (!productId || !reason) return res.status(400).json({ message: 'Product ID and reason are required' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        // Use a dynamic import for Alert to avoid circular dependencies if any, though usually fine here
        const Alert = (await import('../models/Alert.js')).default;
        const { log } = await import('../services/auditService.js');

        // Create alert for admin/manager
        await Alert.create({
            productId,
            type: 'RESTOCK_NEEDED', // Reusing appropriate type
            severity: 'HIGH',
            message: `Assignment Rejected: Vendor ${req.user.name || req.user.email} rejected assignment for ${product.name}. Reason: ${reason}`,
            targetRoles: ['ADMIN', 'MANAGER']
        });

        // Log the rejection
        await log(req.user.id, 'ASSIGNMENT_REJECTED', 'Product', productId, product.sku, undefined, { reason }, 'WARNING');

        // Create an inactive declaration tombstone so it no longer appears in pending assignments
        const existingDecl = await VendorStockDeclaration.findOne({ sku: product.sku.toUpperCase(), vendorId: req.user.id });
        if (!existingDecl) {
            await VendorStockDeclaration.create({
                vendorId: req.user.id,
                productName: product.name,
                sku: product.sku.toUpperCase(),
                description: product.description || 'Rejected assignment',
                unit: product.unit || 'PCS',
                availableQty: 0,
                unitPrice: 0,
                isActive: false
            });
        }

        res.status(200).json({ message: 'Assignment rejected and management notified.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
