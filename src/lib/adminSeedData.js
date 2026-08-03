function buildAdminOnlySeed({ mobile, password, id } = {}) {
  const admin = { mobile, password }
  if (id) admin.id = id
  return {
    admin,
    provider: null,
  }
}

module.exports = {
  buildAdminOnlySeed,
}
