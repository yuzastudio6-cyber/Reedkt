# Canonical rembg GPU Runtime Contract

## Outcome

WeEditPro now has a bounded CUDA-only runtime source for the existing
`rembg` tool inside the one shared `gpu_ai_worker` architecture:

- the existing operation
  `tool.rembg.remove_image_background.v1`;
- exact rembg `2.0.76` and ONNX Runtime GPU `1.27.0` identities;
- 29 exact Linux/amd64 wheels with SHA-256 hashes;
- Python `3.11.14` built from the exact pinned source archive;
- the exact `4,574,861`-byte U2NetP ONNX model;
- one fixed private opaque-RGBA PNG input;
- one fixed read-only model directory;
- one fixed private output directory;
- an exclusive `CUDAExecutionProvider` session with ONNX Runtime CPU
  execution-provider fallback disabled;
- one private grayscale PNG mask plus two digest-only process-evidence
  receipts; and
- strict server-side request, response, dimension, population, and lineage
  verification.

This does not add a tool. The production registry remains exactly 50 tool
identities, and `rembg` remains one of those 50.

## Fixed runtime boundary

The request cannot provide paths, URLs, bytes, commands, model aliases, or
arbitrary settings. The shared worker supplies:

```text
/mnt/reeditpro/private-input/source-frame.png
/mnt/reeditpro/model-artifacts/rembg-u2netp/u2netp.onnx
/mnt/reeditpro/private-output/
```

The runner accepts only an 8-bit, non-interlaced, opaque RGBA PNG whose size,
SHA-256, dimensions, decoded RGBA SHA-256, and opaque-pixel count match the
canonical source-frame artifact binding. It validates the model file before
importing the inference runtime.

The runner forces `U2NET_HOME` to the fixed verified model directory, removes
the model-checksum bypass environment variable, disables ONNX Runtime CPU
execution-provider fallback, and requires the instantiated session provider
list to be exactly:

```text
CUDAExecutionProvider
```

The container may not fetch or download a model at runtime. A missing or
changed mount fails before inference.

## Result boundary

The untrusted wire result must describe exactly:

1. `mask.png`, an 8-bit grayscale PNG with the source dimensions and bounded
   byte size;
2. `mask-analysis.json`, a digest-only process-evidence receipt; and
3. `mask-qa-measurement.json`, a digest-only measurement receipt.

The mask verifier rejects dimension drift, population-accounting drift,
constant masks, missing partial pixels, malformed digest or file identities,
CPU substitution, extra fields, and request/dispatch lineage mismatch.

The result remains a candidate until the output bytes are privately reread,
committed to the immutable artifact manifest, and passed by the existing
`mask_edge_quality` and `mask_subject_coverage` QA gates. The runtime receipt
cannot pass QA or create an asset by itself.

The private-output reread seam is now implemented. A one-shot process-bound
reader supplies the fixed mask, analysis, and measurement files; the server
checks every receipt digest, fully decodes the 8-bit grayscale PNG, recomputes
all mask populations and the fixed 0.5-threshold population, and requires both
JSON files to match the runner's exact stable encoding and lineage. Verified
bytes are delivered only through a separate one-shot process-bound consumer.
The resulting receipt is byte-free and remains non-authoritative. In
particular, an empty process finding list does not pass canonical QA.

## Shared router

The workflow-neutral GPU operation router now discriminates between the
existing Faster Whisper transcription envelope and the rembg background-mask
envelope. Each process-bound runtime port declares its allowed operation IDs
and is consumed exactly once. A Faster Whisper port cannot execute rembg, and
a rembg port cannot execute Faster Whisper.

The rembg subprocess adapter invokes only:

```text
/opt/reeditpro/gpu-operations/rembg/venv/bin/python
/opt/reeditpro/gpu-operations/rembg/runner.py
```

It uses no shell, caller-selected executable, caller-selected path, or
caller-selected environment.

## Authority boundary

Implemented:

- exact dependency and source-provenance locks;
- fixed server-owned input/model/output layout;
- CUDA-only runner and local-model-only enforcement;
- strict server-derived request binding;
- one shared multi-operation GPU router;
- strict untrusted-wire result verification;
- mask and process-evidence result candidates; and
- private output byte reread, grayscale PNG decode, process-evidence
  recomputation, and out-of-band verified-byte delivery; and
- adversarial contract, router, source-frame, request, and result smokes.

Still required:

- a clean immutable Linux/amd64 image build;
- a real Cloud Run NVIDIA L4 container start;
- exact model and source-frame read-only mounts;
- an actual ONNX CUDA-provider load and U2NetP inference benchmark;
- canonical worker and completion receipts;
- private artifact commit, independent edge/coverage QA, and reconciliation;
- GPU-active attempt-cost evidence; and
- service identity, IAM, deployment, and production review.

No cloud dispatch, model-inference authority, work or queue mutation, artifact
commit, QA pass, customer cost, approval, snapshot, render, or production
authority is granted by this source slice. There is no CPU fallback.

## Focused evidence

Run:

```bash
npm run smoke:canonical-rembg-gpu-runtime
npm run smoke:canonical-gpu-worker-operation-router
```

These smokes syntax-compile and fail-close the runner without mounts, rehash
the exact source locks, preserve the 50-tool registry, exercise both shared
router operations, and verify the exact canonical source-frame → rembg request
→ mask-result lineage with adversarial substitutions.
