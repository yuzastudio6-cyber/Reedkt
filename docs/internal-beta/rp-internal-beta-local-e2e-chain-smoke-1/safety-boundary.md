# Safety Boundary

Remote Supabase mutation: `false`

SQL execution: `false`

Migration apply: `false`

Storage object creation/read/delete: `false`

Signed URL creation: `false`

Public artifact creation: `false`

Service-role route execution: `false`

Worker execution/dispatch/lease/heartbeat: `false`

Provider/model call: `false`

Remotion execution: `false`

FFmpeg execution: `false`

FFprobe execution: `false`

Media processing: `false`

Private artifact access grant: `false`

Internal beta unlock: `false`

Accepted validation path safety statement: No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, storage object delete, Secret Manager payload access, service-role secret payload access, frontend service-role credential exposure, service-role route execution, provider call, model call, worker execution, worker dispatch, worker lease claim, worker heartbeat, route execution, browser capture, signed URL creation, public artifact creation, real credit mutation, job enqueue execution, job event write execution, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, raw prompt execution, private artifact access grant, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, Docker execution, package installation beyond dependency validation, or broad service-role handler was enabled.

Pre-validation caveat: a local `npx tsx` smoke probe before accepted validation fetched `tsx` into npm cache, did not modify repository files, is not accepted validation evidence, and must not be repeated.
