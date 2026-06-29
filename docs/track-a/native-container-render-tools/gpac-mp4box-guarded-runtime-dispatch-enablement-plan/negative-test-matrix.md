# Negative Test Matrix

Future guarded runtime dispatch scaffold must reject:

- `blocked_raw_chat_execution_attempt`
- `blocked_missing_approved_snapshot`
- `blocked_unapproved_media_source`
- `blocked_public_or_signed_artifact_attempt`
- `blocked_missing_private_artifact_manifest`
- `blocked_missing_cleanup_policy`
- `blocked_route_bypass_attempt`
- `blocked_worker_bypass_attempt`
- `blocked_command_allowlist_drift`
- `blocked_ffmpeg_ffprobe_expansion`
- `blocked_product_unlock_drift`
- `blocked_missing_confirmation_gate`

This packet records the required tests only. It does not run routes, workers, tools, media, storage transfer, Supabase, SQL, Docker, Remotion, or FFmpeg/FFprobe.
