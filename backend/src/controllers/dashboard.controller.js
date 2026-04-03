const asyncHandler = require('../utils/asyncHandler')
const {
  Equipment,
  Material,
  MaterialTransaction,
  RepairRequest,
  AuditLog,
} = require('../models')
const { buildScopeFilter } = require('../middlewares')

exports.getStats = asyncHandler(async (req, res) => {
  const filter = buildScopeFilter(req, {})

  const [
    totalEquipment,
    usableEquipment,
    maintenanceEquipment,
    lowStockMaterials,
    pendingRepairs,
    pendingTransactions,
    repairCostAgg,
  ] = await Promise.all([
    Equipment.countDocuments(filter),
    Equipment.countDocuments({ ...filter, status: 'ใช้งานได้' }),
    Equipment.countDocuments({
      ...filter,
      status: 'อยู่ระหว่างซ่อม',
    }),
    Material.countDocuments({
      ...filter,
      $expr: { $lte: ['$quantity', '$min_quantity'] },
    }),
    RepairRequest.countDocuments({
      ...filter,
      status: { $in: ['pending', 'approved'] },
    }),
    MaterialTransaction.countDocuments({
      ...filter,
      type: 'withdraw',
      status: 'pending',
    }),
    RepairRequest.aggregate([
      { $match: { ...filter, status: 'completed', repair_total_price: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$repair_total_price' } } },
    ]),
  ])

  res.json({
    status: 'success',
    dashboard: {
      equipment: {
        total: totalEquipment,
        usable: usableEquipment,
        maintenance: maintenanceEquipment,
      },
      alerts: {
        low_stock_count: lowStockMaterials,
        pending_repairs: pendingRepairs,
        pending_transactions: pendingTransactions,
      },
      repair_cost_total: repairCostAgg[0]?.total || 0,
    },
  })
})

exports.getLowStockAlerts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query
  const filter = buildScopeFilter(req, {
    $expr: { $lte: ['$quantity', '$min_quantity'] },
  })

  const items = await Material.find(filter)
    .sort({ quantity: 1 })
    .limit(Math.min(Number(limit), 100))
    .lean()

  res.json({
    status: 'success',
    data: items,
  })
})

exports.getPendingRepairs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query
  const filter = buildScopeFilter(req, {
    status: { $in: ['pending', 'approved'] },
  })

  const items = await RepairRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit), 100))
    .lean()

  res.json({
    status: 'success',
    data: items,
  })
})

exports.getPendingTransactions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query
  const filter = buildScopeFilter(req, {
    type: 'withdraw',
    status: 'pending',
  })

  const items = await MaterialTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit), 100))
    .lean()

  res.json({
    status: 'success',
    data: items,
  })
})
