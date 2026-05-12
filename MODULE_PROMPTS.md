# LifeOS — Step-by-Step Module Prompts

> **How to use this file:**
> Run each prompt one at a time, in order. After each prompt completes, **read
> the generated code**, ask questions, and verify the output before moving to the next.
>
> Each section tells you:
> - 🎯 **What it does** — the goal of this step
> - 🧠 **What you'll learn** — concepts and patterns
> - 📁 **Files involved** — what gets created or changed
> - ✅ **How to verify** — how to confirm it worked
> - 💬 **The prompt** — exactly what to paste

---

## Before You Start — How to Give Context

Every time you start a **new conversation**, paste this at the top:

```
I'm building LifeOS — a personal AI-powered life operating system.

Tech stack:
- Framework: Next.js 14 (App Router), TypeScript
- Database: MongoDB (Mongoose)
- AI: Claude API (primary) + Gemini (fallback) + rule-based scheduler
- Auth: NextAuth.js (credentials provider)
- Styling: Tailwind CSS v3
- State: Zustand (client) + SWR (server)

Refer to these files for context:
- .ai-context/project_context.md — product overview
- .ai-context/architecture.md — DB schema, API routes, AI layer
- .ai-context/test_cases.md — test scenarios
- .agents/rules/production-standards.md — coding standards

Follow the /module-implement workflow for all implementations.
```

---

## Module 0 — Project Setup & Scaffolding

### 🎯 What it does
Creates the Next.js 14 project, connects MongoDB, sets up NextAuth, Tailwind, and the full folder structure.

### 🧠 What you'll learn
- Next.js 14 App Router project structure
- MongoDB connection singleton with Mongoose
- NextAuth.js credentials provider setup
- Tailwind CSS v3 configuration with custom design tokens
- Zustand + SWR setup
- Environment variable validation with Zod

### 📁 Files involved
- `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`
- `app/layout.tsx`, `app/page.tsx`, `middleware.ts`
- `lib/db/mongoose.ts` — MongoDB connection
- `lib/errors.ts` — Custom error classes
- `lib/validators/env.ts` — Environment validation
- `models/` — All 7 Mongoose models (stubs)
- `components/ui/` — Base UI components
- `.env.example`

### ✅ How to verify
```bash
npm run dev
# Open http://localhost:3000 — should see landing page
# Check terminal — MongoDB connection logged
```

### 💬 The Prompt

```
Implement Module 0 — Project Setup & Scaffolding

Follow the /module-implement workflow. Read .ai-context/architecture.md for the
full project structure and .ai-context/project_context.md for the tech stack.

1. Initialize Next.js 14 project with App Router:
   - Use TypeScript strict mode
   - Set up Tailwind CSS v3 with custom config:
     * Custom colors: pillar-money (amber/gold), pillar-soul (rose/warm),
       pillar-curiosity (blue/indigo), recharge (emerald/green)
     * Dark mode (class-based)
     * Custom fonts (Inter from Google Fonts)
   - Configure path aliases: @/components, @/lib, @/models, @/hooks, @/stores

2. Set up MongoDB connection in lib/db/mongoose.ts:
   - Global connection singleton (reuse across hot reloads)
   - Support both Atlas URI and local MongoDB via MONGODB_URI env var
   - Graceful error handling with retry

3. Create all 7 Mongoose models as stubs in /models/:
   - Task.ts, DailyPlan.ts, DayLog.ts, EventBlock.ts, RechargeItem.ts,
     RevisionQueue.ts, UserSettings.ts
   - Each with full schema from .ai-context/architecture.md
   - Include TypeScript interfaces alongside schemas
   - Add indexes on frequently queried fields

4. Set up NextAuth.js with credentials provider:
   - Single user auth (hardcoded credentials for now)
   - JWT session strategy, 7-day expiry
   - Protect all routes via middleware.ts (except /api/auth)

5. Create lib/errors.ts with custom error classes:
   - AppError, ValidationError, NotFoundError, AIServiceError, DatabaseError

6. Create lib/validators/env.ts:
   - Zod schema to validate all env vars at startup
   - Fail fast with clear error messages if required vars are missing

7. Set up base UI components in components/ui/:
   - Button, Card, Modal, Toast, Skeleton, Badge
   - Use Tailwind + dark mode support
   - Premium design feel — glassmorphism cards, subtle gradients, smooth animations

8. Create app/layout.tsx with:
   - NextAuth SessionProvider
   - Global styles, font loading
   - Dark mode by default

9. Create app/page.tsx as landing/redirect:
   - If authenticated → redirect to /dashboard
   - If not → show login screen

10. Create .env.example with all required variables documented

The design should feel premium — dark mode, subtle gradients, glassmorphism,
smooth animations. Use the pillar color system throughout.
Explain each file so I understand what it does and why.
```

---

## Module 1 — Task CRUD & Master List

### 🎯 What it does
Full task management: create, read, update, soft-delete tasks with all BRD fields.

### 🧠 What you'll learn
- Mongoose CRUD operations with TypeScript
- Zod validation for complex schemas (enums, conditional fields)
- Next.js API Route Handlers (GET, POST, PATCH, DELETE)
- React form state management with Zustand
- SWR data fetching with optimistic updates

### 📁 Files involved
- `models/Task.ts` — full implementation
- `lib/validators/task.ts` — Zod schemas
- `app/api/tasks/route.ts` — GET (list), POST (create)
- `app/api/tasks/[id]/route.ts` — PATCH (update), DELETE (soft delete)
- `app/tasks/page.tsx` — Task management page
- `components/tasks/TaskForm.tsx`, `TaskCard.tsx`, `TaskList.tsx`, `TaskFilters.tsx`
- `hooks/useTasks.ts` — SWR hook
- `tests/api/test-tasks.ts`

### ✅ How to verify
```bash
npm run dev
# Navigate to /tasks
# Create a task → appears in list
# Edit a task → changes saved
# Delete a task → disappears from list (still in DB with active=false)
```

### 💬 The Prompt

```
Implement Module 1 — Task CRUD & Master List

Follow /module-implement. Refer to .ai-context/architecture.md for the Task
schema and .ai-context/test_cases.md Section 1.

1. Complete models/Task.ts with full schema from BRD:
   - All fields: title, pillar, category, type, duration, energy_cost,
     slot_preference, frequency, revision, revision_cycle, priority, notes, active
   - Enums: pillar (money|soul|curiosity), type (recurring|one-time|project|recharge),
     energy_cost (high|medium|low), slot_preference (morning|evening|any)
   - Validation: recharge tasks must have duration <= 15
   - Indexes on: pillar, active, type, priority

2. Create lib/validators/task.ts with Zod schemas:
   - taskCreateSchema — all required fields validated
   - taskUpdateSchema — partial update (all fields optional)
   - Conditional validation: if type=recharge, duration must be <= 15

3. Create API routes:
   - GET /api/tasks — list all active tasks, support filter by pillar and type
   - POST /api/tasks — create task with Zod validation
   - PATCH /api/tasks/[id] — update task fields
   - DELETE /api/tasks/[id] — soft delete (set active=false)
   - All routes protected via NextAuth session check

4. Create the Task Management UI:
   - app/tasks/page.tsx — main page with task list + add button
   - TaskForm.tsx — modal form for create/edit with all fields
   - TaskCard.tsx — displays task with pillar badge, duration, energy indicator
   - TaskList.tsx — grouped by pillar or flat list (toggle)
   - TaskFilters.tsx — filter by pillar, type, energy level
   - Use pillar colors: Money=amber, Soul=rose, Curiosity=blue

5. Create hooks/useTasks.ts — SWR hook with CRUD helpers

6. Create tests covering: create, list, update, delete, validation errors,
   recharge duration limit, filter by pillar.

Make the UI premium — glassmorphism cards, pillar-colored badges, hover animations.
Explain each file and the Zod validation approach.
```

---

## Module 2 — Recharge Library

### 🎯 What it does
Manages the personal recharge menu — activities the AI picks from when inserting breaks.

### 📁 Files involved
- `models/RechargeItem.ts`, `lib/validators/recharge.ts`
- `app/api/recharge/route.ts`, `app/api/recharge/[id]/route.ts`
- `components/plan/RechargeManager.tsx`

### 💬 The Prompt

