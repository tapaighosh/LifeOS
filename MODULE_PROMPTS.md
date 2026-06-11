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
---

## Phase 4 — Principles & Notebook

> **Decisions locked in:**
> - Navigation: Full restructure — Home | Tasks | Challenges | Notebook | Settings (5 items). Check-In and Insights move to dashboard inline links.
> - Principles: User provides their own list. Seeder accepts a `PRINCIPLES` array constant at the top of the script.
> - "Save to Notebook" appears in BOTH TopicItemCard (on cover) AND the night check-in form.
> - Notebook entry body: soft 2000-char limit — counter shown when >= 1800 chars.

---

### Phase 4 / Step 1 — Bug Fixes (apply first)

**What it does:** Fixes 3 confirmed bugs and 1 code-quality issue carried over from Phases 1-3.
**Files changed:** `lib/insights/weeklyAggregator.ts`, `lib/scheduler/contextCollector.ts`, `components/dashboard/DashboardMorning.tsx`

**The Prompt:**

```
Fix 4 bugs in the LifeOS codebase before starting Phase 4 features.

Bug 1 - weeklyAggregator.ts: Wrong import path (ALREADY FIXED - verify it reads):
  import { getRevisionsDue } from '@/lib/revision/revisionEngine';
  Confirm the fix is present, do not change anything else.

Bug 2 - contextCollector.ts: alternate frequency uses wrong time reference.
  Find the isTaskDueToday function. In the 'alternate' case replace:
    OLD: const daysSinceCreation = Math.floor((Date.now() - new Date((task as any).createdAt).getTime()) / 86400000);
    NEW: const targetTime = new Date(targetDate).getTime();
         const daysSinceCreation = Math.floor((targetTime - new Date((task as any).createdAt).getTime()) / 86400000);

Bug 3 - DashboardMorning.tsx: Garbled pillar emoji. Replace PILLAR_EMOJI with:
  const PILLAR_EMOJI: Record<string, string> = { money: 'Money', soul: 'Soul', curiosity: 'Curiosity' };
  (Use text labels instead of emoji to avoid encoding issues, or use the correct emoji if terminal supports it)

Bug 4 - contextCollector.ts: Redundant DailyPlan queries. Merge into single 7-day query:
  const weekPlans = await DailyPlan.find({ date: { $gte: sevenDaysAgoStr, $lt: targetDate } }).lean();
  const recentPlans = weekPlans.filter(p => p.date >= threeDaysAgoStr);
  Remove the original recentPlans DailyPlan.find() call.

After all fixes: run npx tsc --noEmit and confirm 0 errors.
```

---

### Phase 4 / Step 2 — Principle Model and Seeder

**Files created:** `models/Principle.ts`, `scripts/seedPrinciples.ts`, `lib/validators/principle.ts`

**The Prompt:**

```
Implement the Principle data layer for LifeOS Phase 4.

1. models/Principle.ts:
   Interface: IPrinciple extends Document { heading: string; body: string; show_order: number; last_shown: string | null; active: boolean; }
   Schema: heading (String required), body (String required), show_order (Number required), last_shown (String default null), active (Boolean default true)
   Indexes: { last_shown: 1 }, { show_order: 1 }
   Standard mongoose.models.Principle || mongoose.model pattern.

2. lib/validators/principle.ts:
   export const PrincipleSchema = z.object({ heading: z.string().min(1).max(120), body: z.string().min(1).max(500) });
   export type PrincipleInput = z.infer<typeof PrincipleSchema>;

3. scripts/seedPrinciples.ts:
   Connect to MongoDB using lib/db/mongoose.ts pattern.
   PRINCIPLES array at top — USER WILL FILL THIS IN:
     const PRINCIPLES: Array<{ heading: string; body: string }> = [
       // Paste your principles here
       // { heading: "Do what you love", body: "Passion is essential because without it, discipline becomes punishment." },
     ];
   Idempotency: if (await Principle.countDocuments() > 0) skip.
   Fisher-Yates shuffle to assign show_order (0 to N-1).
   insertMany with show_order and last_shown: null.
   Log count, then disconnect.
   Run: npx ts-node --project tsconfig.json scripts/seedPrinciples.ts
```

---

### Phase 4 / Step 3 — Principles API Route

**Files created:** `app/api/principles/today/route.ts`

**The Prompt:**

```
Implement GET /api/principles/today for LifeOS.

Logic:
  1. connectDB, getServerSession — return 401 if no session.
  2. today = new Date().toISOString().split('T')[0]
  3. Find principle not shown today (null sorts first, then oldest date):
       Principle.findOne({ active: true, last_shown: { $ne: today } }).sort({ last_shown: 1 }).lean()
  4. If null (all shown today): Principle.findOne({ active: true }).sort({ last_shown: 1 }).lean()
  5. If still null: return NextResponse.json({ principle: null }, { status: 200 })
  6. Idempotent update: only set last_shown if !== today
       if (principle.last_shown !== today) await Principle.updateOne({ _id }, { $set: { last_shown: today } })
  7. Return: NextResponse.json({ principle: { _id, heading, body } })
```

---

### Phase 4 / Step 4 — PrincipleCard Component + Dashboard Integration

**Files created:** `components/dashboard/PrincipleCard.tsx`
**Files modified:** `components/dashboard/DashboardMorning.tsx`

**The Prompt:**

