import { logger } from '../utils/logger';

/**
 * Base Service class establishing lifecycle state, structured logging,
 * and error boundary mechanisms across domain services.
 */
export abstract class BaseService {
    protected readonly serviceName: string;
    protected running = false;

    constructor(serviceName?: string) {
        this.serviceName = serviceName || this.constructor.name;
    }

    /**
     * Start or initialize the service.
     */
    public async start(): Promise<void> {
        this.running = true;
        logger.debug(`[${this.serviceName}] Service started`);
    }

    /**
     * Stop or tear down the service and release resources.
     */
    public async stop(): Promise<void> {
        this.running = false;
        logger.debug(`[${this.serviceName}] Service stopped`);
    }

    /**
     * Returns true if the service is currently running.
     */
    public isRunning(): boolean {
        return this.running;
    }

    /**
     * Helper to safely execute async service operations with standard logging.
     */
    protected async safeExecute<T>(
        operationName: string,
        operation: () => Promise<T>,
        fallbackValue: T
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            logger.error(`[${this.serviceName}] Error during ${operationName}:`, error?.message || error);
            return fallbackValue;
        }
    }
}
