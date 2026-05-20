# Backend Runtime Transport

RP-FIX-11 adds runtime envelopes and transport placeholders. It does not deploy a backend or make network calls.

## Runtime Envelopes

`BackendRuntimeEnvelope` carries:

- request, job, batch, workspace, project, and edit-plan context;
- runtime target such as API route, planning worker, music worker, SFX worker, render worker, provider adapter, or custom target;
- transport mode such as mock, backend HTTP, Supabase Edge Function, Cloud Run service/job, Pub/Sub, manual, or disabled;
- safety level;
- payload;
- idempotency key;
- mock-only marker.

## Mock Transport

`sendMockRuntimeEnvelope` validates the envelope, records a local mock runtime message when a mock DB is provided, and returns an acknowledged mock result. It does not call HTTP, Supabase Edge, Cloud Run, Pub/Sub, providers, Stripe, storage, or render workers.

## Real Transport Placeholders

Backend HTTP, Supabase Edge Function, Cloud Run service, Cloud Run job, and Pub/Sub transports return backend-required placeholder responses. They exist as contracts only.

RP-FIX-12 adds a first Cloud Run API service scaffold as a Node HTTP server, but transport remains mock-only. The server can expose mock route transport through `/api/mock`; it does not call Cloud Run, Pub/Sub, Supabase Edge, or provider routes.

## Frontend Safety

Frontend-safe code must not send service-role, provider-secret, Stripe-secret, or cloud-runtime messages. Provider, render, music, SFX, video generation, credit mutation, and worker execution remain backend-required.
