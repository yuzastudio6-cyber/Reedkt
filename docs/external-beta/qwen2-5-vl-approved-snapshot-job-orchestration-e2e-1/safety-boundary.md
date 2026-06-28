# Qwen2.5-VL Approved Snapshot Job Orchestration Safety Boundary

This phase is backend-only source-contract work.

Allowed:

- source contract validation;
- smoke-test construction of in-memory orchestration envelopes;
- diagnostics and non-executing file-content safety scans;
- docs/results updates.

Not allowed in this phase:

- Qwen provider/model call;
- Cloud Run job execution;
- product route execution;
- worker dispatch or worker execution;
- Supabase mutation or SQL execution;
- credit mutation or credit spend;
- private or user media processing;
- signed URL or public artifact creation;
- final render/export;
- external beta, paid production, or production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Qwen runtime execution in this orchestration phase, Cloud Run execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
