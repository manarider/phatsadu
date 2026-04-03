const mongoose = require('mongoose')

const chatAttachmentSchema = new mongoose.Schema(
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

const chatMessageSchema = new mongoose.Schema(
  {
    repair_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
      index: true,
    },
    department_name: { type: String, required: true, trim: true, index: true },
    sender_user_id: { type: String, required: true, trim: true },
    sender_name: { type: String, required: true, trim: true },
    sender_role: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    attachments: {
      type: [chatAttachmentSchema],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 10
        },
        message: 'Maximum 10 images per message',
      },
    },
    is_system: { type: Boolean, default: false },
    read_by: { type: [String], default: [] },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'chat_messages',
  }
)

chatMessageSchema.index({ repair_request_id: 1, createdAt: 1, deleted_at: 1 })
chatMessageSchema.index({ department_name: 1, deleted_at: 1 })

module.exports = mongoose.model('ChatMessage', chatMessageSchema)
