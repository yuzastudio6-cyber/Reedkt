# Phase 51A Supabase Data-Plane Audit Results

## Status

Phase 51A adds a read-only Supabase/PostgreSQL data-plane audit. Static report mode is available, and confirmed completion execution was attempted for `phase51a-20260604T193805`.

Execution status: partial/blocked.

- Static repo audit completed.
- StoryTiming RLS triage completed and classified the 11 previously flagged tables as parser false positives: committed dynamic SQL enables RLS and workspace-scoped policies for those tables.
- Remote Supabase activity audit was blocked because `gcloud` could not refresh auth tokens in non-interactive execution, so Secret Manager values could not be resolved.
- Private GCS artifact upload was blocked for the same gcloud reauthentication reason.
- No migrations, SQL mutations, Supabase lifecycle commands, row writes, secret values, signed URLs, provider calls, media processing, Docker, deployment, production unlock, external beta unlock, paid production unlock, or broad-media unlock occurred.

## Repo Supabase Structure

- Frontend anon client: `src/backend/supabase/supabase-client.ts`.
- Frontend public env config: `src/backend/supabase/supabase-config.ts`.
- Frontend service-role boundary: `src/backend/supabase/supabase-admin-placeholder.ts`.
- Server admin client: `server/supabase/admin-client.ts`.
- Server anon client: `server/supabase/public-client.ts`.
- Runtime env parsing: `server/config/env.ts`.
- Migration SQL: `supabase/migrations/`.

## Static Decision

The repository has substantial local/review-ready Supabase schema and RLS evidence, but Phase 51A does not prove that migrations are applied remotely or that the current app writes rows during normal use. Low or absent Supabase activity is expected when the deployed/runtime environment is mock-only, lacks backend service-role env, or uses frontend-only anon auth without backend persistence routes.

## Remote Activity

Remote activity audit is count-only and optional. It resolves backend `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from process env or Google Secret Manager. During `phase51a-20260604T193805`, gcloud reauthentication failed before metadata/value access, so no remote Supabase rows, row payloads, DB URLs, service-role values, tokens, or signed URLs were read or stored.

The audit also records that current runtime env is likely mock-only without service-role Supabase configuration.

## Migration/RLS Findings

- Migration files parsed: 21.
- Parsed public tables: 161.
- RLS-enabled tables parsed after dynamic SQL parsing: 146.
- StoryTiming RLS triage:
  - Tables triaged: 11.
  - False positives: 11.
  - Real StoryTiming P0 RLS blockers: 0.
  - Evidence: `202605190002_storytiming_master_tables.sql` uses a dynamic `DO $$` block to enable RLS, revoke public/anon access, grant authenticated/service-role access, and create workspace-member/editor policies for the StoryTiming table list.
- Remaining P0 blockers:
  - Remote Supabase activity is unverified because Secret Manager access was blocked by gcloud reauthentication.
  - Runtime database writes remain unproven for normal app flows; activation phases mostly write docs/GCS artifacts and do not persist milestone registry rows yet.

## StoryTiming RLS Triage

The initial `phase51a-20260604T185604` run flagged the StoryTiming tables because the parser only recognized literal `alter table public.<table> enable row level security` statements. The migration uses a dynamic loop over:

- `master_timing_maps`
- `story_timing_segments`
- `timing_anchors`
- `timing_events`
- `timing_dependencies`
- `timing_conflicts`
- `timing_conflict_resolutions`
- `story_timing_qa_checks`
- `render_timing_manifests`
- `render_timing_manifest_tracks`
- `render_timing_manifest_events`

All 11 tables are in `public` schema and store private workspace/project timing data, but the committed migration evidence clears the static flag. Phase 51A does not alter RLS. Phase 51C should still add a local/staging remote RLS smoke for StoryTiming if runtime RLS verification remains unproven.

## Why Supabase May Show Low/No Recent Activity

- Most activation phases intentionally write private GCS artifacts and sanitized docs instead of Supabase rows.
- No Supabase activation milestone registry table exists yet.
- Current worker/provider/runtime phases are mostly contract, fixture, readiness, or audit layers, not persistent app workflows.
- App routes and workers do not yet persist activation runs, readiness evidence, provider events, or artifact manifests into Supabase.
- Backend service-role access was previously unavailable to the Phase 51A execution path and remains unverified because gcloud reauthentication is blocked.
- Remote migration application and recent table activity are still unverified.

## Blocked Scope

No migrations, SQL mutations, Supabase lifecycle commands, remote schema changes, row writes, secret printing, signed URL creation, provider calls, media processing, Docker, deployment, production, external beta, paid production, or broad media are enabled.

## Phase51B Readiness

Phase51B readiness: blocked.

Required human action before a full remote activity rerun:

- Refresh `gcloud` auth for `aiediting@reeditpro.com` or another approved account with `reeditpro` access so Codex can inspect Secret Manager metadata, resolve backend-only Supabase audit credentials, and upload private Phase 51A JSON artifacts.
- Rerun Phase 51A confirmed execution. If remote count-only audit and private GCS upload succeed, Phase51B can proceed as a Supabase activation milestone registry planning phase while controlled internal beta remains blocked.
- Keep StoryTiming RLS mutation out of Phase 51A. Treat StoryTiming as a Phase 51C remote RLS smoke/hardening candidate only if later local/staging evidence finds a real policy issue.
