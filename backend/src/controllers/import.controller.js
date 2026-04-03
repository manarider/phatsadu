const XLSX = require('xlsx')
const asyncHandler = require('../utils/asyncHandler')
const { Equipment, EquipmentType, Material, MaterialType, Department } = require('../models')
const { generateEqid } = require('../services/eqid.service')
const { EQUIPMENT_STATUSES } = require('../utils/constants')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * ดึงตัวเลขกลุ่มสุดท้ายจาก string แล้ว parse เป็น int (ตัด leading zero)
 * "INV-2024-0001" → 1,  "ABC-57-003" → 3,  "0042" → 42
 */
function extractTrailingNumber(code) {
  const m = String(code).match(/(\d+)(?![\d])/)
  if (!m) return null
  // หา last group ด้วย global match แล้วเอาตัวสุดท้าย
  const all = String(code).match(/\d+/g)
  if (!all) return null
  return parseInt(all[all.length - 1], 10)
}

/**
 * ทำ map lowercase → original name  สำหรับ case-insensitive lookup
 */
function buildCaseInsensitiveMap(items) {
  const map = new Map()
  items.forEach((item) => map.set(item.name.trim().toLowerCase(), item))
  return map
}

/**
 * แปลงวันที่ รูปแบบ dd/mm/yyyy (พ.ศ.) → JS Date (ค.ศ.)
 * ตัวอย่าง: "15/04/2568" → new Date(2025, 3, 15)
 * รองรับ: dd/mm/yyyy, d/m/yyyy (พ.ศ.) หรือ yyyy-mm-dd (ค.ศ.) ด้วย
 * คืน null ถ้า parse ไม่ได้
 */
function parseThaiDate(raw) {
  const s = String(raw).trim()
  if (!s) return null

  // รูปแบบ dd/mm/yyyy (พ.ศ.)
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10)
    const m = parseInt(dmyMatch[2], 10)
    let y = parseInt(dmyMatch[3], 10)
    if (y > 2500) y -= 543 // แปลง พ.ศ. → ค.ศ.
    if (m < 1 || m > 12 || d < 1 || d > 31) return null
    const date = new Date(y, m - 1, d)
    return isNaN(date.getTime()) ? null : date
  }

  // รูปแบบ yyyy-mm-dd (ค.ศ. ปกติ)
  const isoMatch = s.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    const date = new Date(s)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

// ─── Equipment Template ───────────────────────────────────────────────────────

exports.downloadEquipmentTemplate = asyncHandler(async (req, res) => {
  const headers = [
    'รหัสครุภัณฑ์*',
    'ชื่อครุภัณฑ์*',
    'ประเภทครุภัณฑ์*',
    'ที่ตั้ง*',
    'ราคา*',
    'วันที่ได้มา* (วว/ดด/พ.ศ.)',
    'ซีเรียลนัมเบอร์',
    'ผู้ดูแล',
    'รายละเอียด',
    'โครงการ',
    'หมายเหตุ',
    'หน่วยงาน (admin เท่านั้น)',
    'สถานะ (ใช้งานได้/ชำรุด/อยู่ระหว่างซ่อม/รอตัดจำหน่าย/จำหน่ายแล้ว)',
  ]
  const example = [
    'INV-2024-0001',
    'คอมพิวเตอร์โน้ตบุ๊ค',
    'คอมพิวเตอร์',
    'ห้อง 101',
    '25000',
    '15/01/2568',
    'SN123456',
    'นายสมชาย',
    'สำหรับงานออฟฟิศ',
    'โครงการพัฒนาระบบ',
    '',
    'สำนักการคลัง',
    'ใช้งานได้',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ครุภัณฑ์')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=equipment-import-template.xlsx')
  res.send(buffer)
})

// ─── Import Equipment ─────────────────────────────────────────────────────────

