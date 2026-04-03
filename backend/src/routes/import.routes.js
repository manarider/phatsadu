const express = require('express')
const multer = require('multer')
const { requireAuth, allowRoles } = require('../middlewares')
const {
  downloadEquipmentTemplate,
  importEquipment,
  downloadMaterialTemplate,
  importMaterial,
} = require('../controllers/import.controller')

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('รองรับเฉพาะไฟล์ Excel (.xlsx) เท่านั้น'))
    }
    cb(null, true)
  },
})

const canImport = allowRoles('admin', 'manager', 'staff')

const router = express.Router()
router.use(requireAuth)

router.get('/equipment/template', canImport, downloadEquipmentTemplate)
router.post('/equipment', canImport, uploadExcel.single('file'), importEquipment)

router.get('/material/template', canImport, downloadMaterialTemplate)
router.post('/material', canImport, uploadExcel.single('file'), importMaterial)

module.exports = router
