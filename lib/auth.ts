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
      username: { type: 'string', required: false },
      role: { type: 'string', input: false },
      status: { type: 'string' },
      joinDate: { type: 'date' },
      department: { type: 'string' },
      skillTags: { type: 'string[]', input: false },
      logStatus: { type: 'string' },
      lastLogTime: { type: 'date' },
      notificationSettings: { type: 'string' },
      organizationName: { type: 'string' },
      organizationDomain: { type: 'string' },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => {
        return {
          username: profile.login,
        };
      },
    },
  },
});
