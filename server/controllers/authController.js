import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendMail.js';
import { log } from '../services/auditService.js';

// @route   POST /api/auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if email exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Generate tokens
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = new User({
            name,
            email,
            password,
            role: role || 'MANAGER',
            isEmailVerified: false,
            emailVerificationToken,
            emailVerificationExpiry,
        });

        await user.save();

        // In development mode, auto-verify the user so no email step is required
        if (process.env.NODE_ENV !== 'production') {
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpiry = undefined;
            await user.save();
            if (process.env.NODE_ENV !== 'production') console.log(`[DEV] Auto-verified email for ${email}`);
        } else {
            // Production: Send verification email (gracefully handle SMTP failures)
            try {
                const verificationLink = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
                await sendVerificationEmail(email, name, verificationLink);
                if (process.env.NODE_ENV !== 'production') console.log(`Verification link sent to ${email}: ${verificationLink}`);
            } catch (emailError) {
                console.error('Email failed to send, but user is registered:', emailError.message);
            }
        }

        res.status(201).json({ message: 'Registration successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @route   GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification', error: error.message });
    }
};

// @route   POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Login attempt: ${email}`);

        const user = await User.findByEmail(email);

        if (!user || !user.isActive) {
            if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Login failed: User not found or inactive (${email})`);
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }

        if (!user.isEmailVerified) {
            if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Login failed: Email not verified (${email})`);
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Login failed: Password mismatch (${email})`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Login success: ${email} (${user.role})`);

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.lastLogin = Date.now();
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        await log(user._id, 'USER_LOGIN', 'User', user._id, user.name, undefined, { 
            ipAddress: req.ip, userAgent: req.get('User-Agent'), method: req.method, endpoint: req.originalUrl 
        }, 'INFO');

        res.status(200).json({
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// @route   POST /api/auth/refresh
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(200).json({ accessToken: null, message: 'No refresh token found' });
        }

        const user = await User.findOne({ refreshToken: token });
        if (!user) {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.status(200).json({ accessToken: null, message: 'Invalid refresh token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');

            if (user._id.toString() !== decoded.id) {
                return res.status(200).json({ accessToken: null, message: 'Token verification failed' });
            }

            const newAccessToken = generateAccessToken(user._id, user.role);
            res.status(200).json({ accessToken: newAccessToken });
        } catch (verifyError) {
            // Token is invalid, expired, or malformed
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.status(200).json({ accessToken: null, message: 'Token verification failed' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error refreshing token', error: error.message });
    }
};

// @route   POST /api/auth/logout
export const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            const user = await User.findOneAndUpdate(
                { refreshToken: token },
                { $unset: { refreshToken: 1 } }
            );
            if (user) {
                await log(user._id, 'USER_LOGOUT', 'User', user._id, user.name, undefined, { 
                    ipAddress: req.ip, userAgent: req.get('User-Agent'), method: req.method, endpoint: req.originalUrl 
                }, 'INFO');
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout', error: error.message });
    }
};

// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);

        if (user) {
            const resetPasswordToken = crypto.randomBytes(32).toString('hex');
            const resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            user.resetPasswordToken = resetPasswordToken;
            user.resetPasswordExpiry = resetPasswordExpiry;
            await user.save();

            const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`;
            await sendPasswordResetEmail(email, user.name, resetLink);
        }

        res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error requesting password reset', error: error.message });
    }
};

// @route   POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = password; // pre-save hook will hash it
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        await log(user._id, 'PASSWORD_CHANGED', 'User', user._id, user.name, undefined, { 
            ipAddress: req.ip, userAgent: req.get('User-Agent'), method: req.method, endpoint: req.originalUrl 
        }, 'INFO');

        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error resetting password', error: error.message });
    }
};
