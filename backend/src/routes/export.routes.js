const express = require('express')
const { requireAuth } = require('../middlewares')
const {
  exportEquipment,
  exportMaterial,
  exportRepair,
} = require('../controllers/export.controller')

const router = express.Router()

router.use(requireAuth)

router.get('/equipment', exportEquipment)
router.get('/material', exportMaterial)
router.get('/repair', exportRepair)

module.exports = router
