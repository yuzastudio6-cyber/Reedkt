# RP-EXTERNAL-BETA-QWEN-CONFIRMED-TRANSPORT-RUNTIME-PREFLIGHT-CURRENT-1

Use only after `RP-EXTERNAL-BETA-QWEN-TRANSPORT-READINESS-PLAN-CURRENT-1` is merged and records `completed_current_base_qwen_transport_readiness_plan_ready_for_confirmed_transport_runtime_preflight`.

The next packet may perform the first confirmed QWEN transport runtime preflight only if all of these gates are explicitly present in the execution environment:

- `REEDITPRO_CONFIRM_QWEN_TRANSPORT_RUNTIME_PREFLIGHT_CURRENT_1=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`

Use the route and fixture in `docs/external-beta/qwen-transport-readiness-plan-current-1/transport-readiness-plan.md`.

Allowed future action under that confirmation gate: one bounded transport preflight against `POST /api/providers/qwen2-5-vl/structured-visual-metadata` for structured metadata fixture readback only, with private artifacts and checksums under `/tmp`.

Still forbidden unless a later packet explicitly approves it: broad external beta expansion, production unlock, final render/export, arbitrary user media, signed/public artifacts, credit spend, Stripe/payment handling, Supabase mutation, SQL execution, worker dispatch beyond the named fixture, raw prompt execution, generated asset creation, or changing Cloud Run services.
