const asyncHandler = require('../utils/asyncHandler')
const { AuditLog } = require('../models')

const MODULE_LABELS = {
  auth: 'ล็อกอิน/ออก',
  equipment: 'ครุภัณฑ์',
  material: 'วัสดุ',
  transaction: 'ธุรกรรมวัสดุ',
  repair: 'แจ้งซ่อม',
  chat: 'แชท',
  settings: 'ตั้งค่า',
  system: 'ระบบ',
}

const ACTION_LABELS = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  approve: 'อนุมัติ',
  reject: 'ปฏิเสธ',
  login: 'เข้าสู่ระบบ',
  logout: 'ออกจากระบบ',
  import: 'นำเข้าข้อมูล',
}

// GET /api/audit-logs
exports.list = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    module: moduleFilter = '',
    action: actionFilter = '',
    actor_username = '',
    department_name = '',
    date_from = '',
    date_to = '',
    q = '',
  } = req.query

  const filter = {}

  if (moduleFilter) filter.module = moduleFilter
  if (actionFilter) filter.action = actionFilter
  if (actor_username) filter.actor_username = { $regex: actor_username, $options: 'i' }
  if (department_name) filter.department_name = { $regex: department_name, $options: 'i' }

  if (date_from || date_to) {
    filter.created_at = {}
    if (date_from) filter.created_at.$gte = new Date(date_from)
    if (date_to) {
      const end = new Date(date_to)
      end.setHours(23, 59, 59, 999)
      filter.created_at.$lte = end
    }
  }

  if (q) {
    filter.$or = [
      { message: { $regex: q, $options: 'i' } },
      { actor_username: { $regex: q, $options: 'i' } },
      { department_name: { $regex: q, $options: 'i' } },
      { target_collection: { $regex: q, $options: 'i' } },
    ]
  }

  const safeLimit = Math.min(Math.max(Number(limit), 1), 1000)
  const safePage = Math.max(Number(page), 1)
  const skip = (safePage - 1) * safeLimit

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  const result = items.map((log) => ({
    _id: log._id,
    action: log.action,
    action_label: ACTION_LABELS[log.action] || log.action,
    module: log.module,
    module_label: MODULE_LABELS[log.module] || log.module,
    target_collection: log.target_collection,
    target_id: log.target_id,
    message: log.message,
    actor_user_id: log.actor_user_id,
    actor_username: log.actor_username,
    actor_role: log.actor_role,
    department_name: log.department_name,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    created_at: log.created_at,
  }))

  res.json({
    status: 'success',
    data: result,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  })
})
