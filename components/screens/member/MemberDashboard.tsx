'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { mockProjects } from '@/data/mockData';

const MemberDashboard = () => {
  const [whatIDid, setWhatIDid] = useState('');
  const [whatILearned, setWhatILearned] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [blockers, setBlockers] = useState('');
  const [prLinks, setPrLinks] = useState('');
  const [docLinks, setDocLinks] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [skillTags, setSkillTags] = useState('');
  const [isBreakthrough, setIsBreakthrough] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setWhatIDid('');
      setWhatILearned('');
      setHoursWorked('');
      setBlockers('');
      setPrLinks('');
      setDocLinks('');
      setSelectedProject('');
      setSkillTags('');
      setIsBreakthrough(false);
      setSubmitted(false);
    }, 2000);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <MemberLayout title="Quick Log">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
                [DAILY_LOG]
              </div>
              <h1 className="text-2xl font-display font-semibold">{today}</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card">
              <Icon icon="solar:clock-circle-linear" className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm text-muted-foreground">Est. 3 min</span>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* What I Did */}
          <div className="border border-border bg-card p-6">
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
              What I Did Today
            </label>
            <Textarea
              value={whatIDid}
              onChange={(e) => setWhatIDid(e.target.value)}
              placeholder="Describe your tasks, commits, and accomplishments..."
              className="min-h-[100px] bg-background border-border font-mono text-sm resize-none"
              required
            />
          </div>

          {/* What I Learned */}
          <div className="border border-border bg-card p-6">
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
              What I Learned
            </label>
            <Textarea
              value={whatILearned}
              onChange={(e) => setWhatILearned(e.target.value)}
              placeholder="New concepts, techniques, or insights gained..."
              className="min-h-[100px] bg-background border-border font-mono text-sm resize-none"
              required
            />
          </div>

          {/* Grid: Hours, Project, Skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border bg-card p-4">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Hours Worked
              </label>
              <Input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="8"
                className="bg-background border-border font-mono"
                required
              />
            </div>

            <div className="border border-border bg-card p-4">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">Select project...</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-border bg-card p-4">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Skill Tags
              </label>
              <Input
                value={skillTags}
                onChange={(e) => setSkillTags(e.target.value)}
                placeholder="#react, #typescript"
                className="bg-background border-border font-mono"
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border bg-card p-4">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                <Icon icon="solar:link-linear" className="inline-block mr-2 w-4 h-4" />
                PR Links
              </label>
              <Input
                value={prLinks}
                onChange={(e) => setPrLinks(e.target.value)}
                placeholder="https://github.com/..."
                className="bg-background border-border font-mono text-sm"
              />
            </div>

            <div className="border border-border bg-card p-4">
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                <Icon icon="solar:document-linear" className="inline-block mr-2 w-4 h-4" />
                Documentation Links
              </label>
              <Input
                value={docLinks}
                onChange={(e) => setDocLinks(e.target.value)}
                placeholder="https://notion.so/..."
                className="bg-background border-border font-mono text-sm"
              />
            </div>
          </div>

          {/* Blockers */}
          <div className="border border-border bg-card p-6">
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
              <Icon
                icon="solar:danger-triangle-linear"
                className="inline-block mr-2 w-4 h-4 text-yellow-500"
              />
              Blockers (Optional)
            </label>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any issues blocking your progress..."
              className="min-h-[80px] bg-background border-border font-mono text-sm resize-none"
            />
            {blockers && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-mono text-xs">
                <Icon icon="solar:info-circle-linear" className="inline-block mr-2 w-4 h-4" />
                This will be flagged for admin attention
              </div>
            )}
          </div>

          {/* Breakthrough Toggle */}
          <div className="border border-border bg-card p-4">
            <button
              type="button"
              onClick={() => setIsBreakthrough(!isBreakthrough)}
              className={`w-full flex items-center justify-between p-3 transition-colors ${
                isBreakthrough
                  ? 'bg-primary/10 border border-primary'
                  : 'bg-background border border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  icon={isBreakthrough ? 'solar:star-bold' : 'solar:star-linear'}
                  className={`w-5 h-5 ${isBreakthrough ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <span className="font-mono text-sm">Mark as Technical Breakthrough</span>
              </div>
              <div
                className={`w-5 h-5 border ${isBreakthrough ? 'bg-primary border-primary' : 'border-border'} flex items-center justify-center`}
              >
                {isBreakthrough && (
                  <Icon icon="solar:check-linear" className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </button>
            <p className="font-mono text-xs text-muted-foreground mt-2 px-3">
              Breakthroughs are pinned to your "Wall of Wins" and highlighted for the team.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost">
              Save as Draft
            </Button>
            <Button type="submit" variant="hero" size="lg" disabled={isSubmitting || submitted}>
              {isSubmitting ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                  Pushing Log...
                </>
              ) : submitted ? (
                <>
                  <Icon icon="solar:check-circle-linear" className="w-4 h-4" />
                  Log Submitted!
                </>
              ) : (
                <>
                  <Icon icon="solar:upload-linear" className="w-4 h-4" />
                  Push Today's Log
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </MemberLayout>
  );
};

export default MemberDashboard;
