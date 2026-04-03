module.exports = {
  ...require('./auth.middleware'),
  ...require('./role.middleware'),
  ...require('./scope.middleware'),
  ...require('./audit.middleware'),
}
