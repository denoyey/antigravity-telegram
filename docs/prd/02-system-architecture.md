# PRD 02: System Architecture & Design
## Antigravity Telegram Remote (ANTIRLM)

---

### 1. Architectural Philosophy

ANTIRLM is engineered around three foundational architectural principles:

1. **Strict Three-Tier Separation**:
   - **CLI / Bootstrapping Tier**: Environment checks, configuration discovery, process lockfile acquisition, daemon management.
   - **Telegram Gateway Tier**: Network long-polling, middleware authentication, input sanitization, message routing, keyboard UI rendering.
   - **Domain / Service & CDP Tier**: Chrome DevTools Protocol WebSocket communication, event-driven DOM mutation observation, SQLite persistence, and concurrency locks.

2. **Decoupled Object-Oriented Services**:
   Each major capability (CDP transport, response monitoring, process management, approval detection, quota evaluation) is isolated into a dedicated service class with explicit dependencies passed via constructor injection.

3. **Event-Driven Over Polling**:
   Where possible, DOM state changes are communicated from the browser via native browser bindings (`window.onAntigravityDomChange`) directly over the CDP WebSocket connection, delivering <100ms update latency and near-zero idle CPU consumption.

---

### 2. High-Level Component Architecture

```mermaid
flowchart TD
    subgraph TelegramCloud["Telegram Cloud Infrastructure"]
        TGUser["Mobile / Desktop User"]
        TGServer["Telegram Bot API"]
    end

    subgraph HostWorkstation["Local Workstation (100% Host Resident)"]
        subgraph GatewayTier["1. Gateway & Middleware Tier"]
            BotEngine["Grammy Bot Engine\n(Long-Polling)"]
            AuthGuard["Auth Guard\n(Whitelist User IDs)"]
            Sanitizer["Input & Path Sanitizer\n(realpath check)"]
            Router["Command & Message Router"]
        end

        subgraph ServiceTier["2. Domain Services Tier (OOP)"]
            Dispatcher["PromptDispatcher"]
            RespMonitor["ResponseMonitor\n(Dual Stream Engine)"]
            AutoAccept["AutoAcceptService"]
            Detectors["Approval & Planning Detectors"]
            SessionSvc["ChatSessionService"]
            TopicMgr["TelegramTopicManager"]
        end

        subgraph DatabaseTier["3. Persistence Tier"]
            SQLite[("Local SQLite Database\n(antigravity.db)")]
            SessionRepo["ChatSessionRepository"]
            BindingRepo["WorkspaceBindingRepository"]
            TmplRepo["TemplateRepository"]
            SchedRepo["ScheduleRepository"]
        end

        subgraph CDPTier["4. CDP Bridge Tier"]
            CDPPool["CdpConnectionPool"]
            CDPBridge["CdpBridgeManager"]
            CDPSvc["CdpService\n(WebSocket ws://127.0.0.1)"]
        end

        subgraph AntigravityIDE["5. Antigravity IDE Target"]
            ChromiumDOM["Chromium Renderer Window\n(Active Page Target)"]
            MutationObs["DOM MutationObserver\n& Assistant Nodes"]
        end
    end

    TGUser <-->|Encrypted Chat| TGServer
    TGServer <-->|HTTPS Long-Polling| BotEngine
    BotEngine --> AuthGuard
    AuthGuard --> Sanitizer
    Sanitizer --> Router
    Router --> Dispatcher
    Router --> SessionSvc

    Dispatcher --> CDPSvc
    RespMonitor --> CDPSvc
    Detectors --> CDPSvc
    CDPSvc <-->|WebSocket JSON-RPC| ChromiumDOM
    ChromiumDOM -.->|Event Binding Callback| RespMonitor

    SessionSvc --> SessionRepo
    Router --> BindingRepo
    SessionRepo --> SQLite
    BindingRepo --> SQLite
    TmplRepo --> SQLite
    SchedRepo --> SQLite
```

---

### 3. Layer Responsibilities & Core Classes

