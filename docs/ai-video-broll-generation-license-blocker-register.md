# AI Video B-roll Generation License Blocker Register

Status: `ai_video_broll_gen_1_license_blocker_register_no_execution`

This register keeps Gate 1 honest. License/provenance approval is not runtime approval.

| Blocker | Applies to | Owner | Status | Exit requirement |
| --- | --- | --- | --- | --- |
| Exact weight source not pinned | Wan, LTX, Mochi | `AI_VIDEO_BROLL_GENERATION` | open | Gate 2 weight source/checksum plan. |
| LTX version/license split unresolved | LTX | `COMPLIANCE_SECURITY`, `AI_VIDEO_BROLL_GENERATION` | open | Separate exact-version findings for original LTX-Video, LTXV 0.x/2B, LTX-2, or LTX-2.3. |
| Direct/magnet weight source not approved | Mochi | `COMPLIANCE_SECURITY`, `SUPABASE_RLS_STORAGE_DATABASE` | open | Approved source must be official and checksumable before any download gate. |
| Hunyuan territory and commercial terms unresolved | HunyuanVideo | `COMPLIANCE_SECURITY`, `PRODUCT_BETA_READINESS` | blocked | Legal acceptance for target territories and commercial usage. |
| Weight cache and retention policy missing | All | `SUPABASE_RLS_STORAGE_DATABASE`, `WORKER_RUNTIME_JOBS` | open | Private path/cache policy before any weight handling. |
| GPU and cost profile unapproved | All eligible models | `WORKER_RUNTIME_JOBS`, `BILLING_STRIPE_CREDITS` | open | CPU/GPU placement and cost envelope reviewed before install/import. |
| Safety/content policy not execution-ready | All | `OBSERVABILITY_AUDIT_COST`, `COMPLIANCE_SECURITY` | open | Generated B-roll misuse, provenance, disclosure, and QA policy accepted. |
| Runtime route not implemented | All | `WORKER_RUNTIME_JOBS`, `PROVIDER_GATEWAY_MODELS` | open | Approved worker route, idempotency, approved snapshot, storage, and audit contracts. |
| Beta readiness not approved | All | `PRODUCT_BETA_READINESS` | open | Internal beta gate validates private artifacts, QA, rollback, billing, owner acceptance, and support runbook. |

## Still Forbidden

- Downloading model weights.
- Installing model dependencies.
- Running inference.
- Creating generated video.
- Running Docker or touching GCP.
- Mutating Supabase or executing SQL.
- Calling providers or dispatching workers.
- Creating storage objects, signed URLs, or public artifacts.
- Creating credit estimates, reservations, approvals, spends, refunds, or releases.
- Claiming beta readiness, production readiness, runtime readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
