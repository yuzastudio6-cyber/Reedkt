# Execution Path Decision v1

## Purpose

The execution path decision gate chooses the next safe Reeditpro tool-calling milestone after JSON-only synthetic fixture dry-runs. It exists because the stack now has planning, adapter contracts, safe command intents, fixture requirements, and dry-run manifests, but it still does not have approved binary fixture files or controlled execution.

The gate compares two next paths:

- `REEDITPRO-TOOL-CALLING-BINARY-FIXTURE-GENERATION-1`: create tiny deterministic fixture artifacts where they can be generated in-process without tool execution.
- `REEDITPRO-TOOL-CALLING-CONTROLLED-LOW-RISK-TOOL-EXECUTION-1`: execute only readiness, version, import, or probe operations through approved wrappers.

## Decision Rules

Prefer binary fixture generation first when fixture files do not exist, stack PRs are still open, safe command plans have not been tested against generated artifacts, controlled execution would need external binaries before fixtures exist, `package-lock.json` is dirty, server typecheck still fails outside this milestone, refresh state is fetch-unchecked, or existing execution helpers are smoke/runtime-specific.

Prefer controlled low-risk execution only when the refresh gate has no blockers, the selected execution target has safe fixture artifacts, no real user media is processed, the selected tool is a first-class `ProductionToolId`, adapter contracts, safe command plans, fixture plans, dry-run manifests, validators, and QA gates all exist, no duplicate execution helper already covers it, no package-lock mutation is needed, and execution can fail closed.

## Duplicate Prevention

The decision gate scans for existing fixture helpers, dry-run helpers, execution helpers, worker routes, migration drafts, and runtime SQL tests. These files are evidence. They are not copied, imported, or replaced by this milestone.

Duplicate prevention matters because other branches and owners can add worker, fixture, registry, execution, QA, fallback, or runtime-table capabilities while the tool-calling stack is still in review. Future milestones must reuse existing systems rather than creating parallel registries, routers, command policies, adapter execution layers, fixture catalogs, or Supabase runtime tables.

## Pending External Tools

Pending external tools must be rechecked before any execution milestone. A tool that becomes a first-class `ProductionToolId` later can become selectable only through the existing registry and policy chain. Pending external IDs remain excluded from selected tools, adapter plans, command plans, fixture plans, and dry-run outputs.

## Boundary

This milestone is docs and diagnostics only. It does not generate binary fixtures, execute tools, run shell commands, dispatch workers, process media, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

The current tool-calling layers remain planning and dry-run only.
