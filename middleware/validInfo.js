module.exports = function (req, res, next) {
  const { email, name, password } = req.body

  function validEmail(userEmail) {
    // eslint-disable-next-line no-useless-escape
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      userEmail
    )
  }

  if (req.path === '/register') {
    if (![email, name, password].every(Boolean)) {
      return res.status(401).json({ message: 'Missing Credentials' })
    } else if (!validEmail(email)) {
      return res.status(401).json({ message: 'Invalid Email' })
    }
  } else if (req.path === '/login') {
    if (![email, password].every(Boolean)) {
      return res.status(401).json({ message: 'Missing Credentials' })
    } else if (!validEmail(email)) {
      return res.status(401).json({ message: 'Invalid Email' })
    }
  }

  next()
}
