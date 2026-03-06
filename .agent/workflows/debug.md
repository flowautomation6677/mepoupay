---
description: Debugging command. Activates DEBUG mode for systematic problem investigation.
---

# /debug - Systematic Problem Investigation

$ARGUMENTS

---

## Purpose

This command activates DEBUG mode for systematic investigation of issues, errors, or unexpected behavior.

---

# Workflow: XP Bug Fixing

1.  **Replication (The Test)**
    - Do NOT touch the implementation code yet.
    - Create a test case that reproduces the reported bug.
    - Run the test -> MUST FAIL (This confirms the bug exists).

2.  **Fix (The Green)**
    - Modify the implementation to handle the edge case.
    - Run the test -> MUST PASS.

3.  **Regression Check**
    - Run all related tests to ensure no regression.
    - Update `LESSONS.md` prevents this bug from recurring.

---

## Examples

```
/debug login not working
/debug API returns 500
/debug form doesn't submit
/debug data not saving
```

---

## Key Principles

- **Ask before assuming** - get full error context
- **Test hypotheses** - don't guess randomly
- **Explain why** - not just what to fix
- **Prevent recurrence** - add tests, validation
