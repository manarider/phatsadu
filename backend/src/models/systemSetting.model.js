const mongoose = require('mongoose')
const { SYSTEM_SETTING_DEFAULTS } = require('../utils/constants')

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    value: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    updated_by: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'system_settings',
  }
)

systemSettingSchema.statics.seedDefaults = async function seedDefaults(user = 'system') {
  const bulkOps = Object.entries(SYSTEM_SETTING_DEFAULTS).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: {
        $setOnInsert: {
          key,
          value,
          description: 'default setting',
          updated_by: user,
        },
      },
      upsert: true,
    },
  }))

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps)
  }
}

module.exports = mongoose.model('SystemSetting', systemSettingSchema)
