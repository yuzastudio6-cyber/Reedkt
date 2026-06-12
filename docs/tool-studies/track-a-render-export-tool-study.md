# Track A Render Export Tool Study

Owner: `TRACK_A_RENDER_EXPORT`

Status: `metadata_study_complete_no_execution`

Decision: Track A render/export capability routing can proceed to a future tool-route execution unlock audit, but real render, export, mux, storage delivery, public artifact creation, signed URL creation, and final delivery remain blocked.

## Source Evidence

- `render-strategy-planner.md`
- `remotion-capability-matrix.md`
- `docs/production-remotion-render-execution-policy.md`
- `docs/production-final-render-runbook.md`
- `docs/production-final-render-export-execution.md`
- `server/tool-registry/production-tool-profiles.ts`
- `docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_tool_provider_route_owner_handoff_plan.json`

## Capability Classification

| Capability | Best Use | Avoid | Inputs | Outputs | Readiness |
| --- | --- | --- | --- | --- | --- |
| Remotion render composition | Final canvas, layers, captions, panels, timing, approved asset placement | Provider generation, arbitrary user code, raw prompt instructions | approved render manifest, private artifact refs, timeline metadata | command-plan metadata, render composition metadata | command planning only |
| FFmpeg final export | Encode, mux, loudness handoff, delivery package inspection | Creative decisions, unreviewed codec flags, arbitrary media paths | approved private render output refs, export manifest | private final-export metadata | blocked until explicit render/export execution owner approval |
| libass caption render | Caption burn-in or subtitle render planning | Unapproved caption payloads | approved caption segment refs | caption render metadata | planned only |
| OpenTimelineIO / timeline interchange | Structured edit-decision and layer handoff | Media processing or frontend runtime | approved timeline metadata | timeline interchange metadata | metadata ready, execution blocked |
| Hyperframe preview boundary | Interactive preview coordination | Backend export, raw worker execution | timeline and render manifest metadata | preview boundary metadata | preview boundary only |

## Routing Contract Notes

- Track A owns final render/export decisions and command-plan boundaries; it does not own Track B media analysis, Sound/Music audio processing, AI graphics provider execution, web capture, or map/geospatial rendering.
- Future execution must consume approved plan snapshots and private artifact refs only.
- Final delivery remains blocked until private final-export artifact validation and owner approval are present.
- Public artifact URLs and signed URLs are not source-of-truth for this lane.

## Blocked Runtime Gates

- `finalRenderExecutionAllowed`: `false`
- `finalExportExecutionAllowed`: `false`
- `toolExecutionAllowed`: `false`
- `routeExecutionAllowed`: `false`
- `publicArtifactsAllowed`: `false`
- `signedUrlsAsSourceOfTruthAllowed`: `false`
- `generatedLocalFixturePassedClaimed`: `false`

Next required action: include this owner in `TOOL-ROUTE-EXECUTION-UNLOCK-0: tool-route execution unlock repo audit, no execution`.
