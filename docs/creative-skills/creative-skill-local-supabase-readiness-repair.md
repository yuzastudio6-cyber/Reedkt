# RP-SKILLS-33 Creative Skill Local Supabase Readiness Repair

## A. Purpose

RP-SKILLS-33 repairs the local Supabase readiness blocker identified by RP-SKILLS-32 by documenting the owner decision needed before any local Supabase config is added. This is a readiness and safety packet only.

No Supabase CLI, Supabase connection, SQL execution, migration application, database/container startup, deployment, build, runtime, provider, worker, UI, package, or app behavior work occurred.

## B. Files Inspected

- `docs/creative-skills/creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness.md`
- `docs/creative-skills/creative-skill-catalog-canonical-seed-migration-static-review-and-local-apply-readiness-checklist.md`
- `supabase/migrations/202606250001_creative_skill_catalog_foundation.sql`
- `supabase/migrations/202606250002_creative_skill_catalog_canonical_seed.sql`
- `docs/creative-skills/manifests/creative-skill-catalog-canonical-seed-manifest.json`
- RP-SKILLS-27 through RP-SKILLS-32 migration, manifest, static review, and handoff docs
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

## C. RP-SKILLS-32 Blocker Summary

RP-SKILLS-32 completed the static catalog migration review and recorded:

- Seed migration static-review decision: `seed_migration_static_review_passed`
- Local apply readiness decision: `blocked_local_apply_repository_not_ready`
- Blocker: `supabase/config.toml` is absent

Both Creative Skill catalog migrations remain unapplied.

## D. Supabase Directory Findings

| item | current result | readiness impact |
| --- | --- | --- |
| `supabase/migrations/` | Present and coherent. | Ready for future local-only apply review after config decisions. |
| `supabase/config.toml` | Absent. | Blocks disposable local apply readiness. |
| `supabase/config.example.toml` | Absent. | No repo convention for a safe template exists yet. |
| `supabase/seed.sql` | Absent. | Future owner decision should choose whether to leave absent, create empty, or defer. |
| `supabase/.gitignore` | Absent in current inspection. | No local Supabase generated-file ignore convention found. |
| Remote link/project-ref file | None found by static inspection. | No remote linkage found, but future CLI work must verify again before any command. |
| Secret-bearing Supabase file | None found by static inspection. | No secret blocker found. |
| Yuza Studio Supabase reference | Only forbidden-boundary prose found. | Preserve the ban; do not use Yuza Studio resources. |
| `reeditpro` reference | Present in docs and migrations. | Future target boundary remains `reeditpro`. |

## E. Package And Script Safety Findings

`package.json` contains app, server, smoke, worker, Docker, and validation scripts, but no approved Supabase local apply script for RP-SKILLS-33. Existing scripts that mention Supabase are not a substitute for local database readiness and must not be run as part of this prompt.

No package script was run for Supabase. No Supabase CLI command was invoked.

## F. Config Repair Decision

Decision: `owner_decision_required`

Evidence:

- `supabase/config.toml` is absent.
- `supabase/config.example.toml` is absent.
- `supabase/seed.sql` is absent.
- No repo-local Supabase config convention was found.
- `backend-database-roadmap.md` says to add local Supabase config only after credentials and project refs are verified.
- RP-SKILLS-33 is not authorized to connect to Supabase, inspect credentials, invoke Supabase CLI, or prove local port/project settings.

No config file was created.

## G. Config File Created

None.

RP-SKILLS-33 did not create:

- `supabase/config.toml`
- `supabase/config.example.toml`
- `supabase/seed.sql`
- SQL scripts
- migrations
- Supabase credentials or project-ref files

## H. Local Safety Boundaries

Future local Supabase work must:

- Target `reeditpro` only.
- Avoid Yuza Studio Supabase resources.
- Avoid remote project links.
- Avoid production credentials and URLs.
- Avoid committed access tokens, anon keys, service-role keys, database passwords, provider credentials, signed URLs, and function secrets.
- Verify local-only target before any mutating command.
- Keep catalog migrations unchanged unless a separate repair prompt approves a concrete migration fix.

