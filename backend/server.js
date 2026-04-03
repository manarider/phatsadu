require('dotenv').config()
const mongoose = require('mongoose')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const { SystemSetting } = require('./src/models')

const PORT = process.env.PORT || 4004
let server

async function startServer() {
  await connectDB()
  await SystemSetting.seedDefaults('system')

  server = app.listen(PORT, () => {
    console.log(`\n✅ PAPP Backend running on port ${PORT}`)
    console.log(`📦 ${process.env.APP_NAME}`)
    console.log(`🌐 NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`🔗 Health: http://localhost:${PORT}/api/health\n`)

    // แจ้ง PM2 ว่า app พร้อมใช้งาน (wait_ready: true)
    if (process.send) process.send('ready')
  })

  server.on('error', (err) => {
    console.error('❌ HTTP Server error:', err.message)
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please stop the existing process.`)
      process.exit(1)
    }
  })
}

async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`)

  // หยุดรับ request ใหม่ แต่รอให้ request ปัจจุบันเสร็จ
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed')
      try {
        await mongoose.disconnect()
        console.log('✅ MongoDB disconnected')
      } catch (err) {
        console.error('❌ Error disconnecting MongoDB:', err.message)
      }
      process.exit(0)
    })
  } else {
    process.exit(0)
  }

  // บังคับออกหากไม่ปิดภายใน 8 วินาที
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout')
    process.exit(1)
  }, 8000).unref()
}

// จัดการ unhandled promise rejections — log แต่ไม่ crash
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ UnhandledRejection:', reason)
})

// จัดการ uncaught exceptions — ต้อง shutdown เพราะ state ไม่น่าเชื่อถือ
process.on('uncaughtException', (err) => {
  console.error('❌ UncaughtException:', err)
  gracefulShutdown('uncaughtException')
})

// PM2 / OS signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err)
  process.exit(1)
})
