# RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1

Use the current-base QWEN transport dependency contract from `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1`.

Run only after the auth path blocker `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r` is closed and the executor provides an explicit confirmation gate.

Required posture:

- Read the dependency contract.
- Verify `resolveServiceUrl`, `resolveAudience`, `fetchIdentityToken`, and `sendRequest` remain injectable backend-only boundaries.
- Do not send a Cloud Run request unless a later prompt explicitly authorizes the transport preflight and confirms a no-prompt authenticated context.
- Do not execute QWEN2.5-VL, workers, Supabase mutation, SQL, generated assets, signed URLs, public artifacts, media processing, render/export, credits, broad external beta, or production.

If auth remains blocked, record `blocked_gcloud_user_and_adc_reauthentication_required_before_qwen_real_dispatch_1r` and stop.