## I. Remote And Project-ref Safety Findings

Static inspection found no `supabase/config.toml`, no local project ref, no remote database URL, no Supabase access token, and no committed key file. This means there is no known unsafe remote linkage in the inspected files, but there is also no approved local target.

Remote-link detection remains a required owner decision and future apply prerequisite.

## J. ReeditPro / Yuza Studio Boundary Findings

Existing docs consistently state that future Supabase work must use the `reeditpro` project boundary and must not use Yuza Studio Supabase resources. RP-SKILLS-33 preserves that boundary and does not add any project ref.

## K. Future Disposable Local Apply Prerequisites

Before any disposable local apply prompt:

- Owner must decide whether `supabase/config.toml` should be checked in or kept local-only.
- Owner must approve a local project ID.
- Owner must approve local port choices.
- Owner must decide whether `supabase/seed.sql` should be absent, empty, or populated later.
- Owner must decide whether future prompt may invoke Supabase CLI locally.
- Future prompt must verify no remote link, remote project ref, production URL, or credential is present.
- Future prompt must verify the local target before every mutating command.

## L. Commands Still Forbidden In This Prompt

- `supabase`
- `psql`
- SQL clients
- Docker database commands
- Migration application or reset
- Remote project linking
- Deployment
- Providers
- Workers
- App runtime
- Render/export
- Package installation

## M. Protected-file Hash Results

Protected-file SHA-256 baselines were captured outside the repository at `/tmp/rp-skills-33-baseline-sha256.txt` before edits. The implementation must compare hashes after edits and confirm protected files remained unchanged.

Protected files include both catalog migrations, the canonical manifest, RP-SKILLS TypeScript contracts, `src/types/index.ts`, the mock Creative Skill fixture, `package.json`, and `package-lock.json`.

## N. Validation Results

Required validation:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- Direct ASCII and trailing-whitespace checks over edited Markdown
- Protected-file hash comparison
- Static checks confirming no Supabase config/example config/seed file was created
- Static checks confirming no secrets, keys, production Supabase URLs, or remote project refs were added

## O. Remaining Blockers And Warnings

Blockers:

- Owner decision required before creating or checking in local Supabase config.

Warnings:

- `supabase/config.toml` remains absent by design.
- `supabase/config.example.toml` remains absent by design.
- `supabase/seed.sql` remains absent by design.
- Future disposable local apply remains blocked until local Supabase readiness decisions are made.

## P. Local Apply Readiness Decision

Decision: `blocked_owner_decision_required`

This replaces RP-SKILLS-32's broader `blocked_local_apply_repository_not_ready` with a narrower owner-decision blocker. The catalog migrations remain statically reviewed, but local apply readiness is not achieved until owner decisions authorize a safe local config path.

## Q. Owner Questions For RP-SKILLS-34

- Should Codex create `supabase/config.toml` in this repo?
- Should `supabase/config.toml` be checked in, or should only an example template be checked in?
- What local project ID should be used?
- What local ports are allowed for API, database, Studio, Inbucket, storage, realtime, and edge runtime?
- Should `supabase/seed.sql` remain absent, be created empty, or be reserved for a later seed milestone?
- Should a future prompt be allowed to run Supabase CLI locally?
- Should future local apply use `supabase start`, an existing local Supabase environment, or another disposable local database path?
- How should remote-link detection be performed before any mutating command?
- Is there a preferred Supabase CLI version or repo convention?
- Should generated local Supabase files be ignored with a repo-local `.gitignore`?

## R. Recommended Next Prompt

`RP-SKILLS-34 - Creative Skill Local Supabase Owner Decision Packet`

Allowed scope: docs-only owner decisions for local Supabase config and future disposable apply safety. Forbidden scope: Supabase CLI, SQL execution, migration application, database/container startup, remote connection, deployment, runtime behavior, package changes, providers, workers, UI, and app behavior.
