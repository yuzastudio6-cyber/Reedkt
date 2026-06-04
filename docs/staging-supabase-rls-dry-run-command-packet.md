# Staging Supabase/RLS Dry-Run Command Packet

Prompt 25 creates the future staging Supabase/RLS dry-run command packet. It is documentation, static diagnostics, validation tracking, and PR/CI tracking only.

Prompt 25 does not run Supabase lifecycle commands, SQL, migrations, `psql`, staging Supabase, remote Supabase, production Supabase, deployment, providers, tools, workers, rendering, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval, staging execution approval, production approval, or beta unlock.

## Current Decision State

- Dry-run packet status: `blocked_missing_evidence`.
- Human approval status: `blocked_missing_approval`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Staging execution approved: no.
- Production readiness approved: no.
- Beta unlocked: no.

Prompt 23 remains `pending_human_approval`. Prompt 24A records `evidence_required` and `not_applicable_no_evidence` because no tracked redacted Supabase project evidence has been supplied.

## Purpose

The packet turns the future staging validation path into reviewable command templates and go/no-go gates before anyone runs a staging command. It is meant to make the next human decision concrete without granting that decision.

The packet covers:

- required approval gates;
- required redacted evidence gates;
- future staging command categories;
- command evidence fields;
- SQL test selection and fixture requirements;
- rollback and cleanup packet placement;
- diagnostics that detect accidental execution claims or unsafe command text.

## What This Packet May Support Later

The packet may support a future approved Prompt 26 only after all prerequisites are true:

- a human approval completion record exists;
- redacted Supabase project evidence has been supplied and accepted;
- staging project identity is confirmed and redacted;
- production project identity remains separate and blocked;
- the approved branch and commit are named;
- the approved SQL file list is named;
- rollback and cleanup owners are named;
- synthetic fixture scope is accepted;
- no secrets, keys, signed URLs, private media, or production data are present.

## What This Packet Does Not Approve

This packet does not approve:

- staging SQL execution;
- staging migrations;
- Supabase project mutation;
- local SQL execution;
- remote SQL execution;
- production SQL execution;
- production readiness;
- beta readiness;
- service-role use;
- dashboard mutation;
- provider/tool/worker/render/storage/credit/Stripe execution.

## Future Dry-Run Phases

| Phase | Future purpose | Current Prompt 25 state |
| --- | --- | --- |
| Static repo validation | Confirm approved branch, commit, and SQL file list. | Template only. Not run. |
| Staging identity verification | Confirm redacted staging project identity and production separation. | Blocked by missing evidence. |
| Migration dry-run review | Review migration command packet before any apply. | Blocked by missing approval and evidence. |
| RLS dry-run review | Review selected SQL tests and fixtures. | Blocked by missing approval and evidence. |
| Cleanup review | Review cleanup packet for synthetic fixtures. | Blocked by missing approval and evidence. |
| Rollback review | Review rollback packet and owner chain. | Blocked by missing approval and evidence. |

## Future Command Template Example

```sh
DO NOT RUN UNTIL HUMAN APPROVAL RECORD EXISTS.
echo "Future approved staging command packet uses <REDACTED_STAGING_PROJECT_REF> <APPROVED_BRANCH> <APPROVED_COMMIT> <APPROVED_SQL_FILE> <REDACTED_LOCAL_OR_STAGING_DB_URL>"
```

The full future command template set lives in `docs/staging-supabase-future-command-templates.md`.

## Required Evidence Before Use

Prompt 25 requires these evidence categories before any future staging command can move from template to execution:

- human approval decision completion;
- redacted staging project identity;
- redacted production separation evidence;
- approved branch and commit evidence;
- approved SQL file list;
- synthetic fixture plan;
- cleanup plan;
- rollback plan;
- reviewer signoff.

## Safety Summary

Prompt 25 keeps all staging commands blocked. The packet is ready for review only as documentation. The next safe actions are Prompt 23A for human approval completion and Prompt 24B for redacted evidence review if evidence is supplied.
