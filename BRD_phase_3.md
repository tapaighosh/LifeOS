What These Actually Are
Psychology, Power, Money concepts (43 topics) — These are knowledge units. You read/study one, you understand it, you're done. Maybe you revise it later. There's no "Day 23 of 30" — it's either covered or not. This is not a challenge. This is not a recurring task.
30 DSA questions — These are practice problems with a goal (interviews). You solve one, mark it done, potentially revise it. Sequential, completable, revision-worthy.
Lifestyle topics (34 topics) — Same as Psychology/Power/Money. Knowledge units.
Total: 77 knowledge topics + 30 DSA problems = 107 items.

The Honest Problem
If you add all 107 as individual tasks, your task list becomes unmanageable overnight. You'll open the app, see 107 items, and feel paralyzed. That's the opposite of what LifeOS is supposed to do.
Also none of these fit neatly into your existing types:

Recurring task? No — "Learn the Dunning-Kruger Effect" is not something you do every Tuesday.
Challenge? No — there's no streak, no 30-day commitment, no milestone finish line.
One-time task? Closest — but 107 one-time tasks is a mess.
Recharge? Definitely not.


What I'd Actually Suggest — A New Concept: Topic Queue
Not a fourth task type bolted awkwardly onto existing schema. A lightweight module that works differently.
Here's the mental model:
Topic Queue → feeds one task at a time → into your daily plan
You never see all 107 topics at once. The system surfaces one or two per day based on your available slots and pillar balance. When you mark it done, it moves to "covered." You can flag it for spaced repetition. Next topic surfaces tomorrow.

How It Maps to Your Existing System
Each topic group becomes a Queue:
Queue 1: Psychology & The Mind (9 topics)     → Curiosity pillar
Queue 2: Power & Systems (9 topics)           → Curiosity pillar
Queue 3: Money & Wealth Logic (9 topics)      → Money pillar
Queue 4: Lifestyle Concepts (34 topics)       → Curiosity pillar
Queue 5: DSA Questions (30 problems)          → Money pillar
Each topic in the queue has:
_id
queue_id
title
order              → sequence within queue
status             → pending | in_progress | covered | skipped
covered_on         → date
revision           → true | false
next_revision      → date (uses your existing revision cycle)
notes              → user's own notes after studying
difficulty         → easy | medium | hard (user rates after completion)
When the daily plan generates, the AI prompt includes:
Active queues: Psychology (next: Cognitive Dissonance), DSA (next: Binary Search)
Suggest 1 topic task per free window if Curiosity/Money pillar needs attention
The plan generates a task like:
08:00  Study: Cognitive Dissonance     🧠 Curiosity   30min
This is a synthetic task — not stored in your tasks collection permanently. It's generated from the queue and appears in the plan for that day only.

DSA Is Slightly Different
DSA questions need a different treatment from concepts because:

They have difficulty levels that matter for sequencing
You solve them, not just read them
They need more time (30–45 min each, not 20)
Revision is more important — you forget how to solve them

DSA queue should also track:
approach_notes     → how you solved it (brief)
time_taken         → actual minutes spent
solved_without_hint → true | false
This gives you honest data for interview readiness. After 30 questions you can see: solved 24/30 independently, average 35 minutes, weak on array rotation problems.

What You DON'T Need to Build

No separate screen for individual topics
No 107 task cards
No manual scheduling of each topic
No challenge tracking for these (no streaks, no progress bars)

What you DO need:
Queue screen (under Tasks or its own nav item — your call):
📚 My Topic Queues

Psychology & Mind     3/9 covered   ████░░░░░░
Power & Systems       0/9 covered   ░░░░░░░░░░
Money & Wealth        1/9 covered   █░░░░░░░░░
Lifestyle Concepts    0/34 covered  ░░░░░░░░░░
DSA Problems          5/30 covered  █░░░░░░░░░

[+ New Queue]  ← for future topic lists you create
Tapping a queue shows the full list — covered in green, pending in white, current in highlight. No other interaction needed on this screen. The daily plan handles the actual scheduling.
In weekly/monthly review:
Topics covered this week: 4
DSA solved this week: 3
Queues active: 3
Revision due: 2 topics

New Collection Needed
topic_queues
_id
name
pillar
description
created_at
active

topic_items
_id
queue_id
title
order
status
covered_on
revision
next_revision
notes
difficulty
For DSA specifically, topic_items gets extra fields:
approach_notes
time_taken
solved_without_hint
One small change to your plan generation prompt — include next pending topic from each active queue as a candidate task. That's the only backend change touching existing systems.

Adding Items to an Existing Queue
Inside each queue's detail screen, at the bottom of the topic list, one button:
[+ Add Topic]
Tapping opens a small drawer — just two fields:
Title        → "Find longest common subsequence"
Difficulty   → Easy | Medium | Hard
That's it. No pillar selection (inherited from queue), no order (appended to end automatically), no extra configuration. It goes in as status: pending and joins the queue after the existing items.
For DSA specifically, when you're adding problems you also get:
Title        → problem name
Difficulty   → Easy | Medium | Hard
Same drawer, same simplicity.

One Edge Case Worth Handling
What if you want to add a topic and study it before finishing current pending items? Example — a new DSA problem type comes up in a mock interview and you want to prioritize it.
Two options:
Option A — Append only, strict order. Simple to build, no flexibility.
Option B — Append by default, but user can drag to reorder within the queue.
I'd suggest Option B. Reordering within a queue is a real need for DSA especially — interview coming up, you want specific problems first. It's not complex to build with a simple drag handle on each item.

Here's the complete updated spec for topic items so you have it in one place when you build:

Topic Item — Final Schema
_id
queue_id
title
order              → integer, used for sorting, updates on drag
status             → pending | in_progress | covered | skipped
covered_on         → date
revision           → true | false
next_revision      → date
notes              → user's notes after studying
difficulty         → easy | medium | hard

// DSA only
approach_notes     → how you solved it
time_taken         → actual minutes
solved_without_hint → true | false

Reorder API
One new route:
PATCH /api/queues/[queue_id]/reorder
body: { items: [{ id, order }] }
Receives the full reordered array with new order values, bulk updates in one MongoDB operation. Standard pattern — nothing exotic.

Queue Detail Screen Layout
DSA Problems                    5/30 covered

[Covered ✓]  [Pending]  [Skipped]   ← tabs

≡  Find maximum element          ✓ covered
≡  Count even/odd numbers        ✓ covered  
≡  Reverse a string              → in progress
≡  Check prime number            pending
≡  Fibonacci sequence            pending

                          [+ Add Topic]
The ≡ is the drag handle. Only pending and skipped items are reorderable — covered items are locked in place, they're history.

One Thing to Nail in the UX
When a topic moves from pending to in_progress, it means the daily plan surfaced it today. Only one item per queue should be in_progress at a time. When you mark it covered in the night check-in, the next pending item automatically becomes in_progress for tomorrow.
This way the queue always has a clear "current item" — you never wonder what to study next.