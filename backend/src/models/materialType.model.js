const mongoose = require('mongoose')

const materialTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    is_active: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'material_types',
  }
)

materialTypeSchema.index({ name: 1, deleted_at: 1 })

module.exports = mongoose.model('MaterialType', materialTypeSchema)
