# Production Tool Runtime Roadmap

## Purpose

This roadmap connects the Milestone 0 architecture lock to later production implementation. It describes how ReeditPro moves from mock planning into professional backend AI editing without weakening approval, credit, worker, or frontend boundaries.

Milestone 0 is documentation-only. It does not install packages, execute tools, deploy Google Cloud resources, call providers, render media, process uploads, create secrets, or change frontend behavior.

## Locked Decisions

- Workers execute approved plan snapshots, not raw chat messages.
- The browser/frontend may request, display, and approve plans, but it must not run heavy media tools, AI providers, render workers, service-role mutations, or privileged storage operations.
- Backend services and workers own service-role access, private storage, provider gateways, credit mutation, job leases, tool execution, QA, rendering, and export.
- Production tools are recipe pipelines with validation, confidence scoring, QA, fallback, and timeline/render integration.
- Revideo is `evaluation_only` and `future_optional`, not a core launch dependency.
- The core render stack is Hyperframe, Remotion, FFmpeg, libass, and OpenTimelineIO.

## Runtime Flow

1. Frontend gathers source order, workflow context, edit level, mood/style, reference media, and custom instructions.
2. Planning compiles raw chat into structured intent, video understanding, source sequence, timing, visual/audio/tool strategies, credit estimate, and QA plan.
3. User approves the edit plan, confirmed frame, timing assumptions, source cleanup preference, and credit estimate.
4. Backend freezes an approved plan snapshot and reserves credits where required.
5. Backend creates worker jobs from the approved snapshot, dependency graph, asset manifest, recipe plans, and idempotency keys.
6. Workers load trusted records by ID, read private GCS objects, run approved recipes, write artifacts, emit events, and update manifest/QA records.
7. Render/export waits for required assets, reconciled timelines, timing, caption, audio, color, mask, render, and final QA gates.
8. Failed required QA blocks final export or routes to an approved fallback/user-review path.

## Worker-Only Tool Model

Tools must not be exposed as direct user commands or thin wrappers. A production tool run should always include:

- approved snapshot reference;
- recipe family and recipe version;
- input analysis and eligibility checks;
- validated settings from tool catalogs;
- storage references, not signed URLs as canonical source;
- idempotency key and worker lease ownership;
- output artifact manifest entries;
- confidence score and QA result;
- fallback/refine decision;
- timeline/render integration result.

## Milestone Roadmap

- Milestones 1-2 define durable contracts, schemas, tool registry entries, recipe capability metadata, review status, and fallback policies.
- Milestones 3-5 prepare Google Cloud infrastructure templates, worker orchestration, production container templates, and dry-run tool readiness checks.
- Milestones 6-9 add professional media, speech/caption, smart cut/timeline, and audio/sound foundations.
- Milestone 10 installs/declares core CPU/render packages and safe readiness checks.
- Milestone 11 adds GPU AI package installation and model-weight placeholders.
- Milestone 12 validates full container/tool readiness.
- Milestones 13-15 add real speech/caption, smart cut/media timeline, and split audio/color/mask execution.
- Milestone 15A adds real audio execution; Milestone 15B adds real color execution; Milestone 15C adds real mask/background/text-behind-subject execution; Milestone 15D adds real enhancement/slow-motion execution.
- Milestone 16A adds final render/export execution.
- Milestone 16B adds full E2E production workflow validation.
- Milestone 17 hardens production beta operations.
- Phase 18 starts the activation baseline audit and real video testing roadmap. It is not an automatic launch.
- Phase 19 adds the local baseline command/report and command-plan view before any container build work.
- Phase 20 prepares human-run production container builds with static image plans, command text, build log parsing, and Phase 21 blocker reporting.
- Phase 21 adds container readiness validation reporting before GCP staging foundation setup. It parses human-run readiness logs and keeps Docker, GCP, providers, model downloads, real media, production-ready, and external beta blocked.
- Phase 22 prepares the GCP staging foundation with staging config, resource maps, IAM/bucket/secret plans, and text-only command plans. It does not run `gcloud`, create resources, deploy, push images, or unblock beta.
- Phases 19-37 move step-by-step through local baseline, human-run container build/readiness, staging setup, generated-fixture staging tests, model/license approval, controlled private real video tests, internal beta readiness, and external beta go/no-go.
- Real video testing begins only after staging, readiness, storage, and model/license prerequisites pass.

## Milestone 15D Real Enhancement Slowmotion Execution

