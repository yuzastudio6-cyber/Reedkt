# Package Source Review

Milestone: `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3`

Execution: `completed_docs_only_blocked_install_source_review`

## GPAC / MP4Box

Status: `blocked_gpac_mp4box_package_source_unavailable`

GPAC remains the resolved future MP4Box provider from #624, but this phase does not add `gpac` to `docker/prod/render-worker/Dockerfile`.

Reason:

- The render-worker base is `node:24-bookworm`.
- The Debian package source checked for `gpac` did not provide a clean Debian bookworm exact package declaration for this base.
- GPAC Linux guidance points to external APT/nightly package sources or non-bookworm-specific binary paths.
- Adding third-party repositories is outside this install-proof phase.

## VapourSynth

Status: `blocked_core_vapoursynth_package_source_unavailable`

Plugin status: `blocked_vapoursynth_native_plugin_policy_not_satisfied`

Core VapourSynth remains resolved for future policy from #624, but this phase does not add `vapoursynth`, `python3-vapoursynth`, `vapoursynth-tools`, pip packages, or plugins.

Reason:

- VapourSynth documentation points Debian users to deb-multimedia.
- Adding deb-multimedia or equivalent third-party package source is outside this phase.
- Plugins remain separately reviewed and are not covered by the core policy.

## Revideo

Status: `evaluation_only_non_core_owner_approval_required_before_install_source`

No Revideo package is added. Revideo cannot proceed to install-source proof without owner approval and an explicit non-duplication boundary against Remotion and Hyperframe.

## Hyperframe

Status: `handoff_only_no_install_source_change`

No external Hyperframe install target is selected.
