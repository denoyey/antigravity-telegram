import { BaseService } from '../../src/services/baseService';

class TestService extends BaseService {
    constructor() {
        super('TestService');
    }

    public async performSafeAction<T>(op: () => Promise<T>, fallback: T): Promise<T> {
        return this.safeExecute('testAction', op, fallback);
    }
}

describe('BaseService', () => {
    let service: TestService;

    beforeEach(() => {
        service = new TestService();
    });

    it('initializes with running = false', () => {
        expect(service.isRunning()).toBe(false);
    });

    it('sets running to true when start() is called', async () => {
        await service.start();
        expect(service.isRunning()).toBe(true);
    });

    it('sets running to false when stop() is called', async () => {
        await service.start();
        expect(service.isRunning()).toBe(true);
        await service.stop();
        expect(service.isRunning()).toBe(false);
    });

    it('returns result when safeExecute succeeds', async () => {
        const result = await service.performSafeAction(async () => 'success_value', 'fallback');
        expect(result).toBe('success_value');
    });

    it('returns fallback value when safeExecute catches an error', async () => {
        const result = await service.performSafeAction(async () => {
            throw new Error('boom');
        }, 'fallback');
        expect(result).toBe('fallback');
    });
});
