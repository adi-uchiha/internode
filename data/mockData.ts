// Mock data for the Internode application

export interface Intern {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  department: string;
  project: string;
  logStatus: 'green' | 'yellow' | 'red';
  lastLogTime?: string;
  totalHours: number;
  skillTags: string[];
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string;
  whatIDid: string;
  whatILearned: string;
  hoursWorked: number;
  blockers: string;
  hasBlocker: boolean;
  isBreakthrough: boolean;
  skillTags: string[];
  prLinks: string[];
  docLinks: string[];
  projectId: string;
  status: 'draft' | 'submitted';
  adminFeedback?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  interns: string[];
  techStack: string[];
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  weekStart: string;
  goals: { id: string; text: string; completed: boolean }[];
  createdAt: string;
}

// Mock Interns
export const mockInterns: Intern[] = [
  {
    id: 'intern-001',
    name: 'Alex Chen',
    email: 'alex@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AC&backgroundColor=00ff00&textColor=000000',
    status: 'active',
    joinDate: '2025-01-01',
    department: 'Frontend',
    project: 'Dashboard Revamp',
    logStatus: 'green',
    lastLogTime: '09:15',
    totalHours: 342,
    skillTags: ['react', 'typescript', 'tailwind', 'nextjs']
  },
  {
    id: 'intern-002',
    name: 'Sarah Kim',
    email: 'sarah@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=SK&backgroundColor=00ff00&textColor=000000',
    status: 'active',
    joinDate: '2025-01-05',
    department: 'Backend',
    project: 'API Gateway',
    logStatus: 'yellow',
    lastLogTime: '10:30',
    totalHours: 298,
    skillTags: ['nodejs', 'postgresql', 'docker', 'redis']
  },
  {
    id: 'intern-003',
    name: 'Marcus Johnson',
    email: 'marcus@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MJ&backgroundColor=00ff00&textColor=000000',
    status: 'active',
    joinDate: '2024-12-15',
    department: 'Full Stack',
    project: 'Mobile App',
    logStatus: 'red',
    totalHours: 412,
    skillTags: ['react-native', 'expo', 'firebase', 'graphql']
  },
  {
    id: 'intern-004',
    name: 'Priya Patel',
    email: 'priya@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PP&backgroundColor=00ff00&textColor=000000',
    status: 'active',
    joinDate: '2025-01-10',
    department: 'DevOps',
    project: 'CI/CD Pipeline',
    logStatus: 'green',
    lastLogTime: '08:45',
    totalHours: 187,
    skillTags: ['kubernetes', 'terraform', 'aws', 'github-actions']
  },
  {
    id: 'intern-005',
    name: 'David Liu',
    email: 'david@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DL&backgroundColor=00ff00&textColor=000000',
    status: 'on-leave',
    joinDate: '2024-11-20',
    department: 'Backend',
    project: 'Data Pipeline',
    logStatus: 'green',
    totalHours: 523,
    skillTags: ['python', 'spark', 'airflow', 'dbt']
  },
  {
    id: 'intern-006',
    name: 'Emma Wilson',
    email: 'emma@internode.dev',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EW&backgroundColor=00ff00&textColor=000000',
    status: 'active',
    joinDate: '2025-01-08',
    department: 'Frontend',
    project: 'Design System',
    logStatus: 'green',
    lastLogTime: '09:00',
    totalHours: 156,
    skillTags: ['figma', 'storybook', 'css', 'accessibility']
  }
];

