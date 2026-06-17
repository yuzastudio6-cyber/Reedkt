# Sound/Music/Audio Synthetic Fixture Validation Blocker Register

This register records policy skips and still-closed runtime surfaces after SOUND-OSS-TOOLS-6. These blockers do not block owner review because the approved no-file synthetic fixtures passed and the skipped fixtures remain fail-closed.

```json sound-oss-tools-6-synthetic-fixture-validation-blocker-register
{
  "phase": "SOUND-OSS-TOOLS-6",
  "decision": "sound_oss_tools_6_synthetic_fixture_validation_passed_with_warnings_ready_for_owner_review",
  "blockerCount": 9,
  "blockers": [
    {
      "blockerId": "pydub_media_operations_blocked_ffmpeg_avconv_warning",
      "toolOrModule": "pydub",
      "status": "skipped_blocked_by_policy",
      "reason": "pydub media operations remain blocked by the inherited FFmpeg/avconv warning policy",
      "owner": "SOUND_MUSIC_AUDIO plus TRACK_A_RENDER_EXPORT if FFmpeg policy changes",
      "mayExecuteNow": false
    },
    {
      "blockerId": "audioread_file_open_blocked",
      "toolOrModule": "audioread",
      "status": "skipped_blocked_by_policy",
      "reason": "file-open validation requires media files, and media files are prohibited in this milestone",
      "owner": "SOUND_MUSIC_AUDIO plus TRACK_B_MEDIA_PROCESSING before any media-loader execution",
      "mayExecuteNow": false
    },
    {
      "blockerId": "ffmpeg_ffprobe_blocked",
      "toolOrModule": "FFmpeg/ffprobe",
      "status": "excluded_unproven",
      "reason": "Track A reference/runtime owner; no FFmpeg or ffprobe command may run in SOUND-OSS-TOOLS-6",
      "owner": "TRACK_A_RENDER_EXPORT",
      "mayExecuteNow": false
    },
    {
      "blockerId": "demucs_rnnoise_blocked",
      "toolOrModule": "Demucs/RNNoise",
      "status": "excluded_unproven",
      "reason": "model-weight/provenance and owner blockers remain unresolved",
      "owner": "SOUND_MUSIC_AUDIO owner review and model-weight governance",
      "mayExecuteNow": false
    },
    {
      "blockerId": "essentia_rubberband_blocked",
      "toolOrModule": "Essentia/Rubber Band/pyrubberband/rubberband-cli",
      "status": "excluded_unproven",
      "reason": "not selected for launch and blocked pending legal/product review",
      "owner": "SOUND_MUSIC_AUDIO plus legal/product review",
      "mayExecuteNow": false
    },
    {
      "blockerId": "signalsmith_stretch_source_binary_only",
      "toolOrModule": "Signalsmith Stretch",
      "status": "excluded_source_binary_planning_only",
      "reason": "optional source/binary planning only; not in the committed Python requirements manifest",
      "owner": "SOUND_MUSIC_AUDIO plus worker runtime approval",
      "mayExecuteNow": false
    },
    {
      "blockerId": "provider_internal_tools_blocked",
      "toolOrModule": "provider/internal SOUND tools",
      "status": "excluded_unproven",
      "reason": "provider/model calls and internal provider surfaces remain out of scope",
      "owner": "PROVIDER_GATEWAY_MODELS",
      "mayExecuteNow": false
    },
    {
      "blockerId": "runtime_worker_route_blocked",
      "toolOrModule": "workers/routes/jobs",
      "status": "excluded_unproven",
      "reason": "no worker, route, job dispatch, claim, lease, or runtime execution is allowed",
      "owner": "WORKER_RUNTIME_JOBS and TOOL_ROUTE_EXECUTION",
      "mayExecuteNow": false
    },
    {
      "blockerId": "supabase_artifact_public_url_blocked",
      "toolOrModule": "Supabase/storage/signed URLs/public artifacts",
      "status": "excluded_unproven",
      "reason": "no Supabase mutation, SQL, storage transfer, signed URL, or public artifact is allowed",
      "owner": "SUPABASE_RLS_STORAGE_DATABASE and PUBLIC_ARTIFACT_DELIVERY_POLICY",
      "mayExecuteNow": false
    }
  ],
  "claimPolicy": {
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "SOUND-OSS-TOOLS-7: synthetic fixture owner review, no media processing"
}
```
