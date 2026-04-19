import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:       { type: String, required: true },
  resource:     { type: String },
  resourceId:   { type: mongoose.Schema.Types.ObjectId },
  resourceName: { type: String },
  
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after:  { type: mongoose.Schema.Types.Mixed, default: null }
  },
  
  metadata: {
    ipAddress:  { type: String },
    userAgent:  { type: String },
    method:     { type: String },
    endpoint:   { type: String }
  },

  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO'
  },

  timestamp: { type: Date, default: Date.now }
});

// Indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to automatically delete old audit logs
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
