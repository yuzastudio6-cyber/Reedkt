# Professional Long-Form Approved-Snapshot Bridge — 2026-07-18

Status: `approved_snapshot_binding_contract_ready_persistence_and_execution_blocked`

## Outcome

ReEditPro now has a server-only, fail-closed bridge contract between the
professional long-form object plan and one exact approved plan snapshot. The
bridge verifies authority; it does not persist approval components, derive
canonical jobs, dispatch workers, or execute media.

The contract binds all of the following before any future child-job
derivation can be considered:

- workspace, project, edit session, and planning-request identities;
- approved plan id and plan hash;
- approved snapshot id and exact snapshot hash;
- approved estimate id and estimate hash;
- approval id and funded credit-reservation id;
- approved Master Timing hash and parent work-graph hash;
- the snapshot-independent long-form plan seed and its content-addressed
  component reference;
- the server-loaded controller execution input; and
- the exact expanded child graph and private object manifest.

The snapshot-independent seed deliberately excludes approval, snapshot,
estimate, reservation, and parent-work-graph authority. A later approval may
therefore reuse identical content identities, but it receives a distinct plan,
snapshot, and bridge authority. Content reuse never transfers execution
permission.

## Canonical Capacity Fit

The existing canonical graph permits at most 256 work items and at most 128
dependencies on one item. The six-hour/512-range profile is therefore capped
at 124 technical object chunks. Its deterministic expansion contains:

- 124 chunk-render items;
- 124 independent chunk-QA items;
- one timing validator;
- one continuous program-audio item;
- one audio QA item;
- one color-continuity item;
- one color QA item;
- one final object assembler; and
- one final output QA item.

That is 255 child work items. The final object assembler has the largest
dependency set at 127. Both remain below the existing canonical ceilings, so
the bridge does not weaken global job or dependency bounds.

## Focused Verification

`npm run smoke:professional-long-form-snapshot-bridge` passes 22 checks. The
maximum fixture contains 512 approved ranges, 124 chunks, 255 child work
items, and a maximum dependency count of 127. Its plan-seed hash is
`de8deb17a7b255d3591abc54917c009d7078de350faffa17fb82c2eda7d9fa6b` and
its bridge-authority hash is
`ece9106af3f9b74f5a21bb5556f778fd4f28e889a2a8199f114ff6fe0499b0f7`.

The smoke verifies exact rebuild and replay and rejects tampering with the
snapshot hash, seed component, controller input, component reference,
estimate, approved timing, reservation, child graph, or persisted bridge
manifest. It also proves that no child item is execution-authorized and that a
validated bridge cannot self-promote to production authority.

`npm run smoke:professional-long-form-object-plan` separately passes 26 checks
for frame conservation, source-slice lineage, professional frame rates,
technical-split semantics, one independent QA item per chunk, one approved 4K
estimate, and the same canonical graph ceilings.

## Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v16 aggregate passed all `36/36`
stages with exit code `0`. It started at `2026-07-18T05:21:30.437Z`, finished
at `2026-07-18T05:49:59.399Z`, and completed in `1,708,962 ms`. The planning
stage passed in `402 ms`, and this bridge stage passed in `682 ms`.

The aggregate reverified exactly 50 canonical E2E tool identities and 50 job
adapters, the existing bounded private media lifecycles, all 11 named-edit
browser tests, and the accepted maximum-eight-source 27-job private review.
The aggregate report explicitly kept canonical seed/controller persistence,
child-job derivation, long-form object storage, long-form media execution, live
Google Cloud completion, external beta, and paid production false.

## Security and Commercial Boundary

The bridge stores no signed URL, credential, secret, local path, provider
token, customer price, service fee, wallet mutation, settlement instruction,
or billing authority. Its implementation imports no Google Cloud, Supabase,
Stripe, HTTP, provider, child-process, environment, or network activation
path.

Attempt-level internal production cost remains a separate future execution
record. It is not customer price, customer credits, ReEditPro service fee, or
billing authority.

## Readiness Truth

Only the approved-snapshot binding contract is ready. All of the following
remain false:

- canonical seed-component persistence;
- server-loaded controller persistence;
- canonical child-job derivation;
- object-store persistence;
- child-package queue persistence;
- long-form media execution;
- distributed database execution;
- live Google Cloud execution;
- product readiness; and
- production readiness.

No SQL, remote Supabase, provider, billing, customer charging, deployment,
public delivery, Motion Studio/MS-001, or Edit Preference/Edit Reference
implementation changed in this slice.

## Next Evidence Gate

The next dependency-safe backend slice must persist this exact seed component
and controller input through the canonical plan-publication and approval
service, reload them server-side, and deterministically derive the bounded
child jobs without accepting caller-authored graph authority. Object-store and
worker execution remain later gates.
