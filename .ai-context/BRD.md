LifeOS — Complete Technical BRD
Document Information
FieldDetailProduct NameLifeOS — Personal Operating SystemVersion1.0AuthorTyStackNext.js 14, MongoDB Atlas, Anthropic Claude APITypePersonal Productivity ApplicationDateApril 2026

1. Product Vision & Objectives
Vision Statement
A personal AI-powered life operating system that eliminates daily decision fatigue by intelligently scheduling every area of life — work, soul, and curiosity — into realistic, adaptive daily plans based on your actual constraints and energy.
Core Objectives

Eliminate the mental overhead of "what should I do today"
Ensure no pillar of life (Money / Soul / Curiosity) gets chronically neglected
Adapt automatically to spontaneous events and incomplete days
Learn from daily patterns to improve scheduling over time
Include recharge micro-breaks as first-class citizens in the schedule
Be flexible enough to hold any type of task, topic, or interest

Success Metrics (Personal)

Daily plan generated and followed at least 5 days/week
All 3 pillars touched at least 3 times/week each
Incomplete task backlog never exceeds 5 tasks
App opens every morning and every night consistently


2. User Profile
Single user application. No multi-tenancy required.
AttributeDetailWake time6:00 AM (variable)Leave home9:00 AMReturn home8:00 PMSleep time10:30–11:00 PMFree morning window6:00–9:00 AM (3 hours)Free evening window8:00–10:30 PM (2.5 hours)Total daily free time~5.5 hoursSpontaneous eventsTrekking, bike rides, travel, cooking experiments

3. Pillar System
The Three Pillars
Every task, interest, and goal in the app belongs to exactly one pillar. The pillar system is open — you can add any topic under any pillar. The three pillars are fixed.
💰 Money Making
Career growth, job performance, income-related learning. Examples: interview preparation, system design study, resume work, cloud certification, side project work.
🔥 For My Soul
Activities that restore and energise you. Examples: trekking, gym, bike riding, travel, cooking, walking, food exploration, rest.
🧠 For My Curiosity
Intellectual growth with no immediate monetary goal. Examples: AI/agent updates, reading, English speaking practice, caregiving courses, philosophy, history, any new subject.
Recharge Blocks (New Category)
Short 10–15 minute energy restoration breaks that are scheduled within the day like tasks — not as empty gaps. These are not breaks from the app, they are entries in the plan.
Examples: breathing exercise, short walk, tea + no screen, stretching, journaling, eyes closed rest, music listening.
Recharge blocks are:

Scheduled by AI between high-energy tasks
Never skipped in planning (at least 1 per free window)
Tracked in the night log like any other task
Capped at 15 minutes each, max 3 per day


4. Feature Specification
4.1 Task Management
Task Entity — Full Schema
Every task you add to the master list carries the following fields:
title           → Free text, any topic
pillar          → money | soul | curiosity
category        → Free text tag (e.g. "fitness", "career", "reading")
                  User defined, no fixed list
type            → recurring | one-time | project | recharge
duration        → 15 | 30 | 45 | 60 | 90 | 120 minutes
energy_cost     → high | medium | low
slot_preference → morning | evening | any
frequency       → daily | alternate | 3x_week | weekly | custom
revision        → true | false
revision_cycle  → [1, 3, 7, 14] days (spaced repetition)
priority        → 1–5 (AI uses this as weight)
notes           → optional free text
active          → true | false (soft delete)
created_at      → timestamp
Task Rules

No limit on number of tasks
Any topic is valid — the system does not validate category names
Recharge tasks are a separate type, always duration ≤ 15 min
Inactive tasks are hidden from planning but kept in history
Project tasks can be broken into subtasks (max 2 levels deep)

4.2 Daily Plan Generation (Morning Flow)
User opens app → hits "Generate My Day" button.
What happens server-side:
Step 1 — Collect Context
  → Fetch today's date and day of week
  → Check EventBlocks for today (trek/travel/ride/blocked)
  → Calculate available slots based on wake time input
  → Pull incomplete tasks from last 3 days
  → Pull today's recurring tasks (by frequency)
  → Pull revision queue (tasks due for spaced repetition today)
  → Fetch last 7 days energy ratings
  → Check pillar balance (which pillar was neglected this week)

Step 2 — Build AI Prompt
  → Summarise all above into a structured prompt
  → Include slot constraints (morning window, evening window)
  → Include recharge block instruction (min 1 per window)
  → Include energy pattern note
  → Request time-blocked output in JSON format

