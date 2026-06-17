# AI Graphics Queue Boundary

Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`

Queue execution remains blocked. Worker Runtime may only plan future metadata handoff payload requirements from committed docs.

## Queue Boundary

- Queue execution approved now: `false`.
- Worker execution approved now: `false`.
- Real job claim approved now: `false`.
- Lease mutation approved now: `false`.
- Future queue planning must require approved plan snapshot, scoped tool-call manifest, private artifact ref, checksum, no-execution proof, and blocked-use assertions.
