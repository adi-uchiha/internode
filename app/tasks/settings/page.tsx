'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { UnifiedLoader } from '@/components/ui/UnifiedLoader';

export default function SettingsPage() {
  const { orgRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = orgRole === 'admin' || orgRole === 'owner';

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success('Settings updated successfully');
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
          Configure your workspace environment
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
          <div className="p-6 border border-border bg-card/30 space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Organization Name
              </label>
              <Input placeholder="Enter org name..." defaultValue="Internode" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-2">
                Unified Branding Color
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary border border-white/20" />
                <Input defaultValue="#00FF80" className="font-mono" />
              </div>
            </div>
          </div>
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
              Delete Internode
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-border">
        <Button variant="hero" onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
          {isSaving ? (
            <UnifiedLoader size="sm" />
          ) : (
            <>
              <Icon icon="solar:diskette-linear" className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
