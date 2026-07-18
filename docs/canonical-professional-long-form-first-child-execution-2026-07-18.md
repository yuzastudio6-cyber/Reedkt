# Canonical Professional Long-Form First-Child Execution — 2026-07-18

Status: `superseded_by_private_source_authority_validation_execution`

This document preserves the root-only milestone. The current two-child state is
documented in
`docs/canonical-professional-long-form-source-authority-execution-2026-07-18.md`.

## Outcome

The specialized professional long-form queue now executes its dependency root
without weakening the immutable 255-job queue definition. The exact
`validate_approved_snapshot` child receives one server-derived execution
authority, one opaque queue lease, one consumed execution attempt, one private
validation artifact, one passed QA record, one downstream reconciliation
record, one attempt-level internal production-cost record, and one terminal
queue completion.

This is a real local/private server operation. It validates canonical authority;
it does not read or transform source media, call a provider, render a chunk,
dispatch Google Cloud work, deliver a file, charge a customer, or mutate a
wallet. After the root commits, the queue contains exactly one completed child
and 254 queued children.

## One Queue, One Commit Boundary

The implementation does not create a second package or scheduler. The original
specialized queue definition remains immutable with
`privateExecutionReady = false` for all 255 definitions. Readiness for the root
comes only from an additive, checksum-bound authorization receipt stored on the
root queue entry.

Before that receipt can be published, the service:

1. reopens the exact approved snapshot and unexpired funded reservation;
2. rebuilds and revalidates the bridge, 255-child manifest, specialized package,
   placement manifest, and queue definition;
3. builds a full content-addressed execution authority binding the root job,
   expected snapshot hash, exact runner, fixed resource envelope, cost profile,
   and all false live/commercial permissions;
4. writes and reopens that authority; and
5. asks the queue store to verify both the persisted authority bytes and its
   compact receipt before adding one `job_execution_authorized` event.

An authority blob by itself grants nothing. A fabricated receipt, changed
authority, wrong root identity, wrong expected output, or missing persisted
authority fails before a claim. Ordinary package queues cannot receive this
specialized authorization.

The queue then creates one opaque claim and persists only its credential digest.
The execution-start mutation validates the plaintext credential without storing
it, binds the claim to the approved operation/runner/cost profile, consumes the
only root attempt, and adds one `job_execution_started` event. Completion is the
authority commit: it atomically binds the private artifact, QA, reconciliation,
canonical result hash, attempt-cost evidence hash, and terminal evidence to one
`job_completed` event.

## Exact Operation and Cost Boundary

The root operation is:

- operation: `internal.validate_professional_long_form_snapshot_authority.v1`;
- runner: `canonical_professional_long_form_snapshot_validation_runner_v1`;
- internal cost profile:
  `reeditpro_long_form_snapshot_validation_cpu_2vcpu_4gib_v1`;
- worker/resource: `api_service` / `control_plane_cpu_v1`;
- fixed envelope: 2 vCPU, 4 GiB memory, 0 GPU;
- maximum attempts: 1;
- attempt timeout: 300 seconds; and
- local lease: 60 seconds.

The existing versioned rate-card meter records actual attempt duration and
integer micro-costs with boundary `internal_production_cost_only`. The record
contains no customer price, customer credit amount, ReEditPro service fee,
wallet mutation, billing instruction, settlement instruction, or second export
estimate. The original approved 4K estimate and reservation remain unchanged.

## Private Evidence and Replay

The operation persists and reopens four content-addressed JSON records:

- approved-snapshot validation artifact;
- QA evidence with schema, checksum, authority, attempt, reservation, and
  no-provider/media/render/commercial checks;
- reconciliation evidence identifying the downstream
  `validate_private_source_authority` child; and
- terminal execution evidence binding the canonical result and attempt cost.

Fresh service instances replay the completed queue entry and reopen all four
references plus the create-only internal-cost record. Replay creates no second
authorization event, claim, execution-start event, attempt, cost record,
artifact, QA record, reconciliation record, terminal record, or completion
event. Changed replay and checksum mutations fail closed.

