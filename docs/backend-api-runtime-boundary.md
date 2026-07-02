# Backend API Runtime Boundary

RP-FIX-08 adds a route contract layer and local mock router. It does not deploy a backend, create HTTP endpoints, call providers, run workers, render media, charge credits, call payment services, or use privileged database credentials.

## Runtime Shape

The intended production flow is:

```text
Frontend chat/editor UI
-> frontend-safe API client
-> deployed backend route
-> backend service, Supabase, worker, provider, or payment runtime
```

The current RP-FIX-08 flow is:

```text
Frontend or local caller
-> frontend-safe API client
-> mock API router
-> existing deterministic mock services
```

`VITE_REEDITPRO_API_MODE` defaults to `mock`. `VITE_REEDITPRO_API_BASE_URL` is a safe placeholder for a future backend, but live HTTP transport remains intentionally gated.

## Frontend-Safe Operations

Frontend-safe routes may read public configuration, inspect auth/bootstrap status, validate uploads, create upload plans, create storage object paths, and run deterministic mock planning flows.

Frontend-safe code may use only public browser configuration such as `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REEDITPRO_API_BASE_URL`, and `VITE_REEDITPRO_API_MODE`.

## Backend-Required Operations

Backend-required routes include service-role database writes, signed upload/download creation when RLS cannot support direct access, credit reserve/spend/refund, approved snapshot persistence, worker/job creation, provider requests, payment checkout/webhooks, rendering/export, destructive storage operations, and admin/moderation actions.

These routes are represented in `src/backend/api/api-route-registry.ts` but return backend-required or disabled responses in the mock runtime.

RP-FIX-09 adds frontend-safe mock credit gate checks so local/demo code can verify the approval sequence without spending real credits. Real credit reservation, spend, release, refund, provider calls, render execution, and worker queueing remain backend-required.

RP-FIX-10 adds frontend-safe mock job runtime routes. These routes can demonstrate queue readiness, dependency chains, dispatch placeholders, job events, retry plans, and chat summaries. Real worker dispatch, job leasing, provider execution, render execution, and service-role job state mutation remain backend-required.

RP-FIX-11 adds frontend-safe mock runtime transport and worker lease routes. These routes can demonstrate runtime envelopes, mock transport acknowledgements, mock lease claim/heartbeat/renew/release/complete/fail/cancel, stale recovery, idempotency conflict checks, and worker registry metadata. Real lease mutation, Cloud Run, Pub/Sub, Supabase Edge transport, provider execution, rendering, and service-role worker state changes remain backend-required.

RP-FIX-12 chooses Cloud Run API service as the first backend runtime target and adds a mock-only Node server scaffold with `/health`, `/ready`, `/api/runtime/status`, `/api/routes`, and `/api/mock`. It does not deploy Cloud Run or enable real backend-required handlers.

## Security Levels

The route registry labels routes as public, authenticated, workspace member, workspace editor, workspace owner/admin, backend service role, provider-secret required, or payment-secret required.

Provider, payment, admin, real generation, real render, real credit mutation, and privileged storage routes are metadata-only in RP-FIX-08. They do not import provider SDKs, worker runtimes, payment SDKs, or backend secret configuration.

## Future Runtime Options

The contracts can be implemented later by:

- Cloud Run API service;
- Supabase Edge Functions;
- serverless API routes;
- worker runtime;
- local mock runtime.

No option is deployed or selected by this task.
