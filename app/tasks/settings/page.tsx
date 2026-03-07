'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { tmProjects } from '@/data/taskManagerData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'workspace', label: 'Workspace', icon: 'solar:buildings-linear' },
  { id: 'projects', label: 'Projects', icon: 'solar:folder-linear' },
  { id: 'kanban', label: 'Kanban Columns', icon: 'solar:widget-4-linear' },
  { id: 'notifications', label: 'Notifications', icon: 'solar:bell-linear' },
  { id: 'labels', label: 'Labels', icon: 'solar:tag-linear' },
];

const defaultColumns = [
  { name: 'To-Do', color: '#666666' },
  { name: 'In Progress', color: '#3b82f6' },
  { name: 'In Review', color: '#f59e0b' },
  { name: 'Done', color: '#00ff88' },
  { name: 'Unplanned', color: '#8b5cf6' },
];

const defaultLabels = [
  { name: 'bug', color: '#ef4444' },
  { name: 'feature', color: '#3b82f6' },
  { name: 'documentation', color: '#06b6d4' },
  { name: 'performance', color: '#f59e0b' },
  { name: 'auth', color: '#8b5cf6' },
  { name: 'frontend', color: '#00ff88' },
  { name: 'backend', color: '#f97316' },
  { name: 'devops', color: '#ef4444' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('workspace');

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto py-6 px-4">
      {/* Left Navigation Sidebar */}
      <div className="w-full lg:w-[240px] shrink-0 space-y-1 bg-card/30 p-2 border border-border shadow-sm h-fit sticky top-24">
        <div className="px-3 py-4 mb-2">
          <h3 className="font-display font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground opacity-60">
            System Config
          </h3>
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-sm transition-all text-left group',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-[inset_0_0_20px_rgba(0,255,136,0.05)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-r-2 border-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon={tab.icon}
                className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="font-medium tracking-tight">{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="w-3 h-3 text-primary animate-pulse"
              />
            )}
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="h-1 w-full bg-primary/20">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="p-8">
              {activeTab === 'workspace' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-sm bg-primary/10">
                      <Icon icon="solar:buildings-linear" className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl tracking-tight">
                      Workspace Identity
                    </h3>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        Organization Name
                      </label>
                      <Input
                        defaultValue="InternHub Central"
                        className="max-w-md bg-muted/30 border-border h-11 font-mono text-sm focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        Workspace Domain
                      </label>
                      <div className="flex items-center max-w-md">
                        <Input
                          defaultValue="internhub-hq"
                          className="bg-muted/30 border-border border-r-0 rounded-r-none h-11 font-mono text-sm focus-visible:ring-primary/20"
                        />
                        <div className="h-11 px-4 flex items-center bg-muted border border-border border-l-0 rounded-r-md text-xs font-mono text-muted-foreground">
                          .internode.app
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">
                        System Logo
                      </label>
                      <div className="border-2 border-dashed border-border p-12 text-center max-w-md bg-muted/5 group hover:border-primary/40 transition-colors cursor-pointer rounded-lg">
                        <Icon
                          icon="solar:upload-minimalistic-linear"
                          className="w-10 h-10 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors"
                        />
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Drop branding assets here
                        </p>
                        <p className="text-[9px] text-muted-foreground opacity-50 font-mono">
                          PNG, SVG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border flex justify-end">
                    <Button variant="hero" className="px-8 shadow-lg shadow-primary/20">
                      Synchronize Settings
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-blue-500/10 text-blue-500">
                        <Icon icon="solar:folder-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Active Projects
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-mono text-[10px] uppercase"
                    >
                      + New System
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {tmProjects.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 p-4 border border-border bg-muted/5 group hover:bg-muted/10 transition-all border-l-2"
                        style={{ borderLeftColor: p.color }}
                      >
                        <Icon
                          icon="solar:reorder-linear"
                          className="w-4 h-4 text-muted-foreground cursor-grab opacity-30 hover:opacity-100"
                        />
                        <div className="flex-1 flex items-center gap-4">
                          <Input
                            defaultValue={p.name}
                            className="bg-transparent border-none p-0 h-auto text-sm font-bold shadow-none focus-visible:ring-0"
                          />
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm whitespace-nowrap">
                            ID: {p.id.split('-')[1]}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-mono text-[9px] text-muted-foreground uppercase opacity-50">
                              Members
                            </div>
                            <div className="text-xs font-bold">12</div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-2 transition-all rounded-full">
                            <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'kanban' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-amber-500/10 text-amber-500">
                        <Icon icon="solar:widget-4-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Lifecycle Columns
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-mono text-[10px] uppercase"
                    >
                      + Add Stage
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {defaultColumns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center gap-4 p-4 border border-border bg-muted/5 group hover:bg-muted/10 transition-all"
                      >
                        <Icon
                          icon="solar:hamburger-menu-linear"
                          className="w-4 h-4 text-muted-foreground cursor-grab"
                        />
                        <div
                          className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                          style={{ backgroundColor: col.color }}
                        />
                        <Input
                          defaultValue={col.name}
                          className="flex-1 bg-transparent border-none p-0 h-auto text-sm font-medium focus-visible:ring-0"
                        />
                        <button className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-2 transition-all">
                          <Icon icon="solar:close-circle-linear" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-sm bg-red-500/10 text-red-500">
                      <Icon icon="solar:bell-linear" className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-xl tracking-tight">Signal Matrix</h3>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4">
                            Trigger Event
                          </TableHead>
                          <TableHead className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4 w-[100px]">
                            SMTP
                          </TableHead>
                          <TableHead className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground py-4 w-[100px]">
                            HUD
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { event: 'Ticket assignment sequence', email: true, inApp: true },
                          { event: 'Deadline threshold bypass', email: true, inApp: true },
                          { event: 'Activity log commit', email: false, inApp: true },
                          { event: 'State transition update', email: false, inApp: true },
                          { event: 'Critical priority escalation', email: true, inApp: true },
                        ].map((row) => (
                          <TableRow key={row.event} className="border-border hover:bg-muted/10">
                            <TableCell className="font-medium text-sm py-4">{row.event}</TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  defaultChecked={row.email}
                                  className="w-4 h-4 accent-primary"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex justify-center">
                                <input
                                  type="checkbox"
                                  defaultChecked={row.inApp}
                                  className="w-4 h-4 accent-primary"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'labels' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-primary/10 text-primary">
                        <Icon icon="solar:tag-linear" className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-xl tracking-tight">
                        Classification Library
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 font-mono text-[10px] uppercase"
                    >
                      + Create Label
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {defaultLabels.map((label) => (
                      <div
                        key={label.name}
                        className="flex items-center gap-3 p-3 border border-border bg-background group relative overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: label.color }}
                        />
                        <div className="flex-1 font-mono text-xs font-bold uppercase tracking-tight">
                          {label.name}
                        </div>
                        <input
                          type="color"
                          defaultValue={label.color}
                          className="w-6 h-6 bg-transparent border-0 cursor-pointer rounded-sm overflow-hidden"
                        />
                        <button className="text-muted-foreground hover:text-destructive transition-colors px-1">
                          <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
