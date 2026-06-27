# QWEN2.5-VL Fresh Source Import Plan

Next milestone: `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1`

## Import Scope

Allowed future import scope:

- QWEN2.5-VL fail-closed worker source needed for structured fixture output parsing.
- CPU caller source needed to require structured fixture metadata for future smoke success.
- QWEN structured-output docs, source evidence docs, and smoke tests.
- Mock/status adapters that expose readiness as blocked until a later confirmed structured-output smoke retry passes.
- A diagnostics script and package scripts for the imported smokes.

Disallowed future import scope in that packet unless separately justified:

- Cloud Build execution.
- Docker build or push.
- Cloud Run deploy or invocation.
- Identity token fetch.
- Model import/load or vLLM initialization.
- Provider/model call.
- Worker dispatch.
- Supabase mutation or SQL execution.
- Generated assets, signed URLs, public artifacts, media processing, render/export, credit mutation, beta unlock, or production unlock.

## Runtime Gate

Future runtime execution must require an explicit confirmation gate and approved snapshot/private artifact/credit and secret-boundary proof. The source import does not enable QWEN runtime, generated assets, public access, broad beta, external production, or final delivery.

Product-ready end-to-end local OSS tools: `0`
