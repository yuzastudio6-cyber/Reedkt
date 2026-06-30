# AI Graphics Production Traffic Cutover

Decision: `ai_graphics_production_traffic_cutover_approved_controlled_tool_call_ready`

This packet defines the production traffic cutover gate for the 21 AI graphics
tools. It consumes accepted production launch go/no-go evidence and requires
private/backend cutover controls for traffic switch approval, production route
readiness, production worker readiness, private artifact storage, monitoring,
rollback drill, canary cohort, support/on-call, cost guardrails,
privacy/retention, and post-cutover review ownership.

## Accepted Result

- AI graphics tools covered: 21.
- Product-facing capabilities covered: 12.
- GPU/model runtime targeted tools: 8.
- Required cutover refs: 11.
- Production controlled tool-call ready tools: 21.
- Runtime ready for on-demand production tool calls: 21.
- Production-ready tools reported by this packet: 21.
- Direct agent tool execution approved now: false.
- GPU runtime should start now: false.

## Runtime Boundary

The gate makes production tool-call readiness available only through the
controlled backend route and worker path. The agent can select and rank tools,
but direct agent execution remains blocked.

This packet does not execute API routes, enqueue workers, dispatch workers,
execute tools, call providers/models, run browser/WebGL/canvas runtime, start
GPU/model runtime, download or load model weights, process media, mutate
Supabase/GCS, create signed URLs, or create public artifacts.

## GPU Cost Policy

The eight GPU/model tools remain on native GPU worker targets. GPU runtime is
approved only for accepted production worker jobs that actually call a GPU/model
tool. The cutover packet itself does not start GPU runtime and does not approve
idle resident GPU runtime.

## Source Evidence

- `docs/tool-intelligence/ai-graphics/production-launch-go-no-go.json`
- Private/backend production go/no-go and cutover evidence refs supplied at
  evaluator runtime; not committed.

## Next Milestone

Wire the production tool-call gateway to consume this packet and submit accepted
requests through backend route and worker boundaries only. Direct agent
execution must stay blocked.
