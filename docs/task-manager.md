# Task Manager Module — UI PRD for Loveable.ai Generation

**Version:** 2.1  
**Status:** Final  
**Module Owner:** Aditya (CTO)  
**Date:** March 7, 2026  
**Purpose:** Complete UI specification for the Task Manager module of Internode. This document is optimized for **Loveable.ai prompt-based generation** and subsequent integration into the Internode platform.

---

> ## ⚠️ LOVEABLE.AI GENERATION DIRECTIVE
>
> **This PRD is for UI-only generation.** The initial focus is purely on the frontend interface.
>
> - **All data must be static / hardcoded mock data.** No backend, no API calls, no database.
> - **Use realistic-looking static data** throughout all screens (sample ticket titles, member names, hour counts, chart data, etc.).
> - **All interactions should be UI-only:** buttons show hover/active states, modals open/close, Kanban cards can be dragged, but no data persists on refresh.
> - **Login screen is static:** clicking any sign-in button navigates directly to the dashboard. No real authentication.
> - **Navigation is fully functional:** all sidebar links, routes, and modals should work for navigation purposes.
> - **Charts and graphs should render with hardcoded sample data** to demonstrate the visual design.
> - The generated UI will later be integrated into the Internode project with real backend logic.

---

## 1. Product Context & Vision

### 1.1. What Is This Module?

The **Task Manager** is a dedicated module within the Internode platform that functions as a lightweight, internal project management tool — similar to Jira but purpose-built for a 15-member startup team.

The module provides **time tracking**, **productivity analytics**, **Kanban workflow**, and **admin oversight** as a self-contained task management system within Internode.

### 1.2. Why It Exists

Internode already tracks intern daily logs, learning, and breakthroughs. The Task Manager completes the picture by tracking **what work is assigned, how long it takes, and where bottlenecks form** — all without leaving the Internode ecosystem.

### 1.3. Core Principles

- **Self-Contained System:** All tickets, statuses, time logs, and comments live within the Internode platform.
- **Time Is the Currency:** Every ticket has an estimated time budget. Members log actual hours. The delta drives all productivity analytics.
- **Admin Creates, Members Execute:** Only the Admin creates and assigns tickets. Members update status, log time, and move cards on the Kanban board.
- **Markdown-First:** All ticket descriptions and work notes support full Markdown with live preview.
- **Multi-Auth Onboarding:** Users can sign up using GitHub, Google, or Email — no single-provider lock-in.

---

## 2. Design System & Visual Language

> **CRITICAL:** The Task Manager must be visually indistinguishable from the rest of Internode. It uses the same **"Dark Engineering" / "Modern Technical Minimalist"** aesthetic throughout.

### 2.1. Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0a0a` | Page background, root canvas |
| `--bg-secondary` | `#111111` | Card backgrounds, sidebar, modals |
| `--bg-tertiary` | `#1a1a1a` | Hover states, nested containers, input fields |
| `--bg-elevated` | `#222222` | Dropdown menus, tooltips, popovers |
| `--border-default` | `#1e1e1e` | 1px card borders, dividers |
| `--border-active` | `#2a2a2a` | Active card borders, focused inputs |
| `--text-primary` | `#ffffff` | Headlines, primary content |
| `--text-secondary` | `#a0a0a0` | Body text, descriptions |
| `--text-tertiary` | `#666666` | Metadata, timestamps, labels |
| `--accent-primary` | `#00ff88` | Primary actions, active states, glowing borders (Internode green) |
| `--accent-primary-dim` | `rgba(0, 255, 136, 0.15)` | Accent backgrounds, badge fills |
| `--status-todo` | `#666666` | To-Do column header, badges |
| `--status-progress` | `#3b82f6` | In Progress — electric blue |
| `--status-review` | `#f59e0b` | In Review — amber |
| `--status-done` | `#00ff88` | Done — Internode green |
| `--status-unplanned` | `#8b5cf6` | Unplanned/Backlog — purple |
| `--danger` | `#ef4444` | Overdue, over-budget, destructive actions |
| `--warning` | `#f59e0b` | Approaching deadline, nearing budget |

### 2.2. Typography

| Element | Font | Weight | Size | Transform |
|---|---|---|---|---|
| Page titles | Space Grotesk | 700 | 28px | None |
| Section headers | Space Grotesk | 600 | 20px | None |
| Card titles | Space Grotesk | 500 | 15px | None |
| Body text | Inter | 400 | 14px | None |
| Metadata / Tags | JetBrains Mono | 400 | 11px | UPPERCASE |
| Buttons (primary) | Space Grotesk | 600 | 13px | UPPERCASE |
| Buttons (secondary) | JetBrains Mono | 400 | 12px | None |
| Input labels | Inter | 500 | 12px | UPPERCASE |
| Code / Branch names | JetBrains Mono | 400 | 13px | None |

### 2.3. Component Patterns

#### Cards
- Background: `--bg-secondary`
- Border: 1px solid `--border-default`
- Border-radius: `2px` (sharp, not rounded)
- Hover: border transitions to `--accent-primary` with `box-shadow: 0 0 12px rgba(0, 255, 136, 0.08)`
- Padding: `16px 20px`

#### Buttons
- **Primary:** Background `--accent-primary`, text `#0a0a0a`, no border-radius, padding `10px 24px`, hover: slight glow + `scale(1.01)`
- **Secondary (Ghost):** Transparent background, 1px border `--border-active`, text `--text-secondary`, hover: border `--accent-primary`
- **Danger:** Background `--danger`, text white
- **Text Link:** No background, text `--accent-primary`, append monospaced `→` on hover

#### Inputs
- Background: `--bg-tertiary`
- Border: 1px solid `--border-default`
- Focus: border `--accent-primary` + subtle green glow `0 0 8px rgba(0, 255, 136, 0.12)`
- Text: `--text-primary`
- Placeholder: `--text-tertiary`
- Label above: `--text-tertiary`, uppercase, JetBrains Mono 11px

#### Modals
- Overlay: `rgba(0, 0, 0, 0.75)` with `backdrop-filter: blur(4px)`
- Modal body: `--bg-secondary`, 1px border `--border-default`
- Max-width: `720px` for standard modals, `960px` for ticket creation
- Header: Bottom border `--border-default`, title in Space Grotesk 20px

#### Badges / Status Pills
- Rounded corners: `2px`
- Font: JetBrains Mono, 10px, UPPERCASE
- Padding: `2px 8px`
- Background: status color at 15% opacity
- Text: status color at 100%

#### Sidebar Navigation
- Width: `240px` collapsed-capable to `64px`
- Background: `--bg-secondary`
- Right border: 1px `--border-default`
- Active item: left accent bar `3px` in `--accent-primary` + text turns `--accent-primary`
- Icons: 18px, stroke-style, `--text-tertiary` default, `--accent-primary` on active

