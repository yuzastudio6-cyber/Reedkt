# Phase 44M No-Op Route Failure Policy

Phase 44M includes fail-closed fixtures for unsafe requests.

Required blocked fixture classes:

- Secret payload requested.
- Raw chat execution requested.
- `routeExecutionAllowed=true`.
- `runtimeExecutionAllowed=true`.
- Real tool id requested.
- Demucs requested.
- VLM requested.
- Provider call requested.
- Public output requested.
- Arbitrary path requested.
- Media artifact requested.
- Signed URL source requested.

All fixtures must block with the expected reason before `track_b_noop_route_dry_run` can become `phase_complete_restricted_scope`.
