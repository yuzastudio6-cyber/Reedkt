# Supabase Milestone Sync Matrix

This matrix classifies Prompt 0 through Prompt 23 against Supabase update state. It is status documentation only. Prompt 23S does not run Supabase, execute SQL, deploy migrations, or backfill records.

## Classification Key

| Classification | Meaning |
| --- | --- |
| `not_needed` | No Supabase update is required. |
| `docs_only` | Repo documentation/status changed only. |
| `local_evidence_recorded` | Local-only Supabase evidence was collected. |
| `approved_for_staging_packet` | Staging approval material was prepared only. |
| `ready_for_staging_review` | Human review packet is ready; approval not granted. |
| `pending_human_approval` | Human approval is required but has not been supplied. |
| `ready_for_staging_dry_run` | Future-only state for a later human-approved staging validation run; not used by Prompt 23 or Prompt 23S. |
| `blocked` | A prerequisite blocks environment sync. |

## Prompt Matrix

Coverage note: Prompt 0-19 are repo/documentation/static-validation preparation milestones with no staging or production Supabase update applied.

| Prompt | Repo milestone | Supabase update type | Local sync status | Staging sync status | Production sync status | Evidence status | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Source-of-truth repo consolidation | `docs/status only` | `not_needed` | `not_needed` | `blocked` | Docs only. | Continue foundation stack. |
| 1 | Production architecture freeze | `docs/status only` | `not_needed` | `not_needed` | `blocked` | Docs only. | Continue foundation stack. |
| 2 | Supabase schema review | `docs/status only` | `not_needed` | `not_needed` | `blocked` | Static audit only. | Schema gap planning. |
| 2A | Schema gap fix plan | `docs/status only` | `not_needed` | `not_needed` | `blocked` | Canonical target decision only. | Auth/workspace foundation. |
| 3 | Auth/profile/workspace foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Validation repair. |
| 3A | Auth/RLS hardening | `docs/status only` | `blocked` | `not_needed` | `blocked` | Static validation only. | Toolchain repair. |
| 3B | Auth/RLS validation environment | `docs/status only` | `blocked` | `not_needed` | `blocked` | Environment diagnostics only. | Foundation validation runner. |
| 3C | Validation toolchain repair | `docs/status only` | `blocked` | `not_needed` | `blocked` | CI runner added. | Storage foundation. |
| 4 | Storage/upload foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Snapshot foundation. |
| 5 | Approved snapshot foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Credit foundation. |
| 6 | Credit foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Backend route hardening. |
| 7 | Backend API hardening | `docs/status only` | `blocked` | `not_needed` | `blocked` | Static diagnostics only. | Job/worker foundation. |
| 8 | Job/worker foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Media readiness foundation. |
| 9 | Media readiness foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Render/export foundation. |
| 10 | Render/export foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Validation hardening. |
| 10A | Render/export validation hardening | `docs/status only` | `blocked` | `not_needed` | `blocked` | Diagnostics repair only. | QA/revision foundation. |
| 11 | QA/revision foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Tool-call foundation. |
| 12 | Tool-call foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Tool readiness foundation. |
| 13 | Tool readiness foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | CI validation. |
| 13A | Tool readiness CI record | `docs/status only` | `blocked` | `not_needed` | `blocked` | CI evidence only. | Worker execution contract. |
| 14 | Worker claim/execution contract | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Provider gateway foundation. |
| 15 | Provider gateway foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Compliance foundation. |
| 16 | Compliance foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | Observability foundation. |
| 17 | Observability foundation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Draft RLS only. | E2E staging plan. |
| 18 | E2E staging smoke plan | `docs/status only` | `blocked` | `not_needed` | `blocked` | Planning diagnostics only. | Supabase/RLS preparation. |
| 19 | Staging Supabase/RLS preparation | `docs/status only` | `blocked` | `not_needed` | `blocked` | Manifest/runbook only. | Local validation execution. |
| 20 | Local Supabase/RLS validation execution | `local evidence only` | `blocked` | `not_needed` | `blocked` | Preflight/runner added; no SQL. | Toolchain repair. |
| 20A | Local Supabase toolchain repair | `local evidence only` | `blocked` | `not_needed` | `blocked` | Local config and runner hardening. | Manual setup. |
| 20C | Local Supabase environment manual setup | `docs/status only` | `blocked` | `not_needed` | `blocked` | Setup docs only. | Manual verification. |
| 20D | Manual environment setup verification | `local evidence only` | `blocked` | `not_needed` | `blocked` | Non-mutating host evidence. | Manual follow-up. |
| 20E | Local Supabase manual setup follow-up | `local evidence only` | `blocked` | `not_needed` | `blocked` | Host probe evidence. | Host repair verification. |
| 20F | Manual host tool repair verification | `local evidence only` | `blocked` | `not_needed` | `blocked` | Host repair status evidence. | Migration-chain repair. |
| 20G | Local Supabase migration chain repair | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain blocker repaired; start not complete. | Continue local repair. |
| 20H | Local migration repair follow-up | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20I | Local migration repair follow-up 2 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20J | Local migration repair follow-up 3 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20K | Local migration repair follow-up 4 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20L | Local migration repair follow-up 5 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20M | Local migration repair follow-up 6 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress. | Continue local repair. |
| 20N | Local migration repair follow-up 7 | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local migration-chain progress plus port blocker. | Port retry. |
| 20O | Local port conflict retry | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local port config evidence. | Continue local repair. |
| 20P | Local storage migration repair | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local storage ownership blocker repaired. | Storage privilege follow-up. |
| 20P2 | Storage ownership/privilege follow-up | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | Local start completed; SQL not run. | Local RLS retry. |
| 20B-Retry | First local RLS smoke run | `local evidence only` | `local_evidence_recorded` | `not_needed` | `blocked` | One guarded local auth/workspace/project RLS smoke test passed. | Staging approval packet. |
| 21 | Staging approval packet | `staging approval packet only` | `local_evidence_recorded` | `approved_for_staging_packet` | `blocked` | Packet prepared; staging not run. | Human review. |
| 22 | Human approval review | `staging approval packet only` | `local_evidence_recorded` | `ready_for_staging_review` | `blocked` | Review packet ready; not approved. | Human decision record. |
| 23 | Human approval decision record | `staging approval packet only` | `local_evidence_recorded` | `pending_human_approval` | `blocked` | No human approval details were supplied. Staging sync is not applied. | Prompt 23A human approval completion, or Prompt 24 read-only inventory/audit without staging SQL. |
| 24 | Supabase project read-only audit | `docs/status only` | `local_evidence_recorded` | `evidence_required` | `blocked` | Read-only audit packet prepared; no redacted staging/production project evidence supplied. | Prompt 24A evidence intake; Prompt 23A still required before staging SQL. |

## Prompt 23S Conclusion

The next Supabase environment update is not automatic. Prompt 24 is read-only audit preparation only and defaults to `evidence_required`. Prompt 24A may intake redacted dashboard evidence without mutation. Any future staging SQL still requires a human approval completion record, confirmed staging target, gates, rollback/cleanup, synthetic fixture policy, and redacted evidence path before execution.