### 2.4. Animation & Micro-Interactions

- **Page transitions:** Fade-in `opacity 0→1` over `200ms ease-out`
- **Card hover:** Border glow transition `150ms`
- **Kanban drag:** Card lifts with `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)` + `scale(1.02)` + `rotate(1deg)`
- **Button press:** `scale(0.98)` for `80ms`
- **Modal open:** `opacity 0→1` + `translateY(8px)→0` over `200ms`
- **Toast notifications:** Slide in from top-right, `translateX(100%)→0` over `300ms`, auto-dismiss after `4s`
- **Progress bars:** Animated fill with `transition: width 500ms ease-out`
- **Number counters:** Count-up animation on dashboard load
- **Skeleton loaders:** Pulsing gradient `--bg-tertiary` shimmer while data loads

### 2.5. Data Visualization Style

- **Chart backgrounds:** Transparent (no white chart areas)
- **Grid lines:** `--border-default` at 0.3 opacity
- **Chart accent:** `--accent-primary` for positive metrics
- **Danger line:** `--danger` for overdue/over-budget
- **Tooltip style:** `--bg-elevated` with `--text-primary`, 1px border `--border-active`
- **Sparklines:** Thin, 2px stroke, `--accent-primary` fill gradient fading to transparent

---

## 3. Global Layout & Navigation

### 3.1. Application Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│ TOP BAR (48px height)                                   │
│ [☰ Toggle] [Internode Logo] ──── [Search] [🔔] [Avatar]│
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│  SIDE  │           MAIN CONTENT AREA                    │
│  BAR   │           (scrollable)                         │
│ 240px  │                                                │
│        │                                                │
│        │                                                │
│        │                                                │
│        │                                                │
│        │                                                │
└────────┴────────────────────────────────────────────────┘
```

### 3.2. Top Bar (48px)

- **Left:** Hamburger menu toggle (collapses sidebar) + **Internode** logo in Space Grotesk 16px bold
- **Center:** Global search input — monospaced placeholder: `> search tickets, members...` — keyboard shortcut badge `⌘K` inside the input
- **Right cluster:**
  - Notification bell icon with unread count badge (green dot)
  - User avatar (32px, circular, pulled from auth provider or uploaded) + dropdown on click

### 3.3. Sidebar Navigation Items

```
── TASK MANAGER ──────────────
  📊  Dashboard
  📋  Kanban Board
  📁  My Tickets
  ⏱   Time Logs

── TEAM ──────────────────────
  👥  Members          [Admin only]
  📈  Analytics        [Admin only]

── SYSTEM ────────────────────
  ⚙   Settings         [Admin only]
```

- Section labels: JetBrains Mono, 10px, UPPERCASE, `--text-tertiary`
- Nav items: Inter 14px, `--text-secondary`, 40px row height
- `[Admin only]` items are **completely hidden** from Member view (not greyed out — removed)
- Active state: left 3px green bar + text `--accent-primary`
- Bottom of sidebar: User card — avatar (28px) + name + role badge (`ADMIN` or `MEMBER`)

---

## 4. Authentication & Onboarding Screens

### 4.1. Login Screen — `[SCREEN: LOGIN]`

**Route:** `/login`

**Layout:** Full-screen, centered card on `--bg-primary` background with faint dot-matrix pattern overlay.

> **LOVEABLE NOTE:** This is a static login screen. Clicking any sign-in button navigates directly to `/onboarding` (first visit) or `/dashboard`. No real authentication logic.

**Elements:**
- **Center card** (480px wide, `--bg-secondary`, 1px border):
  - Internode logo + tagline: `> engineering_management.init()`  in JetBrains Mono 12px `--text-tertiary`
  - Heading: **"Sign in to your workspace"** — Space Grotesk 24px
  - Subtext: `Choose your preferred sign-in method` — Inter 14px `--text-secondary`
  - **[Sign in with GitHub]** — Full-width button, `--bg-tertiary` background, GitHub Octicon icon left-aligned, white text
  - **[Sign in with Google]** — Full-width button, `--bg-tertiary` background, Google "G" icon left-aligned, white text
  - Horizontal divider line with centered text: `or continue with email`
  - **Email input** — placeholder: `you@company.com`
  - **Password input** — placeholder: `••••••••`, toggle visibility icon
  - **[Sign In]** — Full-width primary button (`--accent-primary` background, dark text)
  - Text link below: `Don't have an account? Sign up →` — navigates to sign-up variant of same screen
  - Small text: `By signing in, you agree to Terms of Service` — 12px `--text-tertiary`

**Sign Up Variant** (toggled via the link above):
- Same card layout, but fields change to:
  - Full name input
  - Email input
  - Password input
  - **[Create Account]** primary button
  - OR sign up with GitHub / Google buttons
  - Text link: `Already have an account? Sign in →`

**Behavior (Static):**
- Clicking any sign-in/sign-up button navigates to Dashboard
- No real auth — purely navigational

### 4.2. Onboarding Screen — `[SCREEN: ONBOARDING]`

**Route:** `/onboarding`  
**Condition:** First-time login only

**Layout:** Full-screen stepper, 3 steps

**Step 1 — Welcome:**
- Large heading: `Welcome, {firstName}` — Space Grotesk 32px (static: `Welcome, Aditya`)
- Subtext: `You've been added to {workspaceName}` — Inter 16px (static: `InternHub`)
- User avatar displayed at 80px (static placeholder avatar)
- Role badge displayed: `ADMIN` or `MEMBER`
- [Continue →] button

**Step 2 — Notification Preferences:**
- Toggle switches for:
  - Email notifications for ticket assignments
  - Email notifications for overdue tickets
  - Browser push notifications
- Each toggle: label left, switch right, `--accent-primary` when active

**Step 3 — Dashboard Tour (Admin) / Quick Start (Member):**
- **Admin:** 3 animated panels showing Dashboard → Kanban → Analytics highlights
- **Member:** 3 animated panels showing My Tickets → Time Logging → Kanban
- [Go to Dashboard →] primary button

---

## 5. Admin-Specific Screens

### 5.1. Admin Dashboard — `[SCREEN: ADMIN_DASHBOARD]`

**Route:** `/dashboard`  
**Access:** Admin only

**Layout:** Bento grid layout with customizable widget positions (drag-and-drop reordering). Default layout below.

#### Row 1 — KPI Summary Strip (4 equal cards)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ TOTAL TICKETS│ IN PROGRESS  │ OVERDUE      │ TEAM HOURS   │
│     47       │     12       │      3       │   128.5h     │
│  ↑ 8 this wk │ ↑ 2 from yd │  ⚠ needs attn│  this week   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Each card: `--bg-secondary`, 1px border
- Main number: Space Grotesk 36px bold `--text-primary`
- Label above: JetBrains Mono 10px UPPERCASE `--text-tertiary`
- Subtext below: Inter 12px, color contextual (green for positive, red for overdue)
- Sparkline graph (last 7 days) at the bottom of each card, 20px height
- OVERDUE card: left border 3px `--danger` when count > 0

