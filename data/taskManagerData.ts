// Task Manager Module - Static Mock Data

export type TicketStatus = 'todo' | 'in-progress' | 'in-review' | 'done' | 'unplanned';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type MemberRole = 'admin' | 'member';

export interface TMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar: string;
  ticketsActive: number;
  hoursThisWeek: number;
  efficiency: number;
  joinedDate: string;
}

export interface TTicket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  project: string;
  assigneeId: string;
  createdById: string;
  estimatedHours: number;
  loggedHours: number;
  dueDate?: string;
  createdAt: string;
  labels: string[];
  timeLogs: TTimeLog[];
  comments: TComment[];
}

export interface TTimeLog {
  id: string;
  ticketId: string;
  memberId: string;
  hours: number;
  note: string;
  date: string;
  isBreakthrough?: boolean;
}

export interface TComment {
  id: string;
  memberId: string;
  content: string;
  createdAt: string;
}

export interface TProject {
  id: string;
  name: string;
  prefix: string;
  color: string;
}

export interface TNotification {
  id: string;
  type: 'assigned' | 'overdue' | 'status' | 'time-logged' | 'comment' | 'member-joined';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
}

// --- Projects ---
export const tmProjects: TProject[] = [
  { id: 'proj-fe', name: 'Frontend App', prefix: 'FE', color: '#3b82f6' },
  { id: 'proj-api', name: 'API Server', prefix: 'API', color: '#f59e0b' },
  { id: 'proj-mob', name: 'Mobile App', prefix: 'MOB', color: '#8b5cf6' },
  { id: 'proj-dev', name: 'DevOps', prefix: 'DEV', color: '#ef4444' },
  { id: 'proj-doc', name: 'Documentation', prefix: 'DOC', color: '#06b6d4' },
];

// --- Members ---
export const tmMembers: TMember[] = [
  {
    id: 'tm-001',
    name: 'Aditya Sharma',
    email: 'aditya@internhub.com',
    role: 'admin',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=00ff88&textColor=000000',
    ticketsActive: 12,
    hoursThisWeek: 32.5,
    efficiency: 94,
    joinedDate: '2025-08-01',
  },
  {
    id: 'tm-002',
    name: 'Rahul Verma',
    email: 'rahul@internhub.com',
    role: 'member',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=RV&backgroundColor=3b82f6&textColor=ffffff',
    ticketsActive: 8,
    hoursThisWeek: 28.5,
    efficiency: 102,
    joinedDate: '2025-09-15',
  },
  {
    id: 'tm-003',
    name: 'Priya Mehta',
    email: 'priya@internhub.com',
    role: 'member',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=f59e0b&textColor=000000',
    ticketsActive: 6,
    hoursThisWeek: 31.0,
    efficiency: 95,
    joinedDate: '2025-10-01',
  },
  {
    id: 'tm-004',
    name: 'Arjun Patel',
    email: 'arjun@internhub.com',
    role: 'member',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=AP&backgroundColor=8b5cf6&textColor=ffffff',
    ticketsActive: 5,
    hoursThisWeek: 24.0,
    efficiency: 88,
    joinedDate: '2025-10-15',
  },
  {
    id: 'tm-005',
    name: 'Sneha Gupta',
    email: 'sneha@internhub.com',
    role: 'member',
    avatar:
      'https://api.dicebear.com/7.x/initials/svg?seed=SG&backgroundColor=ef4444&textColor=ffffff',
    ticketsActive: 7,
    hoursThisWeek: 26.0,
    efficiency: 91,
    joinedDate: '2025-11-01',
  },
];

