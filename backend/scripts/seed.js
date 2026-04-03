require('dotenv').config()
const mongoose = require('mongoose')
const { Department, EquipmentType, MaterialType, SystemSetting } = require('../src/models')

const DEPARTMENTS = [
  { name: 'สำนักปลัดเทศบาล', code: 'ADM' },
  { name: 'สำนักการศึกษา', code: 'EDU' },
  { name: 'สำนักคลัง', code: 'FIN' },
  { name: 'สำนักสาธารณสุขและสิ่งแวดล้อม', code: 'HEA' },
  { name: 'สำนักช่าง', code: 'ENG' },
  { name: 'สำนักการประปา', code: 'PWR' },
  { name: 'กองยุทธศาสตร์และงบประมาณ', code: 'STR' },
  { name: 'กองสวัสดิการสังคม', code: 'SOC' },
  { name: 'กองสารสนเทศภาษีและทะเบียนทรัพย์สิน', code: 'INFO' },
  { name: 'กองการเจ้าหน้าที่', code: 'PER' },
  { name: 'หน่วยตรวจสอบภายใน', code: 'AUDIT' },
]

const EQUIPMENT_TYPES = [
  { name: 'ครุภัณฑ์สำนักงาน', code: 'OFF' },
  { name: 'ครุภัณฑ์ยานพาหนะและขนส่ง', code: 'VEH' },
  { name: 'ครุภัณฑ์ไฟฟ้าและวิทยุ', code: 'ELE' },
  { name: 'ครุภัณฑ์โฆษณาและเผยแพร่', code: 'ADV' },
  { name: 'ครุภัณฑ์การเกษตร', code: 'AGR' },
  { name: 'ครุภัณฑ์ก่อสร้าง', code: 'BLD' },
  { name: 'ครุภัณฑ์การแพทย์', code: 'MED' },
  { name: 'ครุภัณฑ์วิทยาศาสตร์', code: 'SCI' },
  { name: 'ครุภัณฑ์การศึกษา', code: 'EDU' },
  { name: 'ครุภัณฑ์คอมพิวเตอร์', code: 'COM' },
  { name: 'ครุภัณฑ์สนาม', code: 'FLD' },
  { name: 'ครุภัณฑ์ดนตรีและนาฏศิลป์', code: 'ART' },
  { name: 'ครุภัณฑ์กีฬา', code: 'SPO' },
  { name: 'ครุภัณฑ์โรงงาน', code: 'FAC' },
  { name: 'ครุภัณฑ์อื่น', code: 'OTH' },
]

const MATERIAL_TYPES = [
  { name: 'วัสดุสำนักงาน' },
  { name: 'วัสดุไฟฟ้าและวิทยุ' },
  { name: 'วัสดุงานบ้านงานครัว' },
  { name: 'วัสดุก่อสร้าง' },
  { name: 'วัสดุยานพาหนะและขนส่ง' },
  { name: 'วัสดุเชื้อเพลิงและหล่อลื่น' },
  { name: 'วัสดุวิทยาศาสตร์หรือการแพทย์' },
  { name: 'วัสดุการเกษตร' },
  { name: 'วัสดุโฆษณาและเผยแพร่' },
  { name: 'วัสดุเครื่องแต่งกาย' },
  { name: 'วัสดุการศึกษา' },
  { name: 'วัสดุคอมพิวเตอร์' },
  { name: 'วัสดุสนาม' },
  { name: 'วัสดุดนตรีและนาฏศิลป์' },
  { name: 'วัสดุกีฬา' },
  { name: 'วัสดุเครื่องดับเพลิง' },
  { name: 'วัสดุโรงงาน' },
  { name: 'วัสดุอาวุธยุทธภัณฑ์' },
  { name: 'วัสดุอื่น' },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    console.log('✅ MongoDB connected')

    // Seed Departments
    const existingDepts = await Department.countDocuments()
    if (existingDepts === 0) {
      await Department.insertMany(DEPARTMENTS)
      console.log(`✅ Seeded ${DEPARTMENTS.length} departments`)
    } else {
      console.log(`⏭️  Departments already exist (${existingDepts} records)`)
    }

    // Seed Equipment Types
    const existingEqTypes = await EquipmentType.countDocuments()
    if (existingEqTypes === 0) {
      await EquipmentType.insertMany(EQUIPMENT_TYPES)
      console.log(`✅ Seeded ${EQUIPMENT_TYPES.length} equipment types`)
    } else {
      console.log(`⏭️  Equipment types already exist (${existingEqTypes} records)`)
    }

    // Seed Material Types
    const existingMatTypes = await MaterialType.countDocuments()
    if (existingMatTypes === 0) {
      await MaterialType.insertMany(MATERIAL_TYPES)
      console.log(`✅ Seeded ${MATERIAL_TYPES.length} material types`)
    } else {
      console.log(`⏭️  Material types already exist (${existingMatTypes} records)`)
    }

    // Seed System Settings (ทำจาก server.js ผ่าน seedDefaults แล้ว)
    console.log('✅ System settings initialized')

    console.log('\n✅ Seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }
}

seed()