```
Implement PrincipleCard and integrate into DashboardMorning.

1. components/dashboard/PrincipleCard.tsx ('use client'):
   Props: { heading: string; body: string }
   Design: bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-4 with border-l-2 border-l-indigo-500/60
   Header label: "TODAY'S PRINCIPLE" text-xs text-zinc-500 uppercase tracking-wider
   Heading: text-sm font-semibold text-zinc-100
   Body: collapsed to 2 lines (line-clamp-2 CSS), "Read more" / "Show less" toggle if > 100 chars
   Also export PrincipleCardSkeleton with animate-pulse placeholders.

2. components/dashboard/DashboardMorning.tsx:
   Add SWR fetch:
     const { data: principleData } = useSWR<{ principle: { heading: string; body: string } | null }>('/api/principles/today', fetcher);
   Insert between greeting and Energy Forecast sections:
     {principleData === undefined ? <PrincipleCardSkeleton /> : principleData.principle ? <PrincipleCard heading={principleData.principle.heading} body={principleData.principle.body} /> : null}
   Import PrincipleCard and PrincipleCardSkeleton from '@/components/dashboard/PrincipleCard'.
```

---

### Phase 4 / Step 5 — Notebook Models and Seeders

**Files created:** `models/NotebookTopic.ts`, `models/NotebookEntry.ts`, `scripts/seedNotebookTopics.ts`, `lib/validators/notebook.ts`

**The Prompt:**

```
Implement the Notebook data layer for LifeOS Phase 4.

1. models/NotebookTopic.ts:
   Interface: INotebookTopic extends Document {
     user_id: string; title: string; icon: string;
     color: 'amber'|'blue'|'rose'|'emerald'|'indigo'|'zinc';
     entry_count: number; last_entry_on: string|null;
     pinned: boolean; active: boolean; created_at: Date;
   }
   Schema: user_id (String default 'default'), title (String required maxlength 60), icon (String default 'note emoji'),
     color (enum, default 'indigo'), entry_count (Number default 0), last_entry_on (String default null),
     pinned (Boolean default false), active (Boolean default true), created_at (Date default Date.now)
   Compound index: { user_id: 1, pinned: -1, last_entry_on: -1 }

2. models/NotebookEntry.ts:
   Interface: INotebookEntry extends Document { topic_id: Types.ObjectId; body: string; source: string; tags: string[]; created_at: Date; }
   Schema: topic_id (ObjectId ref NotebookTopic required), body (String required maxlength 5000),
     source (String maxlength 100 default ''), tags ([String] max 5 items), created_at (Date default Date.now)
   Index: { topic_id: 1, created_at: -1 }

3. lib/validators/notebook.ts:
   NotebookTopicSchema: { title: z.string().min(1).max(60), icon: z.string().min(1).max(4), color: z.enum([...6 colors]), pinned: z.boolean().optional() }
   NotebookEntrySchema: { body: z.string().min(1).max(5000), source: z.string().max(100).optional().default(''), tags: z.array(z.string().max(30)).max(5).optional().default([]) }

4. scripts/seedNotebookTopics.ts:
   Idempotent: skip if NotebookTopic.countDocuments({ user_id: 'default' }) > 0.
   Seed 4 default topics:
     { user_id: 'default', title: 'Ideas', icon: 'idea emoji', color: 'amber', pinned: true }
     { user_id: 'default', title: 'Learnings', icon: 'book emoji', color: 'blue', pinned: true }
     { user_id: 'default', title: 'Lines', icon: 'speech emoji', color: 'rose', pinned: false }
     { user_id: 'default', title: 'Observations', icon: 'search emoji', color: 'zinc', pinned: false }
   Run: npx ts-node --project tsconfig.json scripts/seedNotebookTopics.ts
```

---

### Phase 4 / Step 6 — Notebook API Routes

**Files created:** `app/api/notebook/topics/route.ts`, `app/api/notebook/topics/[id]/route.ts`, `app/api/notebook/topics/[id]/entries/route.ts`, `app/api/notebook/entries/[id]/route.ts`

**The Prompt:**

```
Implement all Notebook API routes for LifeOS Phase 4.
All routes: connectDB, getServerSession (401 if null), try/catch (500 on error).

app/api/notebook/topics/route.ts:
  GET: find({ active: true }).sort({ pinned: -1, last_entry_on: -1 }).lean() -> { topics }
  POST: validate NotebookTopicSchema, create({ ...validated, user_id: 'default' }) -> 201 { topic }

app/api/notebook/topics/[id]/route.ts:
  PATCH: validate NotebookTopicSchema.partial(), findByIdAndUpdate(id, validated, { new: true }) -> 404 or { topic }
  DELETE: cascade — deleteMany({ topic_id: id }) then findByIdAndDelete(id) -> 404 or { ok: true }

app/api/notebook/topics/[id]/entries/route.ts:
  GET: find({ topic_id: id }).sort({ created_at: -1 }).limit(50).lean() -> { entries }
  POST: validate NotebookEntrySchema, today = YYYY-MM-DD string.
        Promise.all([
          NotebookEntry.create({ topic_id: id, ...validated }),
          NotebookTopic.findByIdAndUpdate(id, { $inc: { entry_count: 1 }, $set: { last_entry_on: today } })
        ]) -> 201 { entry }

app/api/notebook/entries/[id]/route.ts:
  PATCH: validate NotebookEntrySchema.partial(), findByIdAndUpdate -> 404 or { entry }
  DELETE: findByIdAndDelete(id) -> 404 if null.
          findByIdAndUpdate(entry.topic_id, { $inc: { entry_count: -1 } }) -> { ok: true }

Update .ai-context/architecture.md API routes table with all new notebook routes.
```

