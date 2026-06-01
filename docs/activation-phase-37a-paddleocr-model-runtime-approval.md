# Phase 37A PaddleOCR Model/Runtime Approval Results

Status: `staging_planning_approved`

Phase 37A adds a static PaddleOCR/PaddlePaddle approval workflow for OCR safe-zone planning. PaddleOCR is recommended for first generated UI/text frame OCR planning, PaddlePaddle is recorded as the required runtime planning candidate, and PP-OCRv5 detection/recognition/classifier assets are deferred to Phase 37B exact asset selection.

## Evidence

- PaddleOCR official repository: `https://github.com/PaddlePaddle/PaddleOCR`
- PaddleOCR official docs: `http://www.paddleocr.ai/main/en/index.html`
- PaddlePaddle official repository: `https://github.com/PaddlePaddle/Paddle`
- License recorded for planning: `Apache-2.0`

## Approved Planning Scope

- Generated UI/text frame OCR planning
- Caption safe-zone metadata planning
- Text/UI region detection planning
- Private artifact output planning

## Blocked

- OCR inference execution
- PaddleOCR model download
- PaddlePaddle runtime execution
- Runtime model auto-download
- Real media OCR and real video OCR
- Docker/GCP mutation and GPU jobs
- Provider calls, public output, and Revideo
- Production, external beta, and broad real media

## Phase Readiness

- Phase37B readiness: ready only for exact OCR asset selection/download planning.
- Phase37C readiness: blocked until exact OCR assets are downloaded/checksummed or pinned no-runtime-download packaging is proven.
- Phase37D readiness: blocked until generated OCR runtime verification passes.

## Validation

Run `npm run smoke:activation-ocr-model-approval-workflow`, the OCR plan/report/summary scripts, production readiness summaries, staging healthcheck summary, lint, build, server build, and `git diff --check`.
