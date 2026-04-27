---
description: Global production coding standards enforced on all agent interactions for the LifeOS project
---

# Production Standards

These rules MUST be followed in all code generation, reviews, and modifications across the LifeOS project.

---

## TypeScript / Next.js (App Router)

### Style & Structure
- Use **Next.js 14 App Router** — all pages live in `/app`, use Server Components by default.
- Add `"use client"` directive ONLY when the component needs hooks, event handlers, or browser APIs.
- Use **TypeScript strict mode** — `tsconfig.json` must have `"strict": true`.
- Use **named exports** — avoid default exports (except for `page.tsx`, `layout.tsx`, `route.ts`).
- Use **functional components** with hooks — no class components.
- All component props must be typed with explicit interfaces (suffix: `Props`).
- No `any` type — use `unknown` if type is genuinely uncertain, then narrow.
- Line length: 100 characters max (Prettier enforced).

### File & Naming Conventions
- Pages/Layouts: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (Next.js convention)
- Components: `PascalCase.tsx` — e.g., `TaskCard.tsx`, `PillarBadge.tsx`
- Hooks: `useCamelCase.ts` — e.g., `useToday.ts`, `usePlan.ts`
- Utilities: `camelCase.ts` — e.g., `slotCalculator.ts`, `dateHelpers.ts`
- Mongoose models: `PascalCase.ts` — e.g., `Task.ts`, `DailyPlan.ts`
- API routes: `route.ts` inside `/app/api/{resource}/`
- Types: `PascalCase` (interfaces — never prefix with `I`)
- CSS files: `kebab-case.css` or CSS Modules `Component.module.css`
- Constants: `UPPER_SNAKE_CASE`

### Server Components vs Client Components
- **Server Components** (default): Data fetching, layout shells, static UI, database queries.
- **Client Components** (`"use client"`): Interactive forms, drag-and-drop, state-driven UI, animations.
- NEVER import server-only modules (Mongoose, crypto, fs) in client components.
- Use `next/dynamic` with `ssr: false` for heavy client-only libraries.

### API Routes (Route Handlers)
- All API routes live in `/app/api/` following RESTful naming: `/api/{resource}/route.ts`.
- Use `NextRequest` and `NextResponse` — never use legacy `req/res` pattern.
- Validate ALL input with **Zod** schemas before processing.
- Return structured JSON errors: `{ "error": string, "code": string, "details"?: any }`.
- Use HTTP status codes correctly: 200, 201, 400, 401, 404, 409, 500.
- Rate limiting must be applied to all public-facing endpoints.
- Use `try/catch` blocks — never let unhandled errors reach the client.

### Error Handling
- All API errors must return structured JSON — never plain text errors.
- Create custom error classes in `/lib/errors.ts` — `AppError`, `ValidationError`, `NotFoundError`, `AIServiceError`.
- All external service calls (Claude API, Gemini API, MongoDB) MUST have try/catch with fallback behavior.
- **AI failures must NEVER block daily plan delivery** — use the rule-based fallback scheduler.
- Use `error.tsx` boundary files for page-level error recovery.
- Never use bare `catch` without logging — always `console.error` or structured logging.

---

## MongoDB / Mongoose

### Schema Patterns
- All schemas must define `timestamps: true` for automatic `createdAt` and `updatedAt`.
- Use **UUID** (`_id: String`) or let Mongoose default ObjectId — be consistent, pick one.
- Define indexes for frequently queried fields: `date` on `daily_plans`, `pillar` on `tasks`, etc.
- Use `enum` validation for constrained fields: `pillar`, `type`, `energy_cost`, `status`.
- Implement soft-delete with `active: Boolean` field — never hard-delete user data.
- Use **lean queries** (`Model.find().lean()`) for read-only operations — 5x faster.
- Always define TypeScript interfaces alongside Mongoose schemas.

### Connection Handling
- Use a global connection singleton — never create new connections per request.
- Connection string comes from environment variable `MONGODB_URI`.
- Support both **Atlas** (production) and **local MongoDB** (development) via env var.
- Handle connection errors gracefully — log and retry with exponential backoff.

### Query Patterns
- Use `.select()` to fetch only needed fields — never `SELECT *` equivalent.
- Use `.populate()` sparingly — prefer manual lookups for complex joins.
- Always add `.limit()` to list queries — prevent unbounded result sets.
- Use **transactions** for multi-document operations (e.g., creating plan + updating revision queue).

---

## AI Layer (Claude / Gemini)

### Prompt Architecture
- All prompts are built server-side in `/lib/ai/` — the frontend NEVER calls AI APIs directly.
- Use the **prompt builder pattern**: separate functions assemble context into structured prompts.
- System prompt is always a strict instruction — no freeform conversation.
- User prompt is always structured data — context, constraints, rules, expected schema.
- Response must ALWAYS be valid JSON — instruct the model explicitly.
- Temperature: `0.3` for plan generation (consistent), `0.7` for reflections (slightly creative).