Milestone 15D adds server-only enhancement and slow-motion execution scaffolds: sample-first Real-ESRGAN planning, selected-clip FILM planning, FFmpeg fallback preview plans, OpenCV/Sharp skip-safe adapters, private enhancement/interpolation artifacts, and `enhancement_artifacts`, `slow_motion_artifacts`, and `render_asset_integrity` QA gates.

It remains bounded: no package install, model downloads, final render/export, providers, deployment, unapproved GPU jobs, audio/color/mask execution, source overwrite, raw-chat execution, or Revideo.

Activation Phase 34A adds a staging-only approval/reporting layer for this area:
`RealESRGAN_x4plus` is approved only for future sample-first enhancement
planning, while FILM and slow motion remain evaluated-only/blocked. Runtime,
model download, and controlled sample execution remain later phases.

## Milestone 16A Final Render Export Execution

Milestone 16A adds server-only final render/export execution scaffolds: normalized render execution manifests, private artifact resolution, Remotion/FFmpeg/libass command plans, private preview/final-export artifact records, and `render_asset_integrity`, `render_timeline_integrity`, `export_codec_format`, `export_duration_sync`, and `final_delivery` QA gates.

It remains bounded: no deployment, `gcloud`, providers, model downloads, unapproved GPU jobs, arbitrary media paths, source overwrite, signed URL source-of-truth, raw-chat execution, Revideo, or QA bypass.

## Milestone 16B Full E2E Production Workflow Tests

Milestone 16B adds a dry-run/static E2E workflow suite that validates approved payloads, idempotency, private artifact handoff, stage orchestration, QA summaries, fallback summaries, readiness blockers, and final-delivery rules across the M6 through M16A production runtime. Production-ready remains blocked until readiness/model/manual-review blockers are resolved.

## Milestone 17 Production Hardening And Beta Readiness

Milestone 17 adds static production hardening, observability templates, sanitized logging, cost controls, privacy/retention policies, security review reports, beta readiness scorecards, and incident runbooks. It does not deploy, call providers, build Docker images, download models, run GPU jobs, process real user media, or mark production readiness passed.

The next work is not automatic launch. It is a human-run approval phase for container builds, staging deployment, tool readiness, model/license review, security, cost, storage, and legal review.

## Phase 18-37 Activation Roadmap

The activation roadmap lives in `docs/activation-phase-roadmap.md`. It begins with Phase 18 baseline audit and proceeds through Phase 37 external beta go/no-go. Production-ready, external beta, real user media testing, and paid production remain blocked unless those later human-run gates explicitly pass.

## Milestone 1 Contracts And Schema Foundation

Milestone 1 adds the shared TypeScript and draft SQL contract layer for the future tool recipe system:

- media analysis reports;
- tool recipes and execution plans;
- tool run results and private artifacts;
- quality gate results and fallback decisions;
- timeline and render manifests;
- model weight manifests and license review records.

Activation Phase 26 adds the first model-weight/license approval workflow:
`Systran/faster-whisper-tiny` is staging-approved only for speech/caption
planning, while actual model download, production approval, external beta,
larger Whisper models, non-speech models, providers, and Revideo remain blocked.

Activation Phase 33A adds the first mask model-weight/license approval workflow:
`ZhengPeng7/BiRefNet` is staging-approved only for representative-frame
single-frame background-removal planning, while SAM2 execution, model downloads,
GPU runtime, text-behind-subject, production, external beta, and broad real media
remain blocked.

Activation Phase 33D adds controlled staging evidence for one real-video
representative-frame BiRefNet mask only. It does not approve a full-video mask
runtime, SAM2 tracking, text-behind-subject execution, public delivery,
production, external beta, or broad real media.

Activation Phase 33E adds controlled staging evidence for one private
text-behind-subject frame preview only. It does not approve full-video
text-behind-subject, public delivery, production, external beta, broad real
media, GPU execution, providers, model downloads, or Revideo.

The contracts remain mock-safe and schema-review-only. They do not install tools, process media, call providers, deploy resources, or let the frontend run heavy media/AI work.

## Milestone 2 Production Tool Registry Metadata

Milestone 2 adds a server-only production registry under `server/tool-registry` for planned tool profiles, worker ownership, runtime eligibility, QA gate responsibilities, fallback chains, license review status, and separate model-weight policy.

This registry prepares future recipe execution, but it still does not install packages, process media, call providers, deploy resources, add GPU runtime, or create executable worker paths. Frontend planning IDs remain separate from backend-heavy production profiles.

## Milestone 3 Google Cloud Foundation Scripts

