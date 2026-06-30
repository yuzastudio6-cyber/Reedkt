# Worker Dry Run Envelope

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R`

Contract ID: `rp.externalBeta.gstreamerMkvtoolnix.agentExecution.v1`

Dry-run mode: `confirmed_worker_execution_contract_validation_only`

Runtime enabled: `false`

Worker dispatch enabled: `false`

Route execution enabled: `false`

Tool execution enabled: `false`

## Required References

- Approved plan snapshot: `approved-snapshot-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Approval record: `approval-record-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Credit/no-spend policy: `no-spend-fixture-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Job: `job-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Worker lease: `worker-lease-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Idempotency key: `idempotency-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Private input manifest: `private-input-manifest-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Output manifest schema: `output-manifest-schema-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- QA report schema: `qa-report-schema-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Cleanup policy: `cleanup-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Retention policy: `retention-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Failure policy: `failure-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r`
- Audit parent: `audit-event-parent-gstreamer-mkvtoolnix-external-agent-dry-run-1r`

## Allowed Command Templates Named

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Raw command strings allowed: `false`

Public URL source-of-truth: `false`

Signed URL source-of-truth: `false`

Arbitrary private media: `false`

Provider/model prompt payload: `false`

Service-role secret payload: `false`
