# Track B Tool Route Manifest

The Track B tool route manifest records route eligibility metadata for the 18 canonical Track B tool ids from the Phase 44I-A capability baseline.

The manifest version is `track-b-route-manifest-v1`. Each route includes the tool id, family, capability ids, route status, consumer boundaries, approved and blocked artifact classes, required plan snapshot fields, required artifact scope fields, private prefix policy, cost class metadata, evidence references, test commands, blockers, and next phase.

Route statuses:

- `route_enabled_restricted_internal`: metadata eligibility for restricted internal QA/planning only.
- `route_handoff_only`: dependency or foundation metadata only, not a direct user route.
- `route_disabled_blocked`: blocked by an explicit evidence or approval gap.
- `route_disabled_excluded`: excluded from initial internal testing.
- `route_disabled_not_started`: future phase required.
- `route_disabled_pending_integration`: fallback status for any future unclassified route.

Every Phase 44I route has `runtimeExecutionAllowed: false` and `routeExecutionAllowed: false`. This prevents the route manifest from becoming a raw execution path before future worker, cost, profiler, and artifact-scope phases exist.
