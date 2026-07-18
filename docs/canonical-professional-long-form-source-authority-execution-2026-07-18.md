# Canonical Professional Long-Form Source-Authority Execution — 2026-07-18

Status: `private_structured_source_authority_completed_remaining_253_children_blocked`

## Outcome

The specialized 255-job professional long-form queue now executes its second
topological child, `validate_private_source_authority`, only after the root
`validate_approved_snapshot` child has reached an immutable terminal
completion. The source child receives its own persisted execution authority,
queue authorization receipt, opaque lease, one-use attempt, private validation
artifact, QA record, direct-dependency reconciliation, attempt-level internal
production-cost record, terminal evidence, and queue completion.

The maximum six-hour fixture now ends with exactly two completed children and
253 queued children. This slice validates structured approved source authority;
it does not decode, transform, probe, render, or export source media. It does
not authorize any of the 124 chunk renders or the continuous-audio job.

## Exact Source Proof

The operation deterministically reopens and checks all 512 approved source
ranges against:

- the content-addressed approved source-binding manifest;
- the ordered canonical source-sequence component;
- exact media-asset and source-sequence identities;
- approved SHA-256 and byte length;
- exact Google Cloud generation plus ETag authority when the binding is GCS;
- the fixed local-private generation marker `1` when the binding is local;
- the selected cleanup decision and its permitted frame interval;
- the exact canonical segment interval;
- the single-region range policy;
- duration conservation between source and timeline frames;
- the first `timeline_start` boundary and every subsequent approved hard cut;
  and
- gap-free coverage from frame zero through frame 1,296,000.

Every required approved binding is referenced. The persisted artifact carries
compact hashes for the complete binding set, cleanup set, range-to-binding
lineage, range-to-cleanup lineage, segment timeline, and total frame coverage
instead of duplicating all source authority into an unbounded result.

The canonical approved-authority loader revalidates current storage authority
before returning the structured authority. For local-private objects that
loader performs the existing exact byte hash; for GCS it verifies exact
generation/ETag metadata. The source-authority runner itself does not directly
read media bytes and performs no decode, transform, probe, or render. The
artifact therefore keeps live bucket-region residency and actual media frame
capacity false; those require separate object/storage and media-worker proof.

## Queue and Root Lineage

The immutable queue definition remains unchanged with
`privateExecutionReady = false`. The queue store now accepts a strict union of
the root and source validation child contracts while preserving each
operation's versioned schema identity.

Source authorization fails unless:

1. the source entry is canonical order 1 with its exact definition and
   placement hashes;
2. its only queue dependency is the canonical order-0 root child;
3. that root is terminally completed;
4. the root authority, artifact, QA, reconciliation, cost, terminal record, and
   unique completion event all reopen successfully;
5. the approved reservation remains funded and unexpired; and
6. the persisted source execution-authority bytes match the compact receipt.

An orphan authority blob grants no claim. Authorization requires a pristine
source entry, and one exact receipt is append-only. The queue persists only a
claim credential digest. Beginning execution consumes the one permitted
attempt. A consumed professional attempt cannot be released through the
ordinary retry/failure path without terminal reconciliation.

Root replay was also hardened to preserve the immutable root evidence after a
downstream child advances. It now verifies the root's own authorization,
start, and completion events by root job identity instead of incorrectly
requiring the whole queue to remain at one completed job.

## QA, Reconciliation, and Cost

The exact source operation is:

- operation:
  `internal.validate_professional_long_form_private_source_authority.v1`;
- runner:
  `canonical_professional_long_form_private_source_authority_runner_v1`;
- cost profile:
  `reeditpro_long_form_source_authority_validation_cpu_2vcpu_4gib_v1`;
- worker/resource: `api_service` / `control_plane_cpu_v1`;
- fixed envelope: 2 vCPU, 4 GiB memory, 0 GPU;
- maximum attempts: 1;
- attempt timeout: 300 seconds; and
- local lease: 60 seconds.

QA binds the exact artifact, approved manifest/ranges, object identity,
cleanup, frame coverage, queue attempt, reservation, and no-media/commercial
boundaries. Reconciliation records exactly 125 direct source dependents: 124
chunk-render jobs and one continuous-program-audio job. It records that this
completion satisfies only their source dependency and grants none of them
operation or execution authority.

