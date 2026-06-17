# AI Graphics Local Fixture Gate Status QA Warning And Blocker Register

Decision: `tool_route_ai_graphics_metadata_local_fixture_gate_status_qa_passed_with_warnings`

| Warning or blocker | QA status | Required follow-up |
| --- | --- | --- |
| PR #471 remains draft/open | `warning` | Keep this PR draft while #471 remains draft. |
| Gate status is status-only | `accepted_with_warnings` | Use owner approval before any next handoff lane. |
| Worker handoff not yet accepted | `warning` | Review in a separate Worker Runtime handoff lane. |
| Track A output handoff still separate | `warning` | Remotion render/export remains Track A. |
| Browser/WebGL/canvas runtime blocked | `blocked` | Requires separate runtime gate. |
| Resvg rasterization blocked | `blocked` | Requires separate Linux import/raster policy lane. |
| Route execution blocked | `blocked` | Requires later explicit route execution planning and approval. |
| Actual tool execution blocked | `blocked` | Requires later explicit tool execution approval. |
| Supabase/GCS/signed URL/public artifact paths blocked | `blocked` | Keep artifact source of truth private and placeholder-only. |
| Internal beta, external beta, production blocked | `blocked` | No beta or production unlock in this lane. |
