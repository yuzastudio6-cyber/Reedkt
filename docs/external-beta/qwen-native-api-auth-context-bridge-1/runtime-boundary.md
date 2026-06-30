# Runtime Boundary

This packet does not run QWEN2.5-VL provider/model inference.

This packet does not read Secret Manager payloads, mutate Supabase, run SQL, dispatch workers, execute Cloud Run jobs, process media, create signed/public artifacts, unlock external beta, unlock production, or run final export.

The only runtime behavior exercised by the smoke is an in-process local HTTP call against `handleServerRequest`:

- default fail-closed route response;
- missing bearer token blocked response;
- explicit local validation auth context preparing the backend-only handoff envelope.

No service-role key is used by the auth bridge. The bridge uses only the Supabase public auth client for real bearer token verification.

Safety statement:

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution beyond bounded local native route auth/handoff response validation, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, QWEN provider/model execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, package-lock mutation, or broad service-role handler was enabled.
