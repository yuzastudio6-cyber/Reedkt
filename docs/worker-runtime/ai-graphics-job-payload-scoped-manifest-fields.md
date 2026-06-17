# AI Graphics Job Payload Scoped Manifest Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `scopedToolCallManifestId`, `scopedToolCallManifestVersion`, `allowedCapabilityRefs`, and `blockedCapabilityRefs`.

The scoped manifest must match the selected AI graphics metadata tool and fail closed outside the approved owner/capability/tool ids. This packet does not approve route execution or actual tool execution.
