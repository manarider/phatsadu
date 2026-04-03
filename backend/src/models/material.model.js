const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    material_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaterialType',
      required: true,
      index: true,
    },
    material_type_name: { type: String, required: true, trim: true, index: true },
    department_name: { type: String, required: true, trim: true, index: true },
    unit: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    min_quantity: { type: Number, required: true, min: 0, default: 0 },
    note: { type: String, trim: true, default: '' },
    created_by: { type: String, required: true, trim: true },
    updated_by: { type: String, trim: true, default: '' },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'materials',
  }
)

// duplicate material names allowed across departments, but one active name per department
materialSchema.index(
  { name: 1, department_name: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
)

materialSchema.index({ department_name: 1, quantity: 1, min_quantity: 1, deleted_at: 1 })
materialSchema.index({ name: 'text', material_type_name: 'text', note: 'text' })

module.exports = mongoose.model('Material', materialSchema)