#### 3.1. CLI & Process Initialization (`src/bin/`, `src/index.ts`)
- **`acquireLock()`**: Enforces single-instance execution per user environment via a file lock (`/tmp/antigravity-telegram-remote.lock` or OS temp). Automatically verifies if the existing PID is alive before terminating to prevent stale locks.
- **`ConfigLoader`**: Discovers configuration from `.env` or `~/.config/antigravity-telegram-remote/config.json`. Validates required environment variables (`TELEGRAM_BOT_TOKEN`, `ALLOWED_USER_IDS`).
- **`startAction` / `doctorAction` / `setupAction` / `openAction`**:
  - `doctor`: Verifies Node.js version, platform executables, CDP port reachability, and SQLite file permissions.
  - `open`: Detects OS and launches Antigravity with `--remote-debugging-port=<available-port>`.

#### 3.2. Telegram Gateway & Middleware (`src/bot/`, `src/middleware/`)
- **`bot.use(...)` Whitelist Gatekeeper**:
  Inspects `ctx.from.id`. If not in `config.allowedUserIds`, incoming messages and callbacks are dropped immediately.
- **`TelegramTopicManager`**:
  Creates and maintains Telegram Supergroup Forum Topics, binding topic threads (`message_thread_id`) to workspace paths on disk.
- **`StreamMessageFormatter` & `TelegramFormatter`**:
  Converts rich DOM output, Markdown, and ANSI console codes into strict, valid Telegram HTML. Implements emergency closure of open tags (`</code></pre>`) during streaming chunks.

#### 3.3. CDP Integration & Bridge (`src/services/`)
- **`CdpConnectionPool`**:
  Manages persistent WebSocket connections across multiple active Antigravity workspace windows, reusing connections and preventing port exhaustion.
- **`CdpService`**:
  Implements the low-level Chrome DevTools Protocol JSON-RPC envelope over `ws://127.0.0.1:<port>`. Handles:
  - Target discovery (`/json/list`).
  - Focus switching (`Target.activateTarget`).
  - Safe message evaluation (`Runtime.evaluate` & `Input.insertText`).
  - Synthetic input dispatch (`Input.dispatchKeyEvent`).
  - Screenshot streaming (`Page.captureScreenshot`).

#### 3.4. Response Monitor & Stream Engine (`src/services/responseMonitor.ts`)
- **Dual-Stream Strategy**:
  1. **Thinking & Execution Stream**: Captures progress, tool activations, file diff operations, and command executions into a transient status message.
  2. **Final Content Stream**: Formats and streams the assistant's final response text to Telegram.
- **Completion Detection**:
  Watches for the presence/absence of the Antigravity "Stop" button. Requires 3 consecutive confirmation checks across ticks to prevent false completion triggers caused by DOM rendering flickers.
- **Baseline Suppression**:
  Records DOM node checkpoints before prompt injection to avoid echoing previous conversational turns back to the user.

---

### 4. Concurrency & Workspace Isolation

```mermaid
sequenceDiagram
    autonumber
    actor User as Telegram User (Phone)
    participant Bot as Bot Router
    participant Lock as Workspace Mutex Lock
    participant Dispatcher as PromptDispatcher
    participant CDP as CdpService
    participant IDE as Antigravity IDE

    User->>Bot: Send prompt in Topic #12 (Workspace: repo-a)
    Bot->>Lock: Acquire Lock for "repo-a"
    alt Lock Already Held by Another Topic
        Lock-->>Bot: REJECT (Busy)
        Bot-->>User: "⏳ Workspace is busy executing another prompt. Please wait."
    else Lock Acquired
        Lock-->>Bot: GRANTED
        Bot->>Dispatcher: Dispatch prompt
        Dispatcher->>CDP: Focus Workspace & Clear Input
        CDP->>IDE: Inject text & press Enter
        loop While Generation Active
            IDE-->>CDP: DOM Mutation Event
            CDP-->>Bot: Stream text / progress
            Bot-->>User: Edit message (Throttled >= 1.5s)
        end
        IDE-->>CDP: Stop Button Disappears (Complete)
        CDP-->>Bot: onComplete()
        Bot->>Lock: Release Lock for "repo-a"
        Bot-->>User: Final Response Sent
    end
```

To eliminate race conditions:
1. Prompts sent to the same workspace directory are serialized using an in-memory workspace lock (`Map<string, Promise<void>>`).
2. Two separate Telegram forum topics bound to the same repository directory cannot trigger overlapping prompts.
3. `/stop` resolves the exact workspace bound to the invoking topic, preventing accidental cancellation of unrelated tasks in other workspaces.
