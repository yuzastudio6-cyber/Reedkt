# Worker Heartbeat And Stale Recovery

RP-FIX-11 adds mock heartbeat and stale lease recovery services.

## Heartbeat

`heartbeatWorkerLeaseMock` marks a lease active and extends expiration. `renewWorkerLeaseMock` marks it renewed and extends the lease window. Both are local mock operations only.

## Stale Detection

A lease is stale when:

- status is claimed, active, or renewed;
- `expiresAt` is in the past;
- the job is not known to be completed.

`detectStaleWorkerLeasesMock` finds these records in the local mock DB.

## Recovery

`recoverStaleWorkerLeaseMock` can mark a lease stale and schedule a mock retry. Provider-like workers require idempotency review when side effects are unknown.

## Production Requirement

Real stale recovery needs backend runtime, transactional job updates, durable idempotency records, and provider-side effect reconciliation before retrying.
