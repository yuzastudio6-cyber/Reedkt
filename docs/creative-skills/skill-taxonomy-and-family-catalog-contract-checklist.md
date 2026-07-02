# Skill Taxonomy And Family Catalog Contract Checklist

Use this checklist for future skill taxonomy and family catalog prompts. This is documentation only and must not be converted into runtime code, TypeScript, SQL, JSON schema, migrations, prompt execution, skill catalog storage, skill resolver behavior, orchestration runtime, workers, providers, render/export, UI, package changes, Supabase work, or app behavior.

## Required Checks

| Check | Pass condition |
| --- | --- |
| Canonical skill key present | A stable lowercase snake_case canonical `skill_key` exists. |
| Family exists | The skill belongs to a canonical top-level family. |
| Display name present | A clear human-readable display name exists. |
| Purpose present | The skill has a concise purpose and plain-language definition. |
| Boundary checked | The skill is not a tool, provider, worker, prompt, workflow, credit tier, UI label, or style clone. |
| Planning contract mapped | The skill maps to at least `universal_skill_plan` and any specialized contract it needs. |
| When-to-use present | A `when_to_use_summary` or equivalent use rule exists. |
| When-to-avoid present | A `when_to_avoid_summary` or equivalent restraint rule exists. |
| Credit tendency present | Default credit tendency is one of `none`, `low`, `medium`, `high`, `premium`, or `variable`. |
| Approval tendency present | Default approval tendency is one of `no_approval_needed`, `approval_if_user_visible`, `approval_if_credit_bearing`, `approval_if_premium`, `approval_always`, `user_confirmation_needed`, or `source_confirmation_needed`. |
| Lifecycle status present | Catalog lifecycle status is declared. |
| Owner doc/source truth present | Owner docs or missing owner notes are recorded honestly. |
| Alias reviewed | Known aliases map to canonical keys and are not used as canonical keys. |
| Duplicate review performed | Similar skills, aliases, roles, tools, providers, workers, prompts, UI labels, workflows, preferences, and `no_*` restraint skills were checked. |
| Related skills canonical | Related, alternative, and lower-cost skill keys use canonical names. |
| Preference influence considered | Preferred/blocked/family-level preference behavior references canonical keys. |
| StoryTiming influence considered | Density, conflicts, focus, and relationship behavior are usable by StoryTiming coordination. |
| Runtime actions avoided | The prompt avoids runtime code, TypeScript, migrations, installs, package mutations, UI, providers, workers, Supabase, catalog/resolver runtime, orchestration, render/export, media/audio/caption/browser/WebGL/canvas/3D runtime, and app behavior. |

## Required Pseudo-record Coverage

Future taxonomy prompts should cover these documentation-only pseudo-records or explain why a record is out of scope:

- `SkillAlias`
- `SkillDuplicateReview`
- `CreativeSkillCatalogRecord`
- `CreativeSkillFamilyRecord`
- `CreativeSkillRelationship`

These pseudo-records must remain Markdown documentation unless a later explicitly approved implementation prompt creates real contracts.

## Required Taxonomy Coverage

Future taxonomy prompts should cover:

- Skill taxonomy doctrine.
- Skill/family/role/subskill/tool/provider/worker/prompt/UI boundaries.
- Naming rules.
- Canonical top-level families.
- Family relationship model.
- Grouped launch skill list.
- Catalog lifecycle statuses.
- Per-edit route/use statuses.
- Recommendation levels.
- Complexity values.
- Credit tendency values.
- Approval tendency values.
- Aliases and deprecated names.
- Duplicate skill prevention.
- Planning contract mapping.
- Source-of-truth mapping.
- Edit preference influence.
- StoryTiming influence.
- Credit/approval influence.
- Tool/worker/provider boundary influence.
- Taxonomy QA.
- Examples and anti-patterns.

## Fail The Prompt If

- Skill key is duplicate.
- Skill key is not snake_case.
- Skill is actually a tool, provider, worker, prompt, workflow, UI label, credit tier, or style label.
- Skill has no planning contract.
- Skill has no `when_to_avoid_summary`.
- Skill implies execution without planning.
- Skill implies generation without approval.
- Premium skill lacks approval/credit hints.
- Alias conflicts with canonical key.
- Skill hard-codes one reference style.
- Skill copies a reference exactly.
- Skill forces use everywhere.
- Skill bypasses StoryTiming.
- Skill bypasses approval or credits.
- Skill stores provider credentials, API keys, secrets, signed URLs, or service-role keys.
- Prompt adds runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before the schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks skill catalog, skill resolver, orchestration, provider, worker, render/export, media/audio/caption/browser/WebGL/canvas/3D, generation runtime, or app behavior.

## Future Prompt Footer

Future taxonomy prompts should end by stating:

- Public API changes: none, unless explicitly approved later.
- TypeScript contract changes: none, unless explicitly approved later.
- Database/Supabase changes: none, unless explicitly approved later.
- Runtime/provider/package/UI changes: none, unless explicitly approved later.
- Skill catalog runtime, skill resolver runtime, preference runtime, settings UI, profile storage, orchestration, render/export, providers, workers, Supabase, media processing, audio generation, SFX generation, music generation, caption rendering, ASR/transcript/translation, browser/capture/media runtime, WebGL/canvas/3D runtime, and app behavior remain forbidden unless explicitly authorized in a later implementation prompt.
