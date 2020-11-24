const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.js');

//middleware

app.use(express.json()); // req.body
app.use(cors());

// ROUTES
// register, login
app.use('/api/v1/auth', authRoutes);

app.use('/', (req, res) => {
  res.send('Server is running');
});

app.listen(process.env.SERVER_PORT || 3000, () => {
  console.log('server is running on port 3000');
})
