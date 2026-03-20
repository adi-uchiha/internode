import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { NEXT_PUBLIC_APP_URL } from './env';

export const authClient = createAuthClient({
  baseURL: NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient()],
});
