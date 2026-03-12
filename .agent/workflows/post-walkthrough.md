---
description: Post-walkthrough completion workflow
---

When concluding a task and after completing your walkthrough, you must always execute the following steps:

1. Run the project linters and formatters.
2. Build the project.
3. If there are any errors or warnings during linting or building, resolve them before moving forward.
4. Once the code is clean and building successfully, make a commit with a proper description using `git commit`.

Example commands:

```bash
bun run format
bun run lint
bun run build
```

// turbo-all

```bash
git add .
# Commit changes
```
