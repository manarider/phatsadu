const mongoose = require('mongoose')
const { TRANSACTION_TYPES } = require('../utils/constants')

const materialTransactionSchema = new mongoose.Schema(
  {
    material_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
      index: true,
    },
    material_name: { type: String, required: true, trim: true },
    department_name: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    quantity_before: { type: Number, required: true, min: 0 },
    quantity_after: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    requested_by: { type: String, required: true, trim: true },
    approved_by: { type: String, trim: true, default: '' },
    approved_at: { type: Date, default: null },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'material_transactions',
  }
)

materialTransactionSchema.index({ department_name: 1, status: 1, type: 1, deleted_at: 1 })
materialTransactionSchema.index({ createdAt: -1 })

module.exports = mongoose.model('MaterialTransaction', materialTransactionSchema)
