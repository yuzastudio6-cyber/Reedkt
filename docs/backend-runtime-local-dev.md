# Backend Runtime Local Dev

RP-FIX-12 adds a mock-only local Node runtime. It is not deployed and does not call external services.

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

## Frontend Integration Later

The Vite frontend can later point `VITE_REEDITPRO_API_BASE_URL` at a deployed backend. Until then, `VITE_REEDITPRO_API_MODE=mock` keeps frontend calls local/mock-safe.
