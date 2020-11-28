const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const authRoutes = require('./routes/auth.js')
const usersRoutes = require('./routes/users.js')

// middleware
app.use(express.json()) // req.body
app.use(cors())
app.use(cookieParser(process.env.COOKIE_SECRET))

// ROUTES
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)

app.use('/', (req, res) => {
  res.send('Server is running')
})

app.listen(process.env.SERVER_PORT || 3000, () => {
  console.log('server is running on port 3000')
})
