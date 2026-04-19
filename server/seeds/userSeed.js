import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@smartshelfx.com',
        password: 'password123',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true
    },
    {
        name: 'Manager User',
        email: 'manager@smartshelfx.com',
        password: 'password123',
        role: 'MANAGER',
        isEmailVerified: true,
        isActive: true
    },
    {
        name: 'Vendor User',
        email: 'vendor@smartshelfx.com',
        password: 'password123',
        role: 'VENDOR',
        isEmailVerified: true,
        isActive: true
    }
];

const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing users
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');

        // Insert new users
        // Note: Pre-save hook will hash the passwords
        await User.create(users);

        console.log('✅ Seeded: 3 users (Admin, Manager, Vendor)');
        console.log('📧 Admin: admin@smartshelfx.com / password123');
        console.log('📧 Manager: manager@smartshelfx.com / password123');
        console.log('📧 Vendor: vendor@smartshelfx.com / password123');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding users:', error.message);
        process.exit(1);
    }
};

seedUsers();
