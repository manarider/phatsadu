const { AuditLog } = require('../models')

function auditLog(moduleName, action, targetCollection) {
  return async (req, res, next) => {
    const startedAt = Date.now()
    const originalJson = res.json.bind(res)

    res.json = (body) => {
      res.locals.responseBody = body
      return originalJson(body)
    }

    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
          await AuditLog.create({
            action,
            module: moduleName,
            target_collection: targetCollection,
            target_id: req.params.id || '',
            message: `${action} ${targetCollection} (${res.statusCode}) in ${Date.now() - startedAt}ms`,
            actor_user_id: req.user.user_id || '',
            actor_username: req.user.username || '',
            actor_role: req.user.role || '',
            department_name: req.user.department_name || '',
            ip_address: req.ip || '',
            user_agent: req.headers['user-agent'] || '',
            after_data: res.locals.responseBody || null,
          })
        }
      } catch (error) {
        console.error('Audit log failed:', error.message)
      }
    })

    return next()
  }
}

module.exports = {
  auditLog,
}
