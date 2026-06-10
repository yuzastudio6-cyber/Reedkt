# Creative Graphics Cross-Workstream Dependencies

Prompt: `TRACKA-GD-HANDOFF-7`

Lane readiness decision: `ready_with_warnings_for_cross_workstream_internal_beta_gate_review`

## Dependency Matrix

| Dependency | Required before full internal beta | Required before external beta | Owner | Current status | Next prompt |
| --- | --- | --- | --- | --- | --- |
| Group B creative graphics tools | yes | yes | `AI_TOOLS_CREATIVE_GRAPHICS` | `needs_package_review` | `GD-9 - Group B Package Runtime Review and Fixture Gate` |
| Group C creative graphics tools | yes if included in internal beta scope | yes | `AI_TOOLS_CREATIVE_GRAPHICS` | `blocked` | future canvas/3D review prompt |
| resvg/SVG runtime decision | yes if rasterization is required | yes | `AI_TOOLS_CREATIVE_GRAPHICS` and `TRACK_A_RENDER_EXPORT` | `local_darwin_native_blocker` context remains | future resvg/SVG runtime decision prompt |
| Map/geospatial lane | yes if map visuals are in scope | yes | `MAP_GEOSPATIAL` | not reviewed by Handoff-7 | cross-workstream gate review |
| Sound/music lane | yes if sound/music is in scope | yes | `SOUND_MUSIC_AUDIO` | not reviewed by Handoff-7 | cross-workstream gate review |
| Track B media processing lane | yes | yes | `TRACK_B_MEDIA_PROCESSING` | not reviewed by Handoff-7 | cross-workstream gate review |
| Worker runtime lane | yes | yes | `WORKER_RUNTIME_JOBS` | worker execution remains blocked | cross-workstream gate review |
| Provider/model lane | yes | yes | `PROVIDER_GATEWAY_MODELS` | provider/model calls remain blocked | cross-workstream gate review |
| Supabase/staging/RLS lane | yes | yes | `SUPABASE_RLS_STORAGE_DATABASE` | docs/status only in Handoff-7 | cross-workstream gate review |
| Observability/audit/cost lane | yes | yes | `OBSERVABILITY_AUDIT_COST` | local evidence reviewed only | cross-workstream gate review |
| Frontend/product UX lane | yes | yes | `FRONTEND_PRODUCT_UX` | not reviewed by Handoff-7 | cross-workstream gate review |
| Compliance/security lane | yes | yes | `COMPLIANCE_SECURITY` | no public artifact or secret exposure claimed | cross-workstream gate review |

## Ownership Boundary

Handoff-7 owner: `TRACK_A_RENDER_EXPORT`

Source workstream: `AI_TOOLS_CREATIVE_GRAPHICS`

Handoff-7 does not own AI Tools generation, Group B/Group C runtime execution, provider/model execution, worker runtime execution, Track B media processing, Supabase mutation, storage upload, signed URL delivery, public artifact delivery, full internal beta approval, external beta approval, or production approval.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

