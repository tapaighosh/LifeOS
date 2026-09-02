# LifeOS Audit — Sections C–F: Product Logic, State Machines, Data Model, Architecture

---

## C. Product Logic Gaps

### GAP-01 — No Task Expiration Rule
**Current behavior:** Tasks stay `pending` after their scheduled date passes.  
**Problem:** System cannot distinguish "never touched" from "in progress."  
**Recommended rule:** Midnight cron (Vercel Cron at 00:01 local time) finds all plan entries with `status: 'pending'` for dates before today. Sets them to `status: 'expired'`. Recurring tasks with `expired` entries are automatically included in the next day's candidate pool. One-time tasks with `expired` entries surface a user decision: reschedule or cancel.

---

### GAP-02 — No Plan Status Lifecycle
**Current behavior:** `DailyPlan` has `locked: boolean` and `paused: boolean` — two independent flags with no lifecycle concept.  
**Problem:** Cannot distinguish "plan was generated but user closed app" from "plan is being actively executed" from "plan is done for the day."  
**Recommended rule:** Add `plan_status: 'draft' | 'active' | 'completed' | 'closed'`. Transitions: generate → `draft` → user confirms → `active` → all tasks resolved → `completed`. Midnight cron force-closes plans that weren't completed.

---

### GAP-03 — No Minimum Pillar Guarantee in Scheduler
**Current behavior:** Pillar balance is tracked and reported, but the scheduler does not enforce minimums during scheduling.  
**Problem:** The rule-based scheduler sorts by priority DESC and greedily fills time. A user with 10 high-priority `money` tasks and 1 low-priority `soul` task will get zero soul tasks scheduled, even if soul is at 5% for the week.  
**Recommended rule:** Before greedy fill, reserve at least 1 slot for each neglected pillar (`pct < target × 0.6`). Reserve `min(1 task, 20% of net_capacity)` per neglected pillar before filling with other pillars.

---

### GAP-04 — Recurring Tasks Have No Instance Record
**Current behavior:** Recurring tasks are frequency-filtered via `isTaskDueToday()`. There is no `TaskInstance` record.  
**Problem:** Cannot track "scheduled 3×/week but completed 1×." The `alternate` frequency uses `createdAt` as the epoch — semantically wrong. A task created on a Tuesday should not alternate from Tuesday permanently.  
**Recommended rule:** Create `TaskInstance` records on plan generation. Instances own the status lifecycle. Enables: completion rate per task, scheduling history, smarter carryover decisions.

---

### GAP-05 — No Recovery From Paused Challenges
**Current behavior:** `status: 'paused'` exists in the Challenge schema but there is no resume API, no linked-task handling on pause, and no grace period for streaks.  
**Problem:** User pauses a 30-day streak challenge on day 22 to travel. On return, they cannot resume via UI. The linked task is still active and being scheduled. Streak sits at 22 indefinitely.  
**Recommended rule:** Pause deactivates linked task. Resume reactivates it. Travel `EventBlock` objects should auto-pause linked streak challenges and auto-resume when the block ends.

---

### GAP-06 — Queue Items Stuck in `in_progress` Without Check-In
**Current behavior:** `TopicItem.status = 'in_progress'` is set when surfaced in a plan. It is never automatically reverted.  
**Problem:** Trek day, no plan generated or no check-in submitted → item stays `in_progress` indefinitely. The next day's plan generation finds a different "next pending" item, and the in-progress item is orphaned.  
**Recommended rule:** Midnight cron reverts `in_progress` topic items that have no corresponding `done` DayLog entry for that date back to `pending`.

---

