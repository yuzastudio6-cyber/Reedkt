# Validation Results

Validation status: `blocked_host_resource_limit_no_space_left_on_device_during_npm_ci`

Validation blocker: `host_resource_limit_no_space_left_on_device_during_npm_ci`

Dependency validation result: `blocked`

Dependency validation attempted command: `npm ci --no-audit --no-fund --progress=false`

Dependency validation failure: local host returned repeated `ENOSPC: no space left on device` tar extraction errors during `npm ci`; partial generated `node_modules` state was removed and is not committed.

Blocked commands not run after dependency failure: `npm run lint`, `npm run typecheck:server`, `npm run build`, and `npm run build:server`.

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

Feasible repair checks after the dependency blocker are limited to `git diff --check`, Node-built-in diagnostics, `git diff --cached --check`, and non-executing file-content safety scans.

Repair decision: `qa_passed_controlled_generated_private_fixture_execution_evidence`

Execution: `completed_docs_only_qa_review_no_runtime_execution`

QA scope: `source_evidence_review_only`

Private fixture execution in this phase: `false`

QA-phase GStreamer execution: `not_run`

QA-phase MKVToolNix execution: `not_run`

QA-phase Docker build/run: `not_run`

QA-phase FFmpeg/FFprobe execution: `not_run`
