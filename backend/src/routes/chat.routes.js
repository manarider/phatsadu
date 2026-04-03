const express = require('express')
const multer = require('multer')
const { requireAuth, requireDepartment } = require('../middlewares')
const {
  listMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} = require('../controllers/chat.controller')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  },
})

router.use(requireAuth, requireDepartment)

router.get('/unread', getUnreadCount)
router.get('/:repair_id/messages', listMessages)
router.post('/:repair_id/messages', upload.array('files', 10), sendMessage)
router.post('/:repair_id/mark-read', markAsRead)

module.exports = router
