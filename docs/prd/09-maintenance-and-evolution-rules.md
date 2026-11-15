# PRD 09: Maintenance Policy & Documentation Synchronization Rules
## Antigravity Telegram

---

### 1. The Golden Rule of Documentation Synchronization

> [!IMPORTANT]
> **MANDATORY POLICY FOR ALL DEVELOPERS AND AI AGENTS**:
> Whenever any file, feature, command, configuration parameter, database schema, or architectural pattern in this repository is added, modified, refactored, or deprecated, **the corresponding documentation in `docs/prd/` and the root `README.md` MUST be updated immediately within the same turn / commit**.
>
> **Never defer documentation updates to a later stage. Code and documentation must always remain in 100% lockstep.**

---

### 2. Documentation Synchronization Matrix

When you modify a component in the left column, you **must** update the corresponding documentation files listed on the right:

| Change Category | Triggering Actions | Required Documentation Updates |
| :--- | :--- | :--- |
| **New or Changed Slash Command** | Modifying `src/commands/` or `src/bot/index.ts` | 1. Update `docs/prd/03-functional-specifications.md`<br>2. Update `README.md` (Command Table)<br>3. Update `.agents/AGENTS.md` |
| **Architectural / Flow Change** | Modifying CDP connection, dispatch logic, or event monitoring | 1. Update `docs/prd/02-system-architecture.md`<br>2. Update `docs/ARCHITECTURE.md`<br>3. Update `.agents/AGENTS.md` |
| **Security or Sanitization Change** | Modifying `src/middleware/`, auth, or path resolution | 1. Update `docs/prd/04-security-and-threat-model.md`<br>2. Update `.agents/AGENTS.md` (Security Rules) |
| **Database Schema Change** | Modifying tables, indices, or SQL in `src/database/` | 1. Update `docs/prd/05-data-design-and-storage.md` |
| **Config or Environment Change** | Adding or changing `.env` variables or `configLoader.ts` | 1. Update `README.md` (Configuration Guide)<br>2. Update `.env.example`<br>3. Update `.agents/AGENTS.md` |
| **UI, Formatter, or i18n Change** | Modifying message layout, buttons, or translations | 1. Update `docs/prd/06-user-experience-and-interface.md`<br>2. Update relevant files in `locales/` |
| **Reusable Base Class / OOP Change** | Modifying `BaseRepository`, `ICommandHandler`, or services | 1. Update `docs/prd/07-oop-design-and-reusability.md` |

---

### 3. Agent & Contributor Pre-Flight Checklist

Before marking any task complete or committing code:

- [ ] **Code Verification**: `npm run build` compiled with 0 errors.
- [ ] **Test Verification**: `npm test` executed and all unit tests pass.
- [ ] **Security Review**: No credentials, tokens, or personal paths exposed.
- [ ] **PRD Synchronization**: Affected files in `docs/prd/` have been updated to reflect the new state.
- [ ] **README Synchronization**: Root `README.md` reflects any user-facing command, installation, or configuration change.
- [ ] **Cleanliness**: No temporary artifacts or dead code left behind.

---

### 4. Semantic Versioning & Release Protocol

Antigravity Telegram follows strict [Semantic Versioning (SemVer 2.0.0)](https://semver.org/):
- **PATCH (`0.2.x`)**: Bug fixes, security patches, internal refactoring, non-breaking performance optimizations.
- **MINOR (`0.x.0`)**: New slash commands, UI additions, new optional integrations, backward-compatible feature expansions.
- **MAJOR (`x.0.0`)**: Breaking architectural changes, schema incompatibility requiring manual migration, or major platform transitions.
