# Runtime Idempotency Plan

Idempotency prevents duplicate dispatch, duplicate provider requests, duplicate render jobs, duplicate credit spend, and duplicate completion events.

## Added Helpers

- `createIdempotencyKey`
- `createJobIdempotencyKey`
- `createProviderIdempotencyKey`
- `checkIdempotencyConflictMock`
- `recordIdempotencyResultMock`

## Required Future Scopes

- Job dispatch.
- Provider requests.
- Render and export jobs.
- Credit reservation and spend.
- Runtime transport messages.
- Worker completion.

## Current Status

The implementation is mock-only. Production must store idempotency results in backend-controlled tables and enforce them transactionally before external provider calls, credit ledger writes, or render/export work.