Step 3 — Call Claude API
  → Model: claude-sonnet-4-20250514
  → Temperature: 0.3 (consistent, not creative)
  → Response: JSON array of scheduled blocks

Step 4 — Validate & Store
  → Validate response structure
  → Fill gaps with rule-based fallback if needed
  → Save DailyPlan to MongoDB
  → Return to frontend

Step 5 — Display
  → Render time-blocked schedule
  → Show AI reasoning note (1–2 lines)
  → Allow drag-to-reorder before locking
AI Output Format (Expected JSON)
json{
  "date": "2026-04-27",
  "plan": [
    {
      "time_start": "06:00",
      "time_end": "06:15",
      "task_id": "recharge_001",
      "title": "Morning stretch + breathing",
      "pillar": "soul",
      "type": "recharge",
      "energy_cost": "low"
    },
    {
      "time_start": "06:15",
      "time_end": "07:15",
      "task_id": "task_abc123",
      "title": "System design study",
      "pillar": "money",
      "type": "recurring",
      "energy_cost": "high"
    }
  ],
  "ai_note": "Started with high-priority interview prep. Gym moved to evening — you completed it there last 3 Mondays.",
  "skipped_tasks": ["task_xyz"],
  "skip_reasons": ["Insufficient time after carrying 2 incomplete tasks"]
}
4.3 Spontaneous Event Handling
Event Types
trek          → Full day block. All tasks paused.
travel        → Multi-day block. Prep task auto-added 2 days before.
bike_ride     → Half day or full day. User specifies.
cooking_exp   → Evening block only.
rest_day      → All non-essential tasks stripped.
custom        → User defines duration and impact.
Rescheduling Logic
When a spontaneous day is added:

All displaced recurring tasks are distributed across next 3 available days
One-time tasks are pushed by 1 day only, then flagged if still incomplete
Revision tasks are rescheduled to the nearest valid revision window
Recharge tasks are not rescheduled — they regenerate daily

4.4 Night Check-In Flow
Triggered by notification or manual open after 9:00 PM.
Screen shows today's plan as checklist
  → Each task: Done / Partial / Skipped
  → Partial: slider for % completion (25 / 50 / 75)
  → Skipped: optional reason (tired / no time / forgot / spontaneous)

Energy rating: 1–5 tap (mandatory)

Free text reflection: optional, max 200 characters

Submit → AI processes log
  → Generates 2-line insight
  → Updates revision queue
  → Flags neglected pillars
  → Previews tomorrow (not final, just top 3 tasks)
4.5 Revision System (Spaced Repetition)
For any task marked revision: true, the system tracks:
learned_on          → date task was completed
next_revision       → learned_on + cycle[0] (day 1)
revision_history    → array of revision completion dates
cycle               → [1, 3, 7, 14] days
Each revision creates a lightweight task: "Revise: [original task title]" — 15–20 minutes, same pillar, low energy cost, any slot.
If a revision is missed, it stays in queue and is rescheduled. It does not disappear.
4.6 Weekly Review
Auto-surfaced every Sunday evening.
Content:

Pillar balance chart (% of completed tasks per pillar)
Completion rate for the week (%)
Longest streak per pillar
Energy trend (average per day)
Recharge block compliance
AI paragraph: one observation + one recommendation for next week
Option to adjust task frequencies or priorities based on learnings

4.7 Recharge Block Management
Recharge tasks live in their own sub-library:

User builds a personal recharge menu (any activity, any name, ≤15 min)
AI picks from this menu when inserting recharge blocks
User can mark a recharge as "favourite" — AI prioritises these
Recharge blocks appear in night check-in and count toward Soul pillar stats

Default recharge suggestions (user can rename or delete):

Morning stretch
Eyes closed rest
Short walk
Tea/coffee no-screen
Breathing exercise
Music listening
Journaling


