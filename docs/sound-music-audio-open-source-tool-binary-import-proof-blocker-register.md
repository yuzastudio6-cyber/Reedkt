# Sound/Music/Audio Binary Import Proof Blocker Register

No blocking import or metadata failures were observed in SOUND-OSS-TOOLS-4. This register keeps the excluded and deferred tools explicit so later prompts do not confuse import proof with runtime readiness or ownership transfer.

```json sound-oss-tools-4-binary-import-proof-blocker-register
{
  "phase": "SOUND-OSS-TOOLS-4",
  "decision": "sound_oss_tools_4_binary_import_proof_passed_with_warnings_ready_for_synthetic_fixture_validation_plan",
  "blockingFailureCount": 0,
  "warningCount": 2,
  "register": [
    {
      "toolId": "demucs",
      "packageName": "demucs",
      "blockerType": "excluded_blocked_model_weight_review",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "PR #418 ownership registry and SOUND-OSS-TOOLS-1/2 blocked registers",
      "nextAction": "remain blocked pending model-weight and provenance review"
    },
    {
      "toolId": "rnnoise",
      "packageName": "rnnoise",
      "blockerType": "excluded_inactive_blocked_owner_handoff",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "PR #418 duplicate-risk register",
      "nextAction": "remain inactive unless source-of-truth changes"
    },
    {
      "toolId": "essentia",
      "packageName": "essentia",
      "blockerType": "excluded_blocked_legal_review",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "launch-tool-stack-update.md and SOUND-OSS-TOOLS-1/2 blocked registers",
      "nextAction": "remain future/evaluation only"
    },
    {
      "toolId": "pyrubberband",
      "packageName": "pyrubberband",
      "blockerType": "excluded_blocked_legal_review",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "SOUND-OSS-TOOLS-1/2 blocked registers",
      "nextAction": "remain excluded from SOUND-owned install/import proof"
    },
    {
      "toolId": "rubberband",
      "packageName": "rubberband",
      "blockerType": "excluded_blocked_legal_review",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "launch-tool-stack-update.md and SOUND-OSS-TOOLS-1/2 blocked registers",
      "nextAction": "remain excluded from SOUND-owned install/import proof"
    },
    {
      "toolId": "rubberband-cli",
      "packageName": "rubberband-cli",
      "blockerType": "excluded_blocked_legal_review",
      "errorSummary": "Not installed, imported, proven, or executed by SOUND-OSS-TOOLS-4.",
      "sourceOfTruth": "launch-tool-stack-update.md and SOUND-OSS-TOOLS-1/2 blocked registers",
      "nextAction": "remain excluded from SOUND-owned install/import proof"
    },
    {
      "toolId": "ffmpeg",
      "packageName": "ffmpeg",
      "blockerType": "reference_only_track_a_runtime_owner",
      "errorSummary": "No FFmpeg command or binary proof ran. pydub emitted an import-time availability warning only.",
      "sourceOfTruth": "PR #418 ownership registry and Track A render/export ownership",
      "nextAction": "remain outside SOUND-owned runtime proof"
    },
    {
      "toolId": "ffprobe",
      "packageName": "ffprobe",
      "blockerType": "reference_only_track_b_runtime_owner",
      "errorSummary": "No ffprobe command or binary proof ran.",
      "sourceOfTruth": "PR #418 ownership registry and Track B media processing ownership",
      "nextAction": "remain outside SOUND-owned runtime proof"
    },
    {
      "toolId": "signalsmith_stretch",
      "packageName": "signalsmith_stretch",
      "blockerType": "skipped_optional_source_binary_planning_only",
      "errorSummary": "No Python package was added by SOUND-OSS-TOOLS-3, so no import proof was attempted.",
      "sourceOfTruth": "SOUND-OSS-TOOLS-2 install plan",
      "nextAction": "defer to later source/binary planning"
    },
    {
      "toolId": "pydub",
      "packageName": "pydub",
      "blockerType": "non_blocking_import_warning",
      "errorSummary": "pydub import warned that FFmpeg/avconv was unavailable; import proof still passed and no media operation ran.",
      "sourceOfTruth": "SOUND-OSS-TOOLS-4 proof output",
      "nextAction": "carry warning into synthetic fixture planning"
    },
    {
      "toolId": "matplotlib_transitive_import",
      "packageName": "matplotlib",
      "blockerType": "non_blocking_import_message",
      "errorSummary": "A transitive import emitted a font-cache message; no repo-tracked file or media artifact was created.",
      "sourceOfTruth": "SOUND-OSS-TOOLS-4 proof output",
      "nextAction": "no action for SOUND-OSS-TOOLS-5"
    }
  ]
}
```
