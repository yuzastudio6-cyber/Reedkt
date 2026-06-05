# Tool Capability Registry QA Policy

Mandatory Phase 52B QA gates:

- `phase52a_evidence`
- `capability_schema_compliance`
- `track_a_capabilities`
- `web_search_capabilities`
- `map_geospatial_capabilities`
- `supabase_capabilities`
- `ai_tools_placeholders`
- `track_b_placeholders`
- `ownership_boundaries`
- `supabase_tool_capability_sync`
- `supabase_milestone_sync`
- `blocked_features`

Phase52C readiness is `ready for multi-agent dry-run on existing evidence` only when every mandatory gate passes and Supabase readback verifies all 67 tool capability rows.

Smoke tests must verify record counts, no duplicate `(track, toolId)`, required evidence and blocker rules, D3/Three.js/Sharp ownership boundaries, VLM and Demucs blockers, package scripts, and production/beta/provider blocking.
