const express = require('express')
const { list } = require('../controllers/auditLog.controller')
const { requireAuth } = require('../middlewares')
const { allowRoles } = require('../middlewares/role.middleware')

const router = express.Router()

router.get('/', requireAuth, allowRoles('admin'), list)

module.exports = router
