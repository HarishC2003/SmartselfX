import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const SEED_USERS = [
    {
        name: 'System Admin',
        email: 'admin@smartshelfx.com',
        password: 'Admin@12345',
        role: 'ADMIN',
    },
    {
        name: 'Demo Manager',
        email: 'manager@smartshelfx.com',
        password: 'Manager@12345',
        role: 'MANAGER',
    },
    {
        name: 'Demo Vendor',
        email: 'vendor@smartshelfx.com',
        password: 'Vendor@12345',
        role: 'VENDOR',
    },
];

const seedUsers = async () => {
    try {
        await connectDB();

        for (const userData of SEED_USERS) {
            // Remove existing user with same email to ensure fresh seed
            await User.deleteOne({ email: userData.email });

            const user = new User({
                ...userData,
                isEmailVerified: true,
                isActive: true,
            });

            await user.save();
            console.log(`✓ Seeded [${user.role}]: ${user.email}`);
        }

        console.log('\nAll seed users created successfully!');
        console.log('─────────────────────────────────────────');
        SEED_USERS.forEach(u => {
            console.log(`  ${u.role.padEnd(10)} | ${u.email} | ${u.password}`);
        });
        console.log('─────────────────────────────────────────');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
