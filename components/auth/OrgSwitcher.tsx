'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { CreateOrgModal } from './CreateOrgModal';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { safeSwitchOrganization } from '@/lib/auth-utils';

import { useOrganization } from '@/hooks/useOrganization';

interface OrgSwitcherProps {
  collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const { data: orgs, isPending } = authClient.useListOrganizations();
  const { session } = useAuth();
  const { data: orgDetails } = useOrganization();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  if (isPending) {
    return (
      <div className="px-4 py-2">
        <Skeleton className="h-8 w-full bg-muted/50 rounded-md" />
      </div>
    );
  }

  const activeOrgId = session?.session.activeOrganizationId;
  const activeOrgPlan = orgDetails?.billing?.plan;

  const handleSwitch = async (orgId: string | null) => {
    if (orgId === 'create-new') {
      setShowCreateModal(true);
      return;
    }
    if (!orgId || orgId === activeOrgId) return;

    // Use the atomic, cache-safe utility
    await safeSwitchOrganization(orgId, queryClient, router);
  };

  if (collapsed) {
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
        <SelectTrigger className="w-full h-9 bg-muted/20 border-border hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-primary/50 text-sm font-display font-semibold">
          <SelectValue placeholder="Select Organization">
            {orgs?.find((o) => o.id === activeOrgId) ? (
              <div className="flex items-center gap-2 max-w-full overflow-hidden">
                <Icon
                  icon="solar:buildings-linear"
                  className="w-4 h-4 text-muted-foreground shrink-0"
                />
                <span className="truncate">{orgs?.find((o) => o.id === activeOrgId)?.name}</span>
                {activeOrgPlan && (
                  <span
                    className={`font-mono text-[9px] uppercase px-1 border tracking-wider ml-1.5 shrink-0 ${
                      activeOrgPlan === 'enterprise'
                        ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5'
                        : activeOrgPlan === 'pro'
                          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                          : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {activeOrgPlan === 'enterprise'
                      ? 'Ent'
                      : activeOrgPlan === 'pro'
                        ? 'Pro'
                        : 'Free'}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select Organization</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border-border shadow-xl min-w-[200px]">
          {orgs?.map((org) => (
            <SelectItem
              key={org.id}
              value={org.id}
              className="font-display font-medium cursor-pointer focus:bg-muted/50 focus:text-foreground hover:bg-muted/50 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Icon icon="solar:buildings-linear" className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{org.name}</span>
              </div>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem
            value="create-new"
            className="font-display font-semibold text-primary cursor-pointer focus:bg-primary/10 focus:text-primary hover:bg-primary/10 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
              <span>Create New</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <CreateOrgModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
