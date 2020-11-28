const router = require('express').Router()
const bcrypt = require('bcrypt')
const pool = require('../db')
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwtGenerator')
const validInfo = require('../middleware/validInfo')
const authorization = require('../middleware/authorization')
require('dotenv').config()

/**
 * @group auth - authentication & authorization
 * @route POST /auth/register
 * @param {Registering_User.model} user.body.required
 * @returns {Authorized.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: User already exists
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.post('/register', validInfo, async (req, res) => {
  try {
    const {
      body: { name, email, password },
    } = req

    const login = await pool.query(
      'SELECT * from logins WHERE user_email = $1',
      [email]
    )

    if (login.rows.length !== 0) {
      return res.status(401).json({ message: 'User already exists' })
    }

    const saltRound = 10
    const salt = await bcrypt.genSalt(saltRound)

    const bcryptPassword = await bcrypt.hash(password, salt)

    const last_login = new Date().toISOString()

    const newLogin = await pool.query(
      'INSERT INTO ' +
        'logins (user_email, user_password, user_last_login) ' +
        'VALUES ($1, $2, $3) RETURNING user_id',
      [email, bcryptPassword, last_login]
    )

    const loginRow = newLogin.rows[0]
    const user_id = loginRow.user_id

    await pool.query(
      'INSERT INTO ' + 'users (user_id, user_name) ' + 'VALUES ($1, $2)',
      [user_id, name]
    )

    const access_token = generateAccessToken(user_id)
    const refresh_token = generateRefreshToken(user_id)

    //Set refresh token in httpOnly cookie
    const options = {
      httpOnly: true,
      signed: true,
    }
    res.cookie('refresh_token', refresh_token, options)

    res.json({
      access_token,
      auth_user: {
        user_id,
        user_email: email,
        user_name: name,
        user_last_login: last_login,
      },
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server Error' })
  }
})

/**
 * @group auth - authentication & authorization
 * @route POST /auth/login
 * @param {Login_User.model} user.body.required
 * @returns {Authorized.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: Email or Password is incorrect
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.post('/login', validInfo, async (req, res) => {
  try {
    const {
      body: { email, password },
    } = req

    const user = await pool.query(
      'SELECT logins.user_id, user_email, user_password, user_name ' +
        'FROM logins LEFT JOIN users ON logins.user_id = users.user_id WHERE user_email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Email or Password is incorrect' })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    )

    if (!validPassword) {
      return res.status(401).json({ message: 'Email or Password is incorrect' })
    }

    const userRow = user.rows[0]
    const user_id = userRow.user_id

    // update last_login in login table
    const last_login = new Date().toISOString()
    await pool.query(
      'UPDATE logins SET user_last_login = $1' + 'WHERE user_id = $2',
      [last_login, user_id]
    )

    const access_token = generateAccessToken(user_id)
    const refresh_token = generateRefreshToken(user_id)

    //Set refresh token in httpOnly cookie
    const options = {
      httpOnly: true,
      signed: true,
    }
    res.cookie('refresh_token', refresh_token, options)

    res.json({
      access_token,
      auth_user: {
        user_id,
        user_email: email,
        user_name: userRow.user_name,
        user_last_login: last_login,
      },
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server Error' })
  }
})

/**
 * @group auth - authentication & authorization
 * @route GET /auth/rehydrate
 * @returns {Authorized.model} 200 - returns access_token, auth_user + httpOnly cookie
 * @returns {Error.model} 401 - ERROR: Token has expired
 * @returns {Error.model} 404 - ERROR: Token not found
 * @returns {Error.model} 500 - ERROR: Server Error
 */
router.get('/rehydrate', authorization, async (req, res) => {
  try {
    res.json(req.authorized)
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server Error' })
  }
})

module.exports = router
