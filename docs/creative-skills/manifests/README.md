# Creative Skill Manifest Directory

This directory stores static, reviewable Creative Skill catalog manifest files.

## Manifest Index

| File | Purpose |
| --- | --- |
| [creative-skill-catalog-canonical-seed-manifest.json](creative-skill-catalog-canonical-seed-manifest.json) | RP-SKILLS-29 canonical seed manifest for future Creative Skill catalog review. |

## Source Precedence

1. Current catalog migration constraints.
2. Current RP-SKILLS-21 TypeScript unions.
3. RP-SKILLS-13 taxonomy and family catalog doctrine.
4. Specialized RP-SKILLS planning contracts.
5. Existing ReeditPro source-truth docs.
6. RP-SKILLS-22 mock fixtures as examples only.

## Boundary

The JSON manifest is not SQL, a seed migration, a seed script, a Supabase import, runtime config, provider config, worker config, or app behavior. Do not import it into runtime automatically.

Future seed migrations should resolve rows by canonical keys, not generated DB UUIDs. IDs should be looked up by `family_key`, `skill_key`, `alias`, and `planning_contract_type` inside a reviewed seed-only migration.

Database row projection is intentionally narrow:

- `families` becomes `creative_skill_families` rows.
- `skills` becomes `creative_skills` rows.
- `aliases` becomes `creative_skill_aliases` rows.
- `relationships` becomes `creative_skill_relationships` rows.
- `contract_mappings` becomes `creative_skill_contract_mappings` rows.
- `duplicate_reviews` remains empty and creates no seed rows.

The top-level schema/catalog fields, source-truth metadata, canonicalization decisions, and label mappings remain static manifest metadata. They must not create new catalog tables or label-mapping tables.

Future seed migrations should fail closed on unexpected unique or foreign-key conflicts. They should not use conflict handling to hide manifest defects.

`duplicate_reviews` is intentionally empty because duplicate reviews are future trusted-backend/admin audit data, not canonical seed data.

Do not apply this manifest to Supabase without a reviewed seed migration and owner approval.
