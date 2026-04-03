const mongoose = require('mongoose')

const MAINTENANCE_TYPES = ['ตรวจสอบ', 'ทำความสะอาด', 'เปลี่ยนชิ้นส่วน', 'ปรับเทียบ', 'อื่นๆ']
const MAINTENANCE_STATUSES = ['pending', 'done']

const maintenanceSchema = new mongoose.Schema(
  {
    equipment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      required: true,
      index: true,
    },
    equipment_name: { type: String, required: true, trim: true },
    equipment_asset_code: { type: String, trim: true, default: '' },
    department_name: { type: String, required: true, trim: true, index: true },
    maintenance_type: { type: String, enum: MAINTENANCE_TYPES, required: true },
    scheduled_date: { type: Date, required: true, index: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: 'pending', index: true },
    completed_date: { type: Date, default: null },
    completed_note: { type: String, trim: true, default: '' },
    performed_by: { type: String, trim: true, default: '' },
    cost: { type: Number, default: 0, min: 0 },
    created_by: { type: String, required: true, trim: true },
    updated_by: { type: String, trim: true, default: '' },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'maintenance_records',
  }
)

maintenanceSchema.index({ department_name: 1, status: 1, scheduled_date: 1, deleted_at: 1 })
maintenanceSchema.index({ equipment_id: 1, deleted_at: 1 })

module.exports = mongoose.model('MaintenanceRecord', maintenanceSchema)
module.exports.MAINTENANCE_TYPES = MAINTENANCE_TYPES
