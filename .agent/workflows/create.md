---
description: Create new application command. Triggers App Builder skill and starts interactive dialogue with user.
---

# /create - Create Application

$ARGUMENTS

---

## Task

This command starts a new application creation process.

### Steps:

1. **Request Analysis**
   - Understand what the user wants
   - If information is missing, use `conversation-manager` skill to ask

2. **Project Planning**
   - Use `project-planner` agent for task breakdown
   - Determine tech stack
   - Plan file structure
   - Create plan file and proceed to building

3. **Application Building (TDD/XP Enforcement)**
   - **Analyze:** Understand the objective.
   - **Test Spec:** Propose which unit or integration tests cover this scenario.
   - **Test Writing (Red):** Write the test file (e.g., `src/services/__tests__/newService.test.js`).
   - **Error Validation:** Confirm the test fails (Simulate or ask for output).
   - **Implementation (Green):** Write the functional code.
   - **Green Check:** Run the test again and verify it passes.
   - **Refactor (Blue):** Clean up the code.

4. **Preview**
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
