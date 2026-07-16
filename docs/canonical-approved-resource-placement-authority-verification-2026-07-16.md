# Canonical Approved Resource Placement Authority Verification — 2026-07-16

Status: `verified_private_local_snapshot_bound_cloud_dispatch_blocked`

## Outcome

ReEditPro now freezes the exact resource placement for every canonical approved
work item before approval. The placement projection is embedded in the
content-addressed `canonical-tool-execution-authority-v2`, whose reference is
included in the plan hash and immutable approved snapshot hash. Execution no
longer derives mutable CPU/GPU/render placement only after packaging.

This closes the snapshot-placement integrity gap. It does not deploy Google
Cloud workers, authorize providers, enable billing, mutate customer credits,
run Supabase, enable public delivery, or establish a performance SLA.

## Frozen Authority

Each approved work-item entry commits:

- work-item key, type, worker class, required status, exact tool, and exact
  operation;
- provider execution mode and its blocked/private-executable disposition;
- worker type, resource class, planned Cloud Run target, accelerator, CPU
  allowance, worker concurrency cap, and global concurrency cap;
- region and immutable-private-object transport policy;
- exact proven runner class, tool identity hash, and lifecycle proof hash when
  private execution is eligible; and
- one placement hash inside one placement-authority hash.

The authority is deterministic regardless of work-item read order. A package
must present the exact content-addressed tool authority referenced by its
snapshot. The job-specific placement manifest then adds only server-derived job
and approved-work-item IDs and recomputes a job placement hash.

## Runtime Lineage

The exact tool-execution-authority hash, resource-placement-authority hash, and
per-job placement hash are carried through:

1. signed-in execution-readiness inspection;
2. canonical worker-lease immutable hashes;
3. one-use tool-dispatch reconciliation;
4. internal authority-runner validation;
5. deterministic resource-wave hashes; and
6. final work-graph scheduling evidence.

Current registry/runtime compatibility is revalidated. Changed worker type,
GPU requirement, CPU allowance, resource class, concurrency, operation,
runner, identity, or proof fails closed instead of silently changing an
approved edit.

## Versioned Contract Chain

The verified lineage uses these exact contract versions:

- `canonical-tool-execution-authority-v2`;
- `canonical-approved-work-graph-resource-placement-authority-v1`;
- `canonical-private-resource-placement-manifest-v2`;
- `canonical-execution-readiness-envelope-v2`;
- worker-lease record, response, and verification `v3`, with aggregate `v2`;
- private tool-dispatch record, aggregate, and response `v2`;
- `canonical-private-resource-wave-scheduler-v2`; and
- `canonical-private-work-graph-run-response-v2`.

## Evidence

The following passed with exit code 0:

- `npm run typecheck:server`
- `./node_modules/.bin/tsx server/smoke/canonical-private-resource-wave-scheduler-smoke.ts`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-tool-operation-package`
- `npm run smoke:canonical-worker-lease-verification`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run qa:internal-pipeline` — 27/27 stages, exit code 0,
  `1,725,562 ms` (`2026-07-16T23:04:14.764Z` through
  `2026-07-16T23:33:00.326Z`)

Focused resource evidence confirms:

- exactly 50 proven placements: 28 CPU-analysis, three GPU/L4, and 19 render;
- deterministic wave widths `1, 4, 2, 1, 1` under the fixed global cap of four;
- immutable snapshot placement binding reported as true;
- forged resource class, worker concurrency, and tool-proof changes are
  rejected even after both placement and authority hashes are recomputed; and
- a failing wave sibling does not abandon an independent already-started
  sibling.

The complete dispatch smoke re-executed the 50-tool canonical matrix through
approved snapshot, reservation, lease, one-use dispatch, private persistence,
QA, reconciliation, replay, and downstream verification with the new placement
hash lineage intact.

The full regression also retained the signed-in maximum-eight-source result:
27 approved jobs completed, the accepted private review was 3840×2160 for 16
seconds, all eight source-bound audio identities were detected in approved
order, and the 1,086,192-byte 4K review checksum was verified. The three-source
composition completed in 544,102 ms; the 67,338,001-byte lossless color
artifact and 19,357,384-byte color final master completed in 639,894 ms; the
54,206,253-byte bounded UHD Remotion artifact completed in 114,315 ms; and all
11 named-edit browser journey tests passed in 16,256 ms. The standalone
signed-in maximum-eight-source journey completed in 384,735 ms.

## Honest Boundary

The evidence remains private, local, and single-host. It proves immutable
placement authority and in-process scheduling admission, not physical CPU/GPU
parallelism, Cloud Run deployment, autoscaling, quota admission, GCS behavior,
multi-hour professional throughput, ETA accuracy, external beta, or production
readiness. Those gates remain separate and fail closed.
