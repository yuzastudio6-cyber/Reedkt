# Validation Results

Decision: `completed_qwen2_5_vl_stack_source_rollup_ready_for_fresh_fail_closed_source_import`

Validation status: `full_validation_passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

## Required Commands

- `npm ci --no-audit --no-fund --progress=false`: passed
- `git diff --check`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-stack-integration-rollup-1:diagnostics`: passed
- `npm run --silent rp-external-product-tool-runtime-stack-integration-triage-1:diagnostics`: passed
- `git diff --cached --check`: passed
- Non-executing changed-file and staged safety scans: passed

## Safety

No PR merge, retarget, close, branch rewrite, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, IAM mutation, Google Group membership mutation, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, QWEN2.5-VL execution, QWEN model import/load, vLLM initialization, Cloud Run deployment, Cloud Run invocation, identity token fetch, AI Graphics execution, Sound/tool execution, GStreamer execution in this phase, MKVToolNix execution in this phase, GPAC/MP4Box execution in this phase, VapourSynth execution in this phase, Revideo execution in this phase, FILM execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
