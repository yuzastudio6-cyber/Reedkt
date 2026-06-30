# Activation Phase: RP External Beta QWEN Staging API Route Deployment Alignment 1 Results

Packet: `RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1`

Decision: `completed_qwen_staging_api_route_deployment_alignment_current_source_bridge`

Execution: `completed_confirmed_staging_api_image_alignment_and_route_preflight_no_provider_execution`

## Result

The staging API route mismatch found by PR #1774 is closed. The deployed backend image used `src/server/server.ts` and `src/server/server-router.ts`, while the previous route existed only in the Express runtime path. This packet adds a single native server-router bridge for `POST /api/providers/qwen2-5-vl/structured-visual-metadata`, deploys the staging API image, and confirms the route now reaches the QWEN fail-closed handler with HTTP `424`.

Successful run ID: `2026-06-30T03-49-20-516Z-10d064e3`

Staging API revision: `reeditpro-staging-api-00008-4ct`

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:external-beta-qwen-route-align-1b-5cf82e6`

Image digest: `sha256:f3deaee047e8f5b9dda7835d1140900c7f4e1f33dc240ddc2743e820be27cf55`

## Evidence

- Cloud Build: `ef61e232-f563-4e16-bf3e-50b5878d1658`
- Report: `qwen-confirmed-transport-runtime-preflight-current-1-report.json`, `8672` bytes, SHA-256 `d5b6c436770d0c2af2c928ad71dda95601241213980006832ac61bf606108256`
- Manifest: `qwen-confirmed-transport-runtime-preflight-current-1-manifest.json`, `743` bytes, SHA-256 `c20c5060a5cf0e0803686a24f99a2c3dec9b6a2532c590972219ba47960bb75e`
- Generated artifacts committed: `none`
- Package-lock: `unchanged`

## Readiness

- QWEN transport runtime preflight: `passed_route_reached_fail_closed_no_provider_execution`
- QWEN2.5-VL execution: `blocked_pending_separate_confirmed_provider_runtime_packet`
- Provider/model call: `blocked_pending_separate_confirmed_provider_runtime_packet`
- Worker dispatch: `blocked_pending_separate_confirmed_worker_dispatch_packet`
- Broad external beta expansion: `blocked_no_additional_named_tester_list`
- External production: `blocked_pending_broad_beta_tool_runtime_billing_support_legal_security_and_final_export_gates`
- Product-ready end-to-end local OSS tools: `0`

Next milestone: `RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1`.

## Validation

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`: `passed`
- QWEN readiness, confirmed preflight, and route-alignment diagnostics: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`: `passed`
- non-executing changed/staged safety scan: `passed`

## Safety

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, IAM mutation, group membership mutation, or broad service-role handler was enabled. This phase performed confirmed Cloud Build, confirmed image-only Cloud Run staging API updates, and bounded route transport preflight only.
