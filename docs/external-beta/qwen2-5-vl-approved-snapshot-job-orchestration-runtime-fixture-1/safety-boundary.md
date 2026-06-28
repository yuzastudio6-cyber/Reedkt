# Qwen2.5-VL Approved Snapshot Job Orchestration Runtime Safety Boundary

Allowed in this packet:

- validate the approved-snapshot job orchestration source envelope;
- run the bounded Qwen product-route cold-start retry runner after explicit confirmation;
- write sanitized local evidence under `/tmp`;
- update docs/results with run IDs, artifact file names, byte counts, and SHA-256 checksums.

Not allowed:

- Supabase mutation;
- SQL execution;
- worker dispatch or worker execution;
- credit mutation or credit spend;
- media processing;
- signed URL or public artifact creation;
- final render/export;
- external beta, paid production, or production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, worker execution, worker dispatch, route execution outside the bounded Qwen product-route fixture, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Docker execution, Remotion execution, FFmpeg/FFprobe execution, or broad service-role handler was enabled.
