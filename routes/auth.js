const router = require('express').Router()
const bcrypt = require('bcrypt')
const winston = require('../winston')
const dbUtils = require('../database/utils')
const authorization = require('../middleware/authorization')
const validInfo = require('../middleware/validInfo')
const { generateJsonError } = require('../utils/error')
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwtGenerator')
require('dotenv').config()

/**
 * @group auth - authentication & authorization
 * @route POST /auth/register
 * @param {Registering_User.model} user.body.required
 * @returns {Registered_User.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: User already exists
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.post('/register', validInfo, async (req, res) => {
  try {
    const {
      body: { name, email, password },
    } = req

    const login = await dbUtils.selectQuery({
      columns: 'user_email, user_last_login',
      tableName: 'logins',
      where: 'user_email = $1',
      params: [email],
    })

    if (login.rows.length !== 0) {
      return generateJsonError({
        res,
        status: 401,
        message: 'User already exists',
      })
    }

    const saltRound = 10
    const salt = await bcrypt.genSalt(saltRound)

    const bcryptPassword = await bcrypt.hash(password, salt)

    const last_login = new Date().toISOString()

    const newLogin = await dbUtils.insertQuery({
      tableName: 'logins',
      fields: ['user_email', 'user_password', 'user_last_login'],
      returning: 'user_id',
      params: [email, bcryptPassword, last_login],
    })

    const loginRow = newLogin.rows[0]
    const user_id = loginRow.user_id

    await dbUtils.insertQuery({
      tableName: 'users',
      fields: ['user_id', 'user_name'],
      params: [user_id, name],
    })

    // TODO: if there are more user roles in the future, keep them in a table
    const access_token = generateAccessToken(user_id, 'user')
    const refresh_token = generateRefreshToken(user_id, 'user')

    //Set refresh token in httpOnly cookie
    const options = {
      httpOnly: true,
      signed: true,
    }
    res.cookie('refresh_token', refresh_token, options)

    res.json({
      authorized: {
        access_token,
        auth_user: {
          user_id,
          user_email: email,
          user_name: name,
          user_role: 'user',
          user_last_login: last_login,
        },
      },
      user: {
        user_id,
        user_email: email,
        user_name: name,
        user_role: 'user',
        user_last_login: last_login,
      },
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group auth - authentication & authorization
 * @route POST /auth/login
 * @param {Login_User.model} user.body.required
 * @returns {Get_Authorized.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: Email or Password is incorrect
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.post('/login', validInfo, async (req, res) => {
  try {
    const {
      body: { email, password },
    } = req

    const user = await dbUtils.selectQuery({
      columns:
        'logins.user_id, user_password, user_email, user_name, user_role',
      tableName: 'logins',
      leftJoins: [
        { tableName: 'users', joinOn: 'logins.user_id = users.user_id' },
      ],
      where: 'user_email = $1',
      params: [email],
    })

    if (user.rows.length === 0) {
      return generateJsonError({
        res,
        status: 401,
        message: 'Cannot find user',
      })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    )

    if (!validPassword) {
      return generateJsonError({
        res,
        status: 401,
        message: 'Email or Password is incorrect',
      })
    }

    const userRow = user.rows[0]
    const user_id = userRow.user_id
    const user_role = userRow.user_role

    // update last_login in login table
    const last_login = new Date().toISOString()

    await dbUtils.updateQuery({
      tableName: 'logins',
      set: 'user_last_login = $1',
      where: 'user_id = $2',
      params: [last_login, user_id],
    })

    const access_token = generateAccessToken(user_id, user_role)
    const refresh_token = generateRefreshToken(user_id, user_role)

    //Set refresh token in httpOnly cookie
    const options = {
      httpOnly: true,
      signed: true,
    }
    res.cookie('refresh_token', refresh_token, options)

    res.json({
      authorized: {
        access_token,
        auth_user: {
          user_id,
          user_email: email,
          user_name: userRow.user_name,
          user_role: userRow.user_role,
          user_last_login: last_login,
        },
      },
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group auth - authentication & authorization
 * @route GET /auth/rehydrate
 * @returns {Get_Authorized.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: Token has expired
 * @returns {Error.model} 404 - ERROR: Token not found
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.get('/rehydrate', authorization, async (req, res) => {
  try {
    res.json({ authorized: req.authorized })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group auth - authentication & authorization
 * @route DELETE /auth/logout
 * @returns {} 200 - Logout successful
 */
router.delete('/logout', (req, res) => {
  res.clearCookie('refresh_token')
  res.json({ message: 'Logout successful' })
})

module.exports = router
