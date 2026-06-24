# Package Source Policy Review

Milestone: `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1`

Execution: `completed_docs_only_package_source_policy_review_no_install_changes`

## GPAC / MP4Box

Status: `blocked_gpac_mp4box_package_source_unavailable`

Readiness: `blocked_pending_safe_package_source`

Future install source: `none_until_safe_source`

GPAC remains the resolved future MP4Box provider from #624, but this policy review does not add `gpac`, GPAC external APT repository setup, source builds, arbitrary binaries, Dockerfile package declarations, package installation, or runtime command checks.

Reason:

- The current render-worker base is `node:24-bookworm`.
- Debian package source search shows exact `gpac` only in bullseye.
- Debian sid `gpac` is not a stable bookworm package source for this repo base.
- GPAC downloads list Linux 64-bit stable installers for Ubuntu 24.04 and Debian 12 bookworm 32-bit/source-build paths, not a clean current render-worker package source.
- Third-party repositories, source builds, and arbitrary binaries remain outside this policy review.

Bento4 remains `separate_not_selected_for_mp4box_command_path`.

## VapourSynth

Status: `blocked_core_vapoursynth_package_source_unavailable`

Plugin status: `blocked_vapoursynth_native_plugin_policy_not_satisfied`

Readiness: `blocked_pending_safe_package_source`

Scope: `core_vapoursynth_only_plugins_excluded`

Core VapourSynth remains a worker-only future candidate, but this policy review does not add `vapoursynth`, `python3-vapoursynth`, `vapoursynth-tools`, pip packages, deb-multimedia, plugins, Dockerfile package declarations, package installation, or runtime command checks.

Reason:

- VapourSynth installation guidance recommends pip with Python 3.12+.
- Debian bookworm `python3` is 3.11.2 in the current package baseline.
- VapourSynth Debian package guidance points to deb-multimedia, outside the current approved package-source boundary.
- Plugins remain separately reviewed and are not covered by core package-source policy.

## Revideo

Status: `evaluation_only_non_core_owner_approval_required_before_install_source`

Revideo remains evaluation-only/non-core. It cannot proceed to install-source proof without owner approval and a non-duplication boundary against Remotion and Hyperframe.

## Hyperframe

Status: `handoff_only_no_install_source_change`

No external Hyperframe install target is selected.
