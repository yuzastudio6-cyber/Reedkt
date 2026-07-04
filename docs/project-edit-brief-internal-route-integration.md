# Project Edit Brief Internal Route Integration

## Decision

`project_edit_brief_internal_route_integration_passed_ready_for_internal_testing_readback`

## Scope

RP-EDITBRIEF-18 connects Project Edit Brief mock route handlers to the internal persistence backend skeleton. Routes still run in mock/local mode, but they now obtain the repository through the same backend seam that future internal testing and release-shaped route work should use.

Each successful route response includes internal persistence metadata alongside the existing safety flags. This makes route readback prove which backend seam was used without exposing live Supabase, service-role behavior, provider calls, workers, render/export, or credits.

## Preserved Boundaries

- Production HTTP routes remain disabled.
- Live Supabase remains disabled.
- Storage writes and signed URLs remain disabled.
- Provider/model calls, media processing, worker dispatch, render/export, uploads, and credit spend remain disabled.
- External beta and paid production remain false.

## Next Milestone

`RP-EDITBRIEF-19 - Internal Testing Readback And QA`
