# Staging Supabase Human Approval Checklist

This checklist is for a future human owner. Prompt 22 does not fill it out as approval.

## A. Evidence Baseline

- [ ] Reviewer confirms Prompt 20B-Retry proves only one local auth/profile/workspace/project RLS smoke path.
- [ ] Reviewer confirms Prompt 21 prepared the staging approval packet and did not run staging execution.
- [ ] Reviewer confirms broader local domain SQL remains draft-only or review-only.
- [ ] Reviewer confirms staging evidence is not yet collected.
- [ ] Reviewer confirms production readiness is not approved.

## B. Target And Environment

- [ ] Reviewer confirms the target is a disposable staging Supabase project.
- [ ] Reviewer confirms the target is not production.
- [ ] Reviewer records only a redacted staging project reference.
- [ ] Reviewer confirms no service-role key, JWT secret, provider key, Stripe key, signed URL, or private media URL is stored in the repository.
- [ ] Reviewer confirms the runner environment is isolated from production data.

## C. Test Scope

- [ ] Reviewer approves the exact staging SQL test set.
- [ ] Reviewer confirms no draft-only SQL file is run without conversion and schema review.
- [ ] Reviewer confirms the first candidate starts from the Prompt 20B-Retry auth/profile/workspace/project path only.
- [ ] Reviewer confirms no provider, worker, render, tool, media processing, storage transfer, credit mutation, Stripe, or telemetry execution is included.

## D. Fixtures, Cleanup, And Rollback

- [ ] Reviewer approves synthetic fixture IDs and namespaces.
- [ ] Reviewer confirms fixtures are workspace/project-isolated.
- [ ] Reviewer confirms fixtures avoid private media, raw PII, signed URLs, provider request IDs, service-role keys, and real money.
- [ ] Reviewer approves cleanup criteria and owner.
- [ ] Reviewer approves rollback criteria and owner.
- [ ] Reviewer confirms stop-on-first-failure handling.

## E. Decision Controls

- [ ] Reviewer records one explicit decision in the decision template.
- [ ] Reviewer confirms the decision is human-owned.
- [ ] Reviewer confirms AI output is not approval.
- [ ] Reviewer confirms production readiness remains blocked.
- [ ] Reviewer confirms beta unlock remains blocked.

## Current Prompt 22 State

- Review state: `ready_for_human_review`.
- Actual human approval: not granted.
- Staging execution: not run.
- SQL execution: not run.
- Recommended next prompt: Prompt 23 - Staging Supabase/RLS Human Approval Decision Record.
