# Migration Review And RLS Hardening

## Purpose

The migration review and RLS hardening step checks ReeditPro's draft SQL before any real Supabase migration is created.

The SQL in `database/migration-drafts/` is draft-only. It is not production SQL, it has not been applied to Supabase, and its RLS policies have not been tested. The goal is to make schema, access-control, immutability, storage privacy, and service-role boundaries easier to review before a future migration milestone.

This review reinforces:

- approved snapshot immutability must be protected
- user access must be scoped by workspace and project membership
- worker/service-role writes must be controlled and audited
- storage must be private by default
- source media and browser capture artifacts may contain sensitive data
- future credit and audit records must be append-only
- workers execute approved snapshots, not raw chat

## Main Review Goals

- every table has a clear purpose
- every important table has workspace/project scoping
- every user-accessible table has RLS policy planning
- every worker-only table has backend/service-role write planning
- approved snapshots are immutable after approval
- job, generation, QA, and export records point to approved snapshots
- JSONB snapshot strategy is clear
- storage bucket strategy is private by default
- audit events are append-only
- credit records are not user-mutable
- draft SQL files remain in `database/migration-drafts/`
- no active Supabase migration path is used

## Hard Blockers Before Real Migration

- `approved_plan_snapshots` is missing
- `approved_plan_snapshots.snapshot_json` is missing
- approved snapshots can be updated or deleted by normal users
- `generation_requests` do not link to approved snapshots
- `editing_jobs` do not link to approved snapshots
- source media storage is planned as public
- project data lacks an RLS policy plan
- worker writes lack a backend/service-role boundary
- `audit_events` is missing
- approval records do not link plan version and credit estimate
- credit records are user-mutable
- worker tables are user-writable
- provider secrets are stored in schema or frontend
- browser capture artifacts are public by default
- any SQL is run or applied during this draft review task

## RLS Hardening Principles

- Workspace membership controls access.
- Project data belongs to a workspace and project.
- Users can read/write only allowed project/session data.
- Approved snapshots are read-only after approval.
- Worker and service writes use backend/service role only.
- Service-role use must be audited and never exposed in frontend code.
- Audit events are append-only.
- Future credit reservations and ledger records are append-only and service-controlled.
- Source media, generated assets, browser captures, QA artifacts, and private artifacts use signed URLs later.

## Non-Goals

This task does not:

- apply migrations
- run SQL
- test RLS in Supabase
- implement auth
- implement storage
- implement workers
- implement a credit ledger
- connect a database

