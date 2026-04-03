/**
 * PAPP Seed Script
 * สร้างข้อมูลตั้งต้น: Departments, Equipment Types, Material Types,
 * System Settings, และข้อมูลตัวอย่างสำหรับทดสอบ (ครุภัณฑ์ + วัสดุ)
 *
 * ใช้: npm run seed        → seed ข้อมูลตั้งต้น + ตัวอย่าง
 *      npm run seed:clean  → ลบข้อมูลตัวอย่าง (คงไว้เฉพาะ master data)
 */

require('dotenv').config()
const mongoose = require('mongoose')

const {
  Department,
  EquipmentType,
  MaterialType,
  Equipment,
  Material,
  MaterialTransaction,
  SystemSetting,
  Counter,
} = require('./src/models')

const { SYSTEM_SETTING_DEFAULTS } = require('./src/utils/constants')

// ─── Master Data ───────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { name: 'สำนักปลัดเทศบาล',                 code: 'SPT' },
  { name: 'สำนักการศึกษา',                    code: 'SKS' },
  { name: 'สำนักคลัง',                        code: 'SKL' },
  { name: 'สำนักสาธารณสุขและสิ่งแวดล้อม',      code: 'SSS' },
  { name: 'สำนักช่าง',                        code: 'SCH' },
  { name: 'สำนักการประปา',                    code: 'SKP' },
  { name: 'กองยุทธศาสตร์และงบประมาณ',          code: 'GYN' },
  { name: 'กองสวัสดิการสังคม',                 code: 'GSS' },
  { name: 'กองสารสนเทศภาษีและทะเบียนทรัพย์สิน', code: 'GST' },
  { name: 'กองการเจ้าหน้าที่',                 code: 'GJH' },
  { name: 'หน่วยตรวจสอบภายใน',                 code: 'HTB' },
]

const EQUIPMENT_TYPES = [
  { name: 'ครุภัณฑ์สำนักงาน',           code: 'OFF' },
  { name: 'ครุภัณฑ์ยานพาหนะและขนส่ง',    code: 'VEH' },
  { name: 'ครุภัณฑ์ไฟฟ้าและวิทยุ',       code: 'ELE' },
  { name: 'ครุภัณฑ์โฆษณาและเผยแพร่',     code: 'PUB' },
  { name: 'ครุภัณฑ์การเกษตร',            code: 'AGR' },
  { name: 'ครุภัณฑ์ก่อสร้าง',            code: 'CON' },
  { name: 'ครุภัณฑ์การแพทย์',            code: 'MED' },
  { name: 'ครุภัณฑ์วิทยาศาสตร์',         code: 'SCI' },
  { name: 'ครุภัณฑ์การศึกษา',            code: 'EDU' },
  { name: 'ครุภัณฑ์คอมพิวเตอร์',         code: 'COM' },
  { name: 'ครุภัณฑ์สนาม',               code: 'FLD' },
  { name: 'ครุภัณฑ์ดนตรีและนาฏศิลป์',    code: 'MUS' },
  { name: 'ครุภัณฑ์กีฬา',               code: 'SPT' },
  { name: 'ครุภัณฑ์โรงงาน',             code: 'FAC' },
  { name: 'ครุภัณฑ์อื่น',               code: 'OTH' },
]

const MATERIAL_TYPES = [
  'วัสดุสำนักงาน',
  'วัสดุไฟฟ้าและวิทยุ',
  'วัสดุงานบ้านงานครัว',
  'วัสดุก่อสร้าง',
  'วัสดุยานพาหนะและขนส่ง',
  'วัสดุเชื้อเพลิงและหล่อลื่น',
  'วัสดุวิทยาศาสตร์หรือการแพทย์',
  'วัสดุการเกษตร',
  'วัสดุโฆษณาและเผยแพร่',
  'วัสดุเครื่องแต่งกาย',
  'วัสดุการศึกษา',
  'วัสดุคอมพิวเตอร์',
  'วัสดุสนาม',
  'วัสดุดนตรีและนาฏศิลป์',
  'วัสดุกีฬา',
  'วัสดุเครื่องดับเพลิง',
  'วัสดุโรงงาน',
  'วัสดุอาวุธยุทธภัณฑ์',
  'วัสดุอื่น',
]