---

### Phase 4 / Step 7 — Notebook UI Components

**Files created:** `components/notebook/NotebookTopicCard.tsx`, `components/notebook/EntryCard.tsx`, `components/notebook/NewEntryDrawer.tsx`, `components/notebook/NewTopicModal.tsx`

**The Prompt:**

```
Implement the 4 Notebook UI components for LifeOS Phase 4.
Design system: bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl (same as rest of app).
Use lucide-react for icons.

1. components/notebook/NotebookTopicCard.tsx:
   Pure display, server-renderable (no 'use client').
   Props: { topic: INotebookTopic }
   Color map for left border: { amber:'border-l-amber-400', blue:'border-l-blue-400', rose:'border-l-rose-400', emerald:'border-l-emerald-400', indigo:'border-l-indigo-400', zinc:'border-l-zinc-500' }
   Layout inside Link to /notebook/[topic._id]:
     - Top row: icon + title + (pin icon if pinned)
     - Bottom row: "{entry_count} entries · {relative date}"
     Relative date: null -> "No entries yet", today -> "today", yesterday -> "yesterday", else date string.
   Hover: transition-all hover:scale-[1.01] hover:border-zinc-600

2. components/notebook/EntryCard.tsx ('use client'):
   Props: { entry: INotebookEntry; onUpdated: () => void; onDeleted: () => void }
   States: collapsed -> expanded -> editing (useState booleans)
   Collapsed: date label + first 80 chars + "..." if longer
   Expanded: full body (whitespace-pre-wrap) + source (italic) + [Edit] [Delete] buttons
   Editing: textarea (autoFocus), character counter at >= 1800 chars (amber) / >= 2000 (rose), source input, [Save] [Cancel]
   Delete: inline confirm before DELETE API call.
   Date formatting: "Today" / "Yesterday" / "15 May 2025" helper function.

3. components/notebook/NewEntryDrawer.tsx ('use client'):
   Props: { topicId: string; topicName: string; isOpen: boolean; onClose: () => void; onAdded: () => void; prefillSource?: string }
   Slide-up drawer pattern (same as AddTopicDrawer in queues): fixed overlay + bottom-anchored panel.
   Fields:
     body textarea: autoFocus, placeholder "Write anything...", maxLength 5000
     Character counter: visible when body.length >= 1800, amber at 1800-1999, rose at 2000+
     source input: placeholder "Where did this come from? (optional)", defaultValue={prefillSource}
   On Save: POST /api/notebook/topics/[topicId]/entries -> toast -> onAdded() -> onClose() -> reset form.

4. components/notebook/NewTopicModal.tsx ('use client'):
   Uses existing Modal component from components/ui/Modal.tsx if it accepts children.
   Fields:
     title: text input, autofocus, required, maxlength 60
     icon picker: 12 preset emoji in 4x3 grid, selected shows ring-2 ring-indigo-500
       Emoji list: paste actual emoji characters for ideas, books, speech, search, travel, brain, strength, target, growth, music, notes, lightning
     color picker: 6 filled circles, selected shows ring-2 ring-indigo-500
       Colors: amber / blue / rose / emerald / indigo / zinc
   On Submit: POST /api/notebook/topics -> toast -> onCreated() -> onClose() -> reset.
```

---

### Phase 4 / Step 8 — Notebook Pages

**Files created:** `app/notebook/page.tsx`, `app/notebook/loading.tsx`, `app/notebook/[topic_id]/page.tsx`

**The Prompt:**

```
Implement the Notebook pages for LifeOS Phase 4.

1. app/notebook/loading.tsx:
   4 animate-pulse skeleton cards (h-20 bg-zinc-800/50 rounded-2xl) in flex-col gap-3.

2. app/notebook/page.tsx (server component):
   Auth check: getServerSession -> redirect('/login') if null.
   Direct DB fetch: connectDB() then NotebookTopic.find({ active: true, user_id: 'default' }).sort({ pinned: -1, last_entry_on: -1 }).lean()
   Extract a NotebookHeader client component (inline or separate file) that owns the "+ New Topic" button and NewTopicModal state.
     After topic created: call router.refresh() to reload server data.
   Render: header + NotebookHeader + topics list (NotebookTopicCard per topic) + empty state if 0 topics.
   Empty state text: "Your notebook is empty. Create your first topic."

3. app/notebook/[topic_id]/page.tsx ('use client'):
   useSWR for entries from /api/notebook/topics/[topic_id]/entries
   useSWR for topic name from /api/notebook/topics (find by id)
   State: isDrawerOpen, prefillSource
   Entry list: sort newest first (API already does this), group by date label above each date group.
   Empty state: "No entries yet. Write your first one."
   Loading: 3 skeleton cards (h-16 animate-pulse).
   Fixed or inline "+ New Entry" button.
   NewEntryDrawer at bottom with mutate() on onAdded.
```

---

### Phase 4 / Step 9 — Navigation Restructure

**Files modified:** `components/layout/Navigation.tsx`, `components/dashboard/DashboardMorning.tsx`, `components/dashboard/DashboardEvening.tsx`

**How to verify:** Mobile bar shows exactly 5 items. /insights and /checkin still work as direct URLs.

**The Prompt:**

