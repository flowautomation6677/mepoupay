---
description: Create new application command. Triggers App Builder skill and starts interactive dialogue with user.
---

# /create - Create Application

$ARGUMENTS

---

## Task

This command starts a new application creation process.

### Steps:

# Workflow: XP Feature Implementation (TDD)

1.  **Analysis & Strategy**
    - Identify the user goal.
    - Check `.agent/context/LESSONS.md` for pitfalls.
    - Select necessary patterns from `.agent/skills/`.

2.  **🔴 RED: The Test**
    - Create or locate the test file (e.g., `src/tests/...`).
    - Write a failing test case that asserts the desired behavior.
    - **STOP & RUN**: Execute the test to confirm it fails correctly.

3.  **🟢 GREEN: The Implementation**
    - Write the *minimum* code in the actual file to pass the test.
    - Do not worry about perfection yet. Focus on passing the test.
    - **STOP & RUN**: Execute the test again to confirm it passes.

4.  **🔵 REFACTOR: The Cleanup**
    - Apply Clean Code principles (DRY, naming, small functions).
    - Ensure implementation matches Architecture patterns.
    - Run verify script: `npm test` or `npm run lint`.

5.  **Documentation**
    - Update `LESSONS.md` if a new tricky edge case was discovered.

6.  **Preview**
    - Start with `auto_preview.py` when complete
    - Present URL to user

---

## Usage Examples

```
/create blog site
/create e-commerce app with product listing and cart
/create todo app
/create Instagram clone
/create crm system with customer management
```

---

## Before Starting

If request is unclear, ask these questions:
- What type of application?
- What are the basic features?
- Who will use it?

Use defaults, add details later.
