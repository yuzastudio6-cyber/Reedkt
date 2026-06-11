# CROSS-BETA-0 Next Prompt Queue

Prompt: `CROSS-BETA-0`

Overall decision: `blocked_pending_workstream_gates`

Primary next prompt:

1. `GD-9 - Group B Package Runtime Review and Fixture Gate`

Owner follow-up prompts required before `CROSS-BETA-1 - Internal Beta Execution Packet`:

1. `MAP-1 - Map Geospatial Owner Confirmation for Cross-Beta`
2. `SOUND-0 - Sound Music Audio Owner Gate Evidence Packet`
3. `TRACKB-0 - Media Processing Owner Gate Evidence Packet`
4. `WORKER-0 - Worker Runtime Internal Beta Gate Evidence Packet`
5. `PROVIDER-0 - Provider Gateway Internal Beta Gate Evidence Packet`
6. `SUPABASE-0 - Current Supabase RLS Storage Database Gate Evidence Intake`
7. `OBS-0 - Observability Audit Cost Internal Beta Evidence Packet`
8. `COMPLIANCE-0 - Compliance Security Internal Beta Evidence Packet`
9. `FRONTEND-0 - Frontend Product UX Internal Beta Evidence Packet`
10. `BILLING-0 - Billing Stripe Credits Internal Beta Evidence Packet`

Deferred prompt:

- `CROSS-BETA-1 - Internal Beta Execution Packet`, only after the blocked and evidence-missing owner gates are resolved by later prompts.

## Scope

CROSS-BETA-0 does not approve or execute any owner prompt. It only records this queue.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-9 Queue Update

Decision state: `group_b_partially_ready_for_gd10`

Next recommended prompt: `GD-10 - Group B Controlled Local Fixture Execution`.

Fallback prompt: `GD-9A - Group B Runtime Gate Fixes`.

GD-10 should use the GD-9 classifications:

- `anime_js_motion`: `approved_for_gd10_controlled_local_fixture_execution`
- `lottie_web_overlays`: `approved_for_gd10_manifest_only_fixture`
- `remotion_graphics`: `approved_for_gd10_manifest_only_fixture`

Runtime review status: `group_b_runtime_import_review_passed`
Fixture gate status: `group_b_fixture_gate_created`
Group B fixture execution: none
Remotion render/export: none
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
