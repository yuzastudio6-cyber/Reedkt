# Supabase Staging Reset Operator Checklist

Decision: `blocked_pending_staging_data_impact_review`

- [ ] staging target confirmed
- [ ] production excluded
- [ ] data impact reviewed
- [ ] backup/snapshot plan reviewed
- [ ] migration order reviewed
- [ ] dry-run required before reset/reapply execution
- [ ] reset execution command approved in separate phase
- [ ] post-reset verification checklist reviewed
- [ ] rollback plan reviewed
- [ ] Track B backfill remains separate
- [ ] no secrets printed
- [ ] human approval required

Blocked in this packet: staging reset, migration repair, schema deploy, direct SQL, Track B backfill, production, secrets, providers, tools/workers/routes, media, Track A, beta, and production unlock.
