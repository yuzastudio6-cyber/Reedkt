# SOUND-OSS-TOOLS-5 Synthetic Fixture Validation Plan

Decision: `sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings`

SOUND-OSS-TOOLS-5 consumes merged PR #450 binary/import proof and creates a metadata-only plan for future synthetic fixture validation. This packet does not run synthetic fixtures, does not process audio or media, does not read real user data, does not create files or artifacts, does not execute workers/routes/providers, and does not mutate Supabase or run SQL.

The inherited warning from SOUND-OSS-TOOLS-4 remains active: `pydub` emitted an import-time FFmpeg/avconv availability warning. Future pydub fixture work must not perform media operations until that warning is handled by a later approved gate.

```json sound-oss-tools-5-synthetic-fixture-validation-plan
{
  "phase": "SOUND-OSS-TOOLS-5",
  "decision": "sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings",
  "sourceBase": "a0abed62c23f9118f955051042b385650ff956cd",
  "sourcePullRequests": {
    "pr418": "merged cross-chat ownership registry",
    "pr424": "merged SOUND-OSS-TOOLS-0 stack inventory",
    "pr431": "merged SOUND-OSS-TOOLS-1 license/provenance approval",
    "pr436": "merged SOUND-OSS-TOOLS-2 approved install plan",
    "pr442": "merged SOUND-OSS-TOOLS-3 controlled dependency install",
    "pr450": "merged SOUND-OSS-TOOLS-4 binary/import proof"
  },
  "sourceEvidence": [
    "docs/sound-oss-tools-4-binary-import-proof-result.md",
    "docs/sound-music-audio-open-source-tool-binary-import-proof-matrix.md",
    "docs/sound-music-audio-open-source-tool-binary-import-proof-blocker-register.md",
    "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "docs/sound-oss-tools-3-controlled-dependency-install-result.md",
    "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
    "docs/sound-music-audio-open-source-tool-stack-inventory.md",
    "docs/cross-chat-tool-ownership-registry.md"
  ],
  "fixturePlanPurpose": "plan future synthetic fixture validation for approved SOUND OSS package/module surfaces without executing fixtures",
  "fixturePlanScope": "metadata_only_planning",
  "approvedPackageCount": 13,
  "approvedModuleCount": 14,
  "approvedModules": [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "scipy.signal",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval"
  ],
  "allowedFutureSyntheticFixtureCategories": [
    "metadata_validation_only",
    "future_in_memory_synthetic_array_plan",
    "future_symbolic_midi_object_plan",
    "future_symbolic_note_stream_plan",
    "future_synthetic_loudness_array_plan",
    "future_fail_closed_exclusion_validation_plan"
  ],
  "blockedFutureFixtureCategories": [
    "real_user_media",
    "file_based_audio_fixture",
    "ffmpeg_or_ffprobe_fixture",
    "demucs_or_rnnoise_fixture",
    "provider_or_model_fixture",
    "worker_or_route_runtime_fixture",
    "supabase_or_storage_fixture",
    "public_artifact_or_signed_url_fixture"
  ],
  "pydubWarningPolicy": {
    "warningId": "pydub_ffmpeg_avconv_unavailable_import_warning",
    "handled": true,
    "mediaOperationsAllowed": false,
    "futureAction": "pydub may appear only in metadata-only or blocked future planning rows until FFmpeg/avconv policy is resolved"
  },
  "runtimeFlags": {
    "realUserDataAllowed": false,
    "mediaFileAllowed": false,
    "generatedFileAllowed": false,
    "runtimeExecutionAllowed": false,
    "toolExecutionAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "providerCallsAllowed": false,
    "modelCallsAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "artifactCreationAllowed": false,
    "signedUrlAllowed": false,
    "publicArtifactAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "SOUND-OSS-TOOLS-6: synthetic fixture validation, no real user data"
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
