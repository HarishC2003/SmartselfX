import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.connection.collection('users');
    const res = await User.updateMany({}, { $set: { isEmailVerified: true, isActive: true } });
    console.log('Verified and Activated', res.modifiedCount, 'users');
    process.exit();
  } catch (err) {
    console.error(err);
  }
}
run();
