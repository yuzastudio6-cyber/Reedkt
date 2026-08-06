# Canonical Private Final-Artifact QA

Status: private single-host internal-test evidence

This slice gives `run_final_qa` a real downstream media input. It validates the rendered private final MP4; it does not re-read the original upload and does not authorize public export.

## Execution contract

- The approved final-QA work item uses only `ffprobe` and the exact `final_export_v1` frame-counted inspection profile.
- It has no source-object binding and exactly one dependency: the required private final-composition MP4.
- A worker lease is issued only after the dependency has a completed execution fence, passed artifact QA, private-test reconciliation, and exact private-object verification.
- The media coordinator reads the dependency through the active lease. No artifact ID, storage path, URL, bytes, source object, or command comes from the caller.
- The coordinator resolves the dependency job's immutable `render_final_export` work item and derives width, height, fps, and frame count from its validated Remotion final-composition payload.
- Pinned ffprobe verifies H.264, yuv420p, BT.709, exact dimensions/fps/frame count, AAC, 48 kHz audio, one-or-two channels, positive duration, and at most two frames of duration drift.
- The JSON report is stored create-only, receives passed QA and private-test reconciliation, and is returned through the canonical job adapter with explicit dependency-input and final-QA evidence.
- Adapter replay returns the same artifact and does not start another ffprobe execution.

## Boundaries

The result grants no further render, public delivery, production render, provider call, credit spend, wallet mutation, settlement, billing, Supabase, deployment, external-beta, or product-ready authority. Terminal private-review assembly remains a separate gate.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
