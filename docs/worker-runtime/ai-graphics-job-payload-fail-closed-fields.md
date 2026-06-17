# AI Graphics Job Payload Fail Closed Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `failClosedAssertions`, `blockedIfMissingPlanSnapshot`, `blockedIfMissingScopedManifest`, `blockedIfUnscopedTool`, `blockedIfRuntimeRequested`, and `blockedIfPublicArtifactRequested`.

The payload must fail closed if any required placeholder is missing, if selected capability is outside the approved matrix, if runtime execution is requested, or if public artifact/signed URL source-of-truth is requested.
