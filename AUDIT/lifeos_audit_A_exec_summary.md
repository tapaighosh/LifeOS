# LifeOS Audit — Section A: Executive Summary (10 Most Critical Problems)

> Audit date: 2026-08-28 | Based on actual codebase inspection.

---

### A1 · No Task Lifecycle — Everything Is Permanently `pending`
**Severity:** P0 | **Area:** Data Model / Product Logic

`IPlanEntry.status` only has `pending | done | partial | skipped`. No `EXPIRED` state, no automated transition. A task scheduled for yesterday that was never touched still appears as `pending` today, tomorrow, and forever. The carryover logic in [`contextCollector.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/scheduler/contextCollector.ts) reads entries with `status === 'pending' || status === 'partial'` from recent plans. A task the user never saw is treated identically to one they started and didn't finish. **There is no semantic distinction between "never acted on" and "was in progress."**

**Fix:** Midnight Vercel Cron sets `pending` entries for past dates to `expired`. Recurring tasks auto-re-queue. One-time tasks surface user decision: carry over or cancel.

---

### A2 · Plan Generation Is Not Idempotent — Race Condition on Double-Tap
**Severity:** P0 | **Area:** Concurrency / Backend

[`POST /api/plan/generate`](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/plan/generate/route.ts) reads the `locked` flag (line 27), then calls AI (3–8 seconds), then does `findOneAndUpdate` with `upsert`. Two simultaneous requests both pass the lock check, both call the AI (double cost), and both overwrite the plan — whichever finishes last wins silently.

**Fix:** Atomic generation lock: `findOneAndUpdate({ date, generating: { $ne: true } }, { $set: { generating: true } })` before calling AI. Release on completion or error.

---

### A3 · AI Response Validation Is Incomplete — Hallucinated IDs Corrupt Plans
**Severity:** P0 | **Area:** AI / Data Integrity

The Zod schema in [`responseParser.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/ai/responseParser.ts) validates shape only. It does NOT verify `task_id` values exist in the database. The AI hallucinates an ObjectId string, Zod passes it, and the plan is saved with a non-existent reference. The night check-in silently fails to find the task — challenge and revision hooks never fire.

**Fix:** Post-Zod business validation pass: verify all `task_id`/`topic_item_id` exist in DB, verify no time overlaps, verify all times fall within calculated slot windows.

---

### A4 · Carryover System Has No Duration Cap — Infinite Backlog Loop
**Severity:** P1 | **Area:** Scheduling / Product Logic

[`contextCollector.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/scheduler/contextCollector.ts) fetches up to 3 carryover task IDs. Those tasks may have `duration: 90 | 120`. Three 90-minute carryovers = 270 minutes forced into a 150-minute morning window. The scheduler cannot fit them → moves to `skipped_tasks` → they reappear tomorrow as carryovers → **infinite loop**. The system never resolves the backlog; it just shuffles it.

**Fix:** Carryover budget = max 30% of `net_capacity_minutes`. Remaining carryovers go to a deferred state, not re-inserted daily.

---

### A5 · Timezone Handling Is Mixed and Dangerous
**Severity:** P1 | **Area:** Time / Date

Multiple routes use `new Date().toISOString().split('T')[0]` — this produces a **UTC date**. For IST (UTC+5:30), at 11:30 PM local time this returns *yesterday's* date. Affected files:
- [`plan/route.ts` line 16](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/plan/route.ts#L16)
- [`add-task/route.ts` line 60](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/plan/add-task/route.ts#L60)
- [`checkin/route.ts` lines 101-103](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/log/checkin/route.ts#L101-L103)

[`slotCalculator.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/scheduler/slotCalculator.ts) calls `new Date(dateStr)` (UTC midnight) then `setHours()` (local time) — mixing UTC parse with local-time write, causing slot offset errors for all non-UTC users.

**Fix:** Install `date-fns-tz`. Pass `UserSettings.timezone` to all date operations. Never use bare `new Date('YYYY-MM-DD')`.

---

### A6 · Challenge Streak Allows Double-Counting on Same Day
**Severity:** P1 | **Area:** Challenges / Data Integrity

In [`checkin/route.ts` lines 147-174](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/log/checkin/route.ts#L147-L174): when `status === 'done'`, `total_completed` increments unconditionally. If the user submits check-in twice on the same day, `total_completed` increments twice. A 30-day streak challenge can be "completed" in 15 days by double-logging.

**Fix:** Guard: `if (challenge.last_completed_on === date) continue;`

---

### A7 · `add-task` Endpoint Has Zero Capacity or Overlap Validation
**Severity:** P1 | **Area:** Scheduling / UX

[`PATCH /api/plan/add-task` lines 71-84](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/plan/add-task/route.ts#L71-L84) accepts any `time_start`/`time_end` and pushes the entry without checking: time overlap with existing entries, whether the window is within free hours, or whether `time_end - time_start` matches `task.duration`. The plan becomes structurally invalid.

**Fix:** Before insert, validate: times within available slot windows, no overlap with existing entries, duration consistency.

---

### A8 · Queue Topic Injection Is Broken in Both Scheduler Paths
**Severity:** P1 | **Area:** Scheduling / Data Integrity

**Rule-based path** ([`planGenerator.ts` lines 170-181](file:///c:/Users/user/Desktop/Project/LifeOS/lib/scheduler/planGenerator.ts)): queue topics injected with `time_start: '00:00', time_end: '00:00'` placeholder — appear at midnight in the UI.

**AI path** ([`responseParser.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/ai/responseParser.ts)): Zod schema requires `task_id: z.string()` (required, not optional) for every entry. Queue topics use `topic_item_id`, not `task_id`. AI-generated queue topics fail Zod → fall back to rule-based → get placeholder midnight times.

**The entire Phase 3 learning queue feature is not reliably functioning in production.**

**Fix:** Discriminated union Zod schema: `entry_type === 'task'` requires `task_id`; `entry_type === 'queue_topic'` requires `topic_item_id`. Assign real time slots, not `00:00`.

---

### A9 · `DayLog` Has No Submission Guard — Double-Submit Corrupts All Downstream State
**Severity:** P1 | **Area:** Data Model / Product Logic

[`DayLog`](file:///c:/Users/user/Desktop/Project/LifeOS/models/DayLog.ts) has no `is_submitted` field. The checkin route does `findOneAndUpdate` with `upsert: true` — second submission silently overwrites the first, and every side effect re-fires: challenge progress increments again, revision queue gets seeded again, AI insight regenerates. The night check-in is the single most important write in the system and has zero idempotency protection.

**Fix:** Add `is_submitted: boolean` (default: false) and `submitted_at?: Date` to `DayLog`. Return `409 Already submitted` on re-submission.

---

### A10 · No Capacity Budget Enforcement — Will Consistently Over-Schedule
**Severity:** P1 | **Area:** Scheduling / Product Philosophy

The scheduler fills 100% of `availableSlots` duration with tasks. It does not subtract meals, commute buffer, context-switch overhead, or buffer for the unexpected. A 3-hour morning window gets 3 hours of scheduled cognitive work with no breathing room.

This **directly violates the product philosophy**: "optimize for sustainable progress, not maximum task completion." The result is a guaranteed daily under-completion → carryover loop that erodes user trust faster than any feature can recover it.

**Fix:** Add `overhead_budget_minutes` to `UserSettings` (default 30 min/session). Only schedule into `net_capacity = slot_duration - overhead_budget`.
