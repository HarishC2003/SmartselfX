import cron from 'node-cron';
import User from '../models/User.js';
import { analyticsService } from '../services/analyticsService.js';
import { sendMail } from '../utils/sendMail.js';
import { getWeeklyReportEmail } from '../utils/emailTemplates.js';
import dotenv from 'dotenv';
dotenv.config();

export const runWeeklyReport = async (customRecipients = null) => {
    try {
        let emails = [];
        if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
            emails = customRecipients;
        } else {
            const admins = await User.find({ role: 'ADMIN' });
            emails = admins.map(a => a.email);
        }

        if (emails.length === 0) {
            if (process.env.NODE_ENV !== 'production') console.log('No ADMIN recipients found for the weekly report.');
            return 0;
        }

        const summaryData = await analyticsService.getWeeklySummary();
        const htmlContent = getWeeklyReportEmail(summaryData);
        
        const periodStart = new Date(summaryData.period.start).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const periodEnd = new Date(summaryData.period.end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const subject = `📊 SmartShelfX Weekly Report — ${periodStart} to ${periodEnd}`;

        for (const email of emails) {
            await sendMail(email, subject, htmlContent);
        }
        
        if (process.env.NODE_ENV !== 'production') console.log(`✅ Weekly report sent to ${emails.length} recipients.`);
        return emails.length;
    } catch (err) {
        console.error('Weekly report job failed:', err);
        throw err;
    }
};

let weeklyCronJob = null;

const createWeeklyCronJob = (cronExpression, timezone = 'Asia/Kolkata') => {
    if (weeklyCronJob) {
        weeklyCronJob.stop();
    }
    
    weeklyCronJob = cron.schedule(cronExpression, async () => {
        if (process.env.NODE_ENV !== 'production') console.log('📊 Running weekly report job...');
        try {
            await runWeeklyReport();
        } catch (e) {
            console.error('Weekly report job failed:', e);
        }
    }, { timezone });
};

// Initialize default on startup
createWeeklyCronJob(process.env.WEEKLY_REPORT_CRON || '0 8 * * 1', process.env.REPORT_TIMEZONE || 'Asia/Kolkata');

export const restartWeeklyReportCron = (newDay, newTime) => {
    try {
        const [hour, minute] = newTime.split(':');
        const cronExpression = `${minute} ${hour} * * ${newDay}`;
        createWeeklyCronJob(cronExpression);
        if (process.env.NODE_ENV !== 'production') console.log(`Weekly report cron restarted: ${cronExpression}`);
    } catch (e) {
        console.error('Failed to restart weekly report cron:', e);
    }
};
