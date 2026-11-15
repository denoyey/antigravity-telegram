import { SlashCommandHandler } from '../../src/commands/slashCommandHandler';

/**
 * Mock type definition for TemplateRepository
 */
const mockTemplateRepo = {
    findAll: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    deleteByName: jest.fn(),
    updateByName: jest.fn(),
};

describe('SlashCommandHandler', () => {
    let handler: SlashCommandHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        handler = new SlashCommandHandler(mockTemplateRepo as any);
    });

    describe('handleCommand - command routing', () => {
        it('returns an error result for an unknown command name', async () => {
            const result = await handler.handleCommand('unknown', []);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unknown command');
        });
    });

    describe('/template command', () => {
        it('displays the registered template list when called without arguments', async () => {
            mockTemplateRepo.findAll.mockReturnValue([
                { id: 1, name: 'CreatePR', prompt: 'Create a pull request' },
                { id: 2, name: 'InvestigateError', prompt: 'Investigate the error' },
            ]);
            const result = await handler.handleCommand('template', []);
            expect(result.success).toBe(true);
            expect(result.message).toContain('CreatePR');
            expect(result.message).toContain('InvestigateError');
        });

        it('returns an empty message when there are no templates', async () => {
            mockTemplateRepo.findAll.mockReturnValue([]);
            const result = await handler.handleCommand('template', []);
            expect(result.success).toBe(true);
            expect(result.message).toContain('No templates registered');
        });

        it('returns the prompt when a template name is specified', async () => {
            mockTemplateRepo.findByName.mockReturnValue({
                id: 1,
                name: 'CreatePR',
                prompt: 'Please create a pull request with summary.',
            });
            const result = await handler.handleCommand('template', ['CreatePR']);
            expect(result.success).toBe(true);
            expect(result.prompt).toBe('Please create a pull request with summary.');
        });

        it('returns an error for a non-existent template name', async () => {
            mockTemplateRepo.findByName.mockReturnValue(undefined);
            const result = await handler.handleCommand('template', ['nonexistent']);
            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });

        it('registers a template via the add subcommand', async () => {
            mockTemplateRepo.create.mockReturnValue({
                id: 1,
                name: 'RunTests',
                prompt: 'Run unit test suite',
            });
            const result = await handler.handleCommand('template', ['add', 'RunTests', 'Run unit test suite']);
            expect(result.success).toBe(true);
            expect(mockTemplateRepo.create).toHaveBeenCalledWith({
                name: 'RunTests',
                prompt: 'Run unit test suite',
            });
        });

        it('returns an error when the add subcommand has insufficient arguments', async () => {
            const result = await handler.handleCommand('template', ['add']);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Missing arguments');
        });

        it('deletes a template via the delete subcommand', async () => {
            mockTemplateRepo.deleteByName.mockReturnValue(true);
            const result = await handler.handleCommand('template', ['delete', 'RunTests']);
            expect(result.success).toBe(true);
            expect(mockTemplateRepo.deleteByName).toHaveBeenCalledWith('RunTests');
        });

        it('returns an error when deleting a non-existent template via the delete subcommand', async () => {
            mockTemplateRepo.deleteByName.mockReturnValue(false);
            const result = await handler.handleCommand('template', ['delete', 'nonexistent']);
            expect(result.success).toBe(false);
        });

        it('rejects old plural alias "templates"', async () => {
            const result = await handler.handleCommand('templates', []);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Unknown command');
        });
    });
});
