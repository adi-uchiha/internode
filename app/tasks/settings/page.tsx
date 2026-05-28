'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { ApiKeysManager } from './ApiKeysManager';
import { LogoUpload } from '@/components/shared/LogoUpload';
import {
  useOrganization,
  useUpdateOrganization,
  useUpdateOrganizationLogo,
} from '@/hooks/useOrganization';

import { NEXT_PUBLIC_LEMON_CHECKOUT_PRO, NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE } from '@/lib/env';

export default function SettingsPage() {
  const { orgRole, activeOrgId } = useAuth();
  const { data: orgDetails } = useOrganization();
  const updateOrgMutation = useUpdateOrganization();
  const updateLogoMutation = useUpdateOrganizationLogo();
  const [isBillingLoading, setIsBillingLoading] = useState(false);

  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  // Derive initial values from query — state is initialized from orgDetails
  // Using orgDetails as default prevents the need for a useEffect sync
  const [orgName, setOrgName] = useState('');
  const [brandingColor, setBrandingColor] = useState('#00FF80');
  const [isHydrated, setIsHydrated] = useState(false);

  // Only hydrate once when data first arrives (not on every re-render)
  if (orgDetails && !isHydrated) {
    setOrgName(orgDetails.organizationName);
    if (orgDetails.brandingColor) {
      setBrandingColor(orgDetails.brandingColor);
    }
    setIsHydrated(true);
  }

  const isSaving = updateOrgMutation.isPending;

  const handleSave = async () => {
    try {
      await updateOrgMutation.mutateAsync({
        name: orgName,
      });
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleLogoUpload = (url: string) => {
    updateLogoMutation.mutate(url, {
      onSuccess: () => toast.success('Logo updated successfully'),
      onError: () => toast.error('Failed to update logo'),
    });
  };

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const res = await fetch('/api/billing/portal');
      if (!res.ok) throw new Error('Failed to generate billing portal link');
      const data = await res.json();
      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank');
      } else {
        toast.error('Failed to open billing portal');
      }
    } catch {
      toast.error('Could not load billing portal');
    } finally {
      setIsBillingLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 border border-dashed border-border bg-card/30">
        <Icon icon="solar:shield-warning-linear" className="w-12 h-12 text-destructive/50 mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">Access Restricted</h2>
        <p className="text-muted-foreground text-sm max-w-md font-mono">
          ONLY_ADMINS_OR_OWNERS_CAN_ACCESS_ORGANIZATION_SETTINGS
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-muted-foreground mt-2 font-mono text-xs uppercase tracking-widest">
          Configure your organization environment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-display font-semibold text-lg">General</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Basic organization identification and branding.
          </p>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 border border-border bg-card/30 space-y-6">
            {/* Organization Logo */}
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">
                Organization Logo
              </label>
              <div className="flex items-center gap-4">
                <LogoUpload
                  currentLogoUrl={orgDetails?.logo}
                  orgId={activeOrgId ?? ''}
                  onUploadComplete={handleLogoUpload}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">
                    Recommended: 256×256px, PNG or WebP
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">
                    Max file size: 10 MB
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Organization Name
              </label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter org name..."
              />
            </div>

            {/* Branding Color */}
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Unified Branding Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border border-white/20 rounded-sm"
                  style={{ backgroundColor: brandingColor }}
                />
                <Input
                  value={brandingColor}
                  onChange={(e) => setBrandingColor(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Subscription Section */}
        <div className="md:col-span-1" id="billing">
          <h3 className="font-display font-semibold text-lg">Billing & Subscription</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Manage your organization plan, active limits, and Lemon Squeezy billing portal.
          </p>
        </div>
        <div className="md:col-span-2">
          <div className="p-6 border border-border bg-card/30 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                  Active Plan
                </span>
                <span className="font-display text-xl font-bold uppercase tracking-wider text-primary">
                  {orgDetails?.billing?.plan === 'enterprise'
                    ? 'Enterprise'
                    : orgDetails?.billing?.plan === 'pro'
                      ? 'Pro Growth'
                      : 'Starter Free'}
                </span>
              </div>
              <span
                className={`font-mono text-xs px-2 py-1 border ${
                  orgDetails?.billing?.status === 'active'
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                }`}
              >
                STATUS: {orgDetails?.billing?.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>

            {/* Usage limits */}
            <div className="space-y-4">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
                Resource Usage
              </span>

              {/* Member Limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">👥 TEAM INTERNS</span>
                  <span>
                    {orgDetails?.billing?.usage?.members?.used} /{' '}
                    {orgDetails?.billing?.usage?.members?.max === 999999
                      ? '∞'
                      : orgDetails?.billing?.usage?.members?.max}
                  </span>
                </div>
                <div className="h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((orgDetails?.billing?.usage?.members?.used || 0) /
                          (orgDetails?.billing?.usage?.members?.max || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Project Limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">📁 PROJECTS</span>
                  <span>
                    {orgDetails?.billing?.usage?.projects?.used} /{' '}
                    {orgDetails?.billing?.usage?.projects?.max === 999999
                      ? '∞'
                      : orgDetails?.billing?.usage?.projects?.max}
                  </span>
                </div>
                <div className="h-2 bg-black/40 border border-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((orgDetails?.billing?.usage?.projects?.used || 0) /
                          (orgDetails?.billing?.usage?.projects?.max || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Period end warning */}
            {orgDetails?.billing?.currentPeriodEnd && (
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                Current period ends:{' '}
                {new Date(orgDetails.billing.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}

            {/* CTAs */}
            <div className="pt-2">
              {orgDetails?.billing?.plan === 'free' ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="hero"
                    onClick={() =>
                      window.open(
                        `${NEXT_PUBLIC_LEMON_CHECKOUT_PRO}?checkout[custom][org_id]=${activeOrgId}`,
                        '_blank'
                      )
                    }
                  >
                    Upgrade to Pro Growth ($29) →
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `${NEXT_PUBLIC_LEMON_CHECKOUT_ENTERPRISE}?checkout[custom][org_id]=${activeOrgId}`,
                        '_blank'
                      )
                    }
                  >
                    Upgrade to Enterprise ($99) →
                  </Button>
                </div>
              ) : (
                <Button variant="hero" onClick={handleManageBilling} loading={isBillingLoading}>
                  <Icon icon="solar:card-rec-linear" className="w-4 h-4 mr-2" />
                  Manage Subscription & Invoices →
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <h3 className="font-display font-semibold text-lg">API Keys & Agents</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Manage machine-to-machine tokens for MCP servers, external AIs, and CI/CD pipelines.
            This binds all automated actions to your user account.
          </p>
        </div>
        <div className="md:col-span-2">
          <ApiKeysManager />
        </div>

        <div className="md:col-span-1">
          <h3 className="font-display font-semibold text-lg text-amber-400">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Irreversible actions that affect the entire organization.
          </p>
        </div>
        <div className="md:col-span-2">
          <div className="p-6 border border-destructive/20 bg-destructive/5 space-y-4">
            <h4 className="text-sm font-semibold text-destructive">Delete Organization</h4>
            <p className="text-xs text-muted-foreground">
              Once you delete an organization, there is no going back. Please be certain.
            </p>
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Delete {orgDetails?.organizationName || 'Organization'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <Button variant="hero" onClick={handleSave} loading={isSaving} className="min-w-[140px]">
          <Icon icon="solar:diskette-linear" className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
