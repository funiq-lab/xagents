---
name: generating-commit-messages
description: Generate clear Conventional Commit messages from git diffs; use when writing commits, reviewing staged work, or when the user requests a commit.
---

# Generating Commit Messages

## When activated
1. Run `git diff --staged` (or the diff the user provides) to inspect every staged hunk.
2. Identify the goal of the change (feature, fix, refactor, docs, chore, etc.), the touched modules, and any notable technical detail.
3. Craft a Conventional Commit subject that summarizes the intention in present tense.
4. Add a short body when context is useful: what changed, why it was needed, and follow-ups if relevant.

## Formatting rules
- Follow the project’s `commitlint.config.ts`.
- Subject ≤ 120 chars, no trailing period.
- Use lowercase type + optional scope: `feat(app): add agent toolbar`.
- Reference issues in the body (`Closes #123`) when applicable.

## Best practices
- Prefer active voice and concrete verbs.
- Mention user-facing impact or regression risk.
- Group related changes into one commit; avoid mixing chores and features.

## Example
```plaintext
fix(i18n): load locale from params during SSG

Next.js SSG cannot access request headers, so falling back to
params prevents runtime failures for /en routes.
```
