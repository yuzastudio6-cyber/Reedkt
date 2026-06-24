# Package Source Review

Milestone: `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-RESOLUTION-BATCH-1`

Execution: `completed_docs_only_package_source_resolution_no_install_changes`

## GPAC / MP4Box

Status: `blocked_gpac_mp4box_package_source_unavailable`

Readiness: `blocked_pending_safe_package_source`

GPAC remains the resolved future MP4Box provider from #624, but this source-resolution batch does not add `gpac`, GPAC external APT repository setup, source builds, arbitrary binaries, or Dockerfile package declarations.

Reason:

- The current render-worker base is `node:24-bookworm`.
- Debian package source search does not provide a clean bookworm exact `gpac` source for this base.
- Debian sid `gpac` is not a usable bookworm amd64 source for this repo base.
- GPAC stable Linux 64-bit installer guidance targets Ubuntu 24.04, while the Debian 12 bookworm binary path is 32-bit. Other distributions require source build.
- Third-party repositories, source builds, and arbitrary binaries remain outside this batch.

Bento4 remains `separate_not_selected_for_mp4box_command_path`.

## VapourSynth

Status: `blocked_core_vapoursynth_package_source_unavailable`

Plugin status: `blocked_vapoursynth_native_plugin_policy_not_satisfied`

Readiness: `blocked_pending_safe_package_source`

Core VapourSynth remains a worker-only future candidate, but this batch does not add `vapoursynth`, `python3-vapoursynth`, `vapoursynth-tools`, pip packages, deb-multimedia, plugins, or Dockerfile package declarations.

Reason:

- VapourSynth installation guidance recommends pip with Python 3.12+.
- Debian bookworm `python3` is 3.11.2 in the current package baseline.
- VapourSynth Debian package guidance points to deb-multimedia, outside the current approved package-source boundary.
- Plugins remain separately reviewed and are not covered by core package-source review.

## Revideo

Status: `evaluation_only_non_core_owner_approval_required_before_install_source`

Revideo remains evaluation-only/non-core. It cannot proceed to install-source proof without owner approval and a non-duplication boundary against Remotion and Hyperframe.

## Hyperframe

Status: `handoff_only_no_install_source_change`

No external Hyperframe install target is selected.
