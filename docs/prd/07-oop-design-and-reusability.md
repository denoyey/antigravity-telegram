# PRD 07: OOP Architecture & Reusability Framework
## Antigravity Telegram Remote (ANTIRLM)

---

### 1. Object-Oriented Design Principles

To ensure high maintainability, testability, and code reusability across projects, ANTIRLM adheres strictly to SOLID object-oriented design patterns:

```
+-----------------------------------------------------------------------------------------+
|                                    SOLID IN ANTIRLM                                     |
+-------------------+---------------------------------------------------------------------+
| Single Resp (S)   | Each service or repository handles exactly one domain responsibility|
| Open/Closed (O)   | Extensible via abstract base classes and interfaces without hacking |
| Liskov Subst (L)  | Repositories and handlers implement unified contracts reliably      |
| Interface Seg (I) | Narrow interfaces (e.g. ICdpClient, ICommandHandler)                |
| Dependency Inv (D)| Services accept repositories/APIs via constructor dependency inject |
+-------------------+---------------------------------------------------------------------+
```

---

### 2. Core Reusable OOP Abstractions

#### 2.1. Reusable Repository Framework (`BaseRepository<T, K>`)
A generic abstract base class providing robust SQLite mechanics for all data entities:

```typescript
export abstract class BaseRepository<TRecord, TCreateInput> {
    protected readonly db: Database.Database;
    protected isInitialized = false;

    constructor(db: Database.Database) {
        this.db = db;
        this.initialize();
        this.isInitialized = true;
    }

    /** Hook to execute DDL table creations */
    protected abstract initialize(): void;

    /** Helper to safely prepare SQL statements */
    protected prepare(sql: string): Database.Statement {
        return this.db.prepare(sql);
    }

    /** Execute atomic transactions */
    public transaction<R>(fn: () => R): R {
        return this.db.transaction(fn)();
    }
}
```
- **Reusability**: Any new table or SQLite entity across this or future projects extends `BaseRepository`, immediately inheriting statement compilation and transaction wrappers.

#### 2.2. Reusable Command Pattern (`ICommandHandler` & `CommandRegistry`)
Decouples bot command execution from Grammy-specific event handling:

```typescript
export interface CommandContext {
    userId: string;
    chatId: number | string;
    topicId?: number;
    args: string[];
    reply: (text: string, options?: any) => Promise<any>;
}

export interface ICommandHandler {
    readonly name: string;
    readonly description: string;
    readonly requiresWorkspace?: boolean;
    execute(ctx: CommandContext): Promise<void>;
}

export class CommandRegistry {
    private readonly handlers = new Map<string, ICommandHandler>();

    public register(handler: ICommandHandler): void {
        this.handlers.set(handler.name.toLowerCase(), handler);
    }

    public async dispatch(commandName: string, ctx: CommandContext): Promise<boolean> {
        const handler = this.handlers.get(commandName.toLowerCase());
        if (!handler) return false;
        await handler.execute(ctx);
        return true;
    }
}
```
- **Reusability**: Allows the exact same command logic to be bound to Telegram, Discord, Slack, CLI, or an internal Webhook server without modifying business logic.

#### 2.3. Decoupled CDP Engine (`ICdpClient`)
Isolates Chrome DevTools Protocol interaction behind an interface:
- Methods: `connect()`, `disconnect()`, `call(method, params)`, `evaluate(expression)`, `sendText(text)`.
- Can be reused directly to automate any Chromium-based application (VS Code, Electron apps, Chrome headless, Puppeteer-like drivers).

---

### 3. Directory Layout & Maintenance Standards

The repository structure follows a strictly predictable naming and organizational convention:

```
src/
  ├── bin/                  # CLI Entrypoints and executable commands
  │   ├── cli.ts            # Commander CLI root
  │   ├── welcome.ts        # ASCII art & welcome dialogs
  │   └── commands/         # Subcommands (start, setup, doctor, open)
  ├── bot/                  # Telegram Bot Gateway & Routing
  │   └── index.ts          # Grammy event listeners & middlewares
  ├── commands/             # Slash command domain handlers
  │   ├── commandInterface.ts # Reusable Command OOP contracts
  │   ├── chatCommandHandler.ts
  │   ├── cleanupCommandHandler.ts
  │   ├── joinCommandHandler.ts
  │   ├── slashCommandHandler.ts
  │   └── workspaceCommandHandler.ts
  ├── database/             # Persistence Layer
  │   ├── baseRepository.ts # Generic OOP SQLite Base Repository
  │   ├── chatSessionRepository.ts
  │   ├── scheduleRepository.ts
  │   ├── templateRepository.ts
  │   └── workspaceBindingRepository.ts
  ├── middleware/           # Pipeline filters
  │   ├── auth.ts           # Whitelist authentication
  │   └── sanitize.ts       # Path traversal and input validation
  ├── services/             # Core Business Logic & CDP Engine
  │   ├── baseService.ts    # Reusable service base class
  │   ├── cdpService.ts     # Core CDP protocol driver
  │   ├── cdpBridgeManager.ts
  │   ├── cdpConnectionPool.ts
  │   ├── responseMonitor.ts# Dual-stream DOM monitor
  │   ├── approvalDetector.ts
  │   ├── promptDispatcher.ts
  │   └── ... (26 domain services)
  ├── ui/                   # Telegram InlineKeyboards
  │   ├── autoAcceptUi.ts
  │   ├── modelsUi.ts
  │   ├── modeUi.ts
  │   ├── planUi.ts
  │   └── projectListUi.ts
  └── utils/                # Pure utility modules
      ├── configLoader.ts   # Configuration loader
      ├── logger.ts         # Leveled logger with ANSI colors
      ├── pathUtils.ts      # Safe OS path resolution
      └── telegramFormatter.ts # HTML converter & chunk splitter
```

- **Naming Rules**:
  1. File names must use `camelCase` matching their primary exported class or function.
  2. Suffixes must reflect architectural layer: `*Repository.ts`, `*Service.ts`, `*Handler.ts`, `*Ui.ts`, `*Utils.ts`.
  3. Every file in `src/` must have a corresponding test in `tests/` mirroring the directory path.
