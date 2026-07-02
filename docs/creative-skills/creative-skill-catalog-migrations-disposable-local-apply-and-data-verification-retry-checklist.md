# RP-SKILLS-39 Disposable Local Apply And Data Verification Retry Checklist

## Preflight

- [x] `supabase/config.toml` exists.
- [x] Project ID is local: `reeditpro-local`.
- [x] Patched ports are present.
- [x] Old conflict ports are absent from active config values.
- [x] Patched ports were free before start.
- [x] Remote refs were absent.
- [x] Secrets were absent from active config values.
- [x] Protected hashes were captured.
- [x] Supabase CLI availability checked.
- [x] Docker/local runtime checked.

## Local Apply

- [x] Local stack started for `reeditpro-local`.
- [x] Output sanitized.
- [x] No remote commands.
- [x] No `supabase link`.
- [x] No `supabase db push`.
- [ ] Migrations applied locally.

Blocked reason:

- `supabase db reset --local --no-seed` failed at `202605130007_generation_providers_generated_assets.sql` with `column reference "description" is ambiguous (SQLSTATE 42702)`.

## Data Verification

- [ ] Six Creative Skill catalog tables exist.
- [ ] No extra Creative Skill tables verified.
- [ ] Counts verified.
- [ ] Manifest parity verified.
- [ ] FK integrity verified.
- [ ] No-action counterparts verified.
- [ ] Metadata samples verified.
- [ ] Duplicate reviews empty.

Blocked reason:

- Creative Skill migrations were not reached because the earlier migration chain failed.

## RLS

- [ ] RLS enabled locally on all six Creative Skill tables.
- [ ] Authenticated read policies verified.
- [ ] Anon access not granted.
- [ ] Duplicate reviews client access absent.
- [ ] Writes not granted.

Blocked reason:

- Creative Skill catalog tables and policies were not created locally because the earlier migration chain failed.

## Fail-Closed

- [ ] Constraints/probes reviewed locally.
- [ ] No persistent mutation from probes.
- [ ] Reapply behavior documented from local state.

Blocked reason:

- Rollback-only probes were not possible because catalog rows were not applied.

## Boundaries

- [x] Protected files expected unchanged.
- [x] No migrations changed.
- [x] No manifest, TypeScript, mock, or package changes.
- [x] No runtime behavior.
- [x] No provider, worker, UI, or app behavior.
- [x] Local stack stopped after blocked verification using exact project ID.

## Fail The Prompt If

- Remote Supabase is linked.
- Supabase CLI uses a remote project.
- `supabase db push` is run.
- Production URL or token is used.
- Migration files are changed.
- Manifest is changed.
- Package files are changed.
- Patched port conflict remains and is ignored.
- Data counts mismatch and are reported as passing.
- RLS grants authenticated write access.
- Duplicate reviews are client-readable.
- SQL output leaks secrets.
- Local failure is hidden.
- Report claims remote or production success.
