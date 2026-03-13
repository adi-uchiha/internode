import { relations } from 'drizzle-orm';
import { users } from './users';
import { projects, projectMembers } from './projects';
import { tickets, timeLogs, comments } from './tickets';
import { leaveRequests } from './leaves';
import { weeklyGoals, goalItems } from './goals';
import { activities, notifications } from './system';
import { breakthroughs } from './breakthroughs';
import { searchHistory } from './search';
import { labels } from './labels';
import { organizations } from './organizations';
import { members } from './members';
import { invitations } from './invitations';
// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  projectMembers: many(projectMembers),
  assignedTickets: many(tickets, { relationName: 'assignee' }),
  createdTickets: many(tickets, { relationName: 'creator' }),
  timeLogs: many(timeLogs),
  comments: many(comments),
  leaveRequests: many(leaveRequests),
  weeklyGoals: many(weeklyGoals),
  activities: many(activities),
  notifications: many(notifications),
  breakthroughs: many(breakthroughs),
  memberships: many(members),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(members),
  projects: many(projects),
  tickets: many(tickets),
  invitations: many(invitations),
  breakthroughs: many(breakthroughs),
  leaves: many(leaveRequests),
  goals: many(weeklyGoals),
  labels: many(labels),
  activities: many(activities),
}));

export const labelsRelations = relations(labels, ({ one }) => ({
  organization: one(organizations, {
    fields: [labels.organizationId],
    references: [organizations.id],
  }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

// Projects Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  members: many(projectMembers),
  tickets: many(tickets),
  breakthroughs: many(breakthroughs),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [projectMembers.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

// Tickets Relations
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
    relationName: 'creator',
  }),
  timeLogs: many(timeLogs),
  comments: many(comments),
  activities: many(activities),
}));

// Time Logs
export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [timeLogs.organizationId],
    references: [organizations.id],
  }),
  ticket: one(tickets, {
    fields: [timeLogs.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [timeLogs.userId],
    references: [users.id],
  }),
}));

// Comments
export const commentsRelations = relations(comments, ({ one }) => ({
  organization: one(organizations, {
    fields: [comments.organizationId],
    references: [organizations.id],
  }),
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Leaves
export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  organization: one(organizations, {
    fields: [leaveRequests.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
}));

// Goals
export const weeklyGoalsRelations = relations(weeklyGoals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [weeklyGoals.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [weeklyGoals.userId],
    references: [users.id],
  }),
  items: many(goalItems),
}));

export const goalItemsRelations = relations(goalItems, ({ one }) => ({
  weeklyGoal: one(weeklyGoals, {
    fields: [goalItems.weeklyGoalId],
    references: [weeklyGoals.id],
  }),
}));

// System
export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  ticket: one(tickets, {
    fields: [activities.ticketId],
    references: [tickets.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const breakthroughsRelations = relations(breakthroughs, ({ one }) => ({
  organization: one(organizations, {
    fields: [breakthroughs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [breakthroughs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [breakthroughs.projectId],
    references: [projects.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  organization: one(organizations, {
    fields: [searchHistory.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));
