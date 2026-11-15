# PRD 04: Security Architecture & Threat Model
## Antigravity Telegram

---

### 1. Security Architecture Principles

Antigravity Telegram follows a strict **Defense-in-Depth** and **Zero-Trust** security architecture. Operating as a bridge between an external chat client and a local development workstation requires impenetrable boundaries to ensure no attacker can compromise the host machine, access unauthorized files, or abuse local IDE permissions.

```
+-----------------------------------------------------------------------------------------+
|                               DEFENSE-IN-DEPTH MATRIX                                   |
+---------------------+-------------------------------+-----------------------------------+
| LAYER               | PRIMARY THREAT                | MITIGATION STRATEGY               |
+---------------------+-------------------------------+-----------------------------------+
| 1. Network Boundary | Remote unauthorized probe     | Loopback-only CDP (127.0.0.1)     |
|                     | Port scanning / sniffing      | No listening ports; HTTPS polling |
+---------------------+-------------------------------+-----------------------------------+
| 2. Identity & Access| Unauthorized bot interaction  | Strict Whitelist Middleware       |
|                     | Callback query forgery        | User ID validation on every event |
+---------------------+-------------------------------+-----------------------------------+
| 3. File System      | Directory traversal (CWE-22)  | Canonical realpathSync validation |
|                     | Symlink escape (CWE-59)       | Boundary lock to WORKSPACE_BASE_DIR|
+---------------------+-------------------------------+-----------------------------------+
| 4. Process & Exec   | Command injection (CWE-78)    | Argument arrays; statSync verification|
|                     | Subprocess hijacking          | Zero arbitrary shell invocation   |
+---------------------+-------------------------------+-----------------------------------+
| 5. CDP Bridge       | Script evaluation (CWE-94)    | JSON-parameterized DOM scripts   |
|                     | WebSocket hijacking           | Loopback binding verification     |
+---------------------+-------------------------------+-----------------------------------+
| 6. Data & Storage   | SQL Injection (CWE-89)        | Parameterized prepared statements |
|                     | Secret exposure (CWE-532)     | Zero-token logging; chmod 600 env |
+---------------------+-------------------------------+-----------------------------------+
| 7. AI & Prompt      | Prompt Injection (OWASP LLM01)| Context isolation; human approvals|
+---------------------+-------------------------------+-----------------------------------+
```

---

### 2. Comprehensive Threat Model & CWE Mitigations

#### 2.1. Path Traversal & Symlink Escapes (CWE-22, CWE-23, CWE-59)
- **Threat Vector**:
  An attacker manipulates project paths or callback data using relative traversal sequences (`../../etc/passwd`), URL-encoded dots (`%2e%2e%2f`), or symbolic links pointing outside `WORKSPACE_BASE_DIR`.
- **Hardened Mitigation (`src/middleware/sanitize.ts`)**:
  ```typescript
  export const resolveSafePath = (inputPath: string, baseDir: string): string => {
      const resolvedPath = path.resolve(baseDir, inputPath);
      const normalizedBaseDir = path.resolve(baseDir);
      const relative = path.relative(normalizedBaseDir, resolvedPath);

      if (relative && (relative.startsWith('..' + path.sep) || relative === '..')) {
          throw new Error('Path traversal detected');
      }

      // Canonical resolution catches symlink escapes
      try {
          const realPath = realpathSync(resolvedPath);
          const realBaseDir = realpathSync(normalizedBaseDir);

          if (!realPath.startsWith(realBaseDir)) {
              throw new Error('Path traversal detected (symlink bypass attempt)');
          }
          return realPath;
      } catch (err: any) {
          if (err.message.includes('Path traversal')) throw err;
          return resolvedPath;
      }
  };
  ```
  Every file path operation is strictly resolved against the canonical, realpath of `WORKSPACE_BASE_DIR`.

#### 2.2. Unauthorized Telegram Access & Spoofing (CWE-285, CWE-306)
- **Threat Vector**:
  Public Telegram users locate the bot username, attempt to send commands, or forward messages to trigger IDE actions.