```
Restructure the LifeOS navigation for Phase 4.

1. components/layout/Navigation.tsx:
   Import BookText from 'lucide-react'. Remove TrendingUp and Sparkles imports.
   Update useNavItems to return exactly 5 items:
     { name: 'Home',       href: '/dashboard', icon: LayoutDashboard }
     { name: 'Tasks',      href: '/tasks',      icon: CheckSquare }
     { name: 'Challenges', href: '/challenges', icon: Trophy, badge: true }
     { name: 'Notebook',   href: '/notebook',   icon: BookText }
     { name: 'Settings',   href: '/settings',   icon: Settings2 }
   Remove isSundayEvening state, useEffect, and setInterval entirely.
   Keep hasActiveChallenges SWR for the challenge badge.
   Remove the `highlight` property from all items (no longer needed).

2. components/dashboard/DashboardMorning.tsx:
   After the "This Week's Pillars" section (last section in the scroll), add:
     <div className="flex items-center justify-end pt-2">
       <Link href="/insights" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
         <TrendingUp className="w-3 h-3" /> View weekly insights
       </Link>
     </div>
   Import TrendingUp from 'lucide-react'.

3. components/dashboard/DashboardEvening.tsx:
   At the TOP of the content area (before existing sections), add:
     <Link href="/checkin" className="block rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 hover:bg-indigo-500/20 transition-colors">
       <div className="flex items-center justify-between">
         <div>
           <p className="text-sm font-semibold text-zinc-100">Tonight's Check-In</p>
           <p className="text-xs text-zinc-400 mt-0.5">Review your day and log your energy.</p>
         </div>
         <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
       </div>
     </Link>
   Import Sparkles from 'lucide-react'. Import Link from 'next/link'.
```

---

### Phase 4 / Step 10 — Save to Notebook Connection

**Files modified:** `components/queues/TopicItemCard.tsx`, `components/checkin/CheckInForm.tsx`

**The Prompt:**

```
Add the "Save to Notebook" shortcut to LifeOS Phase 4.
This appears after covering a queue topic. It is OPTIONAL for the user — just a CTA, never forced.

SHARED PATTERN in both components:
  const { data: topicsData } = useSWR<{ topics: INotebookTopic[] }>('/api/notebook/topics', fetcher);
  const learningsTopicId = topicsData?.topics.find(t => t.title === 'Learnings')?._id?.toString();

1. components/queues/TopicItemCard.tsx:
   Add state: const [notebookDrawerOpen, setNotebookDrawerOpen] = useState(false);
   In the expanded view of a covered item (status === 'covered'), after covered_on date, add:
     {learningsTopicId && (
       <button onClick={() => setNotebookDrawerOpen(true)} className="mt-2 text-xs text-indigo-400 hover:underline flex items-center gap-1">
         <BookOpen className="w-3 h-3" /> Save to Notebook
       </button>
     )}
   Add NewEntryDrawer at end of return:
     {notebookDrawerOpen && learningsTopicId && (
       <NewEntryDrawer topicId={learningsTopicId} topicName="Learnings" isOpen={notebookDrawerOpen}
         onClose={() => setNotebookDrawerOpen(false)} onAdded={() => setNotebookDrawerOpen(false)}
         prefillSource={item.title} />
     )}
   Import NewEntryDrawer and BookOpen.

2. components/checkin/CheckInForm.tsx:
   Add state: notebookDrawerOpen (boolean), notebookPrefill (string).
   Fetch learningsTopicId (same SWR pattern).
   For each check-in entry where entry_type === 'queue_topic' AND status === 'done',
   show below the status toggle:
     <div className="mt-1 flex items-center gap-2">
       <span className="text-xs text-zinc-500">Save your learning?</span>
       <button onClick={() => { setNotebookPrefill(entry.title); setNotebookDrawerOpen(true); }}
         className="text-xs text-indigo-400 hover:underline">Save to Notebook</button>
     </div>
   Add NewEntryDrawer at end of form return with notebookPrefill as prefillSource.
   Do NOT change any existing check-in submission logic.
```

---

### Phase 4 / Step 11 — Tests

**Files created:** `tests/principles/principles.test.ts`, `tests/notebook/notebook.test.ts`

**The Prompt:**

```
Write Jest tests for Principles and Notebook modules in LifeOS Phase 4.
Follow patterns in tests/tasks/tasks.test.ts and tests/queues/queues.test.ts.

tests/principles/principles.test.ts:
  Seed 3 test principles (last_shown: null).
  Test 1: GET /api/principles/today -> returns principle, updates last_shown to today.
  Test 2: Same call twice same day -> same _id returned, last_shown only updated once (idempotent).
  Test 3: All principles last_shown = today -> returns oldest last_shown one (fallback).
  Test 4: Empty principles collection -> returns { principle: null } status 200.

tests/notebook/notebook.test.ts:
  Seed 1 test topic { title: 'Test Topic', icon: '📝', color: 'indigo' }.
  Test 1: GET /api/notebook/topics -> returns seeded topic.
  Test 2: POST /api/notebook/topics valid -> 201, entry_count: 0.
  Test 3: POST /api/notebook/topics missing title -> 400.
  Test 4: POST /api/notebook/topics/[id]/entries valid -> 201, entry_count++, last_entry_on updated.
  Test 5: POST entries with empty body -> 400.
  Test 6: PATCH /api/notebook/entries/[id] -> body updated.
  Test 7: DELETE /api/notebook/entries/[id] -> deleted, topic entry_count--.
  Test 8: DELETE /api/notebook/topics/[id] -> topic deleted + cascade entries deleted.
  Test 9: DELETE nonexistent topic -> 404.

Comments explaining:
  - Why entry_count is cached (avoids COUNT per topic on list render)
  - Why body has 5000 hard DB cap but 2000 soft UI warning
  - Why cascade delete (orphaned entries are invisible waste)
  - Why learningsTopicId is fetched via SWR not hardcoded (IDs differ across DBs)
```

