import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/academic_krs';

const isCloud = process.env.DATABASE_SSL === 'true' || 
  rawConnectionString.includes('neon.tech') || 
  rawConnectionString.includes('supabase.co');

let cleanConnectionString = rawConnectionString;
try {
  const urlObj = new URL(rawConnectionString);
  urlObj.searchParams.delete('sslmode');
  urlObj.searchParams.delete('channel_binding');
  cleanConnectionString = urlObj.toString();
} catch {}

export const pool = new Pool({
  connectionString: cleanConnectionString,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});
