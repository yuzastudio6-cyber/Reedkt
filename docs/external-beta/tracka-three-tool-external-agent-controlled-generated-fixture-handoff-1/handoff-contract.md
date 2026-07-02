# Three-Tool External-Agent Handoff Contract

Allowed handoff class: `controlled_generated_fixture_runtime_handoff_only`

External agents may use this packet only to prepare the next guarded generated-fixture execution packet. It does not authorize broad media, private/user media, public URL inputs, signed URL source-of-truth, public artifacts, final render/export, or paid production.

## Route And Gate Matrix

| Tool | Route path | Required gate for route/runtime execution | Allowed templates |
| --- | --- | --- | --- |
| `gstreamer_render_pipeline_support` | `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute` | `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true` | `gst_fakesrc_fakesink_no_media_healthcheck_v1`, `gst_controlled_generated_fixture_pipeline_v1` |
| `mkvtoolnix_container_validation` | `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute` | `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true` | `mkvmerge_generated_subtitle_only_package_v1`, `mkvmerge_identify_generated_subtitle_only_v1` |
| `gpac_mp4box_packaging_validation` | `/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute` | `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true` and `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION=true` | `mp4box_add_generated_subtitle_only_v1`, `mp4box_info_generated_subtitle_only_v1` |

Future combined execution packet gate: `REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION=true`

## Required External-Agent Envelope

Any future execution packet must preserve these fields in a sanitized request or job envelope:

- `workspaceId`
- `projectId`
- `approvedSnapshotId`
- `approvalRecordId`
- `creditOrNoSpendPolicyId`
- `jobId`
- `workerLeaseId`
- `workerEnvelopeId`
- `routeIdempotencyKey`
- `runtimePacketId`
- `runtimeExecutionId`
- `runtimeExecutionMode: controlled_generated_fixture_runtime_execution`
- `routeOwner: backend_service_role_only`
- `privateInputManifestId`
- `outputManifestSchemaId`
- `qaReportSchemaId`
- `cleanupPolicyId`
- `retentionPolicyId`
- `failurePolicyId`
- `nonPublicArtifactPolicyId`

The execution packet must fail closed if route registration, confirmation gates, idempotency key, approved snapshot reference, private input manifest, output manifest schema, QA report schema, cleanup policy, retention policy, failure policy, or non-public artifact policy is missing.
