# AI Graphics Tool Route Readiness Contract

Decision: `ai_graphics_tool_route_readiness_contract_prepared_with_execution_blocks`

Branch: `codex/rp-ai-graphics-tool-call-readiness-contract`

Draft PR: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862)

## Purpose

This contract prepares the future AI graphics Tool Route surface that will consume canonical capability selection, ranking, production tool IDs, worker types, runtime targets, beta-readiness blockers, and missing proof rules.

It is a planning route only. It does not approve tool execution.

## Current Result

- Tools covered: 21.
- Product-facing capabilities covered: 12.
- Planning metadata route-ready capabilities: 12.
- Execution-ready capabilities: 0.
- Fail-closed execution request dry-runs: 12.
- GPU/model tools targeting GPU runtime: 8.
- Heavy tools incorrectly targeting CPU: 0.

## Allowed Planning Route Behavior

- Read canonical AI graphics capability metadata.
- Rank candidate tools with the approved scoring/ranking contract.
- Return planning-only selected tools, production tool IDs, worker types, runtime targets, blockers, and next milestones.
- Explain missing proof and runtime blockers.

## Required Inputs Before Any Execution

- Approved plan snapshot ID.
- Credit reservation ID.
- Artifact boundary approval.
- Tool Route approval reference.
- Worker approval reference.
- Private artifact manifest reference.
- Runtime proof accepted by the beta-readiness gate.
- Internal beta owner approval.

## Blocked Execution Behavior

The route remains fail-closed for agent/tool execution, Tool Route execution, Worker execution, provider/model execution, browser/WebGL/canvas runtime execution, GPU/model runtime execution, model weight download/load, media processing, Supabase/GCS mutation, signed URL creation, public artifact creation, beta, and production.

## No-Scope

No dependencies were installed, no `npm ci` or `npm install` ran, no tools/routes/workers/providers executed, no browser/WebGL/canvas runtime ran, no GPU/model runtime ran, no model weights were downloaded or loaded, no media was processed, no Supabase/GCS mutation occurred, no signed URL or public artifact was created, and no beta or production gate was unlocked.
