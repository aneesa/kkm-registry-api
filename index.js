const express = require('express')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const expressSwagger = require('express-swagger-generator')(app)
const morgan = require('morgan')
const winston = require('./winston')
require('dotenv').config()

const swaggerOptions = require('./swagger')

const authRoutes = require('./routes/auth.js')
const usersRoutes = require('./routes/users.js')
const membershipsRoutes = require('./routes/memberships.js')

// middleware
app.use(express.json()) // req.body
app.use(
  cors({
    origin: process.env.KKM_REGISTRY_ORIGIN || 'http://localhost:4000',
    credentials: true,
  })
)
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(morgan('combined', { stream: winston.stream }))

// ROUTES
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', usersRoutes)
app.use('/api/v1/memberships', membershipsRoutes)

expressSwagger(swaggerOptions)

app.listen(process.env.SERVER_PORT || 3000, () => {
  winston.info('server is running on port 3000')
})

module.exports = app
