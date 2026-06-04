# Phase 50A Map/Geospatial QA Policy

Mandatory QA gates:

- `tool_evidence`
- `license_review`
- `free_open_source_default`
- `ownership_boundaries`
- `data_provider_policy`
- `risk_register_complete`
- `future_scope_defined`
- `command_plan_blocked`
- `package_scripts_present`
- `blocked_features`

The report passes only if the core planning stack has evidence, future candidates remain future-scoped, AI Tools/Track B/web-search ownership boundaries are clear, data/provider policy blocks paid/public/runtime paths, command plans are text-only, and production/beta/broad media gates remain false.

Failure policy: if any runtime, public artifact, provider, public tile, geocoding/routing, package-install, or production/beta path is enabled, Phase 50A must report blocked.
