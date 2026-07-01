# Dispatch Dry-Run Envelope

Envelope file: `narrow-controlled-worker-dispatch-dry-run-envelope.json`

Envelope SHA-256: `ac9ab8ff2ac5d50559caaafa38678cc87026b0a47ed43434af90d95f5b967ca2`

Envelope bytes: `7456`

The envelope contains sanitized metadata only:

- `dispatchDryRunId`
- `dispatchDryRunMode`
- `dispatchDryRunIdempotencyKey`
- `dispatchContractId`
- `dispatchAuditEventId`
- `workerRuntimeMode`
- `workerRuntimePacketId`
- `queueId`
- `queueIdempotencyKey`
- `queueStatusAtDryRun`
- `queueItemId`
- `dispatchId`
- `dispatchIdempotencyKey`
- `routeSourceId`
- `sourceIdempotencyKey`
- `jobId`
- `workerLeaseId`
- `commandTemplateId`
- `privateInputManifestId`
- `outputManifestSchemaId`
- `qaReportSchemaId`
- cleanup, retention, failure, retry, audit, and non-public artifact policy references.

The envelope records:

- Route execution in this dispatch dry run: `false`
- Worker dispatch in this dispatch dry run: `false`
- Worker execution in this dispatch dry run: `false`
- Worker process start in this dispatch dry run: `false`
- Worker lease claim in this dispatch dry run: `false`
- GStreamer execution in this dispatch dry run: `false`
- MKVToolNix execution in this dispatch dry run: `false`
- Persistent job queue write in this dispatch dry run: `false`
- Signed URL creation in this dispatch dry run: `false`
- Public artifact creation in this dispatch dry run: `false`
- Final render/export in this dispatch dry run: `false`
