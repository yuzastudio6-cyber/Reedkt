# Sound/Music/Audio Scoped Synthetic Fixture Downstream Wording Register

This register defines the only wording approved by SOUND-OSS-TOOLS-9 for downstream SOUND metadata. It does not approve runtime, media processing, beta/production, or project-wide fixture claims.

```json sound-oss-tools-9-downstream-wording-register
{
  "phase": "SOUND-OSS-TOOLS-9",
  "decision": "sound_oss_tools_9_scoped_synthetic_fixture_pass_review_passed_with_warnings_ready_for_status_owner_approval",
  "allowedWording": [
    "sound_oss_tools_synthetic_fixture_validation_passed_with_warnings",
    "SOUND OSS scoped synthetic fixture validation passed with warnings"
  ],
  "forbiddenWording": [
    "generated_local_fixture_passed",
    "dry_run_passed",
    "runtime_ready",
    "production_ready",
    "beta_ready",
    "media_processing_ready"
  ],
  "claimPolicy": {
    "scopedSoundOssFixtureStatusMayBeReferencedInDownstreamMetadata": true,
    "projectWideGeneratedLocalFixturePassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "mediaProcessingReadyClaimed": false,
    "productionReadinessClaimed": false,
    "betaReadinessClaimed": false
  },
  "rationale": [
    "PR #470 recorded scoped SOUND status only.",
    "PR #461 fixture evidence is accepted only for SOUND OSS metadata and cannot be widened into a project-wide claim.",
    "The audioread and pydub policy skips remain warnings/blockers and must travel with the scoped wording."
  ],
  "ownerApprovalNeededBeforeBroaderClaim": true,
  "broaderClaimOwner": "cross-workstream source-of-truth owner",
  "nextGate": "SOUND-OSS-TOOLS-10: scoped status owner approval, no media processing",
  "nextPrompt": "SOUND-OSS-TOOLS-10: scoped status owner approval, no media processing"
}
```