#### Row 2 — Two-Column Split

**Left (60% width): Burn-Rate Chart**
- Card title: `[BURN RATE]` — JetBrains Mono overline
- Heading: **"Estimated vs. Actual Hours"** — Space Grotesk 18px
- **Chart type:** Dual-line area chart
  - Line 1 (dashed, `--text-tertiary`): Estimated hours cumulative
  - Line 2 (solid, `--accent-primary`): Actual logged hours cumulative
  - Fill: gradient `--accent-primary` to transparent below the actual line
- X-axis: Days of current week (Mon–Sun)
- Y-axis: Hours
- Hover tooltip: Shows exact values for both lines
- Toggle buttons above chart: `This Week` | `Last 2 Weeks` | `This Month`

**Right (40% width): Red-Flag Alerts**
- Card title: `[ALERTS]` — JetBrains Mono overline  
- Heading: **"Over-Budget Tickets"** — Space Grotesk 18px
- List of tickets where `actual_hours > estimated_hours`:
  - Each row:
    - Ticket title (truncated to 40 chars) — Inter 14px
    - Variance badge: `+23%` in `--danger` pill
    - Assignee avatar (24px)
    - Mini progress bar: red-filled beyond 100%
  - Max 5 items, then `View all →` text link
- Empty state: checkmark icon + `No over-budget tickets` in `--text-tertiary`

#### Row 3 — Two-Column Split

**Left (50%): Project-Wise Efficiency**
- Card title: `[PROJECTS]`
- Heading: **"Time by Project"**
- **Chart type:** Horizontal bar chart
  - Each bar: project name on left, bar showing estimated (outline) vs actual (filled)
  - Color: `--accent-primary` if under budget, `--danger` if over
- Static sample projects: `Frontend App`, `API Server`, `Mobile App`, `DevOps`, `Documentation`

**Right (50%): Member Status Table**
- Card title: `[TEAM STATUS]`
- Heading: **"Live Member Activity"**
- Table columns:

| Member | Current Ticket | Status | Hours Today |
|--------|---------------|--------|-------------|
| Avatar + Name | Ticket title (linked) | Status pill | `2.5h` |

- Table style: no outer border, thin row dividers `--border-default`
- Rows alternate: `--bg-secondary` / `--bg-tertiary`
- "Hours Today" column: right-aligned, JetBrains Mono
- Status pills use status colors
- Click on member name → navigates to member detail page
- Click on ticket → opens expanded ticket view

#### Row 4 — Full Width: Recent Activity Feed

- Card title: `[ACTIVITY LOG]`
- Heading: **"Recent Activity"**
- Vertical timeline list (last 20 events):
  - Each entry: `{avatar} {member_name} {action} {ticket_title} — {timestamp}`
  - Actions: "created", "moved to In Progress", "logged 2.5h on", "completed", "commented on"
  - Timestamp: relative (`2m ago`, `1h ago`) in JetBrains Mono `--text-tertiary`
- Thin vertical line on the left connecting events, color `--border-default`
- Filter tabs above: `All` | `Time Logs` | `Status Changes` | `Comments`

#### Dashboard Customization

- **Edit mode:** Toggle via `[Customize]` ghost button in top-right
- In edit mode:
  - Widget borders become dashed `--accent-primary`
  - Drag handles appear (6-dot grip icon) on each widget
  - Widgets can be dragged to reorder
  - `[Save Layout]` primary button + `[Reset to Default]` ghost button
  - `[Done]` to exit edit mode

---

### 5.2. Ticket Creation Modal — `[SCREEN: TICKET_CREATE]`

