import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.connection.collection('products');
    const User = mongoose.connection.collection('users');
    
    // Get all vendors
    const vendors = await User.find({ role: 'VENDOR' }).toArray();
    if (vendors.length === 0) {
      console.log('No vendors found in DB. Need to seed vendors first.');
      process.exit();
    }
    
    console.log(`Found ${vendors.length} vendors.`);
    
    const allProducts = await Product.find({}).toArray();
    let updatedCount = 0;
    
    for (let i = 0; i < allProducts.length; i++) {
        const p = allProducts[i];
        const vendorIndex = i % vendors.length;
        const vendor = vendors[vendorIndex];
        
        // Always set the vendor correctly in case it is invalid or old
        const res = await Product.updateOne(
            { _id: p._id },
            { $set: { vendorId: vendor._id } }
        );
        if (res.modifiedCount > 0) updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} products with valid vendor IDs.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
