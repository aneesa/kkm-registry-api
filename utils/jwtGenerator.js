const jwt = require('jsonwebtoken')
require('dotenv').config()

function generateAccessToken(user_id) {
  const payload = { user_id }
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
}

function generateRefreshToken(user_id) {
  const payload = { user_id }
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '14d' })
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
}
