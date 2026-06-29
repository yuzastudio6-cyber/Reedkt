# TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-CONTRACT-1

## Summary

Add a disabled GPAC/MP4Box handler-registration metadata contract after `TRACKA-GPAC-MP4BOX-DISABLED-HANDLER-REGISTRATION-REVIEW-1`.

## Required Boundaries

- The handler registration must remain disabled by default and must not register an executable HTTP handler.
- The contract must preserve backend/service-role ownership, approved snapshot guard, route idempotency, private artifact manifest, command allowlist, negative tests, storage/public artifact gates, cleanup/audit references, and operator confirmation.
- It must not execute routes, dispatch workers, run GPAC/MP4Box, process media, mutate Supabase, run SQL, transfer storage, create signed/public artifacts, or unlock beta/production/final delivery.

## Expected Outcome

The disabled handler-registration metadata contract is ready for negative tests. Product runtime remains blocked.
