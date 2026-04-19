import * as auditService from '../services/auditService.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
    try {
        const { userId, action, resource, severity, startDate, endDate, page, limit } = req.query;
        const result = await auditService.getAuditLogs({
            userId, action, resource, severity, startDate, endDate, page, limit
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
};

export const getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;
        
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const logs = await auditService.getUserActivity(userId, limit);
        res.status(200).json({ logs, user });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user activity', error: error.message });
    }
};

export const getAuditStats = async (req, res) => {
    try {
        const totalLogs = await AuditLog.countDocuments();
        
        const byAction = await AuditLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } }
        ]);
        
        const bySeverity = await AuditLog.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
        
        const mostActiveUsers = await AuditLog.aggregate([
            { $group: { _id: '$userId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', count: 1 } }
        ]);

        const criticalEvents = await AuditLog.find({ severity: 'CRITICAL' })
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({
            totalLogs,
            byAction: byAction.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            bySeverity: bySeverity.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            mostActiveUsers,
            criticalEvents
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit stats', error: error.message });
    }
};
