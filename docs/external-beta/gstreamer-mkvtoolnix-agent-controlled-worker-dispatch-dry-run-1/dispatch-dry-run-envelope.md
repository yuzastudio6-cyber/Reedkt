# Dispatch Dry-Run Envelope

Envelope ID: `agent-controlled-worker-dispatch-dry-run-1-envelope`

Status: `dispatched_controlled_worker_dispatch_dry_run_metadata_only`

The envelope preserves the approved snapshot, approval record, no-spend policy, job, worker lease reference, route idempotency key, dispatch idempotency key, queue idempotency key, dispatch dry-run idempotency key, command template, private input manifest, output manifest schema, QA report schema, cleanup policy, retention policy, failure policy, retry policy, audit refs, and non-public artifact policy.

The worker lease reference is preserved but not claimed.

The local mock queue item remains `queued`; this packet does not mark it running, completed, failed, or dispatched in a persistent queue.

Queue item:

- ID: `mock-job-runtime-queue-item-0001`
- Job ID: `job-agent-controlled-dispatch-1`
- Worker kind: `render_export`
- Queue status: `queued`
- Gate status: `passed`
- Mock only: `true`
- Payload mock only: `true`

Execution flags:

- Route executed: `false`
- Worker dispatched: `false`
- Worker executed: `false`
- Worker lease claimed: `false`
- Tools executed: `false`
- Persistent queue write: `false`
