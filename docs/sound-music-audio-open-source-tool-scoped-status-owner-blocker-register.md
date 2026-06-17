# Sound/Music/Audio Scoped Status Owner Blocker Register

The owner approval passes with warnings for downstream status-doc references only. Every execution, runtime, artifact, billing, Supabase, beta/production, and broader claim blocker remains closed until the named owner clears it in a later milestone.

```json sound-oss-tools-10-owner-blocker-register
{
  "phase": "SOUND-OSS-TOOLS-10",
  "decision": "sound_oss_tools_10_scoped_status_owner_approval_passed_with_warnings_ready_for_downstream_status_sync",
  "blockerCount": 13,
  "blockers": [
    {
      "blockerId": "audioread_file_open_blocked_no_media",
      "scope": "audioread file-open validation",
      "status": "blocked",
      "reason": "audioread file-open validation remains blocked because media files are prohibited",
      "ownerNeededToClear": "SOUND_MUSIC_AUDIO with media safety and fixture policy approval",
      "mayExecuteNow": false
    },
    {
      "blockerId": "pydub_media_operations_blocked_ffmpeg_avconv_warning",
      "scope": "pydub media operations",
      "status": "blocked",
      "reason": "pydub media operations remain blocked by the inherited FFmpeg/avconv warning policy",
      "ownerNeededToClear": "SOUND_MUSIC_AUDIO plus TRACK_B_MEDIA_PROCESSING after FFmpeg policy clearance",
      "mayExecuteNow": false
    },
    {
      "blockerId": "ffmpeg_ffprobe_blocked",
      "scope": "FFmpeg/ffprobe",
      "status": "blocked",
      "reason": "No FFmpeg or ffprobe execution is approved by this owner approval",
      "ownerNeededToClear": "TRACK_B_MEDIA_PROCESSING with legal/runtime approval",
      "mayExecuteNow": false
    },
    {
      "blockerId": "demucs_rnnoise_essentia_rubber_band_blocked",
      "scope": "Demucs/RNNoise/Essentia/Rubber Band/pyrubberband/rubberband-cli",
      "status": "blocked",
      "reason": "Model-weight, legal/product, and launch-stack blockers remain unresolved",
      "ownerNeededToClear": "SOUND_MUSIC_AUDIO, TOOL_ROUTE_EXECUTION, and COMPLIANCE_SECURITY",
      "mayExecuteNow": false
    },
    {
      "blockerId": "signalsmith_stretch_blocked",
      "scope": "Signalsmith Stretch",
      "status": "blocked",
      "reason": "Signalsmith Stretch remains source/binary planning only",
      "ownerNeededToClear": "SOUND_MUSIC_AUDIO and TOOL_ROUTE_EXECUTION with worker execution approval",
      "mayExecuteNow": false
    },
    {
      "blockerId": "worker_route_provider_blocked",
      "scope": "workers/routes/providers/models",
      "status": "blocked",
      "reason": "No worker, route, job, provider, or model execution is approved",
      "ownerNeededToClear": "WORKER_RUNTIME_JOBS, PROVIDER_GATEWAY_MODELS, and TOOL_ROUTE_EXECUTION",
      "mayExecuteNow": false
    },
    {
      "blockerId": "supabase_sql_blocked",
      "scope": "Supabase/SQL",
      "status": "blocked",
      "reason": "No Supabase environment, mutation, migration, storage, or SQL action is approved",
      "ownerNeededToClear": "SUPABASE_RLS_STORAGE_DATABASE",
      "mayExecuteNow": false
    },
    {
      "blockerId": "signed_urls_public_artifacts_blocked",
      "scope": "signed URLs/public artifacts",
      "status": "blocked",
      "reason": "No signed URL or public artifact creation is approved",
      "ownerNeededToClear": "PUBLIC_ARTIFACT_DELIVERY_POLICY and COMPLIANCE_SECURITY",
      "mayExecuteNow": false
    },
    {
      "blockerId": "credits_stripe_blocked",
      "scope": "credits/Stripe",
      "status": "blocked",
      "reason": "No credit mutation, checkout, webhook, payment, reservation, or billing action is approved",
      "ownerNeededToClear": "BILLING_STRIPE_CREDITS",
      "mayExecuteNow": false
    },
    {
      "blockerId": "beta_production_blocked",
      "scope": "internal beta/external beta/paid production/production",
      "status": "blocked",
      "reason": "No beta or production unlock is approved",
      "ownerNeededToClear": "COMPLIANCE_SECURITY and product release owner",
      "mayExecuteNow": false
    },
    {
      "blockerId": "runtime_readiness_blocked",
      "scope": "runtime readiness",
      "status": "blocked",
      "reason": "No runtime readiness claim is approved",
      "ownerNeededToClear": "WORKER_RUNTIME_JOBS, TOOL_ROUTE_EXECUTION, PROVIDER_GATEWAY_MODELS, and OBSERVABILITY_AUDIT_COST",
      "mayExecuteNow": false
    },
    {
      "blockerId": "project_wide_generated_local_fixture_passed_blocked",
      "scope": "project-wide generated_local_fixture_passed",
      "status": "blocked",
      "reason": "SOUND-OSS-TOOLS-10 preserves scoped SOUND status only",
      "ownerNeededToClear": "cross-workstream source-of-truth owner",
      "mayExecuteNow": false
    },
    {
      "blockerId": "dry_run_passed_blocked",
      "scope": "dry_run_passed",
      "status": "blocked",
      "reason": "No dry-run pass claim is approved",
      "ownerNeededToClear": "TOOL_ROUTE_EXECUTION and runtime validation owner",
      "mayExecuteNow": false
    }
  ],
  "nextPrompt": "SOUND-OSS-TOOLS-11: downstream status sync, no media processing"
}
```
