# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1 Source Audit

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-CONTRACT-1`

Decision: `completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold`

Execution: `completed_docs_only_agent_execution_contract_no_runtime_execution`

Integration base: `332ed385e5bf4d1f3406d47a1e8b81e19ff25b03`

This packet turns the GStreamer/MKVToolNix readiness row from `RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1` into a concrete guarded external-agent execution contract. It does not implement workers, routes, command handlers, tool execution, Docker, media processing, Supabase, SQL, provider/model calls, or artifact writes.

## Accepted Source Evidence

- `RP-EXTERNAL-BETA-TOOL-EXECUTION-READINESS-MATRIX-1`: records both tools as `ready_for_guarded_agent_execution_contract_planning`.
- `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-ROLLUP-AFTER-GSTREAMER-MKVTOOLNIX-QA-1`: records both tools as `qa_passed_controlled_generated_private_fixture_execution_evidence`.
- `TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-QA-REVIEW-1`: accepts #673 controlled generated private fixture execution source evidence.
- `TRACKA-GSTREAMER-MKVTOOLNIX-CONTROLLED-GENERATED-PRIVATE-FIXTURE-EXECUTION-1`: source execution evidence for controlled generated fixtures only.
- `editing-agent-execution-architecture.md`: workers and agents execute approved snapshots, not raw chat.
- `editing-asset-manifest.md`: generated or processed assets must be represented in a manifest before downstream use.
- `open-source-tool-registry.md` and `tool-strategy-planner.md`: controlled tools are worker-only for execution and remain behind approval gates.

## Excluded Sources

- PR #577 remains open/draft/blocked/excluded as source-of-truth.
- GPAC/MP4Box remains outside this contract and blocked pending confirmed guarded runtime dispatch.
- FFmpeg/FFprobe remains Track B-owned shared dependency boundary.
- Arbitrary user/private media remains blocked until a later explicitly approved private input manifest and worker execution packet exists.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
