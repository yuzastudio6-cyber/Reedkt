# Sound/Music/Audio Synthetic Fixture Exclusion Guard

This guard keeps blocked, reference-only, handoff-only, provider/internal, and Track A/B tools out of SOUND synthetic fixture execution.

```json sound-oss-tools-5-synthetic-fixture-exclusion-guard
{
  "phase": "SOUND-OSS-TOOLS-5",
  "decision": "sound_oss_tools_5_synthetic_fixture_validation_plan_ready_with_warnings",
  "excludedCount": 12,
  "excludedTools": [
    {
      "toolId": "demucs",
      "exclusionReason": "blocked pending model-weight and provenance review",
      "sourceOfTruth": "PR #418 ownership registry and SOUND-OSS-TOOLS-1/2 blocked registers",
      "futureApprovalNeeded": "COMPLIANCE_SECURITY plus SOUND_MUSIC_AUDIO",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "rnnoise",
      "exclusionReason": "inactive and blocked pending owner handoff",
      "sourceOfTruth": "PR #418 duplicate-risk register",
      "futureApprovalNeeded": "SOUND_MUSIC_AUDIO source-of-truth update",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "essentia",
      "exclusionReason": "not selected for launch and blocked pending legal/product review",
      "sourceOfTruth": "launch-tool-stack-update.md and SOUND-OSS-TOOLS-1/2 blocked registers",
      "futureApprovalNeeded": "COMPLIANCE_SECURITY plus product approval",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "pyrubberband",
      "exclusionReason": "blocked pending legal review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1/2 blocked registers",
      "futureApprovalNeeded": "COMPLIANCE_SECURITY",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "rubberband",
      "exclusionReason": "not selected for launch and blocked pending legal/product review",
      "sourceOfTruth": "launch-tool-stack-update.md",
      "futureApprovalNeeded": "COMPLIANCE_SECURITY plus product approval",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "rubberband-cli",
      "exclusionReason": "not selected for launch and blocked pending legal/product review",
      "sourceOfTruth": "SOUND-OSS-TOOLS-4 blocker register",
      "futureApprovalNeeded": "COMPLIANCE_SECURITY plus product approval",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "ffmpeg",
      "exclusionReason": "Track A render/export runtime owner; pydub warning references availability only",
      "sourceOfTruth": "PR #418 ownership registry",
      "futureApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "ffprobe",
      "exclusionReason": "Track B media processing runtime owner",
      "sourceOfTruth": "PR #418 ownership registry",
      "futureApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "signalsmith_stretch",
      "exclusionReason": "optional source/binary planning only; no Python package added",
      "sourceOfTruth": "SOUND-OSS-TOOLS-2 install plan and SOUND-OSS-TOOLS-4 blocker register",
      "futureApprovalNeeded": "SOUND_MUSIC_AUDIO plus WORKER_RUNTIME_JOBS",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "provider_internal_tools",
      "exclusionReason": "provider/model surfaces are owned by PROVIDER_GATEWAY_MODELS",
      "sourceOfTruth": "PR #418 ownership registry",
      "futureApprovalNeeded": "PROVIDER_GATEWAY_MODELS",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "track_a_reference_tools",
      "exclusionReason": "render/export tools are reference-only for SOUND",
      "sourceOfTruth": "PR #418 ownership registry",
      "futureApprovalNeeded": "TRACK_A_RENDER_EXPORT",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    },
    {
      "toolId": "track_b_reference_tools",
      "exclusionReason": "media-processing tools are reference-only for SOUND",
      "sourceOfTruth": "PR #418 ownership registry",
      "futureApprovalNeeded": "TRACK_B_MEDIA_PROCESSING",
      "mayAppearInFixtureMatrix": false,
      "docsOnlyExclusionRowAllowed": true,
      "mayBeExecuted": false
    }
  ]
}
```
