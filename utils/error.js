function generateJsonError({
  res,
  status = 500,
  message = null,
  authorized = null,
}) {
  let errorMessage = 'Server Error'

  if (status === 401) errorMessage = 'Not authenticated'
  if (status === 403) errorMessage = 'Not authorized'
  if (status === 404) errorMessage = 'Not found'
  if (status === 406) errorMessage = 'Not acceptable'

  const jsonPayload = {
    message: message || errorMessage,
  }

  if (authorized) {
    jsonPayload.authorized = authorized
  }

  return res.status(status).json(jsonPayload)
}

module.exports = { generateJsonError }
