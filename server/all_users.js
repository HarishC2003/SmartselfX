import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    for (const u of users) {
        console.log(`U: ${u._id} | N: ${u.name} | R: ${u.role}`);
    }
    await mongoose.disconnect();
};
run();