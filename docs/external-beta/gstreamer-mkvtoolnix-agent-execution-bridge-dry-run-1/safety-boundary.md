# Safety Boundary

The bridge dry run is a confirmation-gated request-envelope validation only.

Allowed in this phase:

- import and validate the backend-source bridge contract;
- validate approved snapshot, approval record, no-spend fixture policy, job, worker lease, idempotency, command-template, private manifest, output manifest, QA, cleanup, retention, failure, audit, and runtime evidence refs;
- write sanitized local `/tmp` JSON report, manifest, request envelope, output manifest, and QA report evidence.

Blocked in this phase:

- route execution;
- worker dispatch;
- worker execution;
- GStreamer execution in this dry run;
- MKVToolNix execution in this dry run;
- private or user media processing;
- FFmpeg/FFprobe execution;
- Docker execution, push, or deployment;
- Remotion execution;
- Supabase mutation;
- SQL execution;
- Secret Manager payload access;
- signed URL creation;
- public artifact creation;
- credit mutation;
- provider/model call;
- final render/export;
- broad external beta expansion;
- paid production unlock;
- production unlock.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, Docker execution, Docker push/deploy, external beta expansion, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, FFmpeg/FFprobe execution in this phase, Remotion execution, GStreamer execution in this dry run, MKVToolNix execution in this dry run, package installation, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, or broad service-role handler was enabled.
