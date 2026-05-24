# Guidelines quick pack (implemented)

WalkingTree **Guidelines & Standards** — high-impact items added May 2026.

| Item | Implementation |
|------|----------------|
| **Health + version** | `GET /health` returns `service`, `status`, `version`, `timestamp` |
| **404 on missing trace** | `GET /api/v1/ira/agent-traces/:executionId` |
| **422 validation** | `sendValidationError()` — login, goals/simulate, Ira chat, feedback |
| **OpenAPI** | `docs/openapi.yaml` + `GET /api/v1/openapi.yaml` (linked from service-info) |
| **Password hashing** | `server/lib/password.ts` (scrypt) + `server/lib/demoAuth.ts` |

Demo logins unchanged: `planner@finplan.in` / `planner123`, `rahul@gmail.com` / `rahul123`.
