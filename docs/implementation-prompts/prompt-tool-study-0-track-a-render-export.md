# TOOL-STUDY-0 Track A Render Export Capability Routing Contract

Owner: `TRACK_A_RENDER_EXPORT`

Recommended branch: `codex/rp-tool-study-0-track-a-render-export`

Recommended PR title: `[tool-study] Track A render export capability routing contract`

Readiness target: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

## Owned Capabilities

- `final_composition_planning`
- `private_preview_planning`
- `render_manifest_policy`
- `export_manifest_policy`
- `caption_burnin_preview_route`
- `overlay_composition_handoff`
- `lower_third_title_card_composition_handoff`
- `transparent_overlay_intake`
- `ai_tools_asset_intake`
- `map_overlay_intake`
- `web_evidence_visual_intake`
- `track_b_media_analysis_intake`
- `sound_music_audio_intake`
- `final_artifact_qa_handoff`
- `private_review_artifact_policy`
- `future_export_delivery_policy`

## Explicitly Not Owned

- AI Tools creative asset generation.
- Remotion, D3, SVG, Satori, or graphics implementation.
- Track B media analysis/runtime.
- Raw media processing runtime.
- Worker Runtime execution.
- Provider/model calls.
- Supabase schema, RLS, migrations, or writes.
- Public artifact delivery unless a later policy approves it.
- Signed URL delivery unless a later policy approves it.
- Billing, credits, Stripe, or payment mutation.
- Production or external beta unlock.

## Related Workstreams

- `AI_TOOLS_CREATIVE_GRAPHICS`
- `TRACK_B_MEDIA_PROCESSING`
- `WORKER_RUNTIME_JOBS`
- `PROVIDER_GATEWAY_MODELS`
- `SUPABASE_RLS_STORAGE_DATABASE`
- `OBSERVABILITY_AUDIT_COST`
- `COMPLIANCE_SECURITY`
- `FRONTEND_PRODUCT_UX`
- `MAP_GEOSPATIAL`
- `WEB_SEARCH_CAPTURE`
- `SOUND_MUSIC_AUDIO`
- `BILLING_STRIPE_CREDITS`

## Allowed Scope

- Docs/diagnostics only.
- Track A route ownership and future prerequisites.
- Private manifest/checksum/source-of-truth policy.
- Approved-plan render intake and future worker handoff policy.
- Caption/subtitle/lower-third/overlay/map/web/graphics/audio intake policy.
- Final artifact QA handoff policy.

## Blocked Scope

- Track A runtime.
- Real final render/export.
- Real preview render execution.
- FFmpeg execution.
- Remotion execution.
- libass execution.
- OpenTimelineIO execution.
- Browser/canvas rendering.
- Asset generation.
- GCS upload or storage transfer.
- Supabase mutation.
- SQL, migrations, schema, or RLS changes.
- Provider/model calls.
- Tool execution.
- Worker execution.
- Route execution.
- Public artifacts.
- Signed URL creation.
- Credit/billing mutation.
- Internal beta, external beta, production, paid production, or broad media unlock.

## Required Docs And Files

- `README.md`
- `AGENTS.md`
- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `render-strategy-planner.md`
- `remotion-capability-matrix.md`
- `remotion-renderer-plan.md`
- `frame-layout-system.md`
- `caption-readability-motion-policy.md`
- `caption-visual-cue-timing.md`
- `timing-qa-policy.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `editing-asset-manifest.md`
- `docs/tool-studies/`
- `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md`
- `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md`
- `docs/activation-phase-provider-output-plan-snapshot-contract-results.md`

Record absent optional paths as `missing_on_base`; do not create unrelated `docs/runtime-unlock`, `docs/cross-chat`, `docs/agents`, or Supabase sync writers.

## Diagnostics

- Verify all Track A docs exist.
- Verify all required capability IDs are present.
- Verify `blocked_current_branch_missing_sync_layer` is recorded.
- Verify the exact no-scope statement is present.
- Verify the package script exists.
- Fail on positive claims enabling public artifacts, signed URL source-of-truth, raw prompt execution, worker/provider/tool/route execution, Supabase mutation, production/beta unlock, final render/export execution, preview render execution, FFmpeg execution, or Remotion execution.

## Validation

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent tool-study:track-a-render-export:diagnostics`
- `npm run build`
- `npm run build:server`
- changed-file safety scan
- staged safety scan
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`

## Final Response Format

- branch
- PR link
- draft status
- commit
- files changed
- source reads
- capabilities studied
- capability map
- tool combination map
- routing policy
- handoff contract
- internal beta gap map
- blocked-use register
- diagnostics
- validation
- package-lock
- no dependency mutation
- render/export status
- FFmpeg status
- Remotion status
- provider/model status
- tool/worker/route status
- Supabase classification
- Supabase milestone sync
- public artifact status
- signed URL status
- production/external beta status
- internal beta status
- cross-chat impact
- evidence docs
- blockers
- human action
- next prompt
- exact no-scope statement

## Exact No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
