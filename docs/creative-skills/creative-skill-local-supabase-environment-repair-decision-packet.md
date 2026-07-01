# RP-SKILLS-37 Creative Skill Local Supabase Environment Repair Decision Packet

## A. Purpose

RP-SKILLS-37 is a docs-only owner decision packet for the RP-SKILLS-36 local Supabase environment conflict. It does not stop containers, change `supabase/config.toml`, apply migrations, execute SQL, connect to Supabase, or start Docker/database work.

The decision needed is how to repair the local port conflict before resuming disposable local apply verification.

## B. Current Blocker Summary

RP-SKILLS-36 stopped safely before migration application because the local Supabase database port was already allocated.

Recorded blocker:

- `supabase start` failed before migration application because local port `54322` was already allocated.
- `supabase status --output json` showed the `reeditpro-local` database container was not running.
- Static RP-SKILLS-36 inspection showed an existing local Supabase stack named `reeditpro` using ports `54321`, `54322`, `54323`, `54324`, and `54327`.
- RP-SKILLS-36 did not run `supabase db reset --local --no-seed`.
- Count, key, FK, no-action counterpart, RLS, privilege, and fail-closed SQL checks were not run.

RP-SKILLS-36 recorded local apply verification decision:

- `needs_owner_decision`

## C. Files Inspected

