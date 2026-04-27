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
