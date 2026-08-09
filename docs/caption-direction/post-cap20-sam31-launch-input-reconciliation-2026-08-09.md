# Post-CAP-20 SAM 3.1 launch-input reconciliation

Milestone: `POST-CAP-20-SAM31-LAUNCH-INPUT-RECONCILIATION`

Status: `blocked_latest_signed_image_not_bound_to_current_package`

Target: `caption_specialist_private_internal_qualified`

## Outcome

The canonical read-only cloud audit and a new digest-bound launch-input
preflight now establish the current SAM 3.1 qualification truth without
staging or starting a GPU job.

The selected Vertex Custom Job lane is available: one A100 80 GB custom-
training quota is granted in `us-central1`, no qualification job is active,
the private foundation is ready, and the latest qualification image has a
qualified supply-chain release. The paid launch is nevertheless blocked
because the last qualification package is bound to an older immutable image.
The launch owner already refuses that crossed lineage.

## Current read-only observation

Observed at `2026-08-09T03:46:05.827Z`:

- historical package request:
  `sam31-source-checkpoint-qualification-20260808-v5-gpu-forwarding-corrected`;
- package request digest:
  `sha256:dd7b2a721aee4dfb21a8a9ceff8874d703459339ed0451f588e16cd54dd746b2`;
- package-bound image digest:
  `sha256:c204413eea590368032d471918d2c18da51072bff02caf0bb6f2de2496c5893b`;
- latest qualified image release:
  `sam31-qualification-image-supply-chain-release-b9a8308b58618bcd69e44c86`;
- latest release digest:
  `sha256:e20534016952670b43898532f9e94247951fc0cbdd7e6e5450c6acf10232392f`;
- latest immutable image digest:
  `sha256:b816c31e5f71804005c37c5f70c0c8c48f3c50f86faccb16123eecb1deae2ca1`;
- Vertex A100 Custom Training quota: `1`, current and not reconciling;
- active qualification jobs: `0`;
- maximum two-hour compute plus prorated boot-disk cost:
  `$11.672325712`; and
- exact blocker: `package_image_release_lineage_mismatch`.

Preflight result SHA-256:
`7e92cf071cd65ef32e185d3f1af3402290718464b93a3abf6758188005defd35`.

The account-effective rate authority was exact and current at observation.
It must still be reread immediately before any eventual paid launch.

## Source change

The source now exposes
`canonical-sam3_1-vertex-qualification-launch-preflight-v1` and the read-only
operator:

```text
npm run inspect:sam3_1-source-checkpoint-qualification-vertex-launch
```

The service exact-rereads only the caller-selected historical package,
qualified image release, current account-effective rate authority, and Vertex
quota owner. It computes the full two-hour infrastructure ceiling using the
existing A100 cost owner. It creates no package or staging record and has no
provider, GPU, customer-credit, billing-settlement, qualification, runtime-
release, public-delivery, or production authority.

Its focused smoke proves the ready path, current cost, missing-record path,
newer-image/stale-package refusal, quota refusal, unknown-field refusal,
authority-overclaim refusal, and digest-tamper refusal.

## Next safe boundary

Before paid execution, the canonical package publisher must create and reread
one new metadata-only package bound to the latest qualified image release.
That publication must reuse the existing reviewed official source/checkpoint,
artifact review, probe fixture, and package repository owners. It must not be
implemented as a Caption-owned package writer.

After publication, rerun this read-only preflight with the new exact package
reference. Only an exact `ready_for_explicit_paid_launch_authorization` result
may be presented for explicit spend authorization. No GPU launch, model
execution, retry, customer-credit mutation, or production action occurred in
this milestone.
