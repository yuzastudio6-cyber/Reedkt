# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 Build-Proof Support

Batch-2 keeps the existing Build-Proof-3 runner as the support path for a future confirmed local Docker build metadata proof.

Support runner: `scripts/validation/tracka-native-container-render-tools-build-proof-3.mjs`

Support package script: `tracka:native-container-render-tools-build-proof-3`

Required gate: `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true`

Current execution: `blocked_confirmation_absent_no_build`

Current build status: `not_run_confirmation_absent`

Current metadata verification: `not_run_confirmation_absent`

## Future Confirmed Support Path

If the future gate is explicitly provided, the support runner may run only the local render-worker Docker build and metadata checks already encoded in Build-Proof-3:

`docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-tracka-native-container-render-tools-build-proof-3:<runId> .`

The support runner may verify package metadata for `gstreamer1.0-plugins-base`, `gstreamer1.0-plugins-good`, `gstreamer1.0-tools`, and `mkvtoolnix`, plus command paths for `gst-launch-1.0` and `mkvmerge`.

It must not run version commands, GStreamer pipelines, MKVToolNix media operations, FFmpeg, FFprobe, Remotion, worker routes, provider/model calls, private media, GCS/private artifacts, signed/public artifacts, Docker push, Cloud Run, deployment, Supabase, SQL, or beta/production/final delivery unlocks.

Future success decision, only after confirmed build proof: `completed_render_worker_docker_build_install_metadata_proof_with_identity_reviews`

Current Batch-2 decision: `blocked_pending_native_container_build_confirmation_with_identity_reviews_recorded`
