# Safety Boundary

This packet is backend-local metadata validation only.

Safety values:

- Supabase mutation: `false`
- SQL execution: `false`
- Migration apply: `false`
- Storage object creation/read/delete: `false`
- Service-role route execution: `false`
- Worker dispatch/execution: `false`
- Provider/model call: `false`
- Raw prompt execution: `false`
- QA media inspection: `false`
- Cleanup execution: `false`
- Rollback execution: `false`
- Remote observability sink write: `false`
- Remotion execution: `false`
- FFmpeg execution: `false`
- FFprobe execution: `false`
- Media processing: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Internal beta unlock: `false`
- External beta unlock: `false`
- Production unlock: `false`

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, storage object delete, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, QA media inspection, cleanup execution, rollback execution, remote observability sink write, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.
