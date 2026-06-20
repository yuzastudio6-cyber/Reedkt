# TRACKA-REMOTION-RUNTIME-PROOF-1 Guarded Runner Contract

## Guard

The runner `scripts/validation/tracka-remotion-runtime-proof-1.mjs` is present for a future bounded proof and must fail closed unless:

`REEDITPRO_CONFIRM_TRACKA_REMOTION_RUNTIME_PROOF=true`

The current implementation does not set this variable. With the variable absent, the runner returns:

- `TRACKA-REMOTION-RUNTIME-PROOF-1 decision: blocked_pending_remotion_runtime_proof_confirmation`
- `runtimeExecutionPerformed: false`
- Generated fixture: `not_run_confirmation_absent`
- Artifacts/checksums: `none`

## Future Confirmed Path

If a later confirmed environment sets the guard, the runner may create only `/tmp/reeditpro-tracka-remotion-runtime-proof-1/<runId>/`, generate a tiny local Remotion composition, dynamically import `remotion`, `@remotion/bundler`, and `@remotion/renderer`, call only `bundle()`, compute SHA-256 checksums, and write local `/tmp` manifest/QA JSON.

The future confirmed path must not call Remotion render functions, browser capture, FFmpeg, FFprobe, private media processing, workers, routes, providers, Supabase, SQL, signed URL creation, public artifact creation, final render/export, or beta/production unlocks.

No generated `/tmp` artifact may be committed.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, video rendering, media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Bounded local generated Remotion package import and bundling proof was allowed only for Atlas Track A `remotion_render_validation`; generated artifacts stayed local and were not committed.
