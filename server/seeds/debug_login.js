import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const testLogin = async () => {
    try {
        await connectDB();

        const email = 'admin@smartshelfx.com';
        const password = 'password123';

        console.log(`Checking user: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found in DB');
        console.log('User Active:', user.isActive);
        console.log('User Email Verified:', user.isEmailVerified);
        console.log('Hashed Password in DB:', user.password);

        const isMatch = await user.comparePassword(password);
        console.log('Password Match Result:', isMatch);

        if (isMatch) {
            console.log('🚀 Login logic successful on backend');
        } else {
            console.log('❌ Login logic failed: Password mismatch');
            
            // Manual check
            const salt = await bcrypt.genSalt(12);
            const hashedManual = await bcrypt.hash(password, salt);
            console.log('Manual hash of "password123" with new salt:', hashedManual);
            
            const isMatchManual = await bcrypt.compare(password, user.password);
            console.log('Direct bcrypt.compare result:', isMatchManual);
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error during debug:', error.message);
        process.exit(1);
    }
};

testLogin();
