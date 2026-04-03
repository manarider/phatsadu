const express = require('express')
const { requireAuth, requireDepartment } = require('../middlewares')
const {
  getStats,
  getLowStockAlerts,
  getPendingRepairs,
  getPendingTransactions,
} = require('../controllers/dashboard.controller')

const router = express.Router()

router.use(requireAuth, requireDepartment)

router.get('/stats', getStats)
router.get('/low-stock-alerts', getLowStockAlerts)
router.get('/pending-repairs', getPendingRepairs)
router.get('/pending-transactions', getPendingTransactions)

module.exports = router
