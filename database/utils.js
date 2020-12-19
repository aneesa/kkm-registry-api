const pool = require('./config')

function selectQuery({
  columns = null,
  tableName,
  leftJoin = null,
  joinOn = null,
  where = null,
  orderBy = null,
  limit = null,
  params = [],
}) {
  const select = `SELECT ${columns || '*'} from ${tableName}${
    leftJoin ? ` LEFT JOIN ${leftJoin} ON ${joinOn}` : ''
  }${where ? ` WHERE ${where}` : ''}${orderBy ? ` ORDER BY ${orderBy}` : ''}${
    limit ? ` LIMIT ${limit}` : ''
  }`
  return pool.query(select, params)
}

function insertQuery({
  tableName,
  fields = [],
  returning = null,
  params = [],
}) {
  const insert = `INSERT INTO ${tableName} (${fields.join()}) VALUES (${fields.map(
    (f, idx) => `$${idx + 1}`
  )})${returning ? ` RETURNING ${returning}` : ''}`
  return pool.query(insert, params)
}

function updateQuery({ tableName, set, where = null, params = [] }) {
  const update = `UPDATE ${tableName} SET ${set}${
    where ? ` WHERE ${where}` : ''
  }`
  return pool.query(update, params)
}

module.exports = {
  selectQuery,
  insertQuery,
  updateQuery,
}