---

### Phase 4 / Step 12 — Final Verification

**The Prompt:**

```
Final Phase 4 verification for LifeOS.

Run: npx tsc --noEmit
Run: npx jest tests/principles/ tests/notebook/ tests/queues/

Fix any TypeScript errors or failing tests before reporting done.

Manual checklist:
  1. Fill PRINCIPLES array in scripts/seedPrinciples.ts then run it.
  2. Run scripts/seedNotebookTopics.ts.
  3. npm run dev - morning dashboard shows PrincipleCard between greeting and plan.
  4. /notebook loads 4 default topics.
  5. Create topic + add 3 entries -> entry_count shows 3, last_entry_on shows today.
  6. Edit entry -> character counter appears at 1800+ chars (amber), 2000+ (rose).
  7. Mark a queue topic as covered -> "Save to Notebook" CTA appears.
  8. Night check-in with a queue_topic entry marked done -> "Save to Notebook" prompt shows.
  9. Mobile nav shows exactly 5 items: Home, Tasks, Challenges, Notebook, Settings.
  10. Dashboard morning bottom has "View weekly insights" link.
  11. Dashboard evening top has "Tonight's Check-In" card.
  12. /insights and /checkin still load correctly as direct URLs.

Report any remaining issues.
```

---

## Phase 5 � Bug Fix Sprint

> **Decisions locked in:**
> - Queue topics completed in daily plan MUST count toward dashboard completion stats.
> - Calendar splits into two explicit sections: Upcoming (date_end >= today) and Past (date_end < today, descending).
> - Dashboard morning adds an Upcoming Events widget (max 2 events, hidden when empty).
> - Challenge progress is NEVER auto-cleared when no plan is generated. Night check-in always works, plan or no plan.
> - Skipped queue topics stay in `pending` status � skip just increments a counter. No dead-end "skipped" bucket.
> - Challenge activation modal must be scrollable with padding-bottom so the button is never hidden.
>
> **Fix priority order:** Bug 5 ? Bug 2 ? Bug 4 ? Bug 3 ? Bug 1

---

### Phase 5 / Step 1 � Bug 5: Challenge Activation Modal CSS

**What it does:** Fixes the challenge activation popup so it is centered and its CTA button is always visible.
**Files modified:** `components/ui/Modal.tsx` (or the specific challenge activation modal component)
**How to verify:** Open any challenge ? tap "Activate" ? modal appears centered on screen, button visible without scrolling.

**The Prompt:**

```
Fix the challenge activation modal in LifeOS � it is not centered and the button is hidden below the fold.

Locate the modal component used by the challenge activation flow. It may be:
  components/ui/Modal.tsx
  components/challenges/AcceptChallengeDrawer.tsx
  or wherever the challenge "Start Challenge" popup renders.

Apply these CSS fixes to the modal OVERLAY (the backdrop element):
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  background: rgba(0, 0, 0, 0.5);

Apply these CSS fixes to the modal CONTENT BOX (the white/dark card inside):
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
  max-width: 480px;
  border-radius: 16px;
  padding-bottom: 24px;   /* ? this is the critical fix � button was below fold */

Rules:
  - Do NOT change any existing logic, button handlers, or submit behavior.
  - Do NOT change any other modal in the app � only the challenge activation modal.
  - If the modal already uses Tailwind classes, convert the above values to their Tailwind equivalents:
      inset-0, flex, items-center, justify-center, z-50, bg-black/50,
      max-h-[90vh], overflow-y-auto, w-[90%], max-w-[480px], rounded-2xl, pb-6
  - After the fix: the modal should center both horizontally and vertically, and the button should always be tappable.

Run npx tsc --noEmit � confirm 0 errors.
```

---

### Phase 5 / Step 2 � Bug 2: Calendar Date Query + Dashboard Upcoming Events Widget

**What it does:** Fixes the events API to split upcoming vs past correctly. Adds an Upcoming Events widget to the morning dashboard.
**Files modified:** `app/api/events/route.ts`, `components/dashboard/DashboardMorning.tsx`, `app/events/page.tsx` (or wherever the calendar screen renders)
**How to verify:** Open /events � upcoming events are sorted date ascending, past events are sorted date descending, never mixed. Dashboard morning shows max 2 upcoming events between the principle card and today's plan.

**The Prompt:**

