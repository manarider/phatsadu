const path = require('path')
const sharp = require('sharp')
const ExcelJS = require('exceljs')
const asyncHandler = require('../utils/asyncHandler')
const {
  Equipment,
  EquipmentType,
  AuditLog,
} = require('../models')
const { buildScopeFilter } = require('../middlewares')
const { EQUIPMENT_STATUSES } = require('../utils/constants')

// Stats: count by status (scoped to user's department)
exports.stats = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, {})
  const counts = await Equipment.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])
  const byStatus = {}
  EQUIPMENT_STATUSES.forEach((s) => { byStatus[s] = 0 })
  counts.forEach(({ _id, count }) => { if (_id) byStatus[_id] = count })
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  res.json({ status: 'success', data: { total, byStatus } })
})

// Get all equipment types
exports.getTypes = asyncHandler(async (req, res) => {
  const types = await EquipmentType.find({ deleted_at: null }).sort({ name: 1 }).lean()
  res.json({ status: 'success', data: types })
})

// Create equipment type (admin only)
exports.createType = asyncHandler(async (req, res) => {
  const { name, code } = req.body
  if (!name?.trim() || !code?.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อและรหัสประเภท' })
  }
  const exists = await EquipmentType.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    deleted_at: null,
  })
  if (exists) return res.status(409).json({ error: 'ชื่อหรือรหัสประเภทนี้มีอยู่แล้ว' })

  const type = await EquipmentType.create({ name: name.trim(), code: code.trim().toUpperCase() })
  res.status(201).json({ status: 'success', data: type })
})

// Update equipment type (admin only)
exports.updateType = asyncHandler(async (req, res) => {
  const { name, code } = req.body
  if (!name?.trim() || !code?.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อและรหัสประเภท' })
  }

  const type = await EquipmentType.findOne({ _id: req.params.typeId, deleted_at: null })
  if (!type) return res.status(404).json({ error: 'ไม่พบประเภทครุภัณฑ์' })

  const conflict = await EquipmentType.findOne({
    $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    deleted_at: null,
    _id: { $ne: type._id },
  })
  if (conflict) return res.status(409).json({ error: 'ชื่อหรือรหัสประเภทนี้มีอยู่แล้ว' })

  const oldName = type.name
  type.name = name.trim()
  type.code = code.trim().toUpperCase()
  await type.save()

  // อัปเดตชื่อใน equipment
  if (oldName !== type.name) {
    await Equipment.updateMany({ equipment_type_name: oldName }, { $set: { equipment_type_name: type.name } })
  }

  res.json({ status: 'success', data: type })
})

// Delete equipment type (admin only, check in-use)
exports.deleteType = asyncHandler(async (req, res) => {
  const type = await EquipmentType.findOne({ _id: req.params.typeId, deleted_at: null })
  if (!type) return res.status(404).json({ error: 'ไม่พบประเภทครุภัณฑ์' })

  const count = await Equipment.countDocuments({ equipment_type_name: type.name, deleted_at: null })
  if (count > 0) {
    return res.status(409).json({ error: `ไม่สามารถลบได้ เนื่องจากมีครุภัณฑ์ที่ใช้ประเภทนี้อยู่ ${count} รายการ` })
  }

  type.deleted_at = new Date()
  await type.save()
  res.json({ status: 'success', message: 'ลบประเภทครุภัณฑ์สำเร็จ' })
})

const { generateEqid } = require('../services/eqid.service')
const {
  ensureDirSync,
  sanitizeName,
  buildUploadAbsolutePath,
  buildUploadPublicPath,
} = require('../utils/helpers')

async function saveEquipmentImage(file, typeName, assetCode) {
  const safeType = sanitizeName(typeName || 'other') || 'other'
  const safeAssetCode = sanitizeName(assetCode || Date.now())
  const folderAbs = buildUploadAbsolutePath('equipment', safeType)
  ensureDirSync(folderAbs)

  const filename = `${safeAssetCode}.webp`
  const absolutePath = path.join(folderAbs, filename)

  const meta = await sharp(file.buffer)
    .rotate()
    .webp({ quality: 80 })
    .toFile(absolutePath)

  return {
    filename,
    path: buildUploadPublicPath('equipment', safeType, filename),
    mime_type: 'image/webp',
    size: meta.size || 0,
    width: meta.width || null,
    height: meta.height || null,
  }
}

