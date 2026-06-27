# Runtime Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1`

Decision: `completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture`

Execution: `completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore`

## Confirmed Run

- Run ID: `qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d`
- Local evidence directory: `/var/folders/y2/tffpcrt16qz6ndjsjrpqxrz40000gn/T/reeditpro-qwen2-5-vl-external-beta-confirmed-adapter-runtime-fixture-1/qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d`
- Project: `reeditpro`
- Region: `us-central1`
- Service: `reeditpro-qwen2-5-vl-l4-worker`
- Caller job: `reeditpro-qwen2-5-vl-private-caller`
- Execution: `reeditpro-qwen2-5-vl-private-caller-9mts6`
- HTTP status: `200`
- Service reason: `qwen_fixture_inference_smoke_completed`
- Elapsed time: `360401ms`

## Structured Metadata Result

- `parsedJson=true`
- `schemaValid=true`
- `structuredMetadataOutputAccepted=true`
- `runtimeContractExecutesNow=true`
- `modelInferenceEnabled=true`
- `rawOutputStoredInRepo=false`
- Schema version: `qwen_fixture_visual_metadata_v1`
- Object count: `3`
- Text-like region count: `1`
- Spatial relation count: `2`
- Blocked action count: `4`
- Output text SHA-256: `f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`

## Runtime Side Effects

Expected bounded runtime actions:

- private Cloud Run invocation attempted;
- identity token fetched but not printed;
- service runtime request sent;
- model import/load and vLLM engine initialized for the approved fixture;
- inference run for structured metadata only.

Forbidden side effects remained false:

- generated assets created: `false`
- public artifacts created: `false`
- signed URLs created: `false`
- Supabase touched: `false`
- SQL executed: `false`
- workers dispatched: `false`
- credit mutation created: `false`

External beta unlocked in this phase: `false`

Product-ready end-to-end local OSS tools: `0`
