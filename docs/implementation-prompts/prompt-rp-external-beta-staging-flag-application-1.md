# RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1 Prompt

Use after `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1` records `completed_controlled_external_beta_enablement_source_contract_default_off`.

## Goal

Apply or record the controlled external beta staging flag only if the operator explicitly confirms the exact environment and rollback path.

## Required Values

- `REEDITPRO_EXTERNAL_BETA_READY=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

## Boundaries

The staging flag application must not enable paid production, public artifacts, signed URL source-of-truth, broad media, final delivery/export, production deployment, unapproved provider/model calls, or Stripe/payment processing.

If the target, scope, or rollback mode cannot be applied exactly, fail closed and keep external beta disabled.
