# PRD 08: Testing Strategy & Quality Assurance
## Antigravity Telegram

---

### 1. Quality Assurance Philosophy

Antigravity Telegram operates in a high-concurrency, event-driven environment connecting two independent external systems (Telegram Bot API and Antigravity Chromium DOM). Reliability, zero regressions, and resilience against network jitter are achieved through an exhaustive testing pyramid:

```
                  / \
                 /   \
                / E2E \       Integration Tests (Real CDP / Bot instance)
               /-------\
              / Service \     Mock WebSocket CDP & Protocol Simulation
             /-----------\
            /  Unit Tests \   Repositories, Formatters, Sanitizers, Parsers (700+ Tests)
           /---------------\
```

---

### 2. Testing Layers & Tooling

- **Test Runner**: Jest 29+ with `ts-jest` for in-memory TypeScript compilation.
- **Mocking Strategy**:
  - `ws` WebSocket connections are mocked via local mock servers (`ws.Server`) or simulated event emitters.
  - Telegram API calls (`bot.api.*`) are mocked with Jest function spies.
  - Native system binaries (such as `whisper.cpp` or `better-sqlite3`) use in-memory SQLite (`:memory:`) or mocked module facades during unit test runs.

---

### 3. Key Test Suites & Coverage

#### 3.1. Security & Sanitization (`tests/middleware/sanitize.test.ts`)
Validates that `resolveSafePath` resists:
- Standard parent directory traversal: `../`, `../../sensitive`.
- Windows backslash traversal: `..\..\Windows\System32`.
- Encoded or malformed directory jumps.
- Symlink bypass attempts pointing outside `WORKSPACE_BASE_DIR`.

#### 3.2. CDP Protocol & Injection (`tests/services/cdpService.*.test.ts`)
- **Key Event Dispatch**: Tests `dispatchKeyEvent` modifiers across operating systems (Meta `4` on macOS, Ctrl `2` on Linux/Windows).
- **Text Insertion**: Tests `Input.insertText` safely delivering complex markdown, unicode, and multiline text.
- **Reconnection Resilience**: Simulates WebSocket disconnects and verifies exponential backoff retry up to 3 attempts.

#### 3.3. Dual-Stream Response Monitoring (`tests/services/responseMonitor.*.test.ts`)
- Tests completion detection requiring 3 consecutive checks without false triggers.
- Tests suppression of previous conversational turn baselines.
- Tests DOM selector priority scoring.

#### 3.4. Database Repositories (`tests/database/`)
- Tests CRUD operations on SQLite in-memory databases.
- Tests `UNIQUE` constraint enforcement on channel IDs and template names.
- Tests pagination and retention window filtering.

---

### 4. Running Tests & Commands

```bash
# Run the complete unit test suite
npm test

# Run a specific test suite
npx jest tests/middleware/sanitize.test.ts

# Run tests in watch mode during development
npm run test:watch

# Compile TypeScript to verify strict type safety
npm run build
```

---

### 5. Verification Checklist for Release

Before any version tag or deployment:
1. `npm run build` exits with code 0 (zero TypeScript errors).
2. `npm test` passes with 100% green suites.
3. No secrets or personal environment files committed (`git status` clean).
4. Documentation and `README.md` are synchronized per PRD 09 rules.
