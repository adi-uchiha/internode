# Feature Blueprint: Expert Consultation Completion, Prescription & Follow-Up

| Field               | Value                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Blueprint ID**    | FB-2026-007                                                        |
| **Version**         | 2.1                                                                |
| **Status**          | `DRAFT` → `PM_REVIEW` → `CTO_REVIEW` → `CEO_APPROVED` → **FROZEN** |
| **Current Status**  | 🔵 FROZEN                                                          |
| **Created By**      | Aditya (CTO)                                                       |
| **PM**              | [PM Name]                                                          |
| **CEO Approved On** | 2026-04-10                                                         |
| **Frozen On**       | 2026-04-10                                                         |
| **Apps Affected**   | Bizz App (Expert), Parent App, Admin Panel, Care Service (Backend) |
| **Domain Tags**     | `consultation`, `clinical`, `scheduling`, `financial`              |

---

## Change Log

| Version | Date       | Changed By | Summary of Change                                  | CR ID  |
| ------- | ---------- | ---------- | -------------------------------------------------- | ------ |
| 1.0     | 2026-03-15 | PM         | Initial draft with user stories                    | —      |
| 1.1     | 2026-03-17 | CTO        | Added business rules, state machine, data contract | —      |
| 2.0     | 2026-04-01 | CTO        | Added settlement integration, 45-day constraint    | —      |
| 2.1     | 2026-04-10 | CTO        | Follow-up fee lock rule added after CEO feedback   | CR-003 |

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [User Stories](#2-user-stories)
3. [Business Rules Matrix](#3-business-rules-matrix)
4. [Data Schema & Contract](#4-data-schema--contract)
5. [State Machine](#5-state-machine)
6. [Screens & UI States](#6-screens--ui-states)
7. [Design System References](#7-design-system-references)
8. [Error States & Edge Cases](#8-error-states--edge-cases)
9. [Cross-App Data Flow](#9-cross-app-data-flow)
10. [Notification Contract](#10-notification-contract)
11. [Technical Implementation Plan](#11-technical-implementation-plan)
12. [API Contracts](#12-api-contracts)
13. [Security & Auth Matrix](#13-security--auth-matrix)
14. [Timeline Estimate](#14-timeline-estimate)
15. [Ticket Breakdown](#15-ticket-breakdown)
16. [Blockers & Dependencies](#16-blockers--dependencies)
17. [Design Delivery Checklist](#17-design-delivery-checklist)
18. [Approval Signatures](#18-approval-signatures)
19. [Appendix: Change Requests](#19-appendix-change-requests)

---

## 1. Feature Overview

### 1.1 Problem Statement

After a consultation session ends, the expert currently has no structured way to share clinical output (prescription, diagnosis, advice) with the parent. Additionally, parents have no self-service mechanism to reschedule sessions or continue care through follow-up sessions at discounted rates.

### 1.2 Solution Summary

Build a clinical completion workflow in the Bizz App that allows experts to upload prescriptions, write diagnoses, recommend lab tests, and set up discounted follow-up sessions. Display all clinical output in the Parent App with a clear follow-up booking flow. Enable one-time rescheduling with safety constraints.

### 1.3 Success Metrics

| Metric                       | Target                                 | Measurement                                                        |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Prescription completion rate | ≥ 95% of completed sessions            | `bookings where clinical_record exists / total completed bookings` |
| Follow-up conversion         | ≥ 30% of recommended follow-ups booked | `follow-up bookings / bookings with follow_up.enabled=true`        |
| Reschedule usage             | Track (no target)                      | `bookings with reschedule_status.count = 1 / total bookings`       |

### 1.4 NOT in Scope

These are explicitly excluded from this blueprint. Each requires its own Feature Blueprint.

| Excluded Feature                      | Reason                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| Cancellation & Refund                 | Requires separate financial modeling, CR with Cashfree |
| Expert-initiated rescheduling         | Product decision: parent-only privilege                |
| Video recording of sessions           | Separate infrastructure concern                        |
| Automated prescription PDF generation | V2 enhancement, currently manual upload                |
| Multi-expert follow-up (referral)     | Follow-ups are expert-locked by business rule          |

---

## 2. User Stories

### 2.1 Expert Stories (Bizz App)

| ID     | Story                                                                                                                                           | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-E01 | As an Expert, after a session ends, I want to upload a prescription PDF so that the parent has a formal clinical record                         | P0       |
| US-E02 | As an Expert, I want to write a diagnosis and advice so the parent knows what was found and what to do                                          | P0       |
| US-E03 | As an Expert, I want to recommend specific lab tests as structured tags so the parent has a clear checklist                                     | P1       |
| US-E04 | As an Expert, I want to optionally recommend a follow-up session with a custom duration and fee so the parent can continue care at a fair price | P1       |
| US-E05 | As an Expert, I want clinical records to be immutable after submission so my professional documentation is tamper-proof                         | P0       |
| US-E06 | As an Expert, I want the complete button disabled until the session start time so I cannot accidentally close a session early                   | P0       |

### 2.2 Parent Stories (Parent App)

| ID     | Story                                                                                                                            | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| US-P01 | As a Parent, I want to receive a push notification when my prescription is ready so I don't miss it                              | P0       |
| US-P02 | As a Parent, I want to view the prescription PDF in-app and download it so I have a permanent record                             | P0       |
| US-P03 | As a Parent, I want to see the diagnosis, advice, and lab recommendations in a clean summary so I understand next steps          | P0       |
| US-P04 | As a Parent, I want to book a follow-up session at the expert's recommended price so I can continue care affordably              | P1       |
| US-P05 | As a Parent, I want to reschedule a session to a new time so I can handle conflicts                                              | P1       |
| US-P06 | As a Parent, I want to see the follow-up recommendation even if the suggested date has passed so I don't lose my discounted rate | P1       |

### 2.3 Admin Stories (Admin Panel)

| ID     | Story                                                                                         | Priority |
| ------ | --------------------------------------------------------------------------------------------- | -------- |
| US-A01 | As an Admin, I want to view the clinical record attached to any booking for support forensics | P1       |
| US-A02 | As an Admin, I want to see the reschedule history of a booking to resolve disputes            | P1       |
| US-A03 | As an Admin, I want to see whether payout eligibility has been set for a completed booking    | P2       |

---

## 3. Business Rules Matrix

### 3.1 Clinical Completion Rules

| Rule ID | Rule                                                                              | Enforced At                             | Exception |
| ------- | --------------------------------------------------------------------------------- | --------------------------------------- | --------- |
| BR-C01  | Prescription PDF upload is **mandatory** for completing a consultation            | API + UI                                | None      |
| BR-C02  | Diagnosis text is mandatory, minimum 10 characters                                | API + UI                                | None      |
| BR-C03  | Advice text is mandatory, minimum 10 characters                                   | API + UI                                | None      |
| BR-C04  | The "Complete & Send" button is disabled until session `startTime` is reached     | UI + API validation                     | None      |
| BR-C05  | Clinical records are **immutable** once submitted — no edits, no deletions        | API (no update/delete endpoint exposed) | None      |
| BR-C06  | Booking must have `status: 'confirmed'` to be completable                         | API                                     | None      |
| BR-C07  | Only the assigned expert (`req.expertObjectId === booking.expertId`) can complete | API middleware                          | None      |
| BR-C08  | Completion triggers payout eligibility consideration (not immediate payout)       | Backend service                         | None      |

### 3.2 Follow-Up Rules

| Rule ID | Rule                                                                                                            | Enforced At                              | Exception |
| ------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------- |
| BR-F01  | Follow-up recommendation is **optional** — toggled by expert                                                    | UI                                       | None      |
| BR-F02  | Expert can recommend only **ONE** follow-up per completed session                                               | API validation                           | None      |
| BR-F03  | Follow-up must include: suggested date, duration (15/30/60 min), fee, reason                                    | API validation                           | None      |
| BR-F04  | Follow-up booking is restricted to the **same expert** who recommended it                                       | API + UI                                 | None      |
| BR-F05  | Follow-up fee overrides expert's standard public fee                                                            | Booking/payment service                  | None      |
| BR-F06  | Follow-up fee is **locked at recommendation time** — does not change even if expert raises their base fee later | DB (stored on booking)                   | None      |
| BR-F07  | Follow-up recommendation **never expires** — parent can book at any future date                                 | No TTL, no expiry check                  | None      |
| BR-F08  | Follow-up booking must match the recommended duration exactly                                                   | API + UI slot picker                     | None      |
| BR-F09  | Follow-up booking consumes regular expert availability slots                                                    | Slot allocation service                  | None      |
| BR-F10  | Child identity is **locked** during follow-up booking — cannot switch to another child                          | UI (child picker disabled)               | None      |
| BR-F11  | To recommend a "Follow-Up 2", the expert must first conduct and complete "Follow-Up 1" (linear chain)           | API validation via `original_booking_id` | None      |

### 3.3 Rescheduling Rules

| Rule ID | Rule                                                                                               | Enforced At                                           | Exception |
| ------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------- |
| BR-R01  | Only **parents** can initiate a reschedule                                                         | Auth middleware (parent token)                        | None      |
| BR-R02  | Each booking can be rescheduled **exactly once**                                                   | API check: `reschedule_status.count >= 1` → block     | None      |
| BR-R03  | Reschedule is blocked if current time is within **24 hours** of session `startTime`                | API validation                                        | None      |
| BR-R04  | Rescheduled session must be with the **same expert**                                               | System enforced (no expert change in reschedule flow) | None      |
| BR-R05  | Rescheduled session must match the **same duration**                                               | UI slot picker + API validation                       | None      |
| BR-R06  | New time must fall within **45 days of the original payment date** (Cashfree deferment constraint) | API validation                                        | None      |
| BR-R07  | Original slot(s) are released (marked `available`) atomically with new slot(s) being booked        | MongoDB transaction                                   | None      |
| BR-R08  | Rescheduling is **auto-confirmed** — no expert approval needed                                     | System design                                         | None      |
| BR-R09  | Reschedule is **price-neutral** — original fee remains unchanged                                   | System (no new payment created)                       | None      |
| BR-R10  | Cannot reschedule a session whose `startTime` has already passed                                   | API validation                                        | None      |
| BR-R11  | Cannot reschedule a `completed`, `cancelled`, or `missed` booking                                  | API status check                                      | None      |

### 3.4 Financial Rules (Intersection with Settlement)

| Rule ID | Rule                                                                                             | Enforced At                          | Exception |
| ------- | ------------------------------------------------------------------------------------------------ | ------------------------------------ | --------- |
| BR-$01  | Payout eligibility is only set **after** expert uploads prescription and completes the booking   | Settlement sweep + on-demand trigger | None      |
| BR-$02  | Follow-up payments use the same 40/60 inclusive split model                                      | `calculateInclusiveSplits()`         | None      |
| BR-$03  | TDS of 0.1% u/s 194-O applies to follow-up gross amount                                          | Finance helper                       | None      |
| BR-$04  | Rescheduling does NOT create a new payment — existing Cashfree order is reused                   | System (no new order)                | None      |
| BR-$05  | Rescheduled session must not exceed 45-day deferment window from original `payment_initiated_at` | API validation                       | None      |

---

## 4. Data Schema & Contract

### 4.1 Booking Model Additions

Collection: `bookings` in MongoDB (via `adwaita-care-service`)

```typescript
// Added fields to BookingSchema
{
  // ──────────────────────────────────────────────
  // CLINICAL OUTPUTS (set upon consultation completion)
  // ──────────────────────────────────────────────
  clinical_record: {
    prescription_url: { type: String },           // S3 presigned URL to uploaded PDF
    diagnosis:        { type: String },           // Expert's clinical assessment text
    advice:           { type: String },           // Expert's actionable guidance text
    lab_recommendations: [{ type: String }],      // Array of test name tags, e.g. ["CBC", "Vitamin D"]
    completedAt:      { type: Number },           // Unix Epoch Milliseconds — timestamp of completion
  },

  // ──────────────────────────────────────────────
  // FOLLOW-UP METADATA (set by expert during completion)
  // ──────────────────────────────────────────────
  follow_up: {
    enabled:        { type: Boolean, default: false },
    suggested_date: { type: Number },             // Unix Epoch Ms — expert's recommended date
    duration_min:   { type: Number },             // 15 | 30 | 60
    fee_inr:        { type: Number },             // Expert-set follow-up fee in INR
    reason:         { type: String },             // "Check progress after medication"
  },

  // ──────────────────────────────────────────────
  // CARE CHAIN TRACEABILITY
  // ──────────────────────────────────────────────
  original_booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,                                // null for initial bookings, populated for follow-ups
  },

  // ──────────────────────────────────────────────
  // RESCHEDULING METADATA
  // ──────────────────────────────────────────────
  reschedule_status: {
    count:               { type: Number, default: 0 },  // Max 1 per BR-R02
    original_start_time: { type: Number },              // Unix Epoch Ms — preserved for audit
    original_end_time:   { type: Number },
    original_date:       { type: Number },
  },
}
```

### 4.2 Cross-App Data Contract

This defines exactly what each app creates and what each app reads:

| Field                                   | Created By                         | Consumed By                                      | Type               | Required             | Notes                                      |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------ | ------------------ | -------------------- | ------------------------------------------ |
| `clinical_record.prescription_url`      | Bizz App (via S3 upload)           | Parent App (view/download), Admin Panel (audit)  | `string` (S3 URL)  | Yes (for completion) | Private S3 bucket, presigned URL           |
| `clinical_record.diagnosis`             | Bizz App                           | Parent App, Admin Panel                          | `string`           | Yes                  | Min 10 chars                               |
| `clinical_record.advice`                | Bizz App                           | Parent App, Admin Panel                          | `string`           | Yes                  | Min 10 chars                               |
| `clinical_record.lab_recommendations`   | Bizz App                           | Parent App                                       | `string[]`         | No                   | Empty array if none                        |
| `clinical_record.completedAt`           | Care Service (server timestamp)    | All                                              | `number` (Unix ms) | Yes                  | Server-generated, not client               |
| `follow_up.enabled`                     | Bizz App                           | Parent App (banner visibility)                   | `boolean`          | Yes                  | Default: `false`                           |
| `follow_up.suggested_date`              | Bizz App                           | Parent App (banner text)                         | `number` (Unix ms) | If enabled           | —                                          |
| `follow_up.duration_min`                | Bizz App                           | Parent App (slot picker lock)                    | `number`           | If enabled           | 15, 30, or 60 only                         |
| `follow_up.fee_inr`                     | Bizz App                           | Parent App (checkout), Care Service (payment)    | `number`           | If enabled           | Overrides standard fee                     |
| `follow_up.reason`                      | Bizz App                           | Parent App (banner reason)                       | `string`           | If enabled           | —                                          |
| `original_booking_id`                   | Care Service (on booking creation) | Parent App (care chain), Admin                   | `ObjectId`         | No                   | null for initial; populated for follow-ups |
| `reschedule_status.count`               | Care Service (on reschedule)       | Parent App (button visibility), API (validation) | `number`           | Yes                  | Default: 0, max: 1                         |
| `reschedule_status.original_start_time` | Care Service                       | Admin Panel (audit)                              | `number` (Unix ms) | On reschedule        | —                                          |

### 4.3 S3 File Structure

```
prescriptions/{expertObjectId}/{YYYY}/{MM}/{bookingId}.pdf
```

- **ACL**: Private (access via presigned URLs only)
- **Max File Size**: 10 MB
- **Allowed Formats**: PDF only
- **Naming Convention (User-Facing)**: `Consultation_Summary_{ChildName}_{Date}.pdf`

### 4.4 Database Indexes Required

| Collection | Index                                                              | Purpose                          |
| ---------- | ------------------------------------------------------------------ | -------------------------------- |
| `bookings` | `{ childId: 1, original_booking_id: 1 }`                           | Care chain history retrieval     |
| `bookings` | `{ expertId: 1, status: 1, has_cashfree_eligibility_been_set: 1 }` | Settlement sweep query           |
| `bookings` | `{ parentId: 1, status: 1 }`                                       | Parent's "My Consultations" list |

---

## 5. State Machine

### 5.1 Booking States

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌───────────┐
│  DRAFT   │────▶│ CONFIRMED │────▶│ IN_PROGRESS │────▶│ COMPLETED │
└──────────┘     └───────────┘     └─────────────┘     └───────────┘
                      │                                       │
                      │ (cancel)                              │ (follow-up booking)
                      ▼                                       ▼
                ┌───────────┐                          ┌────────────────┐
                │ CANCELLED │                          │ NEW BOOKING    │
                └───────────┘                          │ (follow-up)    │
                                                       └────────────────┘
                                                              │
                                                              │ (same lifecycle)
                                                              ▼
                                                       ┌───────────┐
                                                       │ CONFIRMED │ ... (repeats)
                                                       └───────────┘
```

### 5.2 Reschedule Eligibility State

```
                                 reschedule_status.count == 0
                                 AND status == 'confirmed'
                                 AND (startTime - now) > 24 hours
                                 AND (new date) <= 45 days from payment
                                          │
                               YES ───────┼──────── NO
                                │                    │
                     ┌──────────▼──────┐   ┌────────▼────────┐
                     │ RESCHEDULE      │   │ RESCHEDULE      │
                     │ ALLOWED         │   │ BLOCKED         │
                     │ (button visible)│   │ (button hidden  │
                     └─────────────────┘   │  or disabled    │
                                           │  with reason)   │
                                           └─────────────────┘
```

### 5.3 Follow-Up Banner State (Parent App)

| State                 | Condition                                                                              | Visual                  | CTA                      |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------- | ------------------------ |
| **Fresh** (Green)     | `follow_up.enabled == true` AND `now < suggested_date`                                 | Green banner            | "Book Follow-Up Session" |
| **Overdue** (Amber)   | `follow_up.enabled == true` AND `now > suggested_date` AND no follow-up booking exists | Amber banner            | "Book Follow-Up Session" |
| **Redeemed** (Hidden) | A booking exists with `original_booking_id` matching this session                      | Banner removed entirely | —                        |
| **Not Recommended**   | `follow_up.enabled == false`                                                           | No banner shown         | —                        |

---

## 6. Screens & UI States

### 6.1 Screen Inventory

Every screen must be designed with ALL states listed. A screen without error and empty states is **incomplete**.

#### Bizz App (Expert)

| Screen Name                                  | States Required                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `Bizz-BookingDetail-Confirmed`               | Default (before session time), Default (after session time — button enabled) |
| `Bizz-CompleteConsultation-Empty`            | All fields empty, "Complete" button disabled                                 |
| `Bizz-CompleteConsultation-Uploading`        | PDF upload progress ring visible                                             |
| `Bizz-CompleteConsultation-UploadFailed`     | Red retry button on PDF card                                                 |
| `Bizz-CompleteConsultation-Filled`           | All fields populated, "Complete" button enabled                              |
| `Bizz-CompleteConsultation-FollowUpExpanded` | Follow-up toggle ON, date/duration/fee visible                               |
| `Bizz-CompleteConsultation-Submitting`       | Loading spinner on "Complete" button                                         |
| `Bizz-CompleteConsultation-ConfirmModal`     | "Clinical records cannot be edited after sending" modal                      |
| `Bizz-CompleteConsultation-Success`          | Success state / redirect to booking detail showing "Completed"               |

#### Parent App

| Screen Name                                        | States Required                                    |
| -------------------------------------------------- | -------------------------------------------------- |
| `Parent-MyConsultations-Empty`                     | No consultations yet — onboarding state            |
| `Parent-MyConsultations-List`                      | Tabs: All, Scheduled, Active, Completed            |
| `Parent-ConsultationSummary-Loading`               | Skeleton loader                                    |
| `Parent-ConsultationSummary-Loaded`                | Full clinical record with all sections             |
| `Parent-ConsultationSummary-FollowUpBanner-Green`  | Fresh recommendation                               |
| `Parent-ConsultationSummary-FollowUpBanner-Amber`  | Overdue recommendation                             |
| `Parent-ConsultationSummary-FollowUpBanner-Hidden` | Follow-up already booked                           |
| `Parent-ConsultationSummary-NoFollowUp`            | Expert did not recommend follow-up                 |
| `Parent-ConsultationSummary-LegacyMissing`         | "Clinical data not available for this session"     |
| `Parent-Reschedule-SlotPicker`                     | Calendar with available slots filtered by duration |
| `Parent-Reschedule-ConfirmModal`                   | "You can only reschedule once. Proceed?"           |
| `Parent-Reschedule-SlotTaken`                      | "Oops! This slot was just taken. Pick another."    |
| `Parent-Reschedule-BufferViolation`                | "Rescheduling window closed" error modal           |
| `Parent-Reschedule-Success`                        | "Rescheduled! Dr. [Name] has been notified."       |
| `Parent-FollowUpBooking-SlotPicker`                | Duration-locked slot selection                     |
| `Parent-FollowUpBooking-Checkout`                  | Shows follow-up fee (not standard fee)             |

#### Admin Panel

| Screen Name                             | States Required                                |
| --------------------------------------- | ---------------------------------------------- |
| `Admin-BookingDetail-ClinicalRecord`    | View-only clinical record section              |
| `Admin-BookingDetail-RescheduleHistory` | Shows original and new times                   |
| `Admin-BookingDetail-PayoutEligibility` | Shows `has_cashfree_eligibility_been_set` flag |

---

## 7. Design System References

All screens must use components from the shared design system. No ad-hoc colors, fonts, or spacing.

### 7.1 Color Tokens Used

| Token                      | Hex       | Usage in This Feature                                   |
| -------------------------- | --------- | ------------------------------------------------------- |
| `--color-primary`          | `#4A90D9` | Primary buttons, links                                  |
| `--color-success`          | `#2ECC71` | Completed badge, Green follow-up banner, Upload success |
| `--color-warning`          | `#F39C12` | Amber follow-up banner (overdue)                        |
| `--color-error`            | `#E74C3C` | Upload failure, error modals, form validation           |
| `--color-surface`          | `#FFFFFF` | Card backgrounds                                        |
| `--color-surface-elevated` | `#F8F9FA` | Screen backgrounds                                      |
| `--color-text-primary`     | `#1A1A2E` | Body text, diagnosis content                            |
| `--color-text-secondary`   | `#6C757D` | Metadata, timestamps                                    |

### 7.2 Typography

| Element                       | Font  | Size | Weight |
| ----------------------------- | ----- | ---- | ------ |
| Screen Title                  | Inter | 24px | 700    |
| Section Header                | Inter | 18px | 600    |
| Body Text (Diagnosis, Advice) | Inter | 16px | 400    |
| Metadata (Date, File Size)    | Inter | 14px | 400    |
| Button Label                  | Inter | 16px | 600    |
| Banner Text                   | Inter | 14px | 500    |

### 7.3 Component Library References

| Component          | Library Reference                      | Used For                                                  |
| ------------------ | -------------------------------------- | --------------------------------------------------------- |
| `PrimaryButton`    | `@components/Button/Primary`           | "Complete & Send", "Book Follow-Up", "Confirm Reschedule" |
| `TextArea`         | `@components/Input/TextArea`           | Diagnosis, Advice, Follow-up Reason                       |
| `FileUploader`     | `@components/Upload/FileUploader`      | Prescription PDF                                          |
| `ToggleSwitch`     | `@components/Toggle/Switch`            | Lab tests toggle, Follow-up toggle                        |
| `ChipInput`        | `@components/Input/ChipInput`          | Lab test tags                                             |
| `SegmentedControl` | `@components/Segment/SegmentedControl` | Duration picker (15/30/60 min)                            |
| `CalendarStrip`    | `@components/Calendar/CalendarStrip`   | Slot picker for reschedule/follow-up                      |
| `Banner`           | `@components/Feedback/Banner`          | Follow-up recommendation banner                           |
| `Modal`            | `@components/Overlay/Modal`            | Confirmation dialogs                                      |
| `StatusBadge`      | `@components/Badge/StatusBadge`        | "Completed", "Scheduled", etc.                            |

### 7.4 Micro-Animations

| Interaction                | Animation                                         | Duration         |
| -------------------------- | ------------------------------------------------- | ---------------- |
| Follow-up toggle expand    | Spring-based accordion                            | 300ms            |
| Duration segment selection | Sliding highlight                                 | 200ms            |
| PDF upload progress        | Circular ring fill, color transition blue → green | Matches upload % |
| Reschedule confirmation    | Button → spinner → checkmark                      | 200ms transition |
| Success haptic             | Double-pulse vibration                            | —                |
| Error haptic               | Single sharp vibration                            | —                |

---

## 8. Error States & Edge Cases

### 8.1 Error Matrix

| Scenario                                           | HTTP Code | User-Facing Message                                                            | Internal Action        | App    |
| -------------------------------------------------- | --------- | ------------------------------------------------------------------------------ | ---------------------- | ------ |
| Expert tries to complete before `startTime`        | 400       | "Session has not started yet. Please wait until the scheduled time."           | Log attempt            | Bizz   |
| Expert uploads file > 10MB                         | 413       | "File too large. Maximum allowed size is 10MB."                                | Block upload           | Bizz   |
| Expert uploads non-PDF file                        | 400       | "Only PDF files are accepted for prescriptions."                               | Block upload           | Bizz   |
| Expert not assigned to this booking                | 403       | "You are not authorized to complete this consultation."                        | Log security event     | Bizz   |
| Booking already completed                          | 409       | "This consultation has already been completed."                                | No action              | Bizz   |
| Booking is cancelled/missed                        | 409       | "Cannot complete a cancelled or missed session."                               | No action              | Bizz   |
| PDF upload network failure midway                  | —         | "Upload failed. Tap to retry." (Red retry button)                              | Preserve form state    | Bizz   |
| Parent reschedules within 24h buffer               | 400       | "Rescheduling is only permitted more than 24 hours before the session."        | No action              | Parent |
| Parent reschedules but count >= 1                  | 403       | "This session has already been rescheduled once."                              | No action              | Parent |
| Reschedule slot taken by another parent (race)     | 409       | "Oops! This slot was just taken. Please pick another time."                    | Release attempted slot | Parent |
| Reschedule would exceed 45-day deferment           | 400       | "This date exceeds the maximum allowed window. Please select an earlier date." | No action              | Parent |
| Parent tries to reschedule a completed booking     | 400       | "Cannot reschedule a completed session."                                       | No action              | Parent |
| Follow-up booking: no available slots for duration | —         | "No available slots match the required duration. Please check another date."   | —                      | Parent |
| Token expired during clinical note writing         | —         | Redirect to login, persist form data locally if feasible                       | Refresh token flow     | Both   |
| Legacy booking missing `clinical_record`           | —         | "Clinical data is not available for this session."                             | Show placeholder       | Parent |

### 8.2 Concurrency Edge Cases

| Scenario                                                                                  | Handling                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Two parents try to book the same slot simultaneously                                      | MongoDB transaction with slot-level locking. Loser gets 409.                                                                                   |
| Expert double-clicks "Complete" button                                                    | UI: disable button on first click + loading state. API: idempotency check on `status === 'completed'` returns success without duplicate write. |
| Admin views booking while expert is completing it                                         | Read-after-write consistency. Admin sees latest state on refresh.                                                                              |
| Parent opens app before session time, leaves it open, then tries to reschedule within 24h | API enforces 24h rule. UI alone is not sufficient. Server-side validation catches this.                                                        |

---

## 9. Cross-App Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CARE SERVICE (Backend)                    │
│                                                                  │
│  ┌──────────┐    ┌──────────────────┐    ┌───────────────────┐  │
│  │ Booking  │    │ Expert           │    │ Settlement        │  │
│  │ Model    │◄───│ Availability     │    │ Service           │  │
│  │          │    │ Model            │    │                   │  │
│  └────┬─────┘    └──────────────────┘    └───────────────────┘  │
│       │                                                          │
└───────┼──────────────────────────────────────────────────────────┘
        │
        ├──────── Bizz App WRITES: clinical_record, follow_up
        │         (via PUT /bookings/:id/complete)
        │
        ├──────── Parent App READS: clinical_record, follow_up
        │         (via GET /bookings/:id)
        │
        ├──────── Parent App WRITES: reschedule (new date/time)
        │         (via PUT /bookings/:id/reschedule)
        │
        ├──────── Parent App WRITES: follow-up booking
        │         (via POST /bookings — with original_booking_id)
        │
        └──────── Admin Panel READS: all fields (read-only forensic view)
                  (via GET /admin/bookings/:id)
```

---

## 10. Notification Contract

| Trigger Event                 | Recipient | Channel  | Title                | Body                                                             | Data Payload                                                                         |
| ----------------------------- | --------- | -------- | -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Expert completes consultation | Parent    | FCM Push | "Prescription Ready" | "Dr. {expertName} has shared the care plan for {childName}."     | `{ type: "CONSULTATION_COMPLETED", bookingId, screen: "BookingSummary" }`            |
| Parent reschedules booking    | Expert    | FCM Push | "Booking Moved"      | "Your appointment with {childName} has been moved to {newTime}." | `{ type: "BOOKING_RESCHEDULED", bookingId, newStartTime, screen: "BookingDetails" }` |
| Parent books follow-up        | Expert    | FCM Push | "Follow-Up Booked"   | "{parentName} booked a follow-up for {childName} on {date}."     | `{ type: "FOLLOW_UP_BOOKED", bookingId, screen: "BookingDetails" }`                  |

---

## 11. Technical Implementation Plan

### 11.1 Architecture Impact

| Service / App           | Type of Change                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `adwaita-care-service`  | New API endpoints, schema migration, S3 integration, push notification triggers     |
| `bizz-app-expo`         | New screens (CompleteConsultation), form components, S3 upload hook                 |
| `adwaita_babycloud_app` | New screens (ConsultationSummary), follow-up booking modifications, reschedule flow |
| `adwaita_admin_web`     | New read-only detail panels for clinical records + reschedule history               |

### 11.2 Migration Plan

| Step | Action                                                                                                                | Risk                        | Rollback               |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------- |
| 1    | Add `clinical_record`, `follow_up`, `original_booking_id`, `reschedule_status` fields to Booking schema with defaults | Low (additive, no breaking) | Remove fields          |
| 2    | Run script: set `reschedule_status.count = 0` for all existing `confirmed` bookings                                   | Low                         | Revert script          |
| 3    | Deploy API endpoints (behind feature flag if needed)                                                                  | Medium                      | Disable endpoints      |
| 4    | Deploy Bizz App update                                                                                                | Medium                      | App rollback via store |
| 5    | Deploy Parent App update                                                                                              | Medium                      | App rollback via store |

---

## 12. API Contracts

### 12.1 Complete Consultation (Expert)

```
PUT /expert-consultation/bookings/:bookingId/complete
Auth: Expert Token (attachExpertProfile middleware → req.expertObjectId)
```

**Request Body:**

```json
{
  "clinical_record": {
    "prescription_url": "https://s3.ap-south-1.amazonaws.com/babycloud/prescriptions/65a1b.../2026/04/65b8f....pdf",
    "diagnosis": "Acute Sinusitis with mild post-nasal drip",
    "advice": "1. Maintain hydration with warm fluids\n2. Saline nasal drops 3x daily\n3. Elevate head during sleep",
    "lab_recommendations": ["CBC", "Vitamin D"]
  },
  "follow_up": {
    "enabled": true,
    "suggested_date": 1738456000000,
    "duration_min": 30,
    "fee_inr": 500,
    "reason": "Check progress after 2 weeks of medication"
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Consultation finalized and prescription shared.",
  "data": {
    "bookingId": "65b8f...",
    "status": "completed",
    "clinical_record": {
      "prescription_url": "https://s3...",
      "completedAt": 1738456000000
    }
  }
}
```

**Error Responses:**

| Code | Condition                     | Response Body                                                                |
| ---- | ----------------------------- | ---------------------------------------------------------------------------- |
| 400  | Missing prescription_url      | `{ "success": false, "error": "Prescription PDF is required." }`             |
| 400  | Diagnosis < 10 chars          | `{ "success": false, "error": "Diagnosis must be at least 10 characters." }` |
| 400  | Session startTime not reached | `{ "success": false, "error": "Session has not started yet." }`              |
| 403  | Expert does not own booking   | `{ "success": false, "error": "Unauthorized." }`                             |
| 409  | Booking already completed     | `{ "success": false, "error": "Already completed." }`                        |

### 12.2 Reschedule Booking (Parent)

```
PUT /expert-consultation/bookings/:bookingId/reschedule
Auth: Parent Token (parentAuth middleware → req.parentId)
```

**Request Body:**

```json
{
  "new_date": 1738456000000,
  "new_start_time": 1738466800000,
  "new_end_time": 1738470400000
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Booking rescheduled successfully.",
  "data": {
    "bookingId": "65b8f...",
    "new_startTime": 1738466800000,
    "new_endTime": 1738470400000,
    "reschedule_count": 1
  }
}
```

**Error Responses:**

| Code | Condition                | Response Body                                                             |
| ---- | ------------------------ | ------------------------------------------------------------------------- |
| 400  | Within 24h buffer        | `{ "success": false, "error": "Rescheduling window closed (24h rule)." }` |
| 400  | Exceeds 45-day deferment | `{ "success": false, "error": "Date exceeds maximum allowed window." }`   |
| 403  | Already rescheduled once | `{ "success": false, "error": "Already rescheduled once." }`              |
| 409  | Slot taken               | `{ "success": false, "error": "Slot unavailable. Please pick another." }` |

### 12.3 Get Consultation Summary (Parent / Admin)

```
GET /expert-consultation/bookings/:bookingId/summary
Auth: Parent Token OR Admin Token
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "bookingId": "65b8f...",
    "expertName": "Dr. Sarah",
    "childName": "Emma",
    "childAge": "2y 4m",
    "sessionDate": 1738456000000,
    "clinical_record": {
      "prescription_url": "https://s3...",
      "diagnosis": "Acute Sinusitis...",
      "advice": "1. Maintain hydration...",
      "lab_recommendations": ["CBC", "Vitamin D"],
      "completedAt": 1738456000000
    },
    "follow_up": {
      "enabled": true,
      "suggested_date": 1738456000000,
      "duration_min": 30,
      "fee_inr": 500,
      "reason": "Check progress after medication",
      "is_redeemed": false
    },
    "reschedule_status": {
      "count": 0,
      "can_reschedule": true,
      "blocked_reason": null
    }
  }
}
```

---

## 13. Security & Auth Matrix

| Action                   | Auth Middleware       | Identity Field       | Validation                    |
| ------------------------ | --------------------- | -------------------- | ----------------------------- |
| Complete Consultation    | `attachExpertProfile` | `req.expertObjectId` | Must match `booking.expertId` |
| Reschedule Booking       | `authenticateParent`  | `req.parentId`       | Must match `booking.parentId` |
| View Summary (Parent)    | `authenticateParent`  | `req.parentId`       | Must match `booking.parentId` |
| View Summary (Admin)     | `authenticatedAdmin`  | `req.adminId`        | Admin role check              |
| Upload Prescription File | `attachExpertProfile` | `req.expertObjectId` | File type + size validation   |

**S3 Security:**

- Prescription PDFs stored with **private ACL**
- Access via presigned URLs with 1-hour expiry
- Presigned URL generated per-request when parent or admin opens summary

---

## 14. Timeline Estimate

### 14.1 Phase Breakdown

| Phase                                       | Description                                                       | Estimated Hours | Assigned To | Dependencies |
| ------------------------------------------- | ----------------------------------------------------------------- | --------------- | ----------- | ------------ |
| **Phase 1: Schema & Migration**             | Add fields to Booking model, create indexes, run migration script | 4h              | CTO         | None         |
| **Phase 2: S3 Upload Infrastructure**       | S3 bucket config, presigned URL generation, upload service        | 6h              | CTO         | Phase 1      |
| **Phase 3: Complete Consultation API**      | PUT endpoint with all validations, push notification trigger      | 8h              | CTO         | Phase 1, 2   |
| **Phase 4: Reschedule API**                 | PUT endpoint with 24h/45-day/count validations, atomic slot swap  | 8h              | CTO         | Phase 1      |
| **Phase 5: Summary API**                    | GET endpoint with follow-up redemption status                     | 4h              | CTO         | Phase 3      |
| **Phase 6: Bizz App UI**                    | CompleteConsultation screen, form components, upload flow         | 16h             | Intern A    | Phase 3      |
| **Phase 7: Parent App — Summary**           | ConsultationSummary screen, PDF viewer, lab checklist             | 12h             | Intern B    | Phase 5      |
| **Phase 8: Parent App — Reschedule**        | Reschedule flow, slot picker, confirmation modal                  | 10h             | Intern B    | Phase 4      |
| **Phase 9: Parent App — Follow-Up Booking** | Follow-up booking flow with locked params                         | 8h              | Intern C    | Phase 5      |
| **Phase 10: Admin Panel**                   | Read-only clinical record view, reschedule history                | 6h              | Intern C    | Phase 5      |
| **Phase 11: Integration Testing**           | End-to-end test all user stories across apps                      | 12h             | CTO + All   | All phases   |
| **Phase 12: Bug Fixing & Polish**           | Buffer for issues found during testing                            | 8h              | All         | Phase 11     |

### 14.2 Total Estimate

| Category                      | Hours    |
| ----------------------------- | -------- |
| Backend (CTO)                 | 30h      |
| Bizz App (Intern A)           | 16h      |
| Parent App (Intern B)         | 22h      |
| Parent App + Admin (Intern C) | 14h      |
| Testing + Polish (All)        | 20h      |
| **Total**                     | **102h** |

### 14.3 Calendar Schedule

| Week       | Mon                                          | Tue                             | Wed                      | Thu                             | Fri                       |
| ---------- | -------------------------------------------- | ------------------------------- | ------------------------ | ------------------------------- | ------------------------- |
| **Week 1** | Phase 1 (CTO)                                | Phase 2 (CTO)                   | Phase 3 (CTO)            | Phase 3 (CTO)                   | Phase 4 (CTO)             |
| **Week 2** | Phase 4 + 5 (CTO), Phase 6 starts (Intern A) | Phase 6 (A), Phase 7 starts (B) | Phase 6 (A), Phase 7 (B) | Phase 8 (B), Phase 9 starts (C) | Phase 9 (C), Phase 10 (C) |
| **Week 3** | Phase 11: Integration Testing                | Phase 11                        | Phase 12: Bug Fixes      | Phase 12                        | Demo + Release Prep       |

**Delivery Date: End of Week 3 (15 working days)**

---

## 15. Ticket Breakdown

All tickets are created in Linear from this blueprint. Each ticket references this document.

### 15.1 Backend Tickets (Care Service)

| Ticket ID | Title                                                                 | Phase | Hours | Depends On | Assigned |
| --------- | --------------------------------------------------------------------- | ----- | ----- | ---------- | -------- |
| CARE-101  | Schema: Add clinical_record, follow_up, reschedule_status to Booking  | 1     | 2h    | —          | CTO      |
| CARE-102  | Migration: Initialize reschedule_status.count=0 for existing bookings | 1     | 2h    | CARE-101   | CTO      |
| CARE-103  | Service: S3 presigned URL generation for prescription upload/download | 2     | 4h    | —          | CTO      |
| CARE-104  | Service: S3 upload validation (PDF only, max 10MB)                    | 2     | 2h    | CARE-103   | CTO      |
| CARE-105  | API: PUT /bookings/:id/complete — full validation + status transition | 3     | 6h    | CARE-101   | CTO      |
| CARE-106  | API: Push notification trigger on completion                          | 3     | 2h    | CARE-105   | CTO      |
| CARE-107  | API: PUT /bookings/:id/reschedule — 24h + 45-day + count validation   | 4     | 4h    | CARE-101   | CTO      |
| CARE-108  | API: Atomic slot swap with MongoDB transaction for reschedule         | 4     | 4h    | CARE-107   | CTO      |
| CARE-109  | API: GET /bookings/:id/summary — with follow-up redemption status     | 5     | 4h    | CARE-105   | CTO      |

### 15.2 Bizz App Tickets (Expert)

| Ticket ID | Title                                                                      | Phase | Hours | Depends On         | Assigned |
| --------- | -------------------------------------------------------------------------- | ----- | ----- | ------------------ | -------- |
| BIZZ-201  | Screen: CompleteConsultation — layout, form fields, toggle sections        | 6     | 6h    | CARE-105           | Intern A |
| BIZZ-202  | Component: PrescriptionUploader with S3 integration and progress ring      | 6     | 4h    | CARE-103           | Intern A |
| BIZZ-203  | Component: LabTagPicker with chip input and dynamic search                 | 6     | 3h    | —                  | Intern A |
| BIZZ-204  | Component: FollowUpConfig — date picker, duration segment, fee input       | 6     | 3h    | —                  | Intern A |
| BIZZ-205  | Integration: Wire CompleteConsultation to PUT API, handle all error states | 6     | 4h    | BIZZ-201, CARE-105 | Intern A |

### 15.3 Parent App Tickets

| Ticket ID | Title                                                                | Phase | Hours | Depends On | Assigned |
| --------- | -------------------------------------------------------------------- | ----- | ----- | ---------- | -------- |
| PRNT-301  | Screen: ConsultationSummary — clinical record display, PDF viewer    | 7     | 6h    | CARE-109   | Intern B |
| PRNT-302  | Component: FollowUpBanner with green/amber/hidden states             | 7     | 3h    | CARE-109   | Intern B |
| PRNT-303  | Component: LabRecommendations checklist UI                           | 7     | 2h    | CARE-109   | Intern B |
| PRNT-304  | Component: PrescriptionCard with View/Download actions               | 7     | 2h    | CARE-103   | Intern B |
| PRNT-305  | Screen: Reschedule SlotPicker with duration-locked filtering         | 8     | 5h    | CARE-107   | Intern B |
| PRNT-306  | Flow: Reschedule confirmation modal + success state + error handling | 8     | 3h    | PRNT-305   | Intern B |
| PRNT-307  | Flow: Follow-up booking with locked child, duration, and fee         | 9     | 6h    | CARE-109   | Intern C |
| PRNT-308  | Integration: Follow-up checkout with follow_up.fee_inr override      | 9     | 3h    | PRNT-307   | Intern C |

### 15.4 Admin Panel Tickets

| Ticket ID | Title                                                  | Phase | Hours | Depends On | Assigned |
| --------- | ------------------------------------------------------ | ----- | ----- | ---------- | -------- |
| ADMN-401  | Panel: Clinical record read-only view in BookingDetail | 10    | 3h    | CARE-109   | Intern C |
| ADMN-402  | Panel: Reschedule history (original vs current times)  | 10    | 2h    | CARE-109   | Intern C |
| ADMN-403  | Panel: Payout eligibility flag display                 | 10    | 1h    | CARE-109   | Intern C |

### 15.5 Testing Tickets

| Ticket ID | Title                                                               | Phase | Hours | Depends On      | Assigned |
| --------- | ------------------------------------------------------------------- | ----- | ----- | --------------- | -------- |
| TEST-501  | E2E: Expert completes consultation with prescription + follow-up    | 11    | 3h    | All dev tickets | CTO      |
| TEST-502  | E2E: Parent views summary, downloads PDF, books follow-up           | 11    | 3h    | All dev tickets | Intern B |
| TEST-503  | E2E: Parent reschedules — happy path + all error cases              | 11    | 3h    | All dev tickets | Intern B |
| TEST-504  | E2E: Care chain — complete follow-up 1, recommend follow-up 2       | 11    | 2h    | All dev tickets | CTO      |
| TEST-505  | Edge: Race condition — two parents booking same slot simultaneously | 11    | 2h    | All dev tickets | CTO      |

---

## 16. Blockers & Dependencies

### 16.1 Current Blockers

| Blocker                                     | Impact                    | Owner        | Status         | Resolution ETA |
| ------------------------------------------- | ------------------------- | ------------ | -------------- | -------------- |
| S3 bucket for prescriptions not yet created | Blocks Phase 2            | CTO (DevOps) | 🔴 Pending     | Day 1          |
| Expert availability slots model review      | Blocks reschedule Phase 4 | CTO          | 🟡 In Progress | Day 3          |

### 16.2 External Dependencies

| Dependency                          | Required For                          | Contact                  | Status                    |
| ----------------------------------- | ------------------------------------- | ------------------------ | ------------------------- |
| Cashfree 45-day deferment confirmed | Reschedule date validation (BR-R06)   | Cashfree Account Manager | ✅ Confirmed (April 2026) |
| FCM push notification service       | Completion + reschedule notifications | Firebase Console         | ✅ Active                 |

### 16.3 Feature Dependencies

| This Feature Depends On                     | Status                                          |
| ------------------------------------------- | ----------------------------------------------- |
| Expert onboarding (Cashfree vendor profile) | ✅ Complete                                     |
| Booking creation + payment flow             | ✅ Complete                                     |
| Expert availability / slot management       | ✅ Complete                                     |
| Settlement sweep (for payout eligibility)   | 🟡 In Progress (separate blueprint FB-2026-005) |

| Features That Depend On THIS Feature                | Status         |
| --------------------------------------------------- | -------------- |
| Invoice PDF generation (needs clinical_record data) | ⬜ Not Started |
| Expert rating system (needs completedAt timestamp)  | ⬜ Not Started |

---

## 17. Design Delivery Checklist

This checklist must be passed BEFORE development starts. CTO + one senior dev must sign off.

### 17.1 Completeness

- [ ] Every user story (US-E01 through US-A03) has a corresponding Figma flow
- [ ] Every flow has: Start → Happy Path → End
- [ ] Error states exist for every API-calling interaction (upload, submit, reschedule)
- [ ] Empty states exist for: consultation list, no follow-up, legacy data missing
- [ ] Loading states exist for: summary page, upload progress, reschedule confirmation

### 17.2 Cross-App Consistency

- [ ] Prescription created on Bizz App is correctly rendered on Parent App (same filename, size display)
- [ ] Follow-up fee shown on Parent App matches the `follow_up.fee_inr` from Bizz App
- [ ] Date formats are consistent across Bizz, Parent, and Admin (use Unix ms → locale format)
- [ ] "Completed" badge color is identical across all apps

### 17.3 Design System Compliance

- [ ] All screens use components from the shared Figma library (Section 7.3)
- [ ] All colors match the design tokens (Section 7.1) — no random hex values
- [ ] Typography follows the defined scale (Section 7.2) — no ad-hoc font sizes
- [ ] Spacing follows 4px/8px grid

### 17.4 Interaction & Accessibility

- [ ] All tappable areas ≥ 44px (buttons, file actions, slots)
- [ ] Confirmation dialogs exist for: completion submission, reschedule confirmation
- [ ] Destructive/irreversible actions show warning copy (e.g., "cannot be edited after sending")
- [ ] Color contrast ratio ≥ 4.5:1 for all text

### 17.5 Figma File Organization

- [ ] Screens named following `[App]-[Feature]-[Screen]-[State]` convention
- [ ] Connected prototype exists for at least: expert completion flow + parent summary flow
- [ ] No orphan/disconnected screens
- [ ] Cover page with blueprint ID, version, and date

### 17.6 Sign-Off

| Reviewer   | Status                  | Date | Notes |
| ---------- | ----------------------- | ---- | ----- |
| CTO        | ☐ Approved / ☐ Rejected |      |       |
| Senior Dev | ☐ Approved / ☐ Rejected |      |       |

---

## 18. Approval Signatures

This section tracks the approval flow for this Feature Blueprint.

### Gate 1: PM Review

| Reviewer  | Decision    | Date       | Comments                                                                     |
| --------- | ----------- | ---------- | ---------------------------------------------------------------------------- |
| [PM Name] | ✅ Approved | 2026-04-02 | "User stories look complete. Added US-P06 for expired follow-up visibility." |

### Gate 2: CTO Review

| Reviewer     | Decision    | Date       | Comments                                                                                                |
| ------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| Aditya (CTO) | ✅ Approved | 2026-04-05 | "Added BR-R06 (45-day deferment constraint on reschedule). Added all error matrices. Schema finalized." |

### Gate 3: CEO/Founder Final Approval

| Reviewer       | Decision    | Date       | Comments                                                                                                 |
| -------------- | ----------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| [Founder Name] | ✅ Approved | 2026-04-10 | "Approved. Added requirement: follow-up fee must be locked permanently (BR-F06). This triggered CR-003." |

### Document Status: **🔵 FROZEN**

> **Any change to this document after this point requires a formal Change Request (see Section 19).**
> **No verbal changes. No Slack messages. No "quick updates." Write a CR or it doesn't exist.**

---

## 19. Appendix: Change Requests

### CR-003: Follow-Up Fee Lock Rule

| Field                | Value                                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CR ID**            | CR-003                                                                                                                                                                                       |
| **Requested By**     | [Founder Name]                                                                                                                                                                               |
| **Date**             | 2026-04-10                                                                                                                                                                                   |
| **What Changed**     | Before: Follow-up fee was stored but could theoretically be overridden by expert changing their base fee. After: Follow-up fee is permanently locked at the time of recommendation (BR-F06). |
| **Why**              | Founder decision: "If a doctor promises ₹500 for a follow-up, the parent should get ₹500 even if the doctor raises their standard rate to ₹2000 next month."                                 |
| **Technical Impact** | Low — fee is already stored on the booking. Just need to ensure the checkout flow reads `follow_up.fee_inr` from the original booking, NOT from the expert's current profile.                |
| **Timeline Impact**  | +0 days (no rework needed, existing design already supports this)                                                                                                                            |
| **Affected Tickets** | PRNT-308 (add explicit code comment enforcing this)                                                                                                                                          |
| **CTO Assessment**   | ✅ No risk. The `follow_up.fee_inr` is already stored per-booking.                                                                                                                           |
| **Approved By**      | CTO: Aditya (2026-04-10), Founder: [Name] (2026-04-10)                                                                                                                                       |

---

## Template Guide (DELETE THIS SECTION IN REAL BLUEPRINTS)

This section explains how to use this blueprint as a template for new features.

### Mandatory Sections (every blueprint MUST have):

1. Feature Overview (with NOT in Scope)
2. User Stories (all apps)
3. Business Rules Matrix
4. Data Schema & Contract
5. State Machine
6. Screens & UI States (with ALL states for each screen)
7. Error States & Edge Cases
8. API Contracts
9. Timeline Estimate
10. Ticket Breakdown
11. Approval Signatures

### Optional Sections (include when relevant):

- Design System References (if new components needed)
- Notification Contract (if push/email notifications involved)
- Security & Auth Matrix (if new auth patterns introduced)
- Migration Plan (if modifying existing schema)

### Rules:

1. CTO fills in sections 3, 4, 5, 8, 11-16
2. PM fills in sections 1, 2, and assists with 6
3. Founder approves via section 18
4. Changes after FROZEN status → Section 19 only
5. Every ticket in section 15 must link back to this blueprint
6. Every screen in section 6 must have at least 3 states (empty, loaded, error)
