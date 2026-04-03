const XLSX = require('xlsx')
const asyncHandler = require('../utils/asyncHandler')
const { MaintenanceRecord, Equipment, AuditLog } = require('../models')
const { buildScopeFilter } = require('../middlewares')

const MAINTENANCE_TYPES = ['ตรวจสอบ', 'ทำความสะอาด', 'เปลี่ยนชิ้นส่วน', 'ปรับเทียบ', 'อื่นๆ']

// ─── List ─────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res) => {
  const { status = '', overdue = '', equipment_id = '', page = 1, limit = 100 } = req.query

  const filter = buildScopeFilter(req, { deleted_at: null })

  if (status && ['pending', 'done'].includes(status)) {
    filter.status = status
  }

  if (equipment_id) {
    filter.equipment_id = equipment_id
  }

  if (overdue === 'true') {
    filter.status = 'pending'
    filter.scheduled_date = { $lt: new Date() }
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1)
  const safeLimit = Math.min(Math.max(Number(limit), 1), 200)

  const [items, total] = await Promise.all([
    MaintenanceRecord.find(filter)
      .sort({ scheduled_date: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    MaintenanceRecord.countDocuments(filter),
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

// ─── Get by ID ────────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id, deleted_at: null })
  const item = await MaintenanceRecord.findOne(filter).lean()
  if (!item) {
    return res.status(404).json({ error: 'Maintenance record not found' })
  }
  res.json({ status: 'success', data: item })
})

// ─── Create ───────────────────────────────────────────────────────────────────

exports.create = asyncHandler(async (req, res) => {
  const { equipment_id, maintenance_type, scheduled_date, description } = req.body

  if (!equipment_id || !maintenance_type || !scheduled_date) {
    return res.status(400).json({ error: 'equipment_id, maintenance_type, scheduled_date are required' })
  }

  if (!MAINTENANCE_TYPES.includes(maintenance_type)) {
    return res.status(400).json({ error: 'Invalid maintenance_type' })
  }

  const equipment = await Equipment.findOne({ _id: equipment_id, deleted_at: null }).lean()
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found' })
  }

  const resolvedDepartment =
    req.user.role === 'admin' ? equipment.department_name : req.user.department_name

  const record = await MaintenanceRecord.create({
    equipment_id,
    equipment_name: equipment.name,
    equipment_asset_code: equipment.asset_code || '',
    department_name: resolvedDepartment,
    maintenance_type,
    scheduled_date: new Date(scheduled_date),
    description: description || '',
    status: 'pending',
    created_by: req.user.username,
    updated_by: req.user.username,
  })

  await AuditLog.create({
    action: 'create',
    module: 'maintenance',
    target_collection: 'maintenance_records',
    target_id: String(record._id),
    message: `Schedule maintenance for ${equipment.name}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: resolvedDepartment,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: record.toObject(),
  })

  res.status(201).json({ status: 'success', data: record })
})

// ─── Complete ─────────────────────────────────────────────────────────────────

exports.complete = asyncHandler(async (req, res) => {
  const { completed_note, performed_by, cost } = req.body

  const filter = buildScopeFilter(req, { _id: req.params.id, deleted_at: null })
  const record = await MaintenanceRecord.findOne(filter)
  if (!record) {
    return res.status(404).json({ error: 'Maintenance record not found' })
  }

  if (record.status === 'done') {
    return res.status(400).json({ error: 'Already completed' })
  }

  record.status = 'done'
  record.completed_date = new Date()
  record.completed_note = completed_note || ''
  record.performed_by = performed_by || req.user.username
  record.cost = Number(cost || 0)
  record.updated_by = req.user.username
  await record.save()

  await AuditLog.create({
    action: 'update',
    module: 'maintenance',
    target_collection: 'maintenance_records',
    target_id: String(record._id),
    message: `Complete maintenance for ${record.equipment_name}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: record.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: record.toObject(),
  })

  res.json({ status: 'success', data: record })
})

// ─── Soft Delete ──────────────────────────────────────────────────────────────

exports.remove = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { _id: req.params.id, deleted_at: null })
  const record = await MaintenanceRecord.findOne(filter)
  if (!record) {
    return res.status(404).json({ error: 'Maintenance record not found' })
  }

  record.deleted_at = new Date()
  record.updated_by = req.user.username
  await record.save()

  res.json({ status: 'success' })
})

// ─── Summary (สำหรับ Dashboard) ───────────────────────────────────────────────

exports.summary = asyncHandler(async (req, res) => {
  const baseFilter = buildScopeFilter(req, { deleted_at: null })

  const now = new Date()
  const next30 = new Date(now)
  next30.setDate(next30.getDate() + 30)

  const [overdue, upcoming] = await Promise.all([
    MaintenanceRecord.countDocuments({
      ...baseFilter,
      status: 'pending',
      scheduled_date: { $lt: now },
    }),
    MaintenanceRecord.countDocuments({
      ...baseFilter,
      status: 'pending',
      scheduled_date: { $gte: now, $lte: next30 },
    }),
  ])

  res.json({ status: 'success', data: { overdue, upcoming } })
})

// ─── Export Excel ─────────────────────────────────────────────────────────────

exports.exportExcel = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, { deleted_at: null })
  const items = await MaintenanceRecord.find(filter).sort({ scheduled_date: 1 }).lean()

  const now = new Date()
  const worksheetData = items.map((item) => ({
    'ชื่อครุภัณฑ์': item.equipment_name || '',
    'รหัสครุภัณฑ์': item.equipment_asset_code || '',
    'หน่วยงาน': item.department_name || '',
    'ประเภทบำรุงรักษา': item.maintenance_type || '',
    'วันที่กำหนด': item.scheduled_date
      ? new Date(item.scheduled_date).toLocaleDateString('th-TH')
      : '',
    'สถานะ': item.status === 'done'
      ? 'เสร็จสิ้น'
      : item.scheduled_date && new Date(item.scheduled_date) < now
        ? 'เกินกำหนด'
        : 'รอดำเนินการ',
    'รายละเอียด': item.description || '',
    'วันที่เสร็จ': item.completed_date
      ? new Date(item.completed_date).toLocaleDateString('th-TH')
      : '',
    'ผู้ดำเนินการ': item.performed_by || '',
    'ค่าใช้จ่าย': item.cost || 0,
    'หมายเหตุ': item.completed_note || '',
  }))

  const ws = XLSX.utils.json_to_sheet(worksheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'บำรุงรักษา')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=maintenance-export.xlsx')
  res.send(buffer)
})
