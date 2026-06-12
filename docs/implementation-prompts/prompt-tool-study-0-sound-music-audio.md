# TOOL-STUDY-0 Sound Music Audio Capability Routing Contract

Owner: `SOUND_MUSIC_AUDIO`

## Owned Tools

- AudioFlux planning
- Signalsmith Stretch planning
- SoundSync SFX/audio route planning
- loudness/ducking metadata planning

## Explicitly Not Owned

- provider music/SFX calls
- Track A final export
- web capture
- map rendering
- Supabase writes

## Related Workstreams

- TRACK_B_MEDIA_PROCESSING
- BILLING_STRIPE_CREDITS
- COMPLIANCE_SECURITY
- OBSERVABILITY_AUDIT_COST

## Allowed Scope

- docs/diagnostics only
- map sound/music/audio capability prerequisites
- record audio privacy/cost/runtime blockers

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
- soundsync-audio-pipeline-planning.md
- audio-settings-catalog.md

## Diagnostics

- verify no audio analysis or generation runs
- verify no provider SFX/music call path is introduced

## Validation

- run local report/smoke only
- scan changed files for audio execution claims

## Final Response Format

- owner
- audio capability families
- tool study blockers
- provider/runtime boundaries
- no-scope statement
