const express = require('express')
const { requireAuth, allowRoles } = require('../middlewares')
const {
  getSettings,
  updateSetting,
  updateSettings,
} = require('../controllers/settings.controller')

const router = express.Router()

// All settings routes require admin role
router.use(requireAuth, allowRoles('admin'))

router.get('/', getSettings)
router.put('/', updateSettings)
router.put('/:key', updateSetting)

module.exports = router
