const express = require('express')
const equipmentController = require('../controllers/equipment.controller')
const { requireAuth, requireDepartment, allowRoles } = require('../middlewares')
const { upload } = require('../middlewares/upload.middleware')

const router = express.Router()

router.use(requireAuth, requireDepartment)

router.get('/types', allowRoles('admin', 'manager', 'staff', 'viewer'), equipmentController.getTypes)
router.post('/types', allowRoles('admin'), equipmentController.createType)
router.put('/types/:typeId', allowRoles('admin'), equipmentController.updateType)
router.delete('/types/:typeId', allowRoles('admin'), equipmentController.deleteType)

router.get('/stats', allowRoles('admin', 'manager', 'staff', 'viewer'), equipmentController.stats)
router.get('/', allowRoles('admin', 'manager', 'staff', 'viewer'), equipmentController.list)
router.get('/:id', allowRoles('admin', 'manager', 'staff', 'viewer'), equipmentController.getById)

router.post(
  '/',
  allowRoles('admin', 'manager', 'staff'),
  upload.single('image'),
  equipmentController.create
)

router.put(
  '/:id',
  allowRoles('admin', 'manager', 'staff'),
  upload.single('image'),
  equipmentController.update
)

router.delete('/:id', allowRoles('admin'), equipmentController.softDelete)

router.post(
  '/bulk-upload',
  allowRoles('admin', 'manager', 'staff'),
  upload.single('file'),
  equipmentController.bulkImport
)

module.exports = router
