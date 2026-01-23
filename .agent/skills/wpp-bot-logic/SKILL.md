---
name: wpp-bot-logic
description: Logic for WhatsApp conversation handlers, including LLM integration and non-blocking operations.
---

# WhatsApp Bot Logic

## Goal
Manage user conversations flow, handle incoming messages, and integrate with AI services without blocking the main event loop.

## Instructions
1.  **Architecture**: Use the standard pipeline defined in `messageHandler.js`:
    *   Auth -> Command Dispatcher -> Feedback -> Media -> AI Conversation.
2.  **LLM Handling**: Use `AiConversationHandler` for any logic requiring OpenAI processing.
    *   Response should flow through `_handleAIResponse` to maintain context.
3.  **Non-Blocking**:
    *   Never use `await` on long-running tasks that don't need immediate feedback.
    *   Use queues/workers for heavy processing (data ingestion, report generation).
4.  **Session Management**:
    *   Always fetch context using `sessionService.getContext(userId)`.
    *   Update context after AI interactions using `sessionService.setContext`.

## Examples

### 1. Message Handler Pipeline
See `src/handlers/messageHandler.js` for the main entry point logic:

```javascript
async function handleMessage(message) {
    try {
        // 1. Authentication
        const user = await _authenticateUser(message);
        if (!user) return;

        // 2. Context
        let userContext = await sessionService.getContext(user.id);

        // 3. Command Dispatch (First Priority)
        const cmdResult = await commandDispatcher.dispatch(message, user);
        if (cmdResult.handled) return;

        // 4. Fallback to AI Handler
        await aiConversationHandler.handle(message, user, userContext);

    } catch (err) {
        logger.error("Controller Error", err);
    }
}
```

### 2. AI Conversation Handler
See `src/handlers/AiConversationHandler.js`. The handler coordinates the TextStrategy, AI response validation, and Context updates.

```javascript
class AiConversationHandler {
    async handle(message, user, userContext) {
        const content = message.body;
        
        // Execute Strategy (Text/Tool Call)
        const response = await textStrategy.execute(content, message, user, userContext);

        if (response.type === 'ai_response') {
             // Validate and Update User Context
             const updatedContext = await this._handleAIResponse(
                response, message, user, userContext, content
            );
            await sessionService.setContext(user.id, updatedContext);
        }
    }
}
```

### 3. Session Management
Always persist conversation state:
```javascript
const sessionService = require('../services/sessionService');

// Get
const context = await sessionService.getContext(userId);

// Set (with TTL)
await sessionService.setContext(userId, newContext, 86400); // 24h
```