The cost record uses the existing versioned rate card and integer micro-costs
with boundary `internal_production_cost_only`. It contains no customer price,
customer credit amount, ReEditPro service fee, wallet mutation, billing,
settlement, or second export estimate. The original user-approved 4K estimate
and reservation remain unchanged.

## Focused Evidence

The exact-code focused checks pass:

- `./node_modules/.bin/tsc -p tsconfig.server.json --noEmit --pretty false`;
- targeted ESLint over every changed source and smoke file;
- `npm run smoke:private-internal-attempt-cost-evidence`; and
- `npm run smoke:canonical-professional-long-form-post-approval`.

The long-form smoke now passes 61 checks over the maximum six-hour,
512-range, 124-chunk, 255-child fixture. It proves:

- expired reservation refusal without queue/event mutation;
- concurrent one-authorization/one-lease/one-attempt execution;
- exact checksum, size, generation, cleanup, segment, and frame coverage;
- private artifact, QA, 125-dependent reconciliation, cost, and terminal
  persistence;
- two completed queue lineages and 253 blocked entries;
- source and root restart replay without re-execution;
- root replay after downstream queue progress;
- render and audio claim refusal without queue mutation;
- recomputed-hash artifact, QA, reconciliation, and terminal tamper refusal;
- commercial-cost boundary refusal; and
- persisted source-artifact corruption failure after restart, exact-byte
  restoration, and replay.

## Aggregate Evidence

The exact-code `npm run qa:internal-pipeline` v21 aggregate passed all `37/37`
stages with exit code `0`. It started at `2026-07-18T11:38:02.672Z`, finished
at `2026-07-18T12:05:41.896Z`, and completed in `1,659,224 ms`. The long-form
plan passed in `340 ms`, the approved-snapshot bridge in `612 ms`, and this
61-check post-approval/root/source-authority stage passed in `12,856 ms`.

The same run reverified exactly 50 canonical E2E tool identities and 50 job
adapters, the crash-consistent private package lifecycle, real bounded three-
source composition, professional color execution, above-16-MiB UHD Remotion
streaming, all 11 named-edit browser tests, and the maximum-eight-source signed-
in private review. The final review completed all 27 jobs and accepted the same
sixteen-second `3840x2160` artifact with SHA-256
`584cdd265fc32d81ca70f5f08420bf65ebfac998a1d4db38fb94efe5aa847505`.
The report records exactly two completed long-form validation children and 253
blocked children. It keeps media decoding/rendering, object storage, live
Google Cloud completion, distributed database activation, customer billing,
public delivery, external beta, and paid production false.

## Readiness Truth

Now verified:

- root and source validation children execute in topological order;
- exact approved source manifest and ordered source-sequence lineage;
- all 512 range checksum/size/generation bindings;
- cleanup containment and frame-exact timeline coverage;
- one-use queue execution and terminal replay;
- private artifact, QA, reconciliation, and internal attempt cost; and
- exact dependency evidence for 124 render jobs plus continuous audio.

Still false:

- direct runner media-byte reading, probing, decoding, or transformation;
- live source-object region and source frame-capacity proof;
- the remaining 253 child leases, operation authorities, attempts, and costs;
- 124 chunk renders and independent chunk QA;
- continuous program-audio execution;
- cross-chunk color-continuity execution;
- private 4K final assembly and final QA;
- distributed database transactions and durable multi-host recovery;
- live Google Cloud service identity, dispatch, and worker completion;
- provider activation, billing/wallet mutation, public delivery, deployment,
  external beta, and paid production readiness.

No SQL, migration, remote Supabase action, provider activation, billing,
customer charging, deployment, public delivery, Motion Studio/MS-001, or Edit
Preference/Edit Reference implementation changed in this slice.

## Next Evidence Gate

The next dependency-safe long-form operation should be selected from the
remaining topological control/media boundary without granting a broad class of
jobs at once. The master-timing validation child is source-independent after
the root; the 124 render jobs depend on both completed validations but still
require one exact approved chunk operation, object-read boundary, private
output persistence, independent QA, reconciliation, failure recovery, and
attempt-cost contract before any claim may succeed.
