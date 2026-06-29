# TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-SCAFFOLD-1

## Summary

Implement a guarded runtime dispatch scaffold after `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ENABLEMENT-PLAN-1`.

This follow-up must remain fail-closed unless `REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GUARDED_RUNTIME_DISPATCH=true` is explicitly present. If the gate is absent, record `blocked_pending_gpac_mp4box_guarded_runtime_dispatch_confirmation` and do not execute routes, dispatch workers, execute workers, run GPAC/MP4Box, process media, transfer storage artifacts, create signed/public artifacts, mutate Supabase, run SQL, or unlock beta/production/final delivery.

## Required Source Inputs

- `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-DISPATCH-ENABLEMENT-PLAN-1`
- immutable approved snapshot policy
- private artifact manifest and cleanup policy
- service-role route boundary
- worker idempotency, lease, and event policy
- GPAC/MP4Box command allowlist policy

## Required Negative Tests

The scaffold must preserve or add non-executing negative checks for raw chat execution, missing approved snapshot, unapproved media source, public/signed artifact attempts, missing private manifest, missing cleanup policy, route bypass, worker bypass, command drift, FFmpeg/FFprobe expansion, product unlock drift, and missing confirmation gate.

## Boundaries

No external beta, production, paid production, or final delivery/export unlock is authorized by this prompt.