5. Technical Architecture
5.1 Stack
Framework       → Next.js 14 (App Router)
Language        → TypeScript
Database        → MongoDB Atlas (cloud)
ODM             → Mongoose
AI              → Anthropic Claude API (claude-sonnet-4-20250514)
Auth            → NextAuth.js (single user, credentials provider)
Styling         → Tailwind CSS
State           → Zustand (client state), SWR (server state / caching)
Notifications   → Web Push API (PWA) or Vercel Cron for reminders
Hosting         → Vercel
Environment     → .env.local for secrets
5.2 Project Structure
/lifeOS
  /app
    /api
      /auth         → NextAuth routes
      /tasks        → CRUD for task master list
      /plan         → Generate, fetch, update daily plan
      /log          → Night check-in submission
      /events       → Spontaneous event management
      /recharge     → Recharge library management
      /insights     → Weekly review data
      /ai           → Internal AI orchestration (never public)
    /dashboard      → Today view (morning plan)
    /tasks          → Task management screen
    /calendar       → Event blocks, blocked dates
    /insights       → Weekly/monthly view
    /settings       → Time preferences, notification settings
    layout.tsx
    page.tsx

  /components
    /plan           → DayPlan, TaskBlock, RechargeBlock, PillarBadge
    /checkin        → NightCheckin, TaskCheckbox, EnergyRater
    /tasks          → TaskForm, TaskCard, TaskList
    /insights       → PillarChart, WeekSummary, StreakBadge
    /ui             → Button, Modal, Drawer, Toast, Skeleton

  /lib
    /db             → MongoDB connection, Mongoose setup
    /ai             → Claude prompt builder, response parser
    /scheduler      → Rule-based fallback scheduler
    /revision       → Spaced repetition logic
    /events         → Spontaneous day handler
    /utils          → Date helpers, slot calculators

  /models
    Task.ts
    DailyPlan.ts
    DayLog.ts
    EventBlock.ts
    RechargeItem.ts
    RevisionQueue.ts
    UserSettings.ts

  /hooks
    useToday.ts
    useTasks.ts
    usePlan.ts
    useCheckin.ts

  .env.local
  middleware.ts     → Auth guard on all routes
5.3 MongoDB Collections & Schemas
tasks
_id, title, pillar, category, type, duration,
energy_cost, slot_preference, frequency, revision,
revision_cycle, priority, notes, active, created_at, updated_at
daily_plans
_id, date (unique), plan[] {
  time_start, time_end, task_id, title,
  pillar, type, energy_cost, status
},
ai_note, skipped_tasks[], generated_at, locked (bool)
day_logs
_id, date (unique), entries[] {
  task_id, status (done|partial|skipped),
  completion_pct, skip_reason
},
energy_rating, reflection, ai_insight, submitted_at
event_blocks
_id, date_start, date_end, type, label,
impact (full|half|evening), prep_task_added (bool)
recharge_items
_id, title, duration, favourite, active, created_at
revision_queue
_id, task_id, original_title, learned_on,
next_revision, revision_history[], cycle_index
user_settings
_id, wake_time, sleep_time, leave_time, return_time,
notification_morning, notification_night, timezone,
pillar_balance_target {money, soul, curiosity}
5.4 API Routes Summary
MethodRoutePurposeGET/api/plan/todayFetch today's planPOST/api/plan/generateTrigger AI plan generationPATCH/api/plan/reorderSave manual reorderPOST/api/log/checkinSubmit night check-inGET/api/log/[date]Fetch a past logGET/api/tasksList all active tasksPOST/api/tasksCreate new taskPATCH/api/tasks/[id]Update taskDELETE/api/tasks/[id]Soft delete taskGET/api/eventsList event blocksPOST/api/eventsAdd spontaneous eventDELETE/api/events/[id]Remove event blockGET/api/rechargeList recharge itemsPOST/api/rechargeAdd recharge itemGET/api/insights/weeklyWeekly review dataGET/api/insights/pillarsPillar balance data
5.5 AI Layer Design
Prompt Architecture
The AI layer lives entirely in /lib/ai/. The frontend never calls Claude directly. All prompts are built server-side in Next.js API routes.
/lib/ai/
  promptBuilder.ts    → Assembles context into structured prompt
  responseParser.ts   → Validates and parses Claude JSON response
  fallback.ts         → Rule-based scheduler if AI unavailable
  insights.ts         → Prompt builder for night reflection
  weeklyReview.ts     → Prompt builder for Sunday summary
Morning Prompt Structure (What Gets Sent to Claude)
System:
You are a personal scheduling assistant. 
You receive a user's tasks, time slots, and history.
You return ONLY valid JSON — no explanation, no markdown.
Follow the exact schema provided.

User:
Date: Monday, 27 April 2026
Free slots: 06:00–09:00, 20:00–22:30
Energy last 3 days: [3, 4, 2]
Pillar this week: money(4 tasks), soul(1 task), curiosity(2 tasks)
Soul is neglected — prioritise at least 2 soul tasks today.

Incomplete from yesterday: [System Design Study - 60min - high]
Revision due today: [Revise: Redis Pub/Sub - 20min]

Available tasks:
[structured list with pillar, duration, energy, priority]

Recharge menu: [Morning stretch, Tea break, Short walk]

