# RP-SKILLS-36 Disposable Local Apply And Data Verification Checklist

## Preflight

- [x] `supabase/config.toml` exists.
- [x] Project ID is local: `reeditpro-local`.
- [x] Remote refs absent from config.
- [x] Secrets absent from config.
- [x] Protected hashes captured.
- [x] Supabase CLI availability checked.
- [x] Docker/local runtime checked.
- [x] Static environment scan found no Supabase or remote database variables.

## Local Apply

- [ ] Local stack started or verified.
- [ ] Migrations applied locally.
- [x] Output sanitized.
- [x] No remote commands.
- [x] No `supabase db push`.
- [x] No `supabase link`.

Blocked reason:

- Existing local `reeditpro` Supabase containers already occupy the configured RP-SKILLS-35 ports.

## Data Verification

- [ ] Six tables exist.
- [ ] No extra Creative Skill tables.
- [ ] Counts verified.
- [ ] Manifest parity verified.
- [ ] FK integrity verified.
- [ ] No-action counterparts verified.
- [ ] Metadata samples verified.
- [ ] Duplicate reviews empty.

Blocked reason:

- Local migrations were not applied because local Supabase startup failed on a port conflict.

## RLS

- [ ] RLS enabled.
- [ ] Authenticated read policies verified.
- [ ] Anon access not granted.
- [ ] Duplicate reviews client access absent.
- [ ] Writes not granted.

Blocked reason:

- Local database verification did not run.

## Fail-Closed

- [ ] Constraints/probes reviewed in local database.
- [ ] No persistent mutation from probes.
- [ ] Reapply behavior documented from local state.

Blocked reason:

- Rollback-only probes were not possible without a started and migrated local database.

## Boundaries

- [x] Protected files unchanged, pending final hash comparison.
- [x] No migrations changed.
- [x] No manifest, TypeScript, mock, or package changes.
- [x] No runtime behavior.
- [x] No provider, worker, UI, or app behavior.

## Fail The Prompt If

- Remote Supabase is linked.
- Supabase CLI uses a remote project.
- `supabase db push` is run.
- Production URL or token is used.
- Migration files are changed.
- Manifest is changed.
- Package files are changed.
- Data counts mismatch and the report hides it.
- RLS grants authenticated write access and the report hides it.
- Duplicate reviews are client-readable and the report hides it.
- SQL output leaks secrets.
- Local failure is hidden.
- Report claims remote or production success.
