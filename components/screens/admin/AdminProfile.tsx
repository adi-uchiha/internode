'use client';

import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { SessionDetails } from '@/components/shared/SessionDetails';

const AdminProfile = () => {
  const { user, session } = useAuth();

  return (
    <AdminLayout title="Profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative w-24 h-24 border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Icon icon="solar:user-linear" className="w-12 h-12 text-primary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                [ADMIN_PROFILE]
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">{user?.name}</h1>
              <p className="font-mono text-muted-foreground mb-4">{user?.email}</p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-3 py-1 border border-primary bg-primary/10 font-mono text-xs text-primary uppercase">
                  Administrator
                </span>
                <span className="px-3 py-1 border border-border font-mono text-xs text-muted-foreground">
                  Joined{' '}
                  {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Session Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border border-border bg-card p-6"
        >
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-6">
            [SESSION_METADATA_DEBUG]
          </div>
          <SessionDetails session={session} />
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
