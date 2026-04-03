const mongoose = require('mongoose')
const { EQUIPMENT_STATUSES } = require('../utils/constants')

const equipmentImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    mime_type: { type: String, trim: true },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },
  { _id: false }
)

const equipmentSchema = new mongoose.Schema(
  {
    eqid: { type: String, required: true, trim: true, uppercase: true },
    asset_code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    serial_number: { type: String, trim: true, default: '' },
    equipment_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentType',
      required: true,
      index: true,
    },
    equipment_type_name: { type: String, required: true, trim: true, index: true },
    department_name: { type: String, required: true, trim: true, index: true },
    location: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0, min: 0 },
    custodian_name: { type: String, trim: true, default: '' },
    acquired_date: { type: Date, default: null },
    description: { type: String, trim: true, default: '' },
    project: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: EQUIPMENT_STATUSES,
      default: 'ใช้งานได้',
      index: true,
    },
    image: { type: equipmentImageSchema, default: null },
    created_by: { type: String, required: true, trim: true },
    updated_by: { type: String, trim: true, default: '' },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'equipments',
  }
)

// enforce unique eqid and asset_code only for non-deleted documents
equipmentSchema.index(
  { eqid: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
)
equipmentSchema.index(
  { asset_code: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
)

// global search support
equipmentSchema.index({
  eqid: 'text',
  asset_code: 'text',
  name: 'text',
  serial_number: 'text',
  location: 'text',
  custodian_name: 'text',
  equipment_type_name: 'text',
})

equipmentSchema.index({ department_name: 1, status: 1, deleted_at: 1 })

module.exports = mongoose.model('Equipment', equipmentSchema)
