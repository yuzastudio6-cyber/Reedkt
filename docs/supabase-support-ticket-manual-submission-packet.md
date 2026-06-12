# Supabase Support Ticket Manual Submission Packet

Title: Supabase staging db reset failed twice with migration history/schema not restored

## Copy/Paste Body

```text
Title: Supabase staging db reset failed twice with migration history/schema not restored

Summary:
We are requesting guidance for a staging-only Supabase recovery path. The approved staging project had two guarded reset attempts fail. After failure diagnostics, migration history and the activation milestone registry schema remained absent. Track B milestone backfill and production were not touched.

Environment:
- Project ref: wmyyttnynmteqgcdishd
- Environment: staging
- Production affected: false

Command class used:
- supabase db reset --db-url [REDACTED] --no-seed

CLI strategy:
- temp npm Supabase CLI

Observed behavior:
- First guarded staging reset attempt failed.
- Guarded staging reset retry failed.
- Migration history and activation milestone registry schema remained absent after verification.
- Track B staging backfill was not run.
- Production was not touched.

Expected behavior:
- Staging reset should safely reapply local migrations or Supabase should advise a supported migration-safe recovery path.

Questions:
1. Is remote db reset with --db-url supported for this staging environment?
2. Is the observed failure a known CLI or platform issue?
3. Should we use a different migration-safe recovery path?
4. Is creating a new staging branch or project recommended?
5. What safe next step avoids direct untracked SQL?

Safe references:
- PR #274 support escalation approval packet
- PR #271 reset retry failure diagnostics
- PR #269 reset retry execution attempt
- PR #259 first reset execution attempt
- PR #198 Track B backfill remains blocked
```

## Safety

This packet intentionally excludes DB URLs, passwords, service keys, access tokens, signed URLs, provider keys, private backup payloads, private media URLs, row contents, raw logs, and production targets.
