# Production Milestone Index

## Purpose

This index locks the order of ReeditPro production runtime milestones. Milestone 0 is documentation-only and establishes the architecture boundary before any production worker, tool, provider, render, or deployment work begins.

Current implementation item: Phase 18, activation baseline audit and real video testing roadmap. Milestone 17 completed static hardening policies, observability templates, sanitized logging, cost controls, privacy/retention policy, security review, beta scorecards, runbooks, and smoke validation. Phase 18 starts activation planning only; it is not automatic production launch.

Foundation/Supabase staging schema deploy after approved target reference is a schema-only activation follow-up. It can resolve staging schema/RLS readiness for the future Track B milestone backfill, but it does not write Track B milestone rows, mutate production, deploy unrelated migrations, run providers, execute tools/workers/routes, process media, unlock beta/production, or touch Track A.

Core rules for every milestone:

- Workers execute approved plan snapshots, not raw chat.
- Frontend code never runs heavy media, AI, render, provider, or privileged service-role work.
- Tool execution is implemented as approved, QA-gated recipe pipelines, not simple wrappers.
- Revideo is evaluation-only and not part of the core stack.
- The core production render stack is Hyperframe, Remotion, FFmpeg, libass, and OpenTimelineIO.

## Milestones

| # | Milestone | Goal | Main files/modules expected later | Acceptance gates | Must not be done in that milestone |
| --- | --- | --- | --- | --- | --- |
| 0 | Architecture lock | Freeze production runtime boundaries, worker groups, GCP shape, tool matrix, recipe QA lifecycle, and render stack decision. | `docs/production-*.md`, small cross-references in existing architecture docs. | Required docs exist, are internally consistent, list Milestones 1-17, keep Revideo non-core, and preserve approved snapshot execution. | No package installs, deployments, media processing, provider calls, secrets, frontend behavior changes, worker execution, or raw chat execution path. |
| 1 | Production contracts/schema | Define durable contracts for approved snapshots, tool recipes, job payloads, asset manifests, QA results, render plans, and audit records. | `src/types/*`, `src/backend/contracts/*`, `server/validation/*`, `supabase/migrations/*`, migration draft docs. | Contracts validate approved snapshot IDs, credit gates, idempotency keys, storage references, recipe inputs/outputs, and QA statuses. | Do not call tools/providers, mutate production data without reviewed migrations, deploy infrastructure, or let frontend claim worker authority. |
| 2 | Production tool registry expansion | Expand the tool registry from planning labels into production recipe capabilities, settings, fallback rules, license notes, and worker eligibility. | `server/tool-registry/*`, `server/smoke/production-tool-registry-smoke.ts`, `docs/production-tool-install-matrix.md`, frontend planning-registry boundary notes. | Every production tool has owner worker type, launch phase, QA obligations, fallback path, and review status; smoke validation blocks evaluation-only/non-commercial/unknown model-weight paths. | Do not install tools, execute tools, add GPU runtime, bypass license/model-weight review, or expose worker-only tools to browser execution. |
| 3 | Google Cloud foundation/scripts | Add reviewed scripts and configuration templates for project resources, Artifact Registry, private buckets, service accounts, IAM, and Secret Manager references. | `scripts/gcp/prod/*`, `docs/google-cloud/production-*.md`, `server/config/gcp-production-config.ts`, `server/smoke/gcp-foundation-config-smoke.ts`. | Scripts are explicit, reviewable, idempotency-aware, region-aware, guarded by `REEDITPRO_CONFIRM_PROD_SETUP=true`, and smoke-validated without calling Google Cloud. | Do not deploy, create real secret values, run `gcloud` from Codex, run providers, process media, install packages, add GPU runtime, or grant owner/editor roles. |
| 4 | Worker runtime/orchestration | Implement backend-owned job dispatch, worker leases, dependency checks, idempotency, event logging, retries, stale recovery, and approved snapshot loading. | `server/workers/production/*`, `server/smoke/production-worker-orchestration-smoke.ts`, `database/migration-drafts/010_production_worker_runtime_orchestration.draft.sql`, worker policy docs. | Workers cannot start without approved snapshot, idempotency key, policy gates, sanitized payloads, and mock-safe lease ownership; placeholder routing proves no real tool execution. | Do not add real media/tool/provider execution, process media, deploy, run `gcloud`, add GPU runtime, run jobs from raw chat, or allow frontend to claim leases. |
| 5 | Container images/tool readiness | Define CPU/GPU/render/QA/tool-readiness container templates and dry-run readiness specs for launch and planned tools. | `docker/prod/*`, `scripts/docker/prod/*`, `server/workers/production-readiness/*`, `server/smoke/production-container-tool-readiness-smoke.ts`, container/readiness docs. | Dockerfile templates and build scripts are safe, every registry tool has a readiness spec, dry-run readiness reports missing/future/evaluation/model-weight status without executing tools, and Revideo remains production-blocked. | Do not build or push images, run Docker, run media tools, download model weights, call providers, deploy, run `gcloud`, include secrets in images, or treat availability as license approval. |
| 6 | Media probe/proxy/analysis | Implement CPU-safe FFprobe metadata probing, FFmpeg proxy/audio/frame extraction, private artifact records, and partial media analysis reports. | `server/workers/media/*`, `server/smoke/production-media-analysis-foundation-smoke.ts`, `database/migration-drafts/011_media_analysis_foundation_artifacts.draft.sql`, media policy docs. | Dry-run works without binaries; local-dev fixture skips gracefully when FFmpeg/FFprobe are unavailable and processes only generated temp media when available; outputs use private storage refs and partial `MediaAnalysisReport`. | Do not make creative edit decisions, run transcript/smart-cut/audio-cleanup/color/OCR/mask/enhancement/final render pipelines, run GPU AI tools, deploy, call providers, use Revideo, overwrite source media, or persist signed URLs. |
| 7 | Speech/captions/transcript intelligence | Add speech/transcript/caption foundations: controlled faster-whisper adapter, transcript and word timestamp artifacts, caption segmentation, SRT/WebVTT/ASS builders, and caption QA records. | `server/workers/speech/*`, `server/workers/captions/*`, `server/smoke/production-speech-caption-foundation-smoke.ts`, `database/migration-drafts/012_speech_caption_foundation_artifacts.draft.sql`, speech/caption policy docs. | Dry-run works without faster-whisper, models, FFmpeg, or libass; local-dev skips gracefully when tools/models are unavailable; caption QA covers readability, timing, safe-zone, and transcript alignment; production execution remains blocked. | Do not download models, run production GPU jobs, call providers, run final render/export, do smart cuts, perform audio cleanup, persist signed URLs, expose speech/caption tools to frontend, or use Revideo. |
| 8 | Smart cut/timeline intelligence | Convert media/transcript/caption evidence into deterministic smart cut decisions, timeline manifests, OTIO-style metadata, and timeline QA. | `server/workers/smart-cut/*`, `server/workers/timeline/*`, `server/smoke/production-smart-cut-timeline-smoke.ts`, `database/migration-drafts/013_smart_cut_timeline_foundation.draft.sql`, smart cut/timeline policy docs. | Segment scoring is deterministic, mid-word cuts are blocked, repeated-take planning keeps one version, meaning warnings exist, timeline/OTIO/Hyperframe/Remotion metadata builds without runtime packages, and dry-run works without media cutting/rendering. | Do not install packages, run GPU tools, process/cut real user media, overwrite source media, call providers, deploy, render/export, use signed URLs as source of truth, execute raw chat, or use Revideo. |
| 9 | Audio cleanup/sound pipeline | Add audio analysis, cleanup planning, loudness normalization, music ducking, SFX density, SoundSync cues, private artifacts, and audio QA gate foundations. | `server/workers/audio/*`, `server/smoke/production-audio-sound-foundation-smoke.ts`, `database/migration-drafts/014_audio_sound_foundation_artifacts.draft.sql`, audio policy docs. | Dry-run works without FFmpeg/audio AI tools; local-dev FFmpeg fixture skips or runs generated temp audio only; model tools skip unless already installed and explicitly enabled; audio QA emits loudness/sync/naturalness/music-over-voice gates. | Do not install packages, download model weights, call providers, deploy, run production GPU jobs, final mux/export, add random SFX, overwrite source audio, expose audio tools to frontend, or use Revideo. |
| 10 | Core CPU/render package installation | Upgrade CPU/render/QA/readiness image definitions and safe command/import readiness checks for non-GPU core tools. | `docker/prod/*`, requirements files, `server/workers/production-readiness/core-*`, `server/smoke/production-core-tool-install-smoke.ts`, install/readiness docs. | Core images declare FFmpeg/ffprobe, Python media packages, OpenTimelineIO, libass, Sharp/Remotion metadata checks; dry-run still works; real checks are CPU/render-only and informational. | Do not build images, install host packages, deploy, run `gcloud`, download models, run GPU tools, process user media, final export, or install Revideo. |
| 11 | GPU AI package installation | Add GPU image package declarations, model-weight manifest templates, and dry-run GPU readiness for future AI workers. | `docker/prod/gpu-worker/*`, `server/model-weights/*`, `server/workers/production-readiness/gpu-*`, `server/smoke/production-gpu-ai-install-smoke.ts`, GPU policy docs. | GPU tools remain worker-only, dry-run readiness avoids heavy imports, unknown/non-commercial/missing model weights block production, L4 remains first GPU target, and no model weights are downloaded by Codex. | Do not build images, run GPU jobs, download weights, use unapproved weights, deploy, run `gcloud`, process media, call providers, add secrets, or expose GPU tools to frontend. |
| 12 | Full container/tool readiness validation | Validate built image declarations, command/import checks, optional strict readiness, and tool installation summaries across worker roles. | readiness worker updates, stricter smoke/CI plans, image validation docs. | Readiness can distinguish passed, missing, optional, future, evaluation, license, and model-weight states. | Do not process media or treat tool availability as approval to execute recipes. |
| 13 | Real speech/caption execution | Enable approved speech transcription and caption file execution after model/tool readiness gates pass. | speech/caption workers, transcript artifacts, caption QA, model-weight approvals. | Transcripts, word timestamps, caption files, and QA gates are produced from approved snapshots only. | Do not download unapproved models, bypass model policy, or final render/export. |
| 14 | Real smart cut/media timeline execution | Execute approved media analysis, smart cut, and timeline manifest generation against worker artifacts. | media/smart-cut/timeline workers, OTIO adapters, cut QA. | No mid-word cuts, meaning warnings, timeline integrity, and private artifacts are enforced. | Do not render final video, overwrite source media, or cut from raw chat. |
| 15A | Real audio execution | Execute approved audio loudness, normalization, cleanup planning, music ducking metadata, SoundSync artifacts, and audio QA. | `server/workers/audio/*`, `server/workers/audio-execution/*`, `server/smoke/production-real-audio-execution-smoke.ts`, audio execution docs and SQL drafts. | Dry-run works without FFmpeg/audio AI tools; local-dev FFmpeg uses safe/generated local audio only; model tools are skip-safe/model-gated; audio QA can block future preview/final export. | Do not final mux/export, download models, run GPU production jobs, deploy, call providers, overwrite source audio, execute color/masks, or use Revideo. |
| 15B | Real color execution | Execute approved color correction/shot matching/color QA after readiness gates. | `server/workers/color/*`, `server/workers/color-execution/*`, `server/smoke/production-real-color-execution-smoke.ts`, color execution docs and SQL drafts. | Dry-run works without FFmpeg/OpenColorIO/OpenImageIO; local-dev FFmpeg preview uses safe/generated local media only; color QA can block preview/final export and preserve skin tones. | Do not run unreviewed LUT paths, final export, masks/background removal, enhancement, providers, deployment, or Revideo. |
| 15C | Real mask/background/text-behind-subject execution | Execute approved mask/background/depth/text-behind-subject plans after model/readiness gates. | `server/workers/masks/*`, `server/workers/text-behind-subject/*`, `server/workers/mask-composition/*`, `server/smoke/production-real-mask-background-execution-smoke.ts`, mask execution docs and SQL drafts. | Dry-run works without BiRefNet/SAM2/OpenCV/Kornia/FFmpeg; local-dev model paths skip safely; mask QA blocks unsafe foreground/background composition; text-behind-subject downgrades weak masks. | Do not run unapproved model weights, download models, final render/export, run enhancement/upscaling, overwrite source media, deploy, call providers, or use Revideo. |
| 15D | Real enhancement/slow-motion execution | Execute approved enhancement and slow-motion plans after model/readiness gates. | enhancement/slow-motion workers, Real-ESRGAN/FILM model gates, enhancement QA. | Enhancement/slow-motion QA blocks artifacts and unsafe hallucination/warping risks. | Do not run unapproved model weights, bypass QA, overwrite source media, or final export without render gates. |
| 16A | Final render/export execution | Normalize approved timeline/render manifests, resolve private artifact refs, build allowlisted Remotion/FFmpeg/libass command plans, write private preview/final-export artifact records, and emit render/export/final-delivery QA. | `server/workers/render/*`, `server/workers/final-render/*`, `server/smoke/production-final-render-export-execution-smoke.ts`, final render/export docs and SQL drafts. | Dry-run works without FFmpeg/Remotion/libass; local-dev render/export skips safely unless explicitly enabled; final delivery waits for private final export and passing QA gates. | Do not deploy, run `gcloud`, call providers, use Revideo, process arbitrary media paths, overwrite source/proxy/final artifacts, render from raw chat, persist signed URLs as source of truth, or skip QA. |
| 16B | Full E2E production workflow tests | Validate the approved-snapshot workflow across media, speech/caption, smart cut, audio, color, masks, enhancement, render/export, QA, and delivery blockers. | E2E workflow tests, fixture manifests, orchestration validation, final readiness reports. | End-to-end mock-safe workflow proves required gates, artifacts, dependencies, idempotency, and final render blockers. | Do not deploy, call providers, process arbitrary user media, bypass credit/approval gates, or weaken worker-only execution boundaries. |
| 17 | Production hardening/beta readiness | Harden observability, rate limits, cost controls, retention, privacy, incident response, beta flags, and operational runbooks. | monitoring docs, runbooks, alerts, feature flags, retention jobs, security reviews. | Beta launch checklist passes security, privacy, QA, cost, reliability, rollback, and support readiness. | Do not launch broadly without kill switches, cost controls, privacy review, legal/tool review, and recovery playbooks. |