exports.list = asyncHandler(async (req, res) => {
  const { q = '', status = '', type = '', department = '', page = 1, limit = 200 } = req.query

  const filter = buildScopeFilter(req, {})

  // ซ่อนครุภัณฑ์ที่จำหน่ายแล้วออกจากรายการปกติ (ยกเว้นถ้าค้นหา status นั้นโดยตรง)
  if (status) {
    filter.status = status
  } else {
    filter.status = { $ne: 'จำหน่ายแล้ว' }
  }

  // Admin สามารถกรองตาม department ได้
  if (req.user.role === 'admin' && department) {
    filter.department_name = department
  }

  if (type) filter.equipment_type_name = type

  if (q) {
    filter.$or = [
      { eqid: { $regex: q, $options: 'i' } },
      { asset_code: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { serial_number: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { custodian_name: { $regex: q, $options: 'i' } },
      { equipment_type_name: { $regex: q, $options: 'i' } },
      { department_name: { $regex: q, $options: 'i' } },
      { status: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { project: { $regex: q, $options: 'i' } },
      { note: { $regex: q, $options: 'i' } },
    ]
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1)
  const safeLimit = Math.min(Math.max(Number(limit), 1), 200) // max 200 per page
  const maxTotal = 1000 // max 1000 items total

  const [items, total] = await Promise.all([
    Equipment.find(filter)
      .sort({ createdAt: -1 }) // เรียงจากใหม่ไปเก่า
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Equipment.countDocuments(filter),
  ])

  // จำกัดไม่ให้เกิน 1000 รายการ
  const limitedTotal = Math.min(total, maxTotal)

  res.json({
    status: 'success',
    data: items,
    pagination: {
      total: limitedTotal,
      page: Number(page),
      limit: safeLimit,
      total_pages: Math.ceil(limitedTotal / safeLimit),
    },
  })
})

exports.getById = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id })
  const item = await Equipment.findOne(filter).lean()
  if (!item) {
    return res.status(404).json({ error: 'Equipment not found' })
  }
  res.json({ status: 'success', data: item })
})

exports.create = asyncHandler(async (req, res) => {
  const {
    asset_code,
    name,
    serial_number,
    equipment_type_id,
    location,
    price,
    custodian_name,
    acquired_date,
    description,
    project,
    note,
    status,
    department_name,
  } = req.body

  if (!asset_code || !name || !equipment_type_id) {
    return res.status(400).json({ error: 'asset_code, name, equipment_type_id are required' })
  }

  const type = await EquipmentType.findById(equipment_type_id).lean()
  if (!type) {
    return res.status(400).json({ error: 'Invalid equipment type' })
  }

  const resolvedDepartment = req.user.role === 'admin'
    ? (department_name || req.user.department_name || '')
    : req.user.department_name

  if (!resolvedDepartment) {
    return res.status(400).json({ error: 'department_name is required' })
  }

  const exists = await Equipment.findOne({ asset_code, deleted_at: null }).lean()
  if (exists) {
    return res.status(409).json({ error: 'Duplicate asset_code' })
  }

  const eqid = await generateEqid(type.code)
  const payload = {
    eqid,
    asset_code,
    name,
    serial_number: serial_number || '',
    equipment_type_id,
    equipment_type_name: type.name,
    department_name: resolvedDepartment,
    location: location || '',
    price: Number(price || 0),
    custodian_name: custodian_name || '',
    acquired_date: acquired_date ? new Date(acquired_date) : null,
    description: description || '',
    project: project || '',
    note: note || '',
    status: status || 'ใช้งานได้',
    created_by: req.user.username,
    updated_by: req.user.username,
  }

  if (req.file) {
    payload.image = await saveEquipmentImage(req.file, type.name, asset_code)
  }

  const created = await Equipment.create(payload)

  await AuditLog.create({
    action: 'create',
    module: 'equipment',
    target_collection: 'equipments',
    target_id: String(created._id),
    message: `create equipment ${created.eqid}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: created.department_name,
    ip_address: req.ip || '',
    user_agent: req.headers['user-agent'] || '',
    after_data: created.toObject(),
  })

  res.status(201).json({ status: 'success', data: created })
})

exports.update = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id })
  const existing = await Equipment.findOne(filter)
  if (!existing) {
    return res.status(404).json({ error: 'Equipment not found' })
  }

  const beforeData = existing.toObject()

  const {
    name,
    serial_number,
    location,
    price,
    custodian_name,
    acquired_date,
    description,
    project,
    note,
    status,
    department_name,
  } = req.body

  if (name !== undefined) existing.name = name
  if (serial_number !== undefined) existing.serial_number = serial_number
  if (location !== undefined) existing.location = location
  if (price !== undefined) existing.price = Number(price)
  if (custodian_name !== undefined) existing.custodian_name = custodian_name
  if (acquired_date !== undefined) {
    existing.acquired_date = acquired_date ? new Date(acquired_date) : null
  }
  if (description !== undefined) existing.description = description
  if (project !== undefined) existing.project = project
  if (note !== undefined) existing.note = note
  if (status !== undefined) existing.status = status
  if (department_name !== undefined && req.user.role === 'admin') existing.department_name = department_name

  if (req.file) {
    existing.image = await saveEquipmentImage(
      req.file,
      existing.equipment_type_name,
      existing.asset_code
    )
  }

  existing.updated_by = req.user.username
  await existing.save()

  await AuditLog.create({
    action: 'update',
    module: 'equipment',
    target_collection: 'equipments',
    target_id: String(existing._id),
    message: `update equipment ${existing.eqid}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: existing.department_name,
    ip_address: req.ip || '',
    user_agent: req.headers['user-agent'] || '',
    before_data: beforeData,
    after_data: existing.toObject(),
  })

  res.json({ status: 'success', data: existing })
})

