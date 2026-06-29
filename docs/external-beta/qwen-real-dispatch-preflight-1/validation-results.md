# QWEN Real Dispatch Preflight Validation Results

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-PREFLIGHT-1`

Decision: `blocked_pending_qwen_real_dispatch_preflight_confirmation`

Execution: `completed_qwen_real_dispatch_preflight_gate_source_no_runtime_execution`

Validation status: `full_validation_passed`

Required validation commands:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-preflight-1`: `passed`
- `npm run --silent rp-external-beta-qwen-real-dispatch-source-import-scope-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-real-dispatch-mock-only-source-import-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-real-dispatch-preflight-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Confirmation provided: `false`

Product-ready end-to-end local OSS tools: `0`.

No full draft stack import, PR merge, retarget, branch rewrite, worker runtime source import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