Milestone 3 adds safe Google Cloud foundation docs, non-secret config metadata, `.env` examples, guarded shell templates, and smoke validation for future Cloud Run, Artifact Registry, private GCS buckets, Secret Manager placeholders, service accounts, IAM, and GPU worker setup.

The scripts are human-run templates only. Codex does not run `gcloud`, create resources, deploy services/jobs, build images, upload secret values, process media, call providers, or activate GPU runtime in this milestone.

## Milestone 4 Worker Runtime Orchestration

Milestone 4 adds production-safe worker orchestration modules for payload validation, approved snapshot gates, stable idempotency, mock-safe leases, sanitized events, retry policy, placeholder routing, and result shaping.

This is still not real tool execution. No FFmpeg, OpenCV, AI model, provider, media processing, deployment, `gcloud`, GPU runtime, or frontend heavy-tool path is added.

## Milestone 5 Container Images And Tool Readiness

Milestone 5 adds production Dockerfile templates, human-run Docker build/push command templates, server-only readiness specs, model-weight readiness metadata, and a dry-run readiness runner.

This is still definition-only. Codex does not build or push images, run Docker, run `gcloud`, process media, execute FFmpeg/OpenCV/AI tools, download model weights, call providers, deploy jobs, add GPU runtime execution, or change frontend runtime behavior.

## Milestone 6 Media Analysis Foundation

Milestone 6 starts the first CPU media foundation with local/dev FFprobe probing, FFmpeg proxy creation, audio extraction, bounded frame extraction, private artifact records, and partial `MediaAnalysisReport` assembly.

This is not a full analysis/edit pipeline. It does not run transcript, smart cut, audio cleanup, color grading, OCR, masks, enhancement, final render, providers, GPU AI tools, Revideo, deployment, or cloud execution. Local real media execution is limited to generated smoke fixtures or explicit local/dev inputs that pass path and storage policy.

## Milestone 7 Speech And Caption Foundation

Milestone 7 adds controlled speech/caption foundations: faster-whisper command planning and local-dev skip behavior, transcript JSON, word timestamp JSON, caption segment JSON, SRT/WebVTT/ASS builders, and caption QA gates for readability, timing, safe zones, and transcript alignment.

This milestone prepares captions for future preview/render workers, but it does not download models, run production GPU jobs, call providers, run smart cuts, perform audio cleanup, burn captions into final media, deploy infrastructure, or use Revideo.

## Milestone 8 Smart Cut And Timeline Foundation

Milestone 8 creates evidence-based smart cut and timeline intelligence from structured media/transcript/caption artifacts. It produces deterministic segment candidates, scores, keep/remove/protect decisions, meaning warnings, cut QA gates, Reeditpro timeline manifests, OpenTimelineIO-style metadata, Hyperframe bridge metadata, Remotion composition metadata, and private timeline artifacts.

This milestone still does not cut real user media, run FFmpeg edits, import OpenTimelineIO/Hyperframe/Remotion runtime packages, render, export, call providers, deploy infrastructure, or use Revideo.

## Milestone 9 Audio Sound Foundation

Milestone 9 creates audio analysis, voice cleanup, loudness, music ducking, SFX density, and SoundSync cue foundations from extracted audio, media analysis, speech/caption timing, and smart cut/timeline metadata.

This milestone does not download model weights, call providers, run production GPU jobs, final mux/export, generate SFX/music, deploy infrastructure, or use Revideo. Model/audio tools are skip-first scaffolds unless already installed and explicitly enabled in local-dev mode.

## Milestone 10 Core CPU And Render Tool Install Foundation

Milestone 10 upgrades CPU, render, QA, and tool-readiness container definitions with core non-GPU install declarations and safe readiness checks for FFmpeg, ffprobe, Python media packages, OpenTimelineIO, libass, and Node render/image package metadata.

This milestone does not build Docker images, install host packages, run `gcloud`, deploy, download models, run GPU tools, process real user media, final render/export, call providers, or use Revideo. FFmpeg commercial LGPL-safe verification remains pending manual review.

## Milestone 11 GPU AI Install Foundation

Milestone 11 upgrades the GPU worker image declaration with CUDA/Python/Node package foundations, GPU Python requirements, empty model-weight placeholder directories, model-weight manifest templates, and dry-run GPU readiness checks.

This milestone does not build GPU images, run GPU jobs, load model weights, download weights, run inference, process media, call providers, deploy, run `gcloud`, add secrets, final render/export, or use Revideo. Milestone 12 validates full container/tool readiness, and Milestone 13 starts real speech/caption execution after model-weight and worker gates.

