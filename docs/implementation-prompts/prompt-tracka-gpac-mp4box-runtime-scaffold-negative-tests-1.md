# TRACKA-GPAC-MP4BOX-RUNTIME-SCAFFOLD-NEGATIVE-TESTS-1

## Summary

Implement negative tests for the disabled GPAC/MP4Box runtime scaffold from `TRACKA-GPAC-MP4BOX-DISABLED-RUNTIME-SCAFFOLD-1`.

## Required Boundaries

- Keep the scaffold disabled by default.
- Test that raw chat, raw command strings, frontend file paths, public URLs, signed URLs as source-of-truth, arbitrary private media, provider/model prompt payloads, service-role secret payloads, and broad service-role handler payloads are rejected.
- Test that route execution, worker dispatch, worker execution, GPAC/MP4Box execution, media processing, storage transfer, signed URL creation, public artifact creation, Supabase mutation, SQL execution, external beta expansion, paid production unlock, and production unlock stay blocked.
- Do not add live route registration, worker dispatch, storage transfer, GPAC/MP4Box execution, media processing, Supabase mutation, SQL execution, signed/public artifacts, external beta unlock, paid production unlock, production unlock, or final delivery/export.

## Expected Outcome

If negative tests pass, the next milestone may plan guarded live registration review. Product runtime remains blocked until a separate explicit runtime gate approves route, worker, artifact, QA, cleanup, audit, rollback, and operator confirmation behavior.
