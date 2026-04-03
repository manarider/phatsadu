const mongoose = require('mongoose')

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    is_active: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'departments',
  }
)

departmentSchema.index({ name: 1, deleted_at: 1 })

module.exports = mongoose.model('Department', departmentSchema)
