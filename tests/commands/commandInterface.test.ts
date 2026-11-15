import { CommandRegistry, ICommandHandler, CommandContext } from '../../src/commands/commandInterface';

describe('CommandRegistry', () => {
    let registry: CommandRegistry;

    beforeEach(() => {
        registry = new CommandRegistry();
    });

    it('registers and retrieves a command handler by name case-insensitively', () => {
        const mockHandler: ICommandHandler = {
            name: 'status',
            description: 'Check status',
            execute: jest.fn(),
        };

        registry.register(mockHandler);

        expect(registry.has('status')).toBe(true);
        expect(registry.has('STATUS')).toBe(true);
        expect(registry.get('status')).toBe(mockHandler);
        expect(registry.get('STATUS')).toBe(mockHandler);
    });

    it('returns undefined and false for unregistered commands', () => {
        expect(registry.has('unknown')).toBe(false);
        expect(registry.get('unknown')).toBeUndefined();
    });

    it('lists all registered command handlers', () => {
        const handlerA: ICommandHandler = {
            name: 'alpha',
            description: 'Alpha command',
            execute: jest.fn(),
        };
        const handlerB: ICommandHandler = {
            name: 'beta',
            description: 'Beta command',
            execute: jest.fn(),
        };

        registry.register(handlerA);
        registry.register(handlerB);

        const all = registry.getAll();
        expect(all).toHaveLength(2);
        expect(all).toContain(handlerA);
        expect(all).toContain(handlerB);
    });

    it('dispatches command execution to the registered handler', async () => {
        const executeMock = jest.fn().mockResolvedValue(undefined);
        const mockHandler: ICommandHandler = {
            name: 'ping',
            description: 'Ping command',
            execute: executeMock,
        };

        registry.register(mockHandler);

        const ctx: CommandContext = {
            userId: '123456',
            chatId: 987654,
            args: ['foo', 'bar'],
            rawText: '/ping foo bar',
            reply: jest.fn(),
        };

        const handled = await registry.dispatch('ping', ctx);
        expect(handled).toBe(true);
        expect(executeMock).toHaveBeenCalledWith(ctx);
    });

    it('returns false when dispatching an unknown command', async () => {
        const ctx: CommandContext = {
            userId: '123456',
            chatId: 987654,
            args: [],
            rawText: '/nonexistent',
            reply: jest.fn(),
        };

        const handled = await registry.dispatch('nonexistent', ctx);
        expect(handled).toBe(false);
    });
});
