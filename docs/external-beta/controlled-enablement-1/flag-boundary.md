# Controlled External Beta Flag Boundary

Packet: `RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1`

Decision: `completed_controlled_external_beta_enablement_source_contract_default_off`

Execution: `completed_source_contract_no_environment_mutation_or_deployment`

## Exact Flag Contract

The source contract recognizes only this bounded staging flag set:

| Env name | Required value |
| --- | --- |
| `REEDITPRO_EXTERNAL_BETA_READY` | `true` |
| `REEDITPRO_EXTERNAL_BETA_TARGET_REF` | `wmyyttnynmteqgcdishd` |
| `REEDITPRO_EXTERNAL_BETA_SCOPE` | `controlled_private_preview` |
| `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE` | `disable_REEDITPRO_EXTERNAL_BETA_READY` |

Default state with no flag: `disabled_pending_explicit_external_beta_ready_flag`.

Valid configured state: `enabled_controlled_external_beta_private_preview_only`.

This packet does not apply those values to Google Cloud, Supabase, local `.env`, CI, deployment, or any running service. External beta enabled in this phase: `false`.

## Runtime Boundary

The controlled external beta lane is bounded to private preview behavior only and still requires:

- approved snapshot;
- credit reservation;
- private artifacts only;
- provider/model calls disabled by default;
- no public artifacts;
- no signed URL source-of-truth;
- no paid billing;
- no final delivery/export;
- no production;
- no broad media.
