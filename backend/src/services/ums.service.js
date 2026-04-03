const axios = require('axios')

const umsClient = axios.create({
  baseURL: process.env.UMS_BASE_URL,
  timeout: 15000,
})

function buildUmsLoginUrl() {
  const base = process.env.UMS_BASE_URL || ''
  const loginPath = (process.env.UMS_LOGIN_PATH || 'login').replace(/^\/+/, '')
  const callbackUrl = process.env.PAPP_AUTH_CALLBACK_URL || ''

  const loginUrl = new URL(base)
  const basePath = loginUrl.pathname.replace(/\/+$/, '')
  loginUrl.pathname = `${basePath}/${loginPath}`

  if (callbackUrl) {
    loginUrl.searchParams.set('redirect', callbackUrl)
  }

  return loginUrl.toString()
}

function mapProjectRole(role) {
  if (!role) return null
  const normalized = String(role).toLowerCase()

  if (['admin', 'manager', 'staff', 'viewer'].includes(normalized)) {
    return normalized
  }

  // fallback mapping กรณี role จาก UMS ใช้ชื่อชุดอื่น
  if (['superadmin', 'owner'].includes(normalized)) return 'admin'
  if (['head', 'lead'].includes(normalized)) return 'manager'
  if (['member', 'user', 'operator'].includes(normalized)) return 'staff'

  return 'viewer'
}

async function fetchUserFromUMS(umsToken) {
  let response
  try {
    response = await umsClient.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${umsToken}`,
      },
      // ไม่ให้ axios throw error เมื่อ UMS ตอบ 4xx — จัดการเองด้านล่าง
      validateStatus: () => true,
    })
  } catch (networkError) {
    console.error('❌ UMS network error:', networkError.message)
    const err = new Error('ไม่สามารถติดต่อระบบ UMS ได้ กรุณาลองใหม่อีกครั้ง')
    err.statusCode = 502
    throw err
  }

  if (response.status === 401 || response.status === 403) {
    const msg = response.data?.message || 'Token ไม่ถูกต้องหรือหมดอายุ'
    console.warn('⚠️  UMS auth rejected:', response.status, msg)
    const err = new Error(msg)
    err.statusCode = 401
    throw err
  }

  if (response.status !== 200) {
    console.error('❌ UMS returned unexpected status:', response.status)
    const err = new Error('ระบบ UMS ตอบสนองผิดปกติ')
    err.statusCode = 502
    throw err
  }

  const body = response.data || {}
  if (body.status !== 'success' || !body.user) {
    const err = new Error('ข้อมูลผู้ใช้จาก UMS ไม่ถูกต้อง')
    err.statusCode = 502
    throw err
  }

  return body.user
}

function extractPappPermission(user) {
  const permissions = Array.isArray(user.projectPermissions)
    ? user.projectPermissions
    : []

  return (
    permissions.find(
      (item) => String(item.project) === String(process.env.PAPP_PROJECT_ID)
    ) || null
  )
}

module.exports = {
  buildUmsLoginUrl,
  mapProjectRole,
  fetchUserFromUMS,
  extractPappPermission,
}
