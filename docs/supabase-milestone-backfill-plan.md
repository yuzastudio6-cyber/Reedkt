# Supabase Milestone Backfill Plan

This plan describes how future approved work could backfill Prompt 0-23 milestone/update status into an append-only Supabase ledger. Prompt 23S does not execute the backfill, create tables, run SQL, or touch any Supabase environment.

## Backfill Sources

Future backfill should use:

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/implementation-prompts/README.md`
- Prompt-specific validation result docs
- PR links and GitHub Foundation Validation evidence
- local-only evidence docs from Prompt 20B-Retry and related repair prompts
- staging approval packet, human review packet, and Prompt 23 pending decision record

## Backfill Order

1. Validate future ledger table and RLS policy.
2. Confirm target environment is approved for status-record writes.
3. Generate sanitized draft records locally from repo docs.
4. Review the generated records for secrets and false approval claims.
5. Insert records only through a future approved append-only backend or migration path.
6. Record inserted count, skipped rows, rollback plan, and evidence references.

## Do Not Backfill

Do not backfill:

- service-role keys;
- anon keys;
- JWT secrets;
- full connection strings;
- signed URLs;
- provider keys;
- Stripe keys;
- private media URLs;
- staging project identifiers in committed docs;
- production project identifiers in committed docs;
- AI-created production approvals.

## Prompt 0-23 Expected Classifications

- Prompt 0-18: `docs_only` or `not_needed`.
- Prompt 19: `docs_only` validation preparation.
- Prompt 20G through Prompt 20P2: `local_evidence_recorded` for migration-chain/local-start evidence only.
- Prompt 20B-Retry: `local_evidence_recorded` for one guarded local auth/workspace/project RLS smoke pass.
- Prompt 21: `approved_for_staging_packet` as packet preparation only.
- Prompt 22: `ready_for_staging_review` as human review packet only.
- Prompt 23: `pending_human_approval`; staging sync not applied; production sync blocked.
