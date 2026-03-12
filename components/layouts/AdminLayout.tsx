import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: 'solar:monitor-linear', badge: 2 },
  { label: 'Board', href: '/tasks/kanban', icon: 'solar:widget-4-linear' },
  { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'solar:folder-open-linear' },
  { label: 'Quick Log', href: '/admin/logs', icon: 'solar:document-text-linear' },
  { label: 'Time Logs', href: '/tasks/time-logs', icon: 'solar:clock-circle-linear' },
  { label: 'All Interns', href: '/admin/interns', icon: 'solar:users-group-rounded-linear' },
  { label: 'Projects', href: '/admin/projects', icon: 'solar:folder-linear' },
  { label: 'Feedback', href: '/admin/feedback', icon: 'solar:chat-round-dots-linear', badge: 3 },
  { label: 'Analytics', href: '/admin/analytics', icon: 'solar:chart-2-linear' },
  { label: 'Reports', href: '/admin/reports', icon: 'solar:file-text-linear' },
  { label: 'TM Analytics', href: '/tasks/analytics', icon: 'solar:graph-up-linear' },
  {
    label: 'TM Members',
    href: '/tasks/members',
    icon: 'solar:users-group-two-rounded-linear',
  },
  { label: 'Team Settings', href: '/admin/settings', icon: 'solar:settings-linear' },
  { label: 'TM Settings', href: '/tasks/settings', icon: 'solar:settings-linear' },
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
