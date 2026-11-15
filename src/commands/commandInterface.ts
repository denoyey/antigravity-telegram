/**
 * Reusable Command Pattern Interfaces and Registry
 * Enables decoupling command business logic from specific bot frameworks.
 */

export interface CommandContext {
    userId: string;
    chatId: number | string;
    topicId?: number;
    args: string[];
    rawText: string;
    reply: (text: string, options?: any) => Promise<any>;
}

export interface ICommandHandler {
    /** The command trigger keyword, e.g. 'status' or 'project' */
    readonly name: string;
    /** Human-readable description of what the command does */
    readonly description: string;
    /** Whether the command requires an active workspace binding */
    readonly requiresWorkspace?: boolean;
    /** Execute the command logic */
    execute(ctx: CommandContext): Promise<void>;
}

export class CommandRegistry {
    private readonly handlers = new Map<string, ICommandHandler>();

    /**
     * Register a command handler.
     */
    public register(handler: ICommandHandler): void {
        this.handlers.set(handler.name.toLowerCase(), handler);
    }

    /**
     * Retrieve a registered command handler by name.
     */
    public get(name: string): ICommandHandler | undefined {
        return this.handlers.get(name.toLowerCase());
    }

    /**
     * Check if a command is registered.
     */
    public has(name: string): boolean {
        return this.handlers.has(name.toLowerCase());
    }

    /**
     * Returns an array of all registered command handlers.
     */
    public getAll(): ICommandHandler[] {
        return Array.from(this.handlers.values());
    }

    /**
     * Dispatch an incoming command context to its registered handler.
     * Returns true if handled, false if command not found.
     */
    public async dispatch(commandName: string, ctx: CommandContext): Promise<boolean> {
        const handler = this.get(commandName);
        if (!handler) {
            return false;
        }
        await handler.execute(ctx);
        return true;
    }
}
