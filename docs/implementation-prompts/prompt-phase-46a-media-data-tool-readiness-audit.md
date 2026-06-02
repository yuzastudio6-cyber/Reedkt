# Phase 46A Media/Data Tool Readiness Audit Prompt

You are continuing ReeditPro, a professional AI video editing system. We are using Codex, not Cursor.

You are responsible for Track B only:

- Media/data hardening: OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, Polars.
- OCR/VLM handoff policy only where deterministic media/data outputs support later QA.

Do not work on Track A unless explicitly asked.

This prompt is only for Phase 46A media/data tool readiness audit. Do not retry VLM runtimes.

## Current Context

Phase 39C VLM generated runtime verification remains blocked after Qwen/vLLM and Qwen/SGLang attempts. The approved next product-forward path is deterministic media/data readiness unless a human explicitly approves a VLM recovery path.

## Task

Implement Phase 46A media/data tool readiness audit end to end:

- Inspect repo state and existing docs.
- Capture source/license/runtime evidence for OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars.
- Do not install packages unless explicitly approved.
- Do not process media.
- Do not run Docker, Cloud Build, Cloud Run, GPU jobs, IAM mutation, provider calls, model downloads, or VLM runtimes.
- Add server-only report modules and package scripts.
- Add smoke coverage proving no media/model/cloud/provider execution.
- Add docs/readiness/roadmap updates.
- Keep production, beta, public output, broad media, arbitrary media, provider calls, and Track A blocked.

## Expected Scripts

- `activation:media-data-readiness:plan`
- `activation:media-data-readiness`
- `activation:media-data-readiness:report`
- `activation:media-data-readiness:summary`
- `smoke:activation-media-data-readiness`

## Expected Reports

- approval/license evidence
- runtime/tool availability audit
- storage/privacy policy
- generated-fixture handoff
- controlled real-video handoff
- reporting/QA handoff
- blocker matrix
- readiness summary

## Validation

Run smoke/report/readiness summaries, lint, server typecheck, TypeScript build, app build, server build, and diff checks. Package-lock should remain unchanged unless an explicitly approved package operation requires a justified update.
