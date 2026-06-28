# Production Tool Readiness Plan

Milestone 5 adds a server-only readiness specification layer under `server/workers/production-readiness/`. It validates production metadata and expected checks without installing or executing tools.

## Readiness Spec Model

Each readiness spec records:

- tool ID and display name
- expected worker types and container image roles
- check modes: command version, Python import, Node import, model-weight presence, env config, Dockerfile declaration, registry policy only, evaluation block, or manual review
- command, Python, Node, model weight, and environment checks
- expected artifacts and worker types blocked if missing
- dry-run readiness status for missing tools
- evaluation-only state and production-block notes

## Dry-Run Behavior

`runProductionToolReadiness({ dryRun: true })` does not execute commands, import packages, inspect media, download models, or contact providers. It only validates specs and reports `missing`, `not_installed`, `future_only`, `evaluation_only`, `needs_license_review`, or `not_checked`.

Real command/import checks are a later readiness-worker milestone after container images are built and a human explicitly runs the readiness job.

## Milestone 6 FFmpeg/FFprobe Gate

Milestone 6 introduces local/dev media foundation execution. Real `local_dev` probe, proxy, audio extraction, and frame extraction require FFmpeg and FFprobe availability. If either binary is missing, the media foundation smoke skips generated fixture processing gracefully while still validating dry-run behavior, path safety, storage policy, artifact records, and partial report assembly.

Readiness status is not license approval. FFmpeg remains LGPL-safe by policy and pending exact production build review.

## Milestone 7 Speech/Caption Readiness Gate

Milestone 7 adds faster-whisper, model-weight, caption file, and libass readiness awareness without installing packages or downloading models.

Real `local_dev` transcription requires an already available faster-whisper command/module and an existing local model reference. Unknown, unreviewed, non-commercial, or missing model weights remain blocked for production readiness. Caption preview readiness checks FFmpeg/libass availability only for optional local-dev preview scaffolding; final export remains blocked until later render milestones.

## Milestone 9 Audio Readiness Gate

Milestone 9 adds readiness awareness for DeepFilterNet, RNNoise, Demucs, SoundTouch, Signalsmith Stretch, and FFmpeg audio loudness probing. Real local-dev execution remains opt-in and skip-first.

DeepFilterNet and Demucs require model-weight review before production use. SoundTouch and Signalsmith Stretch are tempo/pitch planning candidates only until future tool-readiness execution approves installed binaries and QA limits.

## Milestone 10 Core Install Readiness

Milestone 10 adds optional real command/import checks for safe CPU/render tools while preserving dry-run as the default. Real check mode is limited to FFmpeg/ffprobe version checks, safe libass inspection, Python imports for CPU analysis packages, Node package metadata checks for Sharp/Remotion, and an internal Hyperframe bridge source-boundary check.

GPU/model tools, model-weight checks, media processing, render/export work, provider calls, Docker builds, and frontend/browser execution remain outside M10 readiness.

FFmpeg LGPL-safe production verification and libass delivery readiness remain `pending_manual_review` until a human build/legal review approves the exact image.

## Milestone 11 GPU Readiness

Milestone 11 adds GPU dry-run readiness for package declarations, runtime template checks, pending source-install reviews, and model-weight manifest blockers.

Default GPU readiness does not import `torch`, faster-whisper, model packages, or any heavy GPU dependency. Optional real import checks are explicit, import-only, non-strict by default, and must not load weights, run inference, require a GPU, process media, or download anything.

Unknown, non-commercial, missing, or needs-review model weights block production readiness even when the code package is available.

## Production Blocking

Production-required launch tools block future worker execution if missing. Optional and future tools are warnings or `future_only`, not silently passed. Evaluation-only tools are blocked for production execution.

The API image must not contain heavy media, GPU, or model-weight tools. Frontend/browser planning tools must not process source media.

## Registry Source

The readiness specs are generated from the Milestone 2 production registry so every `ProductionToolId` has exactly one readiness spec. The registry remains server-only metadata for future recipe execution.
## Milestone 12 Unified Orchestrator

M12 adds a unified readiness orchestrator over the M5 readiness specs, M10 CPU/render checks, M11 GPU checks, model-weight templates, and image expectations. Static and dry-run modes remain safe without Docker, local tools, GPU packages, model weights, or media files.
