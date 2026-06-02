# Phase 46A Media/Data Readiness Handoff

Phase 46A should move Track B product readiness forward without retrying VLM runtimes.

## Scope

Audit and plan deterministic media/data tooling:

- OpenCV for shape, contour, connected-component, and region extraction.
- PyAV for media container/frame access policy.
- PySceneDetect for scene segmentation readiness.
- Sharp/libvips for image processing readiness and dependency review.
- DuckDB for local/report data aggregation.
- Polars for DataFrame metrics and QA summaries.

## Constraints

- No VLM runtime retries.
- No model downloads.
- No media processing.
- No Docker or cloud mutation.
- No provider calls.
- No beta or production unlock.
- No Track A.

## Handoff Goal

Produce approval/license/runtime availability evidence, privacy/storage policy, generated-fixture handoff, controlled real-video handoff, reporting/QA handoff, smoke/report CLIs, docs, and readiness updates.
