'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { useTickets } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { RequireRole } from '@/components/auth/RequireRole';
import { ProjectModal } from '@/components/modals/ProjectModal';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tickets } = useTickets();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteProject = async (id: string, name: string) => {
    if (
      !confirm(`Are you sure you want to decommission project "${name}"? This action is permanent.`)
    )
      return;
    try {
      await deleteProject(id);
      toast.success('Project decommissioned');
    } catch {
      toast.error('Decommission sequence failed');
    }
  };

  const getProjectStats = (projectId: string) => {
    if (!tickets) return { total: 0, done: 0, hours: 0 };
    const projectTickets = tickets.filter((t) =>
      ((t.projectIds as string[]) || []).includes(projectId)
    );
    return {
      total: projectTickets.length,
      done: projectTickets.filter((t) => t.status === 'done').length,
      hours: projectTickets.reduce((sum, t) => sum + (t.loggedHours || 0), 0),
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-3xl tracking-tight">PROJECT_CORE</h2>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Registry of all active system initiatives
          </p>
        </div>
        <RequireRole role="admin">
          <Button
            variant="hero"
            className="font-mono text-xs uppercase tracking-widest px-6 shadow-lg shadow-primary/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
            Initialize Project
          </Button>
        </RequireRole>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {projectsLoading ? (
            <div className="col-span-full py-20 flex justify-center">
              <Spinner message="SCANNING_PROJECT_REGISTRY..." />
            </div>
          ) : projects?.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-border bg-muted/5">
              <Icon
                icon="solar:folder-error-linear"
                className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20"
              />
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                No active systems found in registry
              </p>
            </div>
          ) : (
            projects?.map((project) => {
              const stats = getProjectStats(project.id);
              const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group border border-border bg-card hover:border-primary/30 transition-all shadow-sm flex flex-col overflow-hidden relative"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: project.color || '#3b82f6' }}
                  />

                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 border border-border bg-muted/30">
                        <Icon
                          icon="solar:folder-linear"
                          className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                        />
                      </div>
                      <RequireRole role="admin">
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="text-muted-foreground hover:text-destructive p-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Icon icon="solar:trash-bin-trash-linear" className="w-5 h-5" />
                        </button>
                      </RequireRole>
                    </div>

                    <h3 className="font-display font-bold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-6">
                      ID: {project.id.slice(0, 8)} | STATUS:{' '}
                      {project.status?.toUpperCase() || 'ACTIVE'}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <div className="font-mono text-[9px] text-muted-foreground uppercase opacity-60">
                          Tasks
                        </div>
                        <div className="font-display font-bold">{stats.total}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-muted-foreground uppercase opacity-60">
                          Success
                        </div>
                        <div className="font-display font-bold">{stats.done}</div>
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-muted-foreground uppercase opacity-60">
                          Runtime
                        </div>
                        <div className="font-display font-bold text-primary">
                          {stats.hours.toFixed(1)}h
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center font-mono text-[9px] text-muted-foreground lowercase tracking-tighter">
                        <span>system_completion</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="border-t border-border p-3 bg-muted/20 hover:bg-primary/5 cursor-pointer transition-colors text-center font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-primary"
                    onClick={() => router.push(`/tasks/kanban?project=${project.name}`)}
                  >
                    Enter Cluster
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
