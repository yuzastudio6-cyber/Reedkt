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

## Planning Flow

1. Resolve an operation list from a requested pattern and any explicitly requested operations.
2. Build capability cards from existing production tool profiles.
3. Find multiple tool candidates for each operation from supported actions, artifact compatibility, and seeded operation mappings.
4. Rank candidates deterministically with capability, artifact, quality, reliability, speed, resource, validation, fallback, and preference dimensions.
5. Compose a planning-only pipeline step with selected tool, ranked candidates, fallback IDs, expected artifacts, quality gates, and worker type when inferable.
6. Build a pipeline fallback plan and quality gate plan from existing policies.

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
