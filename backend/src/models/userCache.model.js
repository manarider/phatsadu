const mongoose = require('mongoose')
const { ROLES } = require('../utils/constants')

const projectPermissionSchema = new mongoose.Schema(
  {
    project: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    subDepartment: { type: String, default: null, trim: true },
  },
  { _id: false }
)

const userCacheSchema = new mongoose.Schema(
  {
    ums_user_id: { type: String, required: true, unique: true, trim: true },
    username: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    phone: { type: String, trim: true },
    system_role: { type: String, trim: true },
    department_name: { type: String, trim: true, index: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true,
    },
    project_permissions: { type: [projectPermissionSchema], default: [] },
    last_login_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'users_cache',
  }
)

userCacheSchema.index({ username: 'text', email: 'text', first_name: 'text', last_name: 'text' })

module.exports = mongoose.model('UserCache', userCacheSchema)
