# Supabase Track B Clean Staging Backfill Verification

Verification checks the clean staging activation registry after the metadata upsert.

It must confirm:

- expected row counts by activation registry table;
- 30 Track B milestone records from the Phase 44P export;
- coverage for the 18 canonical Track B tool IDs;
- blocker and blocked-scope preservation;
- one backfill approval metadata row;
- one sync audit row;
- no production or broken-staging mutation;
- no Track B runtime/tool/worker/route execution;
- no provider, media, secret, signed URL, raw prompt, or private payload content.

The verification path uses read-only catalog/registry metadata through the approved clean staging target. It does not read row payloads outside the activation registry metadata rows written by this phase.
