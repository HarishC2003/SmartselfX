import { body, validationResult } from 'express-validator';

// Standard error handler for validators
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errStrings = errors.array().map(e => e.msg);
        return res.status(400).json({ error: 'Validation failed', details: errStrings });
    }
    next();
};

// 1. Product Validators
export const validateCreateProduct = [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('costPrice').isFloat({ min: 0.01 }).withMessage('Cost price must be a positive number'),
    body('sellingPrice').isFloat({ min: 0.01 }).withMessage('Selling price must be a positive number'),
    body('currentStock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
    validate
];

// 2. Transaction (Stock In/Out) Validators
export const validateTransaction = [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('productId').isMongoId().withMessage('Invalid Product ID'),
    validate
];

// 3. Purchase Order Validators
export const validateCreatePO = [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('productId').isMongoId().withMessage('Invalid Product ID'),
    validate
];

// 4. System Settings Validators
export const validateUpdateSettings = [
    body('settings').isObject().withMessage('Settings must be an object'),
    // Optional deep checks since it's dynamic
    validate
];
