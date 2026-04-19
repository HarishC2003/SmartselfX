import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VendorStockDeclaration from '../models/VendorStockDeclaration.js';
import User from '../models/User.js';

dotenv.config();

const seedDeclarations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        const vendors = await User.find({ role: 'VENDOR' }).limit(2);
        if (vendors.length < 2) {
            console.log('Need at least 2 vendors to run this script');
            process.exit(1);
        }

        const vendor1 = vendors[0];
        const vendor2 = vendors[1];

        const declarations = [
            // Vendor 1
            { vendorId: vendor1._id, productName: 'Wireless Bluetooth Headphones', sku: 'ACM-WH-001', availableQty: 80, unitPrice: 1200, unit: 'PCS' },
            { vendorId: vendor1._id, productName: 'USB-C Fast Charger 65W', sku: 'ACM-UC-002', availableQty: 150, unitPrice: 420, unit: 'PCS' },
            { vendorId: vendor1._id, productName: 'Mechanical Keyboard RGB', sku: 'ACM-KB-003', availableQty: 40, unitPrice: 1750, unit: 'PCS' },
            { vendorId: vendor1._id, productName: 'Paracetamol 500mg Tablets', sku: 'ACM-PM-004', availableQty: 500, unitPrice: 48, unit: 'BOX' },
            { vendorId: vendor1._id, productName: 'Stapler Heavy Duty 26/6', sku: 'ACM-ST-005', availableQty: 60, unitPrice: 170, unit: 'PCS' },
            { vendorId: vendor1._id, productName: 'Floor Cleaner Liquid 5L', sku: 'ACM-FC-006', availableQty: 0, unitPrice: 88, unit: 'LTR' },
            
            // Vendor 2
            { vendorId: vendor2._id, productName: 'Wireless Headphones Pro', sku: 'GLB-WHP-01', availableQty: 50, unitPrice: 1100, unit: 'PCS' },
            { vendorId: vendor2._id, productName: 'Organic Green Tea 100 Bags', sku: 'GLB-GT-002', availableQty: 200, unitPrice: 165, unit: 'BOX' },
            { vendorId: vendor2._id, productName: 'Whole Wheat Bread 400g', sku: 'GLB-WB-003', availableQty: 80, unitPrice: 32, unit: 'PCS' },
            { vendorId: vendor2._id, productName: 'Vitamin C 1000mg Effervescent', sku: 'GLB-VC-004', availableQty: 300, unitPrice: 105, unit: 'PCS' },
            { vendorId: vendor2._id, productName: 'A4 Printing Paper 500 Sheets', sku: 'GLB-PP-005', availableQty: 400, unitPrice: 210, unit: 'CARTON' },
            { vendorId: vendor2._id, productName: 'Organic Apple Juice 1L', sku: 'GLB-AJ-006', availableQty: 120, unitPrice: 55, unit: 'LTR' }
        ];

        // Clear existing to avoid unique constraint if re-running
        await VendorStockDeclaration.deleteMany({});
        
        await VendorStockDeclaration.insertMany(declarations);

        console.log('✅ Seeded: 12 vendor stock declarations (6 per vendor)');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDeclarations();
