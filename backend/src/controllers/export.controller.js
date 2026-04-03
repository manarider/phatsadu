const XLSX = require('xlsx')
const asyncHandler = require('../utils/asyncHandler')
const { Equipment, Material, RepairRequest } = require('../models')
const { buildScopeFilter } = require('../middlewares')

// @desc    Export equipment data to Excel
// @route   GET /api/export/equipment
// @access  Private
exports.exportEquipment = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, {})
  const items = await Equipment.find(filter).lean()

  const worksheetData = items.map((item) => ({
    'รหัสครุภัณฑ์': item.eqid || '',
    'รหัสทรัพย์สิน': item.asset_code || '',
    'ชื่อครุภัณฑ์': item.name || '',
    'ประเภท': item.equipment_type_name || '',
    'ซีเรียลนัมเบอร์': item.serial_number || '',
    'หน่วยงาน': item.department_name || '',
    'ที่ตั้ง': item.location || '',
    'ผู้ดูแล': item.custodian_name || '',
    'สถานะ': item.status || '',
    'ราคา': item.price || 0,
    'วันที่ได้มา': item.acquired_date ? new Date(item.acquired_date).toLocaleDateString('th-TH') : '',
    'หมายเหตุ': item.note || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ครุภัณฑ์')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=equipment-export.xlsx')
  res.send(buffer)
})

// @desc    Export material data to Excel
// @route   GET /api/export/material
// @access  Private
exports.exportMaterial = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, {})
  const items = await Material.find(filter).lean()

  const worksheetData = items.map((item) => ({
    'ชื่อวัสดุ': item.name || '',
    'ประเภท': item.material_type_name || '',
    'หน่วยนับ': item.unit || '',
    'จำนวนคงเหลือ': item.quantity || 0,
    'จำนวนขั้นต่ำ': item.min_quantity || 0,
    'สถานะ': item.quantity > item.min_quantity ? 'พอ' : 'น้อย',
    'หน่วยงาน': item.department_name || '',
    'หมายเหตุ': item.note || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'วัสดุ')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=material-export.xlsx')
  res.send(buffer)
})

// @desc    Export repair request data to Excel
// @route   GET /api/export/repair
// @access  Private
exports.exportRepair = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, {})
  const items = await RepairRequest.find(filter).lean()

  const worksheetData = items.map((item) => ({
    'รหัสครุภัณฑ์': item.equipment_eqid || '',
    'ชื่อครุภัณฑ์': item.equipment_name || '',
    'รายละเอียดปัญหา': item.problem_detail || '',
    'สถานะ': item.status || '',
    'หน่วยงาน': item.department_name || '',
    'ผู้แจ้ง': item.requested_by || '',
    'วันที่แจ้ง': item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : '',
    'ผู้อนุมัติ': item.approved_by || '',
    'ผลการซ่อม': item.repair_result || '',
    'ผู้ซ่อม/ร้านซ่อม': item.repairer || '',
    'รายการซ่อม': Array.isArray(item.repair_items) && item.repair_items.length > 0
      ? item.repair_items.map((r) => `${r.description} (${r.quantity} x ${r.price} บ.)`).join(', ')
      : '',
    'ราคารวม (บาท)': item.repair_total_price != null ? item.repair_total_price : '',
    'หมายเหตุ': item.repair_note || '',
    'วันที่เสร็จ': item.completed_at ? new Date(item.completed_at).toLocaleDateString('th-TH') : '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'แจ้งซ่อม')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=repair-export.xlsx')
  res.send(buffer)
})
