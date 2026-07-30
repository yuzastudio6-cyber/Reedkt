# Production SAM2 Execution Policy

SAM2 is the segmentation/tracking and propagation candidate for video masks,
subject tracking, and text-behind-subject support.

The first exact internal candidate is Meta SAM 2.1 Hiera Small, pinned by
source revision, model-repository revision, config digest, byte length, and
checkpoint SHA-256 in
`canonical-sam2-model-artifact-requirements.md`. The exact candidate does not
promote the legacy `sam2_checkpoint` placeholder template and does not approve
paid production.

The operation-specific preflight in
`canonical-sam2-cloud-run-gpu-execution-admission.md` also requires one
private source video and one server-compiled `json_data` subject-prompt
artifact. The prompt must be a closed normalized box-or-points packet bound
by SHA-256. Raw chat, free-form subject guesses, caller paths, and labels are
not valid SAM2 prompts.

SAM2 is GPU-only in ReEditPro. Its required target is the existing Google
Cloud Run `nvidia_l4` GPU worker with CUDA. CPU fallback, runtime checkpoint
download, network fetch, and caller-selected model paths are forbidden.

Production execution requires all of:

- owner-authorized ingest of the exact artifact into the canonical
  model-artifact repository;
- a fully verified operation-owned GPU bundle;
- a pinned and confined CUDA worker image containing the exact source and
  model config;
- an exact source-config/checkpoint load fixture (the pinned Hugging Face
  repository config differs from the selected current Meta source config);
- a real L4 checkpoint-load and inference benchmark;
- canonical private source-artifact read and mask-output persistence;
- canonical private structured-prompt artifact read;
- mask edge, subject coverage, contact-object, and temporal-stability QA;
- approved snapshot, work, credit reservation, attempt, and asset lineage;
  and
- explicit owner/legal approval for paid production.

The current mask runner remains planning-only and local-path-based. It does
not download checkpoints or run inference. Missing GPU, CUDA, artifact,
runtime, capacity, or QA evidence must block SAM2 or use an already approved
fallback; it must never trigger silent CPU execution.

An adjacent private internal test now proves that the exact pinned SAM2 source
revision, selected native Meta config, native video-predictor builder, Torch
2.5.1+cu124, TorchVision 0.20.1+cu124, and CUDA 12.4 build are present and
importable in the measured local GPU-worker proof image. The derived wrapper
runs model-free as UID/GID 65532 with a fixed entrypoint, no network, read-only
root, no capabilities, no caller arguments, and no model mounts. This is
local CPU-emulated source/config/runtime packaging evidence only. It does not
qualify the image, checkpoint, L4 runtime, deserialization, inference, output,
QA, cost, dispatch, or production boundary.

The first byte-producing output contract is a private gray8 FFV1 Matroska
mask sequence with source dimensions, frame count, and timing preserved, plus
private JSON analysis and QA reports. The legacy planning-only mask-sequence
JSON record is not evidence of real SAM2 inference.
