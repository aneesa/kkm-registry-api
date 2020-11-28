const jwt = require('jsonwebtoken')
const pool = require('../db')
const { generateAccessToken } = require('../utils/jwtGenerator')
require('dotenv').config()

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('authorization')

    if (authHeader === undefined) {
      throw new jwt.TokenExpiredError()
    }

    const [bearer, access_token] = authHeader.split(' ')

    if (bearer.toLowerCase() !== 'bearer' || !access_token) {
      throw new Error('Not Authenticated')
    }

    const payload = jwt.verify(access_token, process.env.JWT_ACCESS_SECRET)

    req.authorized = {
      auth_user_id: payload.user_id,
    }

    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      try {
        const { refresh_token } = req.signedCookies

        if (!refresh_token) {
          return res.status(404).json({ message: 'Token not found' })
        }

        const payload = jwt.verify(
          refresh_token,
          process.env.JWT_REFRESH_SECRET
        )

        const user = await pool.query(
          'SELECT logins.user_id, user_email, user_name, user_last_login ' +
            'FROM logins LEFT JOIN users ON logins.user_id = users.user_id WHERE logins.user_id = $1',
          [payload.user_id]
        )

        if (user.rows.length === 0) {
          return res.status(404).json({ message: 'Cannot find user' })
        }

        const access_token = generateAccessToken(user.rows[0].user_id)

        req.authorized = {
          auth_user: user.rows[0],
          access_token: access_token,
        }

        return next()
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return res.status(401).json({ message: 'Token has expired' })
        }

        console.error(err.message)
        return res.status(500).json({ message: 'Server Error' })
      }
    }

    console.error(err.message)
    return res.status(500).json({ message: 'Server Error' })
  }
}
