# Antigravity Telegram (ANTIRLM) - Master Agent Guide
## Project Architecture, Security Standards, and Operational Guidelines

> **Target Audience**: AI Agents (Antigravity, Claude Code, Cursor, Copilot) and Human Core Contributors.  
> **Source Document**: Consolidated from project blueprints, security policies, and engineering guides.

---

## 1. Project Identity & Mission

**Antigravity Telegram (ANTIRLM)** is a local-first remote gateway connecting smartphone devices via Telegram to the desktop [Antigravity IDE](https://antigravity.dev). Operating 100% locally on the host machine via the Chrome DevTools Protocol (CDP), ANTIRLM eliminates the requirement for intermediary cloud relays, third-party backend proxies, or external hosted services.

### Core Value Pillars

1. **Absolute Data Privacy**: All source code, prompts, credentials, and telemetry remain strictly on the host operating system. The bot relies exclusively on outbound long-polling to Telegram servers; zero inbound listening ports are exposed to the public Internet.
2. **Sub-100ms Real-Time Responsiveness**: Utilizes native browser CDP bindings (`MutationObserver`) to capture assistant output and activity streams without polling latency or high CPU consumption.
3. **Ergonomic Workspace Isolation**: Seamlessly routes distinct project directories into dedicated **Telegram Forum Topics**, providing isolated context, independent conversation histories, and concurrency locks per workspace.
4. **Human-Centric Craftsmanship**: Free from generic AI slop, robotic boilerplate, or fragile hacks. Designed with clean Object-Oriented patterns, resilient type safety, and clear user feedback.

---

## 2. Mandatory Documentation Auto-Update Policy

> [!IMPORTANT]
> **STRICT REPOSITORY RULE (ZERO EXCEPTION)**:  
> Whenever any file, feature, command, configuration parameter, database schema, or architectural pattern in this repository is added, modified, refactored, or deprecated:
> 
> 1. **The corresponding PRD documentation in `docs/prd/` MUST be updated immediately in the exact same turn / commit.**
> 2. **The root `README.md` MUST be updated immediately in the exact same turn / commit.**
> 3. **Never defer documentation updates.** Outdated documentation is treated as a critical regression.

### Synchronization Matrix

| Component Modified | Required Action |
| :--- | :--- |
| Slash commands (`src/commands/`) | Update `docs/prd/03-functional-specifications.md` and `README.md` |
| Architecture / CDP (`src/services/cdp*`) | Update `docs/prd/02-system-architecture.md` and `docs/ARCHITECTURE.md` |
| Security / Sanitization (`src/middleware/`) | Update `docs/prd/04-security-and-threat-model.md` and this guide |
| Database schema (`src/database/`) | Update `docs/prd/05-data-design-and-storage.md` |
| Config / Environment (`src/utils/config*`) | Update `README.md` (Quick Start) and `.env.example` |
| UI / Keyboards (`src/ui/`) | Update `docs/prd/06-user-experience-and-interface.md` |
| OOP Abstractions (`src/database/base*`, etc.) | Update `docs/prd/07-oop-design-and-reusability.md` |

---

## 3. High-Level Architecture & Layer Breakdown

ANTIRLM follows a strict three-tier architecture: **CLI → Bot Gateway → Domain Services & CDP Engine**.

```
+-----------------------------------------------------------------------------------------+
|                                    ANTIRLM TOPOLOGY                                     |
+-----------------------------------------------------------------------------------------+
|  [ Telegram App (Mobile) ]                                                              |
|            ^                                                                            |
|            | Outbound HTTPS Long-Polling (getUpdates)                                   |
|            v                                                                            |
|  [ 1. Gateway & Middleware Tier ]                                                       |
|    - Grammy Bot Framework (src/bot/index.ts)                                            |
|    - Whitelist Authentication Guard (ctx.from.id ∈ ALLOWED_USER_IDS)                    |
|    - Safe Path Sanitizer (resolveSafePath with realpathSync)                            |
|    - Command & Message Router (src/commands/)                                           |
|            |                                                                            |
|            v                                                                            |
|  [ 2. Domain & Persistence Tier (OOP) ]                                                 |
|    - PromptDispatcher & ResponseMonitor (Dual-Stream Thinking vs Response)              |
|    - ApprovalDetector & AutoAcceptService                                               |
|    - SQLite Repositories (BaseRepository, ChatSession, WorkspaceBinding, Templates)     |
|            |                                                                            |
|            v                                                                            |
|  [ 3. CDP Bridge & Antigravity Target ]                                                 |
|    - CdpConnectionPool & CdpService (ws://127.0.0.1:<port>)                             |
|    - Chrome DevTools Protocol (Input.insertText, dispatchKeyEvent, Runtime.evaluate)    |
|    - Antigravity IDE Electron/Chromium DOM Target                                       |
+-----------------------------------------------------------------------------------------+
```

### Directory & File Organization

```
src/
  ├── bin/                  # CLI suite (commander: start, setup, doctor, open)
  ├── bot/                  # Telegram bot gateway, middlewares, event routing
  ├── commands/             # Slash commands (/project, /chat, /new, /model, etc.)
  ├── database/             # SQLite repositories extending BaseRepository
  ├── middleware/           # Auth whitelist and path traversal sanitization
  ├── services/             # 26 domain services (CDP, response monitor, detectors)
  ├── ui/                   # Telegram InlineKeyboard menu builders
  └── utils/                # Config loaders, loggers, i18n, formatters, path security
tests/                      # Mirrors src/ structure 1:1 with Jest suites
docs/
  ├── prd/                  # 10-part comprehensive Product Requirements Document
  ├── diagrams/             # Mermaid architectural diagrams
  ├── ARCHITECTURE.md       # Design rationale
  ├── RESPONSE_MONITOR.md   # DOM polling & mutation observer specs
  └── ANTIGRAVITY_DOM_SELECTORS.md # Critical DOM selectors reference
locales/                    # Translations (en, ja, vi)
```

---

## 4. Object-Oriented Code & Maintenance Conventions

### 4.1. Core OOP Abstractions
- **`BaseRepository<TRecord, TCreateInput>` (`src/database/baseRepository.ts`)**:
  All SQLite repositories extend this abstract base class. It centralizes statement preparation, schema initialization hooks, and transaction execution (`transaction<R>(fn)`).
- **`BaseService` (`src/services/baseService.ts`)**:
  Provides lifecycle state tracking (`start()`, `stop()`, `isRunning()`), error boundary handling (`safeExecute`), and structured diagnostic logging.
- **`ICommandHandler` & `CommandRegistry` (`src/commands/commandInterface.ts`)**:
  Decouples command execution from Telegram-specific types, enabling reusability across bots, CLIs, or alternate frontends.

### 4.2. TypeScript & Code Standards
- **Strict Mode**: Target `ES2022`, module `CommonJS`.
- **Interfaces over Types**: Use `interface` for entity data models and contracts; reserve `type` for unions.
- **Immutability**: Avoid mutating arrays or objects directly; prefer spread operators and pure transformations.
- **Imports**: Source code uses clean relative imports (`./`, `../`). Path alias `@/` is reserved for tests only.

---

## 5. Security & Threat Model (Full Defense-in-Depth)

ANTIRLM implements exhaustive safeguards against legacy and modern attack vectors:

### 5.1. Network & Access Security
- **No Inbound Listening Ports**: The bot connects outward to Telegram via long-polling. No open ports, no port-forwarding, no webhook vulnerabilities.
- **Loopback CDP Only**: CDP WebSockets bind strictly to `127.0.0.1`.
- **Zero-Trust Whitelist**: Every message and callback query checks `ctx.from.id` against `ALLOWED_USER_IDS`. Unauthorized requests are dropped silently with zero feedback or error leakage.

### 5.2. File System & Path Traversal (CWE-22, CWE-59)
- All workspace paths are resolved via `resolveSafePath(inputPath, baseDir)` in `src/middleware/sanitize.ts`.
- Uses `realpathSync` to resolve canonical paths and prevent symlink-based bypasses. Any path resolving outside `WORKSPACE_BASE_DIR` throws an immediate traversal exception.

### 5.3. Injection Attacks (CWE-78, CWE-89, CWE-94)
- **Zero Shell Evaluation**: Subprocesses use `spawn()` or `execFile()` with strict argument arrays (`shell: false`).
- **Zero Dynamic SQL**: 100% of SQLite database queries use prepared statements with positional parameters (`?`).
- **Safe CDP Text Insertion**: Prompts are inserted into Antigravity via `Input.insertText`, eliminating JavaScript string concatenation or template literal execution vulnerabilities.

### 5.4. Secrets & Telemetry (CWE-200, CWE-532)
- Zero credentials or tokens are ever logged.
- Configuration files are chmodded to `600` on setup.
- Absolutely zero telemetry, analytics, or cloud logging.

---

## 6. Human-Crafted UX & Anti-AI-Slop Charter

All bot messages, documentation, and user interfaces must adhere to human craftsmanship:

```
❌ FORBIDDEN (AI SLOP):
- Unsolicited corporate sycophancy ("I would be thrilled to assist you with that!")
- Walls of redundant text restating what the user just asked
- Emojis plastered across every line without purpose
- Cryptic terminal crash dumps thrown to chat

✅ REQUIRED (HUMAN CRAFTSMANSHIP):
- Calm, direct, and concise technical communication
- Semantic status icons only: ⏱️ (time), ⚠️ (warning), 🛑 (stop), 📁 (path)
- Language-annotated code blocks with emergency close tags
- Empathetic error handling: explains what went wrong and gives a 1-tap remedy
```

---

## 7. Developer & Contributor Guide

### Prerequisites
- **Node.js** $\ge$ 18.0.0
- **npm** $\ge$ 8.0.0
- **Antigravity IDE** installed on host PC

### Quick Commands

```bash
npm install              # Install dependencies
npm test                 # Run Jest unit test suite (700+ tests)
npm run build            # Compile TypeScript with strict checks (tsc)
npm run dev              # Start in development mode with hot-reload
npm start                # Run CLI entrypoint from source
npm run start:built      # Run from compiled dist/
npm start -- doctor      # Run environment & CDP connection diagnostic
npm start -- setup       # Run interactive setup wizard
```

---

## 8. Responsible Security Disclosure Policy

If you discover a security vulnerability in ANTIRLM, please report it responsibly:
- **Private Issue / Advisory**: Open a private advisory on GitHub or contact the maintainers directly.
- **SLA**: Acknowledged within 48 hours; critical security patches released within 7 days.
- **Never open public issues for unpatched vulnerabilities.**

---

## 9. Contributor Code of Conduct

Maintainers and contributors pledge to make participation in the ANTIRLM project a harassment-free, welcoming, and productive experience for everyone regardless of background, identity, or experience level. Disagreements must be handled constructively through respectful, evidence-based technical discourse.

---

## 10. Historical Changelog Highlights

- **v0.2.12**: Event-Driven DOM mutation monitoring via `MutationObserver` + CDP Binding (<100ms updates, reduced CPU overhead).
- **v0.2.1**: Per-workspace prompt locking, path traversal symlink hardening (`realpathSync`), HTML entity escape fixes (`&amp;`, `&lt;`, `&gt;`), Windows spawn hang resolution.
- **v0.2.0**: Initial public release with Forum Topic multi-workspace mapping, local Whisper voice transcription, and SQLite session persistence.

---

## 11. Upstream Lineage & Attribution

This project is a downstream evolution originating from **[optimistengineer/remoat](https://github.com/optimistengineer/remoat)**. Maintainers and contributors must respect and preserve attribution to the original upstream architecture while continuing to expand the project's performance, security, and developer ergonomics.