// ─── Sample Data สำหรับทดสอบ ────────────────────────────────────────────────

const SAMPLE_EQUIPMENT = [
  {
    asset_code: '416-66-0001',
    name: 'คอมพิวเตอร์โน้ตบุ๊ก DELL Inspiron 15',
    serial_number: 'DLLNB66001',
    equipment_type_code: 'COM',
    department_name: 'สำนักปลัดเทศบาล',
    location: 'ห้องสำนักปลัด ชั้น 2',
    price: 28900,
    custodian_name: 'นายสมชาย ใจดี',
    acquired_date: new Date('2023-10-01'),
    status: 'ใช้งานได้',
  },
  {
    asset_code: '416-66-0002',
    name: 'เครื่องพิมพ์ HP LaserJet Pro M404dn',
    serial_number: 'HPLJ66002',
    equipment_type_code: 'COM',
    department_name: 'สำนักปลัดเทศบาล',
    location: 'ห้องธุรการ ชั้น 1',
    price: 9500,
    custodian_name: 'น.ส.สมหญิง รักงาน',
    acquired_date: new Date('2023-10-01'),
    status: 'ใช้งานได้',
  },
  {
    asset_code: '416-65-0001',
    name: 'โต๊ะทำงาน 3 ลิ้นชัก',
    serial_number: '',
    equipment_type_code: 'OFF',
    department_name: 'สำนักคลัง',
    location: 'ห้องบัญชี ชั้น 3',
    price: 5200,
    custodian_name: 'นายวิชัย มีสุข',
    acquired_date: new Date('2022-05-15'),
    status: 'ใช้งานได้',
  },
  {
    asset_code: '416-65-0002',
    name: 'รถยนต์นั่งส่วนกลาง TOYOTA Fortuner',
    serial_number: 'TYF65004',
    equipment_type_code: 'VEH',
    department_name: 'สำนักปลัดเทศบาล',
    location: 'ลานจอดรถ อาคาร A',
    price: 1850000,
    custodian_name: 'นายประสิทธิ์ ขับดี',
    acquired_date: new Date('2022-03-01'),
    status: 'อยู่ระหว่างซ่อม',
  },
  {
    asset_code: '416-66-0010',
    name: 'จอมอนิเตอร์ Dell 24 นิ้ว',
    serial_number: 'DLLM24010',
    equipment_type_code: 'COM',
    department_name: 'สำนักการศึกษา',
    location: 'ห้องคอมพิวเตอร์ ชั้น 2',
    price: 8500,
    custodian_name: 'น.ส.กมลพร สุขใจ',
    acquired_date: new Date('2023-11-01'),
    status: 'ใช้งานได้',
  },
]

