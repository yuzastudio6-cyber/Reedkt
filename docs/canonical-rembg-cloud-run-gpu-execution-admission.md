# Canonical rembg Cloud Run GPU Execution Admission

Status: `controlled_non_executable_preflight_runtime_blocked`

## Outcome

WeEditPro now has one closed rembg preflight for the existing production
operation:

```text
tool: rembg
operation: tool.rembg.remove_image_background.v1
model: U2NetP ONNX
execution target: Google Cloud Run GPU
accelerator: NVIDIA L4 / CUDA
CPU fallback: false
runtime download: false
network fetch: false
```

The preflight joins the exact U2NetP model identity, canonical repository
locator projection, one canonical GPU bundle, an approved private source
frame extracted by the existing canonical FFmpeg lane, the professional
operation request, the one expected mask artifact, and the existing mask QA
gates.

It is deliberately non-executable. It does not start a Cloud Run job, run
inference, write an artifact, mutate a work item, or approve production use.

The production registry remains exactly 50 tool identities. rembg was already
one of those identities; this contract neither creates a new tool nor counts
the U2NetP model as a tool.

## Immutable Source And Model Observation

The requirement is pinned to:

- rembg package version `2.0.76`;
- rembg source revision
  `98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb`;
- rembg `rembg/sessions/u2netp.py` SHA-256
  `f0f0f344f5bb19505ab3570d226a73512f99ff28b021d563247776a44969b501`;
- U-2-Net source revision
  `ac7e1c817ecab7c7dff5ce6b1abba61cd213ff29`;
- exact `u2netp.onnx` size `4,574,861` bytes;
- exact model SHA-256
  `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`;
- rembg-declared model MD5 `8e83ca70e441ab06c318d82300c84806`;
- ONNX model input size `320x320`; and
- source-sized mask output.

The canonical model-artifact set has exactly one required slot:

```text
slot: rembg_u2netp_onnx
artifact: rembg-u2netp-onnx
revision: rembg-v0.0.0-u2netp-309c8469258d
format: onnx
role: rembg-u2netp-background-removal-onnx
family: u2netp
consumer scope: rembg.private-inference
```

The existing `rembg_u2netp_model` weight-manifest template remains a
placeholder. It is not silently treated as a verified repository object.
The old fixed `128x128` CPU fixture remains historical private smoke evidence
only and has no product-execution authority.

## Source-Frame Boundary

rembg consumes one still image, not the source video directly. The admission
therefore requires the exact server-owned, QA-passed dependency selected by
the current worker lease from the canonical FFmpeg source-frame extraction
work item. A generic image, caller upload, or planning-only frame expectation
cannot satisfy this boundary.

The source binding independently decodes and validates the selected PNG. It
accepts only an 8-bit, non-interlaced, opaque RGBA PNG with valid chunk CRCs,
bounded dimensions and pixels, a valid zlib stream, supported row filters,
and an exact decoded RGBA digest. It binds:

- source-sequence item, media asset, and cleanup decision IDs;
- exact MasterTiming frame and mapped source frame;
- frame rate and frame-selection policy digest;
- source-media checksum, byte length, content type, binding hash, and storage
  identity hash;
- exact extraction work-item digest, FFmpeg operation/profile, output key,
  dependency job, execution attempt, source lease, and dependency-read
  evidence;
- frame-artifact ID, asset ID, version, PNG checksum, byte length, exact
  dimensions, opaque-pixel count, and decoded RGBA checksum; and
- one matching professional-operation image binding.

Caller bytes, paths, URLs, raw chat, arbitrary frame selection, arbitrary
settings, arbitrary models, and CPU execution are rejected.

The canonical private-image verifier now admits this one exact FFmpeg output
class without broadening the image lane to arbitrary FFmpeg images. Execution
still requires a fresh lease-bound dependency reread immediately before the
GPU attempt.

## Fixed Operation Contract

The future private attempt is restricted to:

```text
device: cuda
model: u2netp
output: mask_only_png
confidence threshold: 0.5
alpha mode: straight
edge profile: approved_u2netp_default_v1
maximum subjects: 1
preserve source dimensions: true
```

It must produce exactly one customer-asset candidate:

1. a private lossless PNG mask matching the source-frame dimensions.

Mask analysis and mask-QA measurements remain process-bound, digest-only
receipts rather than two extra customer assets. The mask must contain real
alpha or mask variation. The existing canonical QA plan remains authoritative
for `mask_edge_quality` and `mask_subject_coverage`; this preflight cannot pass
either gate.

## Remaining Gates

Execution remains blocked on:

- owner-authorized repository ingest and a fresh full model-byte rehash;
- exact approved package, snapshot, work item, reservation, lease, and
  dependency rereads;
- a fresh execution-time private reread of the now-admitted exact source-frame
  artifact;
- a dependency-locked, unprivileged, network-disabled CUDA image;
- read-only model distribution to the Cloud Run attempt;
- an actual NVIDIA L4 ONNX CUDA-provider load and U2NetP benchmark;
- private mask persistence, process-bound evidence receipts, and immutable
  reread;
- decoded mask edge and subject-coverage QA;
- actual attempt and internal-cost receipts; and
- legal/owner approval for paid production.

Until those gates pass, `canonicalOperationArtifactSetVerified`,
`cloudDispatchAuthorized`, `modelInferenceAuthority`, `runtimeAuthority`, and
`productionReady` remain false. Failure must block or use an already approved
fallback; rembg must never silently fall back to CPU.

## Focused Evidence

Run:

```bash
npx tsx \
  server/smoke/canonical-rembg-cloud-run-gpu-execution-admission-smoke.ts
```

The smoke proves the exact model, repository projection, GPU-only bundle,
source-media and canonical FFmpeg frame-artifact lineage, strict PNG decode,
private storage reread, operation settings, output contract, QA gates, exact
50-tool registry boundary, and adversarial rejection of model, source,
checksum, non-opaque pixels, settings, CPU, URL, output, and authority
substitution.

No model bytes were downloaded or deserialized. No Google Cloud resource,
provider, database, billing system, queue, artifact store, deployment, or
remote service was contacted or mutated.