```
Implement Module 2 — Recharge Library

Follow /module-implement. Refer to BRD Section 4.7 and test_cases.md Section 2.

1. Complete models/RechargeItem.ts: title, duration (max 15), favourite, active
2. Create Zod validators: duration must be <= 15 minutes
3. API routes: GET/POST /api/recharge, PATCH/DELETE /api/recharge/[id]
4. On first app setup, seed 7 default recharge suggestions from BRD:
   Morning stretch, Eyes closed rest, Short walk, Tea/coffee no-screen,
   Breathing exercise, Music listening, Journaling
5. Create RechargeManager.tsx component:
   - List with favourite toggle (star icon)
   - Add new recharge item form
   - Delete with confirmation
   - Emerald/green color theme for recharge items
6. Create tests: create, max duration validation, favourite toggle, list active only
```

---

## Module 3 — User Settings & Preferences

### 📁 Files involved
- `models/UserSettings.ts`, `lib/validators/settings.ts`
- `app/api/settings/route.ts`
- `app/settings/page.tsx`

### 💬 The Prompt

```
Implement Module 3 — User Settings & Preferences

Follow /module-implement. Refer to BRD Section 2 (User Profile) and Section 5.3.

1. Complete models/UserSettings.ts:
   - wake_time, sleep_time, leave_time, return_time (string "HH:MM")
   - notification_morning, notification_night (string "HH:MM")
   - timezone (string, default "Asia/Kolkata")
   - pillar_balance_target: { money: number, soul: number, curiosity: number }
     (must total 100)
2. Create Zod validators: time format validation, pillar target sum = 100
3. API routes: GET/PATCH /api/settings
4. Create settings page with:
   - Time preference section (wake, sleep, leave, return)
   - Notification time settings
   - Pillar balance sliders (3 sliders that total 100%)
   - Timezone selector
5. Auto-create default settings on first app load
6. Tests: get, update, invalid time format, pillar target not summing to 100
```

---

## Module 4 — Daily Plan Generation (Rule-Based)

### 🎯 What it does
The core scheduling engine — collects context, calculates time slots, generates a plan using rules (AI comes in Module 7).

### 📁 Files involved
- `lib/scheduler/slotCalculator.ts` — calculates available time windows
- `lib/scheduler/planGenerator.ts` — rule-based plan builder
- `lib/scheduler/contextCollector.ts` — gathers all planning inputs
- `app/api/plan/route.ts`, `app/api/plan/generate/route.ts`
- `app/dashboard/page.tsx` — morning view
- `components/plan/DayPlan.tsx`, `TaskBlock.tsx`, `RechargeBlock.tsx`, `PillarBadge.tsx`

### 💬 The Prompt

```
Implement Module 4 — Daily Plan Generation (Rule-Based)

Follow /module-implement. Refer to BRD Sections 4.2 and test_cases.md Section 4.
This module uses RULE-BASED scheduling only. AI integration comes in Module 7.

1. Create lib/scheduler/slotCalculator.ts:
   - calculateAvailableSlots(settings): compute morning window (wake→leave)
     and evening window (return→sleep)
   - Account for EventBlocks that reduce available time
   - Return: [{ start, end, duration, period: "morning"|"evening" }]

2. Create lib/scheduler/contextCollector.ts:
   - collectPlanContext(date): gather all inputs for plan generation:
     * Today's date and day of week
     * EventBlocks for today
     * Available slots from slotCalculator
     * Incomplete tasks from last 3 days (max 3 carryovers)
     * Today's recurring tasks (by frequency + day matching)
     * Revision queue due today (from RevisionQueue model)
     * Last 7 days energy ratings (from DayLog)
     * Pillar balance for the week (% of completed tasks per pillar)
     * Recharge menu (active RechargeItems)

3. Create lib/scheduler/planGenerator.ts (rule-based fallback):
   - generatePlan(context): build time-blocked schedule
   - Algorithm from BRD:
     a. Sort tasks: priority DESC, energy DESC (morning), energy ASC (evening)
     b. Fill morning window greedily
     c. Fill evening window with remaining
     d. Insert 1 recharge block at midpoint of each window
     e. Never schedule high energy in last 30 min of window
     f. Overflow → add to skipped_tasks with reason
   - Return: DailyPlan document with source="rule-based"

4. Create API routes:
   - POST /api/plan/generate — trigger plan generation, save to DB
   - GET /api/plan/today — fetch today's plan
   - PATCH /api/plan/reorder — save manual drag-reorder

5. Create the Dashboard (Morning View):
   - app/dashboard/page.tsx — "Good morning, Ty" + Generate My Day button
   - If plan exists: show time-blocked schedule
   - If not: single CTA button
   - DayPlan.tsx — full plan renderer
   - TaskBlock.tsx — individual task in plan (pillar-colored)
   - RechargeBlock.tsx — recharge entry (emerald themed)
   - PillarBadge.tsx — pillar indicator (💰🔥🧠)
   - Drag-to-reorder before locking
   - Show AI reasoning note (or "Rule-based plan" indicator)
   - Lock Plan button

6. Tests: slot calculation, plan generation with mixed priorities,
   recharge insertion, overflow handling, carryover cap at 3.

Premium UI — time blocks with pillar gradients, smooth drag animations,
glassmorphism plan card, responsive mobile layout.
```

---

## Module 5 — Night Check-In Flow

### 📁 Files involved
- `app/api/log/route.ts`, `app/checkin/page.tsx`
- `components/checkin/NightCheckin.tsx`, `TaskCheckbox.tsx`, `EnergyRater.tsx`

### 💬 The Prompt

```
Implement Module 5 — Night Check-In Flow

Follow /module-implement. Refer to BRD Section 4.4 and test_cases.md Section 5.

1. Create API routes:
   - POST /api/log/checkin — submit check-in with entries, energy rating, reflection
   - GET /api/log/[date] — fetch a past log
   - Validate: energy_rating required (1-5), reflection max 200 chars
   - For each entry: status (done|partial|skipped), completion_pct, skip_reason

2. On check-in submission:
   - Save DayLog document
   - Update revision queue (mark completed revisions, advance cycle)
   - Flag neglected pillars (calculate weekly balance)
   - Generate tomorrow preview (top 3 tasks)
   - AI insight deferred to Module 7 (for now return null)

3. Create the Check-In Page (app/checkin/page.tsx):
   - Show today's plan as a checklist
   - Each task: Done / Partial / Skipped toggle
   - Partial: slider for % completion (25/50/75)
   - Skipped: optional reason dropdown (tired/no time/forgot/spontaneous)
   - Energy rating: 1-5 tap (emoji-based, mandatory)
   - Reflection textarea (optional, max 200 chars, char counter)
   - Submit button with loading state

4. After submit, show:
   - AI insight placeholder ("Insight will be available after Module 7")
   - Tomorrow preview: top 3 tasks
   - Completion summary with pillar breakdown

5. Trigger check-in page after 9:00 PM (notification badge in nav)

6. Tests: submit with all done, partial completion, skipped with reason,
   missing energy rating error, reflection over 200 chars error.
```

---

## Module 6 — Event Blocks & Calendar

### 💬 The Prompt

```
Implement Module 6 — Event Blocks & Calendar

Follow /module-implement. Refer to BRD Sections 4.3 and test_cases.md Section 6.

1. Complete models/EventBlock.ts with all types:
   trek (full day), travel (multi-day), bike_ride (half/full),
   cooking_exp (evening only), rest_day (non-essential stripped), custom

2. API routes: GET/POST /api/events, DELETE /api/events/[id]

3. Create lib/events/rescheduleHandler.ts:
   - When a spontaneous event is added:
     a. Displaced recurring tasks → distribute across next 3 available days
     b. One-time tasks → push by 1 day, flag if still incomplete
     c. Revision tasks → reschedule to nearest valid window
     d. Recharge tasks → NOT rescheduled (regenerate daily)
   - Travel: auto-create prep task 2 days before

4. Create Calendar page (app/calendar/page.tsx):
   - Monthly grid showing blocked dates
   - EventCard.tsx — displays event with type icon and impact badge
   - EventForm.tsx — add event with type, dates, impact
   - "Something came up" quick-add button

5. Update plan generator: skip blocked slots when events exist

6. Tests: add trek (full day block), travel (multi-day + prep task),
   rescheduling logic for each task type.
```

---

## Module 7 — AI Integration (Claude + Gemini)

### 🎯 What it does
Replaces the rule-based scheduler with Claude AI plan generation, adds Gemini fallback, and implements night reflection insights.

### 💬 The Prompt

