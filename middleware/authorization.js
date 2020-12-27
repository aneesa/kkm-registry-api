const jwt = require('jsonwebtoken')
const winston = require('../winston')
const dbUtils = require('../database/utils')
const { generateJsonError } = require('../utils/error')
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

    // payload needs to be verified
    // eslint-disable-next-line
    const payload = jwt.verify(access_token, process.env.JWT_ACCESS_SECRET)

    req.authorized = {
      is_authorized: true,
      auth_user: { user_id: payload?.user_id, user_role: payload?.user_role },
    }

    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      try {
        const { refresh_token } = req.signedCookies

        if (!refresh_token) {
          return generateJsonError({
            res,
            status: 404,
            message: 'Token not found',
          })
        }

        const payload = jwt.verify(
          refresh_token,
          process.env.JWT_REFRESH_SECRET
        )

        const user = await dbUtils.selectQuery({
          columns:
            'logins.user_id, user_email, user_name, user_role, user_last_login',
          tableName: 'logins',
          leftJoin: 'users',
          joinOn: 'logins.user_id = users.user_id',
          where: 'logins.user_id = $1',
          params: [payload.user_id],
        })

        if (user.rows.length === 0) {
          return generateJsonError({
            res,
            status: 404,
            message: 'Cannot find authorized user',
          })
        }

        const userRow = user.rows[0]
        const user_id = userRow.user_id
        const user_role = userRow.user_role

        const access_token = generateAccessToken(user_id, user_role)

        req.authorized = {
          auth_user: userRow,
          access_token: access_token,
        }

        return next()
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return generateJsonError({
            res,
            status: 401,
            message: 'Token has expired',
          })
        }

        winston.error(`Error: ${err?.message || err}`)
        return generateJsonError({ res })
      }
    }

    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
}
