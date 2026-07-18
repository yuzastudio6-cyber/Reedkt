# Canonical Professional Long-Form Post-Approval Authority — 2026-07-18

Status: `seed_controller_and_child_manifest_persisted_execution_blocked`

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

## Honest Work-Graph Boundary

The pre-expansion canonical plan contains three authority preflights and one
controller. It deliberately contains no fake short render or competing final-QA
item. The deterministic child graph owns chunk rendering, independent chunk QA,
continuous program audio, timing validation, cross-chunk color continuity,
private 4K finalization, and final QA.

The parent snapshot cannot enter the ordinary execution-package service. The
resource-placement authority records the controller as a blocked control-plane
contract with required gate
`canonical_professional_long_form_child_package_queue_persistence`. Package
creation fails closed until a later milestone transactionally promotes the
exact child graph into the canonical package queue.

The derived child records are not added to the canonical job aggregate. Every
record carries the exact snapshot, reservation, controller work-item, controller
job, seed, bridge, expected output, and dependency identity, while preserving:

- `canonicalPackageQueuePersisted = false`;
- `dispatchAuthorized = false`;
- `executionAuthorized = false`; and
- `derivationStatus = derived_execution_blocked`.

## Focused Evidence

`npm run smoke:canonical-professional-long-form-post-approval` passes 23 checks.
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
- zero execution packages.

The smoke proves exact publication replay, changed-seed idempotency conflict,
identity and source-content substitution rejection, publication-without-jobs,
approval-time seed/controller freezing, fresh-service authority reload, package
refusal, restart-safe bridge/manifest replay, child-record tamper rejection,
dispatch self-promotion rejection, aggregate non-mutation, and fail-closed
content-addressed blob corruption after another restart.

`npm run smoke:professional-long-form-object-plan` continues to pass 26 checks,
`npm run smoke:professional-long-form-snapshot-bridge` passes 22 checks, and
`npm run smoke:edit-planning-authority` passes its complete canonical authority
regression after this integration.

## Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v17 aggregate passed all `37/37`
stages with exit code `0`. It started at `2026-07-18T06:34:21.425Z`, finished
at `2026-07-18T07:03:58.045Z`, and completed in `1,776,620 ms`. The long-form
planning stage passed in `354 ms`, the approved-snapshot bridge in `628 ms`,
and this canonical post-approval stage in `2,056 ms`.

The aggregate reverified exactly 50 canonical E2E tool identities and 50 job
adapters, the existing bounded private media lifecycles, all 11 named-edit
browser tests, and the accepted maximum-eight-source 27-job private review.
Its machine-readable report marks canonical seed-component persistence,
server-loaded controller persistence, and child-manifest derivation/persistence
true. It explicitly keeps child package-queue persistence, long-form media and
object-storage execution, live Google Cloud completion, external beta, and
paid production false.

## Cost and Commercial Boundary

The approved seed requires future attempt-level internal production-cost
evidence. That field does not create an attempt, cost event, customer price,
customer credit amount, service fee, wallet mutation, billing instruction, or
settlement authority. The original approved 4K estimate and reservation remain
the only commercial-adjacent authority in this local/private proof; no second
export estimate or charge is allowed.

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

Now verified:

- canonical long-form seed-component persistence;
- server-loaded controller persistence and approval binding;
- deterministic post-approval child-job derivation;
- content-addressed bridge and child-manifest persistence;
- exact restart/replay behavior; and
- fail-closed normal-package, dispatch, tamper, and self-promotion boundaries.

Still false:

- transactional child promotion into the canonical package queue;
- child lease and one-use dispatch;
- object-store media persistence;
- chunk media execution;
- continuous-audio and color-continuity execution;
- final 4K assembly and QA;
- distributed database authority;
- live Google Cloud worker completion;
- product readiness; and
- production readiness.

## Next Evidence Gate

The next dependency-safe slice should design and prove an atomic child-graph
promotion transaction that binds the persisted manifest to canonical package
records without weakening snapshot, reservation, dependency, idempotency,
resource-placement, cost, lease, or replay authority. It must remain local and
fail closed until the separately gated distributed database and Google Cloud
evidence exists.
