# Track B Media Processing Tool Study

Owner: `TRACK_B_MEDIA_PROCESSING`

Status: `metadata_study_complete_no_execution`

Decision: Track B media-processing capability routing can proceed to a future tool-route execution unlock audit, but broad media processing, arbitrary paths, public output, runtime worker execution, and production routes remain blocked.

## Source Evidence

- `docs/activation-track-b-capability-manifests-reports/track_b_capability_manifest_report.md`
- `docs/activation-track-b-tool-route-manifest-reports/track_b_tool_route_manifest.json`
- `docs/activation-track-b-tool-route-manifest-reports/track_b_route_consumer_policy.json`
- `docs/activation-phase-46a-media-data-tool-readiness-audit.md`
- `docs/activation-phase-46a-media-data-readiness-reports/phase_46a_media_data_tool_registry.json`
- `docs/production-media-analysis-foundation.md`
- `server/tool-registry/production-tool-profiles.ts`

## Capability Classification

| Capability | Best Use | Avoid | Inputs | Outputs | Readiness |
| --- | --- | --- | --- | --- | --- |
| OpenCV | Frame geometry, safe-zone, blur, crop, panel consistency, private QA metadata | Semantic creative decisions, frontend detection claims | approved private media metadata, bounded frame refs | private visual QA metadata | restricted metadata evidence, runtime blocked |
| PyAV | Container probing and frame/audio access policy | Final export ownership or arbitrary file paths | private source/proxy refs | media probe metadata | candidate evidence, runtime blocked |
| PySceneDetect | Scene-change candidates and shot-boundary metadata | Final edit decisions without plan approval | approved private video metadata | scene manifest metadata | candidate evidence, runtime blocked |
| Sharp / libvips | Image metadata, thumbnails, resize, format transforms, private previews | Final video compositing, unreviewed untrusted uploads | private image/media refs | private image-prep metadata | candidate evidence, runtime blocked |
| DuckDB / Polars | Private QA aggregation, metrics, reporting transforms | Network access, private payload commits, arbitrary local reads | redacted report refs, private metadata refs | redacted QA summary metadata | reporting candidate, runtime blocked |

## Routing Contract Notes

- Track B does not own AI Tools creative graphics workflows, Track A visual pipeline, web search provider stack, or map/geospatial stack.
- Track B may expose capability metadata to future worker orchestration only through approved plan snapshots and private artifact scopes.
- Broad user media, arbitrary paths, signed URLs as source-of-truth, committed payloads, public artifacts, and raw prompt execution remain blocked.
- Completed web-search and map/geospatial studies remain external evidence, not Track B-owned studies.

## Blocked Runtime Gates

- `trackBMediaProcessing`: `false`
- `toolExecutionAllowed`: `false`
- `routeExecutionAllowed`: `false`
- `broadMediaAllowed`: `false`
- `publicArtifactsAllowed`: `false`
- `signedUrlsAsSourceOfTruthAllowed`: `false`
- `generatedLocalFixturePassedClaimed`: `false`

Next required action: include this owner in `TOOL-ROUTE-EXECUTION-UNLOCK-0: tool-route execution unlock repo audit, no execution`.
