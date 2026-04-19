import AuditLog from '../models/AuditLog.js';

export const log = async (userId, action, resource, resourceId, resourceName, changes = {}, metadata = {}, severity = 'INFO') => {
    try {
        const audit = new AuditLog({
            userId,
            action,
            resource,
            resourceId,
            resourceName,
            changes,
            metadata,
            severity
        });
        await audit.save();
        if (process.env.NODE_ENV !== 'production') console.log(`[AUDIT] ${action} by ${userId} on ${resource}:${resourceId}`);
    } catch (error) {
        // Never throw — if logging fails, catch silently (don't break main flow)
        console.error(`[AUDIT ERROR] Failed to log action: ${action}`, error.message);
    }
};

export const getAuditLogs = async ({ userId, action, resource, severity, startDate, endDate, page = 1, limit = 20 }) => {
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit));

    return {
        logs,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

export const getUserActivity = async (userId, limit = 20) => {
    const logs = await AuditLog.find({ userId })
        .populate('userId', 'name email role')
        .sort({ timestamp: -1 })
        .limit(Number(limit));
    return logs;
};