```
Fix the LifeOS events calendar query and add an upcoming events widget to the morning dashboard.

--- PART 1: Fix app/api/events/route.ts ----------------------------------------

Replace the existing events GET query with two separate queries:

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [upcomingEvents, pastEvents] = await Promise.all([
    EventBlock.find({ date_end: { $gte: todayStart } })
      .sort({ date_start: 1 })
      .lean(),
    EventBlock.find({ date_end: { $lt: todayStart } })
      .sort({ date_start: -1 })
      .lean(),
  ]);

  return NextResponse.json({ upcoming: upcomingEvents, past: pastEvents });

Why date_end not date_start: A multi-day event that started yesterday but ends tomorrow is still upcoming.
Why ascending for upcoming, descending for past: next event first; most-recent past event first.

--- PART 2: Fix the Calendar screen component -----------------------------------

Find the component that renders the /events or calendar page. Update it to:
  1. Consume { upcoming, past } from the API response (not a flat list).
  2. Render two sections in this order:
       UPCOMING EVENTS  (date ascending � already sorted by API)
       PAST EVENTS      (date descending � already sorted by API)
  3. Each section heading should be clear: "Upcoming Events" / "Past Events".
  4. Empty state per section: if upcoming is empty, show "No upcoming events." If past is empty, show nothing (omit the past section entirely).
  5. Never mix upcoming and past events in the same list.

--- PART 3: Add Upcoming Events widget to DashboardMorning.tsx -----------------

In components/dashboard/DashboardMorning.tsx:

  1. Fetch upcoming events:
       const { data: eventsData } = useSWR<{ upcoming: IEventBlock[]; past: IEventBlock[] }>('/api/events', fetcher);
       const upcomingEvents = eventsData?.upcoming?.slice(0, 2) ?? [];

  2. Add an IEventBlock type import from models/EventBlock.ts or define inline:
       type IEventBlock = { _id: string; title: string; date_start: string; date_end: string; emoji?: string; };

  3. Compute "days until" helper:
       function daysUntil(dateStr: string): number {
         const today = new Date(); today.setHours(0,0,0,0);
         const d = new Date(dateStr); d.setHours(0,0,0,0);
         return Math.round((d.getTime() - today.getTime()) / 86400000);
       }

  4. Insert the Upcoming Events widget BETWEEN the PrincipleCard and the Today's Plan section.
     Only render the widget when upcomingEvents.length > 0. If empty, render nothing (no empty widget).

     Widget structure (Tailwind):
       <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
         <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Upcoming</p>
         {upcomingEvents.map(ev => {
           const days = daysUntil(ev.date_start);
           const label = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
           return (
             <div key={ev._id} className="flex items-center gap-2 text-sm text-zinc-200">
               <span>{ev.emoji ?? '??'}</span>
               <span className="flex-1 truncate">{ev.title}</span>
               <span className="text-xs text-zinc-400 shrink-0">{label}</span>
             </div>
           );
         })}
       </div>

  5. For same-day events (days === 0): the label shows "today" � same widget, no special section needed.
     The "TODAY" distinction from the product spec is handled by the label text, not a separate widget.

  6. Do NOT change any other section of DashboardMorning.tsx. Do NOT touch DashboardEvening.tsx.

Run npx tsc --noEmit � confirm 0 errors.
```

---

### Phase 5 / Step 3 � Bug 4: Skip Count Logic for Queue Topics

**What it does:** Replaces the broken skip-to-dead-end behavior with a reversible skip_count system. Skipped topics stay pending and resurface naturally.
**Files modified:** `models/TopicItem.ts`, `app/api/queues/[queue_id]/items/[item_id]/route.ts`, `components/queues/QueueItemList.tsx` or wherever the skipped view renders
**How to verify:** Skip a topic ? it stays in pending, skip_count = 1. Skip again ? skip_count = 2. Topics with skip_count >= 3 show a ?? indicator. Skipped section shows filtered pending items with skip_count > 0.

**The Prompt:**

```
Implement skip_count logic for queue topic items in LifeOS.

--- PART 1: Update models/TopicItem.ts -----------------------------------------

Add two new fields to the TopicItem Mongoose schema and TypeScript interface:
  skip_count:      { type: Number, default: 0 }
  last_skipped_on: { type: String, default: null }  // ISO date string YYYY-MM-DD

Update the ITopicItem interface to include:
  skip_count: number;
  last_skipped_on: string | null;

Do NOT change any existing fields.

--- PART 2: Update the skip PATCH handler ---------------------------------------

In app/api/queues/[queue_id]/items/[item_id]/route.ts (the PATCH handler):

When action === 'skip':
  OLD behavior (remove): moving item to a "skipped" status bucket.
  NEW behavior:
    1. Keep status as 'pending' � do NOT change it to 'skipped'.
    2. Increment skip_count by 1:
         await TopicItem.findByIdAndUpdate(item_id, {
           $inc: { skip_count: 1 },
           $set: { last_skipped_on: new Date().toISOString().split('T')[0] },
         });
    3. Move the item to the END of the pending queue (sort_order = max existing sort_order + 1).
       Find: const maxOrder = await TopicItem.findOne({ queue_id, status: 'pending' }).sort({ sort_order: -1 }).lean();
       Set: sort_order = (maxOrder?.sort_order ?? 0) + 1
    4. The next in_progress item: do NOT auto-advance. The queue engine surfaces the next pending item on next load.

--- PART 3: Update the Skipped view in the Queue UI ----------------------------

In the queue item list component (components/queues/QueueItemList.tsx or the relevant component):

  1. The "Skipped" filter/tab should query for: pending items where skip_count > 0.
     Do NOT maintain a separate "skipped" status � just filter pending by skip_count > 0.

  2. Each skipped item shows a warning badge:
       skip_count === 1 ? "? skipped 1 time"
       skip_count >= 2 ? "? skipped {N} times"

  3. In the full pending list, items with skip_count >= 3 show a subtle visual indicator:
       Add a small amber dot or "?" icon next to the title. Keep it subtle � not aggressive.

  4. Tapping a skipped item in the skipped view offers two actions:
       [Mark Done]         ? sets status = 'covered', covered_on = today
       [Move to Top]       ? sets sort_order = 0 (or min existing - 1), brings it to top of pending queue for tomorrow

  5. Remove any UI or code that sets status to the literal string 'skipped'.
     Replace all status === 'skipped' checks with: status === 'pending' && skip_count > 0

Run npx tsc --noEmit � confirm 0 errors.
```

