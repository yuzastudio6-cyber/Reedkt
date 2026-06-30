# QWEN Confirmed Transport Runtime Preflight Current Result

Packet: `RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1`

Decision: `blocked_confirmed_qwen_transport_runtime_preflight`

Execution: `blocked_route_response_classification_no_provider_or_worker_execution`

Blocker: `blocked_route_response_classification_failed`

## Run

| Field | Value |
| --- | --- |
| Run ID | `2026-06-30T03-16-55-250Z-e8495c3f` |
| Output directory | `/tmp/reeditpro-rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1/2026-06-30T03-16-55-250Z-e8495c3f` |
| Operator account | `aiediting@reeditpro.com` |
| Google Cloud project | `reeditpro` |
| Region | `us-central1` |
| Target Supabase ref | `wmyyttnynmteqgcdishd` |
| Runtime scope | `approved_snapshot_structured_metadata_only` |

## Service Readback

| Service | Ready | Revision |
| --- | --- | --- |
| `reeditpro-staging-api` | `True` | `reeditpro-staging-api-00006-6gw` |
| `reeditpro-qwen2-5-vl-l4-worker` | `True` | `reeditpro-qwen2-5-vl-l4-worker-00037-658` |

## Route Request

- Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`
- Method/path: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`
- Idempotency key: `qwen-transport-runtime-preflight-current-1-single-tester-fixture-v1`
- Timeout: `30000ms`
- Fixture: `structured_metadata_only`
- Identity token mode: `user_account_default_audience`
- Token value printed: `false`
- Token value committed: `false`

## Response Classification

The bounded route request returned HTTP `404` with error code `not_found` and a sanitized message indicating the deployed staging API revision did not expose `/api/providers/qwen2-5-vl/structured-visual-metadata`.

This is recorded as `blocked_route_response_classification_failed`. It means the source route is present in the repository, but the currently deployed staging API revision is behind that source route. This blocker must be closed by a separately approved staging API route deployment/readback alignment packet before any QWEN provider/model runtime fixture.

## Safety Result

- Cloud Run service metadata readback: `completed_bounded`
- Identity token fetch: `completed_in_memory_token_not_printed`
- Bounded route request: `completed_once`
- Route handler reached: `false`
- QWEN2.5-VL execution: `false`
- Provider call: `false`
- Model call: `false`
- Worker execution: `false`
- Worker dispatch: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Secret Manager payload access: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Generated asset creation: `false`
- Credit mutation: `false`
- Stripe/payment processing: `false`
- Broad external beta unlock: `false`
- Production unlock: `false`
- Final render/export: `false`
- Private/user media processing: `false`

Product-ready end-to-end local OSS tools: `0`.
