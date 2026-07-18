# Canonical Professional Long-Form Post-Approval Authority — 2026-07-18

Status: `superseded_by_root_snapshot_validation_execution`

## Outcome

The professional long-form object plan now crosses the real local/private
canonical publication and approval boundary. A server-only publication input
is validated against the exact workspace, project, edit session, planning
request, confirmed 4K frame, Master Timing components, one approved 4K estimate,
source-media candidate, cleanup decisions, and timeline segments. The service
then persists one content-addressed plan seed and appends one unique controller
work item before calculating the canonical plan and work-graph hashes.

Approval reopens and revalidates that exact seed and controller twice: once
before the authority transaction and once inside the locked mutation. The
approved snapshot freezes the seed component reference and the controller's
execution-input reference. No caller can supply an approved snapshot, expanded
child graph, job identity, package record, dispatch record, or runtime result.

After approval, a separate server service loads the complete canonical
execution authority, funded synthetic reservation, persisted seed, approved
controller work item, and parent controller job. It deterministically rebuilds
the object plan and approved-snapshot bridge, derives the child-job manifest,
persists both as content-addressed private blobs, reopens them, and performs an
exact rebuild comparison.

The follow-up specialized promotion service now persists the immutable child
package and server-derived placement manifest and atomically publishes one
exact 255-job private queue. See
`docs/canonical-professional-long-form-child-package-promotion-2026-07-18.md`.
The promotion snapshot initially leaves all children capability-blocked. The
root snapshot-validation continuation now executes exactly one child while the
remaining 254 stay blocked; see
`docs/canonical-professional-long-form-first-child-execution-2026-07-18.md`.
This remains far short of long-form media execution.

## Honest Work-Graph Boundary

The pre-expansion canonical plan contains three authority preflights and one
controller. It deliberately contains no fake short render or competing final-QA
item. The deterministic child graph owns chunk rendering, independent chunk QA,
continuous program audio, timing validation, cross-chunk color continuity,
private 4K finalization, and final QA.

The parent snapshot cannot enter the ordinary execution-package service. The
resource-placement authority records the controller as a permanently
service-only control-plane contract with required gate
`canonical_professional_long_form_controller_service_only_no_worker_dispatch`.
Only the specialized server-derived child package may enter the long-form
queue.

The derived child records are not added to the canonical job aggregate. Every
record carries the exact snapshot, reservation, controller work-item, controller
job, seed, bridge, expected output, and dependency identity, while preserving:

- `canonicalPackageQueuePersisted = false` in the immutable derivation record;
- `dispatchAuthorized = false`;
- `executionAuthorized = false`; and
- `derivationStatus = derived_execution_blocked`.

The later promotion record proves the separately scoped queue aggregate exists;
it does not rewrite or weaken the derivation record above.

## Focused Evidence

The post-approval/promotion baseline passed 32 checks. The current combined
promotion/root-execution smoke passes 47 checks.
Its maximum-capacity local/private fixture uses:

- one confirmed `3840x2160`, 30 fps frame;
- one six-hour, 648,000-frame approved timeline;
- eight finalized private source identities;
- 512 exact approved source ranges and matching timeline segments;
- 124 deterministic object chunks;
- 255 derived child-job records;
- at most 127 dependencies on one child;
- one 4K estimate and one synthetic approved reservation;
- a persisted bridge below the 4 MiB authority ceiling;
- a persisted child manifest below the 4 MiB authority ceiling;
- four parent jobs in the canonical aggregate; and
- zero ordinary execution packages; and
- one specialized 255-job private queue that begins with zero leases, attempts,
  or completions and now ends the focused continuation with exactly one root
  completion and 254 blocked children.

The smoke proves exact publication replay, changed-seed idempotency conflict,
identity and source-content substitution rejection, publication-without-jobs,
approval-time seed/controller freezing, fresh-service authority reload, package
refusal, restart-safe bridge/manifest replay, child-record tamper rejection,
concurrent one-create/one-replay queue promotion, exact placement counts,
capability-blocked claim refusal without mutation, queue checksum corruption
refusal/recovery, dispatch self-promotion rejection, aggregate non-mutation,
and fail-closed content-addressed blob corruption after another restart.

`npm run smoke:professional-long-form-object-plan` continues to pass 26 checks,
`npm run smoke:professional-long-form-snapshot-bridge` passes 22 checks, and
`npm run smoke:edit-planning-authority` passes its complete canonical authority
regression after this integration.

## Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v20 aggregate passed all `37/37`
stages with exit code `0`. It started at `2026-07-18T10:12:50.412Z`, finished
at `2026-07-18T10:46:03.933Z`, and completed in `1,993,521 ms`. The long-form
planning stage passed in `363 ms`, the approved-snapshot bridge in `746 ms`,
and this canonical post-approval/promotion/root stage passed 47 checks in
`9,103 ms`.

The aggregate reverified exactly 50 canonical E2E tool identities and 50 job
adapters, the existing bounded private media lifecycles, all 11 named-edit
browser tests, and the accepted maximum-eight-source 27-job private review.
That machine-readable report marks canonical seed-component, server-loaded
controller, child-manifest, specialized child-package, child-placement, and
child-queue persistence true. It also marks only the first child's authority,
lease, exact tool-operation binding, attempt cost, one-use internal dispatch,
private validation-artifact persistence, QA, reconciliation, dependency
evidence, and replay true. Source-media, chunk-render, and object-storage
execution, remaining-child execution, live Google Cloud completion, external
beta, and paid production remain false. The v18 promotion-only aggregate is
historical evidence.

## Cost and Commercial Boundary

The approved seed requires attempt-level internal production-cost evidence.
That requirement alone creates no attempt or cost record; the root execution
now satisfies it only for its own exact attempt. The other 254 children still
need separate scoped evidence. Neither the requirement nor the root record
creates customer price, customer credit amount, service fee, wallet mutation,
billing instruction, or settlement authority. The original approved 4K
estimate and reservation remain the only commercial-adjacent authority in this
local/private proof; no second export estimate or charge is allowed.

## Security Boundary

The persisted long-form authority contains no signed access URL, credential,
secret, provider token, local path, customer billing command, or public-delivery
grant. The bounded publication, bridge, and child-manifest sources import no
Google Cloud, Supabase, Stripe, HTTP, child-process, environment, or network
activation path.

No raw SQL, migration, remote Supabase action, provider activation, billing,
customer charging, deployment, public delivery, Motion Studio/MS-001, or Edit
Preference/Edit Reference implementation changed in this slice.

## Readiness Truth

Now verified through this foundation and its root continuation:

- canonical long-form seed-component persistence;
- server-loaded controller persistence and approval binding;
- deterministic post-approval child-job derivation;
- content-addressed bridge and child-manifest persistence;
- immutable specialized package and placement persistence;
- atomic local/private 255-job queue persistence;
- one root operation/runner authorization, lease, one-use start, private
  artifact, QA, reconciliation, attempt cost, completion, and replay;
- exact restart/replay behavior; and
- fail-closed normal-package, dispatch, tamper, and self-promotion boundaries.

Still false:

- remaining 254 child leases and one-use dispatches;
- private-source and chunk tool-operation, cost-budget, runner, and QA
  authority;
- object-store media persistence;
- chunk media execution;
- continuous-audio and color-continuity execution;
- final 4K assembly and QA;
- distributed database authority;
- live Google Cloud worker completion;
- product readiness; and
- production readiness.

## Next Evidence Gate

The root snapshot-validation gate is complete. The next dependency-safe slice
is `validate_private_source_authority`; it must use exact persisted source/range
authority and must not imply that any chunk media has rendered.
