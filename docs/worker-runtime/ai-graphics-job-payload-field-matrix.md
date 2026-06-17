# AI Graphics Job Payload Field Matrix

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

| Field | Required | Placeholder-only | Approval |
| --- | --- | --- | --- |
| `payloadId` | yes | yes | shape approved with warnings |
| `planSnapshotId` | yes | yes | approved plan snapshot required |
| `scopedToolCallManifestId` | yes | yes | scoped manifest required |
| `ownerId` | yes | no | `AI_TOOLS_CREATIVE_GRAPHICS` |
| `capabilityId` | yes | no | one approved AI graphics metadata capability |
| `toolId` | yes | no | one of 13 accepted tools |
| `privateArtifactManifestRef` | yes | yes | private artifact ref required |
| `privateArtifactScope` | yes | no | private only |
| `checksumRef` | yes | yes | checksum placeholder required |
| `validationFixtureRef` | yes | yes | validation-only fixture ref |
| `workerJobRef` | yes | yes | placeholder only |
| `claimPlaceholderRef` | yes | yes | no real job claim |
| `leasePlaceholderRef` | yes | yes | no real lease mutation |
| `queuePlaceholderRef` | yes | yes | no queue execution |
| `blockedRuntimeFlags` | yes | no | all runtime flags false |
| `noExecutionProof` | yes | no | records blocked execution boundaries |
| `observabilityAuditRef` | yes | yes | future audit placeholder |
| `failClosedAssertions` | yes | no | fail closed outside approved scope |

No field authorizes worker execution, real job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, storage transfer, signed URL creation, public artifact creation, or beta/production unlock.
