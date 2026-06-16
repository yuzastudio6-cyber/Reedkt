# Sound/Music/Audio Open-Source Tool Install Command Plan

Future install command candidates only. Every command is marked proposed_not_executed and DO_NOT_RUN_IN_THIS_PROMPT.

Decision: `sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install`

```json sound-oss-tools-2-install-command-plan
{
  "phase": "SOUND-OSS-TOOLS-2",
  "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "commandCount": 16,
  "commands": [
    {
      "toolId": "librosa",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install librosa==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "audioread",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install audioread==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "pydub",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install pydub==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "scipy_signal",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install scipy==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "resampy",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install resampy==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "pyloudnorm",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install pyloudnorm==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "audioflux",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install audioflux==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "music21",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install music21==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "pretty_midi",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install pretty_midi==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "mido",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install mido==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "noisereduce",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install noisereduce==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "signalsmith_stretch",
      "commandCategory": "build from source or package review",
      "proposedCommand": "review packaged source/binary option for signalsmith_stretch; DO_NOT_RUN_IN_THIS_PROMPT",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "pedalboard",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install pedalboard==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "pydub_effects",
      "commandCategory": "documentation-only",
      "proposedCommand": "document alias pydub_effects against backing package pydub; DO_NOT_RUN_IN_THIS_PROMPT",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "commandCategory": "documentation-only",
      "proposedCommand": "document alias ebu_r128_pyloudnorm against backing package pyloudnorm; DO_NOT_RUN_IN_THIS_PROMPT",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
    },
    {
      "toolId": "mir_eval",
      "commandCategory": "pip install package",
      "proposedCommand": "pip install mir_eval==<approved-version>",
      "status": "proposed_not_executed",
      "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
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
