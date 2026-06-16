# Sound/Music/Audio Open-Source Tool Binary Import Proof Plan

Future proof command candidates only. These commands must not be run in SOUND-OSS-TOOLS-2 and must not process media or execute audio tools.

Decision: `sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install`

```json sound-oss-tools-2-binary-import-proof-plan
{
  "phase": "SOUND-OSS-TOOLS-2",
  "decision": "sound_oss_tools_2_approved_install_plan_ready_for_controlled_dependency_install",
  "proofPlanCount": 16,
  "proofs": [
    {
      "toolId": "librosa",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import librosa\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for librosa",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for librosa",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "audioread",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import audioread\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for audioread",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for audioread",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "pydub",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import pydub\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for pydub",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for pydub",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "scipy_signal",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import scipy.signal\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for scipy",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for scipy",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "resampy",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import resampy\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for resampy",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for resampy",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "pyloudnorm",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import pyloudnorm\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for pyloudnorm",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for pyloudnorm",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "audioflux",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import audioflux\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for audioflux",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for audioflux",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "music21",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import music21\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for music21",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for music21",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "pretty_midi",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import pretty_midi\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for pretty_midi",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for pretty_midi",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "mido",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import mido\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for mido",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for mido",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "noisereduce",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import noisereduce\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for noisereduce",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for noisereduce",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "signalsmith_stretch",
      "proofCommands": [
        {
          "target": "CLI path check",
          "proposedCommand": "signalsmith_stretch --version",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "binary version check",
          "proposedCommand": "inspect metadata for signalsmith-stretch source or packaged binding, deferred",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for signalsmith-stretch source or packaged binding, deferred",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "pedalboard",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import pedalboard\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for pedalboard",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for pedalboard",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "pydub_effects",
      "proofCommands": [
        {
          "target": "docs-only verification",
          "proposedCommand": "inspect metadata for pydub",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check on backing package",
          "proposedCommand": "inspect metadata for pydub",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "proofCommands": [
        {
          "target": "docs-only verification",
          "proposedCommand": "inspect metadata for pyloudnorm",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check on backing package",
          "proposedCommand": "inspect metadata for pyloudnorm",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
    },
    {
      "toolId": "mir_eval",
      "proofCommands": [
        {
          "target": "import check",
          "proposedCommand": "python -c \"import mir_eval\"",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "package metadata check",
          "proposedCommand": "inspect metadata for mir_eval",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        },
        {
          "target": "license metadata check",
          "proposedCommand": "inspect metadata for mir_eval",
          "status": "proposed_not_executed",
          "marker": "DO_NOT_RUN_IN_THIS_PROMPT"
        }
      ]
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