## Milestone 0 Acceptance Gates

- These architecture docs exist and agree with each other.
- No packages are installed.
- No deployment is run.
- No provider call is made.
- No media processing occurs.
- No secrets are added.
- No frontend heavy tool execution is introduced.
- No raw chat execution path is introduced.
- Revideo is clearly evaluation-only and not core.
- Milestones 1-17 are listed and sequenced.
## Milestone 12 - Current: Unified Container And Tool Readiness Validation

Milestone 12 unifies API, CPU, GPU, render, QA, and tool-readiness validation into a static/dry-run production readiness report. It adds command-plan generation and human-run container readiness examples without building images, pushing images, deploying, running `gcloud`, downloading model weights, running inference, processing media, or rendering exports.

Milestone 13 is real speech/caption execution after readiness blockers and model-weight policies are reviewed.
## Milestone 13 - Current: Real Speech And Caption Execution

Milestone 13 adds controlled faster-whisper speech execution, transcript and word timestamp artifacts, deterministic caption file generation, caption QA gates, and optional local-dev caption preview. It keeps model downloads, deployment, providers, final export, Revideo, smart cuts, audio cleanup, color, and masks out of scope.

Milestone 14 is real smart cut and media timeline execution.
## Milestone 14 - Current: Real Smart Cut And Timeline Execution

