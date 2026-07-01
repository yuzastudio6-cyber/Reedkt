# RP-SKILLS-34 Creative Skill Local Supabase Owner Decision Packet

## A. Purpose

RP-SKILLS-34 creates a docs-only owner decision packet for the remaining local Supabase readiness blocker. It does not create Supabase config, connect to Supabase, run Supabase CLI, execute SQL, apply migrations, start Docker or a database, inspect credentials, or change runtime behavior.

## B. Current Blocker

RP-SKILLS-33 recorded:

- Config repair decision: `owner_decision_required`
- Local apply readiness decision: `blocked_owner_decision_required`
- Blocker: `supabase/config.toml` is absent and owner approval is required before creating or approving local Supabase config

No local apply is allowed yet.

## C. Files Inspected

- `docs/creative-skills/creative-skill-local-supabase-readiness-repair.md`
- `docs/creative-skills/creative-skill-local-supabase-readiness-repair-checklist.md`
- RP-SKILLS-31 through RP-SKILLS-33 migration and readiness docs
- `docs/creative-skills/README.md`
- `docs/creative-skills/implementation-handoff.md`
- `type-contracts.md`
- `AGENTS.md`
- `README.md`
- `database-architecture.md`
- `backend-database-roadmap.md`
- `supabase/`
- `package.json`
- `scripts/`

## D. Current Supabase Repo State

| item | current state | decision impact |
| --- | --- | --- |
| `supabase/migrations/` | Present with the Creative Skill foundation and seed migrations. | Ready for future local-only apply after owner-approved config. |
| `supabase/config.toml` | Absent. | Owner decision required before creating it. |
| `supabase/config.example.toml` | Absent. | No example-config convention exists. |
| `supabase/seed.sql` | Absent. | Owner should decide whether to keep absent or create empty later. |
| `supabase/.gitignore` | Absent in current inspection. | Future config prompt should decide whether local generated files need ignore rules. |
| Remote project refs | None found by static inspection. | Future prompt must still re-check before any command. |
| Secrets or credentials | None found by static inspection. | Do not add any in config or docs. |
| ReeditPro boundary | Existing docs identify `reeditpro` as the future Supabase project boundary. | Preserve. |
| Yuza Studio boundary | Existing docs mention Yuza Studio only as forbidden. | Preserve as forbidden boundary only. |

## E. Package And Script Safety Findings

`package.json` contains no approved Supabase local apply script. Existing repo scripts include validation and runtime smoke commands, but none should be used as a substitute for owner-approved local Supabase configuration.

Scripts and docs mention Supabase as a mutation boundary, but RP-SKILLS-34 does not run any script that invokes Supabase, SQL, Docker, providers, workers, app runtime, or deployment.

## F. Owner Decisions Required