// --- Tickets ---
export const tmTickets: TTicket[] = [
  {
    id: 'ticket-42',
    ticketId: 'TICKET-42',
    title: 'Fix authentication redirect loop in OAuth callback',
    description: `# Authentication Redirect Loop

## Problem

The OAuth callback handler is causing an **infinite redirect loop** when the token refresh fails. This is a critical bug affecting all users who authenticate via GitHub OAuth.

## Steps to Reproduce

1. Sign in with GitHub OAuth
2. Wait for token to expire (~1h)
3. Navigate to any protected route
4. Observe redirect loop in browser devtools

## Expected Behavior

User should be redirected to login page **once** with a clear session expiry message.

## Root Cause Analysis

The issue lies in the middleware chain where \`encodeURIComponent\` is called twice:

\`\`\`typescript
// BUG: Double encoding in middleware
const callbackUrl = encodeURIComponent(window.location.href);
// This gets encoded AGAIN in the redirect handler
redirect(\`/auth/callback?redirect_uri=\${encodeURIComponent(callbackUrl)}\`);
\`\`\`

### Fix

Replace with single encoding:

\`\`\`typescript
const callbackUrl = window.location.href;
redirect(\`/auth/callback?redirect_uri=\${encodeURIComponent(callbackUrl)}\`);
\`\`\`

## Acceptance Criteria

- [ ] No redirect loops on token expiry
- [ ] User sees "Session expired" toast notification
- [ ] Redirect back to original page after re-auth
- [ ] Unit tests for the OAuth callback handler

> **Note:** This fix should be backward-compatible with existing sessions.`,
    status: 'in-progress',
    priority: 'high',
    project: 'Frontend App',
    assigneeId: 'tm-002',
    createdById: 'tm-001',
    estimatedHours: 8,
    loggedHours: 6.5,
    dueDate: '2026-03-12',
    createdAt: '2026-03-05',
    labels: ['auth', 'bug', 'frontend'],
    timeLogs: [
      {
        id: 'tl-1',
        ticketId: 'ticket-42',
        memberId: 'tm-002',
        hours: 2.0,
        note: 'Fixed token refresh logic and added proper error handling',
        date: '2026-03-07',
        isBreakthrough: true,
      },
      {
        id: 'tl-2',
        ticketId: 'ticket-42',
        memberId: 'tm-002',
        hours: 3.0,
        note: 'Debugged redirect URI mismatch in OAuth provider config',
        date: '2026-03-06',
      },
      {
        id: 'tl-3',
        ticketId: 'ticket-42',
        memberId: 'tm-002',
        hours: 1.5,
        note: 'Set up OAuth test environment with mock provider',
        date: '2026-03-05',
      },
    ],
    comments: [
      {
        id: 'c-1',
        memberId: 'tm-001',
        content:
          'Check the redirect_uri parameter encoding. It might be double-encoding the callback URL.',
        createdAt: '2026-03-07T10:00:00Z',
      },
      {
        id: 'c-2',
        memberId: 'tm-002',
        content:
          'Found it — was double-encoding the callback URL. The `encodeURIComponent` was being called twice in the middleware chain.',
        createdAt: '2026-03-07T11:00:00Z',
      },
    ],
  },
  {
    id: 'ticket-41',
    ticketId: 'TICKET-41',
    title: 'Update API documentation for v2 endpoints',
    description: `# API Documentation Update

## Overview

Update all endpoint documentation to reflect **v2 API changes**, including new auth headers and response formats.

## Scope

| Endpoint Group | Status | Notes |
|---|---|---|
| Authentication | 🟡 In Progress | New Bearer token format |
| Users | ❌ Not Started | CRUD + pagination |
| Projects | ❌ Not Started | New filtering params |
| Webhooks | ❌ Not Started | New event types |

## Key Changes in v2

- **Authentication**: Switched from API keys to \`Bearer\` tokens
- **Pagination**: New cursor-based pagination replacing offset
- **Error Format**: Standardized error responses with \`error_code\` field

### Example Response Format

\`\`\`json
{
  "data": { "id": "usr_123", "name": "John" },
  "meta": { "cursor": "abc123", "has_more": true }
}
\`\`\`

> All v1 endpoints will be deprecated on **April 15, 2026**.`,
    status: 'todo',
    priority: 'medium',
    project: 'API Server',
    assigneeId: 'tm-003',
    createdById: 'tm-001',
    estimatedHours: 4,
    loggedHours: 2,
    dueDate: '2026-03-15',
    createdAt: '2026-03-04',
    labels: ['documentation', 'api'],
    timeLogs: [
      {
        id: 'tl-4',
        ticketId: 'ticket-41',
        memberId: 'tm-003',
        hours: 2.0,
        note: 'Started documenting auth endpoints',
        date: '2026-03-06',
      },
    ],
    comments: [],
  },
  {
    id: 'ticket-40',
    ticketId: 'TICKET-40',
    title: 'Implement dark mode toggle with system preference detection',
    description: `# Dark Mode Toggle

## Requirements

Implement a dark mode toggle that:

1. **Detects system preference** via \`prefers-color-scheme\` media query
2. **Persists user choice** in localStorage
3. **Smooth transition** between themes using CSS transitions
4. **Accessible** toggle button with proper ARIA attributes

## Implementation Plan

- Use \`next-themes\` library for theme management
- Add a toggle component in the top navigation bar
- Define CSS custom properties for both light and dark themes

\`\`\`css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
}

[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --text-primary: #f2f2f2;
}
\`\`\``,
    status: 'todo',
    priority: 'low',
    project: 'Frontend App',
    assigneeId: 'tm-004',
    createdById: 'tm-001',
    estimatedHours: 3,
    loggedHours: 0,
    dueDate: '2026-03-20',
    createdAt: '2026-03-03',
    labels: ['feature', 'ui', 'frontend'],
    timeLogs: [],
    comments: [],
  },
  {
    id: 'ticket-39',
    ticketId: 'TICKET-39',
    title: 'Optimize database queries for dashboard aggregation',
    description: `# Query Optimization

## Problem

The dashboard load time is **>3s** due to unoptimized aggregate queries. This impacts user experience significantly.

## Current Performance

| Query | Current Time | Target |
|---|---|---|
| Total tickets count | 800ms | <50ms |
| Status aggregation | 1.2s | <100ms |
| Burn rate chart | 1.5s | <200ms |

## Solution

### 1. Add Composite Indexes

\`\`\`sql
CREATE INDEX idx_tickets_status_created ON tickets(status, created_at);
CREATE INDEX idx_time_logs_ticket_date ON time_logs(ticket_id, logged_at);
\`\`\`

### 2. Materialized Views

\`\`\`sql
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'done') as completed,
  SUM(logged_hours) as total_hours
FROM tickets
WHERE created_at > NOW() - INTERVAL '7 days';
\`\`\`

### 3. Refresh Strategy

- Refresh materialized views every **5 minutes** via cron
- Use \`CONCURRENTLY\` to avoid locking

> **Impact**: Expected to reduce dashboard load time from 3s to **<500ms**.`,
    status: 'in-review',
    priority: 'critical',
    project: 'API Server',
    assigneeId: 'tm-005',
    createdById: 'tm-001',
    estimatedHours: 6,
    loggedHours: 5,
    dueDate: '2026-03-10',
    createdAt: '2026-03-01',
    labels: ['performance', 'backend', 'database'],
    timeLogs: [
      {
        id: 'tl-5',
        ticketId: 'ticket-39',
        memberId: 'tm-005',
        hours: 3.0,
        note: 'Added composite indexes on frequently queried columns',
        date: '2026-03-06',
      },
      {
        id: 'tl-6',
        ticketId: 'ticket-39',
        memberId: 'tm-005',
        hours: 2.0,
        note: 'Created materialized views for dashboard metrics',
        date: '2026-03-05',
      },
    ],
    comments: [
      {
        id: 'c-3',
        memberId: 'tm-001',
        content: 'Great progress! Make sure to benchmark before and after with `EXPLAIN ANALYZE`.',
        createdAt: '2026-03-06T14:00:00Z',
      },
    ],
  },
  {
    id: 'ticket-38',
    ticketId: 'TICKET-38',
    title: 'Setup CI/CD pipeline with GitHub Actions',
    description:
      '# CI/CD Pipeline\n\nSet up automated testing and deployment pipeline using GitHub Actions.',
    status: 'done',
    priority: 'high',
    project: 'DevOps',
    assigneeId: 'tm-002',
    createdById: 'tm-001',
    estimatedHours: 8,
    loggedHours: 8,
    createdAt: '2026-02-20',
    labels: ['devops', 'ci-cd', 'automation'],
    timeLogs: [
      {
        id: 'tl-7',
        ticketId: 'ticket-38',
        memberId: 'tm-002',
        hours: 4.0,
        note: 'Configured build and test workflows',
        date: '2026-02-25',
      },
      {
        id: 'tl-8',
        ticketId: 'ticket-38',
        memberId: 'tm-002',
        hours: 4.0,
        note: 'Added deployment stages with environment secrets',
        date: '2026-02-26',
      },
    ],
    comments: [],
  },
  {
    id: 'ticket-37',
    ticketId: 'TICKET-37',
    title: 'Design onboarding flow for new users',
    description:
      '# Onboarding Flow\n\nCreate a step-by-step onboarding experience for new team members.',
    status: 'done',
    priority: 'medium',
    project: 'Mobile App',
    assigneeId: 'tm-003',
    createdById: 'tm-001',
    estimatedHours: 8,
    loggedHours: 10,
    createdAt: '2026-02-15',
    labels: ['design', 'ux', 'onboarding'],
    timeLogs: [
      {
        id: 'tl-9',
        ticketId: 'ticket-37',
        memberId: 'tm-003',
        hours: 5.0,
        note: 'Designed wireframes and user flow',
        date: '2026-02-18',
      },
      {
        id: 'tl-10',
        ticketId: 'ticket-37',
        memberId: 'tm-003',
        hours: 5.0,
        note: 'Implemented animations and transitions',
        date: '2026-02-20',
      },
    ],
    comments: [],
  },
  {
    id: 'ticket-36',
    ticketId: 'TICKET-36',
    title: 'Add unit tests for authentication module',
    description:
      '# Auth Unit Tests\n\nWrite comprehensive unit tests covering login, signup, password reset, and session management.',
    status: 'unplanned',
    priority: 'medium',
    project: 'Frontend App',
    assigneeId: 'tm-004',
    createdById: 'tm-001',
    estimatedHours: 5,
    loggedHours: 0,
    createdAt: '2026-03-02',
    labels: ['testing', 'auth', 'frontend'],
    timeLogs: [],
    comments: [],
  },
  {
    id: 'ticket-35',
    ticketId: 'TICKET-35',
    title: 'Write API integration guide for third-party developers',
    description:
      '# API Integration Guide\n\nComprehensive guide for external developers integrating with our API.',
    status: 'in-progress',
    priority: 'low',
    project: 'Documentation',
    assigneeId: 'tm-005',
    createdById: 'tm-001',
    estimatedHours: 4,
    loggedHours: 3,
    dueDate: '2026-03-18',
    createdAt: '2026-03-01',
    labels: ['documentation', 'api'],
    timeLogs: [
      {
        id: 'tl-11',
        ticketId: 'ticket-35',
        memberId: 'tm-005',
        hours: 3.0,
        note: 'Wrote authentication and rate limiting sections',
        date: '2026-03-04',
      },
    ],
    comments: [],
  },
];

