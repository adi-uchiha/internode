import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: 'ph:monitor-duotone', badge: 2 },
  { label: 'Board', href: '/tasks/kanban', icon: 'ph:kanban-duotone' },
  { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'ph:ticket-duotone' },
  { label: 'Quick Log', href: '/admin/logs', icon: 'ph:article-duotone' },
  { label: 'Time Logs', href: '/tasks/time-logs', icon: 'ph:clock-duotone' },
  { label: 'All Interns', href: '/admin/interns', icon: 'ph:users-duotone' },
  { label: 'Projects', href: '/admin/projects', icon: 'ph:folder-duotone' },
  { label: 'Feedback', href: '/admin/feedback', icon: 'ph:chat-circle-dots-duotone', badge: 3 },
  { label: 'Analytics', href: '/admin/analytics', icon: 'ph:chart-bar-duotone' },
  { label: 'Reports', href: '/admin/reports', icon: 'ph:file-pdf-duotone' },
  { label: 'TM Analytics', href: '/tasks/analytics', icon: 'ph:presentation-chart-duotone' },
  {
    label: 'TM Members',
    href: '/tasks/members',
    icon: 'ph:users-three-duotone',
  },
  { label: 'Team Settings', href: '/admin/settings', icon: 'ph:gear-duotone' },
  { label: 'TM Settings', href: '/tasks/settings', icon: 'ph:wrench-duotone' },
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
