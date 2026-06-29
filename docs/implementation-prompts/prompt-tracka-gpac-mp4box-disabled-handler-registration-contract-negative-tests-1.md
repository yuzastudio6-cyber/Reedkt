# TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-NEGATIVE-TESTS-1

## Summary

Add negative tests for the disabled GPAC/MP4Box handler-registration contract added by `TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1`.

## Required Boundaries

- Keep the contract disabled and do not register or execute an HTTP handler.
- Negative tests must cover executable handler registration, feature flag enablement, route execution, worker dispatch/execution, GPAC/MP4Box execution, media processing, storage transfer, signed/public artifact creation, Supabase mutation, SQL execution, rejected inputs, cleanup/audit guard failure, and operator confirmation drift.
- Do not execute routes, workers, GPAC/MP4Box, FFmpeg/FFprobe, Docker, Remotion, media processing, Supabase, SQL, storage transfer, signed/public artifacts, or beta/production/final delivery.

## Expected Outcome

If negative tests pass, the lane may proceed to a guarded handler-registration plan. Product runtime remains blocked.
