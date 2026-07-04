# Project Edit Brief Owner Evidence Review Packet

## Decision

`project_edit_brief_owner_evidence_review_packet_passed_ready_for_owner_assignment`

## Scope

RP-EDITBRIEF-15C turns the RP-EDITBRIEF-15 owner-input list into an owner assignment packet. It does not approve any input, does not change the checked-in intake from `missing`, and does not enable external beta, real-user-media beta, paid production, Supabase persistence, uploads, providers/models, workers, render/export, or credits.

The packet exists so the next review can collect complete evidence without guessing what each owner needs to decide.

## Owner Assignments

| Owner input | Review group | Required decision |
| --- | --- | --- |
| `canonical_workflow_approval` | product owner | Approve the canonical Project Edit Brief workflow posture, entry points, blocked entry points, copy ownership, and rollback posture. |
| `durable_root_schema_approval` | data owner | Approve durable roots, required columns, foreign key ownership, type generation, and rollback posture. |
| `auth_access_policy_approval` | security owner | Approve role matrix, read/write/archive permissions, admin override boundary, service-role restriction, and negative access cases. |
| `supabase_security_approval` | Supabase owner | Approve RLS, Data API grants, Storage policies, service-role boundaries, migration validation, and rollback. |
| `media_lifecycle_approval` | media/privacy owner | Approve allowed media classes, durable artifact upgrade rules, retention/deletion, private manifests, and signed URL boundaries. |
| `planner_integration_approval` | planning owner | Approve planner input precedence, approved snapshot writes, conflict handling, revision resets, and user-review triggers. |
| `credit_cost_approval` | billing owner | Approve estimates, approved snapshot requirements, credit reservations, refund/release policy, and tool cost event ownership. |
| `provider_model_approval` | AI/model owner | Approve model routes, prompt redaction, model/license review, fallback matrix, and raw prompt storage boundary. |
| `worker_render_approval` | worker/render owner | Approve worker contracts, idempotency keys, artifact manifests, QA gates, and render/progress rollback. |
| `operations_approval` | operations owner | Approve monitoring, incident runbook, privacy/legal review, deployment owner, support escalation, and rollback owner. |

## Evidence Rules

Every approved or waived owner input must include:

- named owner,
- durable evidence reference,
- reviewed timestamp,
- notes describing the exact approval or waiver.

Missing and rejected entries block RP-EDITBRIEF-16. Secrets, credentials, raw prompts, signed URLs, private media, and private/public artifacts must not be committed as evidence.

## Current State

The checked-in RP-EDITBRIEF-15A intake is still intentionally missing all ten owner inputs. RP-EDITBRIEF-15B evaluates that template as blocked. This packet makes the owner review actionable; it does not remove the blocker.

## Next Step

Owners should provide evidence outside source control, then a reviewed PR can update `docs/project-edit-brief-owner-evidence-intake-template.json`. RP-EDITBRIEF-16 may start only after `smoke:project-edit-brief-owner-evidence-readiness` reports `project_edit_brief_owner_evidence_readiness_passed_ready_for_rp_editbrief_16` for real evidence.
