# Adapter Contract Report

## Branch State

This report covers `REEDITPRO-TOOL-CALLING-ADAPTER-CONTRACTS-1`, stacked on `codex/reeditpro-tool-calling-refresh-gate-1`.

The mandatory refresh gate was run before implementation. It reported `continueAllowed: true` with warnings for the existing unstaged `package-lock.json` change and default fetch skip.

## Contracts Added

The adapter registry now generates planning-only contracts for every first-class runtime tool on the current base. Track B registry planning expands that set with `mediainfo`, `exiftool`, `tesseract`, and `imagemagick`.

Contracts are generated from `PRODUCTION_TOOL_IDS`, existing `ProductionToolProfile` records, and explicit capability cards; the current base has 53 planning-only adapter contracts after Track B promotion.

Contracts are generated from existing `ProductionToolProfile` records plus capability cards. No duplicate production registry, worker router, QA policy, fallback policy, runtime table, or execution-plan table is introduced.

## Pending Adapter Contracts

Bare `graphicsmagick` remains pending and intentionally receives no adapter contract or adapter plan. `imagemagick_graphicsmagick` resolves to the first-class `imagemagick` planning contract; that does not count GraphicsMagick as first-class.

## Worker Bridge Categories

Bridge metadata maps pipeline operations to future worker categories only: `cpu_analysis_worker`, `gpu_ai_worker`, `render_worker`, and `qa_worker`. The bridge does not import or call the production worker router.

Every bridge plan requires approved snapshots and disallows raw prompt text, signed URLs, service-role context, and execution.

## Validation

Validation results for the PR:

- `npm run tool-calling:refresh-gate`: passed with warnings for existing unstaged `package-lock.json` and default fetch skip.
- `npm run tool-calling:diagnostics`: passed.
- `npm run tool-calling:adapter-contracts`: passed with 18 adapter contracts and 37 adapter/worker bridge plans across the four initial patterns.
- `npm run smoke:prod-tool-registry`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `git diff --cached --check`: run after staging.
- `npm run typecheck:server`: failed due to existing unrelated activation and smoke errors; no `server/tool-calling` errors were found after the in-scope duplicate import was fixed.