```
Implement Module 7 — AI Integration (Claude + Gemini)

Follow /module-implement. Refer to BRD Section 5.5 and test_cases.md Section 7.

1. Create lib/ai/modelSelector.ts:
   - Read AI_PROVIDER env var: claude | gemini | claude-dev | gemini-dev
   - Primary model: claude-sonnet-4-20250514 or gemini-2.0-flash
   - Fallback chain: Primary → Fallback → Rule-based scheduler
   - Dev models: Claude Haiku, Gemini Flash (cheaper)

2. Create lib/ai/promptBuilder.ts:
   - buildMorningPrompt(context): assemble the structured prompt from BRD Section 5.5
   - System prompt: strict JSON-only instruction
   - User prompt: date, slots, energy history, pillar balance, tasks, recharge menu, rules
   - Temperature: 0.3 for planning

3. Create lib/ai/responseParser.ts:
   - Parse Claude/Gemini JSON response
   - Validate with Zod against DailyPlan schema
   - If invalid: retry once with stricter prompt
   - If retry fails: fall back to rule-based scheduler

4. Create lib/ai/insightBuilder.ts:
   - buildNightInsight(dayLog): prompt for 2-line reflection
   - Temperature: 0.7 for slightly creative responses
   - Fallback: return null (check-in still saves)

5. Create lib/ai/weeklyReview.ts:
   - buildWeeklyPrompt(weekData): prompt for 1 observation + 1 recommendation

6. Update POST /api/plan/generate:
   - Try AI generation first (via modelSelector)
   - Log: model used, tokens, latency, success/failure
   - Save plan with source="ai" or source="rule-based"
   - Return ai_note from model response

7. Update POST /api/log/checkin:
   - After saving log, call insightBuilder for AI insight
   - Save ai_insight to DayLog

8. Tests (mock AI responses):
   - Claude returns valid JSON → plan saved
   - Claude malformed → retry → fallback to Gemini
   - Both fail → rule-based, user notified
   - Night insight generated → saved
   - Night insight fails → check-in still works

Install: @anthropic-ai/sdk, @google/generative-ai
```

---

## Module 8 — Spaced Repetition System

### 💬 The Prompt

```
Implement Module 8 — Spaced Repetition System

Follow /module-implement. Refer to BRD Section 4.5 and test_cases.md Section 8.

1. Create lib/revision/revisionEngine.ts:
   - onTaskCompleted(task): if task.revision=true, create RevisionQueue entry
     * learned_on = today, next_revision = today + cycle[0] (1 day)
     * cycle = [1, 3, 7, 14]
   - getRevisionsDue(date): fetch all RevisionQueue where next_revision <= date
   - completeRevision(queueItem): advance cycle_index, calculate next date
   - missedRevision: stays in queue, does not disappear

2. Create lightweight revision tasks:
   - Title: "Revise: [original task title]"
   - Duration: 15-20 min, same pillar, low energy, any slot
   - Cap: max 3 revision tasks per day, defer extras by 1 day

3. Update contextCollector to include revision queue in planning context

4. Update plan generator to include revision tasks in the schedule

5. Update night check-in to mark completed revisions

6. Tests: task enters queue, cycle advances correctly, missed revision persists,
   daily cap at 3, deferred revisions reschedule correctly.
```

---

## Module 9 — Weekly Review & Insights

### 💬 The Prompt

```
Implement Module 9 — Weekly Review & Insights

Follow /module-implement. Refer to BRD Section 4.6 and test_cases.md Section 9.

1. Create API routes:
   - GET /api/insights/weekly — aggregated weekly data
   - GET /api/insights/pillars — pillar balance breakdown
   - GET /api/insights/energy — energy trend (7-day)

2. Create lib/insights/weeklyAggregator.ts:
   - Pillar balance: % of completed tasks per pillar
   - Completion rate for the week
   - Longest streak per pillar
   - Energy trend (average per day)
   - Recharge block compliance (scheduled vs completed)

3. Update lib/ai/weeklyReview.ts:
   - Pass aggregated data to AI
   - Get: 1 observation + 1 recommendation paragraph
   - Fallback: show data only, no AI paragraph

4. Create Insights page (app/insights/page.tsx):
   - PillarChart.tsx — 3-pillar balance visualization (bar or donut)
   - StreakBadge.tsx — streak counters per pillar
   - EnergyTrend.tsx — 7-day energy line/bar
   - WeekSummary.tsx — completion rate, recharge compliance
   - AI weekly paragraph (gradient card with "AI Generated" badge)
   - Option to adjust task frequencies based on learnings

5. Auto-surface on Sunday evening (highlight in nav)

6. Tests: correct aggregation math, AI paragraph generation,
   empty week handling, pillar with zero tasks warning.
```

---

## Module 10 — PWA, Notifications & Polish

### 💬 The Prompt

```
Implement Module 10 — PWA, Notifications & Deployment Polish

Follow /module-implement. Refer to BRD Phase 5.

1. PWA Setup:
   - Install next-pwa and configure in next.config.js
   - Create manifest.json with LifeOS branding
   - Service worker for offline capability
   - App installable on phone

2. Push Notifications:
   - Web Push API for morning reminder (configurable time)
   - Web Push API for night check-in (9:30 PM default)
   - Notification permission request on first visit

3. Performance Optimization:
   - Lazy-load non-critical components with React.lazy + Suspense
   - Optimize MongoDB queries (lean, select, proper indexes)
   - Add loading.tsx skeletons for all pages
   - Image optimization with next/image

4. Final Polish:
   - Run /code-review on all service files
   - Run /generate-tests for modules with < 80% coverage
   - Review all error boundaries
   - Mobile responsiveness audit (375px, 768px, 1024px)
   - Accessibility audit (keyboard nav, screen reader)

5. Deployment:
   - Verify Vercel deployment works
   - Set all production env vars
   - MongoDB Atlas IP whitelist for Vercel
   - Set NEXTAUTH_URL to production URL
   - Set AI_PROVIDER=claude for production
   - Test full flow on deployed URL

6. Update README.md with final deployment instructions
```

---

## Tips for Maximum Learning

### 🔄 After each prompt:
1. **Read every file** that was created or modified
2. **Ask "why?"** — e.g., *"Why does the plan generator sort by energy differently for morning vs evening?"*
3. **Test manually** — use the browser, check MongoDB data
4. **Run the tests** — `npm test` and understand what each test proves
5. **Break it intentionally** — change a value and see what happens

### 📝 Ask explanatory follow-ups like:
- *"Walk me through the plan generation flow from button click to rendered schedule"*
- *"Explain how the fallback chain works when Claude is down"*
- *"Why is the spaced repetition cycle [1, 3, 7, 14] and not linear?"*
- *"What happens if MongoDB is down when the morning plan is requested?"*

### 🎓 Concepts you'll master across all modules:

| Concept | Where you'll learn it |
|---------|----------------------|
| Next.js App Router | Module 0 |
| Mongoose CRUD | Modules 1, 2, 3 |
| Zod validation | Modules 1–3 |
| Server Components | Modules 0, 4 |
| Client Components | Modules 4, 5 |
| SWR data fetching | Modules 1, 4 |
| Zustand state | Modules 4, 5 |
| AI API integration | Module 7 |
| Prompt engineering | Module 7 |
| Fallback patterns | Module 7 |
| Spaced repetition | Module 8 |
| Data visualization | Module 9 |
| PWA + Push | Module 10 |
| Vercel deployment | Module 10 |

---

---

# LifeOS — Phase 2 Module Prompts

> **Phase 2 context block** — paste this at the top of any Phase 2 conversation:
>
> ```
> I'm building LifeOS — Phase 2. Phase 1 (Modules 0–10) is complete.
> The codebase has: Tasks, Recharge Library, Settings, Rule-based + AI Plan Generation,
> Night Check-In, Event Blocks, Spaced Repetition, Weekly Insights, PWA.
>
> Tech stack: Next.js 14 App Router, TypeScript, MongoDB/Mongoose, NextAuth,
> Tailwind CSS v3, Zustand, SWR, Claude API + Gemini fallback.
>
> Refer to: .ai-context/architecture.md, .ai-context/project_context.md,
> .agents/rules/production-standards.md, BRD_phase_2.md
>
> Follow the /module-implement workflow.
> ```

---

## Module P2-A — Challenge System

### 🎯 What it does
Adds a "Challenge" container above tasks — a 30/90-day personal commitment that generates
a recurring task and tracks streaks, progress, and completion automatically.

### 🧠 What you'll learn
- Additive Mongoose schema migrations (non-breaking field additions)
- Post-save side-effect hooks in API routes (vs Mongoose middleware)
- Static seed data patterns (library served from TS constant, not DB)
- Conditional business logic based on `target_type` (streak vs total_count vs milestone)

