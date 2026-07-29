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

This slice implements the namespaced CPU runtime adapter, its process-bound
ports, output lease, receipt, and adversarial validation. It does not change
the shared tool registry, offline capability worker, operation registry,
approved snapshot, work graph, queue, cost repository, credit ledger, QA
authority, or renderer.

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

## Current Boundary

Controlled fixture execution proves structural behavior only. The private
host port is present as a process-bound integration seam, but no released
AuraFace model inference is claimed.

The following gates remain closed:

1. Canonical admission of the Transformers AuraFace operation.
2. Qualified private CPU image with exact ONNX/OpenCV preprocessing.
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
