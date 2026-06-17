# AI Graphics Job Payload Schema

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

The future payload shape is metadata-only and requires these top-level groups:

| Group | Required fields | Requirement |
| --- | --- | --- |
| identity | `payloadId`, `workstreamOwner`, `sourceOwners`, `toolId`, `capabilityId` | Placeholder ids only; owner must be `WORKER_RUNTIME_JOBS` with source owners `TOOL_ROUTE_EXECUTION` and `AI_TOOLS_CREATIVE_GRAPHICS`. |
| plan snapshot | `planSnapshotId`, `planSnapshotStatus`, `planSnapshotChecksumRef` | Must point to an approved plan snapshot placeholder. Workers must not consume raw chat. |
| scoped manifest | `scopedToolCallManifestId`, `scopedToolCallManifestVersion`, `allowedCapabilityRefs` | Must be scoped to the accepted tool/capability and fail closed outside scope. |
| private artifacts | `privateArtifactManifestRef`, `privateArtifactScope`, `checksumRef` | Public artifacts and signed URLs are not source of truth. |
| validation fixtures | `validationFixtureRef`, `validationCaseFamily` | Validation-only refs; actual local fixture execution remains false. |
| worker placeholders | `workerJobRef`, `claimPlaceholderRef`, `leasePlaceholderRef`, `queuePlaceholderRef` | Placeholders only; no job claim, lease mutation, or queue execution. |
| safety | `blockedRuntimeFlags`, `noExecutionProof`, `failClosedAssertions` | Must explicitly block runtime and unsafe output paths. |
| audit | `observabilityAuditRef`, `sourceEvidenceRefs`, `decisionState` | Must preserve PR #480/#478/#476/#464 evidence and this approval decision. |

The docs-only schema fixture is `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-shape.schema.json`; it is not executed.
