const asyncHandler = require('../utils/asyncHandler')
const { Department, Equipment, Material } = require('../models')

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.list = asyncHandler(async (req, res) => {
  const departments = await Department.find({ deleted_at: null })
    .sort({ name: 1 })
    .lean()

  res.json({
    status: 'success',
    data: departments,
  })
})

// @desc    Create department
// @route   POST /api/departments
// @access  Admin
exports.create = asyncHandler(async (req, res) => {
  const { name, code } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหน่วยงาน' })
  }

  const exists = await Department.findOne({ name: name.trim(), deleted_at: null })
  if (exists) {
    return res.status(409).json({ error: 'ชื่อหน่วยงานนี้มีอยู่แล้ว' })
  }

  const dept = await Department.create({ name: name.trim(), code: code?.trim().toUpperCase() || undefined })
  res.status(201).json({ status: 'success', data: dept })
})

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Admin
exports.update = asyncHandler(async (req, res) => {
  const { name, code } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหน่วยงาน' })
  }

  const dept = await Department.findOne({ _id: req.params.id, deleted_at: null })
  if (!dept) return res.status(404).json({ error: 'ไม่พบหน่วยงาน' })

  const conflict = await Department.findOne({ name: name.trim(), deleted_at: null, _id: { $ne: dept._id } })
  if (conflict) return res.status(409).json({ error: 'ชื่อหน่วยงานนี้มีอยู่แล้ว' })

  const oldName = dept.name
  dept.name = name.trim()
  if (code !== undefined) dept.code = code?.trim().toUpperCase() || dept.code
  await dept.save()

  // อัปเดต department_name ใน equipment และ material (ถ้าชื่อเปลี่ยน)
  if (oldName !== dept.name) {
    await Promise.all([
      Equipment.updateMany({ department_name: oldName }, { $set: { department_name: dept.name } }),
      Material.updateMany({ department_name: oldName }, { $set: { department_name: dept.name } }),
    ])
  }

  res.json({ status: 'success', data: dept })
})

// @desc    Delete department (soft delete, check in-use)
// @route   DELETE /api/departments/:id
// @access  Admin
exports.remove = asyncHandler(async (req, res) => {
  const dept = await Department.findOne({ _id: req.params.id, deleted_at: null })
  if (!dept) return res.status(404).json({ error: 'ไม่พบหน่วยงาน' })

  const [eqCount, matCount] = await Promise.all([
    Equipment.countDocuments({ department_name: dept.name, deleted_at: null }),
    Material.countDocuments({ department_name: dept.name, deleted_at: null }),
  ])

  if (eqCount > 0 || matCount > 0) {
    return res.status(409).json({
      error: `ไม่สามารถลบได้ เนื่องจากมีการใช้งานอยู่ (ครุภัณฑ์ ${eqCount} รายการ, วัสดุ ${matCount} รายการ)`,
    })
  }

  dept.deleted_at = new Date()
  await dept.save()
  res.json({ status: 'success', message: 'ลบหน่วยงานสำเร็จ' })
})

