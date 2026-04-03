const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    })
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Driver will attempt to reconnect...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err.message)
    })
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
