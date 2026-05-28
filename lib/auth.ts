import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  NEXT_PUBLIC_APP_URL,
  BETTER_AUTH_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from './env';
import { EmailService } from './email/service';
import { assertPlanLimit } from './billing-plans';

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  databaseHooks: {
    invitation: {
      create: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        before: async (invitation: any) => {
          await assertPlanLimit(invitation.organizationId, 'members');
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          // Fire-and-forget welcome email after every new account creation
          void EmailService.welcome({
            userEmail: user.email,
            payload: {
              to: user.email,
              organizationName: 'Internode',
              userName: user.name || user.email.split('@')[0],
              dashboardUrl: NEXT_PUBLIC_APP_URL,
            },
          }).catch((err) => {
            console.error('[auth:databaseHooks] Failed to send welcome email:', err);
          });
        },
      },
    },
  },
  plugins: [
    organization({
      /**
       * Called by better-auth whenever a new invitation is created via
       * `authClient.organization.inviteMember()`.
       *
       * `data` contains:
       *   - id           : invitation ID (use as the token in the accept URL)
       *   - email        : invitee email
       *   - role         : invited role
       *   - organization : { id, name, slug, ... }
       *   - inviter      : { name, email }
       */
      sendInvitationEmail: async (data) => {
        // Delegates to EmailService — handles SMTP rendering, error catching, and logging.
        // Invitations bypass preference gates — they are always transactional.
        void EmailService.sendInvitation({
          inviteeEmail: data.email,
          payload: {
            to: data.email,
            organizationName: data.organization.name,
            inviterName: data.inviter.user.name || 'A team member',
            inviterEmail: data.inviter.user.email,
            role: data.role,
            acceptUrl: `${NEXT_PUBLIC_APP_URL}/accept-invite?invitationId=${data.id}`,
            expiresInDays: 7,
            baseUrl: NEXT_PUBLIC_APP_URL,
          },
        }).catch((err) => {
          console.error('[auth:plugins] Failed to send invitation email:', err);
        });
      },
    }),
  ],
  user: {
    additionalFields: {
      username: { type: 'string', required: false },
      joinDate: { type: 'date' },
      notificationSettings: { type: 'json' },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        return {
          username: profile.login,
          name: profile.name || profile.login,
        };
      },
    },
  },
});
