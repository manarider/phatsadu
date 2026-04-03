const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'import'],
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ['auth', 'equipment', 'material', 'transaction', 'repair', 'chat', 'settings', 'system', 'maintenance', 'import', 'sale'],
      required: true,
      index: true,
    },
    target_collection: { type: String, required: true, trim: true },
    target_id: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    before_data: { type: mongoose.Schema.Types.Mixed, default: null },
    after_data: { type: mongoose.Schema.Types.Mixed, default: null },
    actor_user_id: { type: String, required: true, trim: true },
    actor_username: { type: String, trim: true, default: '' },
    actor_role: { type: String, trim: true, default: '' },
    department_name: { type: String, trim: true, default: '', index: true },
    ip_address: { type: String, trim: true, default: '' },
    user_agent: { type: String, trim: true, default: '' },
    created_at: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'audit_logs',
  }
)

auditLogSchema.index({ module: 1, action: 1, created_at: -1 })
auditLogSchema.index({ actor_user_id: 1, created_at: -1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
