const { UserCache } = require('../models')
const { signPappToken, getCookieOptions } = require('../utils/jwt')
const {
  buildUmsLoginUrl,
  fetchUserFromUMS,
  extractPappPermission,
  mapProjectRole,
} = require('../services/ums.service')

function getTokenInput(req) {
  return req.body?.token || req.query?.token || null
}

async function authCallback(req, res, next) {
  try {
    const umsToken = getTokenInput(req)
    if (!umsToken) {
      return res.status(400).json({ error: 'Missing token from UMS callback' })
    }

    const umsUser = await fetchUserFromUMS(umsToken)
    const pappPermission = extractPappPermission(umsUser)

    if (!pappPermission) {
      return res.status(403).json({ error: 'No permission for this project' })
    }

    const role = mapProjectRole(pappPermission.role)
    const departmentName = pappPermission.subDepartment || null

    if (role !== 'admin' && !departmentName) {
      return res
        .status(403)
        .json({ error: 'Department is required for non-admin account' })
    }

    const pappUser = {
      user_id: String(umsUser._id || umsUser.id || umsUser.username),
      username: umsUser.username,
      first_name: umsUser.firstName || '',
      last_name: umsUser.lastName || '',
      role,
      department_name: departmentName,
    }

    await UserCache.findOneAndUpdate(
      { ums_user_id: pappUser.user_id },
      {
        ums_user_id: pappUser.user_id,
        username: umsUser.username,
        email: umsUser.email || '',
        first_name: umsUser.firstName || '',
        last_name: umsUser.lastName || '',
        phone: umsUser.phone || '',
        system_role: umsUser.systemRole || '',
        department_name: departmentName,
        role,
        project_permissions: umsUser.projectPermissions || [],
        last_login_at: new Date(),
        deleted_at: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const pappToken = signPappToken(pappUser)
    res.cookie('papp_token', pappToken, getCookieOptions(req))

    return res.json({
      status: 'success',
      user: pappUser,
    })
  } catch (error) {
    // ส่ง statusCode ที่ตั้งไว้ใน service กลับไปให้ frontend โดยตรง
    // ไม่ให้ error ที่รู้จักกลายเป็น 500
    const status = error.statusCode || 500
    const message = error.statusCode
      ? error.message
      : 'เกิดข้อผิดพลาดภายในระบบ'
    console.error('❌ authCallback error:', error.message)
    return res.status(status).json({ error: message })
  }
}

function getCurrentUser(req, res) {
  return res.json({
    status: 'success',
    user: req.user,
  })
}

function getLoginUrl(req, res) {
  const loginUrl = buildUmsLoginUrl()
  return res.json({
    status: 'success',
    login_url: loginUrl,
  })
}

function logout(req, res) {
  const opts = getCookieOptions(req)
  res.clearCookie('papp_token', { path: opts.path, secure: opts.secure, sameSite: opts.sameSite })
  return res.json({ status: 'success' })
}

module.exports = {
  authCallback,
  getLoginUrl,
  getCurrentUser,
  logout,
}
