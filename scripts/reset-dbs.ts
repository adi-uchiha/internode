import { neon } from '@neondatabase/serverless';
import { execSync } from 'child_process';

const PROD_URL =
  'postgresql://neondb_owner:npg_2vaX5cGHDKxB@ep-small-shape-a16f58i5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DEV_URL =
  'postgresql://neondb_owner:npg_2vaX5cGHDKxB@ep-late-wind-a1um9cc1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function resetDatabase(url: string, name: string) {
  console.log(`\n--- Resetting ${name} Database ---`);
  const sql = neon(url);

  try {
    console.log(`Dropping and recreating public schema in ${name}...`);
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    await sql`GRANT ALL ON SCHEMA public TO public;`;
    await sql`COMMENT ON SCHEMA public IS 'standard public schema';`;

    console.log(`Dropping drizzle metadata schema in ${name}...`);
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`;

    console.log(`✅ ${name} reset successfully.`);
  } catch (error) {
    console.error(`❌ Failed to reset ${name}:`, error);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting full database reset...');

  await resetDatabase(PROD_URL, 'PRODUCTION');
  await resetDatabase(DEV_URL, 'DEVELOPMENT');

  console.log('\n--- All databases have been wiped clean ---');
  console.log('You can now run migrations safely.');

  // Running migration
  execSync('bun run db:migrate', { stdio: 'inherit' });
}

main();