Milestone 14 adds controlled execution planning for smart cuts and timelines. It validates approved plans, blocks mid-word/protected/overlapping unsafe cuts, builds FFmpeg preview-only trim/concat command plans, creates updated timeline/OTIO metadata, and emits cut/timeline QA gates. Final export remains out of scope.

Milestone 15A is real audio execution. Milestone 15B is real color execution, and Milestone 15C covers real mask/background/text-behind-subject execution.

## Milestone 15A - Current: Real Audio Execution

Milestone 15A adds controlled audio execution planning and optional local-dev FFmpeg loudness/normalization. It creates private cleaned-audio, separated-stem placeholder, SoundSync metadata, and QA report artifacts, and emits `audio_loudness`, `audio_sync`, `audio_naturalness`, and `music_over_voice` gates. Final mux/export remains out of scope.

Milestone 15B is real color execution.

## Milestone 15B - Current: Real Color Execution

Milestone 15B adds controlled color analysis, correction, shot-match, look transform, FFmpeg preview command planning, skip-safe OpenColorIO/OpenImageIO scaffolding, private color artifacts, and `color_exposure`, `color_skin_tone`, `color_export_space`, and `color_shot_match` gates. Final export, full render, masks/background removal, enhancement/upscaling, providers, deployment, and Revideo remain out of scope.

