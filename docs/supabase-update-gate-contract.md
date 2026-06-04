# Supabase Update Gate Contract

This contract defines the gates required before any future Supabase update moves from repo evidence to local, staging, or production execution. Prompt 23S adds no execution capability.

## Gates

| Gate | Applies to | Required evidence | Fail-closed result |
| --- | --- | --- | --- |
| `SourceOfTruthGate` | all milestones | Updated status, source map, milestone plan, implementation prompt record. | Treat milestone as repo-only and blocked for sync. |
| `NoSecretsGate` | all milestones | Evidence contains no service-role keys, provider keys, Stripe keys, JWT secrets, signed URLs, full connection strings, or private media URLs. | Reject evidence and require redaction. |
| `EnvironmentIdentityGate` | staging/production | Confirmed environment identity, project ref redacted from committed docs, and no production target for staging work. | Stop before SQL or migration command. |
| `LocalEvidenceGate` | staging candidates | Prompt 20B-Retry local evidence or later local evidence. | Keep staging blocked. |
| `MigrationChainGate` | staging migration candidates | Known local migration-chain blockers resolved or explicitly accepted as staging test targets. | Stop before RLS validation. |
| `HumanApprovalGate` | staging/production | Human decision record with owner, scope, date, and stop criteria. | No Supabase update. |
| `RollbackPlanGate` | staging/production | Rollback and cleanup acceptance plan exists. | No Supabase update. |
| `SyntheticFixtureGate` | staging RLS | Synthetic, cleanupable, workspace/project-scoped fixtures only. | No staging SQL. |
| `RlsSelectionGate` | staging RLS | Approved test selection matrix and scope-specific candidate. | No broad SQL suite. |
| `EvidenceCaptureGate` | staging/production | Redacted evidence destination and reporting format. | No execution. |
| `ProductionPromotionGate` | production | Staging evidence, human production approval, rollback plan, monitoring plan, and change window. | Production remains blocked. |

## Gate Outcomes

Allowed outcomes:

- `pass`
- `blocked`
- `not_applicable`
- `requires_human_approval`
- `requires_redaction`
- `requires_prompt_followup`

No gate may produce production approval by AI-generated text. Production approval must be a human-owned decision record after staging evidence.

## Prompt 23S Gate Result

Prompt 23S passes only docs/status gates. It does not attempt environment identity, SQL execution, migration deployment, RLS execution, staging status record writes, or production promotion.
