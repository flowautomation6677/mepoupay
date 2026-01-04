const { AudioStrategy } = require('../../src/strategies/AudioStrategy'); // Import class logic if exported, or mock
// Actually AudioStrategy exports "new AudioStrategy()".
// We need to test the logic. It is harder to test private vars directly without rewiring, 
// but we can mock 'ffmpeg-static' and test the behavior.

// Mock dependencies with factory to prevent loading actual files explicitly
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../src/services/loggerService', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));
jest.mock('../../src/services/openaiService', () => ({
    transcribeAudio: jest.fn()
}));

const AudioStrategyModule = require('../../src/strategies/AudioStrategy');
const path = require('path');
const fs = require('fs');

describe('AudioStrategy Security Audit', () => {

    let spawnMock;

    beforeEach(() => {
        jest.clearAllMocks();
        spawnMock = require('child_process').spawn;
        // Verify we are mocking spawn
        spawnMock.mockReturnValue({
            on: jest.fn((event, cb) => {
                if (event === 'close') cb(0);
            })
        });
        fs.existsSync.mockReturnValue(true);
        // We cannot easily mock 'ffmpeg-static' require unless we use jest.mock at top level with factory
        // But since it is a const require at top of file, it is hard to change per test without verify isolation.
    });

    test('should disable shell execution in spawn options', async () => {
        // We trigger transcode indirectly or directly if exposed.
        // transcodeToMp3 is a method on the instance.

        const input = '/tmp/input.ogg';
        const output = '/tmp/output.mp3';

        // Mock path.isAbsolute to match true for our "mocked" static path
        // The real ffmpeg-static path is absolute.

        await AudioStrategyModule.transcodeToMp3(input, output);

        expect(spawnMock).toHaveBeenCalled();
        const callArgs = spawnMock.mock.calls[0];
        const options = callArgs[2];

        expect(options).toBeDefined();
        expect(options.shell).toBe(false);
    });

    // To test the "reject if not absolute" logic, we would need to control the require('ffmpeg-static') return.
    // This requires jest.isolateModules or jest.mock with virtual/factory.
});
