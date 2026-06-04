# Supabase Read-Only Audit Evidence Checklist

Current intake state: `evidence_required`.

Use this checklist only for redacted read-only evidence. It does not authorize dashboard mutation, SQL, migrations, staging execution, production execution, or beta unlock.

## Required Files

- [ ] Redacted project identity evidence.
- [ ] Redacted staging environment separation evidence.
- [ ] Redacted production environment separation evidence, if production exists.
- [ ] Redacted migration state evidence.
- [ ] Redacted RLS policy/table evidence.
- [ ] Redacted storage bucket and policy evidence.
- [ ] Redacted auth setting evidence.
- [ ] Redacted edge function inventory evidence, if any.
- [ ] Redacted log/activity evidence.
- [ ] Redacted milestone sync evidence.

## Required Redactions

- [ ] Project refs are redacted or represented by non-sensitive labels.
- [ ] Full connection strings are absent.
- [ ] Database passwords are absent.
- [ ] Service-role keys are absent.
- [ ] Anon keys are absent.
- [ ] JWT secrets are absent.
- [ ] Provider keys are absent.
- [ ] Stripe keys are absent.
- [ ] Signed URLs and tokenized URLs are absent.
- [ ] Private media URLs and private user data are absent.
- [ ] Real row data and raw PII are absent.

## Acceptance Checklist

- [ ] Every required evidence category has a supplied file.
- [ ] Every supplied file is in an allowed evidence path.
- [ ] Every supplied file has a redaction note.
- [ ] No supplied file contains secret-like material.
- [ ] The evidence matrix marks every required category accepted.
- [ ] The audit result remains below staging execution approval.

## Current Prompt 24A Result

- Evidence supplied: no.
- Evidence status: `evidence_required`.
- Redaction status: `not_applicable_no_evidence`.
- Audit status: `evidence_required`.
- Next action: provide redacted evidence for Prompt 24B review.