### 📁 Files involved
- `models/Task.ts` — add `challenge_id` field
- `models/Challenge.ts` — new model
- `lib/challenges/library.ts` — static pre-seeded library (~50 challenges)
- `lib/validators/challenge.ts` — Zod schemas
- `app/api/challenges/route.ts` — GET list
- `app/api/challenges/library/route.ts` — GET library
- `app/api/challenges/accept/route.ts` — POST accept → create task + challenge doc
- `app/api/challenges/[id]/route.ts` — PATCH (drop/pause/resume), GET detail
- `app/api/tasks/[id]/route.ts` — MODIFY: soft-delete guard
- `app/api/log/checkin/route.ts` — MODIFY: add progress hook
- `app/challenges/page.tsx` — new page (Active / Library / Completed tabs)
- `components/challenges/` — ChallengeCard, LibraryItem, LibraryFilter, AcceptDrawer, ProgressBar, MiniCard

### ✅ How to verify
```bash
# 1. Accept a challenge from the library
# 2. Check DB: challenges collection has new doc, tasks collection has linked task with challenge_id
# 3. Submit night check-in with that task marked done
# 4. Check DB: challenge.current_streak = 1, total_completed = 1
# 5. Skip it the next night → current_streak resets to 0
```

### 💬 The Prompt

```
Implement Module P2-A — Challenge System

Follow /module-implement. Read BRD_phase_2.md (lines 1–120) for full spec.
Read .ai-context/architecture.md for the existing schema.

IMPORTANT: The ONLY change to the existing Task model is adding one optional field.
Do NOT restructure any existing code. The challenge module is additive only.

═══ STEP 1 — Extend Task schema (models/Task.ts) ═══

Add to ITask interface and TaskSchema:
  challenge_id?: mongoose.Types.ObjectId | null   (default: null)
Add sparse index: TaskSchema.index({ challenge_id: 1 }, { sparse: true })
This is backward-compatible — all existing task documents are unaffected.

═══ STEP 2 — Create Challenge model (models/Challenge.ts) ═══

New Mongoose model, collection name "challenges":
  title: String required
  category: Enum ['physical','mental','financial','social','creative'] required
  description: String
  target_type: Enum ['streak','total_count','milestone'] required
  target_value: Number required (30, 12, 1, etc.)
  started_on: String (YYYY-MM-DD)
  status: Enum ['active','completed','dropped','paused'] default 'active'
  linked_task_id: { type: Schema.Types.ObjectId, ref: 'Task' }
  current_streak: Number default 0
  best_streak: Number default 0
  total_completed: Number default 0
  last_completed_on: String (YYYY-MM-DD)
  notes: String optional
Include TypeScript interface IChallenge.
Indexes: status, linked_task_id (unique sparse).

═══ STEP 3 — Library seed data (lib/challenges/library.ts) ═══

Create a TypeScript constant CHALLENGE_LIBRARY with ~50 challenges.
This is NOT seeded to the DB — the route returns it statically.
Cover all 5 categories (physical, mental, financial, social, creative).
Include all 3 target_types (streak, total_count, milestone).
Each entry has: id, title, category, description, target_type, target_value,
suggested_pillar, suggested_frequency, suggested_duration.
Use examples from BRD_phase_2.md lines 39–58 as the starting set, then author the rest.

═══ STEP 4 — Zod validators (lib/validators/challenge.ts) ═══

challengeAcceptSchema:
  library_id: string (references CHALLENGE_LIBRARY[].id)
  pillar: 'money' | 'soul' | 'curiosity'
  frequency?: 'daily' | 'alternate' | '3x_week' | 'weekly'  (optional override)

challengeUpdateSchema:
  status?: 'dropped' | 'paused' | 'active'
  notes?: string

═══ STEP 5 — API Routes ═══

GET /api/challenges
  - Return all challenges with status 'active' or 'completed', sorted by started_on DESC
  - Populate linked_task_id (title, active fields only)

GET /api/challenges/library
  - Return CHALLENGE_LIBRARY constant, optionally filtered by ?category=
  - Also indicate which ones the user has already accepted (cross-ref DB)

POST /api/challenges/accept
  Validate with challengeAcceptSchema.
  Find library item by library_id from CHALLENGE_LIBRARY.
  Create Task:
    title: library item title
    pillar: from payload
    type: 'recurring'
    duration: library item suggested_duration
    energy_cost: 'medium'
    slot_preference: 'any'
    frequency: payload.frequency || library item suggested_frequency
    active: true
    challenge_id: (will update after challenge created)
  Create Challenge document with linked_task_id = new task._id, started_on = today.
  Update task.challenge_id = challenge._id.
  Return { challenge, task }.

PATCH /api/challenges/[id]
  Validate with challengeUpdateSchema.
  If status = 'dropped': also set linked task active = false.
  If status = 'paused': do NOT deactivate the task (user may still do it manually).
  Return updated challenge.

GET /api/challenges/[id]
  Return challenge + populated task.

═══ STEP 6 — Night check-in hook (app/api/log/checkin/route.ts) ═══

After the existing DayLog save (after line that saves aiInsight), add:

For each entry in entries:
  1. Find challenge where linked_task_id === entry.task_id
  2. If no challenge found: skip
  3. If found and entry.status === 'done':
       - increment total_completed by 1
       - update last_completed_on = date (from check-in payload)
       - if target_type === 'streak':
           gap = days between last_completed_on (old) and today
           if gap === 1: increment current_streak by 1
           if gap > 1: reset current_streak to 1
           if current_streak > best_streak: update best_streak
       - if total_completed >= target_value: set status = 'completed'
       - save challenge
  4. If found and entry.status === 'skipped' and target_type === 'streak':
       - set current_streak = 0
       - save challenge
  5. If found and entry.status === 'partial' and target_type === 'streak':
       - set current_streak = 0 (partial does not maintain streak)
       - save challenge

═══ STEP 7 — Soft-delete guard (app/api/tasks/[id]/route.ts) ═══

In the DELETE handler, before setting active = false:
  Check: const linkedChallenge = await Challenge.findOne({ linked_task_id: id, status: 'active' })
  If found: set linkedChallenge.status = 'paused', save it.
  Continue with soft-delete regardless.
  Include in response: { paused_challenge: linkedChallenge?.title || null }

═══ STEP 8 — Challenge UI ═══

app/challenges/page.tsx:
  Server component, auth-protected.
  Fetch active challenges from /api/challenges.
  Render 3 tabs: Active | Library | Completed.
  Each tab is a separate client component.

components/challenges/ChallengeCard.tsx:
  Props: challenge object.
  Show: title, category badge, progress bar, streak info, last completed date.
  Progress bar logic:
    streak/total_count: (total_completed / target_value) * 100
    milestone: 0% or 100%
  Category colors: physical=rose, mental=indigo, financial=amber, social=emerald, creative=purple.
  Streak display (streak type only): "🔥 Streak: 14 days  Best: 14 days"

components/challenges/ChallengeLibraryItem.tsx:
  Props: library item + isAlreadyAccepted boolean.
  Show: title, category badge, description, target_value + type summary.
  "Accept Challenge" button → opens AcceptChallengeDrawer.
  If already accepted: show "Active" badge instead of button.

components/challenges/AcceptChallengeDrawer.tsx:
  Slide-up drawer.
  Fields: pillar selector (3 options), frequency override (optional).
  Confirm button → POST /api/challenges/accept → show success toast.

components/challenges/ChallengeMiniCard.tsx:
  Compact card for dashboard (max 3 shown).
  Show: title, progress bar, streak/count.
  Clicking → navigate to /challenges.

All challenge UI uses glassmorphism cards, category-appropriate colors, smooth hover transitions.

═══ STEP 9 — Tests (tests/api/challenges.test.ts) ═══

Test: accept challenge → task created with challenge_id
Test: night check-in done → streak increments
Test: night check-in skipped → streak resets (streak type)
Test: partial on streak challenge → streak resets
Test: total_completed >= target_value → status = 'completed'
Test: soft-delete task → challenge status = 'paused'
Test: library GET with category filter returns subset

Explain each file, why the library is a static constant not a DB seed, and
how the post-save hook pattern keeps the check-in route testable.
```

---

## Module P2-B — Responsive Navigation

### 🎯 What it does
Upgrades the existing mobile-only bottom nav to a responsive system:
bottom bar on mobile (<768px), left sidebar on desktop (≥768px).
Adds Challenges and Settings items.

### 📁 Files involved
- `components/layout/Navigation.tsx` — refactor for dual layout
- `app/layout.tsx` — add sidebar offset padding

### ✅ How to verify
```bash
# Mobile (375px): bottom nav with 6 items visible
# Desktop (1024px): left sidebar with icons + labels
# /challenges route: Challenges nav item shows active badge count
# Sunday after 5pm: Insights item pulses amber
```

### 💬 The Prompt