Rules:
- Insert at least 1 recharge block per free window
- Start morning with highest energy task
- Never schedule high energy tasks in last 30 min of a window
- Balance pillars across day
- Total scheduled time must not exceed available slot time

Return JSON in this exact schema: [schema]
Fallback Scheduler Logic (No AI)
1. Sort tasks by: priority DESC, energy DESC (morning), energy ASC (evening)
2. Fill morning window greedily until full
3. Fill evening window with remaining
4. Insert 1 recharge block at midpoint of each window
5. Any overflow → carry to next day

6. Security Implementation
Authentication

NextAuth.js with credentials provider
Single hardcoded user (personal app)
JWT session, 7-day expiry, refresh on activity
All /api/* routes protected via middleware.ts

Secrets Management
MONGODB_URI              → Atlas connection string
NEXTAUTH_SECRET          → Random 32-char string
ANTHROPIC_API_KEY        → Never exposed to client
NEXTAUTH_URL             → Your Vercel deployment URL
Data Protection

Reflection text encrypted before MongoDB write (AES-256 via crypto module)
Claude API key only used in server-side API routes
No analytics, no third-party tracking
MongoDB Atlas IP whitelist: Vercel IP ranges only


7. UX Flow Summary
MORNING
Open App → Dashboard shows "Good morning, Ty"
→ If plan exists: show it
→ If not: single CTA button "Generate My Day"
→ Plan renders as time-blocked list
→ Drag to reorder if needed → Lock Plan
→ Day begins

DURING DAY
→ App is passive. Optional mid-day check (mark tasks done)
→ "Something came up" button → add spontaneous event
→ App recalculates remaining evening tasks

NIGHT (9:30 PM trigger)
→ Open check-in screen
→ Tap Done / Partial / Skipped per task
→ Rate energy 1–5
→ Optional reflection note
→ Submit → see AI insight + tomorrow preview

SUNDAY EVENING
→ Weekly review auto-loads
→ Pillar balance chart
→ AI weekly paragraph
→ Adjust task weights if needed

8. Edge Cases & Error Handling
ScenarioHandlingClaude API downFallback rule-based scheduler, toast notificationWoke up lateUser inputs actual wake time → slots recalculated before generationAll 3 days incomplete tasksAI capped to 3 carryovers max, rest deferred to next weekNo tasks in a pillarWarning shown on dashboard, prompt to add tasksSpontaneous event same morning"Something came up" regenerates evening onlyRevision queue > 5 todayCap at 3, defer others by 1 dayMongoDB write failRetry 3x, then local storage fallback, sync on next loadEnergy rated 1 for 3 daysAI strips high-energy tasks, suggests rest dayTravel multi-dayAll days blocked, recurring tasks paused, one prep task auto-created

9. Deployment Strategy
Hosting

Frontend + API routes → Vercel (free tier sufficient)
Database → MongoDB Atlas M0 free tier (512MB, plenty for personal use)

Environments
local     → localhost:3000, local .env.local
production → Vercel + Atlas production cluster
Deployment Pipeline
Push to GitHub main branch
→ Vercel auto-deploys
→ Environment variables set in Vercel dashboard
→ Atlas connection string whitelisted
Backup

MongoDB Atlas automated daily backups (enabled by default on M0)
Weekly manual export via Atlas UI or mongoexport cron

Maintenance

Anthropic API cost cap: set $10/month limit on dashboard
Vercel usage: well within free tier for personal app
Monthly: review task list, update frequencies, prune stale tasks


10. Development Phases
Phase 1 — Foundation (Week 1–2)

Next.js project setup, MongoDB connection, auth
Task CRUD (all fields), settings page
Recharge library management

Phase 2 — Core Loop (Week 3–4)

Daily plan generation (rule-based first, no AI yet)
Morning view with time blocks
Night check-in flow
Event blocks and calendar

Phase 3 — AI Integration (Week 5–6)

Claude API integration in plan generation
Night reflection AI insight
Fallback scheduler as safety net

Phase 4 — Intelligence (Week 7–8)

Spaced repetition revision system
Pillar balance tracking
Weekly review screen
Pattern learning in prompt context

Phase 5 — Polish (Week 9–10)

PWA setup (installable on phone)
Push notifications (morning + night)
Insights charts
Performance optimisation


11. Out of Scope (Version 1.0)

Multi-user support
Social or sharing features
Native mobile app (PWA covers this)
Calendar sync (Google Calendar, etc.)
Voice input
Gamification / points system
Paid features or subscription logic

