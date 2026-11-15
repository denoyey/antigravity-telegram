import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

/**
 * Generic Base Repository providing unified SQLite database interaction,
 * prepared statement compilation, and transaction management.
 *
 * Designed for reusability across any SQLite-backed service or project.
 */
export abstract class BaseRepository<TRecord, TCreateInput> {
    protected readonly db: Database.Database;
    protected initialized = false;

    constructor(db: Database.Database) {
        if (!db) {
            throw new Error('Database instance is required by BaseRepository');
        }
        this.db = db;
        this.initialize();
        this.initialized = true;
    }

    /**
     * Initializes the table schema and indices.
     * Must be implemented by concrete repositories.
     */
    protected abstract initialize(): void;

    /**
     * Helper to prepare and validate a SQL statement.
     */
    protected prepare(sql: string): Database.Statement {
        try {
            return this.db.prepare(sql);
        } catch (error: any) {
            logger.error(`[BaseRepository] Failed to prepare statement: ${sql}`, error?.message || error);
            throw error;
        }
    }

    /**
     * Wraps a series of operations in an atomic SQLite transaction.
     */
    public transaction<R>(action: () => R): R {
        return this.db.transaction(action)();
    }

    /**
     * Returns whether the repository has completed its schema initialization.
     */
    public isReady(): boolean {
        return this.initialized;
    }
}
