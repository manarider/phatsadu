const asyncHandler = require('../utils/asyncHandler')
const { SystemSetting } = require('../models')

// @desc    Get all system settings
// @route   GET /api/settings
// @access  Private (Admin only)
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSetting.find().lean()

  const settingsObject = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  res.json({
    status: 'success',
    data: settingsObject,
  })
})

// @desc    Update a system setting
// @route   PUT /api/settings/:key
// @access  Private (Admin only)
exports.updateSetting = asyncHandler(async (req, res) => {
  const { key } = req.params
  const { value } = req.body

  const setting = await SystemSetting.findOneAndUpdate(
    { key },
    { key, value },
    { new: true, upsert: true, runValidators: true }
  )

  res.json({
    status: 'success',
    data: setting,
  })
})

// @desc    Update multiple settings at once
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = req.body

  const promises = Object.entries(settings).map(([key, value]) =>
    SystemSetting.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true, runValidators: true }
    )
  )

  await Promise.all(promises)

  const updatedSettings = await SystemSetting.find().lean()
  const settingsObject = updatedSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  res.json({
    status: 'success',
    data: settingsObject,
  })
})
