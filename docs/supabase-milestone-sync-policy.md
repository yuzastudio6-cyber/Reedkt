# Supabase Milestone Sync Policy

Prompt 23S defines how ReeditPro foundation milestones should be reported against Supabase update state. This is policy and static validation only. It does not run Supabase lifecycle commands, execute SQL, deploy migrations, backfill records, touch staging or production, or unlock beta.

## Purpose

The repository can advance through planning, contracts, diagnostics, local validation, and approval packets without any Supabase dashboard activity. That is expected. Most Prompt 0-23 work is repository-side evidence, not a Supabase project update.

Future milestone summaries must distinguish:

- repo milestone completed;
- local evidence collected;
- staging approval prepared;
- staging approval granted for a future run;
- staging Supabase actually updated;
- production Supabase actually updated.

Prompt 23 records guarded human approval for a future Prompt 24 staging validation path only. Prompt 23S does not treat staging as applied or production as approved.

## Update Types

| Update type | Meaning | Supabase environment touched |
| --- | --- | --- |
| `none` | No Supabase-related update is required for the milestone. | none |
| `docs/status only` | The repo records policy, contracts, diagnostics, or status only. | none |
| `local evidence only` | Local-only Supabase or local RLS evidence exists. | local only |
| `staging approval packet only` | Staging runbooks, approval packets, or human review material exists. | none |
| `staging migration candidate` | A future staging migration validation candidate is defined, but not applied. | none until approved execution |
| `staging RLS validation candidate` | A future staging RLS test candidate is defined, but not run. | none until approved execution |
| `staging status record` | A future append-only staging status record may be written after an approved staging run. | staging only after approval |
| `production candidate` | A future production candidate exists after staging evidence and human review. | none until production approval |
| `production update` | A production Supabase update was approved, executed, and evidenced. | production after approval only |

## Status Rules

- Repo completion does not imply Supabase update completion.
- Local evidence does not imply staging evidence.
- Staging approval packets do not imply staging execution.
- Human approval for staging does not imply production approval.
- No AI-created artifact may approve production.
- No staging update may happen without human approval and execution-time gates.
- No production update may happen without prior staging evidence, human approval, rollback plan, and cleanup plan.
- No committed evidence may contain service-role keys, provider keys, Stripe keys, JWT secrets, signed URLs, full connection strings, or private media URLs.

## Milestone Reporting Rule

Every future Supabase-adjacent milestone should report:

- `repoMilestoneStatus`
- `supabaseUpdateType`
- `localEvidenceStatus`
- `stagingApprovalStatus`
- `stagingSyncStatus`
- `productionSyncStatus`
- `environmentTouched`
- `sqlExecuted`
- `migrationDeployment`
- `evidenceDocs`
- `blockers`
- `nextSupabaseAction`

When no Supabase environment was touched, the correct value is explicit `none`, not omitted.

## Prompt 23S State

Prompt 23S creates only the sync policy package and diagnostic checks. Current state:

- Supabase update type: `docs/status only`.
- Local evidence: existing Prompt 20B-Retry local evidence only.
- Staging approval: Prompt 23 guarded approval exists for future Prompt 24 only.
- Staging sync status: not applied.
- Production sync status: blocked.
- Production readiness: not approved.
