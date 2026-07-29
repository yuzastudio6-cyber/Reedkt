# Living Frame AuraFace CPU Runtime Boundary

## Outcome

Living Frame treats AuraFace as an optional, separately metered CPU
continuity-measurement attempt. It is not part of the shared ComfyUI GPU
generation attempt, is not an identity generator, and cannot approve a
person's identity, likeness, documentary truth, or final scene.

The runtime boundary is subject-neutral. Historical illustrations, product
characters, documentary portraits, presenters, and other supported visual
subjects all use the same contract. Musashi and other earlier examples are
fixtures of the creative idea, not hard-coded routes.

## Canonical Relationship

```text
approved Living Frame work item
  -> consumed canonical tool-dispatch grant
  -> process-bound private reference/candidate image input
  -> two exact canonical read-only AuraFace model bindings
  -> fixed private CPU host operation
  -> process-bound single-use 512-D embedding lease
  -> continuity measurement and project-calibrated QA
  -> canonical resource-usage cost evidence
  -> existing settlement and private-review authorities
```

The implemented source boundary includes the namespaced CPU runtime adapter,
its process-bound ports, output lease, receipt, fixed offline runner protocol,
and a private CPU container candidate. It does not change the shared tool
registry, offline capability worker, operation registry, approved snapshot,
work graph, queue, cost repository, credit ledger, QA authority, or renderer.

## Required Operation

The future canonical operation is:

```text
canonical tool: transformers
operation: tool.transformers.measure_auraface_identity_continuity.v1
```

This is one CPU attempt. The five controlled-illustration GPU capabilities
(ComfyUI, ControlNet preprocessing, ControlNet conditioning, generic
IP-Adapter, and PEFT/LoRA loading) remain one shared ComfyUI GPU attempt.
AuraFace cannot cause those five capabilities to be charged again.

Exact reuse of an already accepted continuity result adds no new attempt.
Failed and outcome-unknown attempts retain internal resource cost evidence,
but customer billability remains an existing downstream settlement decision.
The Living Frame adapter never adds ReeditPro's service fee.

## Inputs

The serializable request surface contains only bounded IDs and SHA-256
lineage:

- exact AuraFace artifact-requirement digest;
- reference and candidate artifact IDs/digests;
- reference and candidate continuity-entry digests;
- preprocessing-spec digest;
- consent and safety admission digest;
- exact canonical dispatch scope, work item, snapshot, attempt, and output.

Image bytes are supplied only through a registered, process-bound,
single-use server input port. Model observations are supplied only through a
registered process-bound binding port that will wrap the canonical
model-artifact repository and read-only mount authority. Caller bytes, paths,
URLs, endpoints, credentials, commands, thresholds, identity approvals, and
model locators are rejected.

The exact required controlled model observations remain:

| Role | Artifact | Bytes | SHA-256 |
|---|---|---:|---|
| Face embedding | `glintr100.onnx` | 260,694,151 | `a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60` |
| Detection/alignment | `scrfd_10g_bnkps.onnx` | 16,923,827 | `5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91` |

Those values remain controlled observations bound to revision
`af6d057c9b0ec4071d4c49c80e3539258798b609`. They do not by themselves prove
current source truth, legal approval, artifact ingest, mount availability, or
production readiness.

## Output And Privacy

A completed attempt may issue one process-bound, single-use lease containing
two 512-dimensional `Float32Array` values. The arrays:

- never appear in the JSON receipt;
- cannot use `SharedArrayBuffer`;
- must contain only finite values and have non-zero norm;
- are copied before leasing;
- cannot be persisted by this contract;
- cannot be interpreted using a caller-supplied or universal threshold;
- cannot approve identity or likeness.

The receipt includes only output digests, face counts, timing observation,
terminal state, and closed authority flags.

No face or multiple faces produces `user_review_required` without an
embedding lease. A host failure or lost result produces `failed` or
`outcome_unknown`; it cannot be rewritten as success.

## Fixed Offline Package Candidate

`docker/prod/cpu-worker/auraface/` now provides a private, unreleased Linux
AMD64 package candidate:

- Python `3.13.11` is pinned by base-image digest;
- 23 Python wheels are version- and SHA-256-pinned;
- InsightFace Python code is fixed at `1.0.1`;
- ONNX Runtime is fixed at `1.28.0`;
- OpenCV headless is fixed at `5.0.0.93`;
- no face model or detector is baked into the image;
- package-shipped ONNX test fixtures are removed before the runtime image is
  assembled;
- the runtime user is non-root;
- the model directory is read-only;
- the request accepts committed PNG/JPEG bytes rather than caller paths or
  URLs;
- encoded-byte, decoded-dimension, EXIF-orientation, exact-one-face,
  artifact-size, and artifact-digest checks fail closed; and
- the operation emits no similarity threshold or identity decision.

The fixed preprocessing digest
`2660c1ec27667e691e9d1a84c0426fee95ccde4ddd35470e485ff5dcd4c6d614`
binds OpenCV BGR decode, 640x640 SCRFD detection, five-landmark ArcFace
alignment, 112x112 embedding input, 512-component float32 output, and L2
normalization. The server protocol permits at most 120 seconds, matching the
existing namespaced CPU-runtime ceiling.

On 2026-07-29, a controlled local Linux AMD64 build succeeded from the pinned
wheel set. A private `--network=none`, read-only container execution mounted
the two exact AuraFace artifacts, processed one generated fictional adult
portrait as both reference and candidate, detected exactly one face in each
input, and returned two valid 512-component embeddings with identical
inference-output digests. This is a source-package compatibility observation,
not a production latency, fairness, identity, legal, or release benchmark.
The test portrait and downloaded model copies were kept outside the repository.

## Current Boundary

Controlled fixtures prove structural behavior, while the dated local
container run proves that the pinned package can execute the exact model
pair offline on a fictional test image. Neither observation is released
runtime evidence. The private host port remains a process-bound integration
seam and no production AuraFace inference is claimed.

The following gates remain closed:

1. Canonical admission of the Transformers AuraFace operation.
2. Signed and independently qualified private CPU image admission for the
   current source package.
3. Canonical read-only mounts for both exact model artifacts.
4. Canonical private reference/candidate artifact reader.
5. Consent, likeness, minor, impersonation, and documentary-safety admission.
6. Detector/alignment/embedding compatibility benchmarks.
7. Retention, deletion, access, fairness, and project threshold policy.
8. Canonical resource-usage recording and actual-cost binding.
9. Continuity QA, private review, and release evidence.

Until those gates close, `runtimeAuthority`, `actualCostAuthority`,
`customerCreditAuthority`, `identityVerificationAuthority`,
`qaApprovalAuthority`, and `productionAuthority` remain literal `false`.
