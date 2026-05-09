A task in your current system is a single unit — it has frequency, duration, priority, and gets scheduled. It has no concept of "I am part of a 30-day commitment" or "I am on Day 23 of 30" or "I failed 3 days this week, does that break my streak?"
A challenge is a container that lives above tasks. It owns progress, streaks, start date, target, and completion state. Tasks are what it generates daily or weekly into your plan.
If you force this into the existing task schema, you'll hack it badly and regret it.

How the Two Connect
Challenge (container)
    ↓ generates
Task (the schedulable unit your existing system already handles)
A challenge creates one recurring task in your existing tasks collection. That task has a challenge_id field linking it back. Your existing scheduler, plan generation, night check-in — they all see it as a normal task. Nothing in your core loop changes.
The challenge module only adds: progress tracking, streak counting, and the challenges screen.

New Data Model
New collection — challenges (your personal library of active challenges):
_id
title                → "Cold water immersion for 30 consecutive days"
category             → Physical | Mental | Financial | Social | Creative
description          → what the challenge is about
target_type          → streak | total_count | milestone
                       streak = must be consecutive (cold water, meditation)
                       total_count = cumulative (12 books, 10,000 steps x90)
                       milestone = one-time completion (climb a mountain)
target_value         → 30 (days) | 12 (books) | 90 (days) | 1 (summit)
started_on           → date user accepted challenge
status               → active | completed | dropped | paused
linked_task_id       → _id of the Task it created in your tasks collection
current_streak       → Number (only relevant for streak type)
best_streak          → Number
total_completed      → Number (increments each time linked task is marked done)
last_completed_on    → date
notes                → optional
One new field added to your existing Task schema:
challenge_id         → ObjectId | null (null for all existing tasks)
That's the only change to your existing system.

The Three Challenge Types (Based on Your List)
This is important — your 50 challenges are not all the same shape.
Streak type — must be consecutive days, breaking it matters:

Cold water immersion 30 consecutive days
Meditate 30 consecutive days
Journal every morning 90 days
10,000 steps daily 90 days
Week without social media

Total count type — cumulative, missing a day doesn't break it:

12 books in a year
Learn 10 meals from scratch
Memorize 10 poems
Walk 10,000 steps daily 90 days (could go either way — you decide)

Milestone type — single completion event:

Climb a mountain and reach summit
Fast for 24 hours
Run 5km without stopping
Spend a full day alone in silence
Complete 100 push-ups in one session

Why this matters: your streak logic, progress bar calculation, and "did I fail this challenge" logic all depend on which type it is. A missed day in a streak challenge is a reset. A missed day in a total count challenge is just a missed day.

Auto-Generated Task — How It Works
When user accepts a challenge, the system creates a Task automatically:
js{
  title: "Cold water immersion",
  pillar: "soul",              // user confirms this at acceptance
  type: "recurring",
  duration: 15,
  energy_cost: "medium",
  frequency: "daily",          // user can change to 3x_week etc
  challenge_id: challenge._id, // the link back
  active: true
}
User can edit everything about this task — frequency, duration, slot preference — after creation. The only thing they cannot do is delete it without dropping the challenge. If they soft-delete the task, the challenge auto-pauses.
For challenges where daily doesn't make sense — "learn 10 meals", "memorize 10 poems" — the auto-generated task uses weekly frequency. User adjusts from there.

The Challenges Screen
Three sections:
Active Challenges — cards showing:

Challenge title and category
Progress bar (Day 23 of 30 / 8 of 12 books / streak: 14 days)
Current streak and best streak (for streak type)
Last completed date
Tap to see full detail

Challenge Library — your 50 pre-seeded challenges grouped by category. Each one shows a description and a single "Accept Challenge" button. Accepting triggers task creation flow.
Completed — archive of finished challenges with completion date and stats.

Progress Tracking — How It Actually Updates
This is the part that connects back to your existing night check-in.
When user marks the linked task as done in the night check-in, a post-save hook fires:
find challenge where linked_task_id = this task_id
→ increment total_completed
→ update last_completed_on = today
→ if streak type:
    if last_completed_on was yesterday → increment current_streak
    if last_completed_on was before yesterday → reset current_streak to 1
    update best_streak if current_streak > best_streak
→ if total_completed >= target_value → mark challenge completed
If task is marked skipped or partial:

Total count: no increment
Streak: reset current_streak to 0 (for streak type only)
Partial on a streak challenge — you decide: does 50% completion count? I'd say no for streak, yes for total count.


What Changes in Your Existing System
This is the complete list — nothing else touches:
WhatChangeTask schemaAdd challenge_id: ObjectId, default nullNight check-in post-saveAdd hook to update challenge progressTask soft-deleteCheck if challenge_id exists → pause challenge if soNavigationAdd Challenges screen linkWeekly reviewAdd "Active challenges this week" section
Your plan generation, AI prompt, scheduler, revision system — none of it changes. The challenge task appears in the daily plan exactly like any other recurring task. The AI doesn't even need to know it's a challenge task.

What I'd Build First

The challenges collection and model
The pre-seeded library (your 50 tasks, categorized and typed)
Accept challenge flow → auto task creation
The hook in night check-in that updates progress
The challenges screen with progress cards
Library browser with category filter

