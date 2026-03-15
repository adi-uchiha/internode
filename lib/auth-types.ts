import { auth } from './auth';

export type Session = typeof auth.$Infer.Session;

export interface NotificationSettings {
  email: Record<string, boolean>;
  inApp: Record<string, boolean>;
}

export type User = typeof auth.$Infer.Session.user & {
  // Use the refined notificationSettings type
  notificationSettings?: NotificationSettings;
};
