const router = require('express').Router()
const pool = require('../db')
const authorization = require('../middleware/authorization')

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

    const user = await pool.query(
      'SELECT logins.user_id, user_email, user_name, user_last_login ' +
        'FROM logins LEFT JOIN users ON logins.user_id = users.user_id WHERE logins.user_id = $1',
      [userId]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Cannot find user' })
    }

    res.json({
      authorized: req.authorized,
      user: user.rows[0],
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ message: 'Server Error' })
  }
})

module.exports = router
