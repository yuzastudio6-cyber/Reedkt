# QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_DRY_RUN_ATTEMPT_1R_AFTER_GCLOUD_REAUTH

Run only after `gcloud auth print-access-token --quiet` and `gcloud auth application-default print-access-token --quiet` can succeed in the execution environment without interactive prompts, and only with an explicit confirmation gate.

Use the current-base source chain:

- `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1`
- `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1`

If auth remains blocked, record `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r` and do not attempt Cloud Run, identity token fetch, request send, QWEN execution, worker dispatch, Supabase mutation, SQL, signed/public artifacts, generated assets, media processing, broad beta, or production.
