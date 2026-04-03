const ExcelJS = require('exceljs')
const asyncHandler = require('../utils/asyncHandler')
const {
  Material,
  MaterialType,
  MaterialTransaction,
  AuditLog,
} = require('../models')

// Get all material types
exports.getTypes = asyncHandler(async (req, res) => {
  const types = await MaterialType.find({ deleted_at: null }).sort({ name: 1 }).lean()
  res.json({ status: 'success', data: types })
})

// Create material type (admin only)
exports.createMaterialType = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อประเภทวัสดุ' })

  const exists = await MaterialType.findOne({ name: name.trim(), deleted_at: null })
  if (exists) return res.status(409).json({ error: 'ชื่อประเภทวัสดุนี้มีอยู่แล้ว' })

  const type = await MaterialType.create({ name: name.trim() })
  res.status(201).json({ status: 'success', data: type })
})

// Update material type (admin only)
exports.updateMaterialType = asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อประเภทวัสดุ' })

  const type = await MaterialType.findOne({ _id: req.params.typeId, deleted_at: null })
  if (!type) return res.status(404).json({ error: 'ไม่พบประเภทวัสดุ' })

  const conflict = await MaterialType.findOne({ name: name.trim(), deleted_at: null, _id: { $ne: type._id } })
  if (conflict) return res.status(409).json({ error: 'ชื่อประเภทวัสดุนี้มีอยู่แล้ว' })

  const oldName = type.name
  type.name = name.trim()
  await type.save()

  // อัปเดต material_type_name
  if (oldName !== type.name) {
    await Material.updateMany({ material_type_id: type._id }, { $set: { material_type_name: type.name } })
  }

  res.json({ status: 'success', data: type })
})

// Delete material type (admin only, check in-use)
exports.deleteMaterialType = asyncHandler(async (req, res) => {
  const type = await MaterialType.findOne({ _id: req.params.typeId, deleted_at: null })
  if (!type) return res.status(404).json({ error: 'ไม่พบประเภทวัสดุ' })

  const count = await Material.countDocuments({ material_type_id: type._id, deleted_at: null })
  if (count > 0) {
    return res.status(409).json({ error: `ไม่สามารถลบได้ เนื่องจากมีวัสดุที่ใช้ประเภทนี้อยู่ ${count} รายการ` })
  }

  type.deleted_at = new Date()
  await type.save()
  res.json({ status: 'success', message: 'ลบประเภทวัสดุสำเร็จ' })
})


// Get single material by ID
exports.detail = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id })
  const item = await Material.findOne(filter).lean()
  if (!item) return res.status(404).json({ error: 'Material not found' })
  res.json({ status: 'success', data: item })
})
const { buildScopeFilter } = require('../middlewares')
const { getBooleanSetting } = require('../services/settings.service')

function canApproveWithdraw(role) {
  return ['admin', 'manager', 'staff'].includes(role)
}

exports.list = asyncHandler(async (req, res) => {
  const { q = '', low_stock = 'false', page = 1, limit = 20 } = req.query
  const filter = buildScopeFilter(req, {})

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { material_type_name: { $regex: q, $options: 'i' } },
      { note: { $regex: q, $options: 'i' } },
      { unit: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
      { department_name: { $regex: q, $options: 'i' } },
    ]
  }

  if (String(low_stock).toLowerCase() === 'true') {
    filter.$expr = { $lte: ['$quantity', '$min_quantity'] }
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1)
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100)

  const [items, total] = await Promise.all([
    Material.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Material.countDocuments(filter),
  ])

  res.json({
    status: 'success',
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: safeLimit,
      total_pages: Math.ceil(total / safeLimit),
    },
  })
})

