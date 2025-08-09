# CLAUDE.md - Esensi Project Conventions

## General
- File naming: kebab-case | Package manager: bun (NEVER npm) | Language: ID (UI), EN (code)
- TypeScript: type-only imports | Git: Fix TS errors before commit
- Multi-domain: main, chapter, publish, internal, auth

## Frontend
- State: useLocal (component), Valtio (shared) | UI: Shadcn + Tailwind
- Router: Custom multi-domain | API: Generated clients `@/lib/gen/[domain]`
- Auth: better-auth with Protected wrapper

## Backend
- API: defineAPI with standard response `{ success, data?, message? }`
- DB: Prisma with global `db` | CRUD: crudHandler pattern
- Auth: better-auth multi-user | Notifications: WebSocket | Email: Multi-SMTP

## Structure
- APIs: `backend/src/api/[domain]/[feature].ts`
- States: `frontend/src/lib/states/[feature]-state.ts`
- Run `bun gen` after API changes

## Key Patterns
- Error messages: Bahasa Indonesia | Soft delete: deleted_at fields
- Auth: Multi-user types with roles | Real-time: WebSocket notifications
- CRUD: Standardized operations with state persistence

## Development
- Check null/undefined before object access
- Fix TypeScript errors before committing
- Test before major commits

## Sub-Agents
AGGRESSIVELY use specialized sub-agents - avoid general agent:
- **Frontend**: State management, ECrud, components, auth, UI issues
- **Backend**: APIs, CRUD handlers, DB operations, notifications, security
- **DBA**: Schema changes, migrations, DB sync, performance optimization
- **DevOps**: Deployment, infrastructure, CI/CD, environment setup
- **General**: Only for multi-domain searches, complex analysis

MANDATORY: Use bun (NEVER npm) in ALL sub-agents. Delegate ALL domain-specific tasks.