import User from '../models/User.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendMail.js';
import { log } from '../services/auditService.js';

// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        if (req.query.role && req.query.role !== 'ALL') {
            query.role = req.query.role;
        }

        if (req.query.status) {
            query.isActive = req.query.status === 'Active';
        }

        const users = await User.find(query)
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['ADMIN', 'MANAGER', 'VENDOR'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent removing your own admin status (safety check)
        if (user._id.toString() === req.user.id && role !== 'ADMIN') {
            return res.status(400).json({ message: 'Cannot demote yourself' });
        }

        user.role = role;
        await user.save();

        await log(req.user.id, 'ROLE_CHANGED', 'User', user._id, user.name, { after: { role } }, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'WARNING');

        res.status(200).json({ message: 'User role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user role', error: error.message });
    }
};

// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot deactivate yourself' });
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error: error.message });
    }
};

// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);

        await log(req.user.id, 'USER_DELETED', 'User', user._id, user.name, undefined, { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') }, 'CRITICAL');

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// @route   POST /api/users/invite
// @access  Private/Admin
export const inviteUser = async (req, res) => {
    try {
        const { email, role } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Generate a temporary random password
        const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!';

        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const user = new User({
            name: 'Invited User',
            email,
            password: tempPassword,
            role: role || 'MANAGER',
            isEmailVerified: false,
            emailVerificationToken,
            emailVerificationExpiry,
        });

        await user.save();

        const verificationLink = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
        await sendVerificationEmail(email, 'Invited User', verificationLink);

        res.status(201).json({ message: 'Invitation sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error inviting user', error: error.message });
    }
};
