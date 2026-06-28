# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1

Use after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED`.

Goal: repair the bounded QWEN product-route provider runtime fixture cold-start/readiness race without broadening product scope.

Required source evidence:

- `blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start`
- Cloud Run execution `reeditpro-qwen2-5-vl-private-caller-h2hdk`
- service log finding that the QWEN service was still loading checkpoint shard `0/5`
- fail-closed restore `passed`

Allowed repair directions:

- bounded readiness retry/backoff in the confirmed adapter fixture runner;
- bounded service warmup/readiness check that does not process arbitrary media;
- preserving fail-closed restore.

Forbidden: Supabase mutation, SQL, secret payload printing, arbitrary provider/model calls, public/signed artifacts, final render/export, external beta unlock, paid production, production, package-lock mutation, Docker execution, or broad worker dispatch.