const SAMPLE_MATERIALS = [
  {
    name: 'กระดาษ A4 80g',
    type_name: 'วัสดุสำนักงาน',
    department_name: 'สำนักปลัดเทศบาล',
    unit: 'รีม',
    quantity: 45,
    min_quantity: 10,
    note: 'ใช้สำหรับเครื่องพิมพ์สำนักงาน',
  },
  {
    name: 'หมึกพิมพ์ HP 85A',
    type_name: 'วัสดุคอมพิวเตอร์',
    department_name: 'สำนักปลัดเทศบาล',
    unit: 'กล่อง',
    quantity: 3,
    min_quantity: 5,   // ต่ำกว่าขั้นต่ำ → จะแสดงใน low stock alert
    note: 'สำหรับ HP LaserJet Pro M404dn',
  },
  {
    name: 'ปากกาลูกลื่นน้ำเงิน',
    type_name: 'วัสดุสำนักงาน',
    department_name: 'สำนักปลัดเทศบาล',
    unit: 'ด้าม',
    quantity: 120,
    min_quantity: 20,
    note: '',
  },
  {
    name: 'กระดาษ A4 80g',
    type_name: 'วัสดุสำนักงาน',
    department_name: 'สำนักคลัง',
    unit: 'รีม',
    quantity: 8,
    min_quantity: 10,   // ต่ำกว่าขั้นต่ำ
    note: '',
  },
  {
    name: 'หลอดไฟ LED 18W',
    type_name: 'วัสดุไฟฟ้าและวิทยุ',
    department_name: 'สำนักช่าง',
    unit: 'หลอด',
    quantity: 30,
    min_quantity: 10,
    note: 'ขนาด E27',
  },
  {
    name: 'สายไฟ VCT 2x1.5',
    type_name: 'วัสดุไฟฟ้าและวิทยุ',
    department_name: 'สำนักช่าง',
    unit: 'เมตร',
    quantity: 200,
    min_quantity: 50,
    note: '',
  },
  {
    name: 'น้ำยาทำความสะอาดพื้น',
    type_name: 'วัสดุงานบ้านงานครัว',
    department_name: 'สำนักสาธารณสุขและสิ่งแวดล้อม',
    unit: 'แกลลอน',
    quantity: 2,
    min_quantity: 5,   // ต่ำกว่าขั้นต่ำ
    note: '',
  },
  {
    name: 'ดินสอ 2B',
    type_name: 'วัสดุสำนักงาน',
    department_name: 'สำนักการศึกษา',
    unit: 'แท่ง',
    quantity: 200,
    min_quantity: 50,
    note: 'สำหรับนักเรียน',
  },
]

// ─── Helper Functions ─────────────────────────────────────────────────────────

async function getOrCreateCounter(key) {
  const current = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 0 } },
    { upsert: true, new: true }
  )
  return current.seq
}

async function getNextSeqForType(typeCode, yearSuffix) {
  const key = `eqid_${typeCode}_${yearSuffix}`
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return doc.seq
}

function thaiYearSuffix() {
  return String(new Date().getFullYear() + 543).slice(-2)
}

function buildEqid(code, seq) {
  const year = thaiYearSuffix()
  return `${code}-${year}-${String(seq).padStart(4, '0')}`
}

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function seedDepartments() {
  let created = 0
  let updated = 0
  for (const dept of DEPARTMENTS) {
    const result = await Department.findOneAndUpdate(
      { $or: [{ code: dept.code }, { name: dept.name }] },
      { $setOnInsert: { name: dept.name, code: dept.code, is_active: true, deleted_at: null } },
      { upsert: true, new: false }
    )
    if (!result) created++
    else updated++
  }
  console.log(`  Departments: ${created} created, ${updated} already existed`)
}

async function seedEquipmentTypes() {
  let created = 0
  let updated = 0
  for (const type of EQUIPMENT_TYPES) {
    const result = await EquipmentType.findOneAndUpdate(
      { $or: [{ code: type.code }, { name: type.name }] },
      { $setOnInsert: { name: type.name, code: type.code, is_active: true, deleted_at: null } },
      { upsert: true, new: false }
    )
    if (!result) created++
    else updated++
  }
  console.log(`  Equipment Types: ${created} created, ${updated} already existed`)
}

async function seedMaterialTypes() {
  let created = 0
  let updated = 0
  for (const name of MATERIAL_TYPES) {
    const result = await MaterialType.findOneAndUpdate(
      { name },
      { $setOnInsert: { name, is_active: true, deleted_at: null } },
      { upsert: true, new: false }
    )
    if (!result) created++
    else updated++
  }
  console.log(`  Material Types: ${created} created, ${updated} already existed`)
}

async function seedSystemSettings() {
  await SystemSetting.seedDefaults('seed-script')
  console.log(`  System Settings: ${Object.keys(SYSTEM_SETTING_DEFAULTS).length} settings ensured`)
}