| Decision ID | Question | Recommended answer | Alternatives | Risk if undecided | Required before next prompt? |
| --- | --- | --- | --- | --- | --- |
| D1 | Should the repo create a checked-in local-only `supabase/config.toml`? | Yes, in RP-SKILLS-35 if owner approves. | Keep config untracked; create only an example config; defer config. | Future local apply remains blocked. | Yes |
| D2 | Should the repo create only `supabase/config.example.toml` instead? | No, not if future disposable local apply should work from repo state. | Example-only template. | Future apply prompt would still lack approved real config. | Yes |
| D3 | What local project ID should be used? | `reeditpro-local` | Owner-provided local ID. | Ambiguous project identity and unsafe target checks. | Yes |
| D4 | Should config include any remote project ref? | No. | None recommended. | Remote linkage risk. | Yes |
| D5 | Should config include credentials? | No. | None recommended. | Secret leakage and remote mutation risk. | Yes |
| D6 | Should `supabase/seed.sql` be created now? | No. Keep absent unless a later config prompt finds the Supabase CLI requires an empty file. | Create empty seed file in RP-SKILLS-35; defer to apply prompt. | Ambiguous seed behavior. | Yes |
| D7 | Which future Supabase CLI commands may be allowed in a disposable local apply prompt? | Local-only commands after remote-safety checks, such as `supabase start`, local reset/apply commands, and local SQL verification commands. | Use existing local environment if owner prefers. | Accidental remote execution. | Yes |
| D8 | Which Supabase commands remain forbidden? | `supabase link`, `supabase db push`, remote SQL, production deploy, remote migration application, and commands using access tokens or database URLs. | None recommended. | Remote database mutation. | Yes |
| D9 | How should remote-link detection work? | Before any future CLI command, statically check project refs, access tokens, remote DB URLs, linked metadata, and production URLs; stop if found. | Add extra manual confirmation step. | Unsafe target cannot be ruled out. | Yes |
| D10 | How should the `reeditpro` boundary be represented? | Docs/config comments should state production/future target is `reeditpro`; local config uses `reeditpro-local`. | Owner-provided local naming. | Confusion between local and future project boundaries. | Yes |
| D11 | Should a future prompt be allowed to start Docker/local database? | Yes, only in a future disposable local apply prompt after local config exists and remote-safety checks pass. | Use an already-running local environment if owner approves. | Local apply cannot be verified. | Yes |
| D12 | Should canonical seed migrations be applied to any remote database? | No. Disposable local verification first; remote/staging/prod remains out of scope. | None recommended. | Production data/schema risk. | Yes |

## G. Recommended Owner Decision Set

Approve this set before RP-SKILLS-35:

- Create a checked-in, local-only `supabase/config.toml`.
- Use local project ID `reeditpro-local`.
- Include no remote project ref, access token, database URL, password, anon key, service-role key, production URL, signed URL, provider credential, or function secret.
- Keep `supabase/seed.sql` absent unless the config implementation prompt proves an empty file is required.
- Do not create `supabase/config.example.toml` as the only readiness artifact.
- Allow no Supabase CLI in RP-SKILLS-35 unless separately approved.
- Require remote-link detection before any later local apply command.
- Preserve `reeditpro` as the future Supabase project boundary and treat Yuza Studio Supabase as forbidden.
- Defer Docker/database startup and migration application to a later disposable local apply prompt.
- Never apply the Creative Skill catalog migrations to a remote database before disposable local verification.

## H. Future Config Implementation Requirements

If owner approves, RP-SKILLS-35 should:

- Create `supabase/config.toml`.
- Keep it local-only and non-secret.
- Use local project ID `reeditpro-local`.
- Include no remote refs or credentials.
- Preserve migrations, manifest, TypeScript contracts, mock fixtures, and package files.
- Update README, handoff, and any local Supabase readiness docs.
- Run static checks only unless owner separately approves local CLI execution.

## I. Future Disposable Local Apply Requirements

A later local apply prompt should:

- Verify local-only target before every command.
- Run Supabase CLI only against a disposable local environment.
- Apply the repository migration chain locally.
- Verify Creative Skill catalog counts, key parity, foreign keys, no-action counterparts, assertions, and RLS behavior.
- Capture sanitized output without secrets.
- Stop immediately if any remote linkage, access token, production URL, or database URL is detected.
- Avoid remote Supabase, deployment, runtime/app behavior, providers, workers, package changes, and migration edits unless a separate repair prompt approves them.

## J. Remaining Blockers

- Owner approval is still missing.
- No local Supabase config exists.
- No future local apply prompt should run until the owner approves the recommended decision set.

## K. Decision Outcome

Decision outcome: `awaiting_owner_approval`

This packet recommends a decision set, but it does not claim owner approval.

## L. Recommended Next Prompt

Recommended next step:

`Approve RP-SKILLS-34 recommended decisions and proceed with RP-SKILLS-35.`

After that approval, the next implementation prompt should be:

`RP-SKILLS-35 - Creative Skill Local Supabase Config Creation`

RP-SKILLS-35 allowed scope: create local-only `supabase/config.toml`, no secrets, no remote refs, no SQL execution, no migration application, no runtime behavior, no UI, no providers, no workers, and no package changes unless explicitly approved.
