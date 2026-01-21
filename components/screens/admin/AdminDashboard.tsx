'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { mockInterns } from '@/data/mockData';

const AdminDashboard = () => {
  const greenCount = mockInterns.filter((i) => i.logStatus === 'green').length;
  const yellowCount = mockInterns.filter((i) => i.logStatus === 'yellow').length;
  const redCount = mockInterns.filter((i) => i.logStatus === 'red').length;

  return (
    <AdminLayout title="HUD Dashboard">
      <div className="space-y-8">
        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Productive',
              count: greenCount,
              color: 'bg-green-500',
              icon: 'solar:check-circle-linear',
            },
            {
              label: 'Has Blocker',
              count: yellowCount,
              color: 'bg-yellow-500',
              icon: 'solar:danger-triangle-linear',
            },
            {
              label: 'Missing Log',
              count: redCount,
              color: 'bg-red-500',
              icon: 'solar:close-circle-linear',
            },
          ].map((status, i) => (
            <motion.div
              key={status.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 ${status.color}`} />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  [{status.label}]
                </span>
              </div>
              <div className="font-display text-4xl font-bold">{status.count}</div>
            </motion.div>
          ))}
        </div>

        {/* Intern Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          <h2 className="font-display font-semibold text-lg mb-6">Team Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockInterns.map((intern) => (
              <div
                key={intern.id}
                className="border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-3 h-3 ${intern.logStatus === 'green' ? 'bg-green-500' : intern.logStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  />
                  {intern.lastLogTime && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {intern.lastLogTime}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 border border-border mb-2 overflow-hidden">
                  <Image src={intern.avatar} alt={intern.name} fill className="object-cover" />
                </div>
                <div className="font-mono text-sm truncate">{intern.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{intern.department}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