async function seedSampleEquipment() {
  let created = 0
  let skipped = 0
  const yearSuffix = thaiYearSuffix()

  for (const item of SAMPLE_EQUIPMENT) {
    const exists = await Equipment.findOne({ asset_code: item.asset_code, deleted_at: null })
    if (exists) {
      skipped++
      continue
    }

    const typeDoc = await EquipmentType.findOne({ code: item.equipment_type_code, deleted_at: null })
    if (!typeDoc) {
      console.warn(`    ⚠ Equipment type code "${item.equipment_type_code}" not found, skipping ${item.asset_code}`)
      skipped++
      continue
    }

    const seq = await getNextSeqForType(typeDoc.code, yearSuffix)
    const eqid = buildEqid(typeDoc.code, seq)

    const { equipment_type_code, ...rest } = item
    await Equipment.create({
      ...rest,
      eqid,
      equipment_type_id: typeDoc._id,
      equipment_type_name: typeDoc.name,
      created_by: 'seed-script',
    })
    created++
  }
  console.log(`  Sample Equipment: ${created} created, ${skipped} skipped`)
}

async function seedSampleMaterials() {
  let created = 0
  let skipped = 0

  for (const item of SAMPLE_MATERIALS) {
    const exists = await Material.findOne({
      name: item.name,
      department_name: item.department_name,
      deleted_at: null,
    })
    if (exists) {
      skipped++
      continue
    }

    const typeDoc = await MaterialType.findOne({ name: item.type_name, deleted_at: null })
    if (!typeDoc) {
      console.warn(`    ⚠ Material type "${item.type_name}" not found, skipping "${item.name}"`)
      skipped++
      continue
    }

    const { type_name, ...rest } = item
    const material = await Material.create({
      ...rest,
      material_type_id: typeDoc._id,
      material_type_name: typeDoc.name,
      created_by: 'seed-script',
    })

    // สร้าง Transaction: receive สำหรับยอดเริ่มต้น
    if (item.quantity > 0) {
      await MaterialTransaction.create({
        material_id: material._id,
        material_name: material.name,
        department_name: material.department_name,
        type: 'receive',
        quantity: item.quantity,
        quantity_before: 0,
        quantity_after: item.quantity,
        reason: 'ยอดยกมาตอนเริ่มต้นระบบ',
        status: 'approved',
        requested_by: 'seed-script',
        approved_by: 'seed-script',
        approved_at: new Date(),
      })
    }
    created++
  }
  console.log(`  Sample Materials: ${created} created, ${skipped} skipped (with receive transactions)`)
}

async function cleanSampleData() {
  const eqDeleted = await Equipment.updateMany(
    { created_by: 'seed-script' },
    { $set: { deleted_at: new Date() } }
  )
  const matDeleted = await Material.updateMany(
    { created_by: 'seed-script' },
    { $set: { deleted_at: new Date() } }
  )
  console.log(`🧹 Cleaned: ${eqDeleted.modifiedCount} equipment, ${matDeleted.modifiedCount} materials (soft deleted)`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const isClean = process.argv.includes('--clean')

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('✅ MongoDB connected\n')

    if (isClean) {
      console.log('🧹 Cleaning sample data...')
      await cleanSampleData()
      console.log('\n✅ Clean complete!')
      return
    }

    console.log('📦 Seeding master data...')
    await seedDepartments()
    await seedEquipmentTypes()
    await seedMaterialTypes()
    await seedSystemSettings()

    console.log('\n🧪 Seeding sample data for testing...')
    await seedSampleEquipment()
    await seedSampleMaterials()

    // สรุปผล
    const counts = await Promise.all([
      Department.countDocuments({ deleted_at: null }),
      EquipmentType.countDocuments({ deleted_at: null }),
      MaterialType.countDocuments({ deleted_at: null }),
      Equipment.countDocuments({ deleted_at: null }),
      Material.countDocuments({ deleted_at: null }),
    ])

    console.log('\n📊 Summary:')
    console.log(`  Departments:     ${counts[0]}`)
    console.log(`  Equipment Types: ${counts[1]}`)
    console.log(`  Material Types:  ${counts[2]}`)
    console.log(`  Equipments:      ${counts[3]}`)
    console.log(`  Materials:       ${counts[4]}`)
    console.log('\n✅ Seed complete! พร้อมทดสอบ CRUD แล้วครับ')
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

main()
