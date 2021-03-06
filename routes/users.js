const router = require('express').Router()
const winston = require('../winston')
const dbUtils = require('../database/utils')
const authorization = require('../middleware/authorization')
const { generateJsonError } = require('../utils/error')
const { isAdmin, isSelf } = require('../utils/role')

/**
 * @group users
 * @route PATCH /users/{userId}
 * @param {string} userId.path
 * @param {User.model} user.body.required
 * @returns {Authorized.model} 200 - returns authorized
 * @returns {Error.model} 403 - ERROR: Not authorized
 * @returns {Error.model} 404 - ERROR: User id is not provided or Cannot find user
 * @returns {Error.model} 406 - ERROR: User body is not accepted
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.patch('/:userId', authorization, async (req, res) => {
  const { authorized, body } = req
  const { userId } = req.params

  if (!userId) {
    return generateJsonError({
      res,
      status: 404,
      message: 'User id is not provided',
      authorized,
    })
  }

  // only admin can update other user
  // user can only update himself/herself
  if (!isAdmin(authorized) && !isSelf(authorized, userId)) {
    return generateJsonError({
      res,
      status: 403,
      authorized,
    })
  }

  // nothing to update
  if (!body || body === {}) {
    return generateJsonError({
      res,
      status: 406,
      message: 'User body is not provided',
      authorized,
    })
  }

  try {
    const user = await dbUtils.selectQuery({
      columns: 'users.user_id',
      tableName: 'users',
      leftJoins: [
        {
          tableName: 'memberships',
          joinOn: 'users.user_id = memberships.user_id',
        },
      ],
      where: 'users.user_id = $1',
      params: [userId],
    })

    if (user.rows.length === 0) {
      return generateJsonError({
        res,
        status: 404,
        message: 'Cannot find user',
        authorized,
      })
    }

    const { user_role, ...otherData } = body

    if (user_role) {
      const {
        updatedSet: updatedRoleSet,
        updatedParams: updatedRoleParams,
      } = dbUtils.parseUpdatedBody({ body: { user_role } })
      await dbUtils.updateQuery({
        tableName: 'logins',
        set: updatedRoleSet,
        where: `user_id = $${updatedRoleParams.length + 1}`,
        params: [...updatedRoleParams, userId],
      })
    }

    if (otherData) {
      const {
        updatedSet: updatedUserSet,
        updatedParams: updatedUserParams,
      } = dbUtils.parseUpdatedBody({ body: otherData })
      await dbUtils.updateQuery({
        tableName: 'users',
        set: updatedUserSet,
        where: `user_id = $${updatedUserParams.length + 1}`,
        params: [...updatedUserParams, userId],
      })
    }

    res.json({ authorized })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group users
 * @route GET /users/{userId}
 * @param {string} userId.path
 * @returns {Get_User.model} 200 - returns authorized, user
 * @returns {Error.model} 403 - ERROR: Not authorized
 * @returns {Error.model} 404 - ERROR: User id is not provided or Cannot find user
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.get('/:userId', authorization, async (req, res) => {
  const { authorized } = req
  const { userId } = req.params

  if (!userId) {
    return generateJsonError({
      res,
      status: 404,
      message: 'User id is not provided',
      authorized,
    })
  }

  // only admin can view other user
  // user can only view himself/herself
  if (!isAdmin(authorized) && !isSelf(authorized, userId)) {
    return generateJsonError({
      res,
      status: 403,
      authorized,
    })
  }

  try {
    const user = await dbUtils.selectQuery({
      columns:
        'logins.user_id, user_email, user_role, user_last_login, user_name, user_phone_no, user_home_address, user_membership_no, status user_membership_status, requested_on user_membership_requested_on',
      tableName: 'logins',
      leftJoins: [
        { tableName: 'users', joinOn: 'logins.user_id = users.user_id' },
        {
          tableName: 'memberships',
          joinOn: 'logins.user_id = memberships.user_id',
        },
      ],
      where: 'logins.user_id = $1',
      params: [userId],
    })

    if (user.rows.length === 0) {
      return generateJsonError({
        res,
        status: 404,
        message: 'Cannot find user',
        authorized,
      })
    }

    res.json({
      authorized,
      user: user.rows[0],
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group users
 * @route GET /users
 * @param {string} last_email.query - last email from previous users
 * @param {string} limit.query - limit per page
 * @param {string} email.query - searched email
 * @param {string} name.query - searched name
 * @returns {Get_Users.model} 200 - returns authorized, users
 * @returns {Error.model} 403 - ERROR: Not authorized
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.get('/', authorization, async (req, res) => {
  const { authorized } = req

  // only admin can get the users list
  if (!isAdmin(authorized)) {
    return generateJsonError({
      res,
      status: 403,
      authorized,
    })
  }

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
      columns:
        'logins.user_id, user_role, user_email, user_name, user_last_login, user_membership_no, user_phone_no, user_home_address',
      tableName: 'logins',
      leftJoins: [
        { tableName: 'users', joinOn: 'logins.user_id = users.user_id' },
        {
          tableName: 'memberships',
          joinOn: 'logins.user_id = memberships.user_id',
        },
      ],
      where,
      orderBy: 'user_email ASC',
      limit,
    })

    if (users.rows.length === 0) {
      return res.json({
        authorized,
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
      authorized,
      users: users.rows,
      hasMore: nextCount.rows[0].count > 0,
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

module.exports = router