// Mock Daily Logs
export const mockDailyLogs: DailyLog[] = [
  {
    id: 'log-001',
    userId: 'member-001',
    date: '2025-01-08',
    whatIDid: 'Implemented the new dashboard sidebar with collapsible functionality. Fixed 3 UI bugs related to responsive design.',
    whatILearned: 'Learned about framer-motion animations and how to create smooth collapse/expand transitions. Also discovered the useLayoutEffect hook for avoiding layout shifts.',
    hoursWorked: 8,
    blockers: '',
    hasBlocker: false,
    isBreakthrough: false,
    skillTags: ['react', 'framer-motion', 'tailwind'],
    prLinks: ['https://github.com/internode/dashboard/pull/142'],
    docLinks: [],
    projectId: 'proj-001',
    status: 'submitted',
    createdAt: '2025-01-08T09:15:00Z'
  },
  {
    id: 'log-002',
    userId: 'member-001',
    date: '2025-01-07',
    whatIDid: 'Set up the authentication flow using session-based auth. Created login and signup pages with proper validation.',
    whatILearned: 'Understood the difference between JWT and session-based authentication. Learned about CSRF protection.',
    hoursWorked: 7,
    blockers: '',
    hasBlocker: false,
    isBreakthrough: true,
    skillTags: ['authentication', 'security', 'react'],
    prLinks: ['https://github.com/internode/dashboard/pull/140'],
    docLinks: ['https://notion.so/internode/auth-docs'],
    projectId: 'proj-001',
    status: 'submitted',
    adminFeedback: 'Great work on the auth implementation! Consider adding rate limiting for the login endpoint.',
    createdAt: '2025-01-07T17:30:00Z'
  },
  {
    id: 'log-003',
    userId: 'member-001',
    date: '2025-01-06',
    whatIDid: 'Reviewed design specs and created component structure for the member dashboard.',
    whatILearned: 'Better understanding of atomic design principles and component composition.',
    hoursWorked: 6,
    blockers: 'Waiting for final design approval from the design team.',
    hasBlocker: true,
    isBreakthrough: false,
    skillTags: ['design-system', 'planning'],
    prLinks: [],
    docLinks: [],
    projectId: 'proj-001',
    status: 'submitted',
    createdAt: '2025-01-06T16:00:00Z'
  }
];

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Dashboard Revamp',
    description: 'Complete overhaul of the main dashboard with new UI/UX',
    status: 'active',
    startDate: '2024-12-01',
    interns: ['intern-001', 'intern-006'],
    techStack: ['react', 'typescript', 'tailwind', 'framer-motion']
  },
  {
    id: 'proj-002',
    name: 'API Gateway',
    description: 'Building a unified API gateway for microservices',
    status: 'active',
    startDate: '2024-11-15',
    interns: ['intern-002'],
    techStack: ['nodejs', 'express', 'redis', 'docker']
  },
  {
    id: 'proj-003',
    name: 'Mobile App',
    description: 'Cross-platform mobile application',
    status: 'active',
    startDate: '2024-10-01',
    interns: ['intern-003'],
    techStack: ['react-native', 'expo', 'firebase']
  },
  {
    id: 'proj-004',
    name: 'CI/CD Pipeline',
    description: 'Automated deployment pipeline setup',
    status: 'active',
    startDate: '2025-01-01',
    interns: ['intern-004'],
    techStack: ['kubernetes', 'terraform', 'github-actions']
  },
  {
    id: 'proj-005',
    name: 'Data Pipeline',
    description: 'ETL pipeline for analytics',
    status: 'paused',
    startDate: '2024-09-01',
    interns: ['intern-005'],
    techStack: ['python', 'spark', 'airflow']
  }
];

// Mock Weekly Goals
export const mockWeeklyGoals: WeeklyGoal[] = [
  {
    id: 'goal-001',
    userId: 'member-001',
    weekStart: '2025-01-06',
    goals: [
      { id: 'g1', text: 'Complete sidebar component with animations', completed: true },
      { id: 'g2', text: 'Write unit tests for auth flow', completed: false },
      { id: 'g3', text: 'Document component API', completed: false }
    ],
    createdAt: '2025-01-06T08:00:00Z'
  }
];

// Activity data for heatmap
export const generateActivityData = () => {
  const data: { date: string; count: number; hours: number }[] = [];
  const today = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random activity - more likely to have activity on weekdays
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hasActivity = isWeekend ? Math.random() > 0.7 : Math.random() > 0.2;
    
    if (hasActivity) {
      const hours = Math.floor(Math.random() * 8) + 1;
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1,
        hours
      });
    } else {
      data.push({
        date: date.toISOString().split('T')[0],
        count: 0,
        hours: 0
      });
    }
  }
  
  return data;
};

// Performance metrics
export const generatePerformanceMetrics = () => ({
  logCompletionRate: 94,
  avgBlockerResolutionTime: 2.4,
  skillAcquisitionVelocity: 12,
  totalHoursThisMonth: 156,
  avgHoursPerDay: 6.8,
  learningDays: 18,
  executionDays: 12
});

// Leave types
export const leaveTypes = [
  { id: 'sick', label: 'Sick Leave', icon: 'solar:thermometer-linear' },
  { id: 'vacation', label: 'Vacation', icon: 'solar:sun-2-linear' },
  { id: 'half-day', label: 'Half Day', icon: 'solar:clock-circle-linear' },
  { id: 'personal', label: 'Personal', icon: 'solar:user-linear' }
];
