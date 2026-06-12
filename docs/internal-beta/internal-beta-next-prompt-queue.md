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

## TRACKA-GD-GROUPB-HANDOFF-3 Queue Addendum

Completed queue item: `TRACKA-GD-GROUPB-HANDOFF-3 - Group B Private Preview Execution`

Result: `group_b_private_preview_local_passed_with_warnings`

Recommended next prompt: `TRACKA-GD-GROUPB-HANDOFF-4 - Group B Private Preview QA Review`

CROSS-BETA-0 remains `blocked_pending_workstream_gates`; `CROSS-BETA-1 - Internal Beta Execution Packet` remains deferred.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-2 Queue Update

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

Next recommended prompt: `TRACKA-GD-GROUPB-HANDOFF-3 - Group B Private Preview Execution`.

Fallback prompt: `TRACKA-GD-GROUPB-HANDOFF-2A - Group B Execution Packet Fixes`.

Parallel prompt: `GD-11 - Group C Package Runtime Review and Fixture Gate`.

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_execution_packet_ready_with_warnings / group_b_private_preview_not_executed`

Group B packet fixtures: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`

Capability: `none; Track A Group B creative graphics private preview execution packet only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-0 Queue Update

Handoff result: `tracka_groupb_handoff_ready_with_warnings`

Next recommended prompt: `TRACKA-GD-GROUPB-HANDOFF-1 - Private Preview Composition Plan for Group B Creative Graphics Fixtures`.

Fallback prompt: `GD-10A - Group B Fixture Evidence Fixes`.

Parallel future prompt: `GD-11 - Group C Package Runtime Review and Fixture Gate`.

Accepted with warnings: `anime_js_motion`, `lottie_web_overlays`, `remotion_graphics`

Fully accepted fixtures: none

Rejected/blocked fixtures: none

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_not_executed`

Capability: `none; Track A Group B creative graphics handoff review only`

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

## GD-10 Queue Update

Decision state: `group_b_partially_passed`

Next recommended prompt: `TRACKA-GD-GROUPB-HANDOFF-0 - Track A Group B Creative Graphics Handoff Review`.

Fallback prompt: `GD-10A - Group B Fixture Fixes`.

GD-10 evidence:

- `anime_js_motion`: executed; `anime_js_motion.motion-timing.json`
- `lottie_web_overlays`: `manifest_only`; `lottie_web_overlays.manifest-only.json`
- `remotion_graphics`: `manifest_only`; `remotion_graphics.manifest-only.json`
- Group B Track A handoff approved now: false
- Internal beta approved: false
- Capability: `none; Group B controlled local fixture execution only`
- Supabase update required: `docs/status only`
- Supabase update status: `docs_only`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
Remotion render/export: none
Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## TRACKA-GD-GROUPB-HANDOFF-1 Queue Update

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_2`

Next recommended prompt: `TRACKA-GD-GROUPB-HANDOFF-2 - Group B Private Preview Execution Packet`.

Fallback prompt: `TRACKA-GD-GROUPB-HANDOFF-1A - Group B Private Preview Planning Fixes`.

Parallel prompt: `GD-11 - Group C Package Runtime Review and Fixture Gate`.

Runtime unlock status: `group_b_partially_passed / tracka_groupb_handoff_ready_with_warnings / group_b_private_preview_plan_ready_with_warnings / group_b_private_preview_not_executed`

Capability: `none; Track A Group B creative graphics private preview composition plan only`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
