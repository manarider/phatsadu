const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'counters',
  }
)

module.exports = mongoose.model('Counter', counterSchema)
