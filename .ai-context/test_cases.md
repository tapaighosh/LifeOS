# LifeOS — Master Test Cases

## Module 0: Project Setup
- [ ] Next.js app starts without errors (`npm run dev`)
- [ ] MongoDB connection succeeds (Atlas and local)
- [ ] NextAuth session works with credentials provider
- [ ] Environment variables validated at startup (fail fast if missing)
- [ ] Tailwind CSS loads and renders correctly

## Module 1: Task CRUD

### 1.1 Create Task
- [ ] Create task with all required fields → success
- [ ] Create task without required field (title) → 400 error
- [ ] Create task with invalid pillar → 400 error
- [ ] Create task with invalid duration (25 min) → 400 error
- [ ] Create task with energy_cost not in enum → 400 error
- [ ] Create recharge task with duration > 15 min → 400 error
- [ ] Create project task with subtasks (max 2 levels) → success

### 1.2 Read Tasks
- [ ] List all active tasks → returns only active=true
- [ ] List tasks filtered by pillar → correct filter
- [ ] List tasks filtered by type → correct filter
- [ ] Empty task list → returns empty array, not error

### 1.3 Update Task
- [ ] Update task title → success
- [ ] Update task pillar → success
- [ ] Update non-existent task → 404 error
- [ ] Mark task as inactive → soft delete works

### 1.4 Delete Task
- [ ] Soft delete task → active set to false
- [ ] Deleted task hidden from list → confirmed
- [ ] Deleted task kept in history → confirmed

## Module 2: Recharge Library

### 2.1 Recharge Items
- [ ] Create recharge item → success
- [ ] Create with duration > 15 min → 400 error
- [ ] Mark as favourite → success
- [ ] List only active items → correct filter
- [ ] Default suggestions populated on first setup → 7 items

## Module 3: User Settings

### 3.1 Settings CRUD
- [ ] Get settings → returns current values
- [ ] Update wake_time → success
- [ ] Update with invalid timezone → 400 error
- [ ] Update pillar_balance_target → totals must equal 100

## Module 4: Daily Plan Generation

### 4.1 Context Collection
- [ ] Fetch incomplete tasks from last 3 days → correct results
- [ ] Fetch today's recurring tasks by frequency → correct day matching
- [ ] Fetch revision queue due today → correct dates
- [ ] Fetch last 7 days energy ratings → correct history
- [ ] Calculate pillar balance for the week → correct percentages
- [ ] Calculate available slots from wake/leave/return/sleep times → correct math

### 4.2 Plan Generation (Rule-Based)
- [ ] Generate plan for normal day → fills morning + evening windows
- [ ] Morning window gets high-energy tasks → confirmed
- [ ] Evening window gets low/medium energy tasks → confirmed
- [ ] At least 1 recharge block per window → confirmed
- [ ] Total scheduled time ≤ available slot time → no overflow
- [ ] Incomplete tasks from yesterday included → max 3 carryovers

### 4.3 Plan Display
- [ ] Plan renders as time-blocked list → correct format
- [ ] Drag-to-reorder works → order saved
- [ ] Lock plan → locked=true, no further edits

## Module 5: Night Check-In

### 5.1 Check-In Submission
- [ ] Mark all tasks as done → success
- [ ] Mark task as partial with 50% → success
- [ ] Mark task as skipped with reason → success
- [ ] Energy rating required → 400 if missing
- [ ] Reflection optional → success without it
- [ ] Reflection > 200 chars → 400 error

### 5.2 AI Insight
- [ ] AI generates 2-line insight → displayed
- [ ] AI failure → check-in still saves, insight = null
- [ ] Tomorrow preview shows top 3 tasks → correct

## Module 6: Event Blocks

### 6.1 Spontaneous Events
- [ ] Add trek (full day) → all tasks paused
- [ ] Add travel (multi-day) → prep task auto-added 2 days before
- [ ] Add bike ride (half day) → only affected slot cleared
- [ ] Add cooking experiment (evening) → evening tasks displaced
- [ ] Add rest day → all non-essential tasks stripped
- [ ] Custom event with user-defined duration → success

### 6.2 Rescheduling
- [ ] Displaced recurring tasks distributed across next 3 days → confirmed
- [ ] One-time tasks pushed by 1 day → confirmed
- [ ] One-time task still incomplete after push → flagged
- [ ] Revision tasks rescheduled to nearest valid window → confirmed
- [ ] Recharge tasks NOT rescheduled (regenerate daily) → confirmed

## Module 7: AI Integration (Claude/Gemini)

### 7.1 Claude API
- [ ] Claude returns valid JSON → plan saved with source="ai"
- [ ] Claude returns malformed JSON → retry once, then fallback
- [ ] Claude timeout (>30s) → fallback to Gemini
- [ ] Claude rate limited (429) → switch to Gemini

### 7.2 Gemini Fallback
- [ ] Gemini used when Claude fails → success
- [ ] Gemini also fails → rule-based fallback
- [ ] User notified of plan source → toast message

### 7.3 AI Rules Enforcement
- [ ] AI inserts at least 1 recharge per window → validated
- [ ] AI starts morning with highest energy task → validated
- [ ] AI never schedules high energy in last 30 min → validated
- [ ] AI balances pillars → neglected pillar gets priority
- [ ] Total time ≤ available slots → no overflow

## Module 8: Spaced Repetition

### 8.1 Revision Tracking
- [ ] Task marked revision=true → enters revision queue
- [ ] Revision cycle [1, 3, 7, 14] days → correct scheduling
- [ ] Missed revision stays in queue → does not disappear
- [ ] Revision queue > 5 today → capped at 3, others deferred

### 8.2 Revision Tasks
- [ ] Lightweight revision created: "Revise: [title]" → 15-20 min, low energy
- [ ] Completed revision advances cycle_index → next interval calculated

## Module 9: Weekly Review

### 9.1 Review Data
- [ ] Pillar balance chart (% per pillar) → correct math
- [ ] Completion rate for week → correct percentage
- [ ] Longest streak per pillar → correct count
- [ ] Energy trend (avg per day) → correct average
- [ ] Recharge block compliance → correct ratio

### 9.2 AI Weekly Summary
- [ ] AI generates 1 observation + 1 recommendation → displayed
- [ ] AI failure → review still shows data, paragraph = null

## Module 10: PWA & Polish (Phase 5)

### 10.1 PWA
- [ ] Service worker registers → app installable
- [ ] Push notification (morning) → fires at configured time
- [ ] Push notification (night) → fires at 9:30 PM

## Cross-Cutting Edge Cases (BRD Section 8)

| Scenario | Expected Handling |
|----------|------------------|
| Claude + Gemini both down | Rule-based fallback, toast notification |
| Woke up late | User inputs actual wake time, slots recalculated |
| All 3 days incomplete tasks | AI capped at 3 carryovers, rest deferred to next week |
| No tasks in a pillar | Warning on dashboard, prompt to add tasks |
| Spontaneous event same morning | "Something came up" regenerates evening only |
| Revision queue > 5 today | Cap at 3, defer others by 1 day |
| MongoDB write fail | Retry 3x, then localStorage fallback, sync on next load |
| Energy rated 1 for 3 days | AI strips high-energy tasks, suggests rest day |
| Travel multi-day | All days blocked, recurring paused, prep task auto-created |
