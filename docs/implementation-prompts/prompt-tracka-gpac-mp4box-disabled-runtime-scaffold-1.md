# TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1

## Summary

Implement a disabled-by-default GPAC/MP4Box runtime scaffold only after `TRACKA-GPAC-MP4BOX-GUARDED-RUNTIME-ENABLEMENT-PLAN-1` is merged.

## Required Boundaries

- The scaffold must remain disabled by default.
- It must require approved snapshot references, service-role/backend ownership, idempotency, private artifact manifest/checksum refs, exact command allowlists, QA/cleanup/audit refs, rollback metadata, and residue validation metadata.
- It must not execute GPAC/MP4Box, process media, transfer storage, create signed URLs, create public artifacts, dispatch workers, register production routes, mutate Supabase, run SQL, unlock external beta, unlock paid production, or unlock final delivery.

## Required Future Validation

The packet must prove the disabled scaffold rejects raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompts, service-role secret payloads, and broad service-role handler payloads.