### Model Configuration
- **Primary**: Anthropic Claude (`claude-sonnet-4-20250514`) — for plan generation, night insights
- **Fallback**: Google Gemini (`gemini-2.0-flash`) — if Claude is down or rate-limited
- **Dev/Testing**: Claude Haiku (`claude-3-5-haiku-20241022`) or Gemini Flash — for cheaper iteration
- Model selection via `AI_PROVIDER` env var: `claude | gemini | claude-dev`
- All model calls MUST have a timeout (30 seconds max).

### Response Handling
- Parse AI response with Zod — validate the JSON structure matches expected schema.
- If parsing fails, retry once with a stricter prompt.
- If retry fails, fall back to the rule-based scheduler.
- Log every AI call: model, tokens used, latency, success/failure — to `prompt_history` or structured logs.
- NEVER expose raw AI responses to the frontend — always validate and sanitize.

### Fallback Rules
- If AI is unavailable, the **rule-based fallback scheduler** in `/lib/scheduler/` generates a plan.
- Fallback plans are clearly marked: `source: "rule-based"` vs `source: "ai"`.
- Fallback logic: sort by priority DESC → fill morning window → fill evening window → insert recharge blocks.
- Users are notified via toast: "AI was unavailable. Your plan was generated using smart scheduling rules."

---

## Styling (Tailwind CSS v3)

### Conventions
- Use `tailwind.config.js` to define the design system: colors, spacing, fonts, breakpoints.
- Define custom color palette — avoid raw Tailwind colors. Use semantic names: `pillar-money`, `pillar-soul`, `pillar-curiosity`.
- Use `@apply` in CSS modules for complex reusable patterns — keep JSX clean.
- Mobile-first approach — design for mobile, enhance for desktop.
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
- Minimum touch target size: 44x44px on mobile.
- Use `dark:` variant for dark mode (class-based, not media-based).

---

## State Management

### Zustand (Client State)
- One store per domain: `useTaskStore`, `usePlanStore`, `useSettingsStore`.
- Keep stores thin — only UI state (selected tab, modal open, form draft).
- Use Zustand `persist` middleware for draft auto-save (localStorage).
- Never put server data in Zustand — that goes in SWR.

### SWR (Server State)
- Use SWR for all data fetching from API routes.
- Define cache keys as constants: `SWR_KEYS.TASKS`, `SWR_KEYS.TODAY_PLAN`.
- Use `mutate()` for optimistic updates after create/update/delete.
- Set sensible `refreshInterval` — plans: 0 (manual), settings: 0, insights: 60s.

---

## Security

### Authentication
- **NextAuth.js** with credentials provider — single user, JWT session.
- JWT expiry: 7 days, refresh on activity.
- All `/api/*` routes protected via `middleware.ts` — except `/api/auth/*`.
- Session token stored as httpOnly cookie — never in localStorage.
- Prepare for multi-user by using `userId` in all queries, even with single user.

### Secrets Management
- All sensitive values in `.env.local` — never committed to git.
- Required env vars: `MONGODB_URI`, `NEXTAUTH_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`.
- Use `zod` to validate env vars at startup — fail fast if missing.

### Data Protection
- Reflection text encrypted before MongoDB write (AES-256 via Node.js `crypto` module).
- AI API keys only used in server-side API routes — never exposed to client bundle.
- No analytics, no third-party tracking.
- CORS configured with explicit allowed origins — never use `*` in production.

---

## Testing

### Framework
- **Jest** or **Vitest** with React Testing Library (frontend).
- **Jest** with `mongodb-memory-server` (API routes / business logic).
- Minimum **80% code coverage** target.

### Patterns
- Follow **Arrange-Act-Assert (AAA)** pattern.
- Use factories for test data — never hardcode inline.
- Mock all external services: Claude API, Gemini API, MongoDB.
- Test edge cases from BRD Section 8: Claude down, woke up late, 3-day incomplete streak, etc.

### Test Structure
```
/tests/
  /api/          → API route handler tests
  /lib/          → Business logic tests (scheduler, revision, AI parser)
  /components/   → Component rendering tests
  /e2e/          → End-to-end flows (optional, Phase 5)
```

---

## Git & Version Control

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Branch naming: `feat/module-name`, `fix/issue-description`, `chore/task-name`
- Atomic PRs: one feature or fix per pull request
- No commits to `main` directly — always use feature branches
- Branch strategy: `main` (production) ← `develop` ← `feat/*`

---

## Documentation

- Every new module must have a docstring/comment block explaining its purpose.
- API routes must have JSDoc comments with descriptions and example responses.
- README must be kept up-to-date with setup instructions.
- All environment variables must be documented in `.env.example`.
- Complex business logic (AI prompting, revision cycles, pillar balancing) must have inline comments explaining the "why".