```
Implement Module P2-B — Responsive Navigation

Follow /module-implement.

CURRENT STATE: components/layout/Navigation.tsx renders a fixed bottom bar
with 5 items using Tailwind + Lucide icons. It works only on mobile.

WHAT TO BUILD:

1. Update nav items array — 6 items in this order:
   { name: 'Home',       href: '/dashboard',  icon: LayoutDashboard }
   { name: 'Tasks',      href: '/tasks',       icon: CheckSquare }
   { name: 'Challenges', href: '/challenges',  icon: Trophy }
   { name: 'Check-In',   href: '/checkin',     icon: Sparkles }
   { name: 'Insights',   href: '/insights',    icon: TrendingUp, highlight: isSundayEvening }
   { name: 'Settings',   href: '/settings',    icon: Settings2 }

2. Challenges badge: fetch active challenge count via SWR:
   const { data } = useSWR('/api/challenges', fetcher)
   Show a small dot/badge on the Challenges icon when data?.length > 0.

3. Sunday evening check fix: use setInterval every 60 seconds instead of
   running once on mount. Clear interval on unmount.

4. Render TWO layouts using Tailwind breakpoints:

   MOBILE (md:hidden) — keep existing bottom bar, just add the 2 new items.
   Style: fixed bottom-0, bg-zinc-950/80 backdrop-blur-xl, border-t border-zinc-800.
   Each item: flex-col, icon + label, active = indigo-400, inactive = zinc-500.

   DESKTOP (hidden md:flex) — new left sidebar:
   Style: fixed left-0 top-0 h-full w-16, bg-zinc-950/90 backdrop-blur-xl,
   border-r border-zinc-800, flex-col, items-center, py-6, gap-2, z-50.
   Each item: w-10 h-10 rounded-xl flex items-center justify-center.
   Active: bg-indigo-500/20 text-indigo-400 with left border indicator (w-0.5 bg-indigo-400).
   Inactive: text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300.
   Show icon only (no label) — tooltip on hover showing name (title attribute).
   Highlight item: text-amber-400 + subtle ring.

5. Update app/layout.tsx:
   Add class "md:pl-16" to the main content wrapper so content doesn't
   sit behind the sidebar on desktop.

Keep all existing mobile behavior exactly as-is. This is purely additive.
Explain the Tailwind breakpoint approach and why we use two separate render trees
instead of CSS transforms.
```

---

## Module P2-C — Time-Aware Dashboard

### 🎯 What it does
Replaces the static dashboard with three time-based views:
- **Morning** (<12pm): greeting, energy forecast, today's plan, challenge widget, pillar health
- **Midday** (12–9pm): today's plan + "Add to Today" drawer
- **Evening** (≥9pm): check-in CTA, today's summary, challenge wins, tomorrow preview

### 📁 Files involved
- `app/api/dashboard/morning/route.ts` — NEW aggregation route
- `app/api/dashboard/evening/route.ts` — NEW aggregation route
- `app/api/plan/add-task/route.ts` — NEW PATCH route
- `app/dashboard/page.tsx` — refactor to time-switch
- `components/dashboard/DashboardMorning.tsx` — NEW
- `components/dashboard/DashboardEvening.tsx` — NEW
- `components/dashboard/DashboardMidday.tsx` — NEW
- `components/dashboard/PillarHealthBar.tsx` — NEW
- `components/dashboard/TomorrowPreview.tsx` — NEW
- `components/dashboard/AddToTodayDrawer.tsx` — NEW

### ✅ How to verify
```bash
# Temporarily override new Date().getHours() to 8 → morning view renders
# Override to 14 → midday view renders
# Override to 22 → evening view renders
# Add to Today drawer: pick a task → appears in today's DailyPlan in DB
# Pillar health bar: shows correct task counts from this week's plans
```

### 💬 The Prompt

```
Implement Module P2-C — Time-Aware Dashboard

Follow /module-implement. Read BRD_phase_2.md (lines 122–235) for full spec.
Module P2-A (Challenges) must be complete before this module.

═══ STEP 1 — API: GET /api/dashboard/morning ═══

Single aggregation call returning:
  plan: today's DailyPlan (or null if not generated)
  activeChallenges: top 3 active challenges sorted by:
    streak challenges first, then total_count, then milestone
    each with current_streak, total_completed, target_value, target_type
  pillarWeek: {
    money: { count: number, target: number },
    soul:  { count: number, target: number },
    curiosity: { count: number, target: number }
  }
  — count = tasks with status='done' in daily_plans for the last 7 days
  — target = from UserSettings.pillar_balance_target (as % of total)
  energyForecast: average energy_rating from last 3 DayLogs (or null)

═══ STEP 2 — API: GET /api/dashboard/evening ═══

Returns:
  todaySummary: {
    totalScheduled: number,
    totalDone: number,
    totalSkipped: number,
    pillarBreakdown: { money: number, soul: number, curiosity: number }
  }
  challengeWins: challenges where linked_task appears in today's plan
    — { title, status ('done'|'skipped'|'pending'), current_streak }
  tomorrowPreview: top 3 tasks for tomorrow using priority sort
    (improved: respect frequency — daily tasks always qualify,
     alternate/weekly tasks qualify if they're due tomorrow)

═══ STEP 3 — API: PATCH /api/plan/add-task ═══

Body: { task_id: string, time_start: string, time_end: string }
  — Validate: task_id is an active Task
  — Find today's DailyPlan
  — If plan is locked: return 403 with message "Plan is locked"
  — Push new entry into plan.plan array with status='pending'
  — Return updated plan

═══ STEP 4 — Dashboard page refactor (app/dashboard/page.tsx) ═══

Convert to a Client Component ('use client') — time must be read in browser,
not on server (server time = UTC, user time = IST or local).

const hour = new Date().getHours()

Fetch data client-side:
  const { data: morningData } = useSWR('/api/dashboard/morning', fetcher)
  const { data: eveningData } = useSWR('/api/dashboard/evening', fetcher)

Render:
  if (hour < 12)  → <DashboardMorning data={morningData} />
  if (hour >= 21) → <DashboardEvening data={eveningData} />
  else            → <DashboardMidday />

═══ STEP 5 — Morning View (DashboardMorning.tsx) ═══

Layout (top to bottom):
  1. Greeting: "Good morning, [name]." + today's date
  2. Energy forecast card (if energyForecast exists):
     "Based on last 3 days: [low/moderate/high]"
     "Suggestion: Start with [highest-priority pillar] task"
  3. Today's Plan section:
     — If no plan: single "Generate My Day" button (large, prominent)
     — If plan exists: render time-blocked list (reuse existing DayPlan component)
     — Always show "+ Add to Today" button below the plan
  4. Active Challenges widget (if activeChallenges.length > 0):
     — Show max 3 ChallengeMiniCard components
     — "View all challenges" link → /challenges
     — If 0 active: "No active challenges. Pick one →" link
  5. Pillar Health Bars (PillarHealthBar component):
     — 3 bars: Money / Soul / Curiosity
     — Each bar: label, task count this week, fill % vs target
     — If a pillar is below 15% of total: show ⚠ indicator

═══ STEP 6 — Evening View (DashboardEvening.tsx) ═══

Layout:
  1. Greeting: "Good evening, [name]." + date
  2. Night Check-In CTA (large, prominent):
     — If check-in not done: "Start Check-In" button → /checkin
     — If already done: "Check-in complete ✓" (no button)
  3. Today's Summary card:
     — "Completed X/Y tasks"
     — Pillar breakdown in mini bars
  4. Challenge Wins Today:
     — For each challenge with a task in today's plan:
       ✓ [title] — streak continues (if done)
       ✗ [title] — not done yet (if pending/skipped)
  5. Tomorrow Preview (TomorrowPreview.tsx):
     — Top 3 tasks for tomorrow
     — Show pillar badge + duration

═══ STEP 7 — Midday View (DashboardMidday.tsx) ═══

Minimal view:
  1. Greeting (afternoon)
  2. Today's plan (same DayPlan component)
  3. "+ Add to Today" button always visible

═══ STEP 8 — PillarHealthBar.tsx ═══

Props: { pillar: 'money'|'soul'|'curiosity', count: number, target: number, total: number }
Show: pillar icon + label, progress bar (fill = count/total as %), count display.
Color: money=amber, soul=rose, curiosity=blue.
If count/total < 0.15 and total > 0: show ⚠ with text "(neglected)".

═══ STEP 9 — AddToTodayDrawer.tsx ═══

Slide-up drawer component.
Three tabs:

  Tab 1 "From Tasks":
    Fetch all active tasks not already in today's plan.
    List with pillar badge + duration.
    Tap a task → show time slot picker (simple: start time input).
    Confirm → PATCH /api/plan/add-task → close drawer + refresh plan.

  Tab 2 "From Challenges":
    List active challenges with their linked task.
    Same tap → time slot → add flow.

  Tab 3 "Quick Add":
    Form: title (required), duration (dropdown), pillar (3 buttons).
    "Save to task library" checkbox (default unchecked).
    If unchecked: creates a one-time task and adds to today only.
    If checked: saves to master task list + adds to today.
    Submit → POST /api/tasks (if saving) then PATCH /api/plan/add-task.

═══ STEP 10 — loading.tsx skeletons ═══

Create loading.tsx in: /app/dashboard, /app/tasks, /app/insights,
/app/checkin, /app/challenges.
Each: a dark skeleton screen matching the page layout using animate-pulse.
Use bg-zinc-800/50 rounded blocks to suggest content.

═══ ALSO FIX these existing bugs as part of this module ═══

Bug A — planGenerator.ts line 74:
  Replace: task_id: new mongoose.Types.ObjectId()  (fake ID)
  With: store recharge entries differently — add field entry_type: 'recharge'
  to the IPlanEntry interface, and use the actual RechargeItem._id.
  Update DailyPlan model's plan array type to include entry_type field.

Bug B — checkin/route.ts line 71:
  Replace: RevisionQueue.findById(entry.task_id)
  With: RevisionQueue.findOne({ task_id: entry.task_id })

Explain the time-on-client vs time-on-server problem, why SWR is used for
dashboard data instead of server fetch, and how the AddToTodayDrawer tabs
each use different data sources.
```

