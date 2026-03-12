import { auth } from './auth';

export type Session = {
  user: User;
  session: typeof auth.$Infer.Session.session;
};
export type User = typeof auth.$Infer.Session.user & {
  role: 'admin' | 'member';
  username?: string;
  status?: 'active' | 'inactive' | 'on-leave';
  notificationSettings?: {
    email: Record<string, boolean>;
    inApp: Record<string, boolean>;
  };

  organizationName?: string;
  organizationDomain?: string;
  department?: string | null;
  joinDate?: Date | string | null;
  skillTags?: string[] | null;
  logStatus?: 'green' | 'yellow' | 'red' | null;
  lastLogTime?: Date | string | null;
};