---

### Phase 5 / Step 4 � Bug 3: Night Check-In Without a Generated Plan

**What it does:** Makes the night check-in functional even when no plan was generated that day. Challenge progress is never auto-cleared. Check-in shows a manual challenge completion section when no plan exists.
**Files modified:** `app/api/log/checkin/route.ts`, `components/checkin/CheckInForm.tsx`, `models/DailyPlan.ts` (if plan absence check is there)
**How to verify:** Without generating a plan, open /checkin ? form loads, shows "No plan generated today" message ? shows active challenges with Done/Skip toggles ? submitting updates challenge progress correctly.

**The Prompt:**

```
Fix LifeOS night check-in so it works correctly when no daily plan was generated.

--- PART 1: Never auto-clear challenge progress ---------------------------------

Search the entire codebase for any logic that resets, clears, or skips challenge progress when:
  - No DailyPlan exists for today
  - plan_generated === false or similar flag
  - Daily plan entries array is empty

Remove or disable that auto-clear logic entirely.
Challenge progress (streak, completed_days, status) should ONLY change when the user explicitly acts on it.

--- PART 2: Update app/api/log/checkin/route.ts ---------------------------------

The check-in POST handler currently assumes a daily plan exists. Make it plan-optional:

  1. Fetch today's DailyPlan (if any):
       const todayStr = new Date().toISOString().split('T')[0];
       const dailyPlan = await DailyPlan.findOne({ date: todayStr }).lean();
       const hasPlan = !!dailyPlan;

  2. If hasPlan: process entries as before (mark tasks done, mark queue topics covered, etc.)

  3. If !hasPlan: skip the plan-entry processing block entirely. Do NOT error out.

  4. Always process challenge updates regardless of hasPlan:
       For each challenge_entry in req.body.challenge_updates:
         { challenge_id, action: 'done' | 'skip' }
         If action === 'done': increment challenge.completed_days, update streak, check if target_days reached.
         If action === 'skip': log the skip but do NOT reset streak or progress.

  5. The response always returns { success: true, stats: { ... } } � never 404 due to missing plan.

--- PART 3: Update components/checkin/CheckInForm.tsx --------------------------

  1. Detect plan absence:
       const hasPlan = !!checkInData?.plan_entries?.length;  // or from API response flag

  2. When !hasPlan, show this section ABOVE the energy/mood section:

       <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
         <p className="text-sm font-semibold text-zinc-200">No plan was generated today.</p>
         <p className="text-xs text-zinc-400">Did you complete any active challenges?</p>
         {activeChallenges.map(challenge => (
           <div key={challenge._id} className="flex items-center justify-between">
             <span className="text-sm text-zinc-200 flex items-center gap-2">
               <span>{challenge.emoji}</span> {challenge.title}
             </span>
             <div className="flex gap-2">
               <button onClick={() => setChallengeAction(challenge._id, 'done')}
                 className={`text-xs px-3 py-1 rounded-full border transition-colors
                   ${challengeActions[challenge._id] === 'done'
                     ? 'bg-emerald-500 border-emerald-500 text-white'
                     : 'border-zinc-600 text-zinc-400 hover:border-emerald-500'}`}>
                 Done
               </button>
               <button onClick={() => setChallengeAction(challenge._id, 'skip')}
                 className={`text-xs px-3 py-1 rounded-full border transition-colors
                   ${challengeActions[challenge._id] === 'skip'
                     ? 'bg-zinc-700 border-zinc-600 text-zinc-400'
                     : 'border-zinc-600 text-zinc-400'}`}>
                 Skip
               </button>
             </div>
           </div>
         ))}
       </div>

  3. Fetch active challenges:
       const { data: challengesData } = useSWR<{ challenges: IChallenge[] }>('/api/challenges', fetcher);
       const activeChallenges = challengesData?.challenges?.filter(c => c.status === 'active') ?? [];

  4. State for challenge actions:
       const [challengeActions, setChallengeActionsMap] = useState<Record<string, 'done' | 'skip' | undefined>>({});
       function setChallengeAction(id: string, action: 'done' | 'skip') {
         setChallengeActionsMap(prev => ({ ...prev, [id]: prev[id] === action ? undefined : action }));
       }

  5. On form submit: include challenge_updates in the POST body:
       challenge_updates: Object.entries(challengeActions)
         .filter(([, action]) => action !== undefined)
         .map(([challenge_id, action]) => ({ challenge_id, action }))

  6. When hasPlan is true: keep existing behavior � no challenge section shown, existing plan entries shown as normal.

  7. The submit button shows and works in both cases (plan present or absent).

Run npx tsc --noEmit � confirm 0 errors.
```

---

### Phase 5 / Step 5 � Bug 1: Queue Topic Completion Counting in Dashboard

**What it does:** Makes queue topics stored in daily_plans count as completable tasks. Dashboard stats count ALL done entries regardless of task_id.
**Files modified:** `models/DailyPlan.ts`, `app/api/log/checkin/route.ts`, `app/api/dashboard/morning/route.ts` or wherever dashboard stats are computed
**How to verify:** Complete a queue topic in check-in ? dashboard completion counter increments. topic_items[topic_item_id].status = 'covered' after check-in.

