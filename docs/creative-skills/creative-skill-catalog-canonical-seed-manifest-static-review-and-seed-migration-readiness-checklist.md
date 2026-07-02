# RP-SKILLS-30 Static Review And Seed Migration Readiness Checklist

## Manifest Structure

- JSON parsed.
- Required top-level fields present.
- No absolute local paths.
- No `/Users/...` paths.
- No secrets or signed URLs.
- No `TODO`, `TBD`, or placeholder text.
- No runtime execution claims.

## Canonical Parity

- Family union derived from TypeScript.
- Skill union derived from TypeScript.
- Exactly 21 family values.
- Exactly 140 skill values.
- No duplicate union values.
- `cta_card_design` is canonical.
- `CTA_card_design` is not seeded.
- `universal_skill_plan` is canonical.
- `universal_skill_planning_contract` is not used in contract mappings.

## Families

- Exact union parity.
- Metadata complete.
- Source paths valid.
- Parent references valid or null.
- Migration fields compatible.
- Versions positive.
- Metadata JSON is object-shaped.

## Skills

- Exact union parity.
- Metadata complete.
- Family references valid.
- No-action counterparts valid.
- Constraint values valid.
- Owner docs valid.
- Migration fields compatible.
- No provider/tool name is used as the skill identity.
- No skill claims it must be used everywhere.
- Premium and generated/future skills remain gated.

## Aliases

- Unique.
- Normalized.
- Targets valid.
- No canonical-key collision.
- Migration fields compatible.
- `canonical_skill_id` can be resolved by `canonical_skill_key`.

## Relationships

- Endpoints valid.
- No self-relations.
- No duplicates.
- Source evidence valid.
- No speculative rows.
- Migration fields compatible.
- No family-level relationship is seeded as a skill relationship.

## Contract Mappings

- Every skill mapped.
- Universal mapping present for every skill.
- Exactly one primary mapping per skill.
- No duplicate skill/contract rows.
- Contract values canonical.
- Record types valid or approved future/documentation names.
- Migration fields compatible.

## Projection And Readiness

- Static-only metadata excluded from database projection.
- No label-mapping table is planned.
- Duplicate reviews remain empty.
- Insertion order defined.
- FK resolution strategy defined.
- Conflict behavior defined.
- Exact row counts derived from the manifest.
- RLS and grants remain unchanged in the future seed migration.
- Future seed migration boundaries defined.

## Boundaries

- No SQL.
- No migration created.
- Foundation migration unchanged.
- TypeScript contracts unchanged.
- Mock fixtures unchanged.
- Package files unchanged.
- No Supabase connection.
- No seed execution.
- No runtime behavior.

## Fail The Prompt If

- The manifest is trusted without parsing.
- TypeScript unions are not derived.
- Family count is not 21.
- Skill count is not 140.
- Manifest and union keys differ.
- Migration constraints are not reviewed.
- Missing source paths are ignored.
- A non-canonical token remains in seed rows.
- Approval labels are incomplete.
- An alias collides with a canonical skill.
- A relationship lacks source evidence.
- Contract mapping coverage is incomplete.
- An expected plan record type is unresolved.
- Static metadata is projected into an unapproved table.
- Duplicate reviews receive seed rows.
- Insertion order is undefined.
- Future migration would silently ignore conflicts.
- SQL is written.
- A migration is created or modified.
- A Supabase connection is attempted.
- Package or runtime files are changed.