// --- Activity Feed ---
export interface TActivity {
  id: string;
  memberId: string;
  action: string;
  ticketTitle: string;
  ticketId: string;
  timestamp: string;
  type: 'created' | 'status' | 'time-log' | 'completed' | 'comment';
}

export const tmActivities: TActivity[] = [
  {
    id: 'a-1',
    memberId: 'tm-002',
    action: 'logged 2.0h on',
    ticketTitle: 'Fix authentication redirect loop',
    ticketId: 'ticket-42',
    timestamp: '2m ago',
    type: 'time-log',
  },
  {
    id: 'a-2',
    memberId: 'tm-005',
    action: 'moved to In Review',
    ticketTitle: 'Optimize database queries',
    ticketId: 'ticket-39',
    timestamp: '15m ago',
    type: 'status',
  },
  {
    id: 'a-3',
    memberId: 'tm-001',
    action: 'commented on',
    ticketTitle: 'Fix authentication redirect loop',
    ticketId: 'ticket-42',
    timestamp: '1h ago',
    type: 'comment',
  },
  {
    id: 'a-4',
    memberId: 'tm-003',
    action: 'logged 2.0h on',
    ticketTitle: 'Update API documentation',
    ticketId: 'ticket-41',
    timestamp: '2h ago',
    type: 'time-log',
  },
  {
    id: 'a-5',
    memberId: 'tm-002',
    action: 'completed',
    ticketTitle: 'Setup CI/CD pipeline',
    ticketId: 'ticket-38',
    timestamp: '3h ago',
    type: 'completed',
  },
  {
    id: 'a-6',
    memberId: 'tm-004',
    action: 'moved to In Progress',
    ticketTitle: 'Implement dark mode toggle',
    ticketId: 'ticket-40',
    timestamp: '5h ago',
    type: 'status',
  },
  {
    id: 'a-7',
    memberId: 'tm-005',
    action: 'logged 3.0h on',
    ticketTitle: 'Optimize database queries',
    ticketId: 'ticket-39',
    timestamp: '6h ago',
    type: 'time-log',
  },
  {
    id: 'a-8',
    memberId: 'tm-001',
    action: 'created',
    ticketTitle: 'Fix authentication redirect loop',
    ticketId: 'ticket-42',
    timestamp: '1d ago',
    type: 'created',
  },
  {
    id: 'a-9',
    memberId: 'tm-003',
    action: 'completed',
    ticketTitle: 'Design onboarding flow',
    ticketId: 'ticket-37',
    timestamp: '2d ago',
    type: 'completed',
  },
  {
    id: 'a-10',
    memberId: 'tm-005',
    action: 'logged 2.0h on',
    ticketTitle: 'Write API integration guide',
    ticketId: 'ticket-35',
    timestamp: '3d ago',
    type: 'time-log',
  },
];

