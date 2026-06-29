# QWEN Real Dispatch Dry-Run Attempt Validation Results

Packet: `RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-DRY-RUN-ATTEMPT-1`

Decision: `blocked_gcloud_reauthentication_required_before_qwen_real_dispatch_dry_run_attempt`

Execution: `completed_transport_readback_attempt_no_runtime_invocation`

Validation status: `full_validation_passed`

Required validation commands:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `npm run smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-dry-run-attempt-1`: `passed`
- `npm run --silent rp-external-beta-qwen-real-dispatch-confirmed-preflight-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-real-dispatch-dry-run-attempt-1:diagnostics`: `passed`
- `git diff --cached --check`: `passed`
- non-executing changed-file and staged safety scans: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`.

No full draft stack import, PR merge, retarget, branch rewrite, worker runtime source import, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, Cloud Run invocation, Cloud Run deployment, identity token fetch, worker execution, worker dispatch, service-role route execution, route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
