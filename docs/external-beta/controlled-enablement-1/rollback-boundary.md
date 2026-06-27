# Rollback Boundary

Packet: `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`

Rollback mode required by source contract: `disable_REEDITPRO_EXTERNAL_BETA_READY`

## Future Rollback Path

Any future staging flag application must be reversible by setting or removing:

- `REEDITPRO_EXTERNAL_BETA_READY=false`

The source contract also requires the rollback declaration:

- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

If the rollback declaration is missing, the contract returns `blocked_rollback_mode_missing`.

## Still Not Approved

This packet does not approve or perform:

- deployment;
- Cloud Run service update;
- Google Cloud Secret Manager payload access;
- Supabase mutation;
- SQL execution;
- worker execution or dispatch;
- provider/model call;
- route execution;
- signed URL creation;
- public artifact creation;
- media processing;
- final delivery/export;
- paid production or Stripe processing;
- production unlock.