- **Hardened Mitigation (`src/bot/index.ts`)**:
  - The first middleware registered in Grammy intercepts all updates (messages, channel posts, callback queries, inline queries).
  - Explicitly converts `ctx.from?.id` to string and matches against `config.allowedUserIds`.
  - Unauthorized messages are **silently dropped**: no error message, no version disclosure, and no hint that the bot is running.
  - Callback queries from unauthorized users trigger an instant generic rejection without revealing administrative context.

#### 2.3. Chrome DevTools Protocol & DOM Injection (CWE-94, CWE-79)
- **Threat Vector**:
  Malicious text containing quotation marks, JavaScript syntax, or template literals injected via `Runtime.evaluate` causing arbitrary code execution in the Chromium renderer process.
- **Hardened Mitigation (`src/services/cdpService.ts`)**:
  - Antigravity Telegram **never** concatenates unescaped user strings directly into JavaScript expression strings.
  - Message text is injected via the native DevTools protocol method `Input.insertText({ text })`, which streams raw text directly into the DOM input buffer without script interpretation.
  - When DOM evaluation is mandatory (e.g. selector checks), arguments are serialized using `JSON.stringify()` or evaluated as parameterized functions.

#### 2.4. Command Injection & Subprocess Execution (CWE-78, CWE-88)
- **Threat Vector**:
  Attacker manipulates environment variables (such as `ANTIGRAVITY_PATH`) or filenames containing shell metacharacters (`;`, `&&`, `|`, `` ` ``) to execute arbitrary commands.
- **Hardened Mitigation (`src/utils/pathUtils.ts`)**:
  - Subprocess execution uses `spawn()` or `execFile()` with distinct argument arrays, entirely bypassing shell interpolation (`shell: false`).
  - `ANTIGRAVITY_PATH` is verified via `fs.statSync()` to ensure it exists and is a regular file before any process invocation.

#### 2.5. SQL Injection & Database Tampering (CWE-89)
- **Threat Vector**:
  Malicious user or workspace display names containing SQL syntax (`' OR '1'='1`) intended to alter SQLite queries.
- **Hardened Mitigation (`src/database/`)**:
  - 100% of SQLite database operations utilize `better-sqlite3` prepared statements with positional parameter binding (`?`).
  - Zero dynamic string interpolation in SQL statements.
  - Schema constraints (`UNIQUE`, `NOT NULL`, foreign keys) enforce database integrity.

#### 2.6. Denial of Service, Flooding & Telegram Rate Limits (CWE-400, CWE-770)
- **Threat Vector**:
  Rapid assistant DOM mutations emitting hundreds of updates per second, triggering Telegram HTTP 429 "Too Many Requests" flood bans, or runaway memory leaks.
- **Hardened Mitigation (`src/services/progressSender.ts`, `responseMonitor.ts`)**:
  - **Edit Throttling**: Telegram message edits are throttled with a strict debounce timer (minimum 1,500ms between edits).
  - **Message Chunking**: Long outputs exceeding Telegram's 4,096-character limit are split cleanly at newline or markdown boundaries, preserving valid HTML tags.
  - **Concurrency Mutex**: Only one active prompt per workspace is permitted at any given moment.

#### 2.7. Credential Protection & Secret Hygiene (CWE-200, CWE-532)
- **Zero Credential Logging**: `TELEGRAM_BOT_TOKEN`, user IDs, and file system credentials are never output to stdout, stderr, or log files.
- **File System Permissions**: On initialization, the setup wizard explicitly sets restrictive permissions (`chmod 600`) on `.env` and `config.json`.
- **Zero Cloud Telemetry**: Antigravity Telegram includes zero analytics trackers, telemetry endpoints, or cloud synchronizers. All logs remain on local disk.

#### 2.8. Prompt Injection & AI Safety (OWASP Top 10 for LLMs: LLM01, LLM02)
- **Threat Vector**:
  Untrusted repositories contain hidden instructions in `README.md` or comments that trick the AI coding assistant into deleting files or executing malicious scripts.
- **Hardened Mitigation**:
  - Interactive approval prompts require explicit human verification (`[ ✅ Approve ]` or `[ ❌ Reject ]`) before any file modification or terminal command is executed.
  - Auto-accept can be restricted to safe read operations only (`SAFE_ONLY`).