exports.importEquipment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'กรุณาอัปโหลดไฟล์ Excel (.xlsx)' })
  }

  let rows
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } catch {
    return res.status(400).json({ error: 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์' })
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'ไฟล์ไม่มีข้อมูล' })
  }

  // ─── Pre-load lookup data ────────────────────────────────────────────────
  const [allTypes, allDepts, existingEquipment] = await Promise.all([
    EquipmentType.find({ deleted_at: null }).lean(),
    Department.find({ deleted_at: null }).lean(),
    Equipment.find({ deleted_at: null }, { asset_code: 1 }).lean(),
  ])

  const typeMap = buildCaseInsensitiveMap(allTypes)
  const deptMap = buildCaseInsensitiveMap(allDepts)

  // สร้าง Set ของ asset_code ที่มีอยู่ใน DB (case-insensitive)
  const existingAssetCodes = new Set(
    existingEquipment.map((e) => String(e.asset_code).trim().toLowerCase())
  )

  // ตรวจ non-admin ว่าหน่วยงานของตัวเองมีใน DB
  const results = { total: rows.length, success: 0, skipped: 0, errors: [] }

  // Set สำหรับตรวจ duplicate ภายในไฟล์เดียวกัน
  const seenAssetCodes = new Set()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const assetCode = String(row['รหัสครุภัณฑ์*'] || '').trim()
    const name = String(row['ชื่อครุภัณฑ์*'] || '').trim()
    const typeName = String(row['ประเภทครุภัณฑ์*'] || '').trim()
    const location = String(row['ที่ตั้ง*'] || '').trim()
    const price = Number(row['ราคา*'] || 0)
    const acquiredDateRaw = String(row['วันที่ได้มา* (วว/ดด/พ.ศ.)'] || '').trim()
    const statusRaw = String(row['สถานะ (ใช้งานได้/ชำรุด/อยู่ระหว่างซ่อม/รอตัดจำหน่าย/จำหน่ายแล้ว)'] || '').trim()
    const status = statusRaw || 'ใช้งานได้'

    if (!assetCode || !name || !typeName || !location || !acquiredDateRaw) {
      results.errors.push({
        row: rowNum,
        assetCode: assetCode || '-',
        message: 'ข้อมูลที่จำเป็นไม่ครบ (รหัสครุภัณฑ์, ชื่อ, ประเภท, ที่ตั้ง, วันที่ได้มา)',
      })
      continue
    }

    // ── ตรวจ asset_code ซ้ำ (เปรียบเทียบรหัสเต็ม) ──────────────────────
    const assetCodeKey = assetCode.toLowerCase()
    if (existingAssetCodes.has(assetCodeKey) || seenAssetCodes.has(assetCodeKey)) {
      results.errors.push({
        row: rowNum,
        assetCode,
        message: `รหัสครุภัณฑ์ "${assetCode}" ซ้ำกับที่มีอยู่แล้ว`,
      })
      continue
    }

    // ── ตรวจประเภทครุภัณฑ์ ──────────────────────────────────────────────
    const type = typeMap.get(typeName.toLowerCase())
    if (!type) {
      results.errors.push({
        row: rowNum,
        assetCode,
        message: `ไม่พบประเภทครุภัณฑ์ "${typeName}" ในระบบ`,
      })
      continue
    }

    // ── ตรวจหน่วยงาน ────────────────────────────────────────────────────
    const rawDept = String(row['หน่วยงาน (admin เท่านั้น)'] || '').trim()
    let resolvedDepartment
    if (req.user.role === 'admin') {
      const deptName = rawDept || req.user.department_name
      const deptRecord = deptMap.get(deptName.toLowerCase())
      if (!deptRecord) {
        results.errors.push({
          row: rowNum,
          assetCode,
          message: `ไม่พบหน่วยงาน "${deptName}" ในระบบ`,
        })
        continue
      }
      resolvedDepartment = deptRecord.name
    } else {
      const deptRecord = deptMap.get((req.user.department_name || '').toLowerCase())
      if (!deptRecord) {
        results.errors.push({
          row: rowNum,
          assetCode,
          message: `หน่วยงาน "${req.user.department_name}" ของคุณไม่พบในระบบ`,
        })
        continue
      }
      resolvedDepartment = deptRecord.name
    }

    // ── สร้างรายการ ──────────────────────────────────────────────────────
    const acquiredDate = parseThaiDate(acquiredDateRaw)
    if (!acquiredDate) {
      results.errors.push({
        row: rowNum,
        assetCode,
        message: `รูปแบบวันที่ไม่ถูกต้อง ใช้ วว/ดด/พ.ศ. เช่น 15/01/2568 (ได้รับ: "${acquiredDateRaw}")`,
      })
      continue
    }

    if (!EQUIPMENT_STATUSES.includes(status)) {
      results.errors.push({
        row: rowNum,
        assetCode,
        message: `สถานะ "${status}" ไม่ถูกต้อง ค่าที่ใช้ได้: ${EQUIPMENT_STATUSES.join(', ')}`,
      })
      continue
    }

    try {
      const eqid = await generateEqid(type.code)
      await Equipment.create({
        eqid,
        asset_code: assetCode,
        name,
        equipment_type_id: type._id,
        equipment_type_name: type.name,
        department_name: resolvedDepartment,
        location,
        price,
        acquired_date: acquiredDate,
        serial_number: String(row['ซีเรียลนัมเบอร์'] || '').trim(),
        custodian_name: String(row['ผู้ดูแล'] || '').trim(),
        description: String(row['รายละเอียด'] || '').trim(),
        project: String(row['โครงการ'] || '').trim(),
        note: String(row['หมายเหตุ'] || '').trim(),
        status,
        created_by: req.user.username,
        updated_by: req.user.username,
      })
      seenAssetCodes.add(assetCodeKey)
      results.success++
    } catch (err) {
      results.errors.push({ row: rowNum, assetCode, message: err.message })
    }
  }

  res.json({ status: 'success', data: results })
})


