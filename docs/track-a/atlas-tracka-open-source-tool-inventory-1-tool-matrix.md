# Atlas Track A Tool Matrix

All rows are docs/status inventory only. Status values are restricted to the task-approved vocabulary: `installed_with_source_evidence`, `installed_unverified`, `not_installed`, `planned_only`, `docs_only`, `blocked_owned_elsewhere`, `blocked_pending_runtime_lane`, `blocked_pending_license_review`, `blocked_pending_model_weight_review`, `blocked_pending_private_e2e`, `duplicate_risk_found`, `no_duplicate_found`, `implementation_present`, `implementation_partial`, and `implementation_missing`.

## remotion_render_validation

- scopedToolId: `remotion_render_validation`
- upstreamToolName: `Remotion`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `PR #544 merged scoped owner; historical #75 Remotion validation and old Track A review docs are source evidence, not duplicate current ownership`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json and package-lock.json contain no Remotion package dependency; server/config/env.ts only defaults REMOTION_BIN to npx remotion`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `src/backend/render/remotion-worker/* mock worker skeleton and docs/track-a visual review evidence`
- runtimeLane: `cpu_render_worker`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`, `libass`
- owningSharedDependencyLane: `Track B owns FFmpeg/FFprobe; Atlas Track A owns only scoped Remotion validation responsibility`
- nextRequiredMilestone: `TRACKA-REMOTION-RENDER-VALIDATION-1`
- blockedReason: `Remotion package install/runtime proof not present in current source`
- notes: `No Remotion execution occurred in this inventory phase.`

## opentimelineio_timeline_validation

- scopedToolId: `opentimelineio_timeline_validation`
- upstreamToolName: `OpenTimelineIO`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `PR #544 merged scoped owner; historical #77 OpenTimelineIO validation is evidence only`
- currentInstallStatus: `installed_with_source_evidence`
- installEvidencePath: `docker/prod/render-worker/requirements.render.txt and docker/prod/tool-readiness-worker/requirements.readiness.txt list opentimelineio`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docs/track-a/track-a-missing-visual-evidence-2-capability-review-results.md and docs/track-a/track-a-visual-review-2c-capability-review-results.md`
- runtimeLane: `cpu_render_worker`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B owns FFmpeg/FFprobe; Atlas Track A may consume only handoff evidence`
- nextRequiredMilestone: `TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`
- blockedReason: `Installed source declaration exists, but no current install proof was executed in this phase`
- notes: `Render-worker requirements describe OpenTimelineIO handoff support only.`

## hyperframe_render_handoff

- scopedToolId: `hyperframe_render_handoff`
- upstreamToolName: `Hyperframe`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open PR claims Atlas Track A Hyperframe ownership beyond #544 scoped handoff`
- currentInstallStatus: `planned_only`
- installEvidencePath: `server/config/gcp-production-config.ts references hyperframe_preview as config metadata only`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docker/prod/render-worker/Dockerfile documents Hyperframe metadata handoff boundary`
- runtimeLane: `planning_only`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `remotion_render_validation`
- owningSharedDependencyLane: `Atlas Track A scoped handoff only`
- nextRequiredMilestone: `TRACKA-REMOTION-RENDER-VALIDATION-1`
- blockedReason: `Handoff metadata exists, but no install/runtime proof is present`
- notes: `Hyperframe is treated as handoff metadata, not an executed tool in this phase.`

## libass_caption_burnin

- scopedToolId: `libass_caption_burnin`
- upstreamToolName: `libass`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `PR #544 scoped claim plus prior Track A caption chain; no competing exact Track A libass owner found`
- currentInstallStatus: `installed_with_source_evidence`
- installEvidencePath: `docker/prod/render-worker/Dockerfile lists libass9 and libass-dev; docker/prod/tool-readiness-worker/Dockerfile lists libass9`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docs/track-a/track-a-caption-quality-3r2-runtime-path-1.md and docs/internal-beta/track-a-restricted-beta-included-capabilities.md`
- runtimeLane: `cpu_render_worker`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B owns FFmpeg/FFprobe; Atlas Track A owns scoped caption burn-in responsibility`
- nextRequiredMilestone: `TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`
- blockedReason: `Install source declaration exists, but current install/runtime proof was not executed in this phase`
- notes: `Caption burn-in evidence remains private/restricted and does not unlock beta.`

## gstreamer_render_pipeline_support

- scopedToolId: `gstreamer_render_pipeline_support`
- upstreamToolName: `GStreamer`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for Atlas Track A GStreamer scoped label`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json, package-lock.json, docker/prod/render-worker, and docker/prod/tool-readiness-worker show no GStreamer install`
- currentImplementationStatus: `implementation_missing`
- implementationEvidencePath: `no Track A GStreamer implementation found`
- runtimeLane: `cpu_native_container_worker`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B media OSS lane for shared media dependencies`
- nextRequiredMilestone: `TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`
- blockedReason: `No install declaration or runtime lane proof`
- notes: `Must stay behind future native container worker proof.`

## bento4_mp4box_packaging_validation

- scopedToolId: `bento4_mp4box_packaging_validation`
- upstreamToolName: `Bento4 / MP4Box`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for Atlas Track A Bento4/MP4Box scoped label`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json, package-lock.json, and Dockerfiles show no Bento4 or MP4Box install`
- currentImplementationStatus: `implementation_missing`
- implementationEvidencePath: `no Track A Bento4/MP4Box implementation found`
- runtimeLane: `cpu_native_container_worker`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B media OSS lane for shared media dependencies`
- nextRequiredMilestone: `TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`
- blockedReason: `No install declaration or packaging proof`
- notes: `Packaging validation must not duplicate Track B media ownership.`

## mkvtoolnix_container_validation

- scopedToolId: `mkvtoolnix_container_validation`
- upstreamToolName: `MKVToolNix`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for Atlas Track A MKVToolNix scoped label`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json, package-lock.json, and Dockerfiles show no mkvtoolnix or mkvmerge install`
- currentImplementationStatus: `implementation_missing`
- implementationEvidencePath: `no Track A MKVToolNix implementation found`
- runtimeLane: `cpu_native_container_worker`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B media OSS lane for shared media dependencies`
- nextRequiredMilestone: `TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`
- blockedReason: `No install declaration or container validation proof`
- notes: `Future proof must remain container validation only.`

## vapoursynth_frame_pipeline

- scopedToolId: `vapoursynth_frame_pipeline`
- upstreamToolName: `VapourSynth`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for Atlas Track A VapourSynth scoped label`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json, package-lock.json, and Dockerfiles show no VapourSynth or vspipe install`
- currentImplementationStatus: `implementation_missing`
- implementationEvidencePath: `src/types/reeditpro.ts references vapoursynth as planning vocabulary only`
- runtimeLane: `cpu_native_container_worker`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Track B media OSS lane for shared media dependencies`
- nextRequiredMilestone: `TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`
- blockedReason: `No native frame pipeline install/runtime proof`
- notes: `Requires future native frame pipeline scope and install proof.`

## revideo_render_preview_alternative

- scopedToolId: `revideo_render_preview_alternative`
- upstreamToolName: `Revideo`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for Atlas Track A Revideo scoped label`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json and package-lock.json show no Revideo dependency; server config records Revideo as non-deployed`
- currentImplementationStatus: `implementation_missing`
- implementationEvidencePath: `server/activation/container-build/* records Revideo as forbidden or non-core`
- runtimeLane: `cpu_render_worker`
- firstBetaScopeStatus: `blocked_pending_runtime_lane`
- productionStatus: `blocked`
- sharedDependencies: `remotion_render_validation`
- owningSharedDependencyLane: `Atlas Track A scoped render alternative decision only`
- nextRequiredMilestone: `TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`
- blockedReason: `Revideo remains excluded/non-deployed and no install proof exists`
- notes: `Future Revideo work must be explicit scope decision, not accidental install.`

## film_frame_interpolation

- scopedToolId: `film_frame_interpolation`
- upstreamToolName: `FILM frame interpolation`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `No open owner PR found for current Atlas Track A FILM scoped label; older FILM evidence remains sample/evaluated-only`
- currentInstallStatus: `not_installed`
- installEvidencePath: `package.json, package-lock.json, and Dockerfiles show no FILM install or weights`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `server/model-weights/model-weight-manifest-templates.ts and docs/track-a/track-a-visual-review-2c-capability-review-results.md record evaluated/sample evidence`
- runtimeLane: `gpu_vision_worker`
- firstBetaScopeStatus: `blocked_pending_model_weight_review`
- productionStatus: `blocked`
- sharedDependencies: `gpu_vision_worker`, `model_weight_review`
- owningSharedDependencyLane: `AI Graphics/Worker owns adjacent model tooling; Atlas Track A owns only scoped FILM decision label`
- nextRequiredMilestone: `TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1`
- blockedReason: `Model/license/weight/runtime review required before install`
- notes: `No FILM download, model access, or interpolation execution occurred.`

## tracka_caption_burnin_policy_e2e

- scopedToolId: `tracka_caption_burnin_policy_e2e`
- upstreamToolName: `Track A caption burn-in policy E2E`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `Track A caption chain is source evidence, not duplicate ownership`
- currentInstallStatus: `docs_only`
- installEvidencePath: `no standalone install; depends on scoped libass and shared FFmpeg/FFprobe evidence`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docs/internal-beta/track-a-restricted-beta-included-capabilities.md and docs/track-a/track-a-private-e2e-revalidation-1-scope-contract.md`
- runtimeLane: `e2e_workflow`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `libass_caption_burnin`, `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Atlas Track A scoped caption policy plus Track B media dependencies`
- nextRequiredMilestone: `TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`
- blockedReason: `Private E2E and current install proof remain pending`
- notes: `Caption policy remains restricted/private and does not unlock beta.`

## tracka_render_export_private_review_path

- scopedToolId: `tracka_render_export_private_review_path`
- upstreamToolName: `Track A private render/export review path`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `#497/#502/#544 establish scoped private planning path; no duplicate exact owner found`
- currentInstallStatus: `docs_only`
- installEvidencePath: `no standalone install; consumes render/caption/shared dependencies`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docs/track-a/track-a-private-e2e-revalidation-1-planning.md and docs/internal-beta/track-a-restricted-beta-included-capabilities.md`
- runtimeLane: `e2e_workflow`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `remotion_render_validation`, `libass_caption_burnin`, `opentimelineio_timeline_validation`, `ffmpeg`, `ffprobe`
- owningSharedDependencyLane: `Atlas Track A scoped workflow plus Track B media dependencies`
- nextRequiredMilestone: `TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1`
- blockedReason: `Worker/Supabase gates and guarded private E2E remain incomplete`
- notes: `Private review path is not final delivery/export.`

## tracka_visual_video_private_e2e

- scopedToolId: `tracka_visual_video_private_e2e`
- upstreamToolName: `Track A visual video private E2E`
- ownerId: `owner_tracka_visual_render_export`
- ownerWorkstream: `TRACK_A_VISUAL_RENDER_EXPORT`
- currentOwnershipStatus: `ownership_claim_scoped_pending_merge_order`
- duplicateStatus: `no_duplicate_found`
- duplicateEvidence: `Older visual review PRs are evidence packets; #544 owns only current scoped Track A responsibility`
- currentInstallStatus: `docs_only`
- installEvidencePath: `no standalone install; private E2E depends on gated worker, route, Supabase, and tool proofs`
- currentImplementationStatus: `implementation_partial`
- implementationEvidencePath: `docs/track-a/track-a-private-e2e-revalidation-1-worker-tool-route-handoff.md and docs/tool-routes/tool-route-tracka-private-e2e-gate-2.md`
- runtimeLane: `e2e_workflow`
- firstBetaScopeStatus: `blocked_pending_private_e2e`
- productionStatus: `blocked`
- sharedDependencies: `Worker Runtime Gate 2`, `Supabase Worker Runtime RPC readiness`, `Tool Route Gate 2`, `core render/caption install proof`
- owningSharedDependencyLane: `Worker Runtime, Supabase, Tool Route, Track B media dependencies`
- nextRequiredMilestone: `TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1`
- blockedReason: `Worker/Supabase gates and guarded execution packet remain blocked`
- notes: `No private E2E execution occurred in this inventory phase.`
