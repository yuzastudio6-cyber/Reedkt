# Negative Cases

The future registered no-op source implementation must fail closed for these blocker states:

| Blocker | Required behavior |
| --- | --- |
| `blocked_missing_registered_noop_source_reference` | Reject missing registered no-op source metadata. |
| `blocked_invalid_registered_noop_source_state` | Reject source metadata that claims runtime execution. |
| `blocked_registered_noop_route_execution_attempt` | Reject any route execution attempt. |
| `blocked_registered_noop_worker_dispatch_attempt` | Reject any worker dispatch attempt. |
| `blocked_registered_noop_tool_execution_attempt` | Reject any GStreamer or MKVToolNix execution attempt. |
| `blocked_registered_noop_media_processing_attempt` | Reject any media processing attempt. |
| `blocked_registered_noop_public_or_signed_artifact_attempt` | Reject signed/public artifact attempts. |
| `blocked_registered_noop_delivery_or_unlock_attempt` | Reject beta/production/final delivery unlock attempts. |

The future implementation may only prove source metadata and fail-closed contracts. It must not use these blocker names as proof that execution occurred.
