import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/academic_krs';

export const pool = new Pool({
  connectionString,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_SSL === 'true' || connectionString.includes('neon.tech') || connectionString.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
