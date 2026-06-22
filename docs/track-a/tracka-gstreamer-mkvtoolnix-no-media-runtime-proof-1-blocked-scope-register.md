# TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1 Blocked Scope Register

The following scopes remain blocked after the no-media runtime proof:

- GStreamer pipeline execution: `blocked_until_TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1`
- MKVToolNix media command execution: `blocked_until_TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-SYNTHETIC-FIXTURE-PROOF-1`
- FFmpeg execution: `blocked_trackb_owned`
- FFprobe execution: `blocked_trackb_owned`
- Private media processing: `blocked`
- GCS/private artifact access: `blocked`
- Signed URL creation: `blocked`
- Public artifact creation: `blocked`
- Supabase mutation: `blocked`
- SQL execution: `blocked`
- Worker/route/provider/model execution: `blocked`
- Docker push/deployment: `blocked`
- Internal beta, external beta, production, final delivery, paid production, or broad media unlock: `blocked`

Potential failure blockers preserved by the runner:

- `blocked_docker_daemon_unavailable`
- `blocked_render_worker_image_unavailable`
- `blocked_no_media_command_path_check_failed`
- `blocked_no_media_runtime_command_check_failed`
- `blocked_unexpected_gstreamer_pipeline_execution`
- `blocked_unexpected_mkvtoolnix_media_execution`
