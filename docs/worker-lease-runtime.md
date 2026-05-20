# Worker Lease Runtime

Worker leases prevent two workers from owning the same job at the same time.

## Mock Lease Flow

```text
queued job
-> claim mock lease
-> heartbeat or renew lease
-> dispatch mock worker
-> complete, fail, release, or cancel lease
```

`claimWorkerLeaseMock` accepts only queued or retry-scheduled mock jobs. It blocks already-active leases and can reclaim an expired lease by marking the old one stale.

## Lease Defaults

- Normal mock jobs: 5 minutes.
- Render/provider-style mock jobs: 30 minutes.

## Real Runtime Boundary

Real claims, heartbeat writes, lease renewals, completion, failure, and recovery require backend/service-role runtime and database transactions. Frontend code may not claim real leases or mutate worker state.

## Current Limits

The mock runtime can model ownership and lifecycle, but it does not persist to remote Supabase, start Cloud Run, call providers, render media, or spend credits.

RP-FIX-12 exposes the mock lease routes through the local server scaffold. It does not enable real lease mutation.
