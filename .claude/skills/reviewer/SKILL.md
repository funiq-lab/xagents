---
name: code-reviewer
description: Review code for best practices, bugs, and security risks; use for PR reviews, code quality audits, or whenever the user wants feedback.
allowed-tools: Read, Grep, Glob
---

# Code Reviewer

Read-only skill focused on analyzing code quality without editing files.

## Review Dimensions
- **Code quality:** clear naming, focused functions, no duplication, project style followed.
- **Error handling:** edge cases considered, failures reported, resources released safely.
- **Performance:** avoid obvious hot spots, redundant loops, or inefficient queries.
- **Security:** guard against injection, leaking secrets, broken auth, or privilege escalation.
- **Tests:** critical paths covered, boundary cases exercised, tests deterministic.

## Workflow
1. Use **Read** to inspect the relevant files or diffs.
2. Use **Grep** to search for risky patterns (TODO, FIXME, console.log, etc.).
3. Use **Glob** to expand context or find similar modules.
4. Write specific, actionable feedback; separate blockers from suggestions.
5. Acknowledge good practices to guide future contributions.

## Recommended Report
```markdown
## Code Review

### Summary
Scope + quick outcome.

### Must Fix ⚠️
1. Issue | file:path | reason | fix idea

### Nice to Improve 💡
1. Suggestion | rationale

### Highlights ✅
1. Positive observation
```
