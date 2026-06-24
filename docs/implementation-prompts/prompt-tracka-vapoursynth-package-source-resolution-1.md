# TRACKA-VAPOURSYNTH-PACKAGE-SOURCE-RESOLUTION-1

Readiness: `TRACKA-VAPOURSYNTH-PACKAGE-SOURCE-RESOLUTION-1 readiness: ready_for_package_source_and_plugin_policy_review`

Source-of-truth context:

- #624 resolved core VapourSynth policy for future install proof planning.
- `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3 decision: blocked_no_safe_resolved_identity_install_source_available`.
- `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-RESOLUTION-BATCH-1 decision: blocked_no_safe_package_source_resolution_available`.
- `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-POLICY-REVIEW-1 decision: blocked_no_safe_package_source_policy_available`.
- `TRACKA-NATIVE-CONTAINER-PACKAGE-SOURCE-OWNER-ENVIRONMENT-REVIEW-1 decision: blocked_no_owner_environment_package_source_approval`.
- Current blockers: `blocked_core_vapoursynth_package_source_unavailable`; `blocked_vapoursynth_native_plugin_policy_not_satisfied`.
- Owner/environment blocker: `blocked_core_vapoursynth_package_source_policy_not_approved`.
- Allowed future source: `none_until_owner_environment_approval`.

Goal: obtain an explicit owner/environment package-source approval before any install proof. The current owner/environment review confirms core VapourSynth remains blocked by safe package-source and current-base Python policy, while plugins remain separately blocked. Do not add deb-multimedia, external repositories, pip packages, plugins, Dockerfile changes, or runtime commands unless a future implementation prompt explicitly approves that exact source.

Policy review finding: render-worker base `node:24-bookworm`; Debian bookworm `python3` baseline is 3.11.2; VapourSynth guidance recommends pip with Python 3.12+ or Debian packages via deb-multimedia. Readiness remains `blocked_pending_safe_package_source`.

Owner/environment readiness remains `blocked_pending_owner_environment_package_source_approval`.

Boundaries: no VapourSynth execution, no Docker build, no media processing, no FFmpeg/FFprobe, no Supabase/SQL, no signed/public artifacts, and no beta/production/final delivery unlock.
