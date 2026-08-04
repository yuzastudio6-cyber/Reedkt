# Canonical SAM2 GPU runtime source and router

Status: `source_complete_external_checkpoint_and_l4_evidence_open`

## Outcome

ReEditPro now has one fixed, server-owned, byte-producing runtime source
contract for `tool.sam2.segment_and_track_subject.v1`, plus a typed
request/result protocol, one-shot subprocess port, and the existing shared GPU
operation router lane.

The lane consumes the already approved two-step Living Frame work lineage:

1. FFmpeg prepares the private source-video proxy.
2. SAM2 reads that exact proxy and the exact server-compiled normalized subject
   prompt, loads the one canonical checkpoint from a read-only model slot, and
   emits an FFV1 gray8 mask sequence plus analysis and QA measurements.

It does not use rembg and it does not introduce another tool identity.

## Fixed runtime

The source package lives under `docker/prod/gpu-worker/sam2`. It pins:

- SAM2 source revision
  `2b90b9f5ceec907a1c18123530e92e794ad901a4`;
- the exact Meta source config SHA-256
  `0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55`;
- SAM2 1.0, Torch 2.5.1+cu124, TorchVision 0.20.1+cu124, and CUDA build
  12.4;
- the exact 184,416,285-byte Hiera Small checkpoint identity; and
- the exact locally inspected private parent image digest
  `8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4`.

The runner accepts one bounded JSON request through stdin. Source video,
checkpoint, and output paths are fixed. It requires UID/GID 65532, a read-only
root, CUDA device 0, one L4, offline package modes, an empty output directory,
and exact source/model byte hashes before inference. The checkpoint is hashed
again after inference.

CPU fallback, caller paths, caller URLs, caller bytes, runtime downloads,
network fetches, model selection, commands, and environment overrides are
forbidden.

## Output

The fixed outputs are:

- `mask-sequence.mkv`: source-sized, source-timed gray8 FFV1 Matroska;
- `tracking-analysis.json`; and
- `mask-qa-measurement.json`.

The wire response contains only hashes, sizes, timing, bounded coverage and
temporal measurements, and lineage. It does not return media bytes, prompt
coordinates, paths, credentials, or customer cost.

These measurements do not approve edge quality, temporal stability, subject
coverage, contact-object preservation, artifact reconciliation, or private
review. Existing canonical owners must reread the private outputs and make
those decisions.

## Honest remaining boundary

This source slice does not claim that the current runner image has been built,
scanned, signed, or run on Cloud Run. It does not claim that the exact
checkpoint has been ingested or mounted. It does not claim checkpoint load,
L4 inference, output persistence, resource usage, cost, or QA evidence.

The bounded private-local checkpoint download, confined weights-only
deserialization, exact read-only mount, and hard CPU-emulation refusal are
recorded separately in
`canonical-sam2-local-artifact-runtime-evidence-2026-07-30.md`. They narrow
the gate but do not replace canonical repository ingest or L4 evidence.

The remaining internal model-runtime gate is now external and concrete:

1. ingest the exact checkpoint through the canonical model-artifact repository;
2. mount it read-only in the signed runtime image;
3. execute this exact request on one real L4;
4. persist and reread all three outputs;
5. run edge, temporal, coverage, contact-object, destination-composite, and
   private-review QA; and
6. record the canonical attempt and resource-cost receipts.

Operation registration and dispatch remain false until that evidence exists.
The number of tool identities is not treated as a product cap; promotion still
requires a genuinely distinct released executable identity and must never
invent identities for checkpoints, libraries, or capabilities.

## Focused validation

Run:

```bash
python3 -m py_compile docker/prod/gpu-worker/sam2/runner.py
npx tsx server/smoke/canonical-sam2-gpu-operation-router-smoke.ts
npx tsx server/smoke/canonical-sam2-cloud-run-gpu-execution-admission-smoke.ts
```

The first smoke rehashes the exact source package, routes one controlled
request through the shared GPU router, validates the digest-only response, and
rejects path, prompt-digest, CPU, region, output-lineage, and unavailable
subprocess substitutions. The second compiles the existing exact admission
into the new runtime request and structurally verifies the result candidate
without claiming execution.
