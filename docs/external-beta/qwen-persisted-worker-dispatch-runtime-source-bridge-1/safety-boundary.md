# QWEN Persisted Worker Dispatch Runtime Source Bridge Safety Boundary

Packet: `RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1`

This phase is backend-only source bridge work.

Allowed in this phase:

- TypeScript source contract.
- Smoke test for bridge validation.
- Diagnostics and documentation.

Not allowed in this phase:

- route invocation
- provider/model call
- QWEN inference
- worker dispatch
- worker execution
- Cloud Run job execution
- Cloud Run service update
- Secret Manager payload access
- Supabase mutation
- SQL execution
- credit mutation
- signed URL creation
- public artifact creation
- media processing
- final render/export
- broad external beta unlock
- paid production unlock
- production unlock

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN inference, model import, model load, vLLM engine initialization, worker execution, worker dispatch, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, persistent credit reservation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, broad external beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, direct adapter shortcut, or broad service-role handler was enabled.