**Trigger:** `[+ New Ticket]` primary button visible in top bar and Kanban board (Admin only)  
**Type:** Full-screen modal overlay (960px max-width)

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ ✕  CREATE NEW TICKET                          [Create] btn  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [TITLE]                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Enter ticket title...                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────┬──────────────────────┐            │
│  │ [PROJECT]            │ [ASSIGNEE]           │            │
│  │ ▼ Select project     │ ▼ Select member      │            │
│  └──────────────────────┴──────────────────────┘            │
│                                                             │
│  ┌──────────────────────┬──────────────────────┐            │
│  │ [TIME ESTIMATE]      │ [PRIORITY]           │            │
│  │ _____ hours          │ ▼ Medium             │            │
│  └──────────────────────┴──────────────────────┘            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [LABELS]   + Add label...                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [DESCRIPTION]                                              │
│  ┌──────────────────────────┬──────────────────────────┐    │
│  │  Markdown Editor (Input) │  Live Preview (Rendered) │    │
│  │                          │                          │    │
│  │  # Task Description      │  Task Description        │    │
│  │  Write markdown here...  │  (rendered as HTML)       │    │
│  │                          │                          │    │
│  │  ```code blocks```       │  <code styled blocks>    │    │
│  │                          │                          │    │
│  └──────────────────────────┴──────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [DUE DATE]  📅 Select date...                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│           [Cancel]  ghost btn     [Create Ticket]  primary  │
└─────────────────────────────────────────────────────────────┘
```

**Field Details:**

1. **Title** — Single-line text input, required, max 120 chars.
2. **Project** — Dropdown of workspace projects. Required. Static options: `Frontend App`, `API Server`, `Mobile App`, `DevOps`, `Documentation`.
3. **Assignee** — Dropdown with search. Shows member avatar (24px) + name + role badge. Single-select. Required.
4. **Time Estimate** — Numeric input (decimals allowed, e.g., `4.5`). Unit label "hours" appended. Required. Min: 0.5h.
5. **Priority** — Dropdown: `Critical` (red dot), `High` (amber dot), `Medium` (blue dot), `Low` (grey dot). Default: Medium.
6. **Labels** — Multi-select tag input. Type to create new or select existing. Labels render as pills with `--accent-primary-dim` background.
7. **Description** — **Dual-pane Markdown editor:**
   - Left pane: Raw markdown input with syntax highlighting, line numbers in `--text-tertiary`
   - Right pane: Real-time rendered preview
   - Toolbar above editor: Bold, Italic, Code, Link, Image, List, Heading buttons — icon-only, ghost style
   - Min-height: 300px, resizable vertically
8. **Due Date** — Date picker, optional. Calendar popup styled dark. Past dates disabled.

**Behavior (Static):**
- On `[Create Ticket]`: modal closes, new ticket card appears in "To-Do" column of Kanban (static add to UI)
- Success: toast notification `✓ Ticket created` with green accent
- No real data persistence — for Loveable, just show the interaction

---

### 5.3. Ticket Edit Modal — `[SCREEN: TICKET_EDIT]`

**Trigger:** Admin clicks "Edit" on expanded ticket view  
**Layout:** Identical to creation modal but pre-filled with existing data  
**Additional elements:**
- `[DELETE TICKET]` danger button in footer (left-aligned) with confirmation dialog
- Version history link: `View edit history →`

---

### 5.4. Members Management — `[SCREEN: MEMBERS_MANAGE]`

**Route:** `/members`  
**Access:** Admin only

**Layout:**

#### Header Row
- Page title: **"Team Members"** — Space Grotesk 28px
- Subtext: `{count} active members in {workspace_name}` — Inter 14px `--text-secondary`
- **[Invite Member]** primary button (right-aligned)

#### Members Grid (Bento cards, 3 columns)

Each member card:
```
┌──────────────────────────────┐
│  [Avatar 48px]               │
│  Aditya Sharma               │
│  aditya@company.com           │  ← JetBrains Mono, --text-tertiary
│  ──────────────────────────  │
│  Role: ADMIN                 │  ← Green badge
│  Tickets: 12 active          │
│  Hours (this week): 32.5h    │
│  Efficiency: 94%             │  ← Green if >85%, amber if 60-85%, red if <60%
│  ──────────────────────────  │
│  [View Profile] [Remove]     │
└──────────────────────────────┘
```

- Cards: `--bg-secondary`, hover glow
- Role badge: `ADMIN` = green pill, `MEMBER` = grey pill
- `[Remove]` button: ghost, `--danger` text. Only on member cards (admin can't remove self)

#### Invite Member Modal

- Input: Email address
- Role selector: `Admin` | `Member` radio buttons
- `[Send Invite]` primary button
- Pending invites list below with status: `Pending` | `Accepted` | `Expired`
- **Static:** Show 2 hardcoded pending invites as examples

---

### 5.5. Team Analytics — `[SCREEN: TEAM_ANALYTICS]`

**Route:** `/analytics`  
**Access:** Admin only

**Layout:** Full-width bento grid

#### Row 1 — Productivity Overview (3 cards)

**Card 1: Team Velocity**
- Metric: Total tickets moved to "Done" this period
- Sparkline trend (last 4 weeks)
- Comparison: `↑ 15% vs last week`

**Card 2: Average Efficiency**
- Formula display: `Efficiency = Estimated / Actual × 100`
- Gauge visualization: semicircle, green zone (80-120%), amber (60-80%, 120-150%), red (<60%, >150%)
- Current value: large number, e.g., `94%`

**Card 3: Total Hours Logged**
- Big number: `342.5h` this period
- Breakdown bar: stacked horizontal bar showing hours per project (color-coded)

#### Row 2 — Member Comparison Table

Full-width sortable table:

| Rank | Member | Tickets Done | Hours Logged | Avg Efficiency | Trending |
|------|--------|-------------|-------------|----------------|----------|
| 1 | Avatar + Name | 8 | 34.5h | 96% ● | ↑ sparkline |

- Sortable by any column (click header)
- Rank column: `#1` styled in `--accent-primary` for top 3
- Efficiency cell: colored by performance tier
- Trending: 7-day mini sparkline

#### Row 3 — Two Charts

**Left: Ticket Flow (Sankey-style or stacked bar)**
- Shows tickets flowing through statuses over time
- X-axis: weeks, Y-axis: count
- Stacked by status colors

**Right: Time Distribution**
- Pie/donut chart: hours per project
- Center: total hours
- Legend below with project names + percentages

#### Row 4 — Individual Deep Dive

- Dropdown: `Select member to analyze`
- On select, shows:
  - That member's personal burn-rate chart
  - Their ticket completion timeline
  - Their logged hours per day (bar chart, last 14 days)
  - List of their overdue tickets

#### Date Range Filter (Global)
- Appears at page top-right
- Presets: `This Week` | `Last 2 Weeks` | `This Month` | `Custom Range`
- Custom range: dual date picker

---

### 5.6. Admin Settings — `[SCREEN: SETTINGS]`

**Route:** `/settings`  
**Access:** Admin only

**Layout:** Vertical tab navigation on left (200px), content on right

**Tabs:**

1. **Workspace**
   - Workspace name (editable text input)
   - Logo upload (drag-and-drop zone, accepts `.png`, `.svg`)
   - Logo preview (48px rendered)

2. **Projects**
   - List of workspace projects with drag-to-reorder handles
   - Each row: Project name (editable) + color dot + member count + `[×]` delete
   - `[+ Add Project]` at bottom
   - Static defaults: `Frontend App`, `API Server`, `Mobile App`, `DevOps`, `Documentation`

3. **Kanban Columns**
   - List of columns with drag-to-reorder handles
   - Each row: Column name (editable) + color dot (editable) + `[×]` delete
   - `[+ Add Column]` at bottom
   - Default columns shown: To-Do, In Progress, In Review, Done, Unplanned

4. **Notifications**
   - Toggle matrix:
     | Event | Email | In-App |
     |-------|-------|--------|
     | Ticket assigned | ✓ | ✓ |
     | Ticket overdue | ✓ | ✓ |
     | Time log submitted | ○ | ✓ |
     | Status changed | ○ | ✓ |

5. **Labels**
   - Manage global label library
   - Each label: name (editable) + color picker + `[×]` delete
   - `[+ New Label]`

---

## 6. Member-Specific Screens

### 6.1. Member Dashboard — `[SCREEN: MEMBER_DASHBOARD]`

**Route:** `/dashboard`  
**Access:** Members (different layout than Admin dashboard)

**Layout:** Bento grid, customizable widget positions

#### Row 1 — My Focus Strip

```
┌────────────────────────────────────────────────────────────┐
│ [MY FOCUS]                                                  │
│                                                             │
│  Currently working on:                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟢  Fix authentication redirect loop     IN PROGRESS   │ │
│  │     Frontend App  ·  ● High                             │ │
│  │     ████████████░░░ 6.5h / 8h estimated                │ │
│  │     [Quick Log +]  [View Ticket →]                      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

- Shows the ticket currently "In Progress" assigned to this member
- If multiple: show the most recently updated one, with `+{n} more` link
- If none: empty state with `No tickets in progress. Check the Kanban board →`
- **[Quick Log +]** opens inline time log input (no modal needed — expands within the card)
- Progress bar: `--accent-primary` fill, `--bg-tertiary` background

#### Row 2 — Two-Column Split

**Left (50%): Weekly Time Stats**
- Card title: `[MY WEEK]`
- **Circular progress gauge:** large circle (120px diameter)
  - Arc fill: `--accent-primary`
  - Center text: `32.5h` / `40h` — Space Grotesk 24px
  - Label below: `Hours logged this week`
- Below the gauge, 5 day-by-day mini bars (Mon–Fri):
  - Each bar shows hours logged that day
  - Today's bar is highlighted with `--accent-primary`
  - Past days: `--text-tertiary`

**Right (50%): My Upcoming Tickets**
- Card title: `[UP NEXT]`
- List of tickets assigned to this member in "To-Do" status:
  - Ticket title — Inter 14px
  - Priority dot + Project tag (monospaced)
  - Estimated time badge: `~4h`
  - Due date if set: `Due Mar 12` (amber if within 2 days, red if overdue)
- Max 5 items, then `View all my tickets →`
- Empty state: `All clear! No pending tickets.`

#### Row 3 — Full Width: Team Leaderboard

- Card title: `[LEADERBOARD]`
- Heading: **"Top Contributors This Week"**
- Ranked list (top 5 members by tickets completed):

```
  #1  🥇  Rahul S.      — 5 tickets done  │  28.5h logged  │  Efficiency: 102%
  #2  🥈  Priya M.      — 4 tickets done  │  31.0h logged  │  Efficiency: 95%
  #3  🥉  You           — 3 tickets done  │  24.0h logged  │  Efficiency: 88%
