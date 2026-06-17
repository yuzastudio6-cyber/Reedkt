# AI Graphics Worker Job Payload Requirements

Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`

Future Worker Runtime planning may define a metadata-only job payload shape for the 13 AI graphics tools. The payload must be derived from approved snapshots and scoped manifests, not raw prompts.

## Required Placeholder Fields

| Requirement | Placeholder |
| --- | --- |
| Approved plan snapshot | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` |
| Scoped tool-call manifest | `<SCOPED_TOOL_CALL_MANIFEST_REF>` |
| Worker job payload | `<WORKER_JOB_PAYLOAD_FIXTURE>` |
| Private artifact manifest | `<PRIVATE_ARTIFACT_MANIFEST_REF>` |
| Checksum/provenance | `<CHECKSUM_REF>` |
| Owner id | `AI_TOOLS_CREATIVE_GRAPHICS` |
| Capability id | `<AI_GRAPHICS_CAPABILITY_ID>` |

Worker Runtime must reject any payload that includes executable route, tool, worker, provider, browser, WebGL, canvas, render/export, rasterization, Supabase, GCS, signed URL, public artifact, or raw prompt instructions.
