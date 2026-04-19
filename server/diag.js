import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Dump to string first
    let output = "--- USERS ---\n";
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    for (const u of users) {
        output += `USER: ${u._id} | ${u.name} | ${u.role}\n`;
    }
    
    output += "\n--- POs ---\n";
    const pos = await mongoose.connection.db.collection('purchaseorders').find({}).toArray();
    for (const po of pos) {
        output += `PO: ${po.poNumber} | VNID: ${po.vendorId} | STAT: ${po.status}\n`;
    }
    
    output += "\n--- PRODS ---\n";
    const prods = await mongoose.connection.db.collection('products').find({}).toArray();
    for (const p of prods) {
        output += `PROD: ${p._id} | ${p.name} | VNID: ${p.vendorId}\n`;
    }

    process.stdout.write(output);
    await mongoose.disconnect();
};
run();