# RP-SKILLS-35 Local Supabase Config Creation Checklist

## Owner Approval

- [x] Owner approval or explicit override is present in the active task context.
- [x] RP-SKILLS-34 recommended decisions are applied.
- [x] The exact-text approval gate was replaced by the owner's active override for this implementation pass.

## Config

- [x] `supabase/config.toml` created or safe existing config reused.
- [x] Local project ID is `reeditpro-local`.
- [x] No remote project ref.
- [x] No credentials.
- [x] No production URLs.
- [x] No service-role key.
- [x] No anon key.
- [x] No access token.
- [x] No Yuza Studio reference in config.
- [x] No `supabase/seed.sql` created.

## Protected Files

- [x] Creative Skill foundation migration remains unchanged.
- [x] Creative Skill canonical seed migration remains unchanged.
- [x] Canonical manifest remains unchanged.
- [x] TypeScript contracts remain unchanged.
- [x] Mock fixtures remain unchanged.
- [x] Package files remain unchanged.

## Forbidden Actions

- [x] No Supabase CLI.
- [x] No SQL.
- [x] No migration application.
- [x] No Docker/database startup.
- [x] No deployment.
- [x] No runtime behavior.
- [x] No provider, worker, UI, or app behavior.

## Future Readiness

- [x] Local apply readiness decision present.
- [x] Next prompt selected: `RP-SKILLS-36 - Creative Skill Catalog Migrations Disposable Local Apply and Data Verification`.

## Fail The Prompt If

- Owner approval or override is missing.
- Config includes a remote project ref.
- Config includes credentials.
- Config includes a production URL.
- Config references Yuza Studio Supabase.
- `supabase/seed.sql` is created.
- Supabase CLI is invoked.
- SQL is executed.
- A migration is applied.
- A database or container starts.
- Migrations are changed.
- Manifest is changed.
- Package files are changed.
- Runtime behavior is added.