// --- Notifications ---
export const tmNotifications: TNotification[] = [
  {
    id: 'n-1',
    type: 'assigned',
    title: 'Aditya assigned you',
    subtitle: '"Fix auth redirect loop"',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: 'n-2',
    type: 'time-logged',
    title: 'Time log approved',
    subtitle: '"Setup OAuth test env"',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'n-3',
    type: 'overdue',
    title: 'Ticket overdue',
    subtitle: '"Update API documentation"',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 'n-4',
    type: 'comment',
    title: 'Aditya commented',
    subtitle: '"Check the redirect_uri parameter"',
    time: '5 hours ago',
    read: true,
  },
  {
    id: 'n-5',
    type: 'status',
    title: 'Status changed',
    subtitle: '"Optimize DB queries" → In Review',
    time: '1 day ago',
    read: true,
  },
];

// --- Dashboard Chart Data ---
export const burnRateData = [
  { day: 'Mon', estimated: 20, actual: 18 },
  { day: 'Tue', estimated: 40, actual: 35 },
  { day: 'Wed', estimated: 60, actual: 58 },
  { day: 'Thu', estimated: 80, actual: 72 },
  { day: 'Fri', estimated: 100, actual: 95 },
  { day: 'Sat', estimated: 110, actual: 108 },
  { day: 'Sun', estimated: 128, actual: 128.5 },
];

