const router = require('express').Router()
const winston = require('../winston')
const dbUtils = require('../database/utils')
const authorization = require('../middleware/authorization')

/**
 * @group users
 * @route GET /users
 * @param {string} last_email.query - last email from previous users
 * @param {string} limit.query - limit per page
 * @param {string} email.query - searched email
 * @param {string} name.query - searched name
 * @returns {Get_Users.model} 200 - returns authorized, users
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.get('/', authorization, async (req, res) => {
  try {
    const {
      last_email = null,
      limit = 25,
      email = null,
      name = null,
    } = req.query

    let where = email ? `user_email like '%${email}%'` : ''
    where = name
      ? `${where ? `${where} AND ` : ''}user_name like '%${name}%'`
      : where
    where = last_email
      ? `${where ? `${where} AND ` : ''}(user_email) > ('${last_email}')`
      : where

    const users = await dbUtils.selectQuery({
      columns: 'logins.user_id, user_email, user_name, user_last_login',
      tableName: 'logins',
      leftJoin: 'users',
      joinOn: 'logins.user_id = users.user_id',
      where,
      orderBy: 'user_email ASC',
      limit,
    })

    if (users.rows.length === 0) {
      return res.json({
        authorized: req.authorized,
        users: [],
      })
    }

    const lastRow = users.rows[users.rows.length - 1]

    // find next count
    const nextCount = await dbUtils.selectQuery({
      columns: 'count(user_email)',
      tableName: 'logins',
      where: `(user_email) > ('${lastRow.user_email}')`,
    })

    res.json({
      authorized: req.authorized,
      users: users.rows,
      hasMore: nextCount.rows[0].count > 0,
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    res.status(500).json({ message: 'Server Error' })
  }
})

/**
 * @group users
 * @route GET /users/{userId}
 * @param {string} userId.path
 * @returns {Get_User.model} 200 - returns authorized, user
 * @returns {Error.model} 404 - ERROR: User id is not provided or Cannot find user
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.get('/:userId', authorization, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(404).json({ message: 'User id is not provided' })
    }

    const user = await dbUtils.selectQuery({
      columns: 'logins.user_id, user_email, user_name, user_last_login',
      tableName: 'logins',
      leftJoin: 'users',
      joinOn: 'logins.user_id = users.user_id',
      where: 'logins.user_id = $1',
      params: [userId],
    })

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Cannot find user' })
    }

    res.json({
      authorized: req.authorized,
      user: user.rows[0],
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    res.status(500).json({ message: 'Server Error' })
  }
})

module.exports = router
