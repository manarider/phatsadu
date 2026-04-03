const express = require('express')
const controller = require('../controllers/material.controller')
const { requireAuth, requireDepartment, allowRoles } = require('../middlewares')
const { upload } = require('../middlewares/upload.middleware')

const router = express.Router()

router.use(requireAuth, requireDepartment)

router.get('/types', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.getTypes)
router.post('/types', allowRoles('admin'), controller.createMaterialType)
router.put('/types/:typeId', allowRoles('admin'), controller.updateMaterialType)
router.delete('/types/:typeId', allowRoles('admin'), controller.deleteMaterialType)

router.get('/', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.list)
router.get('/:id', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.detail)
router.post('/', allowRoles('admin', 'manager', 'staff'), controller.create)
router.put('/:id', allowRoles('admin', 'manager', 'staff'), controller.update)
router.delete('/:id', allowRoles('admin'), controller.softDelete)

router.post('/:id/transactions', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.createTransaction)
router.get('/:id/transactions', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.listTransactionsByMaterial)
router.get('/transactions/all', allowRoles('admin', 'manager', 'staff', 'viewer'), controller.listTransactions)
router.post('/transactions/:id/approve', allowRoles('admin', 'manager', 'staff'), controller.approveTransaction)

router.post('/bulk-upload', allowRoles('admin', 'manager', 'staff'), upload.single('file'), controller.bulkImport)

module.exports = router
