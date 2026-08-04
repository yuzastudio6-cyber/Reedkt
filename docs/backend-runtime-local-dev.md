# Backend Runtime Local Dev

RP-FIX-12 adds a mock-only local Node runtime. It is not deployed and does not call external services.

## Interactive Browser And API Workspace

The current private-internal manual testing entry point is:

```bash
npm run dev:private-workspace
```

It supervises the Express API and Vite app together, binds both to loopback, selects local-test browser auth plus reviewed frontend-safe HTTP transport, enables local private uploads, and isolates artifacts under `.reeditpro-local-storage/private-workspace`. It also scrubs Supabase, Google Cloud, provider, Stripe, and secret-reference configuration from both child environments.

Use `npm run dev:private-workspace:check` for a non-starting configuration check and `npm run smoke:private-workspace-launcher` for its focused safety smoke. Full instructions and boundaries are in `docs/private-workspace-manual-testing.md`.

This workflow does not change the frontend-only `npm run dev` command and does not claim staging, external-beta, or production readiness.

## Build

```powershell
npm.cmd run build:server
```

## Run

```powershell
$env:SERVER_RUNTIME_MODE='mock'
$env:PORT='8080'
npm.cmd run start:server
```

Safe startup message:

```text
ReeditPro backend runtime listening on port 8080 in mock mode.
```

## Routes

- `GET http://localhost:8080/health`
- `GET http://localhost:8080/ready`
- `GET http://localhost:8080/api/runtime/status`
- `GET http://localhost:8080/api/routes`
- `POST http://localhost:8080/api/mock`

`POST /api/mock` accepts the existing API request envelope and routes through the local mock API router. Backend-required/provider/Stripe/service-role routes remain blocked.

## Frontend Integration

For local-only development, keep `VITE_REEDITPRO_API_MODE=mock` so frontend calls stay local/mock-safe. For signed-in internal testing through Lovable or another hosted frontend, set `VITE_REEDITPRO_API_MODE=frontend_safe` and point `VITE_REEDITPRO_API_BASE_URL` at the deployed ReEditPro backend. Reviewed `/v1` routes can then handle projects, private source uploads, internal edit state, approved snapshot metadata, credit approval/reservation metadata, and private internal review/download records while backend-required worker/provider/render/billing routes stay gated.
