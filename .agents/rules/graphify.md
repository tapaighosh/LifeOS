---
description: Graphify knowledge graph integration rules for LifeOS
---

## Graphify

This project has a graphify knowledge graph at `graphify-out/`.

### Rules

- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- If the graphify MCP server is active, utilize tools like `query_graph`, `get_node`, and `shortest_path` for precise architecture navigation instead of falling back to `grep`
- If the MCP server is not active, the CLI equivalents are:
  - `graphify query "<question>"` — Ask natural language questions about the codebase
  - `graphify path "<A>" "<B>"` — Find the connection path between two modules
  - `graphify explain "<concept>"` — Get a detailed explanation of a concept
  - Prefer these over grep for cross-module questions
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

### When to Use Graphify

1. **Architecture questions** — "How does the AI layer connect to the plan generator?"
2. **Dependency tracing** — "What depends on the Task model?"
3. **Impact analysis** — "If I change the revision cycle logic, what else is affected?"
4. **Module boundaries** — "Show me all files in the Night Check-In module"
5. **Code navigation** — "Find the path from API route to MongoDB write for daily plans"

### When NOT to Use Graphify

1. Simple text searches — use grep
2. Finding a specific string — use grep
3. Viewing file contents — use view_file
