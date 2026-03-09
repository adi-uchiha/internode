'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLeaves, useCreateLeave } from '@/hooks/useLeaves';
import { toast } from 'sonner';

export const leaveTypes = [
  { id: 'sick', label: 'Sick Leave', icon: 'solar:thermometer-linear' },
  { id: 'vacation', label: 'Vacation', icon: 'solar:sun-2-linear' },
  { id: 'half-day', label: 'Half Day', icon: 'solar:clock-circle-linear' },
  { id: 'personal', label: 'Personal', icon: 'solar:user-linear' },
];

const LeaveManagement = () => {
  const { data: leaves, isLoading } = useLeaves();
  const { mutateAsync: createLeave } = useCreateLeave();

  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveHistory = leaves || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedDate) return;

    setIsSubmitting(true);
    try {
      await createLeave({
        type: selectedType,
        date: new Date(selectedDate).toISOString(),
        reason,
      });
      toast.success('Leave request submitted successfully');
      setSelectedType('');
      setSelectedDate('');
      setReason('');
    } catch {
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLeaveTypeInfo = (typeId: string) => {
    return leaveTypes.find((t) => t.id === typeId);
  };

  // Calculate used balances dynamically
  const calculateUsed = (typeId: string) => {
    return leaveHistory.filter((l) => l.type === typeId && l.status === 'approved').length;
  };

  const balances = [
    { label: 'Sick Leave', used: calculateUsed('sick'), total: 10, id: 'sick' },
    { label: 'Vacation', used: calculateUsed('vacation'), total: 15, id: 'vacation' },
    { label: 'Personal', used: calculateUsed('personal'), total: 3, id: 'personal' },
    { label: 'Half Days', used: calculateUsed('half-day'), total: 8, id: 'half-day' },
  ];

  return (
    <MemberLayout title="Leave Management">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Request Leave Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border bg-card p-6"
        >
          <div className="mb-6">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
              [LEAVE_REQUEST]
            </div>
            <h2 className="text-xl font-display font-semibold">Request Time Off</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selection */}
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-3">
                Leave Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {leaveTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 border transition-all ${
                      selectedType === type.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <Icon icon={type.icon} className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-mono text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full md:w-64 h-10 px-3 bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Reason (Optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for leave..."
                className="bg-background border-border font-mono text-sm resize-none"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              disabled={!selectedType || !selectedDate || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Icon icon="solar:calendar-add-linear" className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Leave Balance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {balances.map((balance) => (
            <div key={balance.label} className="border border-border bg-card p-4">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
                [{balance.label}]
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-foreground">
                  {balance.total - balance.used}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  /{balance.total} left
                </span>
              </div>
              <div className="mt-2 h-1 bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${((balance.total - balance.used) / balance.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Leave History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card p-6"
        >
          <div className="mb-6">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
              [HISTORY]
            </div>
            <h2 className="text-xl font-display font-semibold">Leave History</h2>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Loading history...
              </div>
            ) : leaveHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border text-sm">
                No leave requests found
              </div>
            ) : (
              leaveHistory.map((leave) => {
                const typeInfo = getLeaveTypeInfo(leave.type);
                return (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-4 border border-border bg-background"
                  >
                    <div className="flex items-center gap-4">
                      <Icon
                        icon={typeInfo?.icon || 'solar:calendar-linear'}
                        className="w-5 h-5 text-muted-foreground"
                      />
                      <div>
                        <div className="font-mono text-sm">{typeInfo?.label}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {new Date(leave.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-muted-foreground hidden md:block">
                        {leave.reason}
                      </span>
                      <span
                        className={`px-2 py-1 font-mono text-xs uppercase ${
                          leave.status === 'approved'
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : leave.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive border border-destructive/30'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default LeaveManagement;
