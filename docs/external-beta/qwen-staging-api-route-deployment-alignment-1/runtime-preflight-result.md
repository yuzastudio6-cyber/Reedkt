# QWEN Route Runtime Preflight Result After Alignment

Run ID: `2026-06-30T03-49-20-516Z-10d064e3`

Output directory: `/tmp/reeditpro-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1/2026-06-30T03-49-20-516Z-10d064e3`

Route: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`

Route ID: `providers.qwen25Vl.structuredVisualMetadataPlan`

Idempotency key: `qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1`

## Result

The confirmed bounded Cloud Run route preflight reached `reeditpro-staging-api-00008-4ct` and received HTTP `424` from the QWEN route-handler source contract.

Decision: `completed_confirmed_qwen_transport_runtime_preflight_route_reached_fail_closed_no_provider_execution`

Execution: `completed_bounded_cloud_run_route_preflight_fail_closed_no_provider_or_worker_execution`

Readiness: `passed_route_reached_fail_closed_no_provider_execution`

Next milestone: `RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1`

## Safety Readback

- Route handler reached: `true`
- QWEN2.5-VL execution: `false`
- Provider call: `false`
- Model call: `false`
- Worker execution: `false`
- Worker dispatch: `false`
- Service-role route execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Secret Manager payload access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Generated asset creation: `false`
- Credit mutation: `false`
- Final render/export: `false`
- Private/user media processing: `false`
- Broad external beta audience unlock: `false`
- Paid production unlock: `false`
- Production unlock: `false`

Product-ready end-to-end local OSS tools: `0`.