```

- Current user's row is highlighted with `--accent-primary-dim` background
- "You" label replaces name for current user
- Ranking metric toggle: `By Tickets` | `By Hours` | `By Efficiency`

#### Row 4 — Recent Activity (Personal)

- Same format as admin activity feed but filtered to current user's actions only
- Shows: time logs, status changes, comments received

#### Dashboard Customization (Member)

- Same `[Customize]` mechanism as admin dashboard
- Members can reorder widgets but cannot add admin-only widgets
- Available widgets: My Focus, Weekly Stats, Up Next, Leaderboard, Recent Activity, Quick Log

---

### 6.2. My Tickets — `[SCREEN: MY_TICKETS]`

**Route:** `/my-tickets`  
**Access:** Members

**Layout:** List view with filters

#### Filter Bar
- Status filter: `All` | `To-Do` | `In Progress` | `In Review` | `Done`
- Sort: `Newest` | `Due Date` | `Priority` | `Most Time Logged`
- Search: text input to filter by title

#### Ticket List

Each ticket row:
```
┌──────────────────────────────────────────────────────────────┐
│ ● High    Fix auth redirect loop                   Due Mar 12│
│           Frontend App                                       │
│           ████████░░░░  6.5h / 8h        Status: IN PROGRESS │
└──────────────────────────────────────────────────────────────┘
```

- Priority dot (colored) + title — Space Grotesk 15px
- Project name — JetBrains Mono 12px `--text-tertiary`
- Time progress bar + labels — JetBrains Mono
- Status pill (right-aligned)
- Click row → opens Expanded Ticket View
- Hover: card border glows `--accent-primary`

---

## 7. Shared Screens (Admin & Member)

### 7.1. Kanban Board — `[SCREEN: KANBAN]`

**Route:** `/kanban`  
**Access:** All users

**Layout:** Full-width horizontal scrollable board with 5 columns

#### Column Structure

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ TO-DO    │IN PROGRESS│IN REVIEW │  DONE    │UNPLANNED │
│ (12)     │ (5)      │ (3)      │ (24)     │ (8)      │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │
│ [Card]   │ [Card]   │          │ [Card]   │          │
│ [Card]   │          │          │ [Card]   │          │
│          │          │          │          │          │
│ + Add    │          │          │          │          │
│  (Admin) │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Column Header:**
- Column name: Space Grotesk 14px bold, UPPERCASE
- Ticket count in parentheses: JetBrains Mono `--text-tertiary`
- Left color indicator bar: 3px top border in status color
- `[+ Add]` at bottom of To-Do column (admin only) — triggers Ticket Creation Modal

**Column Width:** Equal distribution, min 280px each, horizontally scrollable if viewport < 1400px

#### Kanban Card Design

```
┌────────────────────────────────┐
│ ● High   Frontend App          │  ← Priority dot + Project tag
│                                │
│ Fix authentication redirect    │  ← Title: Space Grotesk 14px
│ loop in OAuth callback         │
│                                │
│ ████████████░░░  6.5h / 8h    │  ← Time progress bar
│                                │
│ [👤 Avatar]  ·  Due Mar 12    │  ← Assignee + Due date
└────────────────────────────────┘
```

- **Card background:** `--bg-secondary`
- **Card border:** 1px `--border-default`
- **Hover:** border `--accent-primary` + subtle glow
- **Priority dot:** colored circle (8px) — Critical: red, High: amber, Medium: blue, Low: grey
- **Project tag:** JetBrains Mono 10px, pill with `--bg-tertiary` background
- **Title:** Space Grotesk 14px, `--text-primary`, max 2 lines then truncate with `...`
- **Time progress bar:**
  - Full width within card
  - Height: 4px
  - Fill: `--accent-primary` if within budget, `--warning` if >80% used, `--danger` if over budget
  - Labels: `{logged}h / {estimated}h` in JetBrains Mono 11px
  - If over budget: bar extends past 100% with red overflow section
- **Footer:** Assignee avatar (24px circle) + due date text
  - Due date: green if >3 days away, amber if ≤3 days, red if overdue, bold if overdue
- **Labels:** If present, show as small pills below the title (max 3 visible + `+{n}`)

#### Drag & Drop Behavior

- **Who can drag:** All users (Admin and Members) can drag cards between columns
- **Drag visual:** Card lifts with elevation shadow + slight rotation (`1deg`) + `scale(1.02)`
- **Drop zone:** Column highlights with dashed `--accent-primary` border when card is hovering over it
- **Drop ghost:** Semi-transparent placeholder shows where card will land
- **On drop:**
  - Card animates into position (`200ms ease`)
  - Status updates locally immediately
  - Toast: `Ticket moved to {column_name}` — auto-dismiss 3s
- **Restrictions:** None — any card can be moved to any column by any user

#### Kanban Toolbar

- **Filter row** above columns:
  - Assignee filter: avatar chips, click to toggle, multi-select
  - Priority filter: `All` | `Critical` | `High` | `Medium` | `Low`
  - Project filter: dropdown of projects
  - Label filter: dropdown of labels
  - Search: text input to live-filter cards by title
- **View toggle** (right side): `Board View` | `List View` icons
- **[+ New Ticket]** primary button (admin only, right side)

---

### 7.2. Expanded Ticket View — `[SCREEN: TICKET_DETAIL]`

**Trigger:** Click any ticket card on Kanban or ticket list  
**Type:** Slide-in panel from right (640px width) OR full-page route `/ticket/{id}`

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ ← Back    TICKET-42                    [Edit] [⋮ More]   │
│                                                          │
│ Fix authentication redirect loop in OAuth callback       │ ← Title: 24px
│                                                          │
│ ┌──────────────────┬─────────────────────────────────┐   │
│ │  STATUS          │  IN PROGRESS  ▼                 │   │
│ │  PRIORITY        │  ● High                         │   │
│ │  ASSIGNEE        │  👤 Rahul Sharma                │   │
│ │  PROJECT         │  Frontend App                   │   │
│ │  CREATED BY      │  👤 Aditya (Admin)              │   │
│ │  CREATED         │  Mar 5, 2026                    │   │
│ │  DUE DATE        │  Mar 12, 2026                   │   │
│ │  LABELS          │  [auth] [bug] [frontend]        │   │
│ └──────────────────┴─────────────────────────────────┘   │
│                                                          │
│ ── TIME TRACKING ──────────────────────────────────────  │
│                                                          │
│  ██████████████░░░░  6.5h / 8h estimated                │
│                                                          │
│  Variance: -18.75%  (Under budget ✓)                     │
│                                                          │
│  [+ Log Time]  ← opens inline form                      │
│                                                          │
│  Time Log History:                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📅 Mar 7  │ 2.0h │ Fixed token refresh logic     │  │
│  │ 📅 Mar 6  │ 3.0h │ Debugged redirect URI mismatch │  │
│  │ 📅 Mar 5  │ 1.5h │ Set up OAuth test environment  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│ ── DESCRIPTION ────────────────────────────────────────  │
│                                                          │
│  (Full rendered Markdown content here)                   │
│  Supports: headings, code blocks, lists, tables,         │
│  images, links, task lists, blockquotes                  │
│                                                          │
│ ── COMMENTS ───────────────────────────────────────────  │
│                                                          │
│  👤 Aditya — 2h ago                                     │
│  "Check the redirect_uri parameter encoding"             │
│                                                          │
│  👤 Rahul — 1h ago                                      │
│  "Found it — was double-encoding the callback URL"       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Write a comment... (Markdown supported)          │   │
│  │                                      [Comment]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Metadata Sidebar Details:**
- **STATUS:** Dropdown (Members can change). Shows status pill. Options: To-Do, In Progress, In Review, Done, Unplanned.
- **PRIORITY:** Display only for members, editable for admin
- **PROJECT:** Display project name with color dot
- **LABELS:** Pill badges, clickable on admin (opens edit)
- All metadata labels: JetBrains Mono 11px UPPERCASE on left column, `--text-tertiary`

**Time Tracking Section:**
- Progress bar: larger (8px height), same color logic as Kanban card
- **Variance display:**
  - Negative variance (under budget): `--accent-primary` text + checkmark
  - Positive variance (over budget): `--danger` text + warning icon
  - Formula displayed in tooltip on hover: `(Actual - Estimated) / Estimated × 100`
- **[+ Log Time]** button expands inline form:
  - Hours input (numeric, decimal allowed, min 0.25)
  - Work note textarea (Markdown supported, required, min 10 chars)
  - Date selector (defaults to today, can backfill)
  - `[Save]` primary + `[Cancel]` ghost
- **Time Log History:** Vertical timeline
  - Each entry: Date | Hours (JetBrains Mono) | Note (Inter)
  - Member avatar on each entry
  - Admin can view all member logs; Members see only their own logs
  - Expand note on click to see full Markdown-rendered content

**Description Section:**
- Full Markdown rendering
- Syntax-highlighted code blocks with copy button
- Task lists render as interactive checkboxes (admin only can toggle)
- Images render inline
- Tables render with `--border-default` styling

**Comments Section:**
- Threaded view (flat, chronological)
- Each comment: avatar (28px) + name + relative timestamp
- Comment body: Markdown-rendered
- Reply input: Markdown textarea with formatting toolbar
- Both Admin and Members can comment

**[⋮ More] Menu (Admin Only):**
- Edit ticket
- Delete ticket (with confirmation modal)
- Copy ticket link
- Export as PDF

---

### 7.3. Time Logs Page — `[SCREEN: TIME_LOGS]`

**Route:** `/time-logs`  
**Access:** All users (scoped to own logs for Members, all logs for Admin)

**Layout:**

#### Header
- Title: **"Time Logs"** for members, **"All Time Logs"** for admin
- Date range picker (top-right)

#### Summary Cards (3-column)

| My Hours This Week | My Hours This Month | Avg Hours / Day |
|---|---|---|
| 24.5h | 98.0h | 4.9h |

(Admin sees team totals instead)

#### Logs Table

| Date | Ticket | Hours | Work Note | Status |
|------|--------|-------|-----------|--------|
| Mar 7 | Fix auth redirect... | 2.0h | Fixed token refresh... | ✓ Submitted |

- Sortable columns
- Click row → expands to show full work note (Markdown rendered)
- Admin view: additional "Member" column with avatar + name
- Export: `[Export CSV]` ghost button (top-right)

#### Calendar Heatmap (Below Table)

- Similar to GitHub contribution graph
- 12 weeks of squares
- Intensity = hours logged that day
- Color: shades of `--accent-primary` (more hours = more intense)
- Hover tooltip: `Mar 7: 4.5 hours logged`

---

## 8. Notification Center — `[SCREEN: NOTIFICATIONS]`

**Trigger:** Bell icon in top bar  
**Type:** Dropdown panel (360px wide, max 480px tall, scrollable)

**Layout:**
```
┌──────────────────────────────────┐
│ NOTIFICATIONS           Mark all │
├──────────────────────────────────┤
│ 🟢 Aditya assigned you           │
│    "Fix auth redirect loop"      │
│    2 minutes ago                 │
│──────────────────────────────────│
│ ⏱  Time log approved             │
│    "Setup OAuth test env"        │
│    1 hour ago                    │
│──────────────────────────────────│
│ 🔴 Ticket overdue                │
│    "Update API documentation"    │
│    3 hours ago                   │
│──────────────────────────────────│
│        View all notifications →  │
└──────────────────────────────────┘
```

- Unread items: left border 3px `--accent-primary` + `--bg-tertiary` background
- Read items: no left border + `--bg-secondary` background
- Click notification → navigates to relevant ticket
- `Mark all` link: marks all as read
- Notification types:
  - Ticket assigned (green dot)
  - Ticket overdue (red dot)
  - Status changed (blue dot)
  - Time logged on your ticket (clock icon) — admin only
  - Comment on your ticket (chat icon)
  - New member joined (person icon) — admin only

---

## 9. Empty States & Edge Cases

Every screen must have a well-designed empty state. These are **not** afterthoughts — they are the first thing a new user sees.

### 9.1. Empty Kanban Board
- Illustration: wireframe-style Kanban columns with dashed outlines
- Text: `No tickets yet. Create your first ticket to get started.`
- `[+ Create Ticket]` primary button (admin) or `Ask your admin to assign tickets` (member)

### 9.2. Empty Dashboard
- Illustration: HUD-style outline of charts with no data
- Text: `Your dashboard will come alive once tickets are created and time is logged.`

### 9.3. Empty Time Logs
- Illustration: clock wireframe
- Text: `No time logged yet. Start tracking on your assigned tickets.`

### 9.4. Empty Member List
- Text: `Invite your team members to get started.`
- `[Invite Member]` button

### 9.5. No Search Results
- Text: `No results for "{query}". Try different keywords.`

### 9.6. Network Error
- Banner (full-width, `--danger` background at 15% opacity):
- Text: `Connection lost. Some data may be outdated. [Retry] [Dismiss]`

---

## 10. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | >1280px | Full layout as described |
| Tablet | 768–1280px | Sidebar collapses to icons (64px), Kanban horizontally scrollable |
| Mobile | <768px | Sidebar becomes bottom nav (5 icons), Kanban single-column stack, cards full-width |

### Mobile-Specific Adaptations
- Kanban: swipe horizontally between columns, one column visible at a time with column name tabs
- Ticket detail: full-screen modal instead of slide-in panel
- Dashboard: widgets stack vertically, single column
- Time log: simplified form — hours + note only
- Navigation: bottom tab bar with 4 icons: Dashboard, Kanban, My Tickets, Profile

---

## 11. Screen Inventory & Route Map

| # | Screen Name | Route | Admin | Member | Description |
|---|---|---|---|---|---|
| 1 | Login | `/login` | ✓ | ✓ | GitHub / Google / Email sign-in (static) |
| 2 | Onboarding | `/onboarding` | ✓ | ✓ | First-time setup wizard (static) |
| 3 | Admin Dashboard | `/dashboard` | ✓ | ✗ | KPIs, burn rate, alerts, team status |
| 4 | Member Dashboard | `/dashboard` | ✗ | ✓ | Focus ticket, stats, leaderboard |
| 5 | Kanban Board | `/kanban` | ✓ | ✓ | Drag-and-drop task board |
| 6 | Ticket Detail | `/ticket/:id` | ✓ | ✓ | Full ticket view with time logs |
| 7 | Ticket Create | Modal overlay | ✓ | ✗ | Create new ticket |
| 8 | Ticket Edit | Modal overlay | ✓ | ✗ | Edit existing ticket |
| 9 | My Tickets | `/my-tickets` | ✗ | ✓ | Personal ticket list with filters |
| 10 | Time Logs | `/time-logs` | ✓ | ✓ | Time tracking history + heatmap |
| 11 | Members | `/members` | ✓ | ✗ | Team management + invite |
| 12 | Analytics | `/analytics` | ✓ | ✗ | Team performance deep-dive |
| 13 | Settings | `/settings` | ✓ | ✗ | Workspace, projects, notifications |
| 14 | Notifications | Dropdown overlay | ✓ | ✓ | Notification center |
| 15 | User Profile | `/profile` | ✓ | ✓ | Personal info + settings |

---

## 12. User Profile — `[SCREEN: USER_PROFILE]`

**Route:** `/profile`  
**Access:** All users (own profile)

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  [Avatar 80px]                                           │
│  Rahul Sharma                                            │
│  rahul@company.com                                       │
│  Role: MEMBER                                            │
│  Joined: Jan 15, 2026                                    │
│                                                          │
│  ── STATS ───────────────────────────────────────────    │
│  Total Tickets: 42  │  Completed: 36  │  Avg Efficiency: 94%  │
│  Total Hours: 280h  │  This Month: 98h                   │
│                                                          │
│  ── CONTRIBUTION HEATMAP ────────────────────────────    │
│  (Activity grid, 12 weeks, colored by hours logged)      │
│                                                          │
│  ── RECENT ACTIVITY ─────────────────────────────────    │
│  (Last 10 actions: time logs, status changes, comments)  │
│                                                          │
│  [Edit Notification Preferences]  ghost button            │
│  [Sign Out]  danger text link                            │
└──────────────────────────────────────────────────────────┘
```

