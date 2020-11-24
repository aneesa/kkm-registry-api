const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(user_id) {
  const payload = {
    user: user_id
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 60 * 15});
}

module.exports = jwtGenerator;
