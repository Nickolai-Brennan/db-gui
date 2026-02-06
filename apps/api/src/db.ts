import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
}
