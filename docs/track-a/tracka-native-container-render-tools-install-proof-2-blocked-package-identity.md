# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2 Blocked Package Identity

## Bento4 / MP4Box

Readiness: `blocked_pending_bento4_mp4box_package_identity_provenance_review`

Reason: Bento4/MP4Box package identity is not approved in this packet. GPAC/MP4Box may be a candidate, but this milestone does not choose or install it.

Required next review:

- Decide whether the owner wants Bento4, GPAC/MP4Box, or another packaging validation path.
- Record license/provenance and package source.
- Keep any install proof separate from runtime proof.

## VapourSynth

Readiness: `blocked_pending_vapoursynth_native_dependency_plugin_policy`

Reason: VapourSynth is a native frame pipeline candidate, and plugins require separate license/security review before install-source changes.

Required next review:

- Decide core package and plugin policy.
- Decide worker lane and build proof boundary.
- Keep media processing blocked until a future explicit runtime proof.

## Revideo

Readiness: `blocked_pending_revideo_package_identity_review`

Reason: Revideo package identity is not approved, and repo evidence repeatedly keeps Revideo evaluation-only and production-blocked.

Required next review:

- Resolve exact npm/package identity.
- Confirm ownership boundary with AI Graphics and Remotion lanes.
- Do not install or execute Revideo until the identity review passes.

## Hyperframe

Readiness: `handoff_only_ready_for_tracka_render_handoff_planning`

Reason: Hyperframe evidence is metadata handoff/planning only. No install target is selected in this packet.
