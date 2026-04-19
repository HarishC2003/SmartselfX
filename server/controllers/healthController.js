import mongoose from 'mongoose';
import axios from 'axios';
import os from 'os';
import { transporter } from '../utils/sendMail.js';
import AuditLog from '../models/AuditLog.js';
import SystemSettings from '../models/SystemSettings.js';

/**
 * 1. getSystemHealth — GET /api/health/system (ADMIN only)
 */
export const getSystemHealth = async (req, res) => {
    try {
        const checkResults = await Promise.all([
            // a. MongoDB check
            (async () => {
                try {
                    const start = Date.now();
                    await mongoose.connection.db.admin().ping();
                    const latency = `${Date.now() - start}ms`;
                    const stats = await mongoose.connection.db.stats();
                    const collections = await mongoose.connection.db.listCollections().toArray();
                    
                    return {
                        status: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
                        latency,
                        collections: collections.length,
                        dbSizeMB: (stats.dataSize / (1024 * 1024)).toFixed(2)
                    };
                } catch (e) {
                    return { status: 'DOWN', error: e.message };
                }
            })(),

            // b. Node.js info
            (async () => {
                const uptimeRaw = process.uptime();
                const days = Math.floor(uptimeRaw / (3600 * 24));
                const hours = Math.floor((uptimeRaw % (3600 * 24)) / 3600);
                const minutes = Math.floor((uptimeRaw % 3600) / 60);
                const memory = process.memoryUsage();
                
                return {
                    status: 'RUNNING',
                    uptime: `${days}d ${hours}h ${minutes}m`,
                    memory: {
                        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
                        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2)
                    },
                    nodeVersion: process.version,
                    cpuModel: os.cpus()[0]?.model || 'Unknown',
                    cpuLoad: os.loadavg()[0].toFixed(2)
                };
            })(),

            // c. Forecast service check
            (async () => {
                const baseUrl = process.env.FORECAST_SERVICE_URL || 'http://localhost:8000';
                const start = Date.now();
                try {
                    await axios.get(baseUrl, { timeout: 3000 });
                    return { status: 'RUNNING', latency: `${Date.now() - start}ms`, port: 8000 };
                } catch (e) {
                    return { status: 'DOWN', error: e.message, port: 8000 };
                }
            })(),

            // d. SMTP check
            (async () => {
                try {
                    await transporter.verify();
                    const latestEmailLog = await AuditLog.findOne({ 
                        action: { $regex: /EMAIL|PO_|STOCK_ALERT/i } 
                    }).sort({ timestamp: -1 });

                    return { 
                        status: 'CONNECTED', 
                        lastSentAt: latestEmailLog ? latestEmailLog.timestamp : 'Never' 
                    };
                } catch (e) {
                    return { status: 'ERROR', error: e.message };
                }
            })()
        ]);

        res.status(200).json({
            mongodb: checkResults[0],
            api: checkResults[1],
            forecastService: checkResults[2],
            smtp: checkResults[3],
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ message: 'Health check failed', error: error.message });
    }
};

/**
 * 2. testEmailConnection — POST /api/health/test-email (ADMIN only)
 */
export const testEmailConnection = async (req, res) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"SmartShelfX" <${process.env.SMTP_USER}>`,
            to: req.user.email,
            subject: '✅ SmartShelfX SMTP Test',
            text: 'Email service is working correctly.'
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: `Test email sent to ${req.user.email}` });
    } catch (error) {
        res.status(500).json({ message: 'Email test failed', error: error.message });
    }
};

/**
 * 3. clearOldAuditLogs — DELETE /api/health/audit-logs/clear (ADMIN only)
 */
export const clearOldAuditLogs = async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        const retentionDays = settings?.security?.auditLogRetentionDays || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const result = await AuditLog.deleteMany({ timestamp: { $lt: cutoffDate } });
        res.status(200).json({ message: `Deleted ${result.deletedCount} old audit log entries.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to clear audit logs', error: error.message });
    }
};

/**
 * 4. GET /api/health — PUBLIC (no auth)
 */
export const getBasicHealth = (req, res) => {
    res.status(200).json({ 
        status: "ok", 
        service: "SmartShelfX API", 
        version: "1.0.0" 
    });
};