---


---

# LifeOS � Phase 3 Module Prompts

> **Phase 3 context block** � paste this at the top of any Phase 3 conversation:
>
> ```
> I'm building LifeOS � Phase 3. Phases 1 (Modules 0�10) and 2 (P2-A Challenge System,
> P2-B Responsive Navigation, P2-C Time-Aware Dashboard) are complete.
>
> The codebase has: Tasks (CRUD + Mongoose), Recharge Library, User Settings,
> Rule-based + AI Plan Generation (Claude/Gemini), Night Check-In, Event Blocks,
> Spaced Repetition (RevisionQueue), Weekly Insights, PWA, Challenge System
> (lib/challenges/library.ts, models/Challenge.ts), Responsive Navigation,
> Time-Aware Dashboard (Morning/Midday/Evening), AddToTodayDrawer.
>
> Tech stack: Next.js 14 App Router, TypeScript, MongoDB/Mongoose, NextAuth,
> Tailwind CSS v3, Zustand, SWR, Claude API + Gemini fallback.
>
> Refer to: .ai-context/architecture.md, .ai-context/project_context.md,
> .agents/rules/production-standards.md, BRD_phase_3.md
>
> Follow the /module-implement workflow.
> ```

---

## Module P3-A � Topic Queue System

### ?? What it does
Introduces a structured learning system using queues. 5 pre-seeded queues (Psychology, Power,
Money, Lifestyle, DSA) surface one topic at a time into the daily plan based on pillar balance.
Users never see all 107 topics at once � the queue feeds them gradually.

### ?? What you will learn
- Discriminator fields vs separate collections in Mongoose
- Synthetic task injection into the plan context pipeline (entry_type approach)
- Drag-to-reorder with bulk MongoDB update (single Promise.all operation)
- Extending an existing check-in hook with a new entry_type branch
- Additive PlanContext modifications without breaking the rule-based scheduler

### ?? Files involved

**New models:**
- `models/TopicQueue.ts` � queue container (name, pillar, queue_type, active)
- `models/TopicItem.ts` � individual topic/problem (status, order, notes, optional DSA fields)

**New lib:**
- `lib/queues/queueEngine.ts` � getNextPendingItem, advanceQueueItem, buildQueueContextForPlan
- `lib/queues/seedQueues.ts` � seed data constant + DB seeder (idempotent)
- `lib/validators/queue.ts` � Zod schemas for queue/item CRUD + reorder

**New API routes:**
- `app/api/queues/route.ts` � GET list + POST create custom queue
- `app/api/queues/[queue_id]/route.ts` � GET detail with items (filterable by tab)
- `app/api/queues/[queue_id]/items/route.ts` � POST add topic
- `app/api/queues/[queue_id]/items/[item_id]/route.ts` � PATCH update item
- `app/api/queues/[queue_id]/reorder/route.ts` � PATCH bulk reorder

**Modified files:**
- `models/DailyPlan.ts` � add entry_type 'queue_topic', optional topic_item_id, make task_id optional
- `lib/scheduler/contextCollector.ts` � add queueCandidates to PlanContext
- `lib/scheduler/planGenerator.ts` � inject queue topic entries when pillar < 33%
- `lib/ai/promptBuilder.ts` � include queue candidates in morning prompt
- `app/api/log/checkin/route.ts` � handle entry_type 'queue_topic' entries
- `lib/insights/weeklyAggregator.ts` � add queueStats (topics/DSA this week, revisions due)
- `components/layout/Navigation.tsx` � add Queues nav item (7th, icon: BookOpen)

**New UI:**
- `app/queues/page.tsx` � queue overview with 5 QueueCards
- `app/queues/[queue_id]/page.tsx` � detail with 3 tabs + drag list
- `app/queues/loading.tsx` � 5 pulse skeleton cards
- `components/queues/QueueCard.tsx` � summary card with progress bar
- `components/queues/QueueItemList.tsx` � @dnd-kit/sortable drag-to-reorder list
- `components/queues/AddTopicDrawer.tsx` � slide-up drawer (title + difficulty)
- `components/queues/TopicItemCard.tsx` � individual item (drag handle, notes, DSA fields)

### ? How to verify
```bash
# 1. Navigate to /queues � 5 pre-seeded queues (0/9 covered, 0/30 covered, etc.)
# 2. Tap "Psychology & Mind" � 9 items in Pending tab
# 3. Drag to reorder items � order persists on refresh
# 4. Generate daily plan with Curiosity pillar low � 1 queue topic appears
# 5. Submit check-in with queue topic marked done � item shows "covered" in /queues
# 6. [+ Add Topic] in DSA queue � new item appended at bottom of Pending list
# 7. Weekly review page � shows topics covered this week count
```

### ?? The Prompt

