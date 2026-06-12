# TOOL-STUDY-0 Track A Render Export Capability Routing Contract

Owner: `TRACK_A_RENDER_EXPORT`

## Owned Tools

- Remotion render/export boundary
- FFmpeg final mux/export planning
- OpenTimelineIO render handoff
- libass caption burn-in planning

## Explicitly Not Owned

- Track B media analysis
- map data source validation
- web capture
- provider/model calls
- billing mutation

## Related Workstreams

- WORKER_RUNTIME_JOBS
- AI_TOOLS_CREATIVE_GRAPHICS
- OBSERVABILITY_AUDIT_COST
- COMPLIANCE_SECURITY

## Allowed Scope

- docs/diagnostics only
- map future render/export route prerequisites
- record approved snapshot and artifact-scope requirements

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
- remotion-renderer-plan.md
- render-strategy-planner.md

## Diagnostics

- verify no render/export command is introduced
- verify final render/export remains blocked

## Validation

- run local report/smoke only
- scan changed files for final export enablement

## Final Response Format

- owner
- render/export route status
- required capability contracts
- blocked runtime scope
- no-scope statement
