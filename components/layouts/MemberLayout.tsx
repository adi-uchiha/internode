import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const memberNavItems = [
  { label: 'Dashboard', href: '/tasks/dashboard', icon: 'ph:chart-pie-duotone' },
  { label: 'Board', href: '/tasks/kanban', icon: 'ph:kanban-duotone' },
  { label: 'My Tickets', href: '/tasks/my-tickets', icon: 'ph:ticket-duotone' },
  { label: 'Quick Log', href: '/member', icon: 'ph:plus-circle-duotone' },
  { label: 'Time Logs', href: '/tasks/time-logs', icon: 'ph:clock-duotone' },
  { label: 'Activity Graph', href: '/member/activity', icon: 'ph:chart-line-up-duotone' },
  { label: 'Weekly Goals', href: '/member/goals', icon: 'ph:target-duotone' },
  { label: 'My Skills', href: '/member/skills', icon: 'ph:code-duotone' },
  { label: 'Monthly View', href: '/member/monthly', icon: 'ph:calendar-duotone' },
  { label: 'Breakthroughs', href: '/member/breakthroughs', icon: 'ph:lightning-duotone' },
  { label: 'Leave', href: '/member/leave', icon: 'ph:calendar-blank-duotone' },
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
