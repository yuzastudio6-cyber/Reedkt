# Professional Long-Form Approved-Snapshot Bridge — 2026-07-18

Status: `superseded_by_persisted_canonical_post_approval_authority`

## Outcome

ReEditPro has a server-only, fail-closed bridge contract between the
professional long-form object plan and one exact approved plan snapshot. The
bridge verifies authority. The follow-up canonical integration now persists the
seed and controller through real local/private publication and approval and
persists a deterministic blocked child-job manifest. The bridge itself still
does not dispatch workers or execute media.

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
`01a497445e1772b95250eee2b3eb6c8023f111130f7dd200ef842e8e39db7e94`.

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

The exact-code `npm run qa:internal-pipeline` v17 aggregate passed all `37/37`
stages with exit code `0`. It started at `2026-07-18T06:34:21.425Z`, finished
at `2026-07-18T07:03:58.045Z`, and completed in `1,776,620 ms`. The planning
stage passed in `354 ms`, this bridge stage in `628 ms`, and the canonical
post-approval authority stage in `2,056 ms`.

The aggregate reverified exactly 50 canonical E2E tool identities and 50 job
adapters, the existing bounded private media lifecycles, all 11 named-edit
browser tests, and the accepted maximum-eight-source 27-job private review.
The aggregate report now marks canonical seed/controller persistence and
child-manifest derivation/persistence true through the separately bounded
post-approval authority. It explicitly keeps child package-queue persistence,
long-form object storage, long-form media execution, live Google Cloud
completion, external beta, and paid production false.

## Security and Commercial Boundary

The bridge stores no signed URL, credential, secret, local path, provider
token, customer price, service fee, wallet mutation, settlement instruction,
or billing authority. Its implementation imports no Google Cloud, Supabase,
Stripe, HTTP, provider, child-process, environment, or network activation
path.

Attempt-level internal production cost remains a separate future execution
record. It is not customer price, customer credits, ReEditPro service fee, or
billing authority.

## Follow-Up Readiness Truth

The follow-up
`docs/canonical-professional-long-form-post-approval-authority-2026-07-18.md`
and its 23-check smoke now verify canonical seed/controller persistence,
server-loaded approval revalidation, deterministic 255-child derivation, and
content-addressed bridge/manifest persistence. The following remain false:

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

## Historical Next Gate

The seed/controller persistence and blocked child-manifest derivation gate was
completed by the follow-up document above. Transactional child-package queue
promotion is now the next dependency-safe gate. Object-store and worker
execution remain later gates.
