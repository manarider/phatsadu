const jwt = require('jsonwebtoken')

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies.papp_token) {
    return req.cookies.papp_token
  }

  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      user_id: payload.user_id,
      username: payload.username,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: payload.role,
      department_name: payload.department_name,
    }

    return next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = {
  requireAuth,
  getTokenFromRequest,
}
