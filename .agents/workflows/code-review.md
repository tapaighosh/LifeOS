---
description: Standardized code review workflow for LifeOS codebase
---

# Code Review Workflow

Use this workflow to perform a thorough code review on any file or set of files.

## Steps

1. **Read the file(s)** to be reviewed in full.

2. **Check production standards** — Verify compliance with `.agents/rules/production-standards.md`:
   - [ ] TypeScript strict types — no `any`, proper interfaces
   - [ ] Server Components vs Client Components used correctly
   - [ ] Zod validation on all API inputs
   - [ ] No bare catch blocks; structured error handling with custom errors
   - [ ] No secrets or hardcoded credentials
   - [ ] Mongoose schemas properly typed with indexes
   - [ ] Naming conventions followed (files, functions, components)

3. **Check BRD alignment** — Cross-reference with `.ai-context/BRD.md`:
   - [ ] Does the code implement the specified behavior correctly?
   - [ ] Are edge cases from BRD Section 8 handled?
   - [ ] Does the AI layer follow the prompt architecture from BRD Section 5.5?
   - [ ] Are pillar rules enforced (3 pillars, recharge block limits)?
   - [ ] Are time slot constraints respected (morning/evening windows)?

4. **Security review**:
   - [ ] No MongoDB injection vectors (validated inputs only)
   - [ ] No XSS vulnerabilities (sanitized user content)
   - [ ] NextAuth session checks on protected routes
   - [ ] AI API keys only accessed server-side
   - [ ] CORS properly configured
   - [ ] Reflection text encrypted before storage
   - [ ] Rate limiting on public endpoints

5. **Performance review**:
   - [ ] Lean queries used for read-only operations
   - [ ] Proper indexes on frequently queried fields
   - [ ] Server Components used where possible (reduce JS bundle)
   - [ ] SWR caching configured correctly
   - [ ] No unnecessary re-renders in Client Components
   - [ ] AI calls have timeouts configured

6. **AI layer review** (if applicable):
   - [ ] Prompts are structured (system + user, not freeform)
   - [ ] Response parsing uses Zod validation
   - [ ] Fallback to rule-based scheduler implemented
   - [ ] Temperature settings correct (0.3 plan, 0.7 reflection)
   - [ ] Token usage logged
   - [ ] Model selection respects AI_PROVIDER env var

7. **Test coverage check**:
   - [ ] New code has corresponding tests
   - [ ] Tests follow AAA pattern
   - [ ] Edge cases and error paths tested
   - [ ] External services mocked (AI APIs, MongoDB)
   - [ ] BRD edge cases from Section 8 covered

8. **Output a review summary** with:
   - 🟢 **Approved** items
   - 🟡 **Suggestions** (nice-to-have improvements)
   - 🔴 **Required changes** (must fix before merge)

9. **Log the review** to `.ai-context/prompt_history.md` using the auto-log format.
