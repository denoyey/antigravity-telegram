# PRD 06: User Experience & Non-AI-Slop Interface Design
## Antigravity Telegram

---

### 1. The Human-Crafted UX Philosophy

A core requirement of Antigravity Telegram is that all interaction design must feel **human-crafted, focused, and purposeful**, completely rejecting the pattern known as "AI Slop".

```
+-----------------------------------------------------------------------------------------+
|                                ANTI-AI-SLOP DESIGN CHARTER                              |
+------------------------------------+----------------------------------------------------+
| ❌ WHAT WE FORBID (AI SLOP)         | ✅ WHAT WE BUILD (HUMAN CRAFTSMANSHIP)             |
+------------------------------------+----------------------------------------------------+
| Unsolicited cheeriness & sycophancy| Direct, calm, and professional engineering tone    |
| ("Certainly! I'd be glad to help!")|                                                    |
+------------------------------------+----------------------------------------------------+
| Walls of redundant markdown        | Clean summaries with progressive disclosure        |
| explaining obvious code snippets   |                                                    |
+------------------------------------+----------------------------------------------------+
| Emoji salad (emojis on every line  | Semantic icons used sparingly to signal state:     |
| like 🚀✨🎉🥳)                     | ⏱️ (time), ⚠️ (warning), 🛑 (halted), 📁 (path)     |
+------------------------------------+----------------------------------------------------+
| Cryptic stack dumps on error       | Human-friendly diagnostic with 1-tap remedy        |
+------------------------------------+----------------------------------------------------+
| Overwhelming stream edits that     | Throttled, flicker-free dual-stream progress       |
| cause mobile UI jumpiness          |                                                    |
+------------------------------------+----------------------------------------------------+
```

---

### 2. Message Anatomy & Visual Hierarchy

#### 2.1. The Transient Status Message (Progress Stream)
While Antigravity is processing a prompt, a single transient message is continuously updated to communicate status without cluttering the chat history.

```text
⚙️ Antigravity is working...
⏱️ Elapsed: 24s | Model: Gemini 2.5 Pro

Phase: Editing src/services/cdpService.ts
Activity: Applied unified BaseRepository pattern
```

- **No spam**: Once generation finishes, this transient status message is either replaced by the final response or cleanly collapsed.

#### 2.2. The Response Message (Content Stream)
The final assistant output is streamed with strict typography rules:
- **Language-Annotated Code Fences**: All code blocks include exact syntax markers (`<pre><code class="language-typescript">...</code></pre>`).
- **Entity Escaping**: Ensures HTML characters (`<`, `>`, `&`) are cleanly rendered by Telegram without breaking formatting.
- **Chunk Integrity**: Messages exceeding 4,000 characters are split cleanly at logical paragraph or code block boundaries.

---

### 3. Telegram Inline Keyboard Specifications

All interactive controls use Telegram's `InlineKeyboardMarkup`.

#### 3.1. Project Selector (`/project`)
Presents discovered directories in clean, two-column grids:
```
+--------------------------+--------------------------+
| 📁 antigravity-remote    | 📁 backend-api           |
+--------------------------+--------------------------+
| 📁 mobile-flutter-app    | 📁 docs-site             |
+--------------------------+--------------------------+
| 🔄 Rescan Workspaces     | ❌ Cancel                |
+--------------------------+--------------------------+
```
- **64-Byte Callback Constraint**: Callback data strings are strictly bounded to $\le 64$ bytes (e.g. `p:<short-hash>` or index-based routing) to prevent Telegram API truncation errors.

#### 3.2. Approval Prompts (File Edits / Bash Commands)
When Antigravity pauses for user confirmation:
```text
⚠️ Confirmation Required
Antigravity wants to modify: src/services/cdpService.ts

Diff: +18 lines, -4 lines
Command: npm test
```
```
+--------------------------+--------------------------+
| ✅ Approve               | ❌ Reject                |
+--------------------------+--------------------------+
| ⚡ Auto-Accept (Turn)    | 🛑 Stop Execution        |
+--------------------------+--------------------------+
```

---

### 4. Empathetic Error UX

When an error occurs (such as Antigravity IDE being closed or CDP port unreachable), the user is never presented with an unhandled exception or raw stack trace.

#### Bad Example (AI Slop / Cryptic Dump):
> `Error: connect ECONNREFUSED 127.0.0.1:9222 at TCPConnectWrap.afterConnect [as oncomplete]`

#### Antigravity Telegram Example (Actionable, Calm):
```text
⚠️ Antigravity is not reachable on CDP port 9222.

How to fix:
1. Make sure Antigravity IDE is open on your PC.
2. Launch it with debugging enabled:
   open -a Antigravity --args --remote-debugging-port=9222
3. Run /status to check connection.
```

---

### 5. Multi-Language Support (i18n)

User-facing messages are fully localized across three languages via `src/utils/i18n.ts`:
- **English (`en`)**: Default international developer locale.
- **Japanese (`ja`)**: Clean, natural keigo for Japanese developers.
- **Vietnamese (`vi`)**: Natural, precise terminology for Vietnamese developers.

---

### 6. Telegram Bot Onboarding & Gateway Setup Lifecycle

To achieve a seamless 3-minute setup for developers on mobile and desktop:

#### 6.1. Telegram Bot Token Provisioning
- The developer creates a bot instance via [@BotFather](https://t.me/BotFather) using `/newbot`.
- The generated HTTP API token (`TELEGRAM_BOT_TOKEN`) is passed to the interactive wizard (`antigravity-telegram setup`).

#### 6.2. Identity Verification & Whitelist Guard
- The developer determines their numerical Telegram ID using [@userinfobot](https://t.me/userinfobot).
- ID is stored in `ALLOWED_USER_IDS`. Any incoming interaction from non-whitelisted accounts is dropped silently without error leakage.

#### 6.3. Supergroup Forum Topics Integration
- If `USE_TOPICS=true`, the bot is added to a dedicated Telegram Supergroup with Forum Topics enabled.
- The bot requires Administrator privileges (`Manage Topics`, `Change Group Info`, `Delete Messages`) to automatically create and bind individual topics to local workspace directories.

#### 6.4. Bot Command Autocomplete Sync
- Bot commands are registered with [@BotFather](https://t.me/BotFather) via `/setcommands` to enable native mobile command autocompletion when typing `/`.
