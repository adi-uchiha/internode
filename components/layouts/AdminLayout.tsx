import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const adminNavItems = [
  { label: 'HUD Dashboard', href: '/admin', icon: 'solar:monitor-linear', badge: 2 },
  { label: 'All Interns', href: '/admin/interns', icon: 'solar:users-group-rounded-linear' },
  { label: 'Daily Logs', href: '/admin/logs', icon: 'solar:document-text-linear' },
  { label: 'Feedback', href: '/admin/feedback', icon: 'solar:chat-round-dots-linear', badge: 3 },
  { label: 'Analytics', href: '/admin/analytics', icon: 'solar:chart-2-linear' },
  { label: 'Reports', href: '/admin/reports', icon: 'solar:file-text-linear' },
  { label: 'Projects', href: '/admin/projects', icon: 'solar:folder-linear' },
  { label: 'Team Settings', href: '/admin/settings', icon: 'solar:settings-linear' },
  {
    label: 'Task Manager',
    href: '/tasks/dashboard',
    icon: 'solar:widget-4-linear',
    subItems: [
      { label: 'Dashboard', href: '/tasks/dashboard' },
      { label: 'Kanban Board', href: '/tasks/kanban' },
      { label: 'My Tickets', href: '/tasks/my-tickets' },
      { label: 'Time Logs', href: '/tasks/time-logs' },
      { label: 'Members', href: '/tasks/members' },
      { label: 'Analytics', href: '/tasks/analytics' },
      { label: 'Settings', href: '/tasks/settings' },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  return (
    <DashboardLayout navItems={adminNavItems} title={title}>
      {children}
    </DashboardLayout>
  );
};
