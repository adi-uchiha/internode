/**
 * baseline-prod-migrations.ts
 *
 * SAFE — does NOT delete or modify any production data.
 *
 * When `db push --force` is used, the `drizzle.__drizzle_migrations` tracking
 * table can be wiped or skipped. The next Vercel deploy runs `db:migrate`
 * against prod, sees no tracking records, and tries to re-apply migration 0000
 * which fails with "relation already exists" because the tables are already there.
 *
 * This script recreates ONLY the drizzle metadata schema and inserts all
 * migration history records, making `db:migrate` a safe no-op on next deploy.
 *
 * Usage:
 *   DATABASE_URL=<prod_url> bun run scripts/baseline-prod-migrations.ts
 */

import { neon } from '@neondatabase/serverless';

const PROD_URL = process.env.DATABASE_URL || '';

if (!PROD_URL) {
  console.error(
    '❌ Missing DATABASE_URL environment variable. Please run with DATABASE_URL=<prod_url>'
  );
  process.exit(1);
}

// All 16 migration entries from db/migrations/meta/_journal.json
const migrations = [
  { idx: 0, tag: '0000_known_starjammers', when: 1773053098329 },
  { idx: 1, tag: '0001_plain_paladin', when: 1773064777612 },
  { idx: 2, tag: '0002_fantastic_grim_reaper', when: 1773317754311 },
  { idx: 3, tag: '0003_ancient_marvel_zombies', when: 1773386709069 },
  { idx: 4, tag: '0004_faithful_gauntlet', when: 1773388271540 },
  { idx: 5, tag: '0005_whole_brother_voodoo', when: 1773388321067 },
  { idx: 6, tag: '0006_sudden_baron_strucker', when: 1773412410475 },
  { idx: 7, tag: '0007_nice_the_hunter', when: 1773421931482 },
  { idx: 8, tag: '0008_fancy_tomorrow_man', when: 1773488429448 },
  { idx: 9, tag: '0009_busy_malice', when: 1773488675668 },
  { idx: 10, tag: '0010_gray_mad_thinker', when: 1773502377187 },
  { idx: 11, tag: '0011_wooden_invisible_woman', when: 1774014670764 },
  { idx: 12, tag: '0012_wonderful_senator_kelly', when: 1774097406236 },
  { idx: 13, tag: '0013_early_the_liberteens', when: 1774286451104 },
  { idx: 14, tag: '0014_slow_queen_noir', when: 1774287105071 },
  { idx: 15, tag: '0015_little_sentinels', when: 1779938521826 },
];

async function main() {
  console.log('🔍 Connecting to PRODUCTION database...');
  const sql = neon(PROD_URL);

  // 1. Create drizzle schema if missing
  console.log('📦 Ensuring drizzle schema exists...');
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;

  // 2. Create the migrations tracking table if missing
  console.log('📋 Ensuring __drizzle_migrations table exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id        SERIAL PRIMARY KEY,
      hash      TEXT NOT NULL,
      created_at BIGINT
    )
  `;

  // 3. Check how many records already exist
  const existing = await sql`SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations`;
  const count = Number(existing[0].count);
  console.log(`ℹ️  Found ${count} existing migration records in prod.`);

  if (count === migrations.length) {
    console.log('✅ All migrations already baselined. No action needed.');
    return;
  }

  if (count > 0) {
    console.log(
      `⚠️  Partial baseline found (${count}/${migrations.length}). Inserting missing records...`
    );
  } else {
    console.log('⚠️  No migration records found. Inserting all baseline records...');
  }

  // 4. Insert only missing records (by tag as hash)
  const existingHashes = await sql`SELECT hash FROM drizzle.__drizzle_migrations`;
  const existingSet = new Set(existingHashes.map((r: Record<string, unknown>) => r.hash as string));

  let inserted = 0;
  for (const migration of migrations) {
    if (!existingSet.has(migration.tag)) {
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES (${migration.tag}, ${migration.when})
      `;
      console.log(`  ✅ Inserted: ${migration.tag}`);
      inserted++;
    } else {
      console.log(`  ⏭️  Skipped (already exists): ${migration.tag}`);
    }
  }

  console.log(`\n✅ Done. Inserted ${inserted} migration record(s).`);
  console.log('🚀 Next Vercel deploy will now run db:migrate safely (no-op).');
}

main().catch((err) => {
  console.error('❌ Baseline failed:', err);
  process.exit(1);
});
