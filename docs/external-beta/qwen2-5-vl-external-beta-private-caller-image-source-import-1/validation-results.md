# Validation Results

Decision: `completed_qwen2_5_vl_private_caller_image_source_import_ready_for_guarded_structured_output_smoke_retry`

Execution: `completed_fail_closed_image_source_import_no_build_or_runtime_execution`

## Validation

Recorded validation for this packet:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run smoke:qwen2-5-vl-external-beta-structured-output-source-import-1`
- `npm run --silent rp-qwen2-5-vl-external-beta-structured-output-source-import-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-stack-integration-rollup-1:diagnostics`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

## Status

- QWEN runtime: `blocked_pending_guarded_structured_output_smoke_retry`
- CPU caller image source: `ready_for_guarded_rebuild_update_before_smoke_retry`
- Product-ready end-to-end local OSS tools: `0`
- Package-lock: `unchanged`
- Generated artifacts committed: `none`

## Safety

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Cloud Run deployment, Cloud Run invocation, identity-token fetch, QWEN model load, vLLM initialization, Docker build, Docker push, Docker execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
