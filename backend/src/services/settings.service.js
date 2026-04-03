const { SystemSetting } = require('../models')

async function getSettingValue(key, fallback = null) {
  const doc = await SystemSetting.findOne({ key }).lean()
  return doc ? doc.value : fallback
}

async function getBooleanSetting(key, fallback = false) {
  const value = await getSettingValue(key, String(fallback))
  return String(value).toLowerCase() === 'true'
}

module.exports = {
  getSettingValue,
  getBooleanSetting,
}
