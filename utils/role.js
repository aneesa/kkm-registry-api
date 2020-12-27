function isAdmin(authorized) {
  const { auth_user } = authorized
  if (auth_user?.user_role === 'admin') return true

  return false
}

function isSelf(authorized, other_user_id) {
  const { auth_user } = authorized
  if (auth_user?.user_id === other_user_id) return true

  return false
}

module.exports = { isAdmin, isSelf }
