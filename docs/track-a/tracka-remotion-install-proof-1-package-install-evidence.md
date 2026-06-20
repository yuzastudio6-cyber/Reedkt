# TRACKA-REMOTION-INSTALL-PROOF-1 Package Install Evidence

## Command

```bash
npm install remotion @remotion/renderer @remotion/bundler
```

## Direct Dependency Evidence

Expected direct production dependencies:

- `remotion`: `^4.0.481`
- `@remotion/renderer`: `^4.0.481`
- `@remotion/bundler`: `^4.0.481`

Disallowed direct dependency:

- `@remotion/player`: absent from root `dependencies` and `devDependencies`

## Lockfile Evidence

`package-lock.json` was updated by npm and includes package-lock entries for the approved Remotion package set.

`@remotion/player` appears only as a transitive lockfile dependency through `@remotion/bundler` -> `@remotion/studio` -> `@remotion/player`. This does not validate browser preview support and does not create a Track A browser runtime path.

## Decision Values

`remotion_package_install: installed_package_lock_updated`

`remotion_renderer_package: installed_package_lock_updated`

`remotion_bundler_package: installed_package_lock_updated`

`remotion_render_validation installStatus: installed_with_package_source_evidence`

`remotion_render_validation runtimeProofStatus: blocked_pending_runtime_proof`

`browserRuntimeStatus: not_validated_in_this_phase`

`runtimeExecutionPerformed: false`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, tool execution, Remotion execution, media processing, FFmpeg/FFprobe execution, or broad service-role handler was enabled. Dependency mutation was limited to the scoped Atlas Track A Remotion package install proof.
