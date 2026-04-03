const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const path = require('path')

const app = express()

app.set('trust proxy', 1)

// ─── Security Headers ─────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
)

// ─── Rate Limiting ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})
app.use('/api/', apiLimiter)

// Rate limit เพิ่มเติมสำหรับ Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
})
app.use('/api/auth/', authLimiter)

// ─── CORS ─────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : []

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, etc.)
      if (!origin) return callback(null, true)
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true)
      }
      callback(new Error(`CORS policy: origin ${origin} not allowed`))
    },
    credentials: true,
  })
)

// ─── Body Parsers ─────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ─── NoSQL Injection Prevention ────────────────────
app.use(mongoSanitize())

// ─── Logging ──────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ─── Static Files: Uploads ────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '30d',
    etag: true,
    lastModified: true,
  })
)

// ─── Health Check ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: process.env.APP_NAME,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// ─── API Routes ────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/dashboard', require('./routes/dashboard.routes'))
app.use('/api/departments', require('./routes/department.routes'))
app.use('/api/equipment', require('./routes/equipment.routes'))
app.use('/api/materials', require('./routes/material.routes'))
app.use('/api/repairs', require('./routes/repair.routes'))
app.use('/api/chat', require('./routes/chat.routes'))
app.use('/api/settings', require('./routes/settings.routes'))
app.use('/api/export', require('./routes/export.routes'))
app.use('/api/import', require('./routes/import.routes'))
app.use('/api/maintenance', require('./routes/maintenance.routes'))
app.use('/api/audit-logs', require('./routes/auditLog.routes'))
app.use('/api/sale', require('./routes/sale.routes'))

// ─── 404 Handler ──────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// ─── Global Error Handler ─────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log เฉพาะ server-side ไม่ส่ง stack ออก client
  console.error('❌ Server Error:', err.stack || err.message)

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'ข้อมูล'
    return res.status(409).json({ error: `${field} นี้มีอยู่ในระบบแล้ว` })
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ error: messages.join(', ') })
  }

  // Mongoose CastError (invalid ObjectId หรือ type)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }

  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message })
  }

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: status < 500 ? err.message : 'Internal Server Error',
  })
})

module.exports = app
