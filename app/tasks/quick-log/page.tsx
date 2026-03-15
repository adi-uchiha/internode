'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useLogTime } from '@/hooks/useTickets';
import { useTickets } from '@/hooks/useTickets';

export default function QuickLogPage() {
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [isBreakthrough, setIsBreakthrough] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: tickets } = useTickets();
  const { mutateAsync: logTime, isPending: isSubmitting } = useLogTime();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await logTime({
        id: selectedTicket,
        hours: hours ? parseFloat(hours) : 0,
        note,
        isBreakthrough,
        date: new Date().toISOString(),
      });

      setSubmitted(true);

      // Reset after showing success
      setTimeout(() => {
        setNote('');
        setHours('');
        setSelectedTicket('');
        setIsBreakthrough(false);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit log', error);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
              [TIME_LOG]
            </div>
            <h1 className="text-2xl font-display font-semibold">{today}</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card">
            <Icon icon="solar:clock-circle-linear" className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm text-muted-foreground">Est. 1 min</span>
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
        {/* Note */}
        <div className="border border-border bg-card p-6">
          <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
            Work Description
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe what you worked on..."
            className="min-h-[100px] bg-background border-border font-mono text-sm resize-none"
            required
          />
        </div>

        {/* Grid: Hours, Ticket */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border bg-card p-4">
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Hours Spent
            </label>
            <Input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="2"
              className="bg-background border-border font-mono"
              required
            />
          </div>

          <div className="border border-border bg-card p-4">
            <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Select Ticket
            </label>
            <select
              value={selectedTicket}
              onChange={(e) => setSelectedTicket(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select ticket...</option>
              {tickets?.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  [{ticket.ticketId}] {ticket.title}
                </option>
              ))}
            </select>
          </div>
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
          <Button
            type="submit"
            variant="hero"
            size="lg"
            disabled={submitted}
            loading={isSubmitting}
          >
            {submitted ? (
              <>
                <Icon icon="solar:check-circle-linear" className="w-4 h-4 mr-2" />
                Log Submitted!
              </>
            ) : (
              <>
                <Icon icon="solar:upload-linear" className="w-4 h-4 mr-2" />
                Push Time Log
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
