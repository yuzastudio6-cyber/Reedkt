# Safety Boundary

This integration is local source-only. It does not read credential payloads, does not call Supabase, and does not run SQL, migrations, storage readback, service-role routes, workers, providers, media, rendering, signed/public artifacts, or beta/production unlocks.

## Safety Values

- Remote Supabase command: `false`
- Remote Supabase mutation: `false`
- SQL execution: `false`
- Migration apply: `false`
- Storage object read: `false`
- Service-role secret payload access: `false`
- Frontend service-role credential exposure: `false`
- Service-role route execution: `false`
- Worker execution: `false`
- Provider/model calls: `none`
- Remotion execution: `none`
- Signed URLs created: `none`
- Public artifacts created: `none`
- Internal beta unlock: `false`
- External beta unlock: `false`
- Production unlock: `false`
- Package-lock: `unchanged`
- Generated artifacts committed: `none`

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.
