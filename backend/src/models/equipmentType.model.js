const mongoose = require('mongoose')

const equipmentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    is_active: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'equipment_types',
  }
)

equipmentTypeSchema.index({ name: 1, deleted_at: 1 })
equipmentTypeSchema.index({ code: 1, deleted_at: 1 })

module.exports = mongoose.model('EquipmentType', equipmentTypeSchema)
