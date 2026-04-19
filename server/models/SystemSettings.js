import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    _id: { type: String, default: 'system_settings' }, // Fixed ID

    company: {
        name: { type: String, default: 'SmartShelfX' },
        logo: { type: String, default: null },
        currency: { type: String, default: 'INR' },
        currencySymbol: { type: String, default: '₹' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        language: { type: String, default: 'en' }
    },

    inventory: {
        defaultLeadTimeDays: { type: Number, default: 3 },
        defaultReorderBuffer: { type: Number, default: 1.2 }, // multiply reorder qty
        autoRestockEnabled: { type: Boolean, default: false },
        autoRestockThreshold: { type: String, enum: ['LOW_STOCK', 'OUT_OF_STOCK'], default: 'LOW_STOCK' },
        lowStockNotifyEnabled: { type: Boolean, default: true },
        expiryAlertDays: { type: Number, default: 30 }, // alert X days before expiry
        maxImportRowsPerBatch: { type: Number, default: 500 }
    },

    notifications: {
        emailEnabled: { type: Boolean, default: true },
        weeklyReportEnabled: { type: Boolean, default: true },
        weeklyReportDay: { type: Number, default: 1 }, // 1=Monday
        weeklyReportTime: { type: String, default: '08:00' },
        alertEmailEnabled: { type: Boolean, default: true },
        alertEmailThreshold: { type: String, enum: ['ALL', 'HIGH_ONLY', 'CRITICAL_ONLY'], default: 'ALL' }
    },

    security: {
        sessionTimeoutMinutes: { type: Number, default: 60 },
        maxLoginAttempts: { type: Number, default: 5 },
        lockoutDurationMinutes: { type: Number, default: 15 },
        requireEmailVerification: { type: Boolean, default: true },
        auditLogRetentionDays: { type: Number, default: 90 },
        allowVendorSelfRegister: { type: Boolean, default: false }
    },

    forecast: {
        defaultForecastDays: { type: Number, default: 7 },
        defaultLeadTimeDays: { type: Number, default: 3 },
        minDataPointsRequired: { type: Number, default: 5 },
        serviceLevelPercent: { type: Number, default: 95 }, // Z-score setting
        autoForecastEnabled: { type: Boolean, default: true }
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
});

// Static methods
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findById('system_settings');
    if (!settings) {
        settings = new this({ _id: 'system_settings' });
        await settings.save();
    }
    return settings;
};

systemSettingsSchema.statics.updateSettings = async function (updates, userId) {
    const settings = await this.getSettings();
    
    // Deep merge updates
    const mergeDeep = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target && source[key] !== null) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    Object.assign(source[key], mergeDeep(target[key], source[key]));
                }
            }
        }
        Object.assign(target || {}, source);
        return target;
    };
    
    mergeDeep(settings, updates);
    
    settings.updatedBy = userId;
    settings.updatedAt = Date.now();
    await settings.save();
    return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
