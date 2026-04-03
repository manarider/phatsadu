function buildScopeFilter(req, existingFilter = {}) {
  const user = req.user || {}
  if (user.role === 'admin') {
    return {
      ...existingFilter,
      deleted_at: null,
    }
  }

  return {
    ...existingFilter,
    department_name: user.department_name,
    deleted_at: null,
  }
}

function requireDepartment(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.user.role !== 'admin' && !req.user.department_name) {
    return res.status(400).json({ error: 'Department is required for non-admin user' })
  }

  return next()
}

module.exports = {
  buildScopeFilter,
  requireDepartment,
}
