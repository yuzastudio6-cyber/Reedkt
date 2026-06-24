# Validation Results

Validation status: `full_validation_passed_after_disk_space_closure`

Validation blocker: `closed`

Dependency validation result: `passed`

Dependency validation current attempt: `completed_after_disk_space_closure`

Dependency validation disk status: local `/Volumes/backup` temporarily had about `44GiB` free before validation, above the required `25GiB` threshold; after build-output cleanup it had about `15GiB` free.

Prior dependency validation failure: local host returned repeated `ENOSPC: no space left on device` tar extraction errors during `npm ci`; partial generated `node_modules` state was removed and is not committed.

Validation closure commands passed: `npm ci --no-audit --no-fund --progress=false`, `git diff --check`, `npm run lint`, `npm run typecheck:server`, `npm run build`, `npm run build:server`, all listed GStreamer/MKVToolNix private fixture diagnostics, and `git diff --cached --check`.

Required repair validation commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent tracka:gstreamer-mkvtoolnix-private-fixture-execution-packet-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-qa-review-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-controlled-generated-private-fixture-execution-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-private-fixture-plan-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-private-fixture-approval-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-private-fixture-approval-1r:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-private-fixture-scope-decision-1r:diagnostics`
- `npm run tracka:gstreamer-mkvtoolnix-controlled-synthetic-fixture-proof-1:diagnostics`
- `git diff --cached --check`

Changed-file and staged safety scans are non-executing file-content scans only.

Generated build outputs and macOS sidecar files from validation were removed before commit.

Canonical QA decision: `tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup`

Internal repair status: `qa_passed_controlled_generated_private_fixture_execution_evidence`

Execution: `completed_docs_only_qa_review_no_runtime_execution`

QA scope: `source_evidence_review_only`

Private fixture execution in this phase: `false`

QA-phase GStreamer execution: `not_run`

QA-phase MKVToolNix execution: `not_run`

QA-phase Docker build/run: `not_run`

QA-phase FFmpeg/FFprobe execution: `not_run`
