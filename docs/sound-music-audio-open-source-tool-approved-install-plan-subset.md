# Sound/Music/Audio Approved Install-Plan Subset

Decision: `sound_oss_tools_1_license_provenance_approval_completed_ready_for_approved_install_plan`

This is not an install plan and does not approve installation. It is the subset allowed to move into SOUND-OSS-TOOLS-2 install planning, where dependency changes, package-lock expectations, rollback, proof gates, and owner handoffs must be specified before any install.

```json sound-oss-tools-1-approved-install-plan-subset
{
  "phase": "SOUND-OSS-TOOLS-1",
  "candidateCount": 65,
  "approvedForInstallPlanningCount": 16,
  "approvedTools": [
    {
      "toolId": "librosa",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "ISC",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "audioread",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "pydub",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT; optional FFmpeg handoff",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "scipy_signal",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "BSD-3-Clause",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "resampy",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "ISC",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "pyloudnorm",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "audioflux",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "music21",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "BSD-3-Clause",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "pretty_midi",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "mido",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "noisereduce",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "signalsmith_stretch",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "pedalboard",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "Apache-2.0",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "pydub_effects",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT; optional FFmpeg handoff",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    },
    {
      "toolId": "mir_eval",
      "whyApprovedForInstallPlanning": "Open-source/provenance source is clear enough to enter install planning; runtime execution remains blocked.",
      "licenseConfidence": "medium",
      "likelyLicense": "MIT",
      "installOwner": "SOUND_MUSIC_AUDIO",
      "proofOwner": "SOUND_MUSIC_AUDIO",
      "runtimeOwner": "WORKER_RUNTIME_JOBS after future approval",
      "blockedRuntimeGates": [
        "no_install",
        "no_execution",
        "no_media_processing",
        "no_runtime_readiness",
        "no_beta_or_production"
      ],
      "proofPhaseAllowedNext": "SOUND-OSS-TOOLS-2 approved install plan, no execution."
    }
  ],
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

| Tool | License | Confidence | Proof phase allowed next |
| --- | --- | --- | --- |
| librosa | ISC | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| audioread | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| pydub | MIT; optional FFmpeg handoff | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| scipy_signal | BSD-3-Clause | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| resampy | ISC | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| pyloudnorm | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| audioflux | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| music21 | BSD-3-Clause | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| pretty_midi | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| mido | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| noisereduce | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| signalsmith_stretch | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| pedalboard | Apache-2.0 | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| pydub_effects | MIT; optional FFmpeg handoff | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| ebu_r128_pyloudnorm | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
| mir_eval | MIT | medium | SOUND-OSS-TOOLS-2 approved install plan, no execution. |
