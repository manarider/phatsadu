const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const asyncHandler = require('../utils/asyncHandler')
const { Equipment, SaleRecord } = require('../models')
const { buildScopeFilter } = require('../middlewares')
const {
  ensureDirSync,
  sanitizeName,
  buildUploadAbsolutePath,
  buildUploadPublicPath,
} = require('../utils/helpers')

const SALE_STATUSES = ['ชำรุด', 'รอตัดจำหน่าย']

// คำนวณปีงบประมาณ (ตุลาคม–กันยายน)
function fiscalYear(date = new Date()) {
  const m = date.getMonth() + 1 // 1-12
  const y = date.getFullYear() + 543
  return m >= 10 ? y + 1 : y
}

// ─── บันทึกรูปสินค้าที่จะจำหน่าย (resize ≤ 2MB) ──────────────────────────
async function saveSaleItemImage(buffer, mime, assetCode, fy) {
  const dir = buildUploadAbsolutePath('sale', String(fy))
  ensureDirSync(dir)
  const safe = sanitizeName(assetCode || Date.now()) || String(Date.now())
  const filename = `${safe}_${Date.now()}.webp`
  const absPath = path.join(dir, filename)

  await sharp(buffer)
    .rotate()
    .webp({ quality: 75 })
    .toFile(absPath)

  // ถ้ายังเกิน 2MB ลด quality ลงอีก
  const stat = fs.statSync(absPath)
  if (stat.size > 2 * 1024 * 1024) {
    await sharp(buffer).rotate().webp({ quality: 50 }).toFile(absPath)
  }

  return {
    filename,
    path: buildUploadPublicPath('sale', String(fy), filename),
  }
}

// ─── LIST: ครุภัณฑ์ที่ชำรุด/รอตัดจำหน่าย ─────────────────────────────────
exports.listPending = asyncHandler(async (req, res) => {
  const base = buildScopeFilter(req, {})
  const filter = { ...base, status: { $in: SALE_STATUSES }, deleted_at: null }
  const items = await Equipment.find(filter)
    .sort({ status: 1, updatedAt: -1 })
    .lean()
  res.json({ status: 'success', data: items })
})

// ─── UPDATE EQUIPMENT STATUS (from sale list) ──────────────────────────────
exports.updateEquipmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const { EQUIPMENT_STATUSES } = require('../utils/constants')
  if (!EQUIPMENT_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' })
  }
  const filter = buildScopeFilter(req, { _id: id, deleted_at: null })
  const eq = await Equipment.findOneAndUpdate(
    filter,
    { status, updated_by: req.user.username },
    { new: true }
  ).lean()
  if (!eq) return res.status(404).json({ error: 'ไม่พบครุภัณฑ์' })
  res.json({ status: 'success', data: eq })
})

// ─── PREPARE: สร้าง/อัปเดต draft sale record ─────────────────────────────
// POST /api/sale/draft  body: { equipment_ids: [...] }
exports.createDraft = asyncHandler(async (req, res) => {
  const { equipment_ids = [] } = req.body
  if (!equipment_ids.length) {
    return res.status(400).json({ error: 'กรุณาเลือกครุภัณฑ์อย่างน้อย 1 รายการ' })
  }

  const scopeBase = buildScopeFilter(req, {})
  const eqList = await Equipment.find({
    ...scopeBase,
    _id: { $in: equipment_ids },
    status: { $in: SALE_STATUSES },
    deleted_at: null,
  }).lean()

  if (!eqList.length) {
    return res.status(400).json({ error: 'ไม่พบครุภัณฑ์ที่เลือก' })
  }

  const fy = fiscalYear()
  const items = eqList.map((eq) => ({
    equipment_id: eq._id,
    eqid: eq.eqid || '',
    asset_code: eq.asset_code || '',
    name: eq.name || '',
    equipment_type_name: eq.equipment_type_name || '',
    department_name: eq.department_name || '',
    serial_number: eq.serial_number || '',
    original_price: eq.price || 0,
    estimated_price: 0,
    image: { filename: '', path: '' },
  }))

  const draft = await SaleRecord.create({
    status: 'draft',
    items,
    fiscal_year: fy,
    created_by: req.user.username,
    updated_by: req.user.username,
  })

  res.status(201).json({ status: 'success', data: draft })
})

// ─── GET DRAFT ─────────────────────────────────────────────────────────────
exports.getDraft = asyncHandler(async (req, res) => {
  const { id } = req.params
  const draft = await SaleRecord.findOne({ _id: id, status: 'draft' }).lean()
  if (!draft) return res.status(404).json({ error: 'ไม่พบรายการเตรียมจำหน่าย' })
  res.json({ status: 'success', data: draft })
})

// ─── UPDATE ITEM: estimated_price ─────────────────────────────────────────
// PATCH /api/sale/:id/items/:idx/price
exports.updateItemPrice = asyncHandler(async (req, res) => {
  const { id, idx } = req.params
  const { estimated_price } = req.body
  const draft = await SaleRecord.findOne({ _id: id, status: 'draft' })
  if (!draft) return res.status(404).json({ error: 'ไม่พบรายการ' })

  const i = Number(idx)
  if (i < 0 || i >= draft.items.length) return res.status(400).json({ error: 'ไม่พบรายการย่อย' })
  draft.items[i].estimated_price = Number(estimated_price) || 0
  draft.updated_by = req.user.username
  await draft.save()
  res.json({ status: 'success', data: draft })
})

