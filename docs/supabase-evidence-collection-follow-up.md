# Supabase Evidence Collection Follow-Up

Prompt 24C turns the Prompt 24B finding into concrete collection guidance. Prompt 24B found no counted redacted Supabase evidence files in the approved evidence paths, so the current evidence status remains `evidence_required`.

## Purpose

This package tells a human/operator what to collect, where to put it, and how to avoid exposing secrets. It does not collect evidence by itself and does not connect to Google Cloud, Secret Manager, Supabase, SQL, or any runtime system.

## Current State

- Evidence status: `evidence_required`.
- Audit status: `evidence_required`.
- Redaction status: `not_applicable_no_evidence`.
- Actual evidence files found: no counted evidence files.
- Google Cloud API touched: no.
- Secret Manager API touched: no.
- Secret Manager metadata fetched: no.
- Secret Manager value fetched: no.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Human approval granted: no.
- Staging execution approved: no.
- Production/beta unlock: no.

## What The Operator Must Collect

Create redacted evidence files under `docs/supabase-readonly-audit-evidence/` using the names in `docs/supabase-evidence-file-template-index.md`.

Required evidence categories:

- project identity and project access;
- GCP Secret Manager reference metadata only;
- database migrations;
- database schema;
- RLS policies;
- storage buckets and storage policies;
- auth settings;
- edge function inventory or no-functions confirmation;
- activity/log summary without payloads;
- milestone sync state.

## How To Collect Safely

- Use the templates in `docs/supabase-readonly-audit-evidence/templates/`.
- Record reference names and metadata summaries only.
- Redact project refs if policy requires redaction.
- Crop or blur screenshots before committing them.
- Prefer summary text over screenshots when a screenshot risks exposing values.
- Record who collected the evidence, the date, environment label, and redaction status.

## What Not To Collect

Do not provide secret payloads, service-role keys, anon keys, JWT secrets, database passwords, provider keys, Stripe keys, full database URLs with passwords, signed URLs, private media URLs, raw user row data, real user PII, raw logs with payloads, or unredacted sensitive dashboard pages.

## Google Cloud Secret Manager Handling

Google Cloud Secret Manager evidence is metadata-only. Acceptable content includes reference names such as `GCP_SECRET_REF_SUPABASE_STAGING_DB_URL`, environment labels, purpose, rotation summary, access-owner summary, and whether a reference exists. Do not fetch, paste, or summarize secret payload values.

## What Codex Can Review Later

Codex can review tracked redacted evidence files after a future prompt supplies them. It can check that required categories are present, redaction rules are followed, and no secret-like material is included.

Codex must never see secret payloads, raw connection strings, service-role values, JWT secrets, database passwords, provider keys, Stripe keys, signed URLs, private media URLs, or raw user data.

## Next Step

After evidence is supplied, run Prompt 24D - Supabase Evidence Review With Supplied Files. Prompt 23A - Human Approval Decision Completion remains required before any staging execution path.
