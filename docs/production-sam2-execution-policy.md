# Production SAM2 Execution Policy

SAM2 is the segmentation/tracking and propagation candidate for video masks,
subject tracking, and text-behind-subject support.

The first exact internal candidate is Meta SAM 2.1 Hiera Small, pinned by
source revision, model-repository revision, config digest, byte length, and
checkpoint SHA-256 in
`canonical-sam2-model-artifact-requirements.md`. The exact candidate does not
promote the legacy `sam2_checkpoint` placeholder template and does not approve
paid production.

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
- mask edge, subject coverage, contact-object, and temporal-stability QA;
- approved snapshot, work, credit reservation, attempt, and asset lineage;
  and
- explicit owner/legal approval for paid production.

The current mask runner remains planning-only and local-path-based. It does
not download checkpoints or run inference. Missing GPU, CUDA, artifact,
runtime, capacity, or QA evidence must block SAM2 or use an already approved
fallback; it must never trigger silent CPU execution.
