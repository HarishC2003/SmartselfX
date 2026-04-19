import { getAuditLogs } from '../services/auditService.js';
import AuditLog from '../models/AuditLog.js';

/**
 * GET /api/audit-logs
 * Paginated, filterable audit log listing (ADMIN only)
 */
export const listAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            action,
            category,
            userId,
            status,
            resourceType,
            search,
            startDate,
            endDate
        } = req.query;

        const result = await getAuditLogs(
            { action, category, userId, status, resourceType, search, startDate, endDate },
            { page: parseInt(page), limit: parseInt(limit) }
        );

        res.json({
            logs: result.docs,
            pagination: {
                total: result.totalDocs,
                page: result.page,
                totalPages: result.totalPages,
                limit: result.limit,
                hasNext: result.hasNextPage,
                hasPrev: result.hasPrevPage
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    }
};

/**
 * GET /api/audit-logs/stats
 * Audit log statistics for dashboard
 */
export const getAuditStats = async (req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);
        const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const [totalLogs, last24hCount, last7dCount, byCategory, byAction, recentFailures] = await Promise.all([
            AuditLog.countDocuments(),
            AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
            AuditLog.countDocuments({ createdAt: { $gte: last7d } }),
            AuditLog.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: last7d } } },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            AuditLog.countDocuments({ status: 'FAILURE', createdAt: { $gte: last24h } })
        ]);

        res.json({
            totalLogs,
            last24hCount,
            last7dCount,
            recentFailures,
            byCategory: byCategory.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
            topActions: byAction
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit stats', error: error.message });
    }
};

/**
 * GET /api/audit-logs/:id
 * Single audit log detail
 */
export const getAuditLogById = async (req, res) => {
    try {
        const log = await AuditLog.findById(req.params.id).populate('userId', 'name email role');
        if (!log) return res.status(404).json({ message: 'Audit log not found' });
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit log', error: error.message });
    }
};
