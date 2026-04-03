const mongoose = require('mongoose')

const saleItemSchema = new mongoose.Schema(
  {
    equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    eqid: { type: String, trim: true, default: '' },
    asset_code: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    equipment_type_name: { type: String, trim: true, default: '' },
    department_name: { type: String, trim: true, default: '' },
    serial_number: { type: String, trim: true, default: '' },
    original_price: { type: Number, default: 0 },
    estimated_price: { type: Number, default: 0 },
    image: {
      filename: { type: String, default: '' },
      path: { type: String, default: '' },
    },
  },
  { _id: false }
)

const saleRecordSchema = new mongoose.Schema(
  {
    // สถานะของ sale record
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
      index: true,
    },
    // รายการครุภัณฑ์ที่จำหน่าย
    items: { type: [saleItemSchema], default: [] },

    // ข้อมูลเมื่อจำหน่ายเสร็จ
    sale_date: { type: Date, default: null },
    total_price: { type: Number, default: 0 },
    document_number: { type: String, trim: true, default: '' },
    details: { type: String, trim: true, default: '' },
    document_file: {
      filename: { type: String, default: '' },
      path: { type: String, default: '' },
      mime_type: { type: String, default: '' },
    },

    fiscal_year: { type: Number, default: null },
    created_by: { type: String, trim: true, default: '' },
    updated_by: { type: String, trim: true, default: '' },
    completed_by: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'sale_records',
  }
)

module.exports = mongoose.model('SaleRecord', saleRecordSchema)
