import { parseMessageContent } from '../../src/commands/messageParser';

describe('Message Parser', () => {
    it('correctly identifies plain instructions (just text)', () => {
        const result = parseMessageContent('Hello, please restart the system.');
        expect(result.isCommand).toBe(false);
        expect(result.text).toBe('Hello, please restart the system.');
    });

    it('correctly identifies a command starting with / and its arguments', () => {
        const result = parseMessageContent('/mode gpt-4');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('mode');
        expect(result.args).toEqual(['gpt-4']);
    });

    it('removes double quotes from command arguments with multiple parameters', () => {
        const result = parseMessageContent('/template add "DailyStandup" "Good morning team"');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('template');
        expect(result.args).toEqual(['add', 'DailyStandup', 'Good morning team']);
    });

    it('correctly parses arguments without double quotes', () => {
        const result = parseMessageContent('/template CreatePR');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('template');
        expect(result.args).toEqual(['CreatePR']);
    });

    it('correctly identifies commands while ignoring surrounding whitespace', () => {
        const result = parseMessageContent('  /stop  ');
        expect(result.isCommand).toBe(true);
        expect(result.commandName).toBe('stop');
        expect(result.args).toEqual([]);
    });

    it('treats a lone / as plain text', () => {
        const result = parseMessageContent('/');
        expect(result.isCommand).toBe(false);
        expect(result.text).toBe('/');
    });
});
