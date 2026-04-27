# LifeOS — Quick Prompts Reference

> Quick-access prompt templates for common tasks. For full module prompts, see `MODULE_PROMPTS.md`.

---

## Quick Context (Paste at start of new conversation)

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

## Common Task Prompts

### Add a new task field
```
Add a new field "[field_name]" to the Task model.
Update: Mongoose schema, Zod validators, API route, TaskForm component.
Follow production-standards.md for typing and validation.
```

### Fix AI prompt
```
The AI plan generation is [describe issue].
Review /lib/ai/promptBuilder.ts and adjust the prompt.
Follow the /optimize-prompt approach: test with 3 different inputs.
```

### Debug a flow
```
Trace the [morning plan / night check-in / revision] flow end-to-end.
Use /debug-flow: start from the API route, through lib/, to MongoDB write.
Show me each step and where the issue might be.
```

### Run code review
```
Run /code-review on [file or module name].
Check against production-standards.md and BRD requirements.
```

### Generate tests
```
Run /generate-tests for [module name].
Check test_cases.md for pre-defined scenarios.
Target 80% coverage.
```