Navigation First — This Is the Foundation
On mobile (PWA), sidebar doesn't work well. On desktop it does. Since you're building a PWA that lives on your phone, I'd suggest a bottom navigation bar with 5 items:
Home | Tasks | Challenges | Insights | Settings
On desktop/tablet the same 5 items move to a left sidebar. One navigation system, two layouts. NextAuth already guards all routes via middleware so nothing extra needed here.
Every feature you have connects through this:
Nav ItemWhat It HoldsHomeDashboard — today's plan, streaks, pillar healthTasksFull task master list, add/edit tasksChallengesChallenge library, active challenges, progressInsightsWeekly review, pillar charts, energy trend, monthly viewSettingsWake time, pillar labels, recharge library, notification times

Dashboard Layout — Morning vs Evening
Morning View (before 12pm)
Good morning, Ty                    [Day + Date]

─── TODAY'S ENERGY FORECAST ────────────────
  Based on last 3 days: moderate
  Suggestion: Start with Money task

─── TODAY'S PLAN ────────────────────────────
  [Generate My Day] ← if not generated yet
  
  06:00  Morning stretch         🔥 Soul
  06:15  System design study     💰 Money
  07:15  Tea break — no screen   🔥 Soul
  ...
  
  [+ Add to Today]  ← always visible button

─── ACTIVE CHALLENGES ───────────────────────
  🔥 Cold water immersion   Day 14/30  ████░░
  🧠 30 days meditation     Day 8/30   ███░░░
  
  → View all challenges

─── THIS WEEK'S PILLARS ─────────────────────
  💰 Money      ████░░  4 tasks
  🔥 Soul       ██░░░░  2 tasks  ⚠ neglected
  🧠 Curiosity  ███░░░  3 tasks
Evening View (after 9pm)
Good evening, Ty                    [Day + Date]

─── NIGHT CHECK-IN ──────────────────────────
  [Start Check-In] ← prominent CTA

─── TODAY'S SUMMARY ─────────────────────────
  Completed  4/7 tasks
  Energy so far: not rated yet

─── CHALLENGE WINS TODAY ────────────────────
  ✓ Cold water immersion — streak continues
  ✗ Meditation — not done yet (in check-in)

─── TOMORROW PREVIEW ────────────────────────
  Top 3 tasks lined up:
  · System design study
  · Gym
  · AI reading
The switch between morning and evening is purely time-based — check current time on dashboard load, render accordingly. No user toggle needed.

The "+ Add to Today" Button — This Is Important
This is the free time feature you mentioned. It sits permanently at the bottom of today's plan section. Tapping it opens a drawer with three tabs:
Tab 1 — From Your Tasks
List of all active tasks not already in today's plan. User taps one, picks a time slot, it gets added to today's DailyPlan document. No AI involved — direct insert.
Tab 2 — From Your Challenges
Shows active challenges with their linked task. Same flow — tap, pick slot, added to today. Also marks challenge progress if completed in night check-in.
Tab 3 — Quick Add
Freeform — title, duration, pillar. Creates a one-time task and adds it directly to today. Doesn't go into master task list unless user explicitly saves it.
This covers your exact scenario — you get free time, you open the drawer, you pick something meaningful, it's in the plan.

Challenge Cards on Dashboard
Show maximum 3 active challenges on the dashboard. Order by: streak challenges first (most motivating to maintain), then total count, then milestone.
Each card:
🏔 Cold water immersion
Day 14 of 30    ██████████░░░░░░░░░░  47%
Streak: 14 days  Best: 14 days
Tapping any card or "View all challenges" goes directly to the Challenges screen. The dashboard never tries to be the full challenge view — it's just the hook that pulls you in.
If you have 0 active challenges, that section shows: "No active challenges. Pick one →" linking to the library.

Pillar Health Widget
Three bars, always visible in morning view. The neglected pillar gets a subtle warning indicator — not aggressive, just enough to notice. This pulls from the same pillar balance data your weekly review already calculates. No new backend work needed, just a new frontend component reading existing data.

What Needs to Be Built — Complete List
New components:

BottomNav / SidebarNav (responsive)
DashboardMorning and DashboardEvening (time-switched)
AddToTodayDrawer with 3 tabs
ChallengeMiniCard (dashboard version)
PillarHealthBar (3 pillars, this week's count)
TomorrowPreview (evening only, top 3 tasks)

New API routes:

GET /api/dashboard/morning — aggregates today's plan + challenge summary + pillar week count in one call
GET /api/dashboard/evening — today's completion summary + tomorrow's top 3
PATCH /api/plan/add-task — adds a task to today's existing plan

No changes needed to:

Plan generation logic
Night check-in flow
AI prompt builder
Scheduler
Any existing API routes

Current Dashboard Priority Order
Based on everything we discussed, here's what to build in sequence — don't do it all at once:
First:
Bottom navigation bar. Nothing else matters until all screens are connected. Right now your app is probably a collection of pages with no clean way to move between them.
Second:
Morning/evening time switch on the dashboard. Simple new Date().getHours() check. Before 12pm → morning layout. After 9pm → evening layout. Between 12–9pm → a neutral "during the day" view that just shows today's plan and the Add to Today button.
Third:
The "+ Add to Today" drawer. This is the most immediately useful thing for your daily usage right now — even before multi-user, even before challenges. You'll use this every day.
Fourth:
Challenge mini-cards on dashboard + redirect to challenge screen. Depends on challenge module being built first.
Fifth:
Tomorrow preview conditional on check-in submission. This is already partially built in your check-in flow — just needs to surface on the dashboard after submission.