const mockExecFile = jest.fn();

jest.mock('child_process', () => ({
    execFile: mockExecFile,
}));

import { isAntigravityRunning } from '../../src/utils/pathUtils';

function withPlatform<T>(platform: string, fn: () => T): T {
    const original = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: platform, configurable: true });
    try {
        const res = fn();
        if (res && typeof (res as any).then === 'function') {
            return (res as any).finally(() => {
                Object.defineProperty(process, 'platform', original);
            }) as T;
        }
        return res;
    } finally {
        Object.defineProperty(process, 'platform', original);
    }
}

describe('isAntigravityRunning()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true on Linux/macOS when antigravity process exists', async () => {
        mockExecFile.mockImplementation((...args: any[]) => {
            const cb = args[args.length - 1];
            cb(null, '4005 /usr/share/antigravity/antigravity-ide\n');
        });

        await withPlatform('linux', async () => {
            const result = await isAntigravityRunning();
            expect(result).toBe(true);
        });
    });

    it('returns false on Linux/macOS when only antigravity-telegram is running', async () => {
        mockExecFile.mockImplementation((...args: any[]) => {
            const cb = args[args.length - 1];
            cb(null, '1234 node /home/user/antigravity-telegram/dist/bin/cli.js\n');
        });

        await withPlatform('linux', async () => {
            const result = await isAntigravityRunning();
            expect(result).toBe(false);
        });
    });

    it('returns true on Windows when tasklist contains Antigravity.exe', async () => {
        mockExecFile.mockImplementation((...args: any[]) => {
            const cb = args[args.length - 1];
            cb(null, 'Antigravity.exe               12340 Console                    1     85,412 K\n');
        });

        await withPlatform('win32', async () => {
            const result = await isAntigravityRunning();
            expect(result).toBe(true);
        });
    });

    it('returns false when process is not running or error occurs', async () => {
        mockExecFile.mockImplementation((...args: any[]) => {
            const cb = args[args.length - 1];
            cb(new Error('exit code 1'), '');
        });

        const result = await isAntigravityRunning();
        expect(result).toBe(false);
    });
});