exports.create = asyncHandler(async (req, res) => {
  const { name, material_type_id, unit, quantity, min_quantity, note, department_name } = req.body

  if (!name || !material_type_id || !unit) {
    return res.status(400).json({ error: 'name, material_type_id, unit are required' })
  }

  const materialType = await MaterialType.findById(material_type_id).lean()
  if (!materialType) {
    return res.status(400).json({ error: 'Invalid material type' })
  }

  const resolvedDepartment = req.user.role === 'admin'
    ? (department_name || req.user.department_name || '')
    : req.user.department_name

  if (!resolvedDepartment) {
    return res.status(400).json({ error: 'department_name is required' })
  }

  const exists = await Material.findOne({
    name,
    department_name: resolvedDepartment,
    deleted_at: null,
  }).lean()

  if (exists) {
    return res.status(409).json({ error: 'Duplicate material name in same department' })
  }

  const created = await Material.create({
    name,
    material_type_id,
    material_type_name: materialType.name,
    department_name: resolvedDepartment,
    unit,
    quantity: Number(quantity || 0),
    min_quantity: Number(min_quantity || 0),
    note: note || '',
    created_by: req.user.username,
    updated_by: req.user.username,
  })

  await AuditLog.create({
    action: 'create',
    module: 'material',
    target_collection: 'materials',
    target_id: String(created._id),
    message: `create material ${created.name}`,
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
  const existing = await Material.findOne(filter)
  if (!existing) {
    return res.status(404).json({ error: 'Material not found' })
  }

  const beforeData = existing.toObject()
  const { unit, min_quantity, note, department_name } = req.body

  if (unit !== undefined) existing.unit = unit
  if (min_quantity !== undefined) existing.min_quantity = Number(min_quantity)
  if (note !== undefined) existing.note = note
  // เฉพาะ admin เท่านั้นที่เปลี่ยนหน่วยงานได้
  if (department_name !== undefined && req.user.role === 'admin') {
    existing.department_name = department_name
  }
  existing.updated_by = req.user.username

  await existing.save()

  await AuditLog.create({
    action: 'update',
    module: 'material',
    target_collection: 'materials',
    target_id: String(existing._id),
    message: `update material ${existing.name}`,
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
  const existing = await Material.findOne({ _id: req.params.id, deleted_at: null })
  if (!existing) {
    return res.status(404).json({ error: 'Material not found' })
  }

  existing.deleted_at = new Date()
  existing.updated_by = req.user.username
  await existing.save()

  res.json({ status: 'success' })
})

exports.createTransaction = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id })
  const material = await Material.findOne(filter)
  if (!material) {
    return res.status(404).json({ error: 'Material not found' })
  }

  const { type, quantity, reason } = req.body
  const qty = Number(quantity || 0)
  if (!['receive', 'withdraw', 'adjust'].includes(type) || qty <= 0) {
    return res.status(400).json({ error: 'Invalid transaction payload' })
  }

  if (req.user.role === 'viewer' && type !== 'withdraw') {
    return res.status(403).json({ error: 'Viewer can only create withdraw request' })
  }

  const autoApprove = await getBooleanSetting('withdrawal_auto_approve', false)
  let status = 'pending'

  if (type === 'receive') {
    status = 'approved'
  }
  if (type === 'adjust' && req.user.role !== 'viewer') {
    status = 'approved'
  }
  if (type === 'withdraw' && autoApprove && canApproveWithdraw(req.user.role)) {
    status = 'approved'
  }

  const before = material.quantity
  let after = before

  if (status === 'approved') {
    if (type === 'receive') after = before + qty
    if (type === 'withdraw') {
      if (before < qty) {
        return res.status(400).json({ error: 'Insufficient stock' })
      }
      after = before - qty
    }
    if (type === 'adjust') after = qty
    material.quantity = after
    material.updated_by = req.user.username
    await material.save()
  }

  const tx = await MaterialTransaction.create({
    material_id: material._id,
    material_name: material.name,
    department_name: material.department_name,
    type,
    quantity: qty,
    quantity_before: before,
    quantity_after: status === 'approved' ? after : before,
    reason: reason || '',
    status,
    requested_by: req.user.username,
    approved_by: status === 'approved' ? req.user.username : '',
    approved_at: status === 'approved' ? new Date() : null,
  })

  res.status(201).json({ status: 'success', data: tx })
})

