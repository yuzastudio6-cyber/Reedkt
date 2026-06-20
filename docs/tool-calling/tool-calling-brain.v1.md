# Tool-Calling Brain v1

## Purpose

The Reeditpro tool-calling brain is a planning-only runtime foundation for choosing production tool candidates by operation, media context, user preference target, quality mode, resource profile, validators, fallback rules, and future telemetry. It does not execute tools, process media, call providers, mutate Supabase, run SQL, create signed URLs, or unlock beta/production execution.

## Runtime Boundary

- Source of tool metadata: `server/tool-registry`.
- Source of QA gates: `server/tool-registry/tool-qa-policy.ts`.
- Source of fallback chains: `server/tool-registry/tool-fallback-policy.ts`.
- Future execution target: `server/workers/production/production-worker-router.ts`.
- Output execution mode: `planning_only`.
- Raw prompts are not worker execution payloads and are not included in tool-calling plan output.

## Milestone 1 Boundary

- Milestone 1 is planning-only.
- Current capability cards are generated from existing `server/tool-registry` `ProductionToolProfile` records.
- Explicit per-tool study cards are deferred to `REEDITPRO-TOOL-CALLING-BRAIN-2`.
- Runtime ID reconciliation for installed or proven tools that are not yet first-class `ProductionToolId` entries is deferred to Milestone 2.
- Runtime tool selection must not use Track A, Track B, or owner labels.
- Runtime tool selection must use operation capability, input/output compatibility, ranking policy, quality gates, fallback rules, resource profile, and future telemetry.

## Milestone 2 Capability Cards

- Milestone 2 adds explicit per-tool capability study cards under `docs/tool-calling/studies`.
- Study cards enrich operation-level planning metadata and do not replace `server/tool-registry`.
- Runtime ID aliasing resolves proven tool labels to existing `ProductionToolId` entries when possible.
- Tools that are not first-class `ProductionToolId` entries remain pending production registry expansion.
- Pending external study cards can appear in diagnostics and reports, but not as pipeline `selectedToolId` values.

## Repo Refresh And Duplicate Prevention

- The tool-calling brain is an overlay on top of existing repo systems, not a replacement for the production registry, worker router, QA policy, fallback policy, runtime contracts, or Supabase table design.
- Future capabilities and adapters must reuse existing implementations when present.
- Pending external tools must be rechecked before each milestone because they may become first-class `ProductionToolId` entries later.
- Future milestones must run `npm run tool-calling:refresh-gate` before implementation.

## Adapter Contract Layer

- Adapter contracts convert selected planning tools into structured adapter plans and future worker-route bridge metadata.
- Adapter contracts are planning-only; they do not execute tools, run shell commands, process media, or replace the worker router.
- Adapter plans are built only for selected first-class `ProductionToolId` values with adapter contracts.
- Pending external tools remain blocked from adapter plans until production registry expansion.
- Future execution must consume approved snapshots and private artifact references through the existing production worker router.

## Planning Flow

1. Resolve an operation list from a requested pattern and any explicitly requested operations.
2. Build expanded capability cards from explicit study cards plus existing production tool profiles.
3. Find multiple tool candidates for each operation from supported actions, artifact compatibility, and seeded operation mappings.
4. Rank candidates deterministically with capability, artifact, quality, reliability, speed, resource, validation, fallback, and preference dimensions.
5. Compose a planning-only pipeline step with selected tool, ranked candidates, fallback IDs, expected artifacts, quality gates, and worker type when inferable.
6. Build a pipeline fallback plan and quality gate plan from existing policies.
7. When requested, build adapter plans and worker-route bridge metadata from the selected planning-only pipeline.

## Non-Goals

- No tool execution or worker dispatch.
- No media processing.
- No provider/model calls.
- No Supabase mutation or SQL.
- No migration or schema creation.
- No package-lock mutation.
- No runtime routing based on implementation coordination labels.

## Expansion Points

- Capability cards can gain measured benchmark and telemetry fields without changing the planner interface.
- Operation definitions can add future operations with `futureAllowed: true`.
- Future worker dispatch should consume approved plan snapshots and storage artifact references, not raw chat text.
