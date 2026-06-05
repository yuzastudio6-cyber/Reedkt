# Supabase Approved Staging Target Reference

Phase: `supabase-approved-staging-target-reference`

This document is the repo-safe human/product approval record for the ReeditPro staging Supabase target reference used by the activation milestone registry schema/RLS deploy proof path.

## Approved Reference

approved_staging_target_reference_status: approved
approved_staging_supabase_project_name: Reeditpro
approved_staging_supabase_project_ref: wmyyttnynmteqgcdishd
approved_staging_environment: staging

## Approval Bounds

- decision: `approved_for_staging_target_reference`
- approval_status: `approved`
- decision_date: `2026-06-05`
- human_product_approval_input: `confirmed_by_user_prompt`
- project ref/name/environment are safe metadata only.
- credential payloads viewed: `false`
- credential payloads printed: `false`
- secret payloads included: `false`
- remote_sql_run: false
- migration_deployment: false
- production_affected: false
- track_b_backfill_write: false

## Allowed Future Uses

This reference may be used only to resolve the non-secret approved-reference side of the PR #209 staging target proof rerun.

Future staging schema deploy/verify still requires the PR #209 and PR #206 target proof, staging mutation, deploy, verify, tooling, and credential gates. Future Track B milestone staging backfill still requires the PR #198 backfill gates and confirmations.

## Forbidden In This Phase

- staging SQL execution
- remote SQL execution
- migration deployment
- Track B milestone row writes
- production Supabase access or mutation
- direct/manual SQL deploy
- credential payload viewing or printing
- provider calls
- route/tool/worker execution
- media processing
- public artifact creation
- beta or production unlock
- Track A work

## Next

Rerun the PR #209 staging target proof/deploy wrapper with its own confirmations. This approval-reference phase does not itself authorize a deploy, verification SQL, Track B backfill write, production promotion, or public output.
