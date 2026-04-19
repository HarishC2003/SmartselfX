import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.connection.collection('products');
    const res = await Product.updateOne({ isPerishable: true }, { $set: { isActive: false } });
    console.log('Deactivated', res.modifiedCount, 'product');
    process.exit();
  } catch (err) {
    console.error(err);
  }
}
run();
