const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  VIEWER: 'viewer',
})

const EQUIPMENT_STATUSES = Object.freeze([
  'ใช้งานได้',
  'ชำรุด',
  'อยู่ระหว่างซ่อม',
  'รอตัดจำหน่าย',
  'จำหน่ายแล้ว',
])

const REPAIR_STATUSES = Object.freeze([
  'pending',
  'approved',
  'in_progress',
  'completed',
  'rejected',
])

const TRANSACTION_TYPES = Object.freeze(['receive', 'withdraw', 'adjust'])

const SYSTEM_SETTING_DEFAULTS = Object.freeze({
  max_image_size: '4194304',
  max_images_per_equipment: '1',
  low_stock_alert: 'true',
  maintenance_notification: 'true',
  withdrawal_auto_approve: 'false',
  system_timezone: 'Asia/Bangkok',
  date_format: 'dd/MM/yyyy',
  currency: 'THB',
})

module.exports = {
  ROLES,
  EQUIPMENT_STATUSES,
  REPAIR_STATUSES,
  TRANSACTION_TYPES,
  SYSTEM_SETTING_DEFAULTS,
}
