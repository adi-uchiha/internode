---
trigger: always_on
---

When concluding a task and after completing your walkthrough, you must always execute the following steps:

1. Run the agent commit command which handles linting, building, and committing with strict checks:
   `bun run agent:commit "commit title" "optional description"`
2. If the command fails due to linting or build issues, resolve the issues and keep running it until it succeeds.

Example command:

```bash
bun run agent:commit "Refactor auth logic" "Extracted session handling to a separate hook and updated tests"
```

Whenever making changes to database schema you have to run the migration properly before concluding your changes.
bun run db:generate
