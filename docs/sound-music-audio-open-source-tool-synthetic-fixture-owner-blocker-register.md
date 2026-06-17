# Sound/Music/Audio Synthetic Fixture Owner Blocker Register

This register preserves the remaining blockers after owner review. These blockers are warnings for the scoped gate-status packet and hard blockers for runtime/media/Supabase/public-artifact readiness.

```json sound-oss-tools-7-owner-blocker-register
{
  "phase": "SOUND-OSS-TOOLS-7",
  "decision": "sound_oss_tools_7_owner_review_passed_with_warnings_ready_for_scoped_gate_status",
  "blockerCount": 12,
  "blockers": [
    {
      "blockerId": "pydub_media_operations_blocked_ffmpeg_avconv_warning",
      "scope": "pydub",
      "status": "blocked",
      "reason": "pydub media operations remain blocked by the inherited FFmpeg/avconv warning policy",
      "owner": "SOUND_MUSIC_AUDIO plus TRACK_A_RENDER_EXPORT if FFmpeg policy changes",
      "mayExecuteNow": false
    },
    {
      "blockerId": "audioread_file_open_blocked_no_media",
      "scope": "audioread",
      "status": "blocked",
      "reason": "audioread file-open validation remains blocked because media files are prohibited",
      "owner": "SOUND_MUSIC_AUDIO plus TRACK_B_MEDIA_PROCESSING before media-loader execution",
      "mayExecuteNow": false
    },
    {
      "blockerId": "ffmpeg_ffprobe_blocked",
      "scope": "FFmpeg/ffprobe",
      "status": "blocked",
      "reason": "Track A and Track B own these runtime/reference surfaces; no FFmpeg or ffprobe execution is approved",
      "owner": "TRACK_A_RENDER_EXPORT and TRACK_B_MEDIA_PROCESSING",
      "mayExecuteNow": false
    },
    {
      "blockerId": "demucs_rnnoise_essentia_rubber_band_blocked",
      "scope": "Demucs/RNNoise/Essentia/Rubber Band/pyrubberband/rubberband-cli",
      "status": "blocked",
      "reason": "model-weight, legal/product, and launch-stack blockers remain unresolved",
      "owner": "SOUND_MUSIC_AUDIO plus COMPLIANCE_SECURITY",
      "mayExecuteNow": false
    },
    {
      "blockerId": "signalsmith_stretch_source_binary_planning_only",
      "scope": "Signalsmith Stretch",
      "status": "blocked",
      "reason": "Signalsmith Stretch remains optional source/binary planning only and is not included in the Python fixture scope",
      "owner": "SOUND_MUSIC_AUDIO plus WORKER_RUNTIME_JOBS",
      "mayExecuteNow": false
    },
    {
      "blockerId": "workers_routes_providers_blocked",
      "scope": "workers/routes/providers/models",
      "status": "blocked",
      "reason": "No worker, route, job, provider, or model execution is approved",
      "owner": "WORKER_RUNTIME_JOBS, TOOL_ROUTE_EXECUTION, and PROVIDER_GATEWAY_MODELS",
      "mayExecuteNow": false
    },
    {
      "blockerId": "supabase_mutation_sql_blocked",
      "scope": "Supabase/SQL",
      "status": "blocked",
      "reason": "No Supabase environment, mutation, migration, storage, or SQL action is approved",
      "owner": "SUPABASE_RLS_STORAGE_DATABASE",
      "mayExecuteNow": false
    },
    {
      "blockerId": "signed_urls_public_artifacts_blocked",
      "scope": "signed URLs/public artifacts",
      "status": "blocked",
      "reason": "No signed URL or public artifact creation is approved",
      "owner": "PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "mayExecuteNow": false
    },
    {
      "blockerId": "beta_production_blocked",
      "scope": "internal beta/external beta/production",
      "status": "blocked",
      "reason": "Readiness blockers remain inherited and closed; no beta or production unlock is approved",
      "owner": "FRONTEND_PRODUCT_UX plus release owners",
      "mayExecuteNow": false
    },
    {
      "blockerId": "project_wide_generated_local_fixture_passed_blocked",
      "scope": "project-wide generated_local_fixture_passed",
      "status": "blocked",
      "reason": "SOUND owner review may not claim the project-wide generated_local_fixture_passed gate",
      "owner": "cross-workstream source-of-truth owner required",
      "mayExecuteNow": false
    },
    {
      "blockerId": "dry_run_passed_blocked",
      "scope": "dry_run_passed",
      "status": "blocked",
      "reason": "SOUND-OSS-TOOLS-7 is owner review only and does not claim dry_run_passed",
      "owner": "future scoped gate owner",
      "mayExecuteNow": false
    },
    {
      "blockerId": "runtime_readiness_blocked",
      "scope": "runtime readiness",
      "status": "blocked",
      "reason": "No runtime media/tool/worker/provider/Supabase path is approved",
      "owner": "cross-workstream runtime owners",
      "mayExecuteNow": false
    }
  ],
  "nextPrompt": "SOUND-OSS-TOOLS-8: synthetic fixture gate status packet, no media processing"
}
```
