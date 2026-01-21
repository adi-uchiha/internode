# Product Requirement Document (PRD): Internode

**Version:** 1.0

**Status:** Draft

**Project Lead:** Aditya (CTO)

**Date:** December 31, 2025

---

## 1. Executive Summary

**Internode** is a specialized Engineering Management SaaS designed to streamline the oversight, mentorship, and performance tracking of software engineering interns. In high-velocity startup environments, the traditional "end-of-internship" review is often too late to provide meaningful course correction. Internode solves this by creating a real-time, data-driven feedback loop between interns and engineering leadership.

By integrating daily logs with technical output (commits, docs, blockers), Internode transforms the internship from a black-box experience into a transparent, growth-oriented journey. For the CTO, it provides a "Heads-Up Display" (HUD) of the engineering team’s health without the need for constant micromanagement.

---

## 2. Problem Statement

Managing interns in a fast-paced engineering team presents three core challenges:

1. **Visibility Gap:** Managers often lack real-time visibility into what interns are actually learning or where they are stuck until a milestone is missed.
2. **Mentorship Overhead:** Providing consistent, actionable feedback is time-consuming and often falls through the cracks of a busy CTO's schedule.
3. **Data Fragmentation:** Intern progress is scattered across GitHub commits, Slack messages, and verbal updates, making it difficult to perform objective final evaluations for full-time conversion.

---

## 3. Goals & Success Metrics

### 3.1. Strategic Goals

- **Increase Productivity:** Enable interns to reach "full-speed" faster by identifying and removing blockers daily.
- **Enhance Retention:** Improve intern-to-full-time conversion rates by providing a better professional experience.
- **Structured Mentorship:** Create a central repository for technical breakthroughs and feedback.

### 3.2. Key Performance Indicators (KPIs)

- **Log Completion Rate:** Percentage of interns who submit logs daily.
- **Blocker Resolution Time:** Average time from "Blocker" being logged to "Admin Feedback" provided.
- **Skill Acquisition Velocity:** Number of new "Skill Tags" successfully utilized by an intern over a 30-day period.

---

## 4. User Personas

### 4.1. The Engineering Intern (Member)

- **Needs:** A low-friction way to report progress, showcase their technical growth, and get timely help when stuck.
- **Pain Points:** Feeling "lost" in a large codebase, hesitation to "bother" the CTO with questions, and lack of clarity on their overall performance.

### 4.2. The CTO/Engineering Manager (Admin)

- **Needs:** High-level overview of team activity, automated reporting, and a way to spot high-potential talent early.
- **Pain Points:** Spending too much time in 1-on-1s repeating the same technical advice and missing critical "blockers" that stall project progress.

---

## 5. Functional Requirements: Member Side

The Member side is designed to be a "Developer Home Base" that rewards consistent logging and reflection.

### 5.1. Quick Log Dashboard

- **Description:** A focused, single-page interface for daily entry.
- **Fields:** Includes "What I did," "What I learned," "Hours worked," and a "Blockers" text area.
- **UX:** Optimized for speed, allowing a full log to be completed in under 3 minutes.

### 5.2. Learning & Logging Graph

- **Description:** A visual "contribution grid" similar to GitHub’s activity graph.
- **Functionality:** Each square represents a day; intensity of color represents hours worked or complexity of tasks.
- **Purpose:** Gamifies consistency and provides immediate visual feedback on the intern's commitment.

### 5.3. Skill Tagging System

- **Description:** Interns tag their daily logs with specific technologies (e.g., `#nextjs`, `#mongoose`, `#bun`).
- **Data Usage:** The system aggregates these tags to create a "Skill Cloud" on the profile, showing which parts of the stack the intern is actually touching.

### 5.4. Weekly Recap (AI-Powered)

- **Description:** Every Friday, an AI agent summarizes the week’s logs into a 3-paragraph executive summary.
- **Benefit:** Helps the intern reflect on their achievements and provides a "ready-made" update for their manager.

