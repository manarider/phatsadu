const express = require('express')
const { requireAuth, requireDepartment } = require('../middlewares')
const { uploadRepairAttachments } = require('../middlewares/upload.middleware')
const {
  list,
  detail,
  create,
  createBulk,
  updateStatus,
  addRepairResult,
  deleteRepairs,
} = require('../controllers/repair.controller')

const router = express.Router()

router.use(requireAuth, requireDepartment)

router.get('/', list)
router.get('/:id', detail)
router.post('/', create)
router.post('/bulk', createBulk)
router.patch('/:id/status', updateStatus)
router.patch('/:id/result', uploadRepairAttachments.array('files', 2), addRepairResult)
router.delete('/', deleteRepairs)

module.exports = router
