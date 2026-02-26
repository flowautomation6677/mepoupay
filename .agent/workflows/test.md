---
description: Test generation and test running command for the Mepoupay monorepo (Bot Backend + Next.js Frontend).
---

# /test - Test Generation and Execution

$ARGUMENTS

---

## Purpose

This command generates tests, runs existing tests, or checks test coverage, specifically tailored to Mepoupay's two main environments: the Node.js Whatsapp Bot and the Next.js Web Dashboard.

---

## Sub-commands

```
/test backend      - Run Unit/Integration tests for the bot (Handlers/Workers)
/test frontend     - Run E2E tests using Playwright for the Dashboard
/test [file]       - Generate tests for a specific target
```

---

## Behavior

### 1. Bot (Backend) Unit Testing

When asked to test a backend file (e.g., `src/handlers/MediaHandler.js`):

1. **Focus on Event Logic:** The bot operates on webhooks. Tests should mock the incoming request payload from Evolution API.
2. **Mock Infrastructure:** Queues (`queueService`), Database (`supabase`), and External APIs (`evolutionService`, `openai`) **must** be mocked to prevent side-effects.
3. **Framework:** Use Vitest or Jest.
4. **Expected Assertions:** Verify if the correct job was added to the queue, or if the correct response was formulated.

### 2. Dashboard (Frontend) E2E Testing

When asked to test the frontend UI (Next.js App Router):

1. **Framework:** We use **Playwright** (`playwright-report`, `tests/e2e`).
2. **Focus:** User flows. E.g., Logging in via Supabase Auth, viewing the summary dashboard, adding a category.
3. **Resilience:** Use `page.getByRole`, `page.getByText` instead of fragile CSS selectors.
4. **State:** Handle authentication state properly before tests (setup cookies/session).

---

## Output Format

### For E2E Playwright Tests

```markdown
## 🧪 Running E2E Tests (Playwright)

```bash
npx playwright test
```

✅ tests/dashboard.spec.ts (Dashboard Load)
✅ tests/auth.spec.ts (Login Flow)
❌ tests/transactions.spec.ts (Add Expense)

**Failed:**
  ✗ should show success toast after adding expense
    Timeout 3000ms exceeded while waiting for locator('text=Sucesso').

**Trace available:** Run `npx playwright show-trace`
```

### For Backend Unit Tests

```markdown
## 🧪 Running Bot Tests (Vitest/Jest)

```bash
npm run test:backend
```

✅ src/handlers/MediaHandler.test.js
✅ src/workers/financeWorker.test.js

**Coverage:** 85% statements
```

---

## Test Patterns

### Backend Bot Test Structure (Vitest/Jest)

```javascript
import { describe, it, expect, vi } from 'vitest';
import * as queueService from '../../services/queueService';
import { handleWebhook } from '../WebhookHandler';

vi.mock('../../services/queueService');

describe('WebhookHandler', () => {
  it('should push a process_message job to the queue when text is received', async () => {
    // Arrange
    const mockPayload = { data: { messageType: 'conversation', message: { conversation: 'Testing' } } };
    
    // Act
    await handleWebhook(mockPayload);
    
    // Assert
    expect(queueService.addJob).toHaveBeenCalledWith('PROCESS_MESSAGE', expect.any(Object));
  });
});
```

### Frontend E2E Structure (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
  test('should display total balance', async ({ page }) => {
    // Navigate and assume auth state is seeded
    await page.goto('/dashboard');
    
    // Assert using accessible locators
    await expect(page.getByRole('heading', { name: 'Saldo Atual' })).toBeVisible();
    await expect(page.getByText('R$')).toBeVisible();
  });
});
```
