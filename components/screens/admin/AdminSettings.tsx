import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [workspaceName, setWorkspaceName] = useState('INTERNODE_LABS');
  const [inviteEmail, setInviteEmail] = useState('');

  const handleSaveWorkspace = () => {
    toast.success('Workspace settings updated');
  };

  const handleSendInvite = () => {
    if (!inviteEmail) return;
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <AdminLayout title="System Settings">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Workspace Profile */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground uppercase tracking-widest">
            <Icon icon="solar:globus-linear" className="w-4 h-4" />
            [WORKSPACE_PROFILE]
          </div>

          <div className="border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground uppercase">
                Workspace Name
              </label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="font-mono bg-background border-border"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveWorkspace} variant="hero" size="sm">
                SAVE CHANGES
              </Button>
            </div>
          </div>
        </section>

        {/* Invite System */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground uppercase tracking-widest">
            <Icon icon="solar:user-plus-linear" className="w-4 h-4" />
            [INVITE_SYSTEM]
          </div>

          <div className="border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground uppercase">
                Invitee Email Address
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="intern@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="font-mono bg-background border-border"
                />
                <Button onClick={handleSendInvite} variant="outline" size="sm" className="shrink-0">
                  SEND INVITE
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="font-mono text-[10px] text-muted-foreground uppercase mb-3">
                Active Invitations
              </div>
              <div className="text-center py-6 border border-dashed border-border font-mono text-xs text-muted-foreground">
                NO PENDING INVITATIONS
              </div>
            </div>
          </div>
        </section>

        {/* Security / System */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground uppercase tracking-widest">
            <Icon icon="solar:shield-check-linear" className="w-4 h-4" />
            [SYSTEM_CONTROLS]
          </div>

          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm font-semibold">Maintenance Mode</div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Restrict access to admins only during migrations.
                </p>
              </div>
              <div className="w-12 h-6 bg-muted border border-border flex items-center px-1">
                <div className="w-4 h-4 bg-muted-foreground" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
