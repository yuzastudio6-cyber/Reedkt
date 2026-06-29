# Controlled Real-Video OCR Safe-Zone Runbook

## Phase 37D Metadata Gate

1. Confirm PR #56 / Phase 37C remains clean and Phase 37C run `phase37c-20260530T230413` is the OCR runtime prerequisite.
2. Run the smoke, plan, report, and IAM-plan commands with Codex Node in PATH.
3. Confirm the report says `metadataPlanningPassed: true`.
4. Confirm `phase37EReady: false`, because caption/render integration remains blocked until a future controlled OCR execution phase passes.
5. Confirm no future execution confirmations are set in the shell.

## Future Execution Handoff

A later approved phase may use the selected Phase 37D sample only if it separately authorizes frame extraction, real-video OCR execution, and private artifact upload. That future phase must preserve the Phase 37C network/model-download guard, verify the Phase 37B checksums, block PP-LCNet auto-download, and fail closed on missing private source metadata.

Phase 37D itself is complete when metadata validation passes. It is not proof that OCR/caption collisions have been measured on real video.
