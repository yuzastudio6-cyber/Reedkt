# AI Graphics Metadata Integration Blocked-Use Register

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

| Blocked use | Status | Reason |
| --- | --- | --- |
| Dependency install or package-lock mutation | `blocked` | Batch 1-3 dependency proof already exists; this packet is docs/static diagnostics only. |
| Import smoke or synthetic fixture execution | `blocked` | No new proof execution belongs to this approval packet. |
| Actual tool execution | `blocked` | Tool Route metadata intake is not executable tool runtime. |
| Route execution | `blocked` | Route metadata integration requires later Tool Route QA and execution approval. |
| Worker execution, job claims, queues | `blocked` | Worker handoff remains future-only. |
| Provider/model runtime | `blocked` | AI graphics package proof is separate from provider/model execution. |
| Browser/WebGL/canvas runtime | `blocked` | Batch 3 packages remain manifest-only. |
| Resvg rasterization | `blocked` | Batch 4 policy kept rasterization separately gated. |
| Remotion render/export | `blocked` | Track A owns render/export handoff. |
| Supabase mutation or SQL | `blocked` | Supabase classification is `no write` / `docs_only`. |
| GCS/storage transfer | `blocked` | Artifact refs are placeholders only. |
| Signed URLs and public artifacts | `blocked` | Signed URLs are not source of truth and public artifacts remain blocked. |
| Raw prompt execution | `blocked` | Workers and routes consume approved snapshots and scoped manifests, not raw prompts. |
| Internal/external beta and production | `blocked` | This packet is not launch readiness. |

No dependency install, package-lock mutation, import smoke execution, synthetic fixture execution, resvg rasterization, Remotion render/export, browser runtime, WebGL runtime, canvas runtime, actual tool execution, route execution, worker execution, provider/model calls, Supabase mutation, SQL, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