// ─── UPLOAD ITEM IMAGE ─────────────────────────────────────────────────────
// POST /api/sale/:id/items/:idx/image  (multipart image)
exports.uploadItemImage = asyncHandler(async (req, res) => {
  const { id, idx } = req.params
  if (!req.file) return res.status(400).json({ error: 'กรุณาแนบรูปภาพ' })

  const draft = await SaleRecord.findOne({ _id: id, status: 'draft' })
  if (!draft) return res.status(404).json({ error: 'ไม่พบรายการ' })

  const i = Number(idx)
  if (i < 0 || i >= draft.items.length) return res.status(400).json({ error: 'ไม่พบรายการย่อย' })

  const fy = draft.fiscal_year || fiscalYear()
  const imgData = await saveSaleItemImage(
    req.file.buffer,
    req.file.mimetype,
    draft.items[i].asset_code,
    fy
  )
  draft.items[i].image = imgData
  draft.updated_by = req.user.username
  await draft.save()
  res.json({ status: 'success', data: { image: imgData } })
})

// ─── COMPLETE: จำหน่าย ───────────────────────────────────────────────────
// POST /api/sale/:id/complete  multipart: doc_file (optional)
// body fields: sale_date, total_price, document_number, details
exports.completeSale = asyncHandler(async (req, res) => {
  const { id } = req.params
  const draft = await SaleRecord.findOne({ _id: id, status: 'draft' })
  if (!draft) return res.status(404).json({ error: 'ไม่พบรายการเตรียมจำหน่าย' })

  const { sale_date, total_price, document_number, details } = req.body
  if (!sale_date || !document_number) {
    return res.status(400).json({ error: 'กรุณาระบุวันที่จำหน่ายและเลขที่เอกสาร' })
  }

  // อัปโหลดเอกสาร PDF (ถ้ามี)
  let docFile = { filename: '', path: '', mime_type: '' }
  if (req.file) {
    const fy = draft.fiscal_year || fiscalYear()
    const dir = buildUploadAbsolutePath('sale', String(fy))
    ensureDirSync(dir)
    const ext = path.extname(req.file.originalname) || '.pdf'
    const filename = `doc_${sanitizeName(document_number) || Date.now()}${ext}`
    const absPath = path.join(dir, filename)
    fs.writeFileSync(absPath, req.file.buffer)
    docFile = {
      filename,
      path: buildUploadPublicPath('sale', String(fy), filename),
      mime_type: req.file.mimetype,
    }
  }

  // เปลี่ยนสถานะครุภัณฑ์ทุกรายการ → จำหน่ายแล้ว
  const eqIds = draft.items.map((it) => it.equipment_id)
  await Equipment.updateMany(
    { _id: { $in: eqIds } },
    { status: 'จำหน่ายแล้ว', updated_by: req.user.username }
  )

  // อัปเดต SaleRecord
  draft.status = 'completed'
  draft.sale_date = new Date(sale_date)
  draft.total_price = Number(total_price) || 0
  draft.document_number = String(document_number).trim()
  draft.details = String(details || '').trim()
  draft.document_file = docFile
  draft.completed_by = req.user.username
  draft.updated_by = req.user.username
  await draft.save()

  res.json({ status: 'success', data: draft })
})

// ─── LIST HISTORY ─────────────────────────────────────────────────────────
exports.listHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, year } = req.query
  const filter = { status: 'completed' }
  if (year) filter.fiscal_year = Number(year)
  // non-admin เห็นเฉพาะ record ที่มีครุภัณฑ์ของหน่วยงานตัวเอง
  if (req.user.role !== 'admin' && req.user.department_name) {
    filter['items.department_name'] = req.user.department_name
  }
  const skip = (Math.max(Number(page), 1) - 1) * 20
  const [records, total] = await Promise.all([
    SaleRecord.find(filter).sort({ sale_date: -1 }).skip(skip).limit(20).lean(),
    SaleRecord.countDocuments(filter),
  ])
  res.json({
    status: 'success',
    data: records,
    pagination: { total, page: Number(page), total_pages: Math.ceil(total / 20) },
  })
})

// ─── GET ONE HISTORY ──────────────────────────────────────────────────────
exports.getHistory = asyncHandler(async (req, res) => {
  const record = await SaleRecord.findOne({ _id: req.params.id, status: 'completed' }).lean()
  if (!record) return res.status(404).json({ error: 'ไม่พบประวัติการจำหน่าย' })
  res.json({ status: 'success', data: record })
})

// ─── DELETE DRAFT ─────────────────────────────────────────────────────────
exports.deleteDraft = asyncHandler(async (req, res) => {
  const draft = await SaleRecord.findOneAndDelete({ _id: req.params.id, status: 'draft' })
  if (!draft) return res.status(404).json({ error: 'ไม่พบ draft' })
  res.json({ status: 'success', message: 'ลบรายการเตรียมจำหน่ายแล้ว' })
})
