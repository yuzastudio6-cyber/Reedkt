# RP-SKILLS-33 Local Supabase Readiness Repair Checklist

## Readiness Review

- [x] RP-SKILLS-32 blocker confirmed.
- [x] Supabase directory inspected.
- [x] Migrations inspected.
- [x] `supabase/config.toml` presence checked.
- [x] `supabase/config.example.toml` presence checked.
- [x] `supabase/seed.sql` presence checked.
- [x] Package scripts inspected.
- [x] Supabase safety docs inspected.
- [x] Remote linkage checked statically.
- [x] Secrets and Yuza Studio references checked statically.

## Config Decision

- [x] Config repair decision recorded: `owner_decision_required`.
- [x] Evidence recorded.
- [x] Owner questions recorded.
- [x] Local-only boundary recorded.
- [x] No remote project ref added.
- [x] No secrets added.
- [x] No credentials added.
- [x] No `supabase/config.toml` created.
- [x] No `supabase/config.example.toml` created.

## Protected Boundaries

- [x] Foundation migration unchanged.
- [x] Seed migration unchanged.
- [x] Canonical manifest unchanged.
- [x] TypeScript contracts unchanged.
- [x] Mock fixtures unchanged.
- [x] Package files unchanged.
- [x] No Supabase CLI.
- [x] No SQL.
- [x] No SQL execution.
- [x] No migration application.
- [x] No database/container startup.
- [x] No runtime behavior.

## Future Readiness

- [x] Local apply prerequisites listed.
- [x] Future command safety rules listed.
- [x] Local apply readiness decision recorded: `blocked_owner_decision_required`.
- [x] Next prompt selected: `RP-SKILLS-34 - Creative Skill Local Supabase Owner Decision Packet`.

## Fail The Prompt If

- Supabase CLI is invoked.
- SQL is executed.
- A migration is applied.
- A database/container is started.
- Remote Supabase is linked.
- Credentials are added.
- A config includes a production URL.
- A config includes a service-role key.
- A config includes an anon key.
- A config includes an access token.
- Migration files are changed.
- The canonical manifest is changed.
- TypeScript contracts, mock fixtures, or package files are changed.
- Runtime behavior is added.
- The next prompt recommends applying migrations despite missing or undecided local config.
