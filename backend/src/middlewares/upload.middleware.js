const multer = require('multer')

const maxImageSizeMb = Number(process.env.MAX_IMAGE_SIZE_MB || 4)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxImageSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})

const ALLOWED_REPAIR_ATTACHMENT_MIMETYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const uploadRepairAttachments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB per file
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_REPAIR_ATTACHMENT_MIMETYPES.has(file.mimetype)) {
      return cb(new Error('Allowed file types: images, PDF, Word, Excel'))
    }
    cb(null, true)
  },
})

module.exports = {
  upload,
  uploadRepairAttachments,
}
