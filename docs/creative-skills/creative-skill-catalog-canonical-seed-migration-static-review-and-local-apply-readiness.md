# RP-SKILLS-32 Creative Skill Catalog Canonical Seed Migration Static Review And Local Apply Readiness

## A. Purpose

RP-SKILLS-32 statically reviews the Creative Skill catalog foundation migration and canonical seed migration before any disposable local Supabase apply. The review proves as much as possible from repository files only, then isolates the remaining local database risks for a later milestone.

No Supabase CLI, SQL client, database container, migration application, SQL execution, build, deployment, provider, worker, runtime, UI, or app behavior was run.

## B. Files Inspected

- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql`
- `docs/creative-skills/manifests/creative-skill-catalog-canonical-seed-manifest.json`
- `docs/creative-skills/manifests/README.md`
- RP-SKILLS-27 through RP-SKILLS-31 implementation, manifest, static review, and handoff docs
- `src/types/creative-skills-core.ts`
- `src/types/index.ts`
- `src/types/shared.ts`
- `src/lib/mock-creative-skill-records.ts`
- `docs/creative-skills/README.md`
- `docs/creative-skills/implementation-handoff.md`
- `type-contracts.md`
- `AGENTS.md`, `README.md`, `database-architecture.md`, `ai-editor-data-model.md`, `signature-systems.md`, and `backend-database-roadmap.md`
- `supabase/migrations/`, `supabase/README.md`, `supabase/migration-audit.md`, `supabase/migration-order.md`, and package scripts

Expected optional local Supabase files were checked honestly: `supabase/config.toml` is absent, and `supabase/seed.sql` is absent in this snapshot.

## C. Protected-file Baseline Result

SHA-256 baselines were written outside the repository to `/tmp/rp-skills-32-baseline-sha256.txt` before edits. Protected-file comparison passed after the review.

Protected files remained unchanged:

- Foundation migration
- Seed migration
- Canonical manifest
- RP-SKILLS TypeScript contracts and `src/types/index.ts`
- Mock Creative Skill fixture
- `package.json`
- `package-lock.json`

## D. Migration Ordering And Dependency Review

| dependency | defined in migration | required by | ordering valid? | warning/blocker | notes |
| --- | --- | --- | --- | --- | --- |
| `public.set_updated_at()` | `202605130002_intent_edit_planning_tables.sql` | Foundation update triggers | Yes | None | Function exists before RP-SKILLS-27. |
| `gen_random_uuid()` convention | Earlier active migrations use it | Foundation UUID defaults | Yes | Local apply should still verify extension availability | Static review confirms repository convention, not database extension state. |
| Creative Skill tables | `202606250001_creative_skill_catalog_foundation.sql` | Seed migration | Yes | None | Foundation timestamp is unique. |
| Canonical seed DML | `202606250002_creative_skill_catalog_canonical_seed.sql` | Future local apply verification | Yes | None | Seed timestamp is unique and follows foundation. |
| Earlier migrations | Existing migration chain | Foundation migration | Yes | None | No earlier migration references `creative_skill_*` tables. |

## E. Foundation-column Compatibility Matrix

| seed target | seed insert/update columns | compatibility result | notes |
| --- | --- | --- | --- |
| `creative_skill_families` | family key, display name, purpose, planning contracts, source docs, duplicate-risk notes, lifecycle, version, metadata | Passed | All columns exist; all JSONB, text, lifecycle, and version constraints accept manifest values. |
| `creative_skills` | skill key, family lookup, type, purpose text, planning contracts, tendencies, affinities, use/avoid summaries, notes, QA family, lifecycle, version, owner doc, metadata | Passed | `family_id` resolves from `family_key`; no-action counterpart ID is intentionally second-pass. |
| `creative_skill_aliases` | alias, canonical skill lookup/key, alias metadata, status, avoid flag, notes, metadata | Passed | Optional `canonical_skill_key` is populated as reviewed audit/readability metadata. |
| `creative_skill_relationships` | endpoint lookups/keys, type, reason, strength, coexistence, StoryTiming flag, credit/approval notes, lifecycle, notes, metadata | Passed | Source docs are preserved inside `metadata_json.source_docs`, matching RP-SKILLS-31 projection. |
| `creative_skill_contract_mappings` | skill lookup/key, planning contract type, required flags, mapping role, attachment reason, expected plan type, status, version, metadata | Passed | One mapping row per skill/contract pair; all constrained values accepted. |
| `creative_skill_duplicate_reviews` | none | Passed | Table exists, remains empty, and receives no seed insert. |

## F. TypeScript / Manifest / SQL Alignment Matrix

| constrained surface | TypeScript | manifest | SQL | aligned? | discrepancy | decision |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `CreativeSkillFamily` | 21 | 21 | 21 seed rows | Yes | None | Passed. |
| `CreativeSkillKey` | 140 | 140 | 140 seed rows | Yes | None | Passed. |
| `CreativeSkillType` | Union values | All skill values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillLifecycleStatus` | Union values | Family/skill/relationship values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillRecommendationLevel` | Union values | Skill values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillComplexity` | Union values | Skill values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillCreditTendency` | `CreditImpact` plus `variable` and `unknown` | Skill values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillApprovalTendency` | Union values | Skill values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillRelationshipType` | Union values | Relationship values valid | Foundation check accepts values | Yes | None | Passed. |
| `CreativeSkillPlanningContractType` | Union values | Family/skill/mapping values valid | Foundation check accepts values | Yes | None | Passed. |

## G. Manifest Validation Result

The canonical manifest parsed as valid JSON and matched current TypeScript unions:

- 21 families
- 140 skills
- 9 aliases
- 20 relationships
- 450 contract mappings
- 0 duplicate reviews
- No duplicate family keys, skill keys, aliases, relationship tuples, or skill/contract mappings
- All references resolve
- `cta_card_design` is canonical
- `CTA_card_design` is not present
- `universal_skill_plan` is the canonical universal planning-contract token
- Every skill has a universal mapping
- Every skill has exactly one primary mapping
- All 12 no-action counterpart references resolve
- No counterpart self-reference
- Manifest source paths referenced by seed rows exist in this snapshot

## H. Family Row Parity Result

All 21 manifest family rows match the seed SQL values exactly for family key, display name, purpose, primary planning contract, related planning contracts, source docs, duplicate-risk notes, lifecycle, version, and metadata JSON.

All manifest `parent_family_key` values are null, so the seed migration correctly omits parent-family resolution.

## I. Skill Row Parity Result

All 140 manifest skill rows match the seed SQL values exactly for skill key, display name, family key lookup, skill type, purpose text, professional standard, planning contracts, recommendation level, complexity, credit/approval tendency, affinity arrays, use/avoid summaries, tool/worker/provider notes, QA family, lifecycle, version, owner doc, and metadata JSON.

The seed insert leaves `no_action_counterpart_skill_id` null initially, matching the reviewed two-pass strategy.

## J. No-action-counterpart Resolution Result

The manifest defines 12 no-action counterparts. The seed migration resolves them in a second pass by canonical skill key using `counterpart_map(skill_key, counterpart_skill_key)`.

Static review confirmed:

- The update targets only `public.creative_skills`.
- The map contains exactly the manifest-defined counterpart pairs.
- No display names or hard-coded UUIDs are used.
- A migration-local assertion requires 12 resolved no-action counterparts.
- A migration-local assertion rejects self-counterparts.

## K. Alias Row Parity Result

All 9 manifest aliases match the seed SQL values exactly for alias, canonical skill key lookup, alias type, conflict status, reason, status, avoid-new-usage flag, notes, and metadata JSON.

The seed follows the RP-SKILLS-28/RP-SKILLS-30 decision to populate optional `canonical_skill_key` audit/readability metadata while resolving `canonical_skill_id` by key. No alias equals a canonical skill key, no duplicate alias exists, and no `CTA_card_design` alias was introduced.

## L. Relationship Row Parity Result

All 20 manifest relationships match the seed SQL values exactly for endpoint keys, relationship type, reason, strength, coexistence, StoryTiming coordination flag, credit/approval notes, lifecycle, notes, and metadata projection.

Relationship source docs are preserved in `metadata_json.source_docs` because the foundation table has no dedicated relationship source-doc column.

## M. Contract-mapping Row Parity Result

All 450 manifest contract mappings match the seed SQL values exactly for skill key lookup, planning contract type, required flag, mapping role, credit/approval/future-execution readiness flags, attachment reason, expected plan record type, status, version, and metadata JSON.

Every skill has one `universal_skill_plan` mapping and exactly one primary mapping. No duplicate `skill_key + planning_contract_type` pair was found.

## N. Fail-closed Review

The seed migration is fail-closed by static design:

- Uses plain inserts only.
- Uses no `on conflict`, `merge`, conflict swallowing, `copy`, `delete`, or `truncate`.
- Inserts only into the five approved catalog metadata tables.
- Updates only `public.creative_skills` for no-action counterpart resolution.
- Counts and integrity are asserted in a final `do` block.
- Unexpected existing rows should fail through unique constraints or count assertions.
- Missing lookup rows should be detected by count/reference assertions.

No partial-success path was found that could silently omit a manifest row and still pass the migration-local assertions.

## O. Transaction/Atomicity Review

The seed migration does not explicitly add `begin` or `commit`, and RP-SKILLS-32 did not change that. Static review found no non-transactional statements in the seed migration.

Whether the migration runner wraps the file atomically and whether assertion failures roll back all prior inserts must be proven by a later disposable local apply. RP-SKILLS-32 does not execute that test.

## P. Migration-local Assertion Review

The seed migration asserts:

- Families = 21
- Skills = 140
- Aliases = 9
- Relationships = 20
- Contract mappings = 450
- Duplicate reviews = 0
- Valid skill family references
- Valid alias targets
- Valid relationship endpoints
- No self-relations
- Universal mapping for every skill
- Exactly one primary mapping per skill
- No duplicate skill/contract mappings
- 12 resolved no-action counterparts
- No counterpart self-reference
- No duplicate family keys
- No duplicate skill keys

The database assertions are count and integrity focused. Exact canonical key-set, alias-set, relationship-set, and mapping-set equality were proven statically in this milestone and should be rechecked against database rows in a later disposable local apply.

## Q. DML-only Boundary Review

Seed migration write targets are exactly:

- `creative_skill_families`
- `creative_skills`
- `creative_skill_aliases`
- `creative_skill_relationships`
- `creative_skill_contract_mappings`

Approved update target:

- `creative_skills` for no-action counterpart resolution

The seed migration contains no schema DDL, RLS mutation, grant/revoke, policy creation, duplicate-review insert, signature-system mutation, job/provider/generation record, credit reservation/spend, approval execution, user/project/edit-plan data, or runtime loader.

## R. Foundation RLS/Privilege Review

Foundation RLS posture passed static review:

- RLS is enabled on all six Creative Skill catalog tables.
- Authenticated `select` policies exist only for the five catalog metadata tables.
- Authenticated `select` grants exist only for the five catalog metadata tables.
- `creative_skill_duplicate_reviews` has no anon or authenticated client read/write policy and no authenticated select grant.
- No anon read policies were found.
- No client write policies were found.
- No service-role policy or admin-role system is created.
- No project/workspace owner fields are added.

Future local apply must prove actual role behavior against a disposable local database.

## S. Seed Migration Patch

No concrete static seed SQL defect was found. The seed migration was not patched.

## T. Static Review Decision

Decision: `seed_migration_static_review_passed`

Reasons:

- Row parity passed for all reviewed manifest row groups.
- TypeScript, manifest, foundation constraints, and seed SQL are aligned.
- Foreign-key lookup and no-action-counterpart strategy are coherent.
- Fail-closed behavior and migration-local assertions are present.
- Foundation RLS/privilege posture matches the approved boundary.
- No seed migration patch was required.

## U. Local Repository Apply Prerequisites

Repository prerequisites found:

- Coherent `supabase/migrations/` directory.
- Foundation migration sorts before seed migration.
- Earlier migrations define/reuse conventions required by the foundation migration.
- `public.set_updated_at()` is defined earlier in the chain.
- Repository docs say future Supabase work must target `reeditpro`, not Yuza Studio.

Repository prerequisites not found:

- `supabase/config.toml` is absent.
- `supabase/seed.sql` is absent.
- No approved local Supabase project config was found to prove a disposable local apply target.

## V. Future Local Apply Test Matrix

RP-SKILLS-33 or a later approved apply milestone should test:

| test group | required checks |
| --- | --- |
| Migration chain | Clean local database starts, full chain applies, foundation precedes seed, seed assertions pass, rollback behavior is observed on deliberate failure if safe. |
| Catalog counts | 21 families, 140 skills, 9 aliases, 20 relationships, 450 mappings, 0 duplicate reviews. |
| Referential integrity | Every skill has family, every alias resolves, every relationship resolves, every mapping resolves, every counterpart resolves, no self-relations, no self-counterparts. |
| Manifest parity | Database key sets and selected metadata samples equal the manifest. |
| RLS | Authenticated select succeeds on five metadata tables; anon select fails; authenticated write fails; duplicate-review client read/write fails. |
| Failure behavior | Reapplying seed fails closed; conflicting keys fail; missing lookup row fails; failed migration leaves no partial seed if transaction behavior supports rollback. |
| Boundaries | No jobs, provider/generation rows, credit rows, approval rows, project rows, user rows, or runtime rows are created. |

## W. Future Local Apply Safety Rules

A future local apply prompt must:

- Use local Supabase only.
- Never use `supabase link`, `supabase db push`, remote database URLs, production credentials, or Yuza Studio resources.
- Verify the local target before every mutating command.
- Stop if remote linkage is detected.
- Use a disposable local database/container.
- Avoid modifying tracked migration files during apply.
- Capture sanitized verification output only.
- Clean up only the disposable local environment.
- Not stage, commit, deploy, call providers, start app runtime, or run workers.

## X. Local Apply Readiness Decision

Decision: `blocked_local_apply_repository_not_ready`

Reason: `supabase/config.toml` is absent, so this snapshot does not provide an approved local Supabase project configuration for a disposable apply. This is not a SQL defect in either migration.

Required condition for the next milestone: add or verify local-only Supabase readiness and safety configuration before applying migrations.

## Y. Known Static-review Limitations

Static review cannot prove:

- The local database has `gen_random_uuid()` support enabled.
- The migration runner wraps the file in a transaction.
- Role-level RLS behavior works as expected at runtime.
- Foreign-key joins and assertions behave exactly as expected in a live database.
- Reapply and rollback failure cases leave no partial seed.

These are future disposable local apply checks, not RP-SKILLS-32 work.

## Z. Known Unrelated Build Status

Known RP-SKILLS-23 build state remains unchanged: `npm run build` previously failed only on unrelated `src/backend/services/sound-agent-planner-service.ts` issues. RP-SKILLS-32 does not run build and does not modify that service.

## AA. Migration Application Status

Both migrations remain unapplied. RP-SKILLS-32 did not invoke Supabase CLI, connect to Supabase, execute SQL, start a database/container, run migration apply/reset, deploy, or create catalog rows in any database.

## AB. Recommended Next Prompt

`RP-SKILLS-33 - Creative Skill Local Supabase Readiness Repair`

Allowed scope: local-environment/config/safety planning and repair only, with no remote connection, no production deployment, and no migration application unless separately approved later.
