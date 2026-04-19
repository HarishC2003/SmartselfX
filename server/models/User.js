import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8 },
    role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'VENDOR'],
        default: 'MANAGER'
    },
    phone: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpiry: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpiry: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    refreshToken: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook: Hash password and update updatedAt
userSchema.pre('save', async function () {
    this.updatedAt = Date.now();

    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Virtual field for fullProfile
userSchema.virtual('fullProfile').get(function () {
    return `${this.name} (${this.role})`;
});

// Transform JSON output to remove sensitive fields
userSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpiry;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpiry;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

export default User;
