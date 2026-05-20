# Backend Runtime Boundary

## Current Status

RP-FIX-06 adds frontend-safe Supabase Auth bootstrap code. RP-FIX-07 adds frontend-safe storage/upload planning. RP-FIX-08 adds API route contracts, a route registry, and a frontend API client. RP-FIX-11 adds mock runtime transport and worker lease contracts. RP-FIX-12 selects Cloud Run API service as the first backend runtime target and adds a mock-only Node server scaffold.

The repo still has no deployed Cloud Run API, serverless route layer, Supabase Edge Function, worker queue, or service-role process.

## Frontend Boundary

Frontend code may use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REEDITPRO_API_BASE_URL`
- `VITE_REEDITPRO_API_MODE`

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

Backend API/runtime boundary is partially fixed: route contracts, route registry, mock router, frontend API client, and route docs exist. No backend is deployed, and real service-role/provider/payment/worker/render routes remain backend-required.

## RP-FIX-11 Result

Backend runtime transport and worker leasing are partially fixed: runtime envelopes, mock transport, backend/cloud transport placeholders, mock lease lifecycle, stale recovery, idempotency helpers, worker registry metadata, route handlers, and a local-only migration exist. No backend/cloud transport is deployed, and real lease mutation remains backend-required.

## RP-FIX-12 Result

Production backend runtime target selection is partially fixed: Cloud Run API service is selected and a mock-only server scaffold exists. No Cloud Run service, Secret Manager binding, service-role handler, provider call, Stripe call, worker dispatch, FFmpeg/Remotion job, or render execution is deployed.
