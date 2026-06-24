# TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-RESOLUTION-BATCH-1

Decision: `blocked_no_safe_package_source_resolution_available`

Execution: `completed_docs_only_package_source_resolution_no_install_changes`

Patch type: Atlas Track A GPAC/MP4Box and core VapourSynth package-source resolution batch.

Base integration: `702cf924db4c8c29688f8c9335ef08f147314bd9`, the #697 merge for `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3`.

## Result

This phase keeps the conservative blocked path from #697 and records the package-source evidence needed before any future install-source PR.

- GPAC/MP4Box: `blocked_gpac_mp4box_package_source_unavailable`; readiness `blocked_pending_safe_package_source`.
- Bento4: `separate_not_selected_for_mp4box_command_path`.
- VapourSynth: `blocked_core_vapoursynth_package_source_unavailable`; plugin status `blocked_vapoursynth_native_plugin_policy_not_satisfied`; readiness `blocked_pending_safe_package_source`.
- Revideo: `evaluation_only_non_core_owner_approval_required_before_install_source`.
- Hyperframe: `handoff_only_no_install_source_change`.
- GStreamer/MKVToolNix: `qa_passed_controlled_generated_private_fixture_execution_evidence`; not run in this phase.
- Product-ready end-to-end local OSS tools: `0`.
- Next recommended milestone: `owner_or_environment_package_source_review`.

## Source Findings

- Debian package search does not provide a clean bookworm `gpac` source for the current `node:24-bookworm` render-worker base. Debian lists the exact `gpac` source in bullseye only, while the sid page is not a usable current-base bookworm amd64 source.
- GPAC stable installers list Linux 64-bit as Ubuntu 24.04 and Linux 32-bit as Debian 12 bookworm; other versions or distributions require source build, which is outside this batch.
- VapourSynth recommends pip with Python 3.12+, while Debian bookworm `python3` is 3.11.2. VapourSynth Debian package guidance points to deb-multimedia, which is outside the current repo-owned package-source boundary.

Sources checked:

- Debian GPAC source search: https://packages.debian.org/src%3Agpac
- Debian sid GPAC package page: https://packages.debian.org/sid/gpac
- GPAC downloads: https://gpac.io/downloads/gpac-nightly-builds/
- VapourSynth install docs: https://www.vapoursynth.com/doc/installation.html
- Debian bookworm python3: https://packages.debian.org/bookworm/python3

## Source Chain

#624 records GPAC/MP4Box, VapourSynth, Revideo, and Hyperframe identity/policy decisions. #693 records the native/container render tools rollup after GStreamer/MKVToolNix QA. #697 records the conservative blocked Install-Proof-3 source review.

#601, #609, #624, #649, #652, #659, #667, #662, #666, #675, #673, #680, #682, #693, and #697 remain source-chain references for this batch.

#577 remains open/draft/blocked and excluded as source-of-truth.

## Boundaries

No Dockerfile, Python requirements, npm package, package-lock, runtime source, Supabase, SQL, worker, route, provider, media, generated artifact, or production file was changed.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FFmpeg/FFprobe execution, Docker build, Docker push/deploy, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
