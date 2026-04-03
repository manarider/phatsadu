const express = require('express')
const { requireAuth, requireDepartment } = require('../middlewares')
const {
  list,
  getById,
  create,
  complete,
  remove,
  summary,
  exportExcel,
} = require('../controllers/maintenance.controller')

const router = express.Router()
router.use(requireAuth, requireDepartment)

router.get('/summary', summary)
router.get('/export', exportExcel)
router.get('/', list)
router.get('/:id', getById)
router.post('/', create)
router.patch('/:id/complete', complete)
router.delete('/:id', remove)

module.exports = router
