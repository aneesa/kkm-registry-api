const pool = require('./config')

function selectQuery({
  columns = null,
  tableName,
  leftJoin = null,
  joinOn = null,
  where = null,
  params = [],
}) {
  return pool.query(
    `SELECT ${columns || '*'} from ${tableName}${
      leftJoin ? ` LEFT JOIN ${leftJoin} ON ${joinOn}` : ''
    }${where ? ` WHERE ${where}` : ''}`,
    params
  )
}

function insertQuery({
  tableName,
  fields = [],
  returning = null,
  params = [],
}) {
  return pool.query(
    `INSERT INTO ${tableName} (${fields.join()}) VALUES (${fields.map(
      (f, idx) => `$${idx + 1}`
    )})${returning ? ` RETURNING ${returning}` : ''}`,
    params
  )
}

function updateQuery({ tableName, set, where = null, params = [] }) {
  return pool.query(
    `UPDATE ${tableName} SET ${set}${where ? ` WHERE ${where}` : ''}`,
    params
  )
}

module.exports = {
  selectQuery,
  insertQuery,
  updateQuery,
}
