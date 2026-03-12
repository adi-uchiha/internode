import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const memberNavItems = [
  { label: 'Dashboard', href: '/tasks/dashboard', icon: 'solar:chart-2-linear' },
  { label: 'Board', href: '/tasks/kanban', icon: 'solar:widget-4-linear' },
  { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'solar:folder-open-linear' },
  { label: 'Quick Log', href: '/member', icon: 'solar:document-add-linear' },
  { label: 'Time Logs', href: '/tasks/time-logs', icon: 'solar:clock-circle-linear' },
  { label: 'Activity Graph', href: '/member/activity', icon: 'solar:chart-square-linear' },
  { label: 'Weekly Goals', href: '/member/goals', icon: 'solar:target-linear' },
  { label: 'My Skills', href: '/member/skills', icon: 'solar:code-square-linear' },
  { label: 'Monthly View', href: '/member/monthly', icon: 'solar:calendar-linear' },
  { label: 'Breakthroughs', href: '/member/breakthroughs', icon: 'solar:star-linear' },
  { label: 'Leave', href: '/member/leave', icon: 'solar:calendar-mark-linear' },
];

interface MemberLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const MemberLayout = ({ children, title }: MemberLayoutProps) => {
  return (
    <DashboardLayout navItems={memberNavItems} title={title}>
      {children}
    </DashboardLayout>
  );
};
