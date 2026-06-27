# Safety Boundary

Packet: `RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`

## Allowed

- Docs/status updates.
- Diagnostics using Node built-ins and Git file lists.
- Static source audit of existing provider/model policy and fail-closed code.
- Carry-forward of already-merged external beta Supabase, route, private artifact, approved snapshot, credit, job, and Remotion generated-local evidence.

## Not Allowed

- Provider call.
- Model call.
- Secret Manager payload access.
- Provider secret payload access.
- Raw prompt execution.
- Worker dispatch or worker execution.
- Supabase mutation or SQL execution.
- Route execution.
- Signed URL creation.
- Public artifact creation.
- Private/user media processing.
- Remotion execution in this provider policy phase.
- Docker execution.
- FFmpeg or FFprobe execution.
- Package/dependency mutation or package-lock mutation.
- Internal beta, external beta, production, paid production, or final delivery/export unlock.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Docker execution, Remotion execution in this provider policy phase, FFmpeg/FFprobe execution, package installation beyond dependency validation, dependency mutation, package-lock mutation, provider secret payload access, or broad service-role handler was enabled.
