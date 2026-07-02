# Job Failure Retry Recovery

RP-FIX-10 adds mock retry and recovery planning.

## Failure Behavior

Failed mock jobs can:

- schedule a retry when under the retry limit;
- stop retries when the retry limit is reached;
- produce a user-facing chat/status summary;
- trigger mock credit release/refund through RP-FIX-09 credit runtime helpers.

## Credit Rule

Credits are not spent on failed work. Successful mock completion can spend a reserved credit record. Failed work can release or refund according to the credit runtime skeleton.

## Production Gap

There is no real retry scheduler, worker lease recovery, distributed lock, Cloud Run retry policy, or transactional credit recovery yet. Those remain backend/cloud implementation work.

RP-FIX-11 adds mock stale lease recovery and idempotency helpers. Provider-like stale leases should not be retried until the backend can prove whether an external side effect happened.
