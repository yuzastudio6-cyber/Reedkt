# Canonical Failed-Execution Recovery

Status: authenticated local/private terminal-failure and bounded-retry evidence

This boundary prevents a private canonical runner exception or lease timeout from leaving an execution fence permanently `started`. It preserves the exact approved operation and attempt lineage while allowing only the recovery already authorized by the immutable work item.

## Terminal execution states

Worker execution fences now distinguish four states:

- `not_started`: no runner execution began;
- `started`: the exact lease attempt is in flight;
- `failed`: execution began but never received commit/completion authority; and
- `completed`: execution received immutable commit/completion authority.

A `started` fence may transition exactly once to `failed` or `completed`. Both terminal states are immutable. A failed fence records the execution-attempt ID, runner class, start/failure timestamps, safe failure category and code, approved recovery policy, and a content hash over its exact lease/attempt evidence. It never carries `commitAuthorizedAt` or `completedAt`.

Lease expiry while `started` terminalizes the fence as `execution_timeout` before expiring the lease. A caught runner failure terminalizes the fence and releases the lease. Both paths append one `execution_failed` audit event and preserve the opaque credential as SHA-256-only at rest.

## Adapter failure idempotency

The canonical single-job adapter classifies a failure only after reconstructing the exact job, work item, expected output, tool, operation, runner, lease, and approved maximum attempts from server authority.

It persists a private create-only, checksum-protected failure outcome for the request's Idempotency-Key. Exact replay returns the same safe failure evidence without claiming another lease or executing again. A later retry requires a new request key and therefore a new lease attempt.

The adapter exposes three safe execution outcomes:

- `released_before_execution`: execution never began; the lease is terminal;
- `failed_before_commit`: the fence is immutable `failed`; and
- `completed_requires_reconciliation`: the fence is already `completed`, so rerunning would be unsafe.

Post-commit failures never become failed fences and never authorize a retry. They require `canonical_completed_execution_reconciliation_recovery`. A fresh authenticated adapter key now reconstructs the missing completion from exact existing artifact, QA, reconciliation, dispatch, and cost evidence before any lease claim; incomplete evidence stays blocked. See `docs/canonical-post-commit-adapter-recovery.md`.

## Bounded retry and work-graph isolation

The canonical work graph records one of these explicit outcomes when adapter failure evidence is present:

- `failed_retry_available` only when the same approved operation has an unused immutable `maxAttempts` allowance;
- `failed_user_review_required` when the attempt allowance is exhausted or the failure affects authority, meaning, route, or unknown state; or
- `completed_recovery_required` when execution committed but adapter reconciliation is incomplete.

The failed job is resolved for the current run, its descendants remain dependency-blocked, and unrelated dependency-ready jobs continue. The orchestrator does not improvise a fallback and does not loop automatically. A new authenticated work-graph run retries only the same server-derived approved operation, while already completed jobs replay their create-only adapter completion.

## Compensation and cost evidence

An immutable failed fence is quiescent for post-dispatch compensation. Compensation counts it separately from never-started and completed fences, preserves the failure-evidence hash and any partial artifact/QA records, and reads any failed DeepFilterNet attempt-level internal-cost evidence. Internal production cost remains separate from customer price, credits, service fees, wallets, settlement, and billing.

An active `started` fence still fails compensation closed. A completed fence still requires its create-only adapter completion record.

## Non-authority

This evidence is single-host and private/internal only. It does not activate providers, distributed workers, customer credit mutation, billing, Supabase, deployment, public rendering, export, or external-beta/production authority. Distributed worker death detection, queue redelivery, operational alerting, and deployed disaster recovery remain separate evidence gates.

## Verification

- `npm run typecheck:server`
- `npm run smoke:canonical-worker-lease-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
