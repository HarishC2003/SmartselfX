import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent for dotenv path extraction
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Clearing existing product demo data...');
        await Category.deleteMany({});
        await Product.deleteMany({});
        // Cleanup the specific demo vendors so we can rebuild them correctly
        await User.deleteMany({ email: { $in: ['vendor1@smartshelfx.com', 'vendor2@smartshelfx.com'] } });

        console.log('Seeding Categories...');
        const categoriesData = [
            { name: 'Electronics', slug: 'electronics', icon: '⚡', color: '#6366F1', description: 'Gadgets and devices' },
            { name: 'Food & Beverages', slug: 'food-beverages', icon: '🍎', color: '#22C55E', description: 'Consumable goods' },
            { name: 'Pharmaceuticals', slug: 'pharmaceuticals', icon: '💊', color: '#EF4444', description: 'Medical supplies' },
            { name: 'Office Supplies', slug: 'office-supplies', icon: '📎', color: '#F59E0B', description: 'Workplace materials' },
            { name: 'Cleaning Products', slug: 'cleaning-products', icon: '🧹', color: '#22D3EE', description: 'Sanitation items' }
        ];

        const insertedCategories = await Category.insertMany(categoriesData);

        // Map category IDs explicitly allowing fast reference allocations below
        const catMap = insertedCategories.reduce((acc, cat) => {
            acc[cat.name] = cat._id;
            return acc;
        }, {});

        console.log('Seeding Vendors...');
        const vendorsData = [
            { name: 'Acme Supplies', email: 'vendor1@smartshelfx.com', password: 'Vendor@12345', role: 'VENDOR' },
            { name: 'Global Traders', email: 'vendor2@smartshelfx.com', password: 'Vendor@12345', role: 'VENDOR' }
        ];

        // Save using model instance to properly trigger bcrypt hashing hook required for auth logins
        const acmeVendor = new User(vendorsData[0]);
        await acmeVendor.save();

        const globalVendor = new User(vendorsData[1]);
        await globalVendor.save();

        console.log('Seeding Products...');
        const productsData = [
            // --- IN_STOCK (5) --- (current > reorderLevel && current <= maxStockLevel)
            {
                name: 'Wireless Headset', sku: 'ELEC-ACM-0001', categoryId: catMap['Electronics'], vendorId: acmeVendor._id,
                costPrice: 45.00, sellingPrice: 89.99, currentStock: 150, reorderLevel: 50, reorderQuantity: 100, maxStockLevel: 300, unit: 'PCS'
            },
            {
                name: 'Mechanical Keyboard', sku: 'ELEC-GLO-0002', categoryId: catMap['Electronics'], vendorId: globalVendor._id,
                costPrice: 60.00, sellingPrice: 120.00, currentStock: 80, reorderLevel: 20, reorderQuantity: 50, maxStockLevel: 200, unit: 'PCS'
            },
            {
                name: 'Hand Sanitizer 500ml', sku: 'CLN-ACM-0003', categoryId: catMap['Cleaning Products'], vendorId: acmeVendor._id,
                costPrice: 2.50, sellingPrice: 5.99, currentStock: 400, reorderLevel: 100, reorderQuantity: 200, maxStockLevel: 800, unit: 'PCS'
            },
            {
                name: 'Printer Paper A4', sku: 'OFF-GLO-0004', categoryId: catMap['Office Supplies'], vendorId: globalVendor._id,
                costPrice: 15.00, sellingPrice: 25.00, currentStock: 120, reorderLevel: 50, reorderQuantity: 100, maxStockLevel: 300, unit: 'BOX'
            },
            {
                name: 'Generic Aspirin', sku: 'PHA-ACM-0005', categoryId: catMap['Pharmaceuticals'], vendorId: acmeVendor._id,
                costPrice: 4.00, sellingPrice: 9.50, currentStock: 250, reorderLevel: 100, reorderQuantity: 200, maxStockLevel: 500, unit: 'BOX'
            },

            // --- LOW_STOCK (5) --- (current <= reorderLevel && current > 0)
            {
                name: 'Smart Watch Series 5', sku: 'ELEC-GLO-0006', categoryId: catMap['Electronics'], vendorId: globalVendor._id,
                costPrice: 120.00, sellingPrice: 249.99, currentStock: 15, reorderLevel: 20, reorderQuantity: 30, maxStockLevel: 100, unit: 'PCS'
            },
            {
                name: 'Disinfecting Wipes', sku: 'CLN-GLO-0007', categoryId: catMap['Cleaning Products'], vendorId: globalVendor._id,
                costPrice: 3.50, sellingPrice: 7.99, currentStock: 40, reorderLevel: 50, reorderQuantity: 100, maxStockLevel: 300, unit: 'PCS'
            },
            {
                name: 'Highlighters Pack', sku: 'OFF-ACM-0008', categoryId: catMap['Office Supplies'], vendorId: acmeVendor._id,
                costPrice: 2.00, sellingPrice: 4.50, currentStock: 10, reorderLevel: 30, reorderQuantity: 50, maxStockLevel: 150, unit: 'PCS'
            },
            {
                name: 'Vitamin C 1000mg', sku: 'PHA-GLO-0009', categoryId: catMap['Pharmaceuticals'], vendorId: globalVendor._id,
                costPrice: 8.00, sellingPrice: 18.00, currentStock: 25, reorderLevel: 40, reorderQuantity: 60, maxStockLevel: 200, unit: 'PCS'
            },
            {
                name: 'Bottled Water 1L', sku: 'FOD-ACM-0010', categoryId: catMap['Food & Beverages'], vendorId: acmeVendor._id,
                costPrice: 0.50, sellingPrice: 1.50, currentStock: 50, reorderLevel: 100, reorderQuantity: 300, maxStockLevel: 1000, unit: 'PCS'
            },

            // --- OUT_OF_STOCK (3) --- (current = 0)
            {
                name: '1080p Web Camera', sku: 'ELEC-ACM-0011', categoryId: catMap['Electronics'], vendorId: acmeVendor._id,
                costPrice: 25.00, sellingPrice: 59.99, currentStock: 0, reorderLevel: 30, reorderQuantity: 50, maxStockLevel: 150, unit: 'PCS'
            },
            {
                name: 'Cough Syrup 200ml', sku: 'PHA-ACM-0012', categoryId: catMap['Pharmaceuticals'], vendorId: acmeVendor._id,
                costPrice: 6.00, sellingPrice: 14.99, currentStock: 0, reorderLevel: 40, reorderQuantity: 80, maxStockLevel: 250, unit: 'PCS'
            },
            {
                name: 'Staplers Heavy Duty', sku: 'OFF-GLO-0013', categoryId: catMap['Office Supplies'], vendorId: globalVendor._id,
                costPrice: 12.00, sellingPrice: 22.50, currentStock: 0, reorderLevel: 15, reorderQuantity: 30, maxStockLevel: 100, unit: 'PCS'
            },

            // --- OVERSTOCKED (4) --- (current > maxStockLevel)
            {
                name: 'Glass Cleaner Spray', sku: 'CLN-ACM-0014', categoryId: catMap['Cleaning Products'], vendorId: acmeVendor._id,
                costPrice: 3.00, sellingPrice: 6.50, currentStock: 550, reorderLevel: 100, reorderQuantity: 200, maxStockLevel: 500, unit: 'PCS'
            },
            {
                name: 'Spiral Notebooks', sku: 'OFF-ACM-0015', categoryId: catMap['Office Supplies'], vendorId: acmeVendor._id,
                costPrice: 1.50, sellingPrice: 3.99, currentStock: 1200, reorderLevel: 200, reorderQuantity: 400, maxStockLevel: 1000, unit: 'PCS'
            },
            {
                name: '2m Extension Cord', sku: 'ELEC-GLO-0016', categoryId: catMap['Electronics'], vendorId: globalVendor._id,
                costPrice: 5.00, sellingPrice: 12.00, currentStock: 400, reorderLevel: 50, reorderQuantity: 100, maxStockLevel: 300, unit: 'PCS'
            },
            {
                name: 'Paper Clips Box', sku: 'OFF-GLO-0017', categoryId: catMap['Office Supplies'], vendorId: globalVendor._id,
                costPrice: 0.80, sellingPrice: 1.99, currentStock: 2500, reorderLevel: 300, reorderQuantity: 500, maxStockLevel: 2000, unit: 'BOX'
            },

            // --- PERISHABLE (3) --- 
            {
                name: 'Fresh Whole Milk 1L', sku: 'FOD-ACM-0018', categoryId: catMap['Food & Beverages'], vendorId: acmeVendor._id,
                costPrice: 1.20, sellingPrice: 2.50, currentStock: 80, reorderLevel: 40, reorderQuantity: 100, maxStockLevel: 200, unit: 'LTR',
                isPerishable: true, expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // expires in 5 days (red zone)
            },
            {
                name: 'Organic Honeycrisp Apples', sku: 'FOD-GLO-0019', categoryId: catMap['Food & Beverages'], vendorId: globalVendor._id,
                costPrice: 2.50, sellingPrice: 4.99, currentStock: 30, reorderLevel: 50, reorderQuantity: 100, maxStockLevel: 300, unit: 'KG', // LOW_STOCK metric overlaps here
                isPerishable: true, expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // expires in 15 days (amber zone)
            },
            {
                name: 'Premium Coffee Beans', sku: 'FOD-ACM-0020', categoryId: catMap['Food & Beverages'], vendorId: acmeVendor._id,
                costPrice: 8.00, sellingPrice: 18.99, currentStock: 250, reorderLevel: 40, reorderQuantity: 80, maxStockLevel: 200, unit: 'KG', // OVERSTOCKED metric overlaps here
                isPerishable: true, expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // expires in 90 days (green zone)
            }
        ];

        // Save each independently to trip Schema pre-save functions calculating correct DB visual status strings ('IN_STOCK', 'LOW_STOCK', etc)
        for (const product of productsData) {
            const newProduct = new Product(product);
            await newProduct.save();
        }

        console.log('\n✅ Seeded: 5 categories, 2 vendors, 20 products\n');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
