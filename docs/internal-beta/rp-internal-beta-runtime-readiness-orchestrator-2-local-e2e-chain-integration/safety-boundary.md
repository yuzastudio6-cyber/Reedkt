# Safety Boundary

No Supabase mutation, SQL execution, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, Secret Manager payload access, service-role route execution, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, credit reservation creation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, package-lock mutation, final render/export, preview artifact creation, private media processing, user media processing, Remotion execution, FFmpeg execution, FFprobe execution, media processing, package installation beyond dependency validation, Dockerfile change, requirements change, or broad service-role handler was enabled.

## Explicit Non-Claims

- Local E2E evidence does not mean internal beta is ready.
- Local E2E evidence does not mean Supabase target validation passed.
- Local E2E evidence does not mean service-role runtime is enabled.
- Local E2E evidence does not mean workers can dispatch or execute.
- Local E2E evidence does not mean private artifacts can be read, written, signed, or made public.
- Local E2E evidence does not mean Remotion rendered media.
- Local E2E evidence does not unlock external beta or production.
