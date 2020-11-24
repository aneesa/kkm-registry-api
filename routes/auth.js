const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const jwtGenerator = require('../utils/jwtGenerator');
const validInfo = require('../middleware/validInfo');
const jwtAuthorization = require('../middleware/jwtAuthorization');

// register
router.post('/register', validInfo, async (req, res) => {
  try {
    const { body: { name, email, password }} = req;

    const user = await pool.query('SELECT * from users WHERE user_email = $1', [ email ]);

    if (user.rows.length !== 0) {
      return res.status(401).json({ message: 'User already exists'});
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
    res.status(500).json({ message: 'Server Error' });
  }
});

// login
router.post('/login', validInfo, async (req, res) => {
  try {
    const { body: { email, password }} = req;

    const user = await pool.query('SELECT * from users WHERE user_email = $1', [ email ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Email or Password is incorrect' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].user_password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Email or Password is incorrect'});
    }

    const token = jwtGenerator(user.rows[0].user_id);

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error'});
  }
});

// verfication
router.get('/verify', jwtAuthorization, async (req, res) => {
  try {
    res.json({ isAuthorized: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error'});
  }
});

module.exports = router;
