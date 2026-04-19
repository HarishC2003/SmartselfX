import mongoose from 'mongoose';

// MongoDB sessions require a replica set. For local dev, start MongoDB with:
// mongod --replSet rs0
// Then in mongo shell: rs.initiate()
// Alternative mapping bypassing transactions: set USE_MONGO_TRANSACTIONS=false in .env.

const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartshelfx';
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const conn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            break;
        } catch (error) {
            retries += 1;
            console.error(`Error connecting to MongoDB (Attempt ${retries}/${maxRetries}): ${error.message}`);
            if (retries >= maxRetries) {
                console.error('Max retries reached. Exiting processes...');
                process.exit(1);
            }
            // wait 3 seconds before retrying
            await new Promise(res => setTimeout(res, 3000));
        }
    }
};

export default connectDB;