export const projectHoursData = [
  { project: 'Frontend App', estimated: 40, actual: 38, color: '#3b82f6' },
  { project: 'API Server', estimated: 30, actual: 35, color: '#f59e0b' },
  { project: 'Mobile App', estimated: 25, actual: 22, color: '#8b5cf6' },
  { project: 'DevOps', estimated: 20, actual: 18, color: '#ef4444' },
  { project: 'Documentation', estimated: 15, actual: 12, color: '#06b6d4' },
];

export const weeklySparkline = [3, 5, 4, 8, 6, 7, 8];

// --- Helper Functions ---
export const getMemberById = (id: string) => tmMembers.find((m) => m.id === id);
export const getTicketsByStatus = (status: TicketStatus) =>
  tmTickets.filter((t) => t.status === status);
export const getTicketsByAssignee = (assigneeId: string) =>
  tmTickets.filter((t) => t.assigneeId === assigneeId);
export const getTicketById = (id: string) => tmTickets.find((t) => t.id === id);

export const getStatusColor = (status: TicketStatus) => {
  const colors: Record<TicketStatus, string> = {
    todo: 'text-muted-foreground bg-muted-foreground/15',
    'in-progress': 'text-blue-400 bg-blue-400/15',
    'in-review': 'text-amber-400 bg-amber-400/15',
    done: 'text-primary bg-primary/15',
    unplanned: 'text-purple-400 bg-purple-400/15',
  };
  return colors[status];
};

export const getStatusLabel = (status: TicketStatus) => {
  const labels: Record<TicketStatus, string> = {
    todo: 'TO-DO',
    'in-progress': 'IN PROGRESS',
    'in-review': 'IN REVIEW',
    done: 'DONE',
    unplanned: 'UNPLANNED',
  };
  return labels[status];
};

export const getPriorityColor = (priority: TicketPriority) => {
  const colors: Record<TicketPriority, string> = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-muted-foreground',
  };
  return colors[priority];
};

export const getTimeBarColor = (logged: number, estimated: number) => {
  const pct = (logged / estimated) * 100;
  if (pct > 100) return 'bg-destructive';
  if (pct > 80) return 'bg-amber-500';
  return 'bg-primary';
};

// Generate heatmap data (12 weeks)
export const generateHeatmapData = () => {
  const data: { date: string; hours: number }[] = [];
  const today = new Date();
  for (let i = 84; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const hours = isWeekend
      ? Math.random() > 0.7
        ? Math.floor(Math.random() * 4)
        : 0
      : Math.floor(Math.random() * 8) + 1;
    data.push({ date: d.toISOString().split('T')[0], hours });
  }
  return data;
};

// Leaderboard data
export const tmLeaderboard = [
  { memberId: 'tm-002', ticketsDone: 5, hoursLogged: 28.5, efficiency: 102 },
  { memberId: 'tm-003', ticketsDone: 4, hoursLogged: 31.0, efficiency: 95 },
  { memberId: 'tm-004', ticketsDone: 3, hoursLogged: 24.0, efficiency: 88 },
  { memberId: 'tm-005', ticketsDone: 3, hoursLogged: 26.0, efficiency: 91 },
  { memberId: 'tm-001', ticketsDone: 2, hoursLogged: 32.5, efficiency: 94 },
];
