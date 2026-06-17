# SOUND-OSS-TOOLS-3 Controlled Dependency Install Result

Decision: `sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof`

SOUND-OSS-TOOLS-3 consumes merged PR #436 install planning and records exact direct Python package pins for the approved SOUND-owned subset. Dependency resolution was performed only inside a throwaway venv under `/private/tmp`; no import proof, binary proof, media processing, worker execution, route execution, provider/model call, Supabase action, SQL, signed URL, public artifact, beta unlock, production unlock, dry run pass, generated local fixture pass, or runtime readiness was performed or claimed.

```json sound-oss-tools-3-controlled-install-result
{
  "phase": "SOUND-OSS-TOOLS-3",
  "decision": "sound_oss_tools_3_controlled_dependency_install_completed_ready_for_binary_import_proof",
  "sourceBase": "954c45c8d3cd9c028289b4a4f451e56c3909d08f",
  "sourcePullRequests": {
    "pr418": "merged cross-chat ownership registry",
    "pr424": "merged SOUND-OSS-TOOLS-0 stack inventory",
    "pr431": "merged SOUND-OSS-TOOLS-1 license/provenance approval",
    "pr436": "merged SOUND-OSS-TOOLS-2 approved install plan"
  },
  "sourceEvidence": [
    "docs/cross-chat-tool-ownership-registry.md",
    "docs/sound-music-audio-cross-chat-duplicate-risk-register.md",
    "docs/sound-music-audio-open-source-tool-license-provenance-approval.md",
    "docs/sound-music-audio-open-source-tool-approved-install-plan-subset.md",
    "docs/sound-music-audio-open-source-tool-approved-install-plan.md",
    "docs/sound-music-audio-open-source-tool-dependency-change-forecast.md",
    "docs/sound-music-audio-open-source-tool-install-command-plan.md",
    "docs/sound-music-audio-open-source-tool-binary-import-proof-plan.md",
    "docs/sound-music-audio-open-source-tool-ci-rollback-plan.md",
    "docs/sound-music-audio-open-source-tool-install-exclusion-report.md",
    "docs/sound-oss-tools-2-approved-install-plan-validation-results.md"
  ],
  "approvedSourceCandidateCount": 16,
  "directManifestPackageCount": 13,
  "requirementsManifest": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "requirementsConvention": "scoped_worker_requirements_manifest",
  "pythonResolution": {
    "interpreter": "/Library/Frameworks/Python.framework/Versions/3.13/bin/python3",
    "pythonVersion": "3.13.13",
    "pipInitialVersion": "26.0.1",
    "tempVenvLocation": "/private/tmp/reeditpro-sound-oss-tools-3-pip-resolve-*",
    "resolverAction": "pip installed approved direct package names into a throwaway venv for version resolution only",
    "importProofCommandsRun": false,
    "mediaProcessingCommandsRun": false,
    "controlledDependencyResolutionCompleted": true
  },
  "directPackagePins": [
    {
      "toolId": "librosa",
      "packageName": "librosa",
      "version": "0.11.0",
      "manifestLine": "librosa==0.11.0"
    },
    {
      "toolId": "audioread",
      "packageName": "audioread",
      "version": "3.1.0",
      "manifestLine": "audioread==3.1.0"
    },
    {
      "toolId": "pydub",
      "packageName": "pydub",
      "version": "0.25.1",
      "manifestLine": "pydub==0.25.1"
    },
    {
      "toolId": "scipy_signal",
      "packageName": "scipy",
      "version": "1.17.1",
      "manifestLine": "scipy==1.17.1"
    },
    {
      "toolId": "resampy",
      "packageName": "resampy",
      "version": "0.4.3",
      "manifestLine": "resampy==0.4.3"
    },
    {
      "toolId": "pyloudnorm",
      "packageName": "pyloudnorm",
      "version": "0.2.0",
      "manifestLine": "pyloudnorm==0.2.0"
    },
    {
      "toolId": "audioflux",
      "packageName": "audioflux",
      "version": "0.1.9",
      "manifestLine": "audioflux==0.1.9"
    },
    {
      "toolId": "music21",
      "packageName": "music21",
      "version": "10.3.0",
      "manifestLine": "music21==10.3.0"
    },
    {
      "toolId": "pretty_midi",
      "packageName": "pretty_midi",
      "version": "0.2.11",
      "manifestLine": "pretty_midi==0.2.11"
    },
    {
      "toolId": "mido",
      "packageName": "mido",
      "version": "1.3.3",
      "manifestLine": "mido==1.3.3"
    },
    {
      "toolId": "noisereduce",
      "packageName": "noisereduce",
      "version": "3.0.3",
      "manifestLine": "noisereduce==3.0.3"
    },
    {
      "toolId": "pedalboard",
      "packageName": "pedalboard",
      "version": "0.9.23",
      "manifestLine": "pedalboard==0.9.23"
    },
    {
      "toolId": "mir_eval",
      "packageName": "mir_eval",
      "version": "0.8.2",
      "manifestLine": "mir_eval==0.8.2"
    }
  ],
  "approvedButNotManifested": [
    {
      "toolId": "pydub_effects",
      "status": "alias_covered_by_manifest_package",
      "coveredBy": "pydub",
      "reason": "SOUND-OSS-TOOLS-2 classifies this as documentation/alias planning only."
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "status": "alias_covered_by_manifest_package",
      "coveredBy": "pyloudnorm",
      "reason": "SOUND-OSS-TOOLS-2 classifies this as documentation/alias planning only."
    },
    {
      "toolId": "signalsmith_stretch",
      "status": "skipped_optional_source_binary_planning_only",
      "coveredBy": null,
      "reason": "SOUND-OSS-TOOLS-2 keeps this as future source/binary planning only, not a Python direct dependency."
    }
  ],
  "requiredExclusionsStillBlocked": {
    "demucs": "blocked_pending_model_weight_review",
    "rnnoise": "blocked_pending_owner_handoff",
    "essentia": "blocked_pending_legal_review",
    "pyrubberband": "blocked_pending_legal_review",
    "rubberband_cli": "blocked_pending_legal_review",
    "ffmpeg": "reference_only_track_a_runtime_owner",
    "ffprobe": "reference_only_track_b_runtime_owner"
  },
  "packageLockStatus": "unchanged_required",
  "packageJsonStatus": "diagnostic_script_added_only",
  "nextPrompt": "SOUND-OSS-TOOLS-4: binary/import proof, no media processing",
  "runtimeFlags": {
    "toolExecutionAllowed": false,
    "audioProcessingAllowed": false,
    "mediaProcessingAllowed": false,
    "providerCallsAllowed": false,
    "modelCallsAllowed": false,
    "workerExecutionAllowed": false,
    "routeExecutionAllowed": false,
    "supabaseMutationAllowed": false,
    "sqlAllowed": false,
    "dockerCloudRunAllowed": false,
    "signedUrlCreationAllowed": false,
    "publicArtifactCreationAllowed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  }
}
```

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
