# Post-CAP-20 SAM 3.1 live qualification launch preflight

Milestone: `POST-CAP-20-SAM31-LIVE-QUALIFICATION-PREFLIGHT`

Status: `exact_launch_inputs_ready_paid_job_not_authorized_or_started`

Target: `caption_specialist_private_internal_qualified`

> Historical receipt correction (2026-08-09): this exact input set is no
> longer the current launch candidate. A newer signed qualification image was
> published after this package, so the package/image lineage now fails closed.
> See
> [`post-cap20-sam31-launch-input-reconciliation-2026-08-09.md`](post-cap20-sam31-launch-input-reconciliation-2026-08-09.md).

## Outcome

A read-only operator preflight now proves that the canonical backend has one
coherent set of current inputs for the bounded SAM 3.1 source/checkpoint
qualification on Vertex Custom Training A100 80 GB. The preflight listed and
exact-reread only private control-plane records. It did not create, stage,
dispatch, reconcile, or retry a job; read a secret payload; download a model;
or mutate customer credits, billing, public delivery, or production state.

The source route is also independently bound to ten exact current files. Its
normal release regression now rehashes those files and fails on drift.

## Exact current inputs

Observed at `2026-08-09T00:10:34Z`:

- worker request ID:
  `sam31-source-checkpoint-qualification-20260808-v5-gpu-forwarding-corrected`;
- worker request digest:
  `sha256:dd7b2a721aee4dfb21a8a9ceff8874d703459339ed0451f588e16cd54dd746b2`;
- package prepared at `2026-08-08T23:41:55Z`;
- image supply-chain release ID:
  `sam31-qualification-image-supply-chain-release-6b6fcff3bf66208f33f0f0e2`;
- image release digest:
  `1a80171dedfbf9ee94476171b6cd749c0e9ed15f2b2c381b6f19f26362d54f3c`;
- immutable image digest:
  `sha256:c204413eea590368032d471918d2c18da51072bff02caf0bb6f2de2496c5893b`;
- current rate authority ID:
  `vertex-a100-rate:vertex-a100-us-central1-weeditpro-vertex-a100-rate-publisher-xr7f4`;
- current rate authority version: `1`;
- current rate authority digest:
  `889a1562352103c62b9b191360a1d1376989926f8a8c1e836c70111d6c4a0e5e`;
- rate authority expiry: `2026-08-09T14:04:01.042Z`;
- granted Vertex A100 Custom Training quota: `1` in `us-central1`;
- active qualification jobs at observation: `0`; and
- route source bindings: `10/10` exact.

The rate authority must be reread again immediately before any future launch.
Expiration or source/image/package drift must fail closed and require a fresh
preflight; these values are not standing dispatch permission.

## Bounded internal platform cost

The canonical admission permits one `a2-ultragpu-1g` replica, one A100 80 GB,
12 vCPUs, 170 GiB memory, a 200 GiB `pd-ssd` boot disk, and at most 7,200
execution seconds. Applying the exact account-effective maximum component rates
to that full two-hour envelope yields:

- maximum compute plus prorated boot-disk cost:
  **$11.672325712**;
- expected network egress: `0 GiB`;
- variable private-object storage operations: excluded from this preflight
  figure and reconciled from actual terminal usage; and
- actual attempt cost: unavailable until provider usage and billing evidence
  are reread after termination.

This is an internal platform qualification cost, not a customer credit charge,
service-fee estimate, or permission to spend. Automatic retry remains false.

## Why the Caption gate remains open

This preflight proves launch readiness, not SAM behavior. The current audit
still reports:

- `sourceCheckpointCompatibilityReceiptObserved: false`;
- `liveGpuQualificationObserved: false`;
- `liveGeminiQualificationObserved: false`; and
- `productionReady: false`.

Even a successful generic SAM qualification will not by itself satisfy the
Caption Track All gate. The terminal campaign must later consume an admitted
Caption-scoped Track All result, complete requested-range mask evidence,
independent scene QA, and the exact approved snapshot/output/frame/work lineage.

## External authorization boundary

This historical receipt must not be used to start the bounded paid Vertex job.
The current package/image mismatch must first be resolved through the existing
canonical package publisher and the new read-only preflight must return ready.
After that correction, the paid start remains an explicit external-spend
authorization boundary. The existing canonical start/reconcile operator must
be used with a fresh rate reread and a new single-attempt ID. No Caption-owned
dispatcher or alternate GPU owner may be introduced.
