const express = require('express')
const sale = require('../controllers/sale.controller')
const { requireAuth, requireDepartment, allowRoles } = require('../middlewares')
const { upload } = require('../middlewares/upload.middleware')
const multer = require('multer')

const router = express.Router()
router.use(requireAuth, requireDepartment)

const canWrite = allowRoles('admin', 'manager', 'staff')
const canRead  = allowRoles('admin', 'manager', 'staff', 'viewer')

// PDF upload (multer ยอมรับ pdf + image)
const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','application/pdf'].includes(file.mimetype)
    cb(ok ? null : new Error('รองรับเฉพาะ JPG, PNG, WebP, PDF'), ok)
  },
})

// ── Equipment ──────────────────────────────────────────────────────────────
router.get('/pending',               canRead,  sale.listPending)
router.patch('/equipment/:id/status', canWrite, sale.updateEquipmentStatus)

// ── Draft ──────────────────────────────────────────────────────────────────
router.post('/draft',                      canWrite, sale.createDraft)
router.get('/draft/:id',                   canRead,  sale.getDraft)
router.delete('/draft/:id',                canWrite, sale.deleteDraft)
router.patch('/draft/:id/items/:idx/price',canWrite, sale.updateItemPrice)
router.post(
  '/draft/:id/items/:idx/image',
  canWrite,
  upload.single('image'),
  sale.uploadItemImage
)
router.post(
  '/draft/:id/complete',
  canWrite,
  uploadDoc.single('doc_file'),
  sale.completeSale
)

// ── History ────────────────────────────────────────────────────────────────
router.get('/history',      canRead, sale.listHistory)
router.get('/history/:id',  canRead, sale.getHistory)

module.exports = router
