import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.connection.collection('products');
    const all = await Product.find({}).toArray();
    const withoutVendor = all.filter(p => !p.vendorId);
    console.log('Products without vendor ID:', withoutVendor.length);
    if (withoutVendor.length > 0) {
      console.log(withoutVendor.map(p => ({ name: p.name, sku: p.sku })));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();