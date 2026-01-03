const {
    _parseAIResponse,
    _handleHITL
} = require('../../src/handlers/AiConversationHandler');

// Mock dependencies (Hoisted)
jest.mock('../../src/services/sessionService', () => ({
    setPendingCorrection: jest.fn()
}));
jest.mock('../../src/services/loggerService', () => ({}));
jest.mock('../../src/services/dataProcessor', () => ({}));
jest.mock('../../src/strategies/TextStrategy', () => ({}));

// Access mocks after they are defined/hoisted
const mockSessionService = require('../../src/services/sessionService');

describe('AiConversationHandler Helpers', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_parseAIResponse', () => {
        it('should extract JSON from markdown code blocks', () => {
            const input = "Here is the data: ```json\n{\"foo\": \"bar\"}\n```";
            const result = _parseAIResponse(input);
            expect(result).toBe("{\"foo\": \"bar\"}");
        });

        it('should extract JSON from plain text with extra noise', () => {
            const input = "Sure, {\"foo\": \"bar\"}. That matches.";
            const result = _parseAIResponse(input);
            expect(result).toBe("{\"foo\": \"bar\"}");
        });

        it('should return original text if no braces found', () => {
            const input = "Just plain text";
            const result = _parseAIResponse(input);
            expect(result).toBe(input); // or should checking braces index fail? 
            // In code: if (firstBrace !== -1 ...) else return original text. Correct.
        });
    });

    describe('_handleHITL', () => {
        it('should trigger HITL when status is pending_review', async () => {
            const processingResult = {
                status: 'pending_review',
                transactions: [{ id: 1, descricao: 'Test', valor: 100 }],
                confidence: 0.5
            };
            const user = { id: 123 };
            const message = { reply: jest.fn() };
            const validationData = { some: 'data' };

            const result = await _handleHITL(processingResult, validationData, "input", user, message);

            expect(result).toBe(true);
            expect(mockSessionService.setPendingCorrection).toHaveBeenCalled();
            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Fiquei na dúvida"));
        });

        it('should NOT trigger HITL when status is confirmed', async () => {
            const processingResult = {
                status: 'confirmed',
                transactions: []
            };
            const user = { id: 123 };
            const message = { reply: jest.fn() };

            const result = await _handleHITL(processingResult, {}, "input", user, message);

            expect(result).toBe(false);
            expect(mockSessionService.setPendingCorrection).not.toHaveBeenCalled();
            expect(message.reply).not.toHaveBeenCalled();
        });
    });

});