exports.approveTransaction = asyncHandler(async (req, res) => {
  if (!canApproveWithdraw(req.user.role)) {
    return res.status(403).json({ error: 'No permission to approve transaction' })
  }

  const tx = await MaterialTransaction.findOne({ _id: req.params.id, deleted_at: null })
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' })
  }

  if (req.user.role !== 'admin' && tx.department_name !== req.user.department_name) {
    return res.status(403).json({ error: 'Forbidden for another department' })
  }

  if (tx.status !== 'pending') {
    return res.status(400).json({ error: 'Transaction is not pending' })
  }

  const material = await Material.findOne({ _id: tx.material_id, deleted_at: null })
  if (!material) {
    return res.status(404).json({ error: 'Material not found' })
  }

  const before = material.quantity
  let after = before

  if (tx.type === 'receive') after = before + tx.quantity
  if (tx.type === 'withdraw') {
    if (before < tx.quantity) {
      return res.status(400).json({ error: 'Insufficient stock for approve' })
    }
    after = before - tx.quantity
  }
  if (tx.type === 'adjust') after = tx.quantity

  material.quantity = after
  material.updated_by = req.user.username
  await material.save()

  tx.status = 'approved'
  tx.quantity_before = before
  tx.quantity_after = after
  tx.approved_by = req.user.username
  tx.approved_at = new Date()
  await tx.save()

  res.json({ status: 'success', data: tx })
})

exports.listTransactions = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { deleted_at: null }
    : { deleted_at: null, department_name: req.user.department_name }

  const items = await MaterialTransaction.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  res.json({ status: 'success', data: items })
})

// ประวัติ transaction ของวัสดุชิ้นนั้น พร้อมข้อมูล material
exports.listTransactionsByMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params
  const materialFilter = buildScopeFilter(req, { _id: id, deleted_at: null })
  const material = await Material.findOne(materialFilter).lean()
  if (!material) return res.status(404).json({ error: 'Material not found' })

  const txFilter = buildScopeFilter(req, { material_id: id, deleted_at: null })
  const transactions = await MaterialTransaction.find(txFilter).sort({ createdAt: 1 }).lean()

  res.json({ status: 'success', material, data: transactions })
})

exports.bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'xlsx file is required' })
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(req.file.buffer)
  const sheet = workbook.worksheets[0]

  let created = 0
  let incremented = 0
  let skipped = 0

  const typeMap = await MaterialType.find({ deleted_at: null }).lean()
  const typeByName = new Map(typeMap.map((t) => [String(t.name).trim(), t]))

  const departmentName = req.user.role === 'admin'
    ? (req.body.department_name || req.user.department_name || '')
    : req.user.department_name

  if (!departmentName) {
    return res.status(400).json({ error: 'department_name is required for bulk import' })
  }

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const name = String(row.getCell(1).value || '').trim()
    const typeName = String(row.getCell(2).value || '').trim()
    const unit = String(row.getCell(3).value || '').trim()
    const qty = Number(row.getCell(4).value || 0)
    const minQty = Number(row.getCell(5).value || 0)

    if (!name || !typeName || !unit || qty <= 0) {
      skipped += 1
      continue
    }

    const materialType = typeByName.get(typeName)
    if (!materialType) {
      skipped += 1
      continue
    }

    const existing = await Material.findOne({
      name,
      department_name: departmentName,
      deleted_at: null,
    })

    if (existing) {
      const before = existing.quantity
      existing.quantity = before + qty
      existing.updated_by = req.user.username
      await existing.save()

      await MaterialTransaction.create({
        material_id: existing._id,
        material_name: existing.name,
        department_name: existing.department_name,
        type: 'receive',
        quantity: qty,
        quantity_before: before,
        quantity_after: existing.quantity,
        reason: 'bulk import auto increment',
        status: 'approved',
        requested_by: req.user.username,
        approved_by: req.user.username,
        approved_at: new Date(),
      })

      incremented += 1
      continue
    }

    const material = await Material.create({
      name,
      material_type_id: materialType._id,
      material_type_name: materialType.name,
      department_name: departmentName,
      unit,
      quantity: qty,
      min_quantity: minQty,
      created_by: req.user.username,
      updated_by: req.user.username,
    })

    await MaterialTransaction.create({
      material_id: material._id,
      material_name: material.name,
      department_name: material.department_name,
      type: 'receive',
      quantity: qty,
      quantity_before: 0,
      quantity_after: qty,
      reason: 'bulk import create',
      status: 'approved',
      requested_by: req.user.username,
      approved_by: req.user.username,
      approved_at: new Date(),
    })

    created += 1
  }

  res.json({
    status: 'success',
    result: { created, incremented, skipped },
  })
})
