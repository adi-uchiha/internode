import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

/**
 * Singleton pattern to prevent multiple pool instances in development
 * which can lead to "too many connections" errors in serverless/dev.
 */
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = globalForDb.pool ?? new Pool({ connectionString });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

/**
 * Standard Drizzle Client
 * With schema pre-loaded for AI-friendly autocomplete and type safety.
 */
export const db = drizzle(pool, { schema });

/**
 * Helper to check connection health
 */
export async function checkConnection() {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    return { status: 'healthy', latency: `${Date.now() - start}ms` };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { status: 'unhealthy', error: String(error) };
  }
}
