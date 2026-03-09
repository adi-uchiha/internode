import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: { type: 'string' },
      status: { type: 'string' },
      joinDate: { type: 'date' },
      department: { type: 'string' },
      skillTags: { type: 'string[]', input: false },
      logStatus: { type: 'string' },
      lastLogTime: { type: 'date' },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
