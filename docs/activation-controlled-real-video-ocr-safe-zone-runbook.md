# Controlled Real-Video OCR Safe-Zone Runbook

## Phase 37D Metadata Gate

1. Confirm PR #56 / Phase 37C remains clean and Phase 37C run `phase37c-20260530T230413` is the OCR runtime prerequisite.
2. Run the smoke, plan, report, and IAM-plan commands with Codex Node in PATH.
3. Confirm the report says `metadataPlanningPassed: true`.
4. Confirm `phase37EReady: false`, because caption/render integration remains blocked until a future controlled OCR execution phase passes.
5. Confirm no future execution confirmations are set in the shell.

## Additional Execution Handoff

Additional execution reruns may use the selected Phase 37D sample only if they separately authorize frame extraction, real-video OCR execution, and private artifact upload in the current shell. Any rerun must preserve the Phase 37C network/model-download guard, verify the Phase 37B checksums, block PP-LCNet auto-download, and fail closed on missing private source metadata.

## Controlled Execution Result

Phase 37D controlled execution run `phase37d-20260531T002046` used the selected sample only, extracted exactly six local temp frames with OpenCV, ran CPU-only PaddleOCR/PaddlePaddle `3.0.0`, produced 11 OCR text regions, found zero lower-third caption-zone collisions, and uploaded 10 private JSON QA artifacts.

The execution result is proof only for this bounded sample/window. Phase 37E caption/render QA integration may now be planned, but it remains unimplemented. Arbitrary media OCR, broad real-video OCR, full-video OCR, raw frame upload, overlay upload, Track A, beta, production, providers, Cloud Run, Docker push, and GPU jobs remain blocked.
