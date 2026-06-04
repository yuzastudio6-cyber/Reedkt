# Phase 44K Allowed Internal Scope

Allowed internal scope is restricted to metadata, planning, and simulation.

Allowed:

- Inspect Track B capability metadata.
- Inspect route eligibility metadata.
- Use web/desktop profiler hints for planning only.
- Use desktop benchmark fixture metadata for planning only.
- Use static cost scenario metadata for planning only.
- Use sidecar protocol validators as metadata only.
- Use hybrid E2E simulation scorecards as readiness evidence.

Not allowed:

- Live route execution.
- Runtime execution.
- Worker execution.
- Actual local sidecar execution.
- Tool execution.
- Public output.
- Product-wide beta or production unlock.

The allowed scope cannot override capability manifests, route blockers, cost guardrails, VLM exclusions, Demucs blockers, broad-media blocks, public-output blocks, or Track A ownership boundaries.