- Avatar pulled from auth provider or uploaded
- Stats in bento-style mini cards (static sample data)
- Contribution heatmap: same component as Time Logs page
- Admin can view any member's profile via `/profile/:id`

---

## 13. Global Search — `[COMPONENT: GLOBAL_SEARCH]`

**Trigger:** `⌘K` keyboard shortcut or click search bar in top nav  
**Type:** Command palette overlay (centered, 600px wide)

```
┌──────────────────────────────────────────────────────────┐
│  > Search tickets, members...              ⌘K to close   │
├──────────────────────────────────────────────────────────┤
│  RECENT                                                  │
│    📋 Fix auth redirect loop            TICKET-42        │
│    📋 Update API docs                   TICKET-38        │
│                                                          │
│  QUICK ACTIONS                                           │
│    + Create new ticket                  (Admin)          │
│    ⏱ Log time                                            │
│    📊 View analytics                    (Admin)          │
└──────────────────────────────────────────────────────────┘
```

- Fuzzy search across ticket titles, member names, project names
- Results grouped: `TICKETS` | `MEMBERS` | `PROJECTS`
- Each result row: icon + title + subtitle (repo/role) + keyboard hint
- Arrow keys to navigate, Enter to select
- Escape to close
- Background overlay: `rgba(0, 0, 0, 0.6)` with blur

