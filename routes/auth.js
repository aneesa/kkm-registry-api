const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const jwtGenerator = require('../utils/jwtGenerator');

// register
router.post('/register', async (req, res) => {
  try {
    const { body: { name, email, password }} = req;

    const user = await pool.query('SELECT * from users WHERE user_email = $1', [ email ]);

    if (user.rows.length !== 0) {
      return res.status(401).send('User already exists');
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);

    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query('INSERT INTO ' +
      'users (user_name, user_email, user_password) ' +
      'VALUES ($1, $2, $3) RETURNING *', [name, email, bcryptPassword]);

    const token = jwtGenerator(newUser.rows[0].user_id);

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
