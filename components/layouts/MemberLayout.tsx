import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const memberNavItems = [
  { label: 'Quick Log', href: '/member', icon: 'solar:document-add-linear' },
  { label: 'Activity Graph', href: '/member/activity', icon: 'solar:chart-square-linear' },
  { label: 'Weekly Goals', href: '/member/goals', icon: 'solar:target-linear' },
  { label: 'My Skills', href: '/member/skills', icon: 'solar:code-square-linear' },
  { label: 'Monthly View', href: '/member/monthly', icon: 'solar:calendar-linear' },
  { label: 'Breakthroughs', href: '/member/breakthroughs', icon: 'solar:star-linear' },
  { label: 'Leave', href: '/member/leave', icon: 'solar:calendar-mark-linear' },
  { label: 'Profile', href: '/member/profile', icon: 'solar:user-circle-linear' },
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
