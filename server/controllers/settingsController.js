import SystemSettings from '../models/SystemSettings.js';
import User from '../models/User.js';
import { log } from '../services/auditService.js';
import { restartWeeklyReportCron } from '../jobs/weeklyReportJob.js';

export const getSystemSettings = async (req, res) => {
    try {
        const settingsDoc = await SystemSettings.getSettings();
        const settings = settingsDoc.toObject();

        // Exclude security section for non-ADMIN
        if (req.user.role !== 'ADMIN') {
            delete settings.security;
        }

        res.status(200).json({ settings });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving system settings', error: error.message });
    }
};

export const updateSystemSettings = async (req, res) => {
    try {
        const updates = req.body;
        
        if (updates.company) {
            if (updates.company.currency && updates.company.currency.length !== 3) {
                return res.status(400).json({ message: 'Currency must be 3 characters exactly.' });
            }
            if (updates.company.timezone) {
                try {
                    Intl.DateTimeFormat(undefined, { timeZone: updates.company.timezone });
                } catch (e) {
                    return res.status(400).json({ message: 'Invalid Timezone.' });
                }
            }
        }

        const oldSettings = await SystemSettings.getSettings();
        const settings = await SystemSettings.updateSettings(updates, req.user.id);

        if (updates.notifications) {
            const oldDay = oldSettings.notifications.weeklyReportDay;
            const oldTime = oldSettings.notifications.weeklyReportTime;
            const newDay = settings.notifications.weeklyReportDay;
            const newTime = settings.notifications.weeklyReportTime;
            
            if (oldDay !== newDay || oldTime !== newTime) {
                restartWeeklyReportCron(newDay, newTime);
            }
        }

        await log(
            req.user.id,
            'SETTINGS_UPDATED',
            'SystemSettings',
            undefined,
            'Global Settings',
            { before: oldSettings.toObject(), after: settings.toObject() },
            { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') },
            'WARNING'
        );

        res.status(200).json({ settings, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating system settings', error: error.message });
    }
};

export const getProfileSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving profile settings', error: error.message });
    }
};

export const updateProfileSettings = async (req, res) => {
    try {
        const { name, phone, preferences } = req.body;
        
        if (name && name.length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const before = { name: user.name, phone: user.phone, preferences: user.preferences };
        
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (preferences) {
            if (!user.preferences) user.preferences = {};
            Object.assign(user.preferences, preferences);
        }

        await user.save();
        const savedUser = await User.findById(req.user.id).select('-password');

        await log(
            req.user.id,
            'USER_UPDATED',
            'User',
            user._id,
            user.name,
            { before, after: { name: user.name, phone: user.phone, preferences: user.preferences } },
            { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') },
            'INFO'
        );

        res.status(200).json({ user: savedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        user.refreshToken = undefined;
        await user.save();

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        await log(
            req.user.id,
            'PASSWORD_CHANGED',
            'User',
            user._id,
            user.name,
            undefined,
            { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') },
            'WARNING'
        );

        res.status(200).json({ message: "Password changed. Please log in again." });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

export const uploadCompanyLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image file (jpg/png/webp, max 1MB).' });
        }
        
        const logoUrl = `/uploads/logos/${req.file.filename}`;
        
        const settings = await SystemSettings.getSettings();
        const oldLogo = settings.company?.logo;
        
        if (!settings.company) settings.company = {};
        settings.company.logo = logoUrl;
        
        await SystemSettings.updateSettings({ company: { logo: logoUrl } }, req.user.id);

        await log(
            req.user.id,
            'SETTINGS_UPDATED',
            'SystemSettings',
            undefined,
            'Company Logo',
            { before: { logo: oldLogo }, after: { logo: logoUrl } },
            { method: req.method, endpoint: req.originalUrl, ipAddress: req.ip, userAgent: req.get('User-Agent') },
            'WARNING'
        );

        res.status(200).json({ logoUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading logo', error: error.message });
    }
};
