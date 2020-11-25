const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtGenerator');
const validInfo = require('../middleware/validInfo');
const authorization = require('../middleware/authorization');
require('dotenv').config();

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

    const access_token = generateAccessToken(newUser.rows[0].user_id);
    const refresh_token = generateRefreshToken(user.rows[0].user_id);

    //Set refresh token in httpOnly cookie
    const options = {
        httpOnly: true,
        signed: true
    };
    res.cookie('refresh_token', refresh_token, options);

    res.json({ access_token });
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

    const access_token = generateAccessToken(user.rows[0].user_id);
    const refresh_token = generateRefreshToken(user.rows[0].user_id);

    //Set refresh token in httpOnly cookie
    const options = {
        httpOnly: true,
        signed: true
    };
    res.cookie('refresh_token', refresh_token, options);

    res.json({ access_token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error'});
  }
});

// verify
router.get('/verify', authorization, async (req, res) => {
  const newToken = req.newAccessToken ? {
    access_token: req.newAccessToken,
    user: req.user,
  } : {};

  try {
    // can res set json without sending it first
    res.json({
      isAuthorized: true,
      ...newToken,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error'});
  }
});

module.exports = router;
