'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/hooks/useProjects';
import { useCreateBreakthrough } from '@/hooks/useBreakthroughs';
import { toast } from 'sonner';

interface BreakthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BreakthroughModal({ isOpen, onClose }: BreakthroughModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [prLink, setPrLink] = useState('');
  const [skillTags, setSkillTags] = useState('');

  const { data: projects } = useProjects();
  const { mutateAsync: createBreakthrough, isPending } = useCreateBreakthrough();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and Description are required');
      return;
    }

    try {
      const tags = skillTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      await createBreakthrough({
        title,
        description,
        projectId: projectId || null,
        prLink: prLink || null,
        skillTags: tags,
      });

      toast.success('Breakthrough archived in system history');
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setProjectId('');
      setPrLink('');
      setSkillTags('');
    } catch {
      toast.error('Failed to archive breakthrough');
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg border border-border bg-card z-101 shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-primary/10">
                    <Icon icon="solar:star-fall-2-linear" className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-2xl tracking-tight uppercase">
                      Log Breakthrough
                    </h2>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                      Record a significant technical achievement
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon icon="solar:close-circle-linear" className="w-7 h-7" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Achievement Title
                  </label>
                  <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Optimized SQL Engine by 400%"
                    className="bg-muted/30 border-border h-12 font-mono text-sm focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Context / Mission Brief
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the challenge and your solution..."
                    className="bg-muted/30 border-border min-h-[120px] font-mono text-sm focus-visible:ring-primary/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                      Associated Project
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full h-11 bg-muted/30 border border-border rounded-md px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">No Project Selection</option>
                      {projects?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                      Link (PR/Repo)
                    </label>
                    <Input
                      value={prLink}
                      onChange={(e) => setPrLink(e.target.value)}
                      placeholder="https://..."
                      className="bg-muted/30 border-border h-11 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                    Skill Vectors (comma separated)
                  </label>
                  <Input
                    value={skillTags}
                    onChange={(e) => setSkillTags(e.target.value)}
                    placeholder="react, postgres, optimization"
                    className="bg-muted/30 border-border h-11 font-mono text-xs"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 font-mono text-xs uppercase tracking-widest"
                    onClick={onClose}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    className="flex-1 h-12 font-mono text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                    disabled={isPending}
                  >
                    {isPending ? 'Syncing...' : 'Archive Achievement'}
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
