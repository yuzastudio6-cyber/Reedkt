# Phase 44J Route Simulation

Route simulation consumes `buildTrackBRouteEntries()` from the Phase 44I route manifest.

Output vocabulary:

- `eligible_metadata_only`
- `blocked`
- `handoff_only`
- `future_local_candidate`
- `future_server_candidate`

The simulation respects `routeExecutionAllowed=false` and `runtimeExecutionAllowed=false` from every route entry. Web/desktop profile hints can produce planning recommendations only. Browser or desktop capability evidence cannot override disabled, excluded, blocked, unknown, public-output, provider, VLM, Demucs, broad-media, or missing-scope route decisions.

Phase 44J does not create a live route executor.
