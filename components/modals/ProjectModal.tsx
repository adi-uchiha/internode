'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateProject } from '@/hooks/useProjects';
import { toast } from '@/lib/toast';
import { Spinner } from '@/components/ui/Spinner';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const { mutateAsync: createProject, isPending } = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      await createProject({
        name,
        color,
        status: 'active',
      });
      toast.success('Project initialized successfully');
      setName('');
      onClose();
    } catch (err) {
      console.error('[PROJECT_MODAL_ERROR]', err);
      toast.error('Failed to initialize project: System rejection.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md border border-border bg-card z-101 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              />
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-primary/10">
                    <Icon icon="solar:folder-add-linear" className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display font-bold text-xl tracking-tight uppercase">
                    Initialize Project
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Project Name
                  </label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Phoenix Engine"
                    className="bg-muted/30 border-border h-11 font-mono text-sm focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    System Color
                  </label>
                  <div className="flex gap-3 items-center">
                    <div
                      className="w-11 h-11 rounded-sm border border-border shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="bg-muted/30 border-border h-11 font-mono text-sm flex-1"
                    />
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-11 h-11 bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 font-mono text-xs uppercase tracking-widest"
                    onClick={onClose}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    className="flex-1 h-11 font-mono text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Spinner
                        size="sm"
                        message="Syncing..."
                        iconClassName="text-primary-foreground"
                      />
                    ) : (
                      'Initialize'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
