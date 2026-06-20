# Tool-Calling Brain Repo Integration Audit

## Target Repo

- Implementation target: `/Users/macuser/Developer/REeditpro`.
- Starting branch candidate: `codex/sound-music-audio-1abc-checkpoint`.
- New implementation branch: `codex/reeditpro-tool-calling-brain-1`.
- Milestone 2 stacked branch: `codex/reeditpro-tool-calling-brain-2-capability-cards`.
- The light shell at `/Users/macuser/Documents/Frontend` is not the implementation target.

## Existing Systems Reused

- Production tool metadata is reused from `server/tool-registry/index.ts`, `production-tool-types.ts`, and `production-tool-profiles.ts`.
- QA planning reuses `server/tool-registry/tool-qa-policy.ts`.
- Fallback planning reuses `server/tool-registry/tool-fallback-policy.ts`.
- Artifact and quality gate types reuse `src/backend/contracts/production-tool-runtime-contracts.ts` where applicable.
- Future execution remains targeted at `server/workers/production/production-worker-router.ts`.

## Milestone 2 Capability Card Expansion

- Explicit study cards now add per-tool operation metadata for the installed and proven Reeditpro stack.
- Study cards enrich generated `ProductionToolProfile` capability cards; they do not replace `server/tool-registry`.
- First-class `ProductionToolId` entries remain the only selectable runtime IDs for pipeline `selectedToolId`.
- Pending external cards are included only in diagnostics, reconciliation reports, and future expansion notes.

## Duplicate Systems Not Created

- No second production tool registry.
- No second worker router.
- No duplicate QA policy.
- No duplicate fallback policy.
- No duplicate `tool_execution_plans`, `tool_runs`, `tool_artifacts`, `quality_gate_results`, or `fallback_decisions`.
- No migration or SQL file for this milestone.

## Runtime Registry Expansion Still Deferred

- MediaInfo, ExifTool, Tesseract, and ImageMagick/GraphicsMagick remain pending production registry expansion on this base.
- Pending external tools need first-class `ProductionToolId` profiles before runtime selection.
- Pending external aliases are documented in `docs/tool-calling/runtime-id-reconciliation-report.md`.

## Mandatory Refresh Gate Before Future Milestones

- Every future tool-calling milestone must start with `npm run tool-calling:refresh-gate`.
- When network refresh is safe, rerun with `REEDITPRO_REFRESH_GATE_ALLOW_FETCH=1 npm run tool-calling:refresh-gate`.
- The gate checks for stale stack state, duplicate study cards, duplicate aliases, duplicate local registry/router/QA/fallback systems, package-lock staging risk, and pending external tools that became first-class runtime IDs.
- Future work must reuse existing registry, router, QA, fallback, runtime contract, and Supabase table systems instead of creating parallel implementations.

## Safety Confirmation

- The new brain produces planning-only output with `executesTools: false`.
- Pipeline steps use `executionMode: planning_only`.
- The diagnostics do not process media, call providers, create signed URLs, mutate Supabase, run SQL, or dispatch workers.
- `package-lock.json` is intentionally not modified by this milestone.
