import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { render } from '@react-email/render';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { client } from './email';
import { RESEND_FROM_EMAIL, NEXT_PUBLIC_APP_URL } from './env';
import { InvitationEmail } from '@/emails/InvitationEmail';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
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
        try {
          const acceptUrl = `${NEXT_PUBLIC_APP_URL}/accept-invite?invitationId=${data.id}`;

          const html = await render(
            InvitationEmail({
              inviterName: data.inviter.user.name || 'A team member',
              inviterEmail: data.inviter.user.email,
              organizationName: data.organization.name,
              role: data.role,
              acceptUrl,
              expiresInDays: 7,
              baseUrl: NEXT_PUBLIC_APP_URL,
            })
          );

          await client.sendAsync({
            from: RESEND_FROM_EMAIL,
            to: data.email,
            subject: `You've been invited to join ${data.organization.name} on Internode`,
            attachment: [{ data: html, alternative: true }],
          });

          console.log(`[auth] Invitation email sent to ${data.email} via Gmail SMTP`);
        } catch (err) {
          // Never let email failures break the invitation creation flow
          console.error('[auth] sendInvitationEmail threw:', err);
        }
      },
    }),
  ],
  user: {
    additionalFields: {
      username: { type: 'string', required: false },
      joinDate: { type: 'date' },
      notificationSettings: { type: 'string' },
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
          name: profile.name || profile.login,
        };
      },
    },
  },
});
