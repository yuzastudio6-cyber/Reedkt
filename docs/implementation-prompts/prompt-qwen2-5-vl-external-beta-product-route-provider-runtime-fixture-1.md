# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1

Use this prompt only after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_ENABLEMENT_REVIEW_1` is merged.

## Goal

Run the first guarded QWEN product-route provider runtime fixture through the backend route, using only generated or explicitly approved bounded input and preserving all fail-closed gates.

## Required Gates

- Explicit confirmation environment variable named by the packet.
- Target `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`.
- Existing approved snapshot, credit reservation, queue lease, private manifest, checksum, source sequence, compiled intent, model routing policy, and QA policy readback references.
- Backend-only provider runtime path.
- No frontend provider/model call.
- No worker dispatch unless the packet explicitly validates a generated queue fixture and cleanup.
- No signed/public artifact.
- No final render/export.
- No beta/production unlock.

## Required Evidence

- Sanitized request/response envelope.
- Cost-control status.
- Provider route status.
- Failure/success status.
- No secret payloads.
- No raw private media.
- `/tmp` artifacts only unless a later docs packet records sanitized evidence.
