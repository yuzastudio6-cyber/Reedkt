# CROSS-BETA-0 Internal Beta Blocker Register

Prompt: `CROSS-BETA-0`

Overall decision: `blocked_pending_workstream_gates`

| Blocker ID | Workstream | Status | Reason | Required follow-up |
| --- | --- | --- | --- | --- |
| `cross_beta_ai_tools_group_b_missing` | `AI_TOOLS_CREATIVE_GRAPHICS` | `blocked` | Anime.js, Lottie-web, and Remotion Group B runtime lanes need package/runtime review before internal beta coverage. | `GD-9 - Group B Package Runtime Review and Fixture Gate` |
| `cross_beta_ai_tools_group_c_blocked` | `AI_TOOLS_CREATIVE_GRAPHICS` | `blocked` | PixiJS and Three.js Group C remain blocked for a later canvas/3D-specific approval path. | `GD-10 - Group C Canvas/3D Fixture Gate` |
| `cross_beta_resvg_rasterization_blocked` | `AI_TOOLS_CREATIVE_GRAPHICS` | `blocked` | `resvg_js_svg_rasterization` remains blocked or host-specific and is not accepted for broader internal beta coverage. | `GD-8B - resvg Alternative Runtime Review` if raster output is required |
| `cross_beta_tracka_final_export_blocked` | `TRACK_A_RENDER_EXPORT` | `blocked` | Accepted creative graphics lane is not final render/export readiness. | Track A final render/export readiness gate |
| `cross_beta_map_owner_confirmation_missing` | `MAP_GEOSPATIAL` | `warning` | Phase 50G evidence is ready with warnings, but owner confirmation is not recorded in CROSS-BETA-0. | `MAP-1 - Map Geospatial Owner Confirmation for Cross-Beta` |
| `cross_beta_sound_owner_gate_missing` | `SOUND_MUSIC_AUDIO` | `blocked` | Phase 52G requires owner handoff. | `SOUND-0 - Sound Music Audio Owner Gate Evidence Packet` |
| `cross_beta_trackb_partial_gate` | `TRACK_B_MEDIA_PROCESSING` | `blocked` | Phase 52G records partial owner handoff required. | `TRACKB-0 - Media Processing Owner Gate Evidence Packet` |
| `cross_beta_worker_no_go` | `WORKER_RUNTIME_JOBS` | `blocked` | Phase 52G records no-go for execution. | `WORKER-0 - Worker Runtime Internal Beta Gate Evidence Packet` |
| `cross_beta_provider_no_go` | `PROVIDER_GATEWAY_MODELS` | `blocked` | Phase 52G records no-go for execution. | `PROVIDER-0 - Provider Gateway Internal Beta Gate Evidence Packet` |
| `cross_beta_supabase_current_evidence_missing` | `SUPABASE_RLS_STORAGE_DATABASE` | `blocked` | Later Supabase/RLS/storage/database 20-26 evidence and owner gate docs are absent on this base. | `SUPABASE-0 - Current Supabase RLS Storage Database Gate Evidence Intake` |
| `cross_beta_observability_evidence_missing` | `OBSERVABILITY_AUDIT_COST` | `evidence_missing` | Owner-gate evidence is missing. | `OBS-0 - Observability Audit Cost Internal Beta Evidence Packet` |
| `cross_beta_compliance_evidence_missing` | `COMPLIANCE_SECURITY` | `evidence_missing` | Owner-gate evidence is missing. | `COMPLIANCE-0 - Compliance Security Internal Beta Evidence Packet` |
| `cross_beta_frontend_evidence_missing` | `FRONTEND_PRODUCT_UX` | `evidence_missing` | Owner-gate evidence is missing. | `FRONTEND-0 - Frontend Product UX Internal Beta Evidence Packet` |
| `cross_beta_billing_evidence_missing` | `BILLING_STRIPE_CREDITS` | `evidence_missing` | Owner-gate evidence is missing. | `BILLING-0 - Billing Stripe Credits Internal Beta Evidence Packet` |

## Gate Impact

Full internal beta approved now: false
External beta approved: false
Production approved: false

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

