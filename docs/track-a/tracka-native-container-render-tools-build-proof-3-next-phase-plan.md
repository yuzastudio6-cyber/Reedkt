# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Next Phase Plan

Current Build-Proof-3 readiness: `blocked_render_worker_docker_build_failed`

Recommended next phase:

`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2R prebuilt worker outputs repair and confirmed retry`

Future 3R requirement:

- Repair or avoid the local Docker build context xattr blocker: `Dockerfile COPY failed because required prebuilt worker output directories were missing from the build context`.
- Set `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true`.
- Run the guarded build runner once after pre-build validation.
- Record sanitized `/tmp` manifest/checksum evidence only.
- Do not commit generated reports or image artifacts.

After successful Batch-2R metadata proof:

- `TRACKA-GSTREAMER-RUNTIME-PROOF-1 readiness: ready_after_build_metadata_proof`
- `TRACKA-CONTAINER-PACKAGING-VALIDATION-PROOF-1 readiness: ready_after_build_metadata_proof`

Resolved identity handoff after #624:

- `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3` for GPAC/MP4Box, core VapourSynth, and Revideo evaluation/non-core install-source planning.
- `TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1`

Product-ready end-to-end local OSS tools: `0`