```
Implement Module P3-A � Topic Queue System

Follow /module-implement. Read BRD_phase_3.md for full spec.
Read .ai-context/architecture.md for existing schema.

DECISIONS (already confirmed � do not ask):
- Synthetic entries: use entry_type='queue_topic' + topic_item_id on IPlanEntry (Option A)
- Nav: /queues as a distinct 7th nav item (between Challenges and Check-In)
- Seeding: DB-seeded on first run with idempotent guard (not static constant)
- Schema: single TopicItem model with optional DSA fields

IMPORTANT: This is entirely additive. Do NOT restructure any existing code.
All changes to existing files are targeted additions only.

--- STEP 1 � New Models ---

models/TopicQueue.ts (collection: "topic_queues"):
  ITopicQueue extends Document:
    name: string required
    pillar: 'money' | 'soul' | 'curiosity' required
    description: string optional
    queue_type: 'concept' | 'dsa' required
    active: boolean default true
    timestamps: true
  Indexes: { active: 1 }, { pillar: 1 }

models/TopicItem.ts (collection: "topic_items"):
  ITopicItem extends Document:
    queue_id: ObjectId ref 'TopicQueue' required
    title: string required max 200
    order: number required integer (sort key)
    status: 'pending' | 'in_progress' | 'covered' | 'skipped' default 'pending'
    covered_on: string YYYY-MM-DD optional
    revision: boolean default false
    next_revision: string YYYY-MM-DD optional
    notes: string optional max 2000
    difficulty: 'easy' | 'medium' | 'hard' required
    // DSA only � all optional:
    approach_notes: string
    time_taken: number (minutes)
    solved_without_hint: boolean
    timestamps: true
  Indexes: { queue_id: 1, order: 1 }, { status: 1 }, { next_revision: 1 }

models/DailyPlan.ts � minimal changes:
  1. Add 'queue_topic' to entry_type enum (IPlanEntry interface + PlanEntrySchema)
  2. Add topic_item_id?: mongoose.Types.ObjectId to IPlanEntry interface and schema
  3. Make task_id NOT required in PlanEntrySchema (remove required: true)
     Rationale: queue_topic entries use topic_item_id, not task_id

--- STEP 2 � Queue Engine (lib/queues/queueEngine.ts) ---

export interface QueueCandidate {
  queue_id: string
  queue_name: string
  pillar: 'money' | 'soul' | 'curiosity'
  queue_type: 'concept' | 'dsa'
  nextItem: ITopicItem | null
}

export async function getNextPendingItem(queueId: string): Promise<ITopicItem | null>
  ? TopicItem.findOne({ queue_id: queueId, status: 'pending' }).sort({ order: 1 })

export async function advanceQueueItem(
  itemId: string,
  status: 'covered' | 'skipped',
  date: string
): Promise<void>
  1. Update item: status = status, covered_on = date (if covered)
  2. If covered and item.revision: set next_revision = date + 7 days
  3. Clear any existing in_progress in the same queue (findOneAndUpdate status?pending is wrong;
     set them back... actually: do NOT reset them, just find the next after current item)
     Correct approach:
     - Find the item to get its queue_id
     - TopicItem.updateMany({ queue_id, status: 'in_progress' }, { status: 'pending' })
     - Then find next pending (lowest order) ? set status = 'in_progress'
  Only one item per queue should be in_progress at a time.

export async function buildQueueContextForPlan(): Promise<QueueCandidate[]>
  ? const queues = await TopicQueue.find({ active: true })
  ? For each queue:
      first look for in_progress item; if none, look for next pending
  ? Return only queues where nextItem != null (active, has content remaining)

export async function getRevisionsDue(date: string): Promise<ITopicItem[]>
  ? TopicItem.find({ next_revision: { $lte: date }, status: 'covered', revision: true })

--- STEP 3 � Seed Data (lib/queues/seedQueues.ts) ---

Create const QUEUE_SEED_DATA: Array<{
  name: string, pillar: string, queue_type: string, description: string,
  items: Array<{ title: string, difficulty: string }>
}> with all 5 queues.

Queue 1: Psychology & Mind | concept | curiosity
Items: Cognitive Dissonance, Dunning-Kruger Effect, Confirmation Bias, Anchoring Bias,
  Loss Aversion, Sunk Cost Fallacy, Availability Heuristic, Emotional Regulation,
  Growth vs Fixed Mindset

Queue 2: Power & Systems | concept | curiosity
Items: First Principles Thinking, Second-Order Thinking, Inversion, Pareto Principle,
  Circle of Competence, Mental Models, Feedback Loops, Game Theory Basics, Network Effects

Queue 3: Money & Wealth Logic | concept | money
Items: Compound Interest, Opportunity Cost, Time Value of Money, Diversification,
  Asset vs Liability, Inflation Mechanics, Tax-Efficient Investing,
  Emergency Fund Logic, Net Worth Calculation

Queue 4: Lifestyle Concepts | concept | curiosity | 34 items:
  Deep Work, Atomic Habits Principles, Sleep Hygiene, Circadian Rhythm, 80/20 Principle,
  Mindful Eating, Active Listening, Non-Violent Communication, Body Language Basics,
  Stoicism Basics, Ikigai Framework, Digital Minimalism, Intermittent Fasting Basics,
  HIIT vs Steady State, Progressive Overload, Cold Exposure Benefits,
  Breathing Techniques (Wim Hof), Journaling Methods, Gratitude Practice,
  Meditation Types, Reading Effectively, Zettelkasten Note-Taking,
  Energy Management vs Time Management, Social Battery Concept,
  Conflict Resolution Styles, Emotional Intelligence Components,
  Public Speaking Basics, Negotiation Basics, Networking Authentically,
  Personal Brand Basics, Goal Setting (SMART vs OKR), Dopamine Detox,
  Accountability Systems, Habit Stacking

Queue 5: DSA Problems | dsa | money | 30 items difficulty easy?medium?hard:
  Easy: Two Sum, Reverse a String, Check Palindrome, Find Maximum Element,
    Count Occurrences, Fibonacci (iterative), FizzBuzz Logic, Array Rotation,
    Sum of Digits, Binary Search
  Medium: Linked List Reversal, Detect Cycle in Linked List, Valid Parentheses,
    Merge Two Sorted Arrays, Maximum Subarray (Kadane's), Level Order Traversal,
    Top K Frequent Elements, Valid Anagram, 3Sum, Coin Change (DP intro)
  Hard: Longest Common Subsequence, Word Break, Number of Islands,
    Serialize/Deserialize Binary Tree, Merge K Sorted Lists, Trapping Rain Water,
    Minimum Window Substring, Alien Dictionary, Regular Expression Matching,
    Sliding Window Maximum

export async function seedQueuesIfEmpty(): Promise<void>
  if (await TopicQueue.countDocuments() > 0) return  // idempotent guard
  for (const queueData of QUEUE_SEED_DATA):
    const queue = await TopicQueue.create({ name, pillar, queue_type, description, active: true })
    const items = queueData.items.map((item, index) => ({
      queue_id: queue._id, title: item.title, difficulty: item.difficulty,
      order: index, status: 'pending'
    }))
    await TopicItem.insertMany(items)

Call seedQueuesIfEmpty() in lib/db/mongoose.ts after successful DB connection,
alongside existing recharge seed calls.

--- STEP 4 � Validators (lib/validators/queue.ts) ---

topicQueueCreateSchema:
  name: z.string().min(1).max(100)
  pillar: z.enum(['money', 'soul', 'curiosity'])
  description: z.string().optional()
  queue_type: z.enum(['concept', 'dsa'])

topicItemCreateSchema:
  title: z.string().min(1).max(200)
  difficulty: z.enum(['easy', 'medium', 'hard'])

topicItemUpdateSchema (all optional):
  status: z.enum(['covered', 'skipped']).optional()
  notes: z.string().max(2000).optional()
  revision: z.boolean().optional()
  approach_notes: z.string().optional()
  time_taken: z.number().positive().max(300).optional()
  solved_without_hint: z.boolean().optional()

reorderSchema:
  queue_id: z.string()
  items: z.array(z.object({ id: z.string(), order: z.number().int().nonnegative() }))

--- STEP 5 � API Routes ---

GET /api/queues
  const queues = await TopicQueue.find({ active: true })
  For each queue: aggregate item counts by status from TopicItem
  Return: { queues: [{ queue, progress: { covered, pending, skipped, total } }] }

POST /api/queues
  Validate topicQueueCreateSchema ? create queue ? return it

GET /api/queues/[queue_id]?tab=pending|covered|skipped|all
  Fetch queue + items filtered by tab param, sorted by order ASC
  Return: { queue, items }

POST /api/queues/[queue_id]/items
  Validate topicItemCreateSchema
  const last = await TopicItem.findOne({ queue_id }).sort({ order: -1 })
  const order = last ? last.order + 1 : 0
  Create item with status 'pending' ? return it

PATCH /api/queues/[queue_id]/items/[item_id]
  Validate topicItemUpdateSchema
  If payload.status === 'covered' or 'skipped':
    await advanceQueueItem(item_id, payload.status, today_date)
    return updated item from DB
  Else:
    Update fields directly (notes, approach_notes, time_taken, etc.)
    Return updated item

PATCH /api/queues/[queue_id]/reorder
  Validate reorderSchema
  Verify none of the item IDs have status 'covered' (covered items are locked)
  If any covered items in payload: return 400 with message
  await Promise.all(items.map(({ id, order }) =>
    TopicItem.updateOne({ _id: id, queue_id }, { $set: { order } })
  ))
  Return { updated: items.length }

--- STEP 6 � Scheduler Integration ---

lib/scheduler/contextCollector.ts:
  Add to PlanContext interface:
    queueCandidates: QueueCandidate[]
  Import buildQueueContextForPlan from lib/queues/queueEngine
  In collectPlanContext(): const queueCandidates = await buildQueueContextForPlan()
  Add queueCandidates to returned context object.

lib/scheduler/planGenerator.ts:
  After finishing slot scheduling (after the skippedTasks loop), add:

  const QUEUE_TOPIC_CAP = 2;
  let queueTopicsAdded = 0;
  const totalCompleted = Object.values(context.pillarBalance7d).reduce((a, b) => a + b, 0);

  for (const candidate of context.queueCandidates) {
    if (queueTopicsAdded >= QUEUE_TOPIC_CAP) break;
    if (!candidate.nextItem) continue;
    const pillarPct = totalCompleted > 0
      ? context.pillarBalance7d[candidate.pillar]
      : 0;
    if (pillarPct > 33) continue; // pillar is healthy, skip injection

    const duration = candidate.queue_type === 'dsa' ? 45 : 25;
    const prefix = candidate.queue_type === 'dsa' ? 'Solve' : 'Study';

    planEntries.push({
      time_start: '00:00',  // placeholder � will be overridden by manual scheduling
      time_end: '00:00',
      task_id: undefined as any,  // no real task
      topic_item_id: candidate.nextItem._id as mongoose.Types.ObjectId,
      title: `${prefix}: ${candidate.nextItem.title}`,
      pillar: candidate.pillar,
      type: 'one-time',
      energy_cost: 'low',
      status: 'pending',
      entry_type: 'queue_topic',
    });
    queueTopicsAdded++;
  }

  Note: Time slots for queue entries are placeholders. The AI prompt builder will
  instruct Claude to properly place them within available slots.

lib/ai/promptBuilder.ts:
  Add to userPrompt string before the Rules section:

  Active Topic Queues (next items to surface):
  ${JSON.stringify(context.queueCandidates
    .filter(q => q.nextItem)
    .map(q => ({
      queue: q.queue_name,
      pillar: q.pillar,
      type: q.queue_type,
      next_item: q.nextItem?.title,
      suggested_duration_min: q.queue_type === 'dsa' ? 45 : 25
    })), null, 2)}

  Add to the Rules list:
  6. If a pillar is below 33%, include one topic from that queue's next item.
     Use entry_type "queue_topic" and include topic_item_id in the plan entry.
     Assign it to the morning window at an appropriate slot.

--- STEP 7 � Check-In Hook ---

app/api/log/checkin/route.ts � after the existing challenge progress hook, add:

  // Queue topic completion
  import { advanceQueueItem } from '@/lib/queues/queueEngine';

  const queueEntries = (entries as any[]).filter(e => e.entry_type === 'queue_topic');
  for (const entry of queueEntries) {
    if (!entry.topic_item_id) continue;
    const itemStatus = entry.status === 'done' ? 'covered' : 'skipped';
    await advanceQueueItem(entry.topic_item_id.toString(), itemStatus, date);
  }

--- STEP 8 � UI Components ---

app/queues/page.tsx:
  Server component. Auth-protected.
  Fetch GET /api/queues server-side (use fetch with cookies/session).
  Header: "?? My Topic Queues" subtitle "One topic at a time."
  Render QueueCard for each queue.
  "+ New Queue" button at top-right ? opens a simple modal (name + pillar + type).
  Empty state: "No queues yet. Create your first queue."

app/queues/[queue_id]/page.tsx:
  Client component ('use client').
  useSWR('/api/queues/[queue_id]?tab=...') � refetch on tab change.
  Header: queue name + progress bar + "X/Y covered" counter.
  Three tabs: Covered ? | Pending | Skipped.
  Pending and Skipped: render QueueItemList (draggable).
  Covered: render plain sorted list, NO drag handle, show covered_on date.
  Fixed bottom: "+ Add Topic" button ? AddTopicDrawer.
  Back button ? /queues.

app/queues/loading.tsx:
  Export default function: 5 animate-pulse bg-zinc-800/50 rounded-xl cards in a flex col.

components/queues/QueueCard.tsx:
  Props: { queue: ITopicQueue, progress: { covered: number, total: number } }
  Show: queue name (font-semibold), pillar badge (money=amber, curiosity=blue, soul=rose),
  queue_type icon (BookOpen for concept, Code2 for DSA), progress bar,
  "X/Y covered" text.
  Glassmorphism card (bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl).
  Hover: slight scale + border brightens.
  Entire card is a Link to /queues/[queue._id].

components/queues/QueueItemList.tsx:
  Props: { items: ITopicItem[], queueId: string, onItemUpdated: () => void }
  Use @dnd-kit/core and @dnd-kit/sortable.
  On drag end: build new order array ? PATCH /api/queues/[queueId]/reorder.
  Render TopicItemCard for each item with useSortable.
  Show a subtle drop indicator while dragging.

components/queues/TopicItemCard.tsx:
  Props: { item: ITopicItem, draggable?: boolean, onUpdate?: () => void }
  Layout: [drag handle =] [difficulty badge] [title] [status icon]
  Drag handle only visible if draggable=true.
  Difficulty badge: easy=emerald, medium=amber, hard=rose � small pill.
  Status icons: pending=?, in_progress=? (indigo), covered=? (green), skipped=� (zinc).
  Expandable on click (accordion): shows notes textarea (editable), covered_on date.
  DSA items: when expanded also show approach_notes, time_taken, solved_without_hint toggle.
  Save button appears when notes/DSA fields are edited.

components/queues/AddTopicDrawer.tsx:
  Props: { queueId: string, queueType: 'concept'|'dsa', isOpen: boolean,
          onClose: () => void, onAdded: () => void }
  Slide-up drawer from bottom (translate-y-full ? translate-y-0 transition).
  Fields: Title (text input, autofocus), Difficulty (3-button selector: Easy/Medium/Hard).
  Submit ? POST /api/queues/[queueId]/items ? toast success ? onAdded() ? onClose().
  Cancel button dismisses.

Navigation update (components/layout/Navigation.tsx):
  Import BookOpen from lucide-react.
  Add to navItems array after Challenges:
    { name: 'Queues', href: '/queues', icon: BookOpen }
  Apply to both mobile (md:hidden) and desktop (hidden md:flex) nav sections.

Insights update (lib/insights/weeklyAggregator.ts):
  Import TopicItem.
  Add to weekly aggregation:
    const weekStart = sevenDaysAgoStr; // already calculated
    topicsCoveredThisWeek = await TopicItem.countDocuments({
      covered_on: { $gte: weekStart }, status: 'covered'
    })
    dsaSolvedThisWeek = count from DSA queue only
    revisionsdue = (await getRevisionsDue(today)).length
  Return queueStats: { topicsCoveredThisWeek, dsaSolvedThisWeek, revisionsDue }

app/insights/page.tsx � add a "Queue Progress" section card:
  "Topics covered this week: X" | "DSA solved: Y" | "Revisions due: Z"
  Same glassmorphism card style as other insight cards.

--- STEP 9 � Bug Fixes (apply alongside Phase 3) ---

Fix 1 � contextCollector.ts: Replace simplified frequency logic (lines 79�90):

  Add helper before collectPlanContext:
  function isTaskDueToday(task: ITask, dayOfWeek: number): boolean {
    if (!task.frequency) return task.type !== 'recurring';
    switch (task.frequency) {
      case 'daily': return true;
      case 'alternate': {
        const days = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000);
        return days % 2 === 0;
      }
      case '3x_week': return [1, 3, 5].includes(dayOfWeek); // Mon/Wed/Fri
      case 'weekly': return dayOfWeek === 1; // Monday
      default: return true;
    }
  }

  Replace the Task.find with:
  const allActiveTasks = await Task.find({ active: true }).lean();
  const todayTasks = allActiveTasks.filter(t => isTaskDueToday(t as ITask, dayOfWeek));

Fix 2 � planGenerator.ts: Favourite-first recharge selection:
  Replace lines 118 and 125:
  const pool = context.rechargeMenu.filter(r => r.favourite);
  const recharge = (pool.length > 0 ? pool : context.rechargeMenu)[
    Math.floor(Math.random() * (pool.length > 0 ? pool : context.rechargeMenu).length)
  ];

Fix 3 � contextCollector.ts: Remove @ts-ignore (3 instances):
  Replace with type assertions:
  carryoverTasks: carryoverTasks as ITask[],
  todayTasks: todayTasks as ITask[],
  rechargeMenu: rechargeMenu as IRechargeItem[],

Fix 4 � promptBuilder.ts: Add "status": "pending" to AI output format:
  In the Output Format section, update the plan entry object to include:
  { "task_id": "...", "status": "pending", "type": "...", ... }

--- STEP 10 � Tests ---

Create tests/api/queues.test.ts:

Test: GET /api/queues after seed ? returns 5 queues with correct totals
Test: POST /api/queues ? custom queue created
Test: POST /api/queues/[id]/items ? item order = maxOrder + 1, status = pending
Test: PATCH items/[id] status=covered ? item status covered, next item in_progress
Test: PATCH items/[id] status=covered on last item ? no next in_progress (queue empty)
Test: PATCH reorder ? item orders updated, covered items rejected with 400
Test: Check-in with entry_type=queue_topic + status=done ? advanceQueueItem called
Test: buildQueueContextForPlan ? returns only queues with remaining items
Test: seedQueuesIfEmpty ? running twice ? still only 5 queues in DB
Test: Plan generation ? queueCandidates in context when queues exist

Explain:
- Why entry_type='queue_topic' is cleaner than creating stub tasks
- How the one-in_progress-per-queue invariant is maintained in advanceQueueItem
- Why covered items cannot be drag-reordered (they are history, not future)
- How DSA completion tracking differs (approach_notes, time taken)
- Why seedQueuesIfEmpty is idempotent and why that matters in production
```

---