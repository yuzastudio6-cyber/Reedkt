# AI Video B-roll Generation Gate 2 Blocker Register

Status: `ai_video_broll_gen_2_blocker_register_no_execution`

Gate 2 narrows the model source plan but does not unlock model handling.

| Blocker | Applies to | Status | Next owner/prompt |
| --- | --- | --- | --- |
| Dependency install plan missing | Wan, LTX, Mochi | open | `AI-VIDEO-BROLL-GEN-3: dependency install plan` |
| GPU/VRAM cost tier not accepted | Wan, LTX, Mochi | open | `AI-VIDEO-BROLL-GEN-4: runtime GPU owner review` |
| Weight download proof not approved | Wan, LTX, Mochi | open | future controlled download proof after install/runtime review |
| Checksum not computed | Wan, LTX, Mochi | open | future controlled download proof |
| Private cache not created | Wan, LTX, Mochi | open | future cache/download proof |
| LTX exact version not selected for runtime | LTX | open | Gate 3 dependency plan and Gate 4 runtime review |
| Mochi high-VRAM risk unresolved | Mochi | open | Gate 4 runtime review |
| Hunyuan legal/territory/commercial review missing | HunyuanVideo | blocked | legal/compliance owner review before any weight planning |
| Worker dispatch contract missing | All | open | `WORKER_RUNTIME_JOBS` owner handoff |
| Storage/persistence contract missing | All | open | `SUPABASE_RLS_STORAGE_DATABASE` owner handoff |
| Billing/cost envelope missing | All | open | `BILLING_STRIPE_CREDITS` owner handoff |
| Safety/content QA missing | All | open | `OBSERVABILITY_AUDIT_COST` and compliance owner handoff |
| Beta readiness missing | All | open | product beta readiness review |

## Still Forbidden

- Model downloads.
- Dependency installs.
- Model imports.
- Inference.
- Generated video.
- Docker/GCP execution.
- Supabase mutation or SQL.
- Provider calls.
- Worker dispatch.
- Storage object, signed URL, or public artifact creation.
- Credit mutation.
- Beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claims.
