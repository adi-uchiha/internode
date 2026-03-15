'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useOrganization, useUpdateOrganization } from '@/hooks/useOrganization';
import { useUpdateProfile } from '@/hooks/useUsers';
import { useLabels, useDeleteLabel } from '@/hooks/useLabels';
import { useAuth } from '@/contexts/AuthContext';
import { RequireRole } from '@/components/auth/RequireRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectModal } from '@/components/modals/ProjectModal';
import { LabelModal } from '@/components/modals/LabelModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const tabs = [
  { id: 'organization', label: 'Organization', icon: 'solar:buildings-linear' },
  { id: 'projects', label: 'Projects', icon: 'solar:folder-linear' },
  { id: 'kanban', label: 'Kanban Columns', icon: 'solar:widget-4-linear' },
  { id: 'notifications', label: 'Notifications', icon: 'solar:bell-linear' },
  { id: 'labels', label: 'Labels', icon: 'solar:tag-linear' },
];

const defaultColumns = [
  { name: 'To-Do', color: '#666666' },
  { name: 'In Progress', color: '#3b82f6' },
  { name: 'In Review', color: '#f59e0b' },
  { name: 'Done', color: '#00ff88' },
  { name: 'Unplanned', color: '#8b5cf6' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: organizationData, isLoading: organizationLoading } = useOrganization();
  const { mutateAsync: updateOrganization } = useUpdateOrganization();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const { data: labels, isLoading: labelsLoading } = useLabels();
  const { mutateAsync: deleteLabel } = useDeleteLabel();

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleDeleteLabel = async (id: string, name: string) => {
    if (!confirm(`Remove classification "${name}" from system library?`)) return;
    try {
      await deleteLabel(id);
      toast.success('Classification vector removed');
    } catch {
      toast.error('Deletion sequence failed');
    }
  };

  const handleCreateLabel = async () => {
    setIsLabelModalOpen(true);
  };

  // Organization Identity State (Local overrides for unsaved changes)
  const [localOrgName, setLocalOrgName] = useState<string | null>(null);
  const [localOrgDomain, setLocalOrgDomain] = useState<string | null>(null);

  // Notifications State (Local overrides for unsaved changes)
  const [localNotifPolicy, setLocalNotifPolicy] = useState<{
    email?: Record<string, boolean>;
    inApp?: Record<string, boolean>;
  } | null>(null);

  const orgName = localOrgName ?? organizationData?.organizationName ?? '';
  const orgDomain = localOrgDomain ?? organizationData?.organizationDomain ?? '';
  const notifPolicy = localNotifPolicy ?? user?.notificationSettings ?? { email: {}, inApp: {} };

  const handleSync = async () => {
    try {
      await updateOrganization({
        name: orgName,
        // slug: orgDomain, // Domain update might not be supported directly by update name/slug in authClient.organization.update the same way.
      });

      await updateProfile({
        notificationSettings: notifPolicy as {
          email: Record<string, boolean>;
          inApp: Record<string, boolean>;
        },
      });

      toast.success('System parameters synchronized');
    } catch {
      toast.error('Synchronization failed');
    }
  };

  const handleCreateProject = async () => {
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-6 px-4">
      {/* Left Navigation Sidebar */}
      <div className="w-full lg:w-[240px] shrink-0 space-y-1 bg-card/30 p-2 border border-border shadow-sm h-fit sticky top-24">
        <div className="px-3 py-4 mb-2">
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground opacity-60">
            System Config
          </h3>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-sm transition-all text-left group',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-r-2 border-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon={tab.icon}
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="font-medium tracking-tight">{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="w-3 h-3 text-primary animate-pulse"
              />
            )}
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="p-8">
              {activeTab === 'organization' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-sm bg-primary/10">
                      <Icon icon="solar:buildings-linear" className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl tracking-tight">
                      Organization Identity
                    </h3>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        Organization Name
                      </label>
                      <Input
                        value={orgName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLocalOrgName(e.target.value)
                        }
                        placeholder={organizationLoading ? 'Loading...' : 'InternHub Central'}
                        className="max-w-md bg-muted/30 border-border h-11 font-mono text-sm focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        Organization Domain
                      </label>
                      <div className="flex items-center max-w-md">
                        <Input
                          value={orgDomain}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setLocalOrgDomain(e.target.value)
                          }
                          placeholder={organizationLoading ? 'Loading...' : 'internhub-hq'}
                          className="bg-muted/30 border-border border-r-0 rounded-r-none h-11 font-mono text-sm focus-visible:ring-primary/20"
                        />
                        <div className="h-11 px-4 flex items-center bg-muted border border-border border-l-0 rounded-r-md text-xs font-mono text-muted-foreground">
                          .internode.app
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        Organization Logo
                      </label>
                      <div className="border-2 border-dashed border-border p-12 text-center max-w-md bg-muted/5 group hover:border-primary/40 transition-colors cursor-pointer rounded-lg">
                        <Icon
                          icon="solar:upload-minimalistic-linear"
                          className="w-10 h-10 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors"
                        />
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Drop branding assets here
                        </p>
                        <p className="text-[9px] text-muted-foreground opacity-50 font-mono">
                          PNG, SVG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end">
                    <RequireRole
                      role="admin"
                      fallback={
                        <Button
                          variant="hero"
                          className="px-8 shadow-lg shadow-primary/20"
                          onClick={handleSync}
                        >
                          Save Notification Settings
                        </Button>
                      }
                    >
                      <Button
                        variant="hero"
                        className="px-8 shadow-lg shadow-primary/20"
                        onClick={handleSync}
                      >
                        Synchronize Settings
                      </Button>
                    </RequireRole>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-blue-500/10 text-blue-500">
                        <Icon icon="solar:folder-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Active Projects
                      </h3>
                    </div>
                    <RequireRole role="admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-mono text-[10px] uppercase"
                        onClick={handleCreateProject}
                      >
                        + New System
                      </Button>
                    </RequireRole>
                  </div>

                  <div className="grid gap-3">
                    {projectsLoading ? (
                      <div className="text-center py-8 font-mono text-xs text-muted-foreground animate-pulse">
                        LOADING_PROJECT_REGISTRY...
                      </div>
                    ) : (
                      projects?.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-4 p-4 border border-border bg-muted/5 group hover:bg-muted/10 transition-all border-l-2"
                          style={{ borderLeftColor: p.color || '#3b82f6' }}
                        >
                          <Icon
                            icon="solar:reorder-linear"
                            className="w-4 h-4 text-muted-foreground cursor-grab opacity-30 hover:opacity-100"
                          />
                          <div className="flex-1 flex items-center gap-4">
                            <div className="text-sm font-bold">{p.name}</div>
                            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm whitespace-nowrap">
                              PREFIX: {p.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="font-mono text-[9px] text-muted-foreground uppercase opacity-50">
                                Status
                              </div>
                              <div className="text-xs font-bold capitalize">{p.status}</div>
                            </div>
                            <RequireRole role="admin">
                              <button
                                onClick={() => handleDeleteProject(p.id, p.name)}
                                className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-2 transition-all rounded-full"
                              >
                                <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4" />
                              </button>
                            </RequireRole>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'kanban' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-amber-500/10 text-amber-500">
                        <Icon icon="solar:widget-4-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Lifecycle Columns
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-mono text-[10px] uppercase"
                    >
                      + Add Stage
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {defaultColumns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center gap-4 p-4 border border-border bg-muted/5 group hover:bg-muted/10 transition-all"
                      >
                        <Icon
                          icon="solar:hamburger-menu-linear"
                          className="w-4 h-4 text-muted-foreground cursor-grab"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                          style={{ backgroundColor: col.color }}
                        />
                        <Input
                          defaultValue={col.name}
                          className="flex-1 bg-transparent border-none p-0 h-auto text-sm font-medium focus-visible:ring-0"
                        />
                        <button className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-2 transition-all">
                          <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-sm bg-red-500/10 text-red-500">
                      <Icon icon="solar:bell-linear" className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-xl tracking-tight">Signal Matrix</h3>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                            Trigger Event
                          </TableHead>
                          <TableHead className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4 w-[100px]">
                            SMTP
                          </TableHead>
                          <TableHead className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4 w-[100px]">
                            HUD
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 'assignment', event: 'Ticket assignment sequence' },
                          { id: 'deadline', event: 'Deadline threshold bypass' },
                          { id: 'log', event: 'Activity log commit' },
                          { id: 'transition', event: 'State transition update' },
                          { id: 'critical', event: 'Critical priority escalation' },
                        ].map((row) => (
                          <TableRow key={row.id} className="border-border hover:bg-muted/10">
                            <TableCell className="font-medium text-sm py-4">{row.event}</TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={notifPolicy?.email?.[row.id] || false}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setLocalNotifPolicy((prev) => {
                                      const current = prev || notifPolicy;
                                      return {
                                        ...current,
                                        email: { ...current.email, [row.id]: e.target.checked },
                                      };
                                    });
                                  }}
                                  className="w-4 h-4 accent-primary"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={notifPolicy?.inApp?.[row.id] || false}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setLocalNotifPolicy((prev) => {
                                      const current = prev || notifPolicy;
                                      return {
                                        ...current,
                                        inApp: { ...current.inApp, [row.id]: e.target.checked },
                                      };
                                    });
                                  }}
                                  className="w-4 h-4 accent-primary"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'labels' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-primary/10 text-primary">
                        <Icon icon="solar:tag-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Classification Library
                      </h3>
                    </div>
                    <RequireRole role="admin">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-mono text-[10px] uppercase"
                        onClick={handleCreateLabel}
                      >
                        + Create Label
                      </Button>
                    </RequireRole>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {labelsLoading ? (
                      <div className="col-span-2 py-12 text-center font-mono text-xs text-muted-foreground animate-pulse">
                        LOADING_CLASSIFICATION_LIBRARY...
                      </div>
                    ) : (
                      labels?.map((label) => (
                        <div
                          key={label.id}
                          className="flex items-center gap-3 p-3 border border-border bg-background group relative overflow-hidden"
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={{ backgroundColor: label.color }}
                          />
                          <div className="flex-1 font-mono text-xs font-bold uppercase tracking-tight">
                            {label.name}
                          </div>
                          <input
                            type="color"
                            value={label.color}
                            readOnly
                            className="w-6 h-6 bg-transparent border-0 cursor-default rounded-sm overflow-hidden"
                          />
                          <RequireRole role="admin">
                            <button
                              onClick={() => handleDeleteLabel(label.id, label.name)}
                              className="text-muted-foreground hover:text-destructive transition-colors px-1"
                            >
                              <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4" />
                            </button>
                          </RequireRole>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
      <LabelModal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} />
    </div>
  );
}