Milestone 15C is real mask/background/text-behind-subject execution.

## Milestone 15C - Current: Real Mask Background Execution

Milestone 15C adds controlled mask/background/text-behind-subject planning and skip-safe execution scaffolds. It creates private `mask_image`, `mask_sequence`, `rgba_cutout`, `qa_report`, and metadata-only `render_manifest` artifacts, and emits `mask_edge_quality`, `mask_temporal_stability`, `mask_subject_coverage`, and `render_asset_integrity` gates. Final render/export, enhancement/upscaling, model downloads, providers, deployment, and Revideo remain out of scope.

Milestone 15D is real enhancement/slow-motion execution. Milestone 16A is final render/export execution, and Milestone 16B is full E2E production workflow validation.

## Milestone 15D - Current: Real Enhancement Slowmotion Execution

Milestone 15D adds controlled enhancement and slow-motion execution scaffolds. It creates sample-first `enhanced_video`/`representative_frame`, selected-clip `interpolated_video`, optional safe preview metadata, and `qa_report` artifacts, and emits `enhancement_artifacts`, `slow_motion_artifacts`, and `render_asset_integrity` gates. Final render/export, model downloads, providers, deployment, audio/color/mask execution, source overwrite, and Revideo remain out of scope.

Milestone 16A is final render/export execution, and Milestone 16B is full E2E production workflow validation.

