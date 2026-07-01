# RP-SKILLS-29 Creative Skill Catalog Canonical Seed Manifest Completion Checklist

## Canonical Sources

| Check | Requirement |
| --- | --- |
| TypeScript unions derived | Derive values from `src/types/creative-skills-core.ts`; do not assume counts manually. |
| Migration constraints inspected | Compare constrained values to `202606250001_creative_skill_catalog_foundation.sql`. |
| Taxonomy docs inspected | Use RP-SKILLS-13 for launch list and family intent. |
| Specialized contracts inspected | Use specialized RP-SKILLS contracts for family-specific standards. |
| Mock fixtures treated as examples only | RP-SKILLS-22 fixtures do not define complete seed coverage. |

## Family Manifest

- Exactly 21 families.
- No missing, extra, or duplicate family keys.
- Required metadata complete.
- Planning contracts canonical.
- Source docs valid.

## Skill Manifest

- Exactly 140 skills.
- No missing, extra, or duplicate skill keys.
- Family references valid.
- Required metadata complete.
- When-to-use and when-to-avoid summaries present.
- No-action counterpart references valid.
- Credit and approval tendencies present.
- No placeholders.
- No runtime claims.

## Canonicalization

- `cta_card_design` is canonical.
- `CTA_card_design` is not seeded as canonical.
- `universal_skill_plan` is canonical.
- Approval label mapping covers every approval tendency.

## Aliases

- Aliases are normalized.
- Canonical targets are valid.
- No alias equals a canonical skill key.
- No collisions or speculative aliases are seeded.

## Relationships

- Endpoints are canonical.
- No self-relations.
- No duplicate from/to/type rows.
- Source evidence is present.
- Speculative relationships are deferred.

## Contract Mappings

- Every skill is mapped.
- Universal mapping exists for every skill.
- Every skill has exactly one primary mapping.
- Specialized coverage is complete.
- No duplicate skill/contract pairs.
- Contract values are canonical.

## Boundaries

- `duplicate_reviews` is empty.
- No SQL is written.
- No migration is modified.
- No seed is executed.
- No Supabase connection is attempted.
- No TypeScript, mock, package, or runtime files are changed.

## Fail The Prompt If

- Family count is not 21.
- Skill count is not 140.
- Count is manually assumed instead of derived.
- A TypeScript key is missing from the manifest.
- A manifest key is absent from TypeScript.
- A non-lowercase canonical skill key remains.
- `CTA_card_design` is seeded as canonical.
- A non-canonical planning-contract value is used.
- Approval label mapping is incomplete.
- A skill lacks when-to-avoid guidance.
- A skill lacks planning-contract mapping.
- Universal mapping is missing.
- An alias collides with a canonical key.
- A relationship is speculative without source evidence.
- Duplicate-review seed rows are added.
- SQL is written.
- A migration is modified.
- A Supabase connection is attempted.
- Package or runtime files are changed.
