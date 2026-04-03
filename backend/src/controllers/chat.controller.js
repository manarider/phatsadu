const path = require('path')
const sharp = require('sharp')
const asyncHandler = require('../utils/asyncHandler')
const { ChatMessage, RepairRequest, AuditLog } = require('../models')
const {
  ensureDirSync,
  sanitizeName,
  buildUploadAbsolutePath,
  buildUploadPublicPath,
} = require('../utils/helpers')

async function saveChatImage(file, repairId) {
  const safeRepairId = sanitizeName(String(repairId) || 'unknown')
  const folderAbs = buildUploadAbsolutePath('chats', `repair_${safeRepairId}`)
  ensureDirSync(folderAbs)

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
  const absolutePath = path.join(folderAbs, filename)

  const meta = await sharp(file.buffer)
    .rotate()
    .webp({ quality: 80 })
    .toFile(absolutePath)

  return {
    filename,
    path: buildUploadPublicPath('chats', `repair_${safeRepairId}`, filename),
    mime_type: 'image/webp',
    size: meta.size || 0,
    width: meta.width || null,
    height: meta.height || null,
  }
}

exports.listMessages = asyncHandler(async (req, res) => {
  const { repair_id } = req.params
  const { limit = 50 } = req.query

  const repair = await RepairRequest.findById(repair_id).lean()
  if (!repair) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  const messages = await ChatMessage.find({
    repair_request_id: repair_id,
    deleted_at: null,
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit), 100))
    .lean()

  res.json({
    status: 'success',
    data: messages.reverse(),
  })
})

exports.sendMessage = asyncHandler(async (req, res) => {
  const { repair_id } = req.params
  const { message = '', attachment_files = [] } = req.body
  const files = req.files || []

  if (!message?.trim() && files.length === 0) {
    return res.status(400).json({ error: 'Message or attachment required' })
  }

  const repair = await RepairRequest.findById(repair_id)
  if (!repair) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  let attachments = []
  if (files.length > 0) {
    const processedFiles = await Promise.all(
      files.slice(0, 10).map((file) => saveChatImage(file, repair_id))
    )
    attachments = processedFiles
  }

  const chatMsg = await ChatMessage.create({
    repair_request_id: repair_id,
    department_name: req.user.department_name,
    sender_user_id: req.user.user_id,
    sender_name: `${req.user.first_name} ${req.user.last_name}`,
    sender_role: req.user.role,
    message: message?.trim() || '',
    attachments,
  })

  repair.unread_count = (repair.unread_count || 0) + 1
  await repair.save()

  await AuditLog.create({
    action: 'create',
    module: 'chat',
    target_collection: 'chat_messages',
    target_id: String(chatMsg._id),
    message: `Send chat message in repair ${repair_id}`,
    actor_user_id: req.user.user_id,
    actor_username: req.user.username,
    actor_role: req.user.role,
    department_name: req.user.department_name,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    after_data: chatMsg.toObject(),
  })

  res.status(201).json({ status: 'success', data: chatMsg })
})

exports.markAsRead = asyncHandler(async (req, res) => {
  const { repair_id } = req.params

  const repair = await RepairRequest.findById(repair_id)
  if (!repair) {
    return res.status(404).json({ error: 'Repair request not found' })
  }

  await ChatMessage.updateMany(
    {
      repair_request_id: repair_id,
      deleted_at: null,
      read_by: { $ne: req.user.user_id },
    },
    { $addToSet: { read_by: req.user.user_id } }
  )

  repair.unread_count = 0
  await repair.save()

  res.json({ status: 'success' })
})

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const repairs = await RepairRequest.find({
    department_name: req.user.department_name,
    deleted_at: null,
  })
    .select('_id unread_count')
    .lean()

  const totalUnread = repairs.reduce((sum, r) => sum + (r.unread_count || 0), 0)

  res.json({
    status: 'success',
    total_unread: totalUnread,
    repairs: repairs,
  })
})
