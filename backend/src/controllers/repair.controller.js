const asyncHandler = require('../utils/asyncHandler')
const path = require('path')
const fs = require('fs')
const {
  RepairRequest,
  Equipment,
  ChatMessage,
  AuditLog,
} = require('../models')
const { buildScopeFilter } = require('../middlewares')
const {
  ensureDirSync,
  buildUploadAbsolutePath,
  buildUploadPublicPath,
} = require('../utils/helpers')

exports.list = asyncHandler(async (req, res) => {
  const { status = '', equipment_id = '', page = 1, limit = 20 } = req.query
  const filter = buildScopeFilter(req, {})

  if (status && ['pending', 'approved', 'in_progress', 'completed', 'rejected'].includes(status)) {
    filter.status = status
  }

  if (equipment_id) {
    filter.$or = [
      { equipment_id },
      { 'equipment_items.equipment_id': equipment_id },
    ]
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1)
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100)

  const [items, total] = await Promise.all([
    RepairRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    RepairRequest.countDocuments(filter),
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

exports.detail = asyncHandler(async (req, res) => {
  const { id } = req.params
  const filter = buildScopeFilter(req, { _id: id })

  const item = await RepairRequest.findOne(filter).lean()
  if (!item) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  res.json({ status: 'success', data: item })
})

exports.create = asyncHandler(async (req, res) => {
  const { equipment_id, problem_detail } = req.body

  if (!equipment_id || !problem_detail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const equipment = await Equipment.findById(equipment_id).lean()
  if (!equipment) {
    return res.status(404).json({ error: 'Equipment not found' })
  }

  const repair = await RepairRequest.create({
    equipment_id,
    equipment_eqid: equipment.eqid,
    equipment_asset_code: equipment.asset_code || '',
    equipment_name: equipment.name,
    department_name: req.user.department_name || equipment.department_name,
    problem_detail,
    status: 'pending',
    requested_by: req.user.username,
  })

  // Set equipment status to ชำรุด
  await Equipment.findByIdAndUpdate(equipment._id, {
    status: 'ชำรุด',
    updated_by: req.user.username,
  })

  await AuditLog.create({
    action: 'create',
    module: 'repair',
    target_collection: 'repair_requests',
    target_id: String(repair._id),
    message: `Create repair request for equipment ${equipment.eqid}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: repair.toObject(),
  })

  res.status(201).json({ status: 'success', data: repair })
})

exports.updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status: newStatus, rejection_equipment_status } = req.body

  const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected']
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid status' })
  }
  if (
    newStatus === 'rejected' &&
    rejection_equipment_status &&
    !['ชำรุด', 'รอตัดจำหน่าย'].includes(rejection_equipment_status)
  ) {
    return res.status(400).json({ error: 'Invalid rejection_equipment_status' })
  }

  const filter = buildScopeFilter(req, { _id: id })
  const repair = await RepairRequest.findOneAndUpdate(
    filter,
    {
      status: newStatus,
      ...(newStatus === 'approved' && { approved_by: req.user.username }),
      ...(newStatus === 'completed' && { completed_at: new Date() }),
    },
    { new: true }
  )

  if (!repair) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  // ─── Sync equipment status ────────────────────────────────────────────
  let newEquipmentStatus = null
  if (newStatus === 'approved') newEquipmentStatus = 'อยู่ระหว่างซ่อม'
  else if (newStatus === 'completed') newEquipmentStatus = 'ใช้งานได้'
  else if (newStatus === 'rejected') newEquipmentStatus = rejection_equipment_status || 'ชำรุด'

  if (newEquipmentStatus) {
    if (repair.is_bulk && repair.equipment_items.length > 0) {
      const ids = repair.equipment_items.map((e) => e.equipment_id).filter(Boolean)
      await Equipment.updateMany(
        { _id: { $in: ids } },
        { status: newEquipmentStatus, updated_by: req.user.username }
      )
    } else if (repair.equipment_id) {
      await Equipment.findByIdAndUpdate(repair.equipment_id, {
        status: newEquipmentStatus,
        updated_by: req.user.username,
      })
    }
  }
  // ─────────────────────────────────────────────────────────────────────

  await AuditLog.create({
    action: 'update',
    module: 'repair',
    target_collection: 'repair_requests',
    target_id: String(repair._id),
    message: `Update repair status to ${newStatus}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: repair.toObject(),
  })

  res.json({ status: 'success', data: repair })
})

exports.createBulk = asyncHandler(async (req, res) => {
  const { equipment_codes, problem_detail } = req.body

  if (!Array.isArray(equipment_codes) || equipment_codes.length === 0) {
    return res.status(400).json({ error: 'equipment_codes must be a non-empty array' })
  }
  if (!problem_detail) {
    return res.status(400).json({ error: 'problem_detail is required' })
  }

  // Scope filter: non-admin sees only their department
  const deptFilter = req.user.role === 'admin' ? {} : { department_name: req.user.department_name }

  const codes = equipment_codes.map((c) => String(c).trim()).filter(Boolean)

  // Look up all equipment matching any of the codes (eqid or asset_code)
  const found = await Equipment.find({
    ...deptFilter,
    deleted_at: null,
    $or: [
      { eqid: { $in: codes } },
      { asset_code: { $in: codes } },
    ],
  }).lean()

  const foundCodes = new Set([
    ...found.map((e) => e.eqid),
    ...found.map((e) => e.asset_code),
  ])
  const notFound = codes.filter((c) => !foundCodes.has(c))

  if (found.length === 0) {
    return res.status(404).json({ error: 'No matching equipment found', not_found: notFound })
  }

  // Create ONE repair request with equipment_items array
  const repair = await RepairRequest.create({
    is_bulk: true,
    equipment_id: found[0]._id,
    equipment_eqid: found.map((e) => e.eqid).join(', '),
    equipment_asset_code: found.map((e) => e.asset_code).join(', '),
    equipment_name: `แจ้งซ่อมหลายรายการ (${found.length} รายการ)`,
    department_name: req.user.department_name || found[0].department_name,
    problem_detail,
    status: 'pending',
    requested_by: req.user.username,
    equipment_items: found.map((e) => ({
      equipment_id: e._id,
      asset_code: e.asset_code || '',
      eqid: e.eqid || '',
      name: e.name || '',
      equipment_type_name: e.equipment_type_name || '',
      department_name: e.department_name || '',
    })),
  })

  // Set all equipment to ชำรุด
  await Equipment.updateMany(
    { _id: { $in: found.map((e) => e._id) } },
    { status: 'ชำรุด', updated_by: req.user.username }
  )

  await AuditLog.create({
    action: 'create',
    module: 'repair',
    target_collection: 'repair_requests',
    target_id: String(repair._id),
    message: `Bulk create repair request for ${found.length} equipment(s)`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: { count: found.length, not_found: notFound },
  })

  res.status(201).json({ status: 'success', data: repair, not_found: notFound })
})

exports.addRepairResult = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Parse fields from body (multipart/form-data)
  const repairer = String(req.body.repairer || '').trim()
  const repair_note = String(req.body.repair_note || '').trim()
  const repair_result = String(req.body.repair_result || '').trim()

  let repair_items = []
  if (req.body.repair_items) {
    try {
      repair_items = JSON.parse(req.body.repair_items)
      if (!Array.isArray(repair_items)) repair_items = []
      repair_items = repair_items.map((item) => ({
        description: String(item.description || '').trim(),
        quantity: Math.max(0, Number(item.quantity) || 0),
        price: Math.max(0, Number(item.price) || 0),
      }))
    } catch (e) {
      repair_items = []
    }
  }

  const repair_total_price = repair_items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )

  // Save uploaded files
  const repair_attachments = []
  if (req.files && req.files.length > 0) {
    const folderAbs = buildUploadAbsolutePath('repairs', id)
    ensureDirSync(folderAbs)

    for (const file of req.files) {
      const ext = path.extname(file.originalname) || ''
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
      const absPath = path.join(folderAbs, safeName)
      fs.writeFileSync(absPath, file.buffer)
      repair_attachments.push({
        filename: file.originalname,
        path: buildUploadPublicPath('repairs', id, safeName),
        mime_type: file.mimetype,
        size: file.size,
      })
    }
  }

  const filter = buildScopeFilter(req, { _id: id })
  const updatePayload = {
    status: 'completed',
    completed_at: new Date(),
    ...(repairer && { repairer }),
    ...(repair_result && { repair_result }),
    ...(repair_items.length > 0 && { repair_items, repair_total_price }),
    ...(repair_note && { repair_note }),
    ...(repair_attachments.length > 0 && { repair_attachments }),
  }

  const repair = await RepairRequest.findOneAndUpdate(filter, updatePayload, { new: true })

  if (!repair) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  await AuditLog.create({
    action: 'update',
    module: 'repair',
    target_collection: 'repair_requests',
    target_id: String(repair._id),
    message: 'Add repair result and mark as completed',
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: repair.toObject(),
  })

  res.json({ status: 'success', data: repair })
})

exports.deleteRepairs = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }

  const { ids, reason } = req.body

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' })
  }
  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'reason is required' })
  }

  const repairs = await RepairRequest.find({ _id: { $in: ids }, deleted_at: null }).lean()
  if (repairs.length === 0) {
    return res.status(404).json({ error: 'No matching repair requests found' })
  }

  await RepairRequest.updateMany(
    { _id: { $in: repairs.map((r) => r._id) } },
    { deleted_at: new Date() }
  )

  // คืนสถานะครุภัณฑ์เป็น ใช้งานได้
  const equipmentIds = []
  for (const r of repairs) {
    if (r.is_bulk && r.equipment_items && r.equipment_items.length > 0) {
      r.equipment_items.forEach((e) => e.equipment_id && equipmentIds.push(e.equipment_id))
    } else if (r.equipment_id) {
      equipmentIds.push(r.equipment_id)
    }
  }
  if (equipmentIds.length > 0) {
    await Equipment.updateMany(
      { _id: { $in: equipmentIds } },
      { status: 'ใช้งานได้', updated_by: req.user.username }
    )
  }

  await AuditLog.create({
    action: 'delete',
    module: 'repair',
    target_collection: 'repair_requests',
    target_id: repairs.map((r) => String(r._id)).join(','),
    message: `Admin deleted ${repairs.length} repair request(s). Reason: ${reason}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: { deleted_count: repairs.length, reason },
  })

  res.json({ status: 'success', deleted_count: repairs.length })
})
