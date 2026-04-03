const fs = require('fs')
const path = require('path')

function ensureDirSync(targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
}

function sanitizeName(value = '') {
  return String(value)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-ก-๙]/g, '')
    .slice(0, 80)
}

function thaiYearShort(date = new Date()) {
  const buddhistYear = date.getFullYear() + 543
  return String(buddhistYear).slice(-2)
}

function buildUploadAbsolutePath(...segments) {
  const base = process.env.UPLOAD_DIR || './uploads'
  return path.resolve(process.cwd(), base, ...segments)
}

function buildUploadPublicPath(...segments) {
  return `/uploads/${segments.map((s) => String(s).replace(/^\/+|\/+$/g, '')).join('/')}`
}

module.exports = {
  ensureDirSync,
  sanitizeName,
  thaiYearShort,
  buildUploadAbsolutePath,
  buildUploadPublicPath,
}
