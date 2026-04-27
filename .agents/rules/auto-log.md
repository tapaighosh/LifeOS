---
description: Automatically log all agent interactions to the prompt history file
---

# Auto-Log Rule

After every meaningful interaction (code generation, review, debugging, refactoring, or architecture discussion), append an entry to `.ai-context/prompt_history.md`.

## Log Entry Format

```markdown
### [YYYY-MM-DD HH:MM] — [Action Type]

**Prompt Summary:** [One-line summary of what was asked]  
**Module:** [Which module this relates to, if applicable]  
**Phase:** [Phase 1–5 from the BRD development phases]  
**Files Modified:** [List of files created or changed]  
**Outcome:** [Brief description of what was done]  
**AI Model Used:** [claude-sonnet / gemini-flash / rule-based / none]  
**Notes:** [Any important decisions, trade-offs, or follow-ups]

---
```

## Action Types

- `SCAFFOLDING` — Project structure or configuration setup
- `FEATURE` — New feature implementation
- `BUGFIX` — Bug fix or correction
- `REFACTOR` — Code refactoring without behavior change
- `REVIEW` — Code review
- `TEST` — Test creation or modification
- `DOCS` — Documentation update
- `CONFIG` — Configuration or environment change
- `DEBUG` — Debugging session
- `ARCHITECTURE` — Architecture or design discussion
- `AI_PROMPT` — AI prompt template creation or modification
- `DEPLOYMENT` — Deployment-related changes

## Rules

1. Log EVERY interaction — no exceptions.
2. Keep summaries concise — one line for prompt summary, one line for outcome.
3. Always list the specific files that were modified.
4. If a decision was made that affects future development, note it explicitly.
5. If the interaction relates to a specific module (0–10), tag it.
6. Tag the development phase (1–5) when applicable.
7. Do NOT log the full prompt content — only a summary.
8. Note which AI model was used if the interaction involved AI code generation.
