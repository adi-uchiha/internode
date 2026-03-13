import { auth } from './auth';

export type Session = {
  user: User;
  session: typeof auth.$Infer.Session.session;
};

export type User = typeof auth.$Infer.Session.user & {
  username?: string;
  joinDate?: Date | string | null;
  notificationSettings?: {
    email: Record<string, boolean>;
    inApp: Record<string, boolean>;
  };
};
