'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { useApiKeys, useGenerateApiKey, useRevokeApiKey } from '@/hooks/useApiKeys';

export function ApiKeysManager() {
  const [newKeyName, setNewKeyName] = useState('');
  const [newRawToken, setNewRawToken] = useState<string | null>(null);

  const { data: keys = [], isLoading } = useApiKeys();
  const generateMutation = useGenerateApiKey();
  const revokeMutation = useRevokeApiKey();

  const handleGenerate = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API Key');
      return;
    }

    // apiClient and hooks manage error handling and invalidation correctly
    generateMutation.mutate(newKeyName, {
      onSuccess: (data) => {
        setNewRawToken(data.rawToken);
        setNewKeyName('');
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-6 border border-border bg-card/30 space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block">
            Generate New Token
          </label>
          <Input
            placeholder="Agent token name..."
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {generateMutation.isPending ? 'Generating...' : 'Generate Key'}
        </Button>
      </div>

      {newRawToken && (
        <div className="p-4 border border-primary/40 bg-primary/10 rounded-md space-y-3 relative group">
          <p className="text-xs text-primary font-semibold flex items-center gap-2">
            <Icon icon="solar:shield-check-bold" className="w-4 h-4" />
            Token generated! Copy this now, it won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono flex-1 bg-background/50 p-3 rounded-md border border-border/50 break-all select-all">
              {newRawToken}
            </code>
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(newRawToken)}>
              <Icon icon="solar:copy-linear" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block mb-4">
          Active Tokens
        </label>

        {isLoading ? (
          <div className="text-xs text-muted-foreground italic font-mono animate-pulse">
            Loading tokens...
          </div>
        ) : keys.length === 0 ? (
          <div className="text-xs text-muted-foreground italic font-mono">
            No active API keys found.
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border border-border bg-background/50 rounded-md group hover:border-primary/30 transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Icon icon="solar:key-minimalistic-linear" className="text-primary w-4 h-4" />
                    {key.name}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <code className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                      {key.hint}
                    </code>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to revoke "${key.name}"?`)) {
                      revokeMutation.mutate(key.id);
                    }
                  }}
                  disabled={revokeMutation.isPending}
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
