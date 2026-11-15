import Database from 'better-sqlite3';
import { TemplateRepository, TemplateRecord } from '../../src/database/templateRepository';

describe('TemplateRepository', () => {
    let db: Database.Database;
    let repo: TemplateRepository;

    beforeEach(() => {
        // Run tests with in-memory DB
        db = new Database(':memory:');
        repo = new TemplateRepository(db);
    });

    afterEach(() => {
        db.close();
    });

    describe('table initialization', () => {
        it('creates the templates table on initialization', () => {
            const tables = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='templates'"
            ).all();
            expect(tables).toHaveLength(1);
        });
    });

    describe('create - save template', () => {
        it('saves the template name and prompt, and returns the ID', () => {
            const result = repo.create({
                name: 'CreatePR',
                prompt: 'Please create a PR and summarize changes.',
            });
            expect(result.id).toBeDefined();
            expect(result.name).toBe('CreatePR');
            expect(result.prompt).toBe('Please create a PR and summarize changes.');
        });

        it('can save multiple templates', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            repo.create({ name: 'InvestigateError', prompt: 'Investigate error' });
            const all = repo.findAll();
            expect(all).toHaveLength(2);
        });

        it('cannot save duplicate templates with the same name', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            expect(() => {
                repo.create({ name: 'CreatePR', prompt: 'Another prompt' });
            }).toThrow();
        });
    });

    describe('findAll - retrieve all templates', () => {
        it('retrieves all saved templates', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            repo.create({ name: 'InvestigateError', prompt: 'Investigate error' });
            const all = repo.findAll();
            expect(all).toHaveLength(2);
            expect(all[0].name).toBe('CreatePR');
            expect(all[1].name).toBe('InvestigateError');
        });

        it('returns an empty array when there are no templates', () => {
            const all = repo.findAll();
            expect(all).toEqual([]);
        });
    });

    describe('findByName - retrieve template by name', () => {
        it('retrieves the template with the specified name', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            const found = repo.findByName('CreatePR');
            expect(found).toBeDefined();
            expect(found?.name).toBe('CreatePR');
        });

        it('returns undefined for a non-existent name', () => {
            const found = repo.findByName('nonexistent');
            expect(found).toBeUndefined();
        });
    });

    describe('delete - delete template', () => {
        it('deletes the template with the specified name', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            const deleted = repo.deleteByName('CreatePR');
            expect(deleted).toBe(true);
            expect(repo.findByName('CreatePR')).toBeUndefined();
        });

        it('returns false when deleting a non-existent name', () => {
            const deleted = repo.deleteByName('nonexistent');
            expect(deleted).toBe(false);
        });
    });

    describe('update - update template', () => {
        it('can update the prompt', () => {
            repo.create({ name: 'CreatePR', prompt: 'Create PR' });
            const updated = repo.updateByName('CreatePR', { prompt: 'New PR prompt' });
            expect(updated).toBe(true);
            const found = repo.findByName('CreatePR');
            expect(found?.prompt).toBe('New PR prompt');
        });

        it('returns false when updating a non-existent name', () => {
            const updated = repo.updateByName('nonexistent', { prompt: 'New prompt' });
            expect(updated).toBe(false);
        });
    });
});