The root completion satisfies the downstream child's queue dependency, but it
does not authorize that child. A claim for
`validate_private_source_authority` still returns `capability_blocked`, creates
no attempt, and leaves the aggregate unchanged.

## Focused Evidence

The following exact-code checks pass:

- `npm run typecheck:server`;
- `npm run smoke:private-internal-attempt-cost-evidence`;
- `npm run smoke:canonical-private-package-work-queue`; and
- `npm run smoke:canonical-professional-long-form-post-approval`.

At this root-only checkpoint, the long-form smoke passed 47 checks over the maximum six-hour,
512-source-range, 124-chunk, 255-child fixture. It proves orphan-blob refusal,
fabricated-receipt refusal, concurrent one-claim/one-attempt behavior, private
artifact/QA/reconciliation persistence, versioned attempt cost, terminal queue
completion, restart replay, downstream capability blocking, and adversarial
artifact/QA/reconciliation/terminal/cost mutations. It also corrupts the
persisted root validation artifact after clearing process state, proves the
fresh service fails closed, restores the exact original bytes, and proves
terminal replay without re-execution.
It also advances the clock beyond the approved reservation expiry and proves
that no root authorization, event, claim, or queue mutation can be published.

## Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v20 aggregate passed all `37/37`
stages with exit code `0`. It started at `2026-07-18T10:12:50.412Z`, finished
at `2026-07-18T10:46:03.933Z`, and completed in `1,993,521 ms`. The long-form
plan passed in `363 ms`, the approved-snapshot bridge in `746 ms`, and the
combined post-approval, promotion, and root-execution stage passed all 47 checks
in `9,103 ms`.

The same aggregate reverified exactly 50 canonical E2E tool identities and 50
job adapters, all 11 named-edit browser tests, the bounded private media
lifecycles, and the signed-in maximum-eight-source 27-job private review. The
final review accepted the exact sixteen-second `3840x2160` artifact with
SHA-256
`584cdd265fc32d81ca70f5f08420bf65ebfac998a1d4db38fb94efe5aa847505`.
That evidence does not convert the six-hour fixture into media execution: v20
records the root lifecycle true and separately records all remaining-child,
source-media, chunk-render, object-storage, live-cloud, external-beta, and paid-
production gates false.

## Recovery Boundary

Completed-operation restart replay is verified. Recovery after a process dies
between `job_execution_started` and terminal completion is not verified in this
slice. The opaque claim credential cannot be reconstructed, so an expired
started attempt fails closed behind
`canonical_professional_long_form_started_attempt_timeout_reconciliation`.
No automatic retry or hidden second attempt is claimed.

## Readiness Truth

Now verified:

- root exact operation, runner, resource, and internal-cost binding;
- persisted full authority plus queue receipt;
- one opaque lease and one-use internal dispatch consumption;
- private validation artifact, QA, and reconciliation;
- attempt-level internal production-cost evidence;
- one terminal queue completion and restart replay; and
- downstream dependency evidence without downstream execution authority.

Still false:

- private-source-authority child execution;
- the remaining 254 child leases, operations, attempts, and costs;
- source byte reading, probing, decoding, or transformation in this long-form
  graph;
- 124 chunk renders and independent chunk QA;
- continuous program-audio execution;
- cross-chunk color-continuity execution;
- private 4K final assembly and final QA;
- started-attempt death/timeout recovery;
- distributed database transactions;
- live Google Cloud service identity, dispatch, and worker completion;
- provider activation, public delivery, external beta, and paid production
  readiness.

No SQL, migration, remote Supabase action, provider activation, billing,
customer charging, deployment, public delivery, Motion Studio/MS-001, or Edit
Preference/Edit Reference implementation changed in this slice.

## Completed Follow-Up Gate

The topological `validate_private_source_authority` gate described here is now
implemented and verified. It reopens all 512 approved ranges, source identities,
object generations, checksums, cleanup decisions, and frame coverage; persists
private validation/QA/reconciliation and attempt-cost evidence; completes
exactly once; and leaves every render/audio child blocked. See the current
source-authority execution document above. It does not read or transform media
inside the runner; a separately approved source
byte/runtime authority is required for later media execution.
