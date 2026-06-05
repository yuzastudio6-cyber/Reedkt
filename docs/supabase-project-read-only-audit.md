# Supabase Project Read-Only Audit

Prompt 24 creates the Supabase project inventory and read-only audit package. It prepares what a human reviewer must inspect in the Supabase dashboard or project metadata before any staging update, staging RLS validation, production candidate, or beta readiness claim.

This package is evidence intake and audit preparation only. It does not connect to Supabase, run SQL, run migrations, deploy infrastructure, mutate dashboard settings, grant staging approval, or unlock beta/production.

## Purpose

The audit answers one question: what must be checked in the actual Supabase project before ReeditPro treats staging or production Supabase status as known?

The audit covers:

- project identity and environment separation;
- migration state and schema/RLS state;
- storage buckets and storage policies;
- auth configuration;
- edge functions, if any;
- logs and activity evidence;
- secret/key exposure risks;
- dashboard activity gap interpretation;
- milestone sync readiness.

The audit does not cover:

- applying migrations;
- running local, staging, remote, or production SQL;
- linking a Supabase project;
- creating records;
- reading or printing secrets;
- deploying edge functions;
- changing auth, storage, database, or API settings;
- approving staging or production execution.

## Dashboard Activity Gap

Supabase dashboard activity can be empty even while repository foundation work is active. Prompt 0 through Prompt 23S mostly created repository docs, route contracts, diagnostics, local-only evidence, and approval packets. Those actions do not touch the remote Supabase dashboard.

Activity should appear only after approved Supabase actions occur, such as project settings changes, migration application, SQL execution, auth events, storage object writes, edge function deployment, or logs from deployed runtime. Prompt 24 does not perform any of those actions.

## Required Environments

| Environment | Required state for audit | Current Prompt 24 state |
| --- | --- | --- |
| Local | Prompt 20B-Retry local auth/workspace/project smoke evidence exists. | Local evidence is repo-recorded only. Prompt 24 does not rerun it. |
| Staging | Must be identified and separated from production before any future execution. | `evidence_required`; no staging Supabase evidence is collected by Prompt 24. |
| Production | Must be separately identified and must remain mutation-blocked. | `evidence_required`; no production Supabase evidence is collected by Prompt 24. |

## Known Evidence

- Prompt 20B-Retry passed one guarded local-only auth/profile/workspace/project RLS smoke test.
- Prompt 21 prepared the staging Supabase/RLS approval packet.
- Prompt 22 marked the packet `ready_for_human_review`.
- Prompt 23 recorded historical `pending_human_approval`.
- Prompt 23A recorded conditional staging-only approval as `approved_for_staging_validation_when_gates_pass`.
- Prompt 23S created the milestone sync policy and kept staging sync `not_applied`.

Prompt 23A records conditional staging-only approval, but Prompt 24 does not execute staging audit or SQL.

## Missing Evidence

- No redacted staging project identity evidence is present.
- No redacted production project identity evidence is present.
- No staging migration list or staging RLS policy evidence is present.
- No production migration list or production RLS policy evidence is present.
- No storage bucket, auth setting, edge function, or activity-log dashboard evidence is present.

## Read-Only Rules

- Use dashboard or project views only when collecting future evidence.
- Do not run SQL.
- Do not run `supabase link`, `supabase db push`, migrations, or lifecycle commands.
- Do not change settings, buckets, policies, functions, auth providers, secrets, redirects, or data.
- Do not create staging or production records.
- Do not expose service-role keys, database passwords, JWT secrets, provider keys, Stripe keys, signed URLs, or private media URLs.

## Redaction Policy

Evidence must redact:

- project refs except a short non-sensitive suffix or label;
- full connection strings;
- database passwords;
- anon and service-role keys;
- JWT secrets;
- provider keys;
- Stripe keys;
- signed URLs and tokenized URLs;
- private media URLs and private user data.

## Audit Result States

| State | Meaning |
| --- | --- |
| `not_started` | No audit package or evidence intake has begun. |
| `evidence_required` | Prompt 24 docs exist, but no redacted dashboard/project evidence has been supplied. This is the default state. |
| `partially_reviewed` | Some redacted evidence exists, but one or more required areas remain unreviewed. |
| `ready_for_staging_inventory_review` | Required read-only staging inventory evidence is present and redacted; this still does not approve staging SQL. |
| `blocked` | Evidence, redaction, environment separation, or reviewer confidence is insufficient. |

## Prompt 24 State

- Audit status: `evidence_required`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Staging approval: `conditional_approval_recorded`; evidence and execution gates remain incomplete.
- Production readiness: blocked.

## Prompt 24A Evidence Intake

Prompt 24A adds evidence intake, redaction rules, an evidence matrix, and evidence request material. It does not supply or validate dashboard evidence. Actual redacted evidence is still required before any staging inventory review can be considered.

- Evidence status: `evidence_required`.
- Redaction status: `not_applicable_no_evidence`.
- Audit status: `evidence_required`.
- Evidence files found in allowed tracked evidence paths: none.
- Supabase environment touched: none.
- SQL executed: none.
