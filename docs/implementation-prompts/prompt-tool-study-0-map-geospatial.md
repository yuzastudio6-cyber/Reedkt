# TOOL-STUDY-0 Map Geospatial Capability Routing Contract

Owner: `MAP_GEOSPATIAL`

## Owned Tools

- MapLibre
- Turf
- deck.gl planning
- CesiumJS planning

## Explicitly Not Owned

- web search execution
- browser capture
- Track B media processing
- provider/model calls
- Supabase mutation

## Related Workstreams

- WEB_SEARCH_CAPTURE
- AI_TOOLS_CREATIVE_GRAPHICS
- COMPLIANCE_SECURITY
- FRONTEND_PRODUCT_UX

## Allowed Scope

- docs/diagnostics only
- map future map/geospatial route families
- record map safety/readability prerequisites

## Blocked Scope

- tool execution
- worker execution
- route execution
- provider/model calls
- media processing
- browser capture
- map rendering
- web search execution
- Supabase mutation
- SQL/migrations/schema/RLS changes
- Google Cloud API calls
- Secret Manager API calls
- GCS upload/storage transfer
- public artifacts
- signed URLs
- raw prompt execution
- production/external beta/paid production/broad media unlock

## Required Docs And Files

- docs/activation-phase-tool-route-0-execution-unlock-audit-results.md
- docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json
- docs/activation-worker-approved-plan-dry-run-reports/evidence/plan-snapshot-evidence-context.json
- open-source-tool-registry.md
- tool-settings-catalog.md
- tool-strategy-planner.md
- map-location-animation-planning.md
- map-animation-settings-catalog.md

## Diagnostics

- verify no map rendering or tile/network fetch runs
- verify exact geography claims stay owner-reviewed

## Validation

- run local report/smoke only
- scan changed files for runtime or API-call claims

## Final Response Format

- owner
- route families
- tool capability contract gaps
- map execution blockers
- no-scope statement
