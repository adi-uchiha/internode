'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { safeSwitchOrganization } from '@/lib/auth-utils';

interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

export function CreateOrgModal({ open, onOpenChange }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!slugEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (error || !data) {
        toast.error(error?.message ?? 'Failed to create organization');
        return;
      }

      // Atomic switch to the new organization with cache safety
      await safeSwitchOrganization(data.id, queryClient, router);

      toast.success('Organization created successfully');
      onOpenChange(false);
      setName('');
      setSlug('');
      setSlugEdited(false);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border shadow-2xl p-0 overflow-hidden">
        <div className="h-1 w-full bg-primary/20">
          <div className="h-full bg-primary w-full" />
        </div>

        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-sm bg-primary/10">
                <Icon icon="solar:buildings-2-linear" className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl font-bold tracking-tight">
                New Organization
              </DialogTitle>
            </div>
            <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Initialize a new system instance
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                Organization Name
              </label>
              <Input
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/30 border-border h-11 font-display text-sm focus-visible:ring-primary/20"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                Organization URL
              </label>
              <div className="flex items-center">
                <div className="h-11 px-3 flex items-center bg-muted/50 border border-border border-r-0 text-[10px] font-mono text-muted-foreground">
                  internode.vercel.app/
                </div>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugEdited(true);
                  }}
                  placeholder="acme-corp"
                  className="bg-muted/30 border-border rounded-l-none h-11 font-mono text-sm focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div className="p-3 border border-border bg-muted/5 flex items-start gap-3">
              <Icon
                icon="solar:info-circle-linear"
                className="w-4 h-4 text-primary mt-0.5 shrink-0"
              />
              <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                You will be assigned as the <span className="text-primary font-bold">OWNER</span> of
                this organization.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-mono text-[10px] uppercase h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              loading={isLoading}
              disabled={!name.trim() || !slug.trim()}
              className="h-10 px-8"
            >
              Create Org
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
