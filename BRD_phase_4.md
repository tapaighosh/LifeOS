feature 1 - Principal Advice on Dashboard
This one I can answer directly — no questions needed.
My suggestion: don't randomize it completely.
Pure random means you might see the same advice twice in a week and miss others for months. Instead do daily rotation — one advice per day, cycling through the full list sequentially but shuffled at the start of each cycle. You see every advice once before any repeats.
Simple implementation:
principles collection
\_id
heading → "Do what you love"
body → "Passion is essential because..."
last_shown → date
show_order → integer (shuffled index)
On dashboard load, query: find principle where last_shown is oldest. Show it. Update last_shown to today. That's it.
Where on the dashboard: Between the greeting and today's plan. Morning only — not in the evening view. It sets the tone for the day, not the night.
Good morning, Ty Monday, 15 May

─── TODAY'S PRINCIPLE ──────────────────
Do what you love
Passion is essential because without it
discipline becomes punishment...
────────────────────────────────────────

─── TODAY'S PLAN ───────────────────────
Small, contained, not competing with the plan. Tap to expand if the body text is long.
New collection needed: principles — seeded with your 50–100 items. No connection to any other module. Completely standalone.

feature 2
it's one module — a personal notebook. No need to split it.
Here's my suggestion:

What This Actually Is
A lightweight notebook with two levels:
Notebook
→ Topics (folders you create)
→ Entries (dated notes inside each topic)
You create topics like:
💡 Ideas
📖 Learnings
💬 Quotes & Lines
🧠 Concepts I Get Now
✈️ Travel Thoughts
Inside each topic, every entry is dated and freeform. That's it. No complexity.

My Honest Suggestion — Four Default Topics, Rest User Created
Don't make it fully blank on first open. Seed four default topics that match how you actually think:
💡 Ideas → spontaneous ideas, any domain
📖 Learnings → things you studied and understood
💬 Lines → quotes, sentences that hit you
🔍 Observations → patterns you noticed about life, people, yourself
User can rename, delete, or add more. But having these four ready means you open the notebook and immediately know where to put something. A blank notebook gets abandoned.

Schema
Two collections:
notebook_topics
\_id
title
icon → emoji, user picks from small set
color → accent color for the card
entry_count → cached count, updates on write
last_entry_on → date, for sorting
created_at
pinned → true | false (pinned topics show first)

notebook_entries
\_id
topic_id
body → freeform text, no markdown needed, keep it simple
created_at → this is the date shown in the list
tags → [] optional, user adds if they want
source → optional (e.g. "from DSA study", "commute thought")
No rich text editor. Plain text only. The moment you add formatting options, it becomes a burden to write in. Keep it as close to a notes app as possible — just organized by topic.

The Screen
Topic list view:
📓 My Notebook [+ New Topic]

📌 Ideas 12 entries · yesterday
📌 Learnings 8 entries · today
Lines 5 entries · 3 days ago
Observations 2 entries · last week
Pinned topics always on top. Rest sorted by last entry date.
Inside a topic:
← Ideas [+ New Entry]

Today, 15 May
Got an idea for tracking habit energy
across the week as a heat map...

13 May
What if the challenge module showed
a "this week vs last week" comparison...

8 May
Side income idea — teach DSA basics
to juniors online, 2 hours a week...
Clean, date-wise, newest first. Each entry tappable to expand and edit.
Writing a new entry:
💡 Ideas — New Entry

[ ]
[ Write anything... ]
[ ]

Source (optional): ****\_\_\_****

[Save]
That's the entire writing flow. No title required — the date is the identifier. Body is mandatory, everything else optional.

Where It Lives in Navigation
You currently have:
Home | Tasks | Challenges | Insights | Settings
Notebook doesn't fit cleanly inside any of these. I'd suggest replacing the navigation with:
Home | Tasks | Challenges | Notebook | Settings
Move Insights inside Home as a tab or accessible from the dashboard directly. Notebook deserves its own nav spot because you'll use it daily — it's not a settings-level feature.
Alternatively if you want to keep 5 items clean:
Home | Tasks | Challenges | Insights | More
Where "More" opens a menu containing Notebook, Settings, and Principles list. But honestly that buries Notebook and you'll use it less.
My honest recommendation: give Notebook its own nav item. Drop Insights from the bottom nav, put it inside the Home dashboard as a "View full insights" link. You check insights weekly, you write notes daily.

Connection to the Rest of the App
One subtle connection worth building — when you complete a topic item in a queue and write notes, there's a shortcut:
✓ Covered: Cognitive Dissonance
[Save to Notebook →] ← optional, one tap
Tapping pre-fills a new Notebook entry in "Learnings" with the topic title as source. User just writes what they understood. This is the only connection between Notebook and the rest of the app — and it's optional, never forced.

What You DON'T Need

No search at launch — you have maybe 50 entries in the first month, you don't need search yet. Add it later.
No tags at launch — optional field in schema but don't build tag filtering now
No rich text — plain text only, faster to write, easier to build
No sharing — this is personal

New Collections Summary
notebook_topics → folders user creates
notebook_entries → dated entries inside each folder
Two new API routes:
GET/POST /api/notebook/topics
GET/POST /api/notebook/topics/[id]/entries
PATCH/DELETE /api/notebook/entries/[id]
Nothing in the existing system changes.

You now have a complete picture of every module:
ModulePurposeTasksDaily schedulingChallengesMulti-day commitments with progressTopic QueuesSequential learning — DSA, conceptsNotebookFreeform capture — ideas, learnings, quotesPrinciplesDaily wisdom on dashboardRechargeEnergy blocks in daily plan
