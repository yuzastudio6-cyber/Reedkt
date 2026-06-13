# AI Tools Creative Graphics Tool Study

Owner: `AI_TOOLS_CREATIVE_GRAPHICS`

Status: `metadata_study_complete_no_execution`

Decision: creative graphics capability routing can proceed to a future tool-route execution unlock audit, but no creative graphics runtime, provider call, tool execution, public artifact, signed URL, or beta/production unlock is ready from this packet.

## Source Evidence

- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `render-strategy-planner.md`
- `remotion-capability-matrix.md`
- `docs/activation-track-b-tool-route-manifest-reports/track_b_route_consumer_policy.json`
- `server/tool-registry/production-tool-profiles.ts`
- `docs/activation-worker-runtime-unlock-4-local-fixture-plan-reports/worker_runtime_local_fixture_tool_provider_route_owner_handoff_plan.json`

## Capability Classification

| Capability | Best Use | Avoid | Inputs | Outputs | Readiness |
| --- | --- | --- | --- | --- | --- |
| Remotion graphic composition | Cards, labels, panels, timelines, exact text, final canvas placement | Provider generation or media processing | approved plan snapshot metadata, render specs, private placeholder asset refs | render spec metadata, layer plan metadata | metadata routing only |
| Sharp / libvips consumer path | Resize, crop, thumbnail, format conversion, transparent asset prep | Final video compositing, untrusted arbitrary uploads | private image refs, approved graphics asset refs | private image-prep metadata | owned by Track B for runtime; AI graphics may consume only through approved handoff |
| D3 / ECharts graphics | Exact charts, diagrams, money flows, labels, timelines | AI-invented data or numbers | approved structured data refs | chart spec metadata | planning only |
| Lottie / PixiJS / Three.js / Konva | Reusable vector, 2D, 3D, and canvas graphics where justified | Random decoration or spectacle disconnected from edit intent | approved visual asset specs | motion graphics spec metadata | planned/future only |
| GPT-image style creative assets | Designed stills, cards, keyframes, character anchors | Raw prompt execution, provider calls without approval, final canvas generation | compiled intent and approved prompt snapshots | private generated-asset metadata after future provider approval | provider execution blocked |

## Routing Contract Notes

- This owner does not own Track B runtime execution, Track A final render/export, web search capture, map/geospatial rendering, provider gateway execution, or Supabase persistence.
- Exact text, charts, cards, labels, and layout should prefer controlled graphics and Remotion metadata over AI video.
- Any future provider-generated graphics must remain asset-only; Remotion owns final composition.
- All creative graphics artifacts must be private by default and referenced by approved snapshot, manifest, checksum, and private placeholder refs.

## Blocked Runtime Gates

- `toolExecutionAllowed`: `false`
- `providerExecutionAllowed`: `false`
- `routeExecutionAllowed`: `false`
- `publicArtifactsAllowed`: `false`
- `signedUrlsAsSourceOfTruthAllowed`: `false`
- `rawPromptExecution`: `false`
- `generatedLocalFixturePassedClaimed`: `false`

Next required action: include this owner in `TOOL-ROUTE-EXECUTION-UNLOCK-0: tool-route execution unlock repo audit, no execution`.