## Milestone 15A Real Audio Execution

Milestone 15A turns audio planning into controlled execution metadata and local-dev FFmpeg loudness/normalization. It builds audio execution plans, allowlisted FFmpeg command plans, skip-safe DeepFilterNet/RNNoise/Demucs scaffolds, music-ducking metadata, SoundSync artifacts, and audio QA gates.

It does not final mux/export, run providers, deploy, download models, run GPU production jobs, overwrite source audio, execute color/masks, or use Revideo. Milestone 15B covers real color execution, Milestone 15C covers mask/background/text-behind-subject execution, Milestone 16A covers final render/export execution, Milestone 16B covers full E2E production workflow validation, and Milestone 17 covers production hardening/beta readiness.

## Milestone 15B Real Color Execution

Milestone 15B turns color planning into controlled execution metadata and optional local-dev FFmpeg preview. It builds color analysis summaries, clean-first correction plans, shot-match plans, look/LUT transform plans, allowlisted FFmpeg command plans, skip-safe OpenColorIO/OpenImageIO adapter plans, private color artifacts, and color QA gates.

It does not final export, full render, call providers, deploy, download models, run GPU production jobs, overwrite source/proxy media, execute masks/background removal, run enhancement/upscaling, or use Revideo. Milestone 15C covers real mask/background/text-behind-subject execution, Milestone 16A covers final render/export execution, Milestone 16B covers full E2E production workflow validation, and Milestone 17 covers production hardening/beta readiness.

## Milestone 15C Real Mask Background Execution

Milestone 15C turns mask/background/text-behind-subject planning into controlled execution metadata. It builds mask task plans, skip-safe BiRefNet/SAM2/transparent-background/rembg/OpenCV/Kornia command plans, fallback decisions, private mask artifacts, depth composition manifests, and mask QA gates.

It does not final render/export, call providers, deploy, download models, run GPU production jobs, overwrite source/proxy media, run enhancement/upscaling, or use Revideo. Milestone 15D covers enhancement/slow-motion execution, Milestone 16A covers final render/export execution, Milestone 16B covers full E2E production workflow validation, and Milestone 17 covers production hardening/beta readiness.

## Documentation Map

