import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

/**
 * MongoDB query injection protection.
 * Strips $ and . from req.body, req.query, req.params.
 */
export const sanitizeMongo = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`[Security] Mongo injection attempt blocked in ${key}`);
    }
});

/**
 * XSS protection — sanitizes user input in body, query, params.
 */
export const sanitizeXSS = xssClean();

/**
 * HTTP Parameter Pollution protection.
 * Allows certain params to be arrays (e.g. filter params).
 */
export const preventHPP = hpp({
    whitelist: [
        'sort', 'fields', 'category', 'status', 'role', 'severity', 'type',
        'tags', 'vendor'
    ]
});

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Stricter auth rate limiter — 10 attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        message: 'Too many login attempts. Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Search rate limiter — 30 requests per minute.
 */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        message: 'Too many search requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export default {
    sanitizeMongo,
    sanitizeXSS,
    preventHPP,
    apiLimiter,
    authLimiter,
    searchLimiter
};
