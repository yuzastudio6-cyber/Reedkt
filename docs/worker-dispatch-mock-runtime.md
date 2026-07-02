# Worker Dispatch Mock Runtime

RP-FIX-10 adds a mock dispatch boundary for worker jobs.

## Dispatch Rules

- Dispatch runs only after `JobGateCheckResult.ok` is true.
- Lyria music jobs can call the existing local Lyria worker skeleton.
- SFX jobs can call the existing local SFX worker skeleton.
- Render jobs use a generic mock placeholder because no render worker skeleton exists yet.
- Custom jobs return not implemented.

No provider API, Cloud Run job, real render, storage write, Stripe call, service-role write, or remote Supabase call happens.

## Future Runtime

Production dispatch can later map job records to Cloud Run services, Cloud Run Jobs, Pub/Sub, Supabase Edge Functions, or a worker runtime. That future implementation must re-check edit plan approval, credit reservation, generation/render request readiness, assets, timing, and provider safety before running.

## RP-FIX-11 Lease Integration

Mock dispatch now claims a local worker lease before running a mock worker, sends a mock heartbeat, records an idempotency key, and marks the lease completed or failed. Render dispatch still uses a generic placeholder because the render worker skeleton is missing.