### GAP-07 — Neglected Pillar Threshold Is a Magic Number
**Current behavior:** [`checkin/route.ts` lines 122–124](file:///c:/Users/user/Desktop/Project/LifeOS/app/api/log/checkin/route.ts#L122-L124) hardcodes `< 0.15` (15%) as the neglected threshold.  
**Problem:** Completely ignores `UserSettings.pillar_balance_target`. A user targeting 40/30/30 should see `money` neglected when it drops below 30%, not 15%.  
**Recommended rule:** `neglected_if(pct < target_pct × 0.6)`. Pull from `userSettings.pillar_balance_target` on every check-in.

---

## D. State Machines

### D1. Task (Definition Level)

```
[ACTIVE] ──── user deactivates ────► [INACTIVE]
                                     (hidden from plans, kept in history)

Note: The Task definition never expires.
Instances (PlanEntries) are what expire. The Task is a template.
```

---

### D2. Plan Entry — RECOMMENDED Lifecycle

```
               ┌─────────────────────────────────────┐
               ▼                                       │ plan regenerated
         [PLANNED]                                     │
    (in generated plan, user has not interacted)       │
               │                                       │
      midnight │ no user interaction                   │
               ▼                                       │
          [EXPIRED] ◄── user dismissed mid-day         │
               │                                       │
               ├──► [CARRIED_OVER] ──► next day plan   │
               └──► [DEFERRED]     ──► not this week   │
                                                       │
         [PLANNED]                                     │
               │ user taps "Mark Started"              │
               ▼                                       │
        [IN_PROGRESS]                                  │
               │                                       │
     check-in  │                                       │
    ┌──────────┼──────────┐                            │
    ▼          ▼          ▼                            │
 [DONE]    [PARTIAL]  [SKIPPED]                        │
                │          │                           │
           (revisable)  event-caused?                  │
                │          │                           │
           [revision]  [DISPLACED] ──► replanned       │
```

---

### D3. Daily Plan Lifecycle

```
[DRAFT] ◄── user regenerates
    │
    │ user locks (confirms plan)
    ▼
[ACTIVE]
    │
    │ midnight
    ├──► [COMPLETED]  (all entries have been resolved: done/partial/skipped)
    └──► [CLOSED]     (midnight forced close; remaining pending → expired)

[PAUSED] (spontaneous event mid-day; Some tasks displaced)
    └──── event cleared or resolved ──► [ACTIVE]
```

---

### D4. Challenge Lifecycle

```
[LIBRARY]  (pre-seeded, not yet accepted by user)
    │ user accepts challenge
    ▼
 [ACTIVE] ◄─────────────────── user resumes
    │
    ├──── travel/rest event ──────► [PAUSED]
    │                                   │
    │                               event ends ──► [ACTIVE]
    │
    ├──── user drops challenge ──────► [DROPPED]
    │
    └──── total_completed >= target_value ──► [COMPLETED]

Note: Streak reset ≠ status change.
      Streak resets from (N) to 0 or 1 happen WITHIN [ACTIVE] state.
      A failed streak does NOT change challenge status to DROPPED or FAILED.

Missing: [ARCHIVED] — challenge that was never completed and user never
         formally dropped it. Needs a TTL-based or manual archive path.
```

---

### D5. Topic Item Lifecycle

```
[PENDING] (in queue, waiting to be surfaced)
    │ plan generation selects it as next item
    ▼
[IN_PROGRESS]  ← only ONE item per queue can be in_progress at a time
    │
    │ check-in
    ├──── status: done ──────► [COVERED]
    │                              │ revision=true?
    │                              ▼
    │                         [REVISION_DUE] ──── revision done ──► [COVERED]
    │
    └──── status: skipped/partial ──► skip_count++, requeue at end
                                       │
                                       ▼
                                   [PENDING]  (lower order = later in queue)

Missing: Midnight revert of [IN_PROGRESS] → [PENDING] if no check-in submitted.
```

---

### D6. Revision Item (RevisionQueue) Lifecycle

```
[PENDING_REVISION]  (next_revision ≤ today)
    │ plan surfaces item as a pseudo-task
    │
    │ check-in: done
    ▼
cycle_index < DEFAULT_CYCLE.length (4)?
    YES ──► [PENDING_REVISION]  next_revision = today + cycle[cycle_index]
                                cycle_index += 1
    NO  ──► [MASTERED]          stays in DB but next_revision not updated;
                                never re-queued by getRevisionsDue()

check-in: skipped/partial
    └──► next_revision += 1 day  (stays PENDING_REVISION)

Missing: explicit `status` field. Mastery currently inferred by checking
         cycle_index against a hardcoded constant (4).
```

---

## E. Data Model Changes

### E1. `IPlanEntry.status` — Add Missing States

**Current:**
```typescript
status: 'pending' | 'done' | 'partial' | 'skipped'
```
**Problem:** Cannot distinguish untouched from in-progress from event-displaced.

**Recommended:**
```typescript
status: 'planned' | 'in_progress' | 'done' | 'partial' | 'skipped' | 'expired' | 'displaced'
// 'planned'     = in generated plan; user has not interacted
// 'in_progress' = user tapped "Mark Started" mid-day
// 'done'        = user logged done in check-in
// 'partial'     = user logged partial in check-in
// 'skipped'     = user logged skipped in check-in
// 'expired'     = midnight crossed without user interaction
// 'displaced'   = removed by event handler
```

---

### E2. `IDayLog` — Add Submission Guard

**Problem:** No idempotency. Double-submission corrupts challenge/revision/pillar state.

**Add to DayLog schema:**
```typescript
is_submitted: { type: Boolean, default: false },
submitted_at: { type: Date }
```

**Guard in `/api/log/checkin`:**
```typescript
const dayLog = await DayLog.findOne({ date });
if (dayLog?.is_submitted) {
  return NextResponse.json(
    { error: 'Check-in already submitted for this date', code: 'ALREADY_SUBMITTED' },
    { status: 409 }
  );
}
```

---

### E3. `IDailyPlan` — Separate `displaced_tasks` from `skipped_tasks`

**Current:**
```typescript
skipped_tasks: Types.ObjectId[]  // used for both AI overflow AND event displacement
```
**Problem:** Cannot distinguish "AI couldn't fit it" from "event blocked it." Carryover logic treats both the same.

**Recommended:**
```typescript
skipped_tasks: Types.ObjectId[];    // AI could not fit into plan — candidate for carryover
displaced_tasks: Types.ObjectId[];  // event-caused displacement — candidate for rescheduling
```

---

### E4. `IDailyPlan` — Add Capacity Metrics

**Problem:** No record of available vs scheduled minutes. Cannot retrospectively audit over-scheduling.

**Add:**
```typescript
gross_capacity_minutes: { type: Number },  // sum of raw slot durations
net_capacity_minutes: { type: Number },    // gross minus overhead_budget
scheduled_minutes: { type: Number },       // sum of all plan entry durations
```

---

### E5. `IDailyPlan` — Replace Boolean Flags with `plan_status`

**Current:** `locked: boolean` and `paused: boolean` — two independent booleans with ambiguous combined meaning.

**Recommended:**
```typescript
plan_status: {
  type: String,
  enum: ['draft', 'active', 'completed', 'closed'],
  default: 'draft'
}
// draft     = generated, editable by user
// active    = locked by user; executing
// completed = all plan entries resolved (done/partial/skipped)
// closed    = midnight cron forced close; unresolved entries → expired
```

---

### E6. `IRevisionQueue` — Add Explicit `status` Field

**Problem:** Mastery currently inferred by checking `cycle_index >= DEFAULT_CYCLE.length` — a magic number coupling. Cannot query efficiently.

**Add:**
```typescript
status: {
  type: String,
  enum: ['active', 'mastered', 'paused'],
  default: 'active'
}
// active   = still in revision cycle, next_revision date will be set
// mastered = cycle exhausted; stays in DB for historical record
// paused   = user or system paused (e.g. linked task deactivated)
```

---

### E7. `ITask` — Add `last_scheduled_on`

**Problem:** The `alternate` frequency in [`contextCollector.ts`](file:///c:/Users/user/Desktop/Project/LifeOS/lib/scheduler/contextCollector.ts) uses `createdAt` as the epoch for alternating days. This is semantically wrong — a task created on a Tuesday would always alternate from Tuesday, not from when it was first actually scheduled.

**Add:**
```typescript
last_scheduled_on: { type: String }  // YYYY-MM-DD — updated when included in any plan
```

---

## F. Scheduling Architecture

### Current Architecture (Actual, As Built)

```
User Request: POST /api/plan/generate
     │
     ▼
CHECK locked flag (findOne, NOT atomic)
     │
     ▼
collectPlanContext()
  ├─ slotCalculator.ts    [ISSUE: timezone mixing]
  ├─ carryover fetch      [ISSUE: no duration cap, no expiry concept]
  ├─ revisionEngine       [ISSUE: uses new Date() not targetDate]
  └─ queueCandidates      [ISSUE: injected with 00:00 placeholder times]
     │
     ▼
generateAndParsePlan()  [AI path — primary]
  ├─ buildPrompt()       [ISSUE: sends ISO timestamps, not clean strings]
  │                      [ISSUE: task._id not .toString()]
  │                      [ISSUE: max_tokens: 2000 too low]
  ├─ Zod validation      [ISSUE: task_id required; topic_item_id absent]
  └─ No business validation (hallucinated IDs accepted silently)
     │ FAIL (any Zod error → fallback)
     ▼
generatePlan()  [Rule-based fallback]
  ├─ Greedy fill         [ISSUE: no pillar minimum enforcement]
  ├─ 100% capacity used  [ISSUE: no overhead budget]
  └─ Queue topics        [ISSUE: time_start: '00:00']
     │
     ▼
findOneAndUpdate upsert  [ISSUE: no race protection — concurrent requests both write]
```

---

### Recommended Architecture (Target State)

```
User Request: POST /api/plan/generate
     │
[1] DATE RESOLUTION  (deterministic)
    └─ Resolve user's local date using UserSettings.timezone
       Reject dates > 1 day in the past with clear error message
     │
[2] CONFLICT DETECTION  (atomic, before any expensive work)
    ├─ Reject if plan.plan_status === 'active' (locked) → PLAN_LOCKED
    └─ Set generating=true atomically; reject if already generating → GENERATION_IN_PROGRESS
     │
[3] CAPACITY ENGINE  (deterministic)
    ├─ gross_capacity = sum of slot durations (timezone-correct slotCalculator)
    ├─ overhead = UserSettings.overhead_budget_minutes (default: 30)
    └─ net_capacity = gross - overhead
       Abort if net_capacity < 30 min → INSUFFICIENT_CAPACITY
     │
[4] CONSTRAINT ENGINE  (deterministic, NEVER AI)
    ├─ Hard constraints: event blocks, available windows, sleep boundary
    ├─ Carryover: max(3 tasks OR net_capacity × 30%, whichever is lower minutes)
    ├─ Revision cap: max DAILY_REVISION_CAP (3)
    ├─ Pillar reservation: 1 slot per neglected pillar before greedy fill
    └─ Frequency-aware task filtering (isTaskDueToday with timezone-correct date)
     │
[5] AI PLANNER  (optional — graceful degradation to step 6 on failure)
    ├─ Receives: net_capacity (not gross), pillar_balance_target, clean slot strings
    ├─ Receives: task IDs as .toString() strings (not ObjectId objects)
    ├─ Returns: discriminated union entries (task OR queue_topic)
    └─ Temperature: 0.3 for scheduling consistency
     │
[6] SCHEMA VALIDATION  (Zod discriminated union)
    ├─ 'task' entries: require task_id, time_start/end in HH:MM format
    ├─ 'queue_topic' entries: require topic_item_id, time_start/end in HH:MM format
    └─ Cross-field: time_end > time_start
     │
[7] BUSINESS VALIDATION  (deterministic)
    ├─ All task_id values → verified to exist in tasks collection
    ├─ All topic_item_id values → verified to exist in topic_items collection
    ├─ No time overlaps between any two entries
    ├─ All times fall within net_capacity windows
    ├─ Total scheduled_minutes ≤ net_capacity
    └─ Pillar minimums met; if not, inject from neglected pillar (deterministic)
     │
[8] PERSISTENCE  (atomic)
    ├─ findOneAndUpdate with generation lock release in same operation
    ├─ Record: gross_capacity_minutes, net_capacity_minutes, scheduled_minutes
    ├─ Set: plan_status = 'draft', source = 'ai' | 'rule_based'
    └─ Set: generating = false
```

**What is ALWAYS deterministic (NEVER delegated to AI):**
- Slot calculation and timezone handling
- Carryover selection and duration cap
- Revision cap and deferral
- Pillar minimum enforcement (floor guarantee)
- Capacity calculation and overhead subtraction
- Hard constraint enforcement (event blocks, sleep windows)
- Time overlap detection
- DB-level ID validation

**What AI does (and can be disabled without breaking the system):**
- Ordering of tasks within capacity constraints
- Selecting optimal recharge breaks from the recharge menu
- Context-aware sequencing (high energy → morning; low energy → evening)
- Generating `ai_note` for the overall day
- Generating per-task `reason` explaining scheduling decisions
- Queue topic selection when multiple queues are eligible and capacity allows
