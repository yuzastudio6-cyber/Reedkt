# RP-INTERNAL-BETA-RUNTIME-ENABLEMENT-PLAN-1

Use this prompt only after `RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1` is merged and validated.

Create the next guarded planning packet for turning selected disabled scaffolds into a strictly internal beta runtime lane.

Requirements:

- Keep external beta, paid production, public artifacts, broad media, and final delivery/export blocked.
- Require explicit owner approval for any service-role runtime, remote Supabase target, credit mutation, job enqueue, worker dispatch, provider/model call, render/export, signed URL, or private artifact access.
- Preserve negative tests for no generation before approval, no credit spend without reservation, no frontend provider calls, no worker execution from raw chat, no public artifacts, and no Basic/Pro Veo.
- Do not enable runtime execution inside the planning packet.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `blocked_pending_internal_beta_runtime_enablement_owner_approval`
- Execution: `completed_docs_only_runtime_enablement_plan_no_runtime_unlock`
- Internal beta end-to-end status: `not_ready`
