# Production Model Weight Readiness Plan

Milestone 5 does not download, bundle, cache, or execute model weights. Model-weight readiness is represented as metadata and dry-run checks only.

## Separate Review Required

A repository or package license is not enough for paid ReeditPro production. Each model, checkpoint, weight file, or model card must be tracked separately for:

- source and version
- license and commercial-use permission
- redistribution permission
- attribution requirements
- network/service-use risk
- provenance and update process
- reviewer approval status

Unknown, non-commercial, or unreviewed weights block production readiness.

## Tools With Model Weight Checks

The readiness layer requires model-weight checks for model/checkpoint-based tools such as faster-whisper, whisper.cpp, PaddleOCR models, MediaPipe models, BiRefNet, SAM2, transparent-background, rembg, DeepFilterNet, Demucs, Real-ESRGAN, and FILM.

BiRefNet must not assume every related checkpoint is commercial-safe. SAM2 requires checkpoint license review even when the code license appears acceptable. OCR, speech, enhancement, segmentation, and audio AI models all remain blocked until their model weights are explicitly reviewed.

## Placeholder Paths

GPU Dockerfile templates create placeholder model-weight directories only. No model files are committed, downloaded, mounted, or referenced as available in Milestone 5.

Milestone 11 adds explicit manifest templates for faster-whisper, BiRefNet, SAM2, DeepFilterNet, Demucs, Real-ESRGAN, FILM, and PaddleOCR. These templates default to `needs_review` or blocked production behavior until a later review records source, version, license, commercial-use permission, redistribution permission, attribution requirements, provenance, and checksum.

## Production Rule

Any non-commercial model weight is blocked for paid ReeditPro production. Any unknown model-weight license is blocked until reviewed.

## Activation Phase 26 First Speech Model Approval

Activation Phase 26 records evidence for `Systran/faster-whisper-tiny` and
approves it only for staging speech/caption planning. This does not approve
production, paid production, external beta, larger Whisper models, non-speech
models, or real user media execution.

Activation Phase 26B downloads only the approved tiny model into private staging
generated-assets storage and records revision/checksum evidence. This still does
not approve production, external beta, larger models, provider models, GPU
deployment, or real user media execution.

Activation Phase 27A verifies the approved tiny model can be copied from private
staging GCS into a dedicated CPU speech runtime and executed on generated audio
only. This is not production approval, external beta approval, broad real user
media approval, or approval for any larger/non-speech model.

## Activation Phase 33A First Mask Model Approval

Activation Phase 33A records evidence for `ZhengPeng7/BiRefNet` and approves it
only for staging representative-frame/single-frame background-removal planning.
The approved BiRefNet manifest checksum remains `missing_until_download` until
an explicit Phase 33B download/load phase records revision and checksum
evidence.

Activation Phase 33B downloads only `ZhengPeng7/BiRefNet` into private staging
generated-assets storage and records revision/checksum evidence. The snapshot
contains custom code files, which are recorded but not executed. Runtime
inference, GPU deployment, mask execution, text-behind-subject, production,
external beta, paid production, and broad real media remain blocked.

Activation Phase 33C verified BiRefNet runtime loading only for the approved
snapshot and one generated synthetic image. The generated-image mask QA had no
blocking failures. This is not production approval, external beta approval,
broad real media approval, SAM2 approval, arbitrary real-video mask approval, or
text-behind-subject approval.

Activation Phase 33D used the verified BiRefNet runtime on exactly one
representative frame from the approved Phase 32 private export. It created a
private mask, RGBA cutout, metadata, and QA report with no blocking failures.
This remains controlled staging evidence only; full-video masks, SAM2,
production, external beta, broad real media, and text-behind-subject execution
remain blocked.

SAM2 evidence is recorded for future video tracking review only.
`facebook/sam2-hiera-tiny`, official SAM2 checkpoints/code, DeepFilterNet,
Demucs, Real-ESRGAN, FILM, PaddleOCR GPU, provider models, Revideo, and
text-behind-subject execution remain blocked.
## Milestone 12 Report Integration

Model-weight manifests now appear in the unified production readiness report. Unknown, non-commercial, missing, `needs_review`, and blocked model weights remain production blockers while dry-run/static readiness may surface them as warnings and next actions.

## Milestone 15C Mask Model Blockers

M15C requires approved model-weight manifests for production BiRefNet and SAM2 execution. Current `birefnet_model` and `sam2_checkpoint` templates remain `needs_review`, so production-ready mask/background/text-behind-subject execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.

## Milestone 15D Enhancement Model Blockers

M15D requires approved model-weight manifests for production Real-ESRGAN and FILM execution. Current `real_esrgan_model` and `film_model` templates remain `needs_review`, so production-ready enhancement and slow-motion execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.

## Activation Phase 34A

Phase 34A creates a staging-only approval record for `RealESRGAN_x4plus` under
`xinntao/Real-ESRGAN` for sample-first enhancement planning. It does not
download weights, deploy GPU, run enhancement, process frames/video, or approve
full-video enhancement.

FILM (`google-research/frame-interpolation`) is evaluated-only and remains
download/execution-blocked until a separate slow-motion approval/download/runtime
phase. Production, external beta, paid production, and broad real media remain
blocked.

## Activation Phase 34B

Phase 34B may download only `RealESRGAN_x4plus.pth` from the official
Real-ESRGAN GitHub release asset into private staging generated-assets storage.
It records file and aggregate SHA-256 evidence, but it does not run
Real-ESRGAN, deploy GPU, process media, or approve production use.

FILM, alternate Real-ESRGAN weights, GFPGAN/facexlib weights, enhancement
execution, slow motion, production, external beta, paid production, and broad
real media remain blocked.

## Phase 37A OCR Approval Update

Phase 37A OCR approval update: PaddleOCR/PaddlePaddle are approved only for staging generated OCR safe-zone planning. Exact PP-OCRv5 assets are deferred to Phase 37B, OCR runtime is deferred to Phase 37C, controlled real-video OCR is deferred to Phase 37D, and production, external beta, broad media, providers, public output, Revideo, FILM, and slow motion remain blocked.

## Phase 39A/39B VLM Model Weight Update

Phase 39A approves `Qwen/Qwen3-VL-8B-Instruct` only as Track B VLM planning evidence with vLLM as the future runtime candidate. Phase 39B pins revision `0c351dd01ed87e9c1b53cbc748cba10e6187ff3b`, records SHA-256 checksums, and privately stages the 15 selected model/tokenizer/processor/config/source-evidence files under the approved generated-assets model-weight prefix. This is not production, beta, broad media, provider, GPU, or runtime approval. Phase 39C must verify generated VLM runtime from local private assets only and must block runtime auto-download before any controlled real-frame or planning-integration phase can proceed.
