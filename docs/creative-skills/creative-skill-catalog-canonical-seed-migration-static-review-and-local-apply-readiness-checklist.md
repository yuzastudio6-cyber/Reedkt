# RP-SKILLS-32 Static Review And Local Apply Readiness Checklist

## Migration Ordering

- [x] Foundation timestamp `202606250001` is unique.
- [x] Seed timestamp `202606250002` is unique.
- [x] Seed migration follows the foundation migration.
- [x] `public.set_updated_at()` dependency exists earlier in the chain.
- [x] UUID default convention using `gen_random_uuid()` was reviewed.
- [x] No earlier migration creates or references conflicting `creative_skill_*` tables.

## Foundation Compatibility

- [x] All seed family columns exist and are compatible.
- [x] All seed skill columns exist and are compatible.
- [x] All seed alias columns exist and are compatible.
- [x] All seed relationship columns exist and are compatible.
- [x] All seed contract-mapping columns exist and are compatible.
- [x] Foundation check constraints accept manifest and seed values.
- [x] Foundation foreign-key targets exist.
- [x] RLS and privilege posture reviewed.

## Manifest Parity

- [x] 21 family rows match.
- [x] 140 skill rows match.
- [x] 9 alias rows match.
- [x] 20 relationship rows match.
- [x] 450 contract mapping rows match.
- [x] Zero duplicate-review rows are seeded.
- [x] TypeScript family/key parity passes.
- [x] Exact row parity passes.
- [x] Deterministic ordering is preserved.

## Foreign-key Resolution

- [x] Family lookup checked.
- [x] Alias lookup checked.
- [x] Relationship endpoint lookup checked.
- [x] Contract mapping skill lookup checked.
- [x] No-action counterpart second pass checked.
- [x] Unresolved lookup detection is covered by migration-local assertions.
- [x] No hard-coded UUIDs are used.

## Fail-closed Behavior

- [x] No `on conflict`.
- [x] No `merge`.
- [x] No conflict swallowing.
- [x] No exception handlers that ignore uniqueness failures.
- [x] Exact count assertions exist.
- [x] Integrity assertions exist.
- [x] No partial-success path was found statically.

## DML Boundary

- [x] Approved five insert targets only.
- [x] Duplicate reviews untouched.
- [x] No schema DDL in seed migration.
- [x] No policy or grant changes in seed migration.
- [x] Approved update target only: `creative_skills` for no-action counterparts.
- [x] No runtime, project, user, job, provider, generation, credit, approval, or signature-system records.

## Local Readiness

- [x] Supabase config inspected.
- [x] `supabase/config.toml` absence recorded.
- [x] Migration directory is coherent.
- [x] Local safety boundaries documented.
- [x] Future local apply test matrix present.
- [x] No Supabase CLI invoked.
- [x] No connection attempted.
- [x] No SQL executed.

## Decisions

- [x] Static review decision present: `seed_migration_static_review_passed`.
- [x] Local apply readiness decision present: `blocked_local_apply_repository_not_ready`.
- [x] Correct next prompt present: `RP-SKILLS-33 - Creative Skill Local Supabase Readiness Repair`.

## Fail The Prompt If

- Supabase CLI is invoked.
- SQL is executed.
- Either migration is applied.
- Another migration is created.
- The foundation migration is changed.
- The canonical manifest is changed.
- TypeScript contracts or mock fixtures are changed.
- Package files are changed.
- Seed SQL is trusted without row-parity review.
- Migration constraints are not compared to TypeScript.
- Join-based inserts can silently lose rows.
- Migration-local assertions are not reviewed.
- RLS is not reviewed.
- Local apply readiness is declared without repository prerequisite review.
- Protected-file hashes are not checked.
- Runtime behavior, UI, providers, workers, jobs, credit runtime, approval runtime, render/export, browser/media, audio/music generation, caption runtime, WebGL/canvas/3D runtime, or app behavior is added.
