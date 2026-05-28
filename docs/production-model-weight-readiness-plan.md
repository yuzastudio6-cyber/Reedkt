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
## Milestone 12 Report Integration

Model-weight manifests now appear in the unified production readiness report. Unknown, non-commercial, missing, `needs_review`, and blocked model weights remain production blockers while dry-run/static readiness may surface them as warnings and next actions.

## Milestone 15C Mask Model Blockers

M15C requires approved model-weight manifests for production BiRefNet and SAM2 execution. Current `birefnet_model` and `sam2_checkpoint` templates remain `needs_review`, so production-ready mask/background/text-behind-subject execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.

## Milestone 15D Enhancement Model Blockers

M15D requires approved model-weight manifests for production Real-ESRGAN and FILM execution. Current `real_esrgan_model` and `film_model` templates remain `needs_review`, so production-ready enhancement and slow-motion execution is blocked until a later review approves source, version, checksum, license, commercial use, redistribution, attribution, and runtime mount policy.
