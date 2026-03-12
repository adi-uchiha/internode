import { relations } from 'drizzle-orm';
import { users } from './users';
import { projects, projectMembers } from './projects';
import { tickets, timeLogs, comments } from './tickets';
import { leaveRequests } from './leaves';
import { weeklyGoals, goalItems } from './goals';
import { activities, notifications } from './system';
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
}));

// Projects Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  members: many(projectMembers),
  tickets: many(tickets),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
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
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
}));

// Goals
export const weeklyGoalsRelations = relations(weeklyGoals, ({ one, many }) => ({
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
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
