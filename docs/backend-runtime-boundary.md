# Backend Runtime Boundary

## Current Status

RP-FIX-06 adds frontend-safe Supabase Auth bootstrap code. RP-FIX-07 adds frontend-safe storage/upload planning. RP-FIX-08 adds API route contracts, a route registry, and a frontend API client. RP-FIX-11 adds mock runtime transport and worker lease contracts. RP-FIX-12 selects Cloud Run API service as the first backend runtime target and adds a mock-only Node server scaffold.

An IAM-private `reeditpro-api-staging` Cloud Run service now exists, but its revision is not verified as the reviewed current source and it has no browser gateway. API Gateway is disabled. The repository therefore still has no proven signed-in browser-to-Cloud-Run staging runtime, durable worker queue, or production-ready service-role process.

## Frontend Boundary

Frontend code may use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REEDITPRO_API_BASE_URL`
- `VITE_REEDITPRO_API_MODE`
- `VITE_REEDITPRO_API_TRANSPORT`

Frontend code must not use:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

The browser auth bootstrap can select/insert/update only what RLS permits. If RLS blocks profile, workspace, or membership creation, the code returns a backend-required warning.

## Backend-Only Work

The following remain backend-only future work:

- service-role profile/workspace bootstrap;
- private upload signing and storage access;
- deployed storage bucket policy validation and signed media delivery;
- credit reservation, spending, refunds, and ledger writes;
- approved snapshot creation;
- worker job creation, lease claims, heartbeats, renewals, status writes, and stale lease recovery;
- provider integrations;
- rendering/export execution;
- audit events.

RP-FIX-08 represents these as backend-required or disabled route definitions. The mock router blocks them rather than trying to emulate privileged execution in browser code.

## RP-FIX-06 Result

Auth/profile/workspace bootstrap is partially fixed: the frontend-safe layer exists and safely handles not-configured and signed-out states. Production-ready backend/admin bootstrap remains open.

## RP-FIX-07 Result

Storage/upload pipeline readiness is partially fixed: frontend-safe helpers, upload validation, bucket/path planning, mock records, source order flow, and a local storage policy migration exist. Production-ready upload and private media delivery still require deployed RLS/buckets and likely backend signed routes.

## RP-FIX-08 Result

Backend API/runtime boundary is partially fixed: route contracts, route registry, mock router, frontend API client, and route docs exist. A private staging service resolves but is not verified as the reviewed current runtime; real service-role/provider/payment/worker/render routes remain backend-required.

The private browser transport follow-up adds an opt-in Google API Gateway contract. It validates a Supabase user JWT at the gateway, keeps Cloud Run IAM-private, and revalidates the original user token in Express. Source evidence passes, but API Gateway enablement, gateway service identity, live IAM, hosted frontend configuration, and real-user route readback remain blocked.

## RP-FIX-11 Result

Backend runtime transport and worker leasing are partially fixed: runtime envelopes, mock transport, backend/cloud transport placeholders, mock lease lifecycle, stale recovery, idempotency helpers, worker registry metadata, route handlers, and a local-only migration exist. No backend/cloud transport is deployed, and real lease mutation remains backend-required.

## RP-FIX-12 Result

Production backend runtime target selection is partially fixed: Cloud Run API service is selected, a server scaffold exists, and an IAM-private staging service name resolves. That deployed revision, Secret Manager binding, API Gateway bridge, durable service-role handlers, provider calls, Stripe, distributed worker dispatch, and production rendering are not verified or enabled.
