# Qwen Provider Runtime Gates

RP-QWEN-01 defines the Qwen 3.7 provider runtime gate model while keeping provider calls disabled.

Boundary statement: symbolic secret references only, disabled resolver only, backend-only, no gcloud, no secret value access, no secret value printed, no provider call, no Qwen call, no Marker Chat runtime change, fake transport first by default.

Verification phrase: Qwen 3.7 remains behind symbolic secret references, a disabled resolver, backend-only access, no gcloud command, no secret value access, no provider call, no Qwen call, no Marker Chat runtime change, and fake transport first.

## Required Gates

- Owner approval.
- Secret Manager runtime resolver approval.
- Provider config enablement.
- Runtime adapter implementation.
- Structured response validation.
- Rate-limit policy.
- Usage and cost policy.
- Security and privacy review.

## Current Status

The default gate is `blocked_owner_approval`. Provider client creation and provider calls remain blocked. Mock fallback remains available for Marker Chat and reasoning-agent flows.