---

## 14. Loading & Skeleton States

Every screen must show skeleton loading states before data arrives.

**Skeleton Pattern:**
- Use animated gradient shimmer on `--bg-tertiary` → `--bg-secondary` → `--bg-tertiary`
- Skeleton rectangles match the shape of real content (text lines, avatars, charts)
- Animation: subtle left-to-right sweep, `1.5s` cycle, `ease-in-out`
- Duration: skeletons show for minimum 200ms to avoid flicker

**Kanban skeleton:** 5 column outlines with 2-3 card-shaped rectangles each  
**Dashboard skeleton:** KPI cards shimmer, chart areas show axis lines with no data  
**Table skeleton:** Header row static, body rows shimmer

---

## 15. Toast & Feedback System

All user actions produce immediate visual feedback:

| Action | Toast Message | Style |
|---|---|---|
| Ticket created | `✓ Ticket created` | Green left-border |
| Ticket moved | `Moved to "In Progress"` | Blue left-border |
| Time logged | `✓ 2.5h logged on TICKET-42` | Green left-border |
| Ticket deleted | `Ticket deleted` | Red left-border |
| Error | `Something went wrong. Please try again.` | Red left-border + retry icon |
| Member invited | `Invite sent to user@email.com` | Green left-border |

- Position: top-right, stacked
- Auto-dismiss: 4 seconds
- Manual dismiss: `×` button
- Max visible: 3 (older ones slide up)

---

## 16. Accessibility & Keyboard Navigation