// ─── Material Template ────────────────────────────────────────────────────────

exports.downloadMaterialTemplate = asyncHandler(async (req, res) => {
  const headers = [
    'ชื่อวัสดุ*',
    'ประเภทวัสดุ*',
    'หน่วยนับ*',
    'จำนวน*',
    'จำนวนขั้นต่ำ*',
    'หมายเหตุ',
    'หน่วยงาน (admin เท่านั้น)',
  ]
  const example = ['กระดาษ A4', 'เครื่องเขียน', 'รีม', '50', '10', '', 'สำนักการคลัง']

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'วัสดุ')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=material-import-template.xlsx')
  res.send(buffer)
})

// ─── Import Material ──────────────────────────────────────────────────────────

exports.importMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'กรุณาอัปโหลดไฟล์ Excel (.xlsx)' })
  }

  let rows
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } catch {
    return res.status(400).json({ error: 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์' })
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'ไฟล์ไม่มีข้อมูล' })
  }

  // ─── Pre-load lookup data ────────────────────────────────────────────────
  const [allTypes, allDepts] = await Promise.all([
    MaterialType.find({ deleted_at: null }).lean(),
    Department.find({ deleted_at: null }).lean(),
  ])

  const typeMap = buildCaseInsensitiveMap(allTypes)
  const deptMap = buildCaseInsensitiveMap(allDepts)

  const results = { total: rows.length, success: 0, skipped: 0, errors: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const name = String(row['ชื่อวัสดุ*'] || '').trim()
    const typeName = String(row['ประเภทวัสดุ*'] || '').trim()
    const unit = String(row['หน่วยนับ*'] || '').trim()
    const quantity = Number(row['จำนวน*'] || 0)
    const minQuantity = Number(row['จำนวนขั้นต่ำ*'] || 0)

    if (!name || !typeName || !unit) {
      results.errors.push({
        row: rowNum,
        name: name || '-',
        message: 'ข้อมูลที่จำเป็นไม่ครบ (ชื่อวัสดุ, ประเภทวัสดุ, หน่วยนับ)',
      })
      continue
    }

    // ── ตรวจประเภทวัสดุ ──────────────────────────────────────────────────
    const type = typeMap.get(typeName.toLowerCase())
    if (!type) {
      results.errors.push({
        row: rowNum,
        name,
        message: `ไม่พบประเภทวัสดุ "${typeName}" ในระบบ`,
      })
      continue
    }

    // ── ตรวจหน่วยงาน ────────────────────────────────────────────────────
    const rawDept = String(row['หน่วยงาน (admin เท่านั้น)'] || '').trim()
    let resolvedDepartment
    if (req.user.role === 'admin') {
      const deptName = rawDept || req.user.department_name
      const deptRecord = deptMap.get((deptName || '').toLowerCase())
      if (!deptRecord) {
        results.errors.push({
          row: rowNum,
          name,
          message: `ไม่พบหน่วยงาน "${deptName}" ในระบบ`,
        })
        continue
      }
      resolvedDepartment = deptRecord.name
    } else {
      const deptRecord = deptMap.get((req.user.department_name || '').toLowerCase())
      if (!deptRecord) {
        results.errors.push({
          row: rowNum,
          name,
          message: `หน่วยงาน "${req.user.department_name}" ของคุณไม่พบในระบบ`,
        })
        continue
      }
      resolvedDepartment = deptRecord.name
    }

    // ── ตรวจซ้ำ (ชื่อ + หน่วยงาน) ──────────────────────────────────────
    const exists = await Material.findOne({
      name,
      department_name: resolvedDepartment,
      deleted_at: null,
    }).lean()
    if (exists) {
      results.errors.push({
        row: rowNum,
        name,
        message: `วัสดุ "${name}" มีอยู่แล้วในหน่วยงาน "${resolvedDepartment}"`,
      })
      continue
    }

    try {
      await Material.create({
        name,
        material_type_id: type._id,
        material_type_name: type.name,
        department_name: resolvedDepartment,
        unit,
        quantity,
        min_quantity: minQuantity,
        note: String(row['หมายเหตุ'] || '').trim(),
        created_by: req.user.username,
        updated_by: req.user.username,
      })
      results.success++
    } catch (err) {
      results.errors.push({ row: rowNum, name, message: err.message })
    }
  }

  res.json({ status: 'success', data: results })
})
