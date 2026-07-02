# Production Readiness Validation Plan

Milestone 12 adds the unified container and tool readiness validation harness. It consolidates production tool registry metadata, M5 readiness specs, M10 CPU/render checks, M11 GPU/model-weight checks, Dockerfile declarations, and model-weight policy into one report.

Validation modes:

- `static_only`: validates declarations, docs, Dockerfile expectations, model-weight templates, and policies with no command execution.
- `dry_run`: builds expected readiness results from specs without running tools.
- `host_optional`: reserved for explicit safe host command/import checks; disabled by default in smoke tests.
- `container_command_plan`: emits human-run Docker readiness commands without executing them.
- `container_runtime`: reserved for later human-run validation.
- `production_blocked`: refuses production execution until readiness is explicitly passed.

M12 does not build Docker images, push images, deploy, run `gcloud`, process media, call providers, run GPU inference, download model weights, or render/export video.
## Milestone 13 Speech/Caption Readiness

M13 consumes the readiness report before production speech execution. faster-whisper and its model weights remain production blockers until package readiness, model-weight approval, and worker/storage policies all pass.
## Milestone 14 Smart Cut/Timeline Readiness

M14 consumes CPU/render readiness for FFmpeg preview planning and future container execution. Dry-run does not require local tools. Local-dev proxy preview skips when FFmpeg is unavailable. Production-ready smart cut/timeline execution remains blocked when readiness, approved snapshot, private storage, or cut/timeline QA gates fail.

## Milestone 15A Audio Readiness

M15A consumes CPU/FFmpeg readiness for loudness and normalization, and model-weight/tool readiness for DeepFilterNet, RNNoise, and Demucs. Dry-run does not require local tools. Local-dev FFmpeg execution skips when FFmpeg or safe local audio is unavailable. Production-ready model audio execution remains blocked when readiness, private refs, model-weight approval, source immutability, or audio QA gates fail.

## Milestone 15B Color Readiness

M15B consumes FFmpeg readiness for preview-only color correction and OpenColorIO/OpenImageIO readiness/manual review when those optional tools are selected. Dry-run does not require local tools. Local-dev FFmpeg preview skips when FFmpeg or safe local/proxy media is unavailable. Production-ready color execution remains blocked when readiness, private refs, source immutability, LUT/config safety, or color QA gates fail.

## Milestone 15C Mask Readiness

M15C consumes GPU/model readiness for BiRefNet and SAM2, optional fallback readiness for transparent-background/rembg, and CPU/GPU refinement readiness for OpenCV/Kornia. Dry-run does not require local tools or model weights. Local-dev model execution skips when tools, checkpoints, or safe local media are unavailable. Production-ready mask execution remains blocked when readiness, model-weight approval, private refs, source immutability, text safety, or mask QA gates fail.

## Milestone 15D Enhancement Slowmotion Readiness

M15D consumes GPU/model readiness for Real-ESRGAN and FILM, plus optional FFmpeg/OpenCV/Sharp readiness for fallback preview and QA planning. Dry-run does not require local tools or model weights. Local-dev model execution skips when tools, checkpoints, or safe local media are unavailable. Production-ready enhancement/slow-motion execution remains blocked when readiness, model-weight approval, private refs, source immutability, sample-first QA, selected-clip QA, or artifact QA gates fail.

## Milestone 16A Render Export Readiness

M16A consumes render worker readiness for Remotion, FFmpeg, and libass. Dry-run does not require local tools. Local-dev render/export skips when FFmpeg, Remotion, libass support, or safe local media are unavailable. Production-ready final render/export remains blocked when readiness, private refs, source immutability, upstream QA, render QA, export QA, or final-delivery gates fail.

## Milestone 16B E2E Readiness Blockers

M16B validates readiness blockers at workflow scope. Production-ready E2E blocks when required tools are missing, model weights are missing or blocked, Revideo is requested, manual/license review blockers remain, signed URLs appear, raw prompt execution fields appear, or upstream blocking QA exists. Dry-run and static validation continue with warnings and do not require FFmpeg, Docker, GPU, model weights, providers, or cloud.

## Milestone 17 Hardening Scorecard

M17 consumes readiness output in the production hardening scorecard. Production-ready remains blocked when readiness, model-weight, license, render/libass, FFmpeg LGPL, security, cost, privacy, audit, incident response, or E2E QA blockers remain.

M17 does not run deployment, `gcloud`, Docker builds, provider calls, GPU jobs, model downloads, or real user media. It reports blockers and next actions for a later human-run approval phase.
