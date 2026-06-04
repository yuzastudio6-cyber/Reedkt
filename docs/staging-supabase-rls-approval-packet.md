# Staging Supabase/RLS Approval Packet

Prompt 21 creates the approval packet for a future staging Supabase/RLS validation run. It is documentation, approval structure, static diagnostics, and tracking only. It does not approve staging execution and does not approve production readiness.

## Purpose

The purpose of this packet is to give a human reviewer a concrete go/no-go checklist before any staging Supabase project is targeted.

This packet separates three evidence states:

- local evidence already collected: Prompt 20B-Retry passed exactly one guarded local auth/profile/workspace/project RLS smoke test against localhost-only Supabase.
- staging evidence not yet collected: no staging Supabase SQL, migration validation, or RLS smoke test has run.
- production readiness not approved: production Supabase, production beta, and runtime execution remain blocked.

## Scope

Allowed Prompt 21 scope:

- approval packet drafting;
- staging runbook drafting;
- staging SQL test selection classification;
- synthetic fixture planning;
- cleanup and rollback planning;
- risk register creation;
- static approval diagnostics;
- source-of-truth tracker updates.

Forbidden Prompt 21 scope:

- do not run staging, remote, or production Supabase;
- do not run local SQL or staging SQL;
- do not run a Supabase lifecycle command;
- do not deploy migrations or infrastructure;
- do not call providers, tools, workers, renderers, storage transfer, credit mutation, Stripe, external telemetry, or production/beta unlocks.

## Evidence Baseline

| Evidence | Status | Notes |
| --- | --- | --- |
| Prompt 20B-Retry local auth/workspace/project RLS smoke | Local passed | The guarded runner executed only `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` with synthetic fixtures and rollback. |
| Local migration chain | Local passed for Prompt 20B-Retry scope | Prompt 20G through Prompt 20P2 repaired local migration-chain blockers enough for local Supabase start and first RLS smoke execution. |
| Broader local RLS domains | Not proven | Storage, snapshots, credits, jobs/workers, media, render/export, QA/revision, tools, providers, compliance, and observability remain draft-only or review-only. |
| Staging Supabase migration validation | Not run | Requires human approval and a redacted staging project target packet. |
| Staging RLS smoke tests | Not run | Requires synthetic fixture approval, cleanup approval, and test-set approval. |
| Production Supabase validation | Not run and not approved | Production validation is outside Prompt 21 and remains prohibited. |

## Human Approval Required

human approval required before any staging execution.

Human approval required before any staging execution:

| Approval item | Required decision | Current Prompt 21 value |
| --- | --- | --- |
| Staging project target | Approver confirms the staging project is isolated and not production. | Not approved. |
| Staging project reference | Approver records a redacted project reference only. | Not recorded. |
| Staging access boundary | Approver confirms no service-role keys or secrets are committed or pasted into docs. | Not approved. |
| Migration validation scope | Approver confirms whether migrations may be validated in staging. | Not approved. |
| SQL test set | Approver confirms the exact test files allowed for staging. | Not approved. |
| Synthetic fixture set | Approver confirms fixture IDs, domains, cleanup strategy, and isolation. | Not approved. |
| rollback plan | Approver confirms rollback criteria and owner. | Draft only. |
| cleanup plan | Approver confirms cleanup criteria and owner. | Draft only. |
| Evidence retention | Approver confirms redacted evidence format and where it may be stored. | Draft only. |

## Approval Checklist

Before a future prompt may run staging Supabase/RLS validation, all checks must be true:

- The reviewer has confirmed the target is a disposable staging Supabase project, not remote production.
- The reviewer has confirmed no production/staging secret value will be copied into the repository or prompt text.
- The reviewer has approved synthetic fixtures only.
- The reviewer has approved cleanup plan and rollback plan handling.
- The reviewer has approved the selected SQL tests from `docs/staging-rls-test-selection-matrix.md`.
- The reviewer has approved evidence redaction rules.
- The reviewer has confirmed production readiness not approved.
- The reviewer has confirmed staging evidence not yet collected before execution begins.

## Decision State

Prompt 21 decision:

- Staging execution approval: not approved.
- Staging SQL approval: not approved.
- Production readiness: not approved.
- Beta unlock: not approved.
- Recommended next prompt: Prompt 22 - Staging Supabase/RLS Human Approval Packet Review if validation and CI pass.
