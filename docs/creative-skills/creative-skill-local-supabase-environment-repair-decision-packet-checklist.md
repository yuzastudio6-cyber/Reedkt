# RP-SKILLS-37 Local Supabase Environment Repair Decision Packet Checklist

## Current Blocker

- [x] RP-SKILLS-36 blocker recorded.
- [x] Conflicting ports recorded: `54321`, `54322`, `54323`, `54324`, and `54327`.
- [x] Existing local stack recorded: `reeditpro`.
- [x] `reeditpro-local` not running recorded.

## Decision Packet

- [x] Repair options A/B/C/D documented.
- [x] Recommendation documented.
- [x] Owner decisions listed.
- [x] Approval messages included.
- [x] Next prompt routing included.
- [x] Decision outcome set to `awaiting_owner_repair_choice`.

## Safety

- [x] No Supabase CLI.
- [x] No SQL.
- [x] No stop command.
- [x] No Docker/database command.
- [x] No migration application.
- [x] No config patch.
- [x] No protected-file changes.
- [x] No package changes.
- [x] No runtime behavior.

## Fail The Prompt If

- Supabase CLI is run.
- Existing stack is stopped.
- Config is patched.
- Migration is applied.
- SQL is executed.
- Database/container is started.
- Database/container is stopped.
- Package files are changed.
- Protected files are changed.
- Owner choice is assumed without explicit approval.
- The prompt recommends `--all`.
- The prompt recommends `--no-backup`.
- The prompt recommends remote Supabase.
