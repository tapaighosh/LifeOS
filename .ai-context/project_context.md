# LifeOS — Project Context

## Product Overview

**LifeOS** is a personal AI-powered life operating system that eliminates daily decision fatigue by intelligently scheduling every area of life — work, soul, and curiosity — into realistic, adaptive daily plans based on your actual constraints and energy.

**One-line pitch:** Stop wondering "what should I do today" — let AI plan your day across work, wellness, and growth, then adapt when life happens.

**Type:** Single-user personal productivity application (multi-user expansion planned).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Database** | MongoDB Atlas (production) / Local MongoDB (development) |
| **ODM** | Mongoose |
| **AI (Primary)** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **AI (Fallback)** | Google Gemini (`gemini-2.0-flash`) |
| **AI (Dev/Testing)** | Claude Haiku / Gemini Flash (cheaper iteration) |
| **Auth** | NextAuth.js (credentials provider, single user) |
| **Styling** | Tailwind CSS v3 |
| **Client State** | Zustand |
| **Server State** | SWR |
| **Notifications** | Web Push API (PWA — Phase 5) |
| **Hosting** | Vercel |
| **Knowledge Graph** | Graphify |

---

## The Three Pillars

Every task belongs to exactly one pillar. The pillar system is open (any topic under any pillar). The three pillars are fixed:

| Pillar | Emoji | Purpose | Examples |
|--------|-------|---------|----------|
| **Money Making** | 💰 | Career growth, income-related learning | Interview prep, system design, resume, certifications, side projects |
| **For My Soul** | 🔥 | Activities that restore and energise | Trekking, gym, bike riding, travel, cooking, walking, rest |
| **For My Curiosity** | 🧠 | Intellectual growth, no monetary goal | AI updates, reading, language practice, philosophy, history |

**Recharge Blocks** (⚡): 10–15 minute micro-breaks scheduled like tasks. At least 1 per free window, max 3 per day.

---

## Core Loop (Daily Workflow)

### Morning (6:00 AM)
1. Open App → "Good morning, Ty" → **Generate My Day** button
2. AI collects context: incomplete tasks, revision queue, pillar balance, energy history
3. AI generates time-blocked schedule → User reviews → Drag to reorder → Lock Plan

### During Day
- App is passive — optional mid-day check (mark tasks done)
- "Something came up" button → Add spontaneous event → Evening tasks recalculated

### Night (9:30 PM)
- Check-in screen: mark each task as Done / Partial / Skipped
- Rate energy 1–5 (mandatory)
- Optional reflection note (max 200 chars)
- Submit → AI insight + tomorrow preview

### Sunday Evening
- Weekly review auto-loads: pillar balance chart, completion rate, streaks, AI paragraph

---

## Module Breakdown

| # | Module | Phase | Description |
|---|--------|-------|-------------|
| 0 | Project Setup | 1 | Next.js app, MongoDB, NextAuth, design system |
| 1 | Task CRUD | 1 | Task master list with all BRD fields |
| 2 | Recharge Library | 1 | Recharge item management with favorites |
| 3 | User Settings | 1 | Time preferences, notification settings |
| 4 | Daily Plan Generation | 2 | Rule-based scheduler, morning view |
| 5 | Night Check-In | 2 | Check-in flow, energy tracking, AI insight |
| 6 | Event Blocks | 2 | Spontaneous events, rescheduling |
| 7 | AI Integration | 3 | Claude/Gemini plan generation with fallback |
| 8 | Spaced Repetition | 4 | Revision system with cycle tracking |
| 9 | Weekly Review | 4 | Insights, charts, AI weekly paragraph |
| 10 | PWA & Polish | 5 | Service worker, push notifications, deployment |

---

## Key Design Decisions

1. **Next.js 14 App Router** — Server Components by default, Client Components only for interactivity
2. **MongoDB over PostgreSQL** — Document model fits flexible task schemas and nested plan structures
3. **Single user first, multi-user later** — All queries use `userId` to prepare for expansion
4. **Dual AI provider** — Claude primary, Gemini fallback, rule-based as last resort
5. **AI as enhancement, not dependency** — Plans always generate even if AI is completely down
6. **Zustand + SWR** — Clean separation between UI state (Zustand) and server data (SWR)
7. **Tailwind CSS v3** — Rapid UI development with consistent design tokens
8. **Vercel deployment** — Zero-config deployment for Next.js
9. **Graphify** — Knowledge graph for agent-assisted development navigation
10. **Recharge blocks as first-class citizens** — Not gaps, but scheduled entries in the plan
