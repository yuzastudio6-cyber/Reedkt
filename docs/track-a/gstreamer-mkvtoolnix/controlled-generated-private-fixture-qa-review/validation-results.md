# Validation Results

Validation status: `blocked_host_resource_limit_no_space_left_on_device_requires_larger_validation_environment`

Validation blocker: `host_resource_limit_no_space_left_on_device_requires_larger_validation_environment`

Dependency validation result: `blocked`

Dependency validation current attempt: `not_run_disk_space_below_threshold`

Dependency validation reason: local `/Volumes/backup` has only about `9.4GiB` free, below the required `25GiB` threshold for retrying `npm ci`.

Prior dependency validation failure: local host returned repeated `ENOSPC: no space left on device` tar extraction errors during `npm ci`; partial generated `node_modules` state was removed and is not committed.

Blocked commands not run because the environment remains below the disk-space threshold: `npm ci --no-audit --no-fund --progress=false`, `npm run lint`, `npm run typecheck:server`, `npm run build`, and `npm run build:server`.

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

Feasible repair checks while the larger-environment blocker remains are limited to `git diff --check`, Node-built-in diagnostics, `git diff --cached --check`, and non-executing file-content safety scans.

Canonical QA decision: `tracka_gstreamer_mkvtoolnix_controlled_generated_private_fixture_qa_passed_ready_for_tracka_native_container_tools_rollup`

Internal repair status: `qa_passed_controlled_generated_private_fixture_execution_evidence`

Execution: `completed_docs_only_qa_review_no_runtime_execution`

QA scope: `source_evidence_review_only`

Private fixture execution in this phase: `false`

QA-phase GStreamer execution: `not_run`

QA-phase MKVToolNix execution: `not_run`

QA-phase Docker build/run: `not_run`

QA-phase FFmpeg/FFprobe execution: `not_run`
