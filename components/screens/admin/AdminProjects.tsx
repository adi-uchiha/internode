'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useProjects } from '@/hooks/useProjects';
import { Icon } from '@iconify/react';

const AdminProjects = () => {
  const { data: projects, isLoading } = useProjects();

  return (
    <AdminLayout title="Projects">
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Icon
            icon="solar:refresh-linear"
            className="w-8 h-8 animate-spin text-muted-foreground"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects?.map((proj) => (
            <div key={proj.id} className="border border-border bg-card p-6">
              <div className="flex justify-between mb-2">
                <h3 className="font-display font-semibold">{proj.name}</h3>
                <span
                  className={`px-2 py-1 font-mono text-xs ${proj.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  {proj.status.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-sm text-muted-foreground mb-4">{proj.description}</p>
              <div className="flex gap-1">
                {proj.techStack?.map((t) => (
                  <span key={t} className="px-2 py-0.5 border border-border font-mono text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-center p-8 border border-dashed border-border text-muted-foreground">
              No projects found.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProjects;
