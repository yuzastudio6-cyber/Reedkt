# QWEN Product Route Provider Runtime Fixture 1R Confirmed Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED`

Decision: `blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start`

Execution: `confirmed_product_route_provider_runtime_fixture_attempted_fail_closed_restore_passed`

Base: `62a9700bacef02153097f0dd37ac973ed914fbca`

## Confirmed Attempt

The confirmed runner was executed with all required gates present:

- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE=true`
- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF=true`
- `REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`

Product-route backend handoff validation: `passed`

Delegated adapter fixture result: `blocked_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_failed`

Cloud Run execution: `reeditpro-qwen2-5-vl-private-caller-h2hdk`

Cloud Run job condition: `NonZeroExitCode`

HTTP status observed by caller: `502`

Service log finding: the QWEN service revision was still loading checkpoint shard `0/5` when the CPU caller failed, so the blocker is classified as a cold-start/readiness race rather than a schema, route, Supabase, SQL, public artifact, or product unlock failure.

Fail-closed restore: `passed`

Product-ready end-to-end local OSS tools: `0`
