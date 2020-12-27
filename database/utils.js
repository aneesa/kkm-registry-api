const tx = require('./config')

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
  return tx(select, params)
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
  return tx(insert, params)
}

function updateQuery({ tableName, set, where = null, params = [] }) {
  const update = `UPDATE ${tableName} SET ${set}${
    where ? ` WHERE ${where}` : ''
  }`
  return tx(update, params)
}

function parseUpdatedBody({ body }) {
  let updatedSet = ''
  let updatedParams = []
  Object.entries(body).forEach(([key, value]) => {
    if (value || value === 0) {
      updatedSet = `${updatedSet} ${key} = $${updatedParams.length + 1},`
      updatedParams.push(value)
    }
  })

  updatedSet = updatedSet.trim() // remove the front space
  updatedSet = updatedSet.slice(0, -1) // remove the last ,

  return {
    updatedSet,
    updatedParams,
  }
}

module.exports = {
  selectQuery,
  insertQuery,
  updateQuery,
  parseUpdatedBody,
}
