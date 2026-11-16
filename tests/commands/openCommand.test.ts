import * as http from 'http';
import * as childProcess from 'child_process';
import { EventEmitter } from 'events';
import { openAction } from '../../src/bin/commands/open';
import * as pathUtils from '../../src/utils/pathUtils';

jest.mock('http');
jest.mock('child_process');
jest.mock('../../src/utils/pathUtils');

describe('openAction', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        process.exitCode = undefined;
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        (pathUtils.getAntigravityCliPath as jest.Mock).mockReturnValue('/mock/antigravity');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        process.exitCode = 0;
    });

    it('opens a new window when CDP is already responding on port 9222', async () => {
        // Mock checkCdpPort to return true for 9222
        (http.get as unknown as jest.Mock).mockImplementation((url: string, cb: (res: any) => void) => {
            const req = new EventEmitter() as any;
            req.setTimeout = jest.fn();
            req.destroy = jest.fn();
            if (url.includes('9222')) {
                const res = { statusCode: 200 } as any;
                cb(res);
            } else {
                process.nextTick(() => req.emit('error', new Error('refused')));
            }
            return req;
        });

        const mockChild = new EventEmitter() as any;
        mockChild.unref = jest.fn();
        (childProcess.spawn as jest.Mock).mockReturnValue(mockChild);

        await openAction();

        // Should have called spawn with --new-window
        expect(childProcess.spawn).toHaveBeenCalled();
        const spawnArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
        expect(spawnArgs).toContain('--new-window');
        expect(spawnArgs).toContain('--remote-debugging-port=9222');
    });

    it('opens new window with target workspace path when provided', async () => {
        (http.get as unknown as jest.Mock).mockImplementation((url: string, cb: (res: any) => void) => {
            const req = new EventEmitter() as any;
            req.setTimeout = jest.fn();
            req.destroy = jest.fn();
            if (url.includes('9222')) {
                const res = { statusCode: 200 } as any;
                cb(res);
            } else {
                process.nextTick(() => req.emit('error', new Error('refused')));
            }
            return req;
        });

        const mockChild = new EventEmitter() as any;
        mockChild.unref = jest.fn();
        (childProcess.spawn as jest.Mock).mockReturnValue(mockChild);

        await openAction('/path/to/my-workspace');

        expect(childProcess.spawn).toHaveBeenCalled();
        const spawnArgs = (childProcess.spawn as jest.Mock).mock.calls[0][1];
        expect(spawnArgs).toContain('--new-window');
        expect(spawnArgs).toContain('/path/to/my-workspace');
    });

    it('warns with options when running without CDP and no options provided', async () => {
        // All CDP ports offline
        (http.get as unknown as jest.Mock).mockImplementation((_url: string) => {
            const req = new EventEmitter() as any;
            req.setTimeout = jest.fn();
            req.destroy = jest.fn();
            process.nextTick(() => req.emit('error', new Error('refused')));
            return req;
        });
        (pathUtils.isAntigravityRunning as jest.Mock).mockResolvedValue(true);

        await openAction();

        expect(process.exitCode).toBe(1);
        expect(childProcess.spawn).not.toHaveBeenCalled();
    });
});
