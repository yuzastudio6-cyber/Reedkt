# Persistent Job Queue Dry-Run Contract

Queue name: `tracka-three-tool-external-agent-persistent-jobs`

Source no-op queue name: `tracka-three-tool-external-agent-noop`

Worker dispatch source ID: `externalBeta.trackaThreeTool.guardedNoopWorkerDispatchSource`

Worker kind: `tracka_three_tool_external_agent_worker`

Job type: `tracka_three_tool_external_agent_generated_fixture_execution`

Queue write mode: `metadata_only_dry_run_no_persistent_write`

Accepted response status: `accepted_three_tool_persistent_job_queue_dry_run_contract`

Payload shape validation: `passed`

Idempotency key validation: `passed`

Lease policy validation: `passed`

Artifact manifest placeholder validation: `passed`

Persistent job queue write: `false`

Worker lease claim: `false`

Worker dispatch: `false`

Worker execution: `false`

Raw command strings allowed: `false`
