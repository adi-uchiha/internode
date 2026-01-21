'use client';

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { mockInterns } from '@/data/mockData';
import Image from 'next/image';

const InternsList = () => (
  <AdminLayout title="All Interns">
    <div className="border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              {['Name', 'Department', 'Project', 'Status', 'Hours', 'Skills'].map((h) => (
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
            {mockInterns.map((intern) => (
              <tr
                key={intern.id}
                className="border-b border-border hover:bg-muted/30 cursor-pointer"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={intern.avatar}
                      alt={intern.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 border border-border"
                      unoptimized
                    />
                    <div>
                      <div className="font-mono text-sm">{intern.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{intern.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-sm">{intern.department}</td>
                <td className="p-4 font-mono text-sm">{intern.project}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 font-mono text-xs ${intern.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {intern.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 font-mono text-sm">{intern.totalHours}h</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {intern.skillTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 border border-border font-mono text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
);

export default InternsList;
