# Rollback And Membership Plan

## Membership Operations

Owner-managed beta membership should use the Google Group:

`external-beta-testers@reeditpro.com`

Add only approved external beta tester accounts. Remove testers from the group when access should end. Do not add `allUsers`, `allAuthenticatedUsers`, domain-wide principals, or production service principals.

## IAM Rollback

If controlled private external beta access needs to be disabled, remove the staging service invoker binding:

```bash
gcloud run services remove-iam-policy-binding reeditpro-staging-api \
  --project=reeditpro \
  --region=us-central1 \
  --member=group:external-beta-testers@reeditpro.com \
  --role=roles/run.invoker
```

Then verify:

```bash
gcloud run services get-iam-policy reeditpro-staging-api \
  --project=reeditpro \
  --region=us-central1 \
  --format=json
```

Expected rollback readback: no service-level `roles/run.invoker` binding for `group:external-beta-testers@reeditpro.com`, `allUsers`, or `allAuthenticatedUsers`.

## Service Flag Rollback

If the staging API beta flag must be disabled, use the existing controlled rollback mode:

`REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Do not use production service changes for this staging beta access lane.
