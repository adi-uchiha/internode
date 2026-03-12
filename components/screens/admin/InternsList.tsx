'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useUsers } from '@/hooks/useUsers';
import { Icon } from '@iconify/react';
import Image from 'next/image';

const InternsList = () => {
  const { data: interns, isLoading } = useUsers();

  return (
    <AdminLayout title="All Interns">
      <div className="border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {['Name', 'Department', 'Role', 'Status', 'Log Status', 'Skills'].map((h) => (
                  <th
                    key={h}
                    className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Icon icon="solar:refresh-linear" className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : interns?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No interns found.
                  </td>
                </tr>
              ) : (
                interns?.map((intern) => (
                  <tr
                    key={intern.id}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-border overflow-hidden shrink-0 relative flex items-center justify-center bg-muted">
                          {intern.image ? (
                            <Image
                              src={intern.image}
                              alt={intern.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Icon
                              icon="solar:user-linear"
                              className="w-4 h-4 text-muted-foreground"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-sm">{intern.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {intern.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{intern.department || '-'}</td>
                    <td className="p-4 font-mono text-sm">{intern.role}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 font-mono text-xs ${intern.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                      >
                        {intern.status?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{intern.logStatus || '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {intern.skillTags && Array.isArray(intern.skillTags) ? (
                          intern.skillTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 border border-border font-mono text-xs"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground font-mono text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InternsList;
