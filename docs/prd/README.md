# Product Requirements Document (PRD) Suite
## Antigravity Telegram Remote (ANTIRLM)

---

### Navigation Index

| Document | Focus & Scope | Primary Stakeholders | Status |
| :--- | :--- | :--- | :--- |
| **[01. Overview & Objectives](./01-overview-and-objectives.md)** | Product vision, target personas, problem definition, OKRs, and scope boundaries | Product Managers, Engineering Leads | `Active` |
| **[02. System Architecture](./02-system-architecture.md)** | 3-tier architecture, OOP domain models, CDP bridge, event-driven DOM engine | System Architects, Core Developers | `Active` |
| **[03. Functional Specifications](./03-functional-specifications.md)** | Commands catalog, topic routing, streaming, auto-accept, voice transcription | Full-Stack Engineers, QA | `Active` |
| **[04. Security & Threat Model](./04-security-and-threat-model.md)** | Defense-in-depth, OWASP/CWE mitigations, path traversal defense, safe CDP | Security Engineers, DevSecOps | `Active` |
| **[05. Data Design & Storage](./05-data-design-and-storage.md)** | SQLite schema, repository abstractions, concurrency controls, migrations | Backend Engineers, DBA | `Active` |
| **[06. User Experience & Interface](./06-user-experience-and-interface.md)** | Telegram UI/UX specifications, non-AI-slop design system, responsive keyboards | Product Designers, Bot Developers | `Active` |
| **[07. OOP Design & Reusability](./07-oop-design-and-reusability.md)** | Reusable base classes, repository patterns, extensible adapter interfaces | Software Engineers | `Active` |
| **[08. Testing & Quality Assurance](./08-testing-and-quality-assurance.md)** | Test pyramid, CDP mock fixtures, concurrency tests, regression standards | QA Engineers, Contributors | `Active` |
| **[09. Maintenance & Evolution Rules](./09-maintenance-and-evolution-rules.md)** | Documentation auto-sync rule, changelog conventions, release checklist | All Maintainers & AI Agents | `Active` |

---

### Executive Summary

**Antigravity Telegram Remote (ANTIRLM)** is a local-first remote gateway connecting smartphone devices via Telegram to the desktop [Antigravity IDE](https://antigravity.dev). Operating 100% locally on the host machine via the Chrome DevTools Protocol (CDP), ANTIRLM eliminates the requirement for intermediary cloud relays, third-party backend proxies, or external hosted services.

#### Core Value Pillars

```
+---------------------------------------------------------------------------------+
|                                 ANTIRLM CORE                                    |
+------------------------+-------------------------------+------------------------+
|       1. PRIVACY       |          2. SPEED             |       3. CONTROL       |
| 100% Local Execution   | <100ms Event Mutation Updates | Topic-Workspace Bind   |
| Zero External Telemetry| Dual Output Streams (AI+Logs) | Remote Approval Prompt |
| Strict Whitelist Auth  | Local Whisper Transcription   | Auto-Accept Safeguards |
+------------------------+-------------------------------+------------------------+
```

1. **Absolute Data Privacy**: All source code, prompts, credentials, and telemetry remain strictly on the host operating system. The bot relies exclusively on outbound long-polling to Telegram servers; zero inbound listening ports are exposed to the public Internet.
2. **Sub-100ms Real-Time Responsiveness**: Utilizes native browser CDP bindings (`MutationObserver`) to capture assistant output and activity streams without polling latency or high CPU consumption.
3. **Ergonomic Workspace Isolation**: Seamlessly routes distinct project directories into dedicated **Telegram Forum Topics**, providing isolated context, independent conversation histories, and concurrency locks per workspace.
4. **Human-Centric Craftsmanship**: Free from generic AI slop, robotic boilerplate, or fragile hacks. Designed with clean Object-Oriented patterns, resilient type safety, and clear user feedback.

---

### Document Roadmap & Reading Guide

- **If you are developing a new feature**: Read `02-system-architecture.md`, `03-functional-specifications.md`, and `07-oop-design-and-reusability.md`.
- **If you are reviewing security or adding inputs**: Read `04-security-and-threat-model.md` thoroughly.
- **If you are designing bot replies or keyboards**: Check `06-user-experience-and-interface.md`.
- **If you are making any change to the repository**: You **must** comply with the policy in `09-maintenance-and-evolution-rules.md` (automatic update of documentation and README).
