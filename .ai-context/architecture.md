# LifeOS — System Architecture

## MongoDB Collections & Schemas

### Collections Overview

| Collection | Key Fields | Indexes |
|-----------|-----------|---------|
| `tasks` | title, pillar, category, type, duration, energy_cost, slot_preference, frequency, revision, revision_cycle, priority, notes, active | `pillar`, `active`, `type` |
| `daily_plans` | date (unique), plan[], ai_note, source, skipped_tasks[], locked | `date` (unique) |
| `day_logs` | date (unique), entries[], energy_rating, reflection, ai_insight | `date` (unique) |
| `event_blocks` | date_start, date_end, type, label, impact, prep_task_added | `date_start`, `date_end` |
| `recharge_items` | title, duration, favourite, active | `active` |
| `revision_queue` | task_id, original_title, learned_on, next_revision, revision_history[], cycle_index | `next_revision`, `task_id` |
| `user_settings` | wake_time, sleep_time, leave_time, return_time, notification_morning, notification_night, timezone, pillar_balance_target, days_off | — |

### Task Schema Detail
```
title           → Free text
pillar          → money | soul | curiosity
category        → Free text tag (user defined)
type            → recurring | one-time | project | recharge
duration        → 15 | 30 | 45 | 60 | 90 | 120 minutes
energy_cost     → high | medium | low
slot_preference → morning | evening | any
frequency       → daily | alternate | 3x_week | weekly | custom
revision        → true | false
revision_cycle  → [1, 3, 7, 14] days
priority        → 1–5 (AI uses as weight)
notes           → optional free text
active          → true | false (soft delete)
```

### DailyPlan — Plan Entry Schema
```json
{
  "time_start": "06:00",
  "time_end": "06:15",
  "task_id": "ObjectId ref",
  "title": "Morning stretch",
  "pillar": "soul",
  "type": "recharge",
  "energy_cost": "low",
  "status": "pending | done | partial | skipped"
}
```

---

## Project Structure

```
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
      /settings     → User preferences
    /dashboard      → Today view (morning plan)
    /tasks          → Task management screen
    /calendar       → Event blocks, blocked dates
    /insights       → Weekly/monthly view
    /settings       → Time preferences
    /checkin        → Night check-in page
    layout.tsx
    page.tsx

  /components
    /plan           → DayPlan, TaskBlock, RechargeBlock, PillarBadge
    /checkin        → NightCheckin, TaskCheckbox, EnergyRater
    /tasks          → TaskForm, TaskCard, TaskList
    /insights       → PillarChart, WeekSummary, StreakBadge
    /calendar       → EventForm, EventCard, CalendarGrid
    /ui             → Button, Modal, Toast, Skeleton, Card

  /lib
    /db             → MongoDB connection singleton
    /ai             → Claude/Gemini prompt builder, response parser, model selector
    /scheduler      → Rule-based fallback scheduler
    /revision       → Spaced repetition logic
    /events         → Spontaneous day handler
    /validators     → Zod schemas
    /errors         → Custom error classes
    /utils          → Date helpers, slot calculators

  /models           → Mongoose schemas (Task, DailyPlan, DayLog, etc.)
  /hooks            → SWR hooks (useToday, useTasks, usePlan, etc.)
  /stores           → Zustand stores (planStore, taskStore, uiStore)
  /tests            → Jest/Vitest tests
```

---

## API Routes Summary

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/tasks` | List all active tasks |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Soft delete task |
| GET | `/api/plan/today` | Fetch today's plan |
| POST | `/api/plan/generate` | Trigger AI plan generation |
| PATCH | `/api/plan/reorder` | Save manual reorder |
| POST | `/api/log/checkin` | Submit night check-in |
| GET | `/api/log/[date]` | Fetch a past log |
| GET | `/api/events` | List event blocks |
| POST | `/api/events` | Add spontaneous event |
| DELETE | `/api/events/[id]` | Remove event block |
| GET | `/api/recharge` | List recharge items |
| POST | `/api/recharge` | Add recharge item |
| GET | `/api/insights/weekly` | Weekly review data |
| GET | `/api/insights/pillars` | Pillar balance data |
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update user settings |

---

## AI Layer Design

### Model Selection

```
AI_PROVIDER env var:
  "claude"     → Primary: claude-sonnet-4-20250514, Fallback: gemini-2.0-flash
  "gemini"     → Primary: gemini-2.0-flash, Fallback: claude-sonnet-4-20250514
  "claude-dev" → Claude Haiku (cheaper, for dev/testing)
  "gemini-dev" → Gemini Flash (cheaper, for dev/testing)

Fallback chain: Primary → Fallback → Rule-based scheduler
```

### AI Architecture
```
/lib/ai/
  modelSelector.ts    → Picks model based on env + availability
  promptBuilder.ts    → Assembles context into structured prompt
  responseParser.ts   → Validates AI JSON with Zod
  fallback.ts         → Rule-based scheduler
  insightBuilder.ts   → Night reflection prompt
  weeklyReview.ts     → Sunday summary prompt
```

### Fallback Scheduler Logic
```
1. Sort tasks by: priority DESC, energy DESC (morning), energy ASC (evening)
2. Fill morning window greedily until full
3. Fill evening window with remaining
4. Insert 1 recharge block at midpoint of each window
5. Overflow → carry to next day
```

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lifeos

# Auth
NEXTAUTH_SECRET=your-random-32-char-string
NEXTAUTH_URL=http://localhost:3000

# AI — Primary
ANTHROPIC_API_KEY=sk-ant-your-key

# AI — Fallback
GOOGLE_AI_API_KEY=your-gemini-key

# AI — Model Selection
AI_PROVIDER=claude

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
