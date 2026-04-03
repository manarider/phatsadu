const mongoose = require('mongoose')
const { REPAIR_STATUSES } = require('../utils/constants')

const equipmentItemSchema = new mongoose.Schema(
  {
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
    asset_code: { type: String, trim: true, default: '' },
    eqid: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    equipment_type_name: { type: String, trim: true, default: '' },
    department_name: { type: String, trim: true, default: '' },
  },
  { _id: false }
)

const repairRequestSchema = new mongoose.Schema(
  {
    is_bulk: { type: Boolean, default: false },
    equipment_items: { type: [equipmentItemSchema], default: [] },
    equipment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment',
      index: true,
    },
    equipment_eqid: { type: String, trim: true, default: '' },
    equipment_asset_code: { type: String, trim: true, default: '' },
    equipment_name: { type: String, trim: true, default: '' },
    department_name: { type: String, required: true, trim: true, index: true },
    problem_detail: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: REPAIR_STATUSES,
      default: 'pending',
      index: true,
    },
    requested_by: { type: String, required: true, trim: true },
    approved_by: { type: String, trim: true, default: '' },
    repair_result: { type: String, trim: true, default: '' },
    repairer: { type: String, trim: true, default: '' },
    repair_items: {
      type: [
        {
          description: { type: String, trim: true, default: '' },
          quantity: { type: Number, default: 1, min: 0 },
          price: { type: Number, default: 0, min: 0 },
          _id: false,
        },
      ],
      default: [],
    },
    repair_total_price: { type: Number, default: 0, min: 0 },
    repair_attachments: {
      type: [
        {
          filename: { type: String, trim: true, default: '' },
          path: { type: String, trim: true, default: '' },
          mime_type: { type: String, trim: true, default: '' },
          size: { type: Number, default: 0 },
          _id: false,
        },
      ],
      default: [],
    },
    repair_note: { type: String, trim: true, default: '' },
    completed_at: { type: Date, default: null },
    unread_count: { type: Number, default: 0, min: 0 },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'repair_requests',
  }
)

repairRequestSchema.index({ department_name: 1, status: 1, deleted_at: 1 })
repairRequestSchema.index({ createdAt: -1 })

module.exports = mongoose.model('RepairRequest', repairRequestSchema)
