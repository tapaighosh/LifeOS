---
description: Step-by-step workflow to implement any BRD module for LifeOS
---

# Module Implementation Workflow

Use this workflow when implementing any of the 10 LifeOS modules. Follow every step in order.

## Prerequisites
- Read `.ai-context/BRD.md` — understand the full module specification
- Read `.ai-context/architecture.md` — understand the database schemas and API design
- Read `.agents/rules/production-standards.md` — ensure all code matches standards
- Read `.ai-context/test_cases.md` — know the test scenarios for this module

## Steps

### Step 1 — Understand the Module
1. Read the specific module section from `.ai-context/BRD.md`
2. List all functional requirements for this module
3. Identify dependencies on other modules (check the dependency graph)
4. Confirm any open questions with the user before proceeding

### Step 2 — Mongoose Models
1. Create or update Mongoose models in `/models/`
2. Ensure schemas define `timestamps: true`
3. Define appropriate indexes (unique, compound, text)
4. Use TypeScript interfaces alongside schemas
5. Define enums for constrained fields: `pillar`, `type`, `energy_cost`, `status`
6. Add validation rules directly in schema definitions

### Step 3 — Zod Validation Schemas
1. Create Zod schemas for API input validation in `/lib/validators/`
2. Include validation rules: min/max length, patterns, enums, ranges
3. Create separate schemas for: Create, Update, Query params
4. Export TypeScript types inferred from Zod: `type TaskCreate = z.infer<typeof taskCreateSchema>`

### Step 4 — Business Logic (lib/)
1. Create business logic in `/lib/{module}/`
2. AI orchestration logic goes in `/lib/ai/` — never in API routes
3. Handle all business rules (e.g., slot calculation, pillar balancing, revision cycles)
4. Implement error handling with custom errors from `/lib/errors.ts`
5. Add retry/fallback logic for external service calls (Claude, Gemini, MongoDB)
6. All functions must be `async` and properly typed

### Step 5 — API Routes
1. Create Next.js Route Handlers in `/app/api/{resource}/route.ts`
2. Use `NextRequest` and `NextResponse`
3. Validate input with Zod schemas from Step 3
4. Protect routes via NextAuth session check (except public endpoints)
5. Add JSDoc comments with descriptions and example responses
6. Apply rate limiting to public endpoints
7. Return consistent error format: `{ error, code, details? }`

### Step 6 — React Components
1. Create page components in `/app/{page}/page.tsx` (Server Components by default)
2. Create interactive components in `/components/{module}/` (Client Components with `"use client"`)
3. Create custom hooks in `/hooks/` for shared data fetching logic
4. Use SWR for data fetching, Zustand for UI state
5. Implement proper loading, error, and empty states
6. Ensure responsive design — test at all Tailwind breakpoints
7. Use the pillar color system: Money = amber/gold, Soul = rose/red, Curiosity = blue/indigo

### Step 7 — Write Tests
1. Follow the `/generate-tests` workflow
2. Create tests in `/tests/{module}/`
3. Use `mongodb-memory-server` for database tests
4. Mock external services (Claude API, Gemini API)
5. Test edge cases from BRD Section 8
6. Verify coverage meets 80% threshold

### Step 8 — Integration Check
1. Start the dev server: `npm run dev`
2. Test the full flow end-to-end via the browser
3. Verify API responses match schema expectations
4. Check that AI fallback works when the primary model is unavailable
5. Test on mobile viewport (375px width)

### Step 9 — Update Documentation
1. Log the implementation to `.ai-context/prompt_history.md` (auto-log rule)
2. Update `.ai-context/test_cases.md` if new test scenarios were discovered
3. Update `README.md` if new setup steps or env vars are required
4. Run `graphify update .` to keep the knowledge graph current

## Module Dependency Order

Implement modules in this order to satisfy dependencies:

```
Phase 1 — Foundation (Modules 0–3)
  Module 0:  Project Setup & Scaffolding     → No dependencies
  Module 1:  Task CRUD & Master List         → Depends on Module 0
  Module 2:  Recharge Library                → Depends on Module 0
  Module 3:  User Settings & Preferences     → Depends on Module 0

Phase 2 — Core Loop (Modules 4–6)
  Module 4:  Daily Plan Generation           → Depends on Modules 1, 2, 3
  Module 5:  Night Check-In Flow             → Depends on Module 4
  Module 6:  Event Blocks & Calendar         → Depends on Modules 1, 4

Phase 3 — AI Integration (Module 7)
  Module 7:  AI Plan Generation (Claude)     → Depends on Module 4

Phase 4 — Intelligence (Modules 8–9)
  Module 8:  Spaced Repetition System        → Depends on Modules 1, 5
  Module 9:  Weekly Review & Insights        → Depends on Modules 5, 8

Phase 5 — Polish (Module 10)
  Module 10: PWA, Notifications & Deploy     → Depends on All
```
