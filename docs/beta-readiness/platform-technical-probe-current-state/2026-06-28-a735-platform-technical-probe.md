# Platform Technical Probe Current State - 2026-06-28

Decision: `beta_platform_technical_probe_passed_except_owner_stripe_and_human_approvals_ready_for_owner_approval_packet_collection`

Current source branch `codex/sound-music-audio-1abc-checkpoint` is at `a735228445fc267784fa561188cd4721b4d12fff`.

## Deployed Staging Services

- Normal API: `reeditpro-api-staging`, revision `reeditpro-api-staging-00009-bzf`, image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:api-staging-a735228445fc-20260628T1839Z`.
- Tool-readiness service: `reeditpro-tool-readiness-staging`, revision `reeditpro-tool-readiness-staging-00002-qdp`, image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-tool-readiness-staging:tool-readiness-staging-5d7bb4337a50-20260628T1451Z`.
- Both services are staging-only and authenticated-only.

## Tool Evidence Readback

Stored workspace evidence reports `productReadyLocalOssCount: 14`.

Accepted core tool evidence from the deployed tool-readiness service covers `ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `hyperframe`, `remotion`, `sharp`, `duckdb`, `polars`, `pyscenedetect`, `opencv`, `opencolorio`, and `openimageio`. Prior accepted `libass` evidence brings the count to 14.

External beta tool execution and production tool execution remain disabled.

## Platform Technical Probe

The normal staging API report-only platform probe passed 8 of 9 deployed technical checks:

- `tool_cost_events_migration_deployed`: passed
- `beta_readiness_evidence_migration_deployed`: passed
- `service_role_write_path_verified`: passed
- `authenticated_rls_member_readback_verified`: passed
- `idempotent_replay_verified`: passed
- `wallet_settlement_verified`: passed
- `monitoring_deployment_verified`: passed
- `staging_billing_qa_verified`: passed
- `stripe_boundary_owner_verified`: failed, because billing-owner approval is still missing

RLS readback evidence: authenticated workspace member read `tool_cost_events` for workspace `11111111-1111-4111-8111-111111111111` with HTTP 200 and 3 scoped rows; anonymous read returned HTTP 200 with 0 rows; client-side `beta_readiness_evidence_packets` read returned 0 rows.

Billing QA evidence: report `beta-platform-billing-qa-1758c655`, tool event `tool-cost-platform-qa-76d20892`, `billableEventCount: 0`, `summaryCredits: 0`, wallet settlement `65929de9-641b-4385-b096-684fb4d87e59`.

Monitoring evidence: 7 log metrics, 6 alert policies, and dashboard `projects/390722338345/dashboards/e60d0a5c-8618-432b-999e-0c07ffec58bc`.

## Remaining Gaps

The final platform evidence packet is still not ready. Missing approvals:

- Billing owner Stripe-boundary approval
- Deployment owner approval
- Security owner approval
- Storage/privacy owner approval
- Legal owner approval
- Monitoring owner approval
- Support owner approval

The blocked scopes remain `external_beta_tool_execution`, `paid_production_tool_execution`, `external_beta_launch`, `real_user_media_beta`, and `paid_production_launch`.

Safe forward progress remains allowed for source review, local dependency proof, bounded command/import/container proof, diagnostics and QA packets, deployment preflight and platform evidence collection, owner approval packet collection, and rollback/monitoring/support planning.

## Next Actions

1. Collect billing-owner Stripe-boundary approval for deployed staging tool-cost surfaces.
2. Collect deployment, security, storage/privacy, legal, monitoring, and support owner approvals with non-secret evidence notes.
3. Rerun the platform staging evidence probe with `recordEvidence=true` only after every probe and owner approval is present.
4. Record launch approval evidence and require final external-beta operator-status readback.
5. Keep real-user-media beta and paid production blocked until their separate scope approval evidence lanes pass.

No provider calls, user media processing, public artifact delivery, signed URL delivery, Stripe calls, external beta enablement, real-user-media beta enablement, or paid production enablement ran.
