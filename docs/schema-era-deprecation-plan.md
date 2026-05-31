# Schema Era Deprecation Plan

Prompt 2A does not delete or rewrite historical docs or migrations. It defines how future prompts should avoid old schema concepts while preserving history.

## Files That May Mislead Future Implementation

- `database/migration-drafts/`
- `supabase-table-specification.md`
- `supabase-schema-planning-bridge.md`
- `database-architecture.md` where table targets conflict with Prompt 2A
- `backend-database-roadmap.md`
- Older SQL draft/review docs that predate the RP-DATA/runtime contract
- RP-DB-era migration comments in `supabase/migrations/20260513*.sql`
- Mock/runtime docs that reference legacy table families as if they were production-ready

## Labeling Approach

Future docs cleanup should add a short warning banner to legacy/draft schema docs:

```text
Schema target warning: this file is historical or planning reference. For backend implementation, use docs/canonical-schema-contract.md and docs/table-concept-resolution-matrix.md.
```

Do not add banners to active SQL files until a migration-preparation prompt decides how to handle migration history.

## Preserve For History

Preserve all existing SQL migrations, draft SQL files, and historical docs until a reviewed migration-preparation prompt decides otherwise. Do not delete or rewrite old migrations in docs-only prompts.

## TypeScript Type Alignment

Update TypeScript types only after the canonical SQL path is selected and local validation succeeds. Until then, new backend services must explicitly cite `docs/canonical-schema-contract.md` and avoid broad type rewrites.

## Mock Data Updates

Mock data may be updated after service-specific prompts choose a canonical domain. Do not rewrite all mock fixtures in Prompt 2A.

## Route Contract Updates

Route contracts should be updated only when their service milestone is implemented. Prompt 3 may update auth/profile/workspace/project route docs only if it stays within Prompt 3 guardrails.

## SQL Smoke Test Updates

SQL smoke tests should be updated after Prompt 2A if a future migration-preparation prompt resolves duplicate active table concepts. Until then, tests remain validation intent, not proof of production readiness.

## Compatibility Views

Compatibility views may be useful if old docs/types need a stable bridge, but they require SQL design, local validation, RLS review, and a separate migration prompt. Do not create compatibility views in docs-only milestones.

## What Not To Delete Yet

- Active migrations.
- Draft migrations.
- SQL smoke tests.
- Historical schema docs.
- Legacy RP-DB table references.
- Static audit output.

Deletion or migration history rewrite would make future debugging harder and is out of scope until a reviewed migration plan exists.