- `production-milestone-index.md`: ordered milestones and acceptance gates.
- `production-worker-architecture.md`: worker groups, tool assignments, and execution boundaries.
- `production-gcp-runtime-plan.md`: Cloud Run, Cloud Run Jobs, storage, secrets, service accounts, IAM, and GPU plan.
- `production-tool-install-matrix.md`: planned tool status, review state, worker ownership, QA, fallbacks, and risks.
- `production-recipe-qa-policy.md`: universal recipe lifecycle and recipe families.
- `production-render-stack-decision.md`: core render stack roles and Revideo evaluation-only policy.
- `production-container-image-plan.md`: API/CPU/GPU/render/QA/readiness image separation and template boundaries.
- `production-tool-readiness-plan.md`: readiness spec model and dry-run-only behavior.
- `production-model-weight-readiness-plan.md`: separate model/checkpoint license review and production-block policy.
- `production-worker-image-build-runbook.md`: human-run image naming, build, readiness, push, and later deployment order.
- `production-media-analysis-foundation.md`: Milestone 6 probe/proxy/audio/frame/report flow and exclusions.
- `production-media-artifact-policy.md`: source immutability, private artifacts, and no signed URL persistence.
- `production-ffmpeg-ffprobe-policy.md`: allowlisted FFmpeg/FFprobe use and LGPL-safe policy.
- `production-media-analysis-runbook.md`: dry-run/local-dev/production-blocked usage and smoke behavior.
- `production-speech-caption-foundation.md`: Milestone 7 transcript, word timestamp, caption segment, caption file, and caption QA flow.
- `production-faster-whisper-policy.md`: worker-only faster-whisper boundaries and model-weight approval requirements.
- `production-transcript-artifact-policy.md`: private transcript and word timestamp artifact policy.
- `production-caption-artifact-policy.md`: private SRT/WebVTT/ASS/caption segment artifact policy.
- `production-caption-qa-policy.md`: caption readability, timing, safe-zone, and transcript alignment gates.
- `production-speech-caption-runbook.md`: dry-run/local-dev/production-blocked smoke behavior and no model download policy.
- `production-smart-cut-foundation.md`: Milestone 8 smart cut plan, evidence, and QA boundaries.
- `production-timeline-foundation.md`: Reeditpro timeline, OTIO-style, Hyperframe bridge, and Remotion manifest metadata.
- `production-cut-qa-policy.md`: cut smoothness, transcript alignment, protected segment, and no mid-word cut gates.
- `production-meaning-preservation-policy.md`: context, emotion, story meaning, and review warnings.
- `production-opentimelineio-policy.md`: OTIO-compatible metadata without package install.
- `production-smart-cut-runbook.md`: dry-run/local-dev/production-blocked smart cut/timeline validation.
- `production-audio-sound-foundation.md`: Milestone 9 audio analysis, cleanup, loudness, music ducking, SoundSync, artifacts, and QA flow.
- `production-audio-cleanup-policy.md`: gentle-first voice cleanup and naturalness policy.
- `production-deepfilternet-rnnoise-policy.md`: DeepFilterNet/RNNoise worker-only and no-download policy.
- `production-demucs-policy.md`: justified stem separation only, not default cleanup.
- `production-loudness-music-ducking-policy.md`: loudness targets and voice-first music ducking.
- `production-soundsync-foundation-policy.md`: SoundSync cue planning without beat/SFX/provider claims.
- `production-audio-artifact-policy.md`: private audio artifacts and source immutability.
- `production-audio-qa-policy.md`: audio loudness/sync/naturalness/music-over-voice gates.
- `production-audio-sound-runbook.md`: dry-run/local-dev/production-blocked audio validation.
- `production-core-tool-install-plan.md`: Milestone 10 core CPU/render install declaration boundary.
- `production-cpu-worker-tool-install-policy.md`: CPU worker package purpose and exclusions.
- `production-render-worker-tool-install-policy.md`: Remotion, FFmpeg, libass, Sharp, OTIO render install policy.
- `production-ffmpeg-lgpl-build-policy.md`: production FFmpeg LGPL-safe verification gate.
- `production-core-tool-readiness-policy.md`: dry-run versus CPU/render real check readiness behavior.
- `production-core-tool-install-runbook.md`: human-run build/readiness/review order.
- `production-gpu-ai-install-plan.md`: Milestone 11 GPU worker package declaration boundary.
- `production-gpu-worker-tool-install-policy.md`: GPU package purposes and worker-only placement.
- `production-gpu-model-weight-policy.md`: model/checkpoint license blockers and manifest requirements.
- `production-gpu-tool-readiness-policy.md`: GPU dry-run readiness and optional import-check boundaries.
- `production-faster-whisper-gpu-policy.md`: faster-whisper/CTranslate2 transcription readiness.
- `production-birefnet-sam2-policy.md`: segmentation/mask model package and checkpoint review policy.
- `production-gpu-audio-ai-policy.md`: DeepFilterNet/Demucs no-execution policy.
- `production-enhancement-gpu-policy.md`: Real-ESRGAN/FILM no-execution policy.
- `production-gpu-worker-build-runbook.md`: human-run GPU build/readiness/review order.

## Non-Goals For Milestone 0

- No package installation.
- No executable media/tool pipeline.
- No provider integration.
- No rendering or export implementation.
- No Google Cloud deployment.
- No secret creation or secret reads.
- No new frontend runtime behavior.
- No database migration.
- No worker queue mutation.
## Adjusted Production Runtime Roadmap

- Milestone 12: full container/tool readiness validation with static/dry-run reports and command plans.
- Milestone 13: real speech/caption execution.
- Milestone 14: real smart cut/media timeline execution.
- Milestone 15: split real audio/color/mask/enhancement execution.
- Milestone 16A: final render/export execution.
- Milestone 16B: full E2E production workflow validation.
- Milestone 17: production hardening and beta readiness.
- Phase 18 optional/human-run: build containers and run container readiness.
- Phase 19 optional/human-run: deploy staging Cloud Run services/jobs.
- Phase 20 optional/human-run: approve model weights/licenses and run limited staging media tests.
## Milestone 13 Execution

Milestone 13 starts real speech/caption execution: faster-whisper may run only in explicit local-dev/container-approved paths with existing models and no downloads, while production remains gated by model-weight and readiness blockers.
## Milestone 14 Execution

Milestone 14 starts real smart cut/media timeline execution planning: approved `SmartCutPlan` inputs become validated cut execution plans, preview-only FFmpeg command plans, timeline manifests, OTIO-style metadata, and QA gates. It does not final export, full render, deploy, call providers, run GPU tools, overwrite source media, or execute raw chat.
