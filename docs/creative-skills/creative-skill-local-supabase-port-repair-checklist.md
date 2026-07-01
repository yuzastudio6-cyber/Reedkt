# RP-SKILLS-38 Local Supabase Port Repair Checklist

## Owner Approval

- [x] Option C approval present in the RP-SKILLS-38 prompt.
- [x] RP-SKILLS-37 decision packet followed.
- [x] Existing local `reeditpro` stack preserved.

## Config

- [x] Project ID remains `reeditpro-local`.
- [x] Previous ports recorded.
- [x] Occupied ports recorded.
- [x] New ports selected.
- [x] New ports avoid known conflicts on `54321`, `54322`, `54323`, `54324`, and `54327`.
- [x] No remote refs.
- [x] No credentials.
- [x] No production URLs.
- [x] No Yuza Studio Supabase reference.
- [x] No `supabase/seed.sql` created.
- [x] No `supabase/config.example.toml` created.
- [x] Local-only comments preserved.

## Protected Files

- [x] Creative Skill foundation migration unchanged.
- [x] Creative Skill canonical seed migration unchanged.
- [x] Canonical manifest unchanged.
- [x] TypeScript contracts unchanged.
- [x] Mock fixtures unchanged.
- [x] Package files unchanged.

## Forbidden Actions

- [x] No Supabase CLI.
- [x] No Supabase connection.
- [x] No SQL.
- [x] No migration application.
- [x] No Docker/database start or stop.
- [x] No deployment.
- [x] No runtime behavior.
- [x] No provider, worker, UI, package, render/export, job, credit runtime, approval runtime, or app behavior.

## Future Readiness

- [x] Local apply readiness decision present.
- [x] Next prompt selected: `RP-SKILLS-39 - Creative Skill Catalog Migrations Disposable Local Apply and Data Verification Retry`.

## Fail The Prompt If

- Owner approval is missing.
- Config project ID changes away from `reeditpro-local`.
- Config includes a remote project ref.
- Config includes credentials.
- Config includes a production URL.
- Config references Yuza Studio Supabase.
- Selected ports still conflict.
- `supabase/seed.sql` is created.
- `supabase/config.example.toml` is created.
- Supabase CLI is invoked.
- SQL is executed.
- Migration is applied.
- Database/container starts or stops.
- Migrations are changed.
- Manifest is changed.
- Package files are changed.
- TypeScript contracts are changed.
- Runtime behavior is added.
