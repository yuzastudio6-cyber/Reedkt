# RP-SKILLS-34 Local Supabase Owner Decision Packet Checklist

## Review Coverage

- [x] RP-SKILLS-33 blocker confirmed.
- [x] Supabase directory inspected.
- [x] Package scripts inspected.
- [x] Owner decision table present.
- [x] Local config decision present.
- [x] Project ID recommendation present: `reeditpro-local`.
- [x] `supabase/seed.sql` decision present.
- [x] CLI command boundary present.
- [x] Remote-link detection decision present.
- [x] ReeditPro/Yuza Studio boundary present.
- [x] Future config prompt requirements present.
- [x] Future local apply prompt requirements present.
- [x] Awaiting owner approval status present.
- [x] Runtime actions avoided.

## Recommended Decisions

- [x] Recommend checked-in local-only `supabase/config.toml` in RP-SKILLS-35 after owner approval.
- [x] Recommend no example-only path if future local apply should work from repo state.
- [x] Recommend no remote project ref.
- [x] Recommend no credentials.
- [x] Recommend keeping `supabase/seed.sql` absent unless a later config prompt proves an empty file is required.
- [x] Recommend local-only CLI commands only after safety checks in a future apply prompt.
- [x] Recommend forbidding `supabase link`, `supabase db push`, remote SQL, production deploy, and access-token/database-URL commands.
- [x] Recommend stopping on any remote project ref, access token, remote DB URL, linked metadata, or production URL.

## Future Prompt Requirements

- [x] RP-SKILLS-35 must wait for explicit owner approval.
- [x] RP-SKILLS-35 may create local-only config only.
- [x] RP-SKILLS-35 must not run Supabase CLI unless separately approved.
- [x] Future disposable local apply must verify local-only target before every command.
- [x] Future disposable local apply must capture sanitized output only.

## Fail The Prompt If

- A config file is created.
- Supabase CLI is invoked.
- SQL is executed.
- A migration is applied.
- Docker/database starts.
- A remote project is linked.
- Credentials are added.
- Migrations are changed.
- The canonical manifest is changed.
- TypeScript contracts, mock fixtures, or package files are changed.
- Runtime behavior is added.
- The packet claims owner approval without explicit owner approval.
