# Supabase Schema Parity Remediation Operator Checklist

Selected strategy: `staging_reset_and_reapply_migrations`

- [ ] review all 11 missing effects from PR #241
- [ ] confirm staging-only target and no production target
- [ ] confirm no Track B backfill in the same phase
- [ ] confirm no direct SQL/manual dashboard mutation
- [ ] confirm no migration-history repair-only path
- [ ] confirm selected staging reset/schema parity remediation strategy
- [ ] confirm rollback/failure owner and cleanup behavior
- [ ] confirm migration-safe dry-run requirement before any execution
- [ ] confirm post-remediation verification and PR #198 backfill remains separate

Blocked in this packet: migration repair, schema deploy, direct SQL, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
