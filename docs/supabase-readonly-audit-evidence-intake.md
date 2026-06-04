# Supabase Read-Only Audit Evidence Intake

Prompt 24A creates the evidence intake layer for the Prompt 24 Supabase project read-only audit packet. It does not inspect a Supabase dashboard, connect to Supabase, run SQL, mutate settings, approve staging execution, or approve production readiness.

Current evidence status: `evidence_required`.

Current redaction status: `not_applicable_no_evidence`.

Current audit status: `evidence_required`.

## Purpose

The intake package defines how future redacted Supabase project evidence should be submitted, reviewed, blocked, and tracked before any staging inventory review or staging SQL decision. It separates instructions from supplied evidence so that checklist files, templates, and README files are not mistaken for actual dashboard/project evidence.

## Allowed Evidence Paths

Prompt 24A may search only these tracked paths for redacted evidence:

- `docs/evidence/`
- `docs/supabase-evidence/`
- `docs/redacted-evidence/`
- `docs/supabase-readonly-audit-evidence/`
- `docs/supabase-read-only-audit-evidence/`

`README.md`, policy docs, checklists, templates, and matrix docs are instructions only. They do not count as supplied evidence.

## Evidence Categories

Required categories before any future `ready_for_staging_inventory_review` state:

- project identity and environment separation;
- staging project settings summary;
- production project settings summary, if production exists;
- migration list or migration history summary;
- RLS-enabled table evidence;
- storage bucket and policy summary;
- auth provider and redirect setting summary;
- edge function inventory, if any;
- logs/activity summary;
- milestone sync status summary.

All evidence must be redacted before it is committed.

## Default Result

Repository inspection found no tracked evidence files under the allowed evidence paths. Therefore:

- evidence status: `evidence_required`;
- redaction status: `not_applicable_no_evidence`;
- audit status: `evidence_required`;
- staging inventory review: not ready;
- staging SQL approval: no;
- production readiness: blocked;
- beta unlock: blocked.

## Blocking Conditions

Evidence intake is `blocked` if any supplied file contains service-role keys, database passwords, JWT secrets, provider keys, Stripe keys, signed URLs, private media URLs, raw connection strings, private project data, real row data, or unredacted user data.

Evidence intake is also blocked if any file claims staging/remote/production audit completion, Supabase mutation, SQL execution, staging approval, production readiness, beta unlock, deployment, or milestone backfill without an approved human record and matching redacted evidence.

## No-Scope Confirmation

Prompt 24A does not run Supabase lifecycle commands, SQL, migrations, `psql`, staging Supabase, remote Supabase, production Supabase, deployment, providers, tools, workers, rendering, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval, staging execution approval, production approval, or beta unlock.

