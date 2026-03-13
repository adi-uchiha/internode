'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const { data: orgs, isPending } = authClient.useListOrganizations();
  const { data: session } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="px-4 py-2">
        <Skeleton className="h-8 w-full bg-muted/50 rounded-md" />
      </div>
    );
  }

  const activeOrgId = session?.session.activeOrganizationId;

  const handleSwitch = async (orgId: string | null) => {
    if (!orgId || orgId === activeOrgId) return;
    await authClient.organization.setActive({ organizationId: orgId });
    router.refresh(); // Fully evict client router cache guaranteeing clean state for new Org
  };

  if (collapsed) {
    // When sidebar is collapsed, show just an icon that might pop up the menu or simply an indicator
    const activeOrg = orgs?.find((o) => o.id === activeOrgId);
    return (
      <div className="px-2 py-2 flex justify-center">
        <div
          className="w-8 h-8 rounded-md bg-muted/50 border border-border flex items-center justify-center cursor-pointer group hover:bg-muted transition-colors"
          title={activeOrg?.name || 'Switch Organization'}
        >
          <Icon
            icon="solar:buildings-linear"
            className="w-4 h-4 text-muted-foreground group-hover:text-foreground"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 px-1 opacity-60">
        Organization
      </div>
      <Select value={activeOrgId || ''} onValueChange={handleSwitch}>
        <SelectTrigger className="w-full h-9 bg-muted/20 border-border hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary/50 text-sm font-medium">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border shadow-xl">
          {orgs?.map((org) => (
            <SelectItem
              key={org.id}
              value={org.id}
              className="font-medium cursor-pointer focus:bg-muted/50 focus:text-foreground hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Icon icon="solar:buildings-linear" className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{org.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
