# Rollback Boundary

Packet: `RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1R-AFTER-GCLOUD-REAUTH`

Rollback mode: `disable_REEDITPRO_EXTERNAL_BETA_READY`

If rollback is required, run only:

```bash
gcloud run services update reeditpro-staging-api \
  --project=reeditpro \
  --region=us-central1 \
  --update-env-vars=REEDITPRO_EXTERNAL_BETA_READY=false
```

Rollback must not retarget Supabase, switch to the isolated sandbox project, enable public artifacts, enable signed URL source-of-truth, enable provider/model calls, enable paid billing, unlock production, or run media/worker/provider paths.

Rollback execution in this packet: `not_run_no_rollback_requested`
