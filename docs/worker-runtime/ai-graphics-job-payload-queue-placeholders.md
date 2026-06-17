# AI Graphics Job Payload Queue Placeholders

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must include `queuePlaceholderRef`, `queueNamePlaceholder`, `queuePriorityPlaceholder`, and `queueVisibilityPolicyRef` as placeholders only.

This packet does not approve queue creation, queue dispatch, queue execution, job claim, lease mutation, worker execution, or route/tool/provider runtime.