exports.softDelete = asyncHandler(async (req, res) => {
  const existing = await Equipment.findOne({ _id: req.params.id, deleted_at: null })
  if (!existing) {
    return res.status(404).json({ error: 'Equipment not found' })
  }

  const beforeData = existing.toObject()
  existing.deleted_at = new Date()
  existing.updated_by = req.user.username
  await existing.save()

  await AuditLog.create({
    action: 'delete',
    module: 'equipment',
    target_collection: 'equipments',
    target_id: String(existing._id),
    message: `soft delete equipment ${existing.eqid}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: existing.department_name,
    ip_address: req.ip || '',
    user_agent: req.headers['user-agent'] || '',
    before_data: beforeData,
    after_data: existing.toObject(),
  })

  res.json({ status: 'success' })
})

exports.bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'xlsx file is required' })
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(req.file.buffer)
  const sheet = workbook.worksheets[0]

  let inserted = 0
  let skipped = 0
  const errors = []

  const typeMap = await EquipmentType.find({ deleted_at: null }).lean()
  const typeByName = new Map(typeMap.map((t) => [String(t.name).trim(), t]))

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const assetCode = String(row.getCell(1).value || '').trim()
    const name = String(row.getCell(2).value || '').trim()
    const typeName = String(row.getCell(3).value || '').trim()
    const serialNumber = String(row.getCell(4).value || '').trim()
    const location = String(row.getCell(5).value || '').trim()
    const price = Number(row.getCell(6).value || 0)
    const custodian = String(row.getCell(7).value || '').trim()

    if (!assetCode || !name || !typeName) {
      skipped += 1
      errors.push({ row: rowNumber, error: 'missing required fields' })
      continue
    }

    const duplicate = await Equipment.findOne({ asset_code: assetCode, deleted_at: null }).lean()
    if (duplicate) {
      skipped += 1
      continue
    }

    const type = typeByName.get(typeName)
    if (!type) {
      skipped += 1
      errors.push({ row: rowNumber, error: `unknown equipment type: ${typeName}` })
      continue
    }

    const eqid = await generateEqid(type.code)

    await Equipment.create({
      eqid,
      asset_code: assetCode,
      name,
      serial_number: serialNumber,
      equipment_type_id: type._id,
      equipment_type_name: type.name,
      department_name: req.user.role === 'admin'
        ? (req.body.department_name || req.user.department_name || '')
        : req.user.department_name,
      location,
      price,
      custodian_name: custodian,
      status: 'ใช้งานได้',
      created_by: req.user.username,
      updated_by: req.user.username,
    })

    inserted += 1
  }

  res.json({
    status: 'success',
    result: {
      inserted,
      skipped,
      errors,
    },
  })
})
