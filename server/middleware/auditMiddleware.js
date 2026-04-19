import { log } from '../services/auditService.js';

export const createAuditMiddleware = (action, resource, getResourceInfo = () => ({}), severity = 'INFO') => {
    return (req, res, next) => {
        // We use res.on('finish') to ensure we log only after the response is completed
        res.on('finish', () => {
            // Only log if response was successful (2xx status) to avoid logging failed attempts as successful
            // For failed attempts, we could have a different mechanism or log them explicitly in error handlers
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user?.id || req.user?._id;
                if (!userId) return; // Cannot log without a user

                // Extract resource info via the callback provided
                const { resourceId, resourceName, changes } = getResourceInfo(req, res);

                const metadata = {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    method: req.method,
                    endpoint: req.originalUrl
                };

                log(userId, action, resource, resourceId, resourceName, changes, metadata, severity);
            }
        });
        next();
    };
};
