# Backend API Mock Runtime

The mock runtime lets frontend and local code call route-shaped APIs without deploying infrastructure or touching real backend services.

## How It Works

- `src/backend/api/api-runtime-contracts.ts` defines route, request, context, and response envelopes.
- `src/backend/api/api-route-registry.ts` lists all known route definitions with security and runtime status.
- `src/backend/api/mock-api-router.ts` handles safe route IDs and blocks backend-required routes.
- `src/backend/api/frontend-api-client.ts` defaults to the mock router.

The mock router calls existing deterministic services for auth status, upload planning, source sequence ordering, chat-native planning, music/SFX mock planning, StoryTiming mock planning, and local QA summaries.

RP-FIX-09 also adds mock credit runtime routes for estimate/gate demonstration. These routes can return allowed or blocked decisions, mock reservations, and mock ledger outcomes through local services only.

RP-FIX-11 adds mock runtime transport and worker lease routes. These routes can create envelopes, acknowledge mock transport, claim/heartbeat/renew/release/complete/fail mock leases, recover stale mock leases, and inspect worker runtime metadata. They do not mutate remote worker state.

RP-FIX-12 exposes the mock router through a local Node HTTP server at `POST /api/mock`. This is a Cloud Run API scaffold only; no deployment or live backend handler is enabled.

RP-FIX-14 adds project-level SFX mock handlers for planning, provider routes, prompt plans, credit estimates, queueing mock generation, running the mock worker, and status summaries. These handlers call local services/orchestrators only and keep Mirelo/MMAudio execution in mock mode.

RP-FIX-15 adds a mock SFX provider readiness handler. It reports whether future real Mirelo/MMAudio execution is blocked, mock-only, or ready for a future backend transport implementation. It returns readiness state only and never calls providers.

## What It Does Not Do

The mock runtime does not:

- deploy or start a server;
- call provider APIs;
- upload or delete storage objects;
- create signed upload URLs;
- reserve, spend, or refund real credits;
- write production database rows;
- start workers;
- claim real worker leases;
- call Cloud Run, Pub/Sub, or Supabase Edge Functions;
- render video;
- call payment services.

## Future API Transport

`VITE_REEDITPRO_API_BASE_URL` is reserved for a future deployed API. RP-FIX-08 intentionally does not perform live HTTP transport yet. When a backend is deployed, `callReeditProApi` can become the single frontend entrypoint for safe route calls and can attach only safe user-session auth, never backend secrets.

## Avoiding Accidental Provider Calls

Provider, payment, worker, and admin route files are metadata-only. They must not import SDK clients, provider configs, worker skeletons, or secret-bearing modules. Real execution belongs behind a reviewed backend runtime and the approval/credit gate.
