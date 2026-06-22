# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 Identity Reviews

Batch-2 records package identity and policy review status for native/container render tools that were not installed by #601. After #624, the package identity decisions are resolved source-of-truth inputs for future install-proof planning, while Batch-2 remains blocked pending native/container Docker build confirmation.

## Hyperframe

Scoped tool: `hyperframe_render_handoff`

Status: `handoff_only_no_install_source_change`

Review result: `no_install_target_unless_future_source_evidence_proves_one`

Hyperframe remains a Track A handoff/planning label. Batch-2 does not identify a real install target and does not add package, Dockerfile, runtime, or worker changes for Hyperframe.

## Bento4 / MP4Box

Scoped tool: `bento4_mp4box_packaging_validation`

Status: `resolved_mp4box_provider_gpac_ready_for_future_install_proof`

Review result: `gpac_selected_as_mp4box_provider_bento4_separate`

#624 resolves GPAC as the future MP4Box provider for Atlas Track A package identity. Bento4 remains a separate MP4/DASH toolkit and is not selected for the MP4Box command path in this Batch-2 repair. Future install-source proof still requires a separate explicit PR and must not execute MP4Box or process media here.

## VapourSynth

Scoped tool: `vapoursynth_frame_pipeline`

Status: `resolved_vapoursynth_native_policy_ready_for_future_install_proof`

Review result: `core_vapoursynth_only_plugins_separately_reviewed`

#624 resolves the future proof policy for core VapourSynth only. Plugins remain separately reviewed, wheel/package scoped, and not installed here. Batch-2 does not install VapourSynth, Python packages, plugins, or native libraries.

## Revideo

Scoped tool: `revideo_render_preview_alternative`

Status: `resolved_revideo_package_identity_ready_for_future_install_proof`

Review result: `evaluation_only_non_core_owner_approved_future_install_required`

#624 resolves the Revideo package identity for future install-proof planning, but keeps Revideo evaluation-only and non-core. Any future install proof must be owner-approved and must not duplicate Remotion or Hyperframe. Batch-2 does not install Revideo, add npm packages, run preview tooling, or claim production readiness.

## Source-Declared Tools

GStreamer and MKVToolNix were declared by #601 in `docker/prod/render-worker/Dockerfile` only. Batch-2 does not modify the Dockerfile and does not verify installation because `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true` is absent.

## Source-Of-Truth Identity Chain

- #601 remains the source-of-truth for GStreamer and MKVToolNix install-source declarations.
- #624 merge `afc9983cecaef0eeeb536409c16c3e0ad2eda7c6` is the source-of-truth for GPAC/MP4Box, VapourSynth, Revideo, and Hyperframe identity/policy decisions.
- #577 remains draft/open/blocked/conflicting and excluded as source-of-truth.
