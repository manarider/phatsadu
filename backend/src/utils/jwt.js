const jwt = require('jsonwebtoken')

function signPappToken(user) {
  const payload = {
    user_id: user.user_id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    department_name: user.department_name || null,
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  })
}

// รับ req (optional) เพื่อ detect HTTPS จาก X-Forwarded-Proto
function getCookieOptions(req) {
  // detect HTTPS: Express trust proxy = 1 ทำให้ req.secure อ่านจาก X-Forwarded-Proto ได้
  const isHttps = req
    ? req.secure || req.headers['x-forwarded-proto'] === 'https'
    : process.env.NODE_ENV === 'production'

  return {
    httpOnly: true,
    secure: isHttps,           // ส่ง cookie เฉพาะช่องทาง HTTPS
    sameSite: isHttps ? 'none' : 'lax', // 'none' ต้องคู่กับ secure:true
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  }
}

module.exports = {
  signPappToken,
  getCookieOptions,
}
