const router = require('express').Router()
const winston = require('../winston')
const dbUtils = require('../database/utils')
const authorization = require('../middleware/authorization')
const { generateJsonError } = require('../utils/error')
const { isAdmin } = require('../utils/role')

/**
 * @group memberships
 * @route POST /memberships
 * @returns {Post_Membership.model} 200 - returns authorized, user_membership_status, user_membership_requested_on
 * @returns {Error.model} 403 - ERROR: Not authorized
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.post('/', authorization, async (req, res) => {
  const { authorized } = req
  const {
    auth_user: { user_id },
  } = authorized

  try {
    const newMembership = await dbUtils.insertQuery({
      tableName: 'memberships',
      fields: ['user_id'],
      returning: 'status, requested_on',
      params: [user_id],
    })

    res.json({
      authorized,
      user_membership_status: newMembership.rows[0].status,
      user_membership_requested_on: newMembership.rows[0].requested_on,
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

/**
 * @group memberships
 * @route GET /memberships
 * @param {string} last_requested_on.query - last email from previous users
 * @param {string} limit.query - limit per page
 * @param {string} email.query - searched email
 * @param {string} name.query - searched name
 * @param {string} status.query - searched status
 * @returns {Get_Memberships.model} 200 - returns authorized, users
 * @returns {Error.model} 403 - ERROR: Not authorized
 * @returns {Error.model} 500 - ERROR: Server Error
 * @security JWT
 */
router.get('/', authorization, async (req, res) => {
  const { authorized } = req

  // only admin can get the memberships list
  if (!isAdmin(authorized)) {
    return generateJsonError({
      res,
      status: 403,
      authorized,
    })
  }

  try {
    const {
      last_requested_on = null,
      limit = 25,
      email = null,
      name = null,
      status = null,
    } = req.query

    let where = email ? `user_email like '%${email}%'` : ''
    where = name
      ? `${where ? `${where} AND ` : ''}user_name like '%${name}%'`
      : where
    where = status
      ? `${where ? `${where} AND ` : ''}status like '%${status}%'`
      : where
    where = last_requested_on
      ? `${
          where ? `${where} AND ` : ''
        }(requested_on::timestamptz(0)) > ('${new Date(
          last_requested_on
        ).toISOString()}'::timestamptz(0))`
      : where

    const memberships = await dbUtils.selectQuery({
      columns: 'memberships.user_id, user_email, user_name, requested_on',
      tableName: 'memberships',
      leftJoins: [
        { tableName: 'logins', joinOn: 'memberships.user_id = logins.user_id' },
        {
          tableName: 'users',
          joinOn: 'memberships.user_id = users.user_id',
        },
      ],
      where,
      orderBy: 'requested_on ASC',
      limit,
    })

    if (memberships.rows.length === 0) {
      return res.json({
        authorized,
        memberships: [],
      })
    }

    const lastRow = memberships.rows[memberships.rows.length - 1]

    // find next count
    const nextCount = await dbUtils.selectQuery({
      columns: 'count(user_id)',
      tableName: 'memberships',
      where: `(requested_on::timestamptz(0)) > ('${lastRow.requested_on.toISOString()}'::timestamptz(0))`,
    })

    res.json({
      authorized,
      memberships: memberships.rows,
      hasMore: nextCount.rows[0].count > 0,
    })
  } catch (err) {
    winston.error(`Error: ${err?.message || err}`)
    return generateJsonError({ res })
  }
})

module.exports = router
