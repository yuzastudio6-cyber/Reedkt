# Safety Boundary

Packet: `RP-EXTERNAL-BETA-CONTROLLED-PRIVATE-INVITE-ACCESS-1`

Allowed in this phase:

- docs/status/diagnostics updates;
- read-only Cloud Run IAM policy readback;
- read-only Cloud Run service status readback;
- non-executing safety scans.

Not allowed in this phase:

- Cloud Run IAM mutation;
- Cloud Run service update;
- deployment;
- public access grant;
- `allUsers` grant;
- `allAuthenticatedUsers` grant;
- Secret Manager payload access;
- Supabase mutation;
- SQL execution;
- service-role route execution;
- provider/model call;
- worker execution;
- worker dispatch;
- media processing;
- Remotion execution;
- FFmpeg/FFprobe execution;
- signed URL creation;
- public artifact creation;
- private media processing;
- user media processing;
- credit mutation;
- Stripe checkout/webhook/payment processing;
- internal beta unlock;
- paid production unlock;
- production unlock;
- final delivery/export.

No-scope statement:

No Cloud Run IAM mutation, Cloud Run service update, deployment, Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, FFmpeg/FFprobe execution, Docker execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. This phase was limited to docs/status/diagnostics plus read-only Cloud Run IAM policy and service-status readback for controlled private invite access planning.
