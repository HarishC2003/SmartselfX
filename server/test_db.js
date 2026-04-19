import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await mongoose.connection.db.collection('users').find({ role: 'VENDOR' }).project({ name: 1, email: 1 }).toArray();
    for (const u of users) {
        console.log('VENDOR: ' + u._id.toString() + ' | ' + u.name + ' | ' + u.email);
    }
    
    console.log('---');
    
    const pos = await mongoose.connection.db.collection('purchaseorders').find({}).project({ poNumber: 1, vendorId: 1, status: 1 }).toArray();
    for (const po of pos) {
        console.log('PO: ' + po.poNumber + ' | vendor=' + po.vendorId.toString() + ' | ' + po.status);
    }
    
    await mongoose.disconnect();
};
run();
