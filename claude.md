# LifeOS — Claude Project Configuration

## Project Overview

LifeOS is a **personal AI-powered life operating system** built with Next.js 14 (App Router), TypeScript, MongoDB (Mongoose), and the Anthropic Claude API. It eliminates daily decision fatigue by intelligently scheduling tasks across three life pillars — Money 💰, Soul 🔥, and Curiosity 🧠 — into realistic, adaptive daily plans based on real constraints and energy levels.

## Architecture

- **Framework**: Next.js 14 (App Router) — Server Components by default, Client Components for interactivity
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB Atlas (production) / Local MongoDB (development) via Mongoose
- **AI Primary**: Anthropic Claude (`claude-sonnet-4-20250514`, temperature 0.3)
- **AI Fallback**: Google Gemini (`gemini-2.0-flash`)
- **AI Last Resort**: Rule-based fallback scheduler (no AI dependency)
- **Auth**: NextAuth.js with credentials provider (single user, multi-user planned)
- **Styling**: Tailwind CSS v3
- **State**: Zustand (client) + SWR (server data fetching/caching)
- **Hosting**: Vercel
- **Dev Tools**: Graphify (knowledge graph)

## Key Files to Reference

| Purpose | File |
|---------|------|
| Product overview | `.ai-context/project_context.md` |
| Technical architecture | `.ai-context/architecture.md` |
| Business requirements | `.ai-context/BRD.md` |
| Coding standards | `.agents/rules/production-standards.md` |
| Test scenarios | `.ai-context/test_cases.md` |
| Module prompts | `MODULE_PROMPTS.md` |
| Prompt history | `.ai-context/prompt_history.md` |

## Coding Conventions

### Must Follow
- TypeScript strict mode — no `any` types
- Server Components by default, `"use client"` only when needed
- Zod validation on ALL API inputs
- Structured JSON error responses: `{ error, code, details? }`
- Custom error classes from `/lib/errors.ts`
- Mongoose schemas with `timestamps: true` and proper indexes
- AI calls must NEVER block plan delivery — always have fallback
- Mobile-first responsive design with Tailwind breakpoints

### File Naming
- Pages: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Models: `PascalCase.ts`
- API routes: `route.ts` inside `/app/api/{resource}/`

### AI Layer Rules
- All AI prompts built server-side in `/lib/ai/` — frontend NEVER calls AI directly
- System prompt: strict instruction, no freeform
- Response: ALWAYS valid JSON, validated with Zod
- Temperature: 0.3 (planning), 0.7 (reflections)
- Fallback chain: Claude → Gemini → Rule-based scheduler
- Log every AI call: model, tokens, latency, success/failure

## Workflows

When asked to implement a feature, follow the `/module-implement` workflow in `.agents/workflows/module-implement.md`.

When asked to review code, follow the `/code-review` workflow in `.agents/workflows/code-review.md`.

When asked to generate tests, follow the `/generate-tests` workflow in `.agents/workflows/generate-tests.md`.

## Pillar Color System

- 💰 Money Making: amber/gold tones (`amber-500`, `yellow-600`)
- 🔥 For My Soul: rose/warm tones (`rose-500`, `red-400`)
- 🧠 For My Curiosity: blue/indigo tones (`blue-500`, `indigo-500`)
- ⚡ Recharge: emerald/green tones (`emerald-400`, `green-500`)

## Important Business Rules

1. Every task belongs to exactly ONE pillar (money | soul | curiosity)
2. Recharge blocks are tasks, not empty gaps — max 15 min, max 3/day, min 1 per window
3. Morning window: wake_time to leave_time (~3 hours)
4. Evening window: return_time to sleep_time (~2.5 hours)
5. Total daily free time: ~5.5 hours
6. AI must never schedule high-energy tasks in the last 30 min of a window
7. Incomplete task backlog capped at 3 carryovers from last 3 days
8. Spaced repetition cycle: [1, 3, 7, 14] days — missed revisions stay in queue
9. Weekly review auto-surfaces every Sunday evening
10. Single user now, but use userId in all queries to prepare for multi-user
