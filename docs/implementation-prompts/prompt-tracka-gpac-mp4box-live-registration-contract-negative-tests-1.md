# TRACKA-GPAC-MP4BOX-LIVE-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1

## Summary

Implement negative tests for the disabled GPAC/MP4Box live-registration contract after `TRACKA-GPAC-MP4BOX-DISABLED-LIVE-REGISTRATION-CONTRACT-1`.

## Required Boundaries

- Verify live handler registration, route execution, worker dispatch, GPAC/MP4Box execution, storage transfer, signed/public artifact creation, Supabase mutation, SQL execution, beta unlock, production unlock, and final delivery/export attempts are rejected.
- Keep the contract disabled by default.
- Do not register an executable HTTP handler.
- Do not run GPAC/MP4Box, Docker, media processing, workers, routes, Supabase, SQL, storage transfer, signed/public artifact creation, or unlocks.

## Expected Outcome

If negative tests pass, the next gate may review a disabled handler-registration metadata contract. Product runtime remains blocked.
