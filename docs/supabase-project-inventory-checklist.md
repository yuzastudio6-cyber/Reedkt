# Supabase Project Inventory Checklist

Use this checklist for a future human read-only Supabase dashboard review. Do not enter secrets into this document.

Default result: `evidence_required`.

## Project Identity

- [ ] Project name recorded.
- [ ] Project ref redacted.
- [ ] Region recorded.
- [ ] Environment label recorded: local, staging, or production.
- [ ] Staging project is distinct from production.
- [ ] Production project is not used for staging validation.

## Project Access

- [ ] Dashboard access roles reviewed.
- [ ] Service-role key handling reviewed without exposing values.
- [ ] API key handling reviewed without exposing values.
- [ ] Team access list reviewed for least-privilege fit.
- [ ] Any unknown or stale access is listed as a blocker.

## Database

- [ ] Applied migration list captured by filename or dashboard label only.
- [ ] Table list captured without row data.
- [ ] Function list captured without secret values.
- [ ] Extension list captured.
- [ ] Role list captured.
- [ ] Backup setting summary captured.
- [ ] Connection pool setting summary captured without credentials.

## RLS

- [ ] RLS-enabled table list captured.
- [ ] RLS-disabled table list captured.
- [ ] Policy coverage summary captured.
- [ ] Known unvalidated tables listed.
- [ ] Local-vs-staging evidence gaps listed.

## Storage

- [ ] Bucket names captured.
- [ ] Public/private state captured.
- [ ] Storage policy names captured.
- [ ] Object path conventions reviewed.
- [ ] No object URLs, signed URLs, or private media paths recorded.

## Auth

- [ ] Enabled auth providers recorded by name only.
- [ ] Redirect URL domains reviewed and redacted as needed.
- [ ] Email settings summarized without tokens or SMTP secrets.
- [ ] JWT settings reviewed without exposing secret values.

## Edge Functions

- [ ] Function names captured.
- [ ] Deployment status summarized.
- [ ] Secrets policy reviewed without exposing secret values.
- [ ] Unknown functions or stale deployments listed as blockers.

## Logs And Activity

- [ ] Recent dashboard activity summarized by timestamp and action type.
- [ ] Migration activity summarized.
- [ ] Auth activity summarized without user PII.
- [ ] Storage activity summarized without object URLs.
- [ ] Inactivity is interpreted against the project activity gap analysis.

## Milestone Sync

- [ ] Prompt 20B-Retry local evidence is classified as local-only.
- [ ] Prompt 21/22/23 staging approval state is classified correctly.
- [ ] Prompt 23 remains `pending_human_approval`.
- [ ] Prompt 23S sync policy is referenced.
- [ ] No milestone is marked applied to staging without redacted staging evidence.
- [ ] No milestone is marked production-ready without staging evidence and human production approval.

