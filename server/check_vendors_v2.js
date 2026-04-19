import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.connection.collection('products');
    const User = mongoose.connection.collection('users');
    const allProducts = await Product.find({}).toArray();
    
    let count = 0;
    for (const p of allProducts) {
      if (p.vendorId) {
        const vendor = await User.findOne({ _id: p.vendorId });
        if (!vendor) {
          console.log(`Product "${p.name}" (SKU: ${p.sku}) has invalid vendorId: ${p.vendorId}`);
          count++;
        }
      } else {
        console.log(`Product "${p.name}" has NO vendorId at all.`);
        count++;
      }
    }
    console.log(`Total invalid product-vendor links: ${count}`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
