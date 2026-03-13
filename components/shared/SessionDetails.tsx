'use client';

import { Icon } from '@iconify/react';
import { jetBrainsMono } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { Session } from '@/lib/auth-types';
import { useState, useEffect } from 'react';

interface SessionDetailsProps {
  session: Session | null;
}

const DetailItem = ({
  label,
  value,
  icon,
  className,
  mounted,
}: {
  label: string;
  value: unknown;
  icon?: string;
  className?: string;
  mounted: boolean;
}) => {
  if (value === null || value === undefined) return null;

  // Format dates if they look like dates
  let displayValue = value;
  if (mounted) {
    if (value instanceof Date) {
      displayValue = value.toLocaleString();
    } else if (typeof value === 'string' && value.length > 10) {
      // Check for ISO-like strings or other date formats explicitly
      // A more robust check: ISO format usually has - and : and T
      const isIsoDate =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) ||
        (/^\d{4}-\d{2}-\d{2}/.test(value) && !isNaN(Date.parse(value)));

      if (isIsoDate) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          displayValue = date.toLocaleString();
        }
      }
    }
  }

  return (
    <div className={cn('flex flex-col gap-1 p-3 border border-border bg-card/50', className)}>
      <div className="flex items-center gap-2 opacity-50">
        {icon && <Icon icon={icon} className="w-3.5 h-3.5" />}
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={cn('font-display text-sm font-medium truncate', jetBrainsMono.className)}>
        {typeof displayValue === 'object' ? JSON.stringify(displayValue) : displayValue.toString()}
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: string;
}) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <Icon icon={icon} className="w-4 h-4 text-primary" />
      <h3 className="font-display font-bold text-sm tracking-tight uppercase">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
  </div>
);

export const SessionDetails = ({ session }: SessionDetailsProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!session) return null;

  const { user, session: sessionInfo } = session;

  return (
    <div className="space-y-12">
      {/* Identity & Core Info */}
      <Section title="Identity & Security" icon="solar:shield-user-linear">
        <DetailItem label="User ID" value={user.id} icon="solar:id-card-linear" mounted={mounted} />
        <DetailItem
          label="Username"
          value={user.username}
          icon="solar:mention-square-linear"
          mounted={mounted}
        />
        <DetailItem label="Email" value={user.email} icon="solar:letter-linear" mounted={mounted} />
        <DetailItem
          label="Email Verified"
          value={user.emailVerified ? 'TRUE' : 'FALSE'}
          icon="solar:check-read-linear"
          mounted={mounted}
        />
        <DetailItem
          label="Role"
          value={user.role}
          icon="solar:crown-linear"
          className="border-primary/30 bg-primary/5"
          mounted={mounted}
        />
      </Section>

      {/* Account Metadata */}
      <Section title="Account Metadata" icon="solar:case-linear">
        <DetailItem
          label="Join Date"
          value={user.joinDate}
          icon="solar:calendar-linear"
          mounted={mounted}
        />
        <DetailItem
          label="Created At"
          value={user.createdAt}
          icon="solar:calendar-add-linear"
          mounted={mounted}
        />
        <DetailItem
          label="Updated At"
          value={user.updatedAt}
          icon="solar:refresh-linear"
          mounted={mounted}
        />
      </Section>

      {/* Preferences */}
      <Section title="Preferences" icon="solar:settings-linear">
        <DetailItem
          label="Notification Settings"
          value={user.notificationSettings}
          icon="solar:bell-linear"
          mounted={mounted}
        />
      </Section>

      {/* Session Metadata */}
      <Section title="Active Session Metadata" icon="solar:key-linear">
        <DetailItem
          label="Session ID"
          value={sessionInfo.id}
          icon="solar:id-card-linear"
          mounted={mounted}
        />
        <DetailItem
          label="IP Address"
          value={sessionInfo.ipAddress}
          icon="solar:map-point-linear"
          mounted={mounted}
        />
        <DetailItem
          label="User Agent"
          value={sessionInfo.userAgent}
          icon="solar:monitor-linear"
          className="md:col-span-2"
          mounted={mounted}
        />
        <DetailItem
          label="Token"
          value={sessionInfo.token}
          icon="solar:lock-password-linear"
          className="md:col-span-3"
          mounted={mounted}
        />
        <DetailItem
          label="Expires At"
          value={sessionInfo.expiresAt}
          icon="solar:clock-circle-linear"
          mounted={mounted}
        />
        <DetailItem
          label="Created At"
          value={sessionInfo.createdAt}
          icon="solar:calendar-add-linear"
          mounted={mounted}
        />
        <DetailItem
          label="Updated At"
          value={sessionInfo.updatedAt}
          icon="solar:refresh-linear"
          mounted={mounted}
        />
      </Section>
    </div>
  );
};
