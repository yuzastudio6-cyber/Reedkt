# Sound/Music/Audio Open-Source Tool CI Rollback Plan

Planning-only CI and rollback expectations for later controlled dependency installation.

Decision: `sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install`

```json sound-oss-tools-2-ci-rollback-plan
{
  "phase": "SOUND-OSS-TOOLS-2",
  "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "ciImpactSummary": {
    "pythonPackages": "Later install may require Python dependency manifests and CI Python environment review.",
    "optionalBinary": "signalsmith_stretch requires source/binary packaging review before any install.",
    "documentationOnlyAliases": "pydub_effects and ebu_r128_pyloudnorm should not add direct dependencies."
  },
  "rollbackStrategy": {
    "python": "Remove added dependency pins and regenerate approved lockfiles in the same controlled install PR.",
    "optionalBinary": "Remove source/binary build notes and CI image changes.",
    "documentationOnly": "Remove alias docs only; no dependency rollback expected."
  },
  "blockedToolPolicy": "Blocked/deferred/reference/handoff tools stay excluded from SOUND-owned install changes.",
  "packageLockReviewExpected": "No package-lock change in SOUND-OSS-TOOLS-2; any future package-lock mutation requires SOUND-OSS-TOOLS-3 approval.",
  "runtimeFlags": {
    "dependencyMutationAllowed": false,
    "toolExecutionAllowed": false,
    "audioProcessingAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "installCompletionClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  }
}
```
