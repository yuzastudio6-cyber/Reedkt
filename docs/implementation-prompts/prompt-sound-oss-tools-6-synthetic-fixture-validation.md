# SOUND-OSS-TOOLS-6 Synthetic Fixture Validation

## Summary
Validate only approved synthetic SOUND fixture cases from the merged SOUND-OSS-TOOLS-5 plan. This prompt must use no real user data, no customer media, no uploaded files, no private project payloads, no generated media files, no Supabase mutation, no SQL, no providers/models, no workers/routes, no FFmpeg/ffprobe, no Demucs/RNNoise, no signed URLs, no public artifacts, and no beta/production unlock.

## Required Source Audit
- Read SOUND-OSS-TOOLS-5 plan, schema, matrix, safety policy, exclusion guard, owner handoff plan, validation results, and diagnostic.
- Read SOUND-OSS-TOOLS-4 binary/import proof result, matrix, and blocker register.
- Stop if pydub media operations are not blocked, if real user data is allowed, if media file fixtures are allowed, or if excluded tools appear as executable fixture targets.

## Validation Boundaries
- Synthetic fixture validation requires explicit approval in this prompt before any in-memory fixture code runs.
- Any approved fixture must use in-memory synthetic data only and must not read or write files.
- `pydub` remains blocked for media operations until the inherited FFmpeg/avconv warning policy is resolved.
- `generated_local_fixture_passed` may be claimed only if this prompt actually runs approved validation and source evidence supports the claim.
- Runtime readiness, `dry_run_passed`, beta readiness, and production readiness must remain unclaimed.

## Output
- Record validation as passed, passed with warnings, or blocked.
- Keep all Supabase, artifact, media, provider, worker, route, and production gates closed.

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
