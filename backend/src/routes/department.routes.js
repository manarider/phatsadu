const express = require('express')
const { requireAuth, allowRoles } = require('../middlewares')
const { list, create, update, remove } = require('../controllers/department.controller')

const router = express.Router()

router.use(requireAuth)
router.get('/', list)
router.post('/', allowRoles('admin'), create)
router.put('/:id', allowRoles('admin'), update)
router.delete('/:id', allowRoles('admin'), remove)

module.exports = router