## Milestone 16A: Final Render Export Execution

Milestone 16A adds controlled final render/export execution scaffolds. It creates normalized render execution manifests, allowlisted Remotion/FFmpeg/libass command plans, private `render_manifest`, optional `preview_video`, optional `final_export`, and `qa_report` artifacts, and emits render/export/final-delivery QA gates. Deployment, providers, model downloads, source overwrite, signed URL source-of-truth, Revideo, and QA bypass remain out of scope.

## Milestone 16B - Current: Full E2E Production Workflow Tests

Milestone 16B adds the full dry-run/static E2E workflow suite. It validates scenario definitions, approved payloads, idempotency, private artifact handoffs, cross-stage QA, fallback summaries, readiness blockers, and final-delivery rules across the M6 through M16A runtime. Production-ready remains blocked until readiness/model/manual-review gates pass.

Milestone 17 is production hardening and beta readiness.

## Milestone 17 - Current: Production Hardening And Beta Readiness

Milestone 17 adds static production hardening, observability, sanitized logging, cost controls, privacy/retention, security review, incident response, and beta readiness scorecards. It does not launch production, deploy, run `gcloud`, build Docker images, call providers, download model weights, run GPU jobs, process real user media, add secrets, or mark production readiness as passed.

After M17, the next phase is human-run build/deploy/readiness approval with explicit security, cost, model/license, legal, storage, and operational signoff.

## Phase 18 - Current: Activation Baseline Audit

Phase 18 starts the activation roadmap for human-run staging setup and controlled real video testing. It adds the activation audit, readiness state, next-phase runbook, and structured Phase 18-37 roadmap. It does not build images, run Docker, push images, run `gcloud`, deploy, call providers, download model weights, add secrets, process real media, unblock external beta, or mark production ready.

Phase 19 is the local full smoke/static readiness baseline. Later activation phases remain human-run and gated.