- `supabase/config.toml`
- `docs/creative-skills/creative-skill-catalog-migrations-disposable-local-apply-and-data-verification.md`
- `docs/creative-skills/creative-skill-catalog-migrations-disposable-local-apply-and-data-verification-checklist.md`
- `docs/creative-skills/creative-skill-local-supabase-config-creation.md`
- `docs/creative-skills/creative-skill-local-supabase-config-creation-checklist.md`
- `docs/creative-skills/README.md`
- `docs/creative-skills/implementation-handoff.md`
- `type-contracts.md`
- `AGENTS.md`
- `README.md`
- `database-architecture.md`
- `backend-database-roadmap.md`
- `supabase/`
- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql`
- `package.json`

## D. Current Local Config Summary

Current `supabase/config.toml` summary:

| Setting | Current value |
| --- | --- |
| Project ID | `reeditpro-local` |
| API port | `54321` |
| DB port | `54322` |
| DB shadow port | `54320` |
| Studio port | `54323` |
| Inbucket port | `54324` |
| Inbucket SMTP port | `54325` |
| Inbucket POP3 port | `54326` |
| Analytics port | `54327` |
| Pooler port | `54329` |

Other findings:

- `supabase/seed.sql` is absent.
- `supabase/.gitignore` is absent.
- The config declares a local-only project ID and contains no remote project ref.
- The config contains no access token, service-role key, anon key, database URL, production URL, or provider credential.
- The config contains no Yuza Studio reference.

## E. Repair Options

| Option | Description | Pros | Cons | Risk | Required safeguards | Next prompt |
| --- | --- | --- | --- | --- | --- | --- |
| A | Owner manually stops the existing local `reeditpro` stack outside Codex. | Codex does not touch unrelated local state. Existing `reeditpro-local` config can stay unchanged. | Requires owner action. Existing stack downtime. | Lowest automation risk. | Owner confirms stack is stopped, or next prompt runs local status checks before retry. | `RP-SKILLS-38 - Resume Disposable Local Apply After Owner Stops Existing Stack` |
| B | Owner approves Codex to stop the existing local `reeditpro` stack by exact project ID. | Keeps config stable. Allows same local ports. | Codex touches existing local stack. Existing local data/session may be affected. | Higher automation risk. | Stop only exact project ID if CLI supports it. Do not use `--all`. Do not use `--no-backup`. Show sanitized status before and after. Do not apply migrations until stop is confirmed. | `RP-SKILLS-38 - Stop Existing Local ReeditPro Stack and Resume Disposable Apply` |
| C | Owner approves changing `reeditpro-local` config to non-conflicting local ports. | Does not stop existing stack. Can keep both local stacks. Best preserves unrelated local work. | Requires careful port selection. Future docs/checks must use new ports. | Moderate config-change risk. | Patch config only in the repair prompt. Check port availability first. Keep project ID `reeditpro-local`. Add no remote refs or secrets. Do not run CLI unless separately approved. | `RP-SKILLS-38 - Creative Skill Local Supabase Port Repair` |
| D | Owner pauses local apply verification. | No environment changes. | Catalog migrations remain unverified locally. | Lowest immediate risk; no progress. | No migration prompt until owner resumes. | None, or return later. |

## F. Recommended Option

Recommended default: Option C, patch `reeditpro-local` to a non-conflicting local-only port range in RP-SKILLS-38.

Reason:

- It preserves the existing local `reeditpro` stack.
- It avoids Codex stopping or modifying another local workflow.
- It allows concurrent local stacks if the owner wants to keep the existing stack running.

Option A is the preferred alternative if the owner wants no repo config change and can safely stop the existing local `reeditpro` stack manually.

Do not use Option B unless the owner explicitly approves Codex stopping only the existing local `reeditpro` stack by exact project ID.

## G. Owner Decisions Required

| Decision ID | Question | Allowed values | Recommendation |
| --- | --- | --- | --- |
| D1 | Which repair path is approved? | `owner_manual_stop_existing_stack`, `codex_stop_existing_stack_by_project_id`, `patch_reeditpro_local_ports`, `pause_local_apply_verification` | `patch_reeditpro_local_ports` |
| D2 | If patching ports, what range is approved? | Owner-approved local-only port band. | Candidate band: API `55431`, DB `55432`, Studio `55433`, Inbucket `55434`, Analytics `55437`, Pooler `55439`, subject to availability checks. |
| D3 | If stopping existing stack, may Codex run `supabase stop --project-id reeditpro`? | `yes_exact_project_only`, `no` | `no` unless explicitly approved. |
| D4 | If owner manually stops the stack, what proof is required? | Owner report or future local status checks. | Owner reports stack is stopped, then future prompt verifies locally. |
| D5 | Should RP-SKILLS-38 run Supabase CLI? | `yes_local_only`, `no` | Yes only for the chosen repair path and local-only commands. |
| D6 | Should RP-SKILLS-38 apply migrations after repair in the same prompt? | `yes_after_repair_verified`, `no_config_patch_only`, `depends_on_path` | Depends on path: port repair should patch config only; manual stop may resume local apply; Codex stop may resume only after status confirms local target. |

## H. Decision Outcome

`awaiting_owner_repair_choice`

No owner repair choice is present in this prompt.

## I. Recommended Owner Approval Messages

Option A:

`Approve RP-SKILLS-37 Option A: I will manually stop the existing local reeditpro stack, then proceed with RP-SKILLS-38 to resume disposable local apply verification.`

Option B:

`Approve RP-SKILLS-37 Option B: Codex may stop only the existing local reeditpro stack by exact project ID, without --all and without --no-backup, then proceed with RP-SKILLS-38.`

Option C:

`Approve RP-SKILLS-37 Option C: Patch reeditpro-local to a non-conflicting local-only port range and proceed with RP-SKILLS-38 Creative Skill Local Supabase Port Repair.`

Option D:

`Approve RP-SKILLS-37 Option D: Pause local apply verification.`

## J. Next Prompt Routing

If no owner choice is present:

- Recommend one owner approval message from section I.

If Option A is approved:

- `RP-SKILLS-38 - Resume Disposable Local Apply After Owner Stops Existing Stack`

If Option B is approved:

- `RP-SKILLS-38 - Stop Existing Local ReeditPro Stack and Resume Disposable Apply`

If Option C is approved:

- `RP-SKILLS-38 - Creative Skill Local Supabase Port Repair`

If Option D is approved:

- No active migration prompt.