- All interactive elements: focusable with visible focus ring (`--accent-primary` outline, 2px offset)
- Kanban cards: keyboard-draggable with `Space` to pick up, arrow keys to move, `Space` to drop
- Tab order follows visual reading order
- ARIA labels on all icon-only buttons
- Color-blind safe: all status colors have text labels as backup; never rely on color alone
- Minimum contrast ratio: WCAG AA (4.5:1 for text)

---

*End of UI PRD — Task Manager Module v2.1*

---

## 17. Dashboard Widget Library (Customizable)

Both Admin and Member dashboards use a "Bento-grid" of widgets. In **Customize Mode**, users can add/remove/reorder from this library.

### 1.7.1. Shared Widgets (Available to All)
- **[WIDGET: CLOCK_HUD]**: Large digital clock in JetBrains Mono + current date + current active workspace name.
- **[WIDGET: RECENT_COMMENTS]**: Scrollable list of the last 5 comments on tickets the user is involved in.
- **[WIDGET: SEARCH_QUICK]**: Sticky search bar widget for jumping to any ticket ID.
- **[WIDGET: KANBAN_PREVIEW]**: Mini-view of the "In Progress" column.

### 1.7.2. Admin-Exclusive Widgets
- **[WIDGET: TEAM_BURN_RATE]**: Area chart comparing estimated vs actual team hours for the week.
- **[WIDGET: PROJECT_HEALTH]**: Multi-color bar showing current status distribution for a specific project.
- **[WIDGET: TOP_PRODUCTIVITY]**: Mini leaderboard showing members with the best Efficiency Scores.
- **[WIDGET: BLOCKER_ALERTS]**: High-visibility card showing any tickets marked "Blocked" for >24h.
- **[WIDGET: PENDING_INVITES]**: Status of email invites sent to new members.
- **[WIDGET: COST_ESTIMATOR]**: Total hours logged × a hidden rate (for internal budgeting).

### 1.7.3. Member-Exclusive Widgets
- **[WIDGET: MY_DAILY_GOAL]**: Progress ring showing hours logged today vs. a 7h or 8h goal.
- **[WIDGET: MY_UPCOMING_DEADLINES]**: List of my tickets sorted by closest due date.
- **[WIDGET: SKILL_CLOUD]**: Visual cloud of tags (e.g., `#nextjs`, `#typescript`) based on my completed tickets.
- **[WIDGET: WEEKLY_GOAT]**: List of my 3 primary technical goals for the week.
- **[WIDGET: KUDOS_RECEIVED]**: Small feed of shout-outs or "Kudos" tagged by the Admin or peers.

---

## 18. Productivity & Analytics Logic

### 18.1. The "Efficiency Score"
The UI should display an **Efficiency Percentage** for every member and project:
- **Formula:** `(Total Estimated Hours / Total Actual Hours) × 100`
- **Visuals:** 
  - `> 100%`: Extra efficient (Task finished faster than guestimate).
  - `90-100%`: Perfect alignment.
  - `< 80%`: Red flag (Task taking longer than expected).

### 18.2. Productivity Heatmaps
- **Member Heatmap:** A 52-week grid (GitHub style).
- **Intensity:** Darker shades of green (`#00ff88`) represent days with higher **"Output Density"** (combination of hours logged and tickets moved to "Done").

---

## 19. Skill Tagging & Technical Breakthroughs

To align with the core **Internode** philosophy, the Task Manager includes:

### 19.1. Skill Tags
- When an Admin creates a ticket, they can add `#tags` (e.g., `#react`, `#api`, `#css`).
- When a member completes the ticket, these tags are added to their **Skill Profile**.
- **UI:** A "Skill Radar" chart on the Member Profile showing expertise balance.

### 19.2. "Highlight" Milestone (Breakthroughs)
- On the **Time Log Form**, members can check a box: `[ ] Mark as Technical Breakthrough`.
- **UI Effect:** The log entry gets a glowing `--accent-primary` border and an "Award" icon.
- **Wall of Wins:** These entries are aggregated on the Member's public profile as their "Highlights."

---

## 20. Admin Flow: Project Setup

**Screen: `[SCREEN: PROJECT_WIZARD]`**
1. **Name & Identity:** Enter project name (e.g., "System Alpha") + choose a 2-letter prefix (e.g., "SA") for ticket IDs.
2. **Team Assignment:** Select which of the 15 members are "Active" on this project.
3. **Budgeting:** Set an optional "Total Hours Budget" for the project.
4. **Initial Kanban:** Pre-fill the project with "Seed Tickets" or import from a template.

---

## 21. Static Data Cheat Sheet (Expanded)

### Sample "Technical Breakthroughs" for Loveable:
- "Mastered complex SQL joins for the API optimization task." (Score: 10/10)
- "Implemented first custom React Hook for the auth redirect loop." (Score: 10/10)

### Sample "Skill Tags" Distribution:
- **Frontend App:** `#react`, `#tailwind`, `#typescript`, `#framer-motion`
- **API Server:** `#nodejs`, `#postgresql`, `#redis`, `#zod`
- **DevOps:** `#docker`, `#vps`, `#nginx`, `#github-actions`

---

*End of UI PRD — Task Manager Module v2.2*

---

> ## 📋 STATIC DATA CHEAT SHEET FOR LOVEABLE
>
> Use these hardcoded values throughout all screens:
>
> **Members (5 sample):**
> 1. Aditya Sharma — Admin — aditya@internhub.com
> 2. Rahul Verma — Member — rahul@internhub.com
> 3. Priya Mehta — Member — priya@internhub.com
> 4. Arjun Patel — Member — arjun@internhub.com
> 5. Sneha Gupta — Member — sneha@internhub.com
>
> **Projects:** Frontend App, API Server, Mobile App, DevOps, Documentation
>
> **Sample Tickets (pre-populate Kanban):**
> - TICKET-42: "Fix authentication redirect loop" — High — Frontend App — Rahul — 6.5h/8h — In Progress
> - TICKET-41: "Update API documentation" — Medium — API Server — Priya — 2h/4h — To-Do
> - TICKET-40: "Implement dark mode toggle" — Low — Frontend App — Arjun — 0h/3h — To-Do
> - TICKET-39: "Optimize database queries" — Critical — API Server — Sneha — 5h/6h — In Review
> - TICKET-38: "Setup CI/CD pipeline" — High — DevOps — Rahul — 8h/8h — Done
> - TICKET-37: "Design onboarding flow" — Medium — Mobile App — Priya — 10h/8h — Done (over budget)
> - TICKET-36: "Add unit tests for auth" — Medium — Frontend App — Arjun — 0h/5h — Unplanned
> - TICKET-35: "Write API integration guide" — Low — Documentation — Sneha — 3h/4h — In Progress
>
> **Dashboard Numbers:** Total: 47 tickets, 12 in progress, 3 overdue, 128.5h team hours this week
>
> **Chart Data:** Use ascending trend lines with slight variability for sparklines and burn-rate charts.

---

