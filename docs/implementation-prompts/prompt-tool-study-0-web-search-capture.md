# TOOL-STUDY-0 Web Search Capture Capability Routing Contract

Owner: `WEB_SEARCH_CAPTURE`

## Owned Tools

- SearXNG/private search policy
- Brave fallback policy
- Playwright capture
- Readability extraction
- Sharp screenshot preparation

## Explicitly Not Owned

- map rendering
- provider/model planning
- Track A export
- Track B media processing
- Supabase writes
- billing

## Related Workstreams

- COMPLIANCE_SECURITY
- OBSERVABILITY_AUDIT_COST
- FRONTEND_PRODUCT_UX

## Allowed Scope

- docs/diagnostics only
- read committed TOOL-ROUTE-0 and WORKER-1 evidence
- map future search/capture capabilities and blockers

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
- docs/activation-phase-49h-web-search-capture-internal-readiness.md if present

## Diagnostics

- verify no web request execution path is introduced
- verify browser capture remains blocked
- verify owner handoff lists privacy/source limitations

## Validation

- run local report/smoke only
- scan changed files for signed URL and raw prompt material

## Final Response Format

- owner
- capability routing status
- blocked capabilities
- required next study evidence
- no-scope statement
