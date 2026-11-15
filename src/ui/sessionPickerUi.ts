import { InlineKeyboard } from 'grammy';
import { SessionListItem } from '../services/chatSessionService';
import { escapeHtml } from '../utils/telegramFormatter';

export const SESSION_SELECT_ID = 'session_select';

const MAX_SELECT_OPTIONS = 25;

export function isSessionSelectId(customId: string): boolean {
    return customId.startsWith(SESSION_SELECT_ID + ':') || customId === SESSION_SELECT_ID;
}

export function buildSessionPickerUI(
    sessions: SessionListItem[],
): { text: string; keyboard: InlineKeyboard } {
    if (sessions.length === 0) {
        return {
            text: `<b>🔗 Join Session</b>\n\nNo active sessions found in Antigravity.`,
            keyboard: new InlineKeyboard(),
        };
    }

    const text = `<b>🔗 Join Session</b>\n\n` +
        `Select a session to join (${sessions.length} session(s) found):`;

    const keyboard = new InlineKeyboard();
    const pageItems = sessions.slice(0, MAX_SELECT_OPTIONS);

    for (const session of pageItems) {
        const label = session.isActive
            ? `✅ ${session.title.slice(0, 40)}`
            : session.title.slice(0, 40);
        keyboard.text(label, `${SESSION_SELECT_ID}:${session.title.slice(0, 49)}`).row();
    }

    return { text, keyboard };
}