### 5.5. Monthly View & Time Tracking

- **Description:** A calendar-style view of all past logs.
- **Stats:** Displays total monthly hours, average hours/day, and a breakdown of "Learning Days" vs. "Execution Days."

### 5.6. PR & Documentation Linkage

- **Description:** Dedicated fields for pasting GitHub PR links and internal documentation (Notion/Wiki) links.
- **Context:** This "proves" the log entries and gives the Admin direct access to the code being discussed.

### 5.7. Technical Breakthroughs

- **Description:** A "Highlight" checkbox for logs that represent a major learning milestone (e.g., "First time deploying to Vercel").
- **Visibility:** These are pinned to the top of the intern’s profile as a "Wall of Wins."

### 5.8. Project Linking

- **Description:** A dropdown menu to associate the daily log with a specific project created by the Admin.
- **Purpose:** Ensures individual intern work aligns with broader organizational goals.

### 5.9. Automatic Blocker Escalation

- **Description:** If a log entry is marked as "Blocked" and remains unresolved for >24 hours, the system triggers a priority alert to the Admin.

### 5.10. Weekly Goal Tracking (Weekly "Goat")

- **Description:** A "Monday Morning" feature where interns set 3 primary technical goals for the week.
- **Tracking:** Daily logs can be "toggled" to show progress against these specific goals.

### 5.11. Leave & Vacation Management

- **Description:** Ability to mark "Sick Leave," "Vacation," or "Half-Day" directly in the logging interface.
- **Benefit:** Prevents the "HUD" from showing a "Missing Log" alert when the intern is simply away.

### 5.12. Public Shout-outs

- **Description:** A peer-to-peer "Kudos" system where interns can tag colleagues in their logs for helping them solve a problem.

---

## 6. Functional Requirements: Admin Side

The Admin side focuses on "Management by Exception"—identifying who needs help while letting high-performers run.

### 6.1. The HUD (Heads-Up Display)

- **Description:** A real-time dashboard showing the status of all active interns.
- **Indicators:** Red (Missing log), Yellow (Logged with Blocker), Green (Logged & Productive).
- **Punctuality Tracking:** Tracks what time logs are submitted to gauge discipline.

### 6.2. Feedback & Commenting Engine

- **Description:** Admins can "Thread" comments directly onto any daily log entry.
- **Mentorship:** Enables the CTO to provide technical guidance ("Try using `Promise.all` here") without hopping on a call.

### 6.3. Performance Analysis & Heatmaps

- **Description:** Visual charts comparing intern output over time.
- **Metrics:** Efficiency (Tasks/Hour), Growth (New tags added), and Reliability (Consistency of logging).

### 6.4. Automated Reporting

- **Description:** Scheduled PDF reports (weekly/monthly) sent to the CTO's email.
- **Content:** Top 3 performers, total team hours, and a list of "Unresolved Blockers".

### 6.5. Project & Intern Lifecycle Management

- **Description:** Create/Edit projects, invite new interns via email, and "Offboard" interns at the end of their term.
- **Archival:** Profiles are archived but remain accessible for future hiring references.

---

## 7. User Interaction & Design

- **Style:** Technical Minimalist / "Engineering Dark Mode."
- **Navigation:** Sidebar-based navigation for rapid switching between Dashboard, Logs, and Projects.
- **Feedback:** Micro-interactions (haptic-like visuals) when a log is successfully "pushed" to the server.
- **Visual Elements:** Use of monospaced fonts for data and thin, blueprint-style borders to maintain a "dev-tool" aesthetic.

---

## 8. Assumptions & Constraints

- **Assumptions:** Interns have consistent internet access; Admins will check the dashboard at least once every 48 hours.
- **Constraints:** Initial MVP will be web-only (no native mobile app) to ensure rapid deployment using the Next.js 16 + Bun stack.
