import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.postgress_url || '')

export { sql }
