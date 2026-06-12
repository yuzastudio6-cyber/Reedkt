# TOOL-STUDY-0 Track B Media Processing Capability Routing Contract

Owner: `TRACK_B_MEDIA_PROCESSING`

## Owned Tools

- FFmpeg/ffprobe metadata planning
- OpenCV
- PyAV
- PySceneDetect
- DeepFilterNet
- Signalsmith Stretch
- DuckDB/Polars metadata planning

## Explicitly Not Owned

- Track A final render/export
- map rendering
- web search execution
- provider/model calls
- Supabase schema changes

## Related Workstreams

- SOUND_MUSIC_AUDIO
- WORKER_RUNTIME_JOBS
- OBSERVABILITY_AUDIT_COST
- COMPLIANCE_SECURITY

## Allowed Scope

- docs/diagnostics only
- map Track B route manifests to TOOL-STUDY-0 prerequisites
- record media-runtime blockers

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
- docs/track-b-tool-route-manifest.md
- docs/track-b-tool-readiness-summary.md

## Diagnostics

- verify no media files are read or processed
- verify no sidecar/tool runtime executes

## Validation

- run local report/smoke only
- scan changed files for media-processing claims

## Final Response Format

- owner
- Track B route families
- tool study gaps
- runtime blockers
- no-scope statement
