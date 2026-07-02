# Job Runtime Queue Readiness

RP-FIX-10 adds a mock-safe job runtime layer between approved plans, credit reservations, and future worker execution.

## Runtime Flow

```text
approved edit plan
-> approved credit estimate
-> credit reservation
-> generation/render request
-> mock queue item
-> gate check
-> mock dispatch or blocked status
-> job events
-> completion/failure/retry
-> mock credit spend/release/refund
```

## Gate Checks

The job runtime checks:

- edit plan approval;
- approved credit estimate and reserved credits;
- generation request presence when required;
- provider mode safety;
- required assets;
- render timing manifest readiness;
- workspace/project scope;
- backend runtime requirement.

Blocked jobs do not dispatch mock workers.

## Boundary

The frontend can call mock route handlers for local/demo status, but real dispatch is backend-required. No frontend path may call providers, start Cloud Run jobs, use service role credentials, spend credits, or mutate worker state with admin permissions.

## RP-FIX-11 Lease Extension

The mock queue now has a companion worker lease layer. Mock dispatch claims a lease, records a heartbeat, creates an idempotency key, and completes or fails the lease with the mock worker result. Real lease claims and heartbeat writes remain backend-required and transactional.

## RP-FIX-12 Server Scaffold

The job runtime can now be reached through the local mock server via `POST /api/mock`, but real queue creation and worker dispatch remain backend-required.