**The Prompt:**

```
Fix queue topic completion counting in LifeOS daily plan and dashboard stats.

--- PART 1: Update models/DailyPlan.ts -----------------------------------------

The plan_entries array subdocument schema needs two new optional fields:
  topic_item_id: { type: String, default: null }   // links to topic_items collection
  type:          { type: String, default: 'task', enum: ['task', 'queue_topic', 'recharge'] }

Update the IPlanEntry TypeScript interface to include:
  topic_item_id?: string | null;
  type: 'task' | 'queue_topic' | 'recharge';

Existing entries without a type default to 'task' � no migration needed.

--- PART 2: Update daily plan generation to store queue topics correctly --------

Find where daily plan entries are created (likely app/api/plans/generate/route.ts or lib/scheduler/).
When a queue topic item is added to the day's plan, store it as:
  {
    task_id: null,
    topic_item_id: item._id.toString(),
    title: item.title,
    pillar: queue.pillar,         // from the parent TopicQueue
    type: 'queue_topic',
    status: 'pending',
    duration_min: 20,             // default study block
  }
Do NOT generate a fake task_id. Leave task_id as null.

--- PART 3: Update app/api/log/checkin/route.ts ---------------------------------

In the post-save check-in logic that processes plan entries:

After processing task entries (type === 'task'), add:
  for (const entry of planEntries) {
    if (entry.type === 'queue_topic' && entry.status === 'done' && entry.topic_item_id) {
      // Mark the topic item as covered
      await TopicItem.findByIdAndUpdate(entry.topic_item_id, {
        $set: {
          status: 'covered',
          covered_on: todayStr,
        },
      });

      // Advance the queue: set the next pending item in the same queue to in_progress
      const coveredItem = await TopicItem.findById(entry.topic_item_id).lean();
      if (coveredItem) {
        const nextItem = await TopicItem.findOne({
          queue_id: coveredItem.queue_id,
          status: 'pending',
        }).sort({ sort_order: 1 }).lean();
        if (nextItem) {
          await TopicItem.findByIdAndUpdate(nextItem._id, { $set: { status: 'in_progress' } });
        }
      }
    }
  }

--- PART 4: Fix dashboard completion stats --------------------------------------

Find where dashboard completion stats are computed. It may be in:
  app/api/dashboard/morning/route.ts
  app/api/dashboard/evening/route.ts
  or a shared lib/stats utility.

Find the query or calculation that counts completed tasks for today. It likely looks like:
  OLD: plan.plan_entries.filter(e => e.task_id && e.status === 'done').length

Replace with:
  NEW: plan.plan_entries.filter(e => e.status === 'done').length
       // Count ALL done entries � task, queue_topic, recharge � regardless of task_id

Also update the total count:
  OLD: plan.plan_entries.filter(e => e.task_id).length
  NEW: plan.plan_entries.length

Do this in EVERY place completion ratio is calculated, not just one.

--- PART 5: Update completion percentage display --------------------------------

If the dashboard shows a completion percentage (e.g. "3 / 5 tasks done"):
  Ensure it uses the updated counts from Part 4.
  The label can change from "tasks done" to "done today" since it now includes queue topics.

Run npx tsc --noEmit � confirm 0 errors.
```

---

### Phase 5 / Step 6 � Final Verification

**The Prompt:**

```
Final Phase 5 verification for LifeOS bug fix sprint.

Run: npx tsc --noEmit
Run: npx jest tests/checkin/ tests/events/ tests/queues/ tests/challenges/

Fix any TypeScript errors or failing tests before reporting done.

Manual checklist:
  Bug 5 � Modal:
    1. Open any challenge ? tap activate/start ? modal is centered on screen.
    2. Scroll inside the modal if content is tall ? the CTA button is always reachable.

  Bug 2 � Calendar + Events Widget:
    3. /events page: "Upcoming Events" section shows events with date_end >= today, sorted ascending.
    4. /events page: "Past Events" section shows events with date_end < today, sorted descending.
    5. No event appears in both sections.
    6. Dashboard morning: if 1-2 upcoming events exist, the widget shows between PrincipleCard and Today's Plan.
    7. Dashboard morning: if no upcoming events, the widget is completely hidden (no empty box).
    8. Today's event shows label "today" in the widget.

  Bug 4 � Skip Count:
    9. Skip a queue topic ? it stays in the pending list (status still 'pending').
    10. Skip again ? skip_count increments to 2, item moves to end of pending queue.
    11. Skip 3 times ? a subtle ? indicator appears next to it in the queue list.
    12. Skipped tab shows only pending items where skip_count > 0.
    13. "Mark Done" from the skipped view marks the item covered.
    14. "Move to Top" from the skipped view brings it to top of pending queue.

  Bug 3 � Check-In Without Plan:
    15. Without generating a plan today, open /checkin ? form loads without errors.
    16. "No plan was generated today" message appears.
    17. Active challenges are listed with Done/Skip toggles.
    18. Submit check-in ? challenge progress updates correctly.
    19. Challenge streak is NOT reset when no plan was generated.

  Bug 1 � Queue Topic Completion:
    20. Generate a plan that includes a queue topic.
    21. In night check-in, mark the queue topic as done.
    22. Submit check-in ? TopicItem in DB has status: 'covered', covered_on: today.
    23. Dashboard completion counter counts the covered queue topic as done.
    24. Completion ratio = (all done entries) / (all plan entries), not just task entries.

Report any remaining issues.
```
