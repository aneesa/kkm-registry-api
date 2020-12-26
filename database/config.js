const Pool = require('pg').Pool
const winston = require('../winston')
require('dotenv').config()

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
})

// https://github.com/brianc/node-postgres/issues/1252#issuecomment-293899088
// https://gist.github.com/zerbfra/70b155fa00b4e0d6fd1d4e090a039ad4

async function tx(query, params) {
  const client = await pool.connect()
  let res
  try {
    await client.query('BEGIN')
    try {
      // TODO: save sensitive log to database
      // winston.info(
      //   `BEGIN Postgresql Transaction Query: ${query}; Params: ${params}`
      // )
      winston.info(`BEGIN Postgresql Transaction Query: ${query}`)
      res = await client.query(query, params)
      await client.query('COMMIT')
      winston.info('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      winston.error(`ROLLBACK! Error: ${err?.message || err}`)
      throw err
    }
  } finally {
    client.release()
  }
  return res
}

module.exports = tx
