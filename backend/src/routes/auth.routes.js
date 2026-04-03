const express = require('express')
const {
  authCallback,
  getLoginUrl,
  getCurrentUser,
  logout,
} = require('../controllers/auth.controller')
const { requireAuth } = require('../middlewares')

const router = express.Router()

router.get('/login-url', getLoginUrl)
router.post('/callback', authCallback)
router.get('/callback', authCallback)
router.get('/me', requireAuth, getCurrentUser)
router.post('/logout', requireAuth, logout)

module.exports = router
