# External Agent Handoff Contract

Decision: `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_handoff_contract`

Execution: `completed_docs_only_external_agent_handoff_no_runtime_execution`

Readiness: `ready_for_confirmation_gated_external_agent_dispatch_dry_run`

## Required Envelope

An external agent may only consume this contract for a later explicitly confirmation-gated generated-fixture dry run. The handoff must preserve:

- target project name: `Reeditpro`
- target project ref: `wmyyttnynmteqgcdishd`
- target class: `staging`
- route path: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute`
- worker source: `server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts`
- worker source ID: `worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered`
- persisted job ID: `job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1`
- persisted job type: `quality_check`
- payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`
- worker type: `gstreamer_mkvtoolnix_generated_fixture_worker`
- source execution packet run ID: `2026-07-02T16-27-38-186Z-1ce73813`
- runtime delegate run ID: `2026-07-02T16-27-38-291Z-a5f6a279`
- source QA decision: `qa_passed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_evidence`
- product-ready end-to-end local OSS tools: `0`

## Required Guards

The next external-agent dry run must include a new explicit confirmation gate. The approved next gate name is:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_DRY_RUN`

The external agent must not infer permission from install status, QA status, local `/tmp` artifacts, prior route invocation, or this handoff packet alone.

## Required Output Evidence

Any later dry run must produce sanitized local evidence only:

- run ID
- local output directory under `/tmp`
- envelope JSON filename, byte count, SHA-256
- manifest JSON filename, byte count, SHA-256
- QA report JSON filename, byte count, SHA-256
- source chain references
- idempotency key
- cleanup policy
- rollback policy
- explicit safety booleans

Generated evidence must remain local and must not be committed.
