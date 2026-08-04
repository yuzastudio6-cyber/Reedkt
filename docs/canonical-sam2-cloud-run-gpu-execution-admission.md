# Canonical SAM2 Cloud Run GPU Execution Admission

Status: `controlled_non_executable_preflight_runtime_blocked`

## Outcome

ReEditPro now has one SAM2-specific preflight that joins:

- the exact Meta SAM 2.1 Hiera Small requirement set;
- its exact repository locator projection;
- one canonical L4/CUDA GPU bundle for
  `tool.sam2.segment_and_track_subject.v1`;
- one private MP4 source expectation;
- one server-compiled structured subject prompt artifact;
- the approved snapshot, work item, credit reservation, worker lease, and
  idempotency fields required by the closed candidate request schema;
  and
- one closed output and QA contract.

This closes a real operation-contract gap: SAM2 cannot select or track a
subject without a box or point prompt. The canonical operation now admits a
private `json_data` input and requires
`subjectPromptProfile=normalized_box_or_points_v1` plus the exact SHA-256 of
that prompt artifact. A worker must never infer the subject from raw chat,
an unchecked label, a caller path, or an arbitrary model argument.

The preflight is deliberately non-executable. It does not authorize a Cloud
Run job or model inference.

SAM2 is one of the separately retained non-E2E capability candidates, not one
of the exact 50 production tool identities. Its request is therefore validated
by this closed candidate-only schema and must not resolve through or expand the
production operation registry. Promotion requires a complete canonical
private lifecycle, confined GPU runtime, job adapter, QA, cost, and deployment
proof; this preflight supplies none of those authorities.

## Structured Prompt Boundary

The prompt packet is server-compiled and strict. It binds:

- a server-owned subject-selection ID;
- exact source artifact ID and SHA-256;
- exact source frame index and dimensions;
- normalized source-frame coordinates with at most six decimals;
- exactly one subject; and
- either one in-frame bounding box or 1-32 unique point prompts containing
  at least one foreground point.

The packet contains no raw media, raw chat, paths, URLs, credentials, or
free-form subject label. Its internal digest covers the closed packet, and
the professional operation request separately binds the SHA-256 and byte
length of its canonical stable-JSON representation. The request must contain
exactly:

1. one private `video` artifact binding; and
2. one private `json_data` prompt artifact binding.

The source and prompt artifact bytes must still be selected and reread by the
existing canonical worker-lease dependency authority. This preflight does
not trust caller-provided bytes or artifact storage locations.

Candidate verification also requires the original source expectation and
candidate operation request again. It reconstructs the source digest and
duration, reruns the closed candidate validator, and compares the snapshot,
work, credit, lease, idempotency, settings, and request-digest lineage.
Re-signing the candidate after changing either parent does not make it valid.

## Model And GPU Binding

The candidate accepts only:

```text
tool: sam2
operation: tool.sam2.segment_and_track_subject.v1
model: sam2.1-hiera-small
checkpoint bytes: 184416285
checkpoint SHA-256:
  6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38
consumer scope: sam2.private-inference
execution target: google_cloud_run_gpu
Cloud Run accelerator: nvidia_l4
model accelerator: cuda
CPU fallback: false
runtime download: false
network fetch: false
```

The serialized GPU bundle is checked for its exact tool, operation, consumer
scope, one-slot artifact metadata, binding digest, ordered requirements
digest, bundle ID, and bundle digest. That still does not replace a fresh
full repository byte rehash at execution time. The future coordinator must
use the generic repository and Cloud Run GPU handoff authority immediately
before creating a remote, read-only model mount.

## Output Contract

The first real runtime candidate must emit exactly:

1. a private `mask_sequence` as lossless gray8 FFV1 Matroska with source
   frame count, dimensions, and timing preserved;
2. a private JSON tracking analysis report; and
3. a private JSON mask QA measurement report.

The mask sequence is not the old planning-only JSON placeholder. It is a
byte-producing lossless mask stream that downstream QA can decode and reread.
The existing canonical QA plan remains authoritative and must evaluate:

- `mask_edge_quality`;
- `mask_temporal_stability`; and
- `mask_subject_coverage`.

Contact-object preservation remains an operation setting and must be
measured before a mask becomes eligible for composition.

## Remaining Runtime Gates

Before execution can be admitted, the backend still needs:

- owner-authorized ingest and a fresh full checkpoint rehash;
- exact approved package, snapshot, work, reservation, lease, and dependency
  rereads;
- private source and prompt artifact byte reads;
- a pinned unprivileged CUDA image with the exact SAM2 source and Meta config;
- confined read-only checkpoint deserialization;
- a deployed Cloud Run L4 job with verified service identity and IAM;
- an actual L4 install, load, warmup, memory, latency, output, and cost
  benchmark;
- private mask stream and report persistence;
- decoded mask QA and reconciliation;
- owner/legal approval for paid production; and
- canonical attempt completion and actual-cost evidence.

Until those gates pass, `canonicalOperationArtifactSetVerified`,
`cloudDispatchAuthorized`, `modelInferenceAuthority`, `runtimeAuthority`, and
`productionReady` remain false. Failure must block or use an already approved
fallback; CPU execution is not allowed.

## Focused Evidence

Run:

```bash
npx tsx \
  server/smoke/canonical-sam2-cloud-run-gpu-execution-admission-smoke.ts
```

The smoke proves the exact model/GPU/source/prompt/request/output/QA lineage
and rejects unknown prompt fields, raw chat, digest and byte-length changes,
invalid boxes, unsafe point sets, missing prompt artifacts, source timing
drift, wrong model manifests, CPU substitution, operation substitution,
output substitution, and authority forgery.

No model bytes were downloaded or deserialized. No Google Cloud resource,
provider, database, billing system, queue, artifact store, deployment, or
remote service was contacted or mutated.
