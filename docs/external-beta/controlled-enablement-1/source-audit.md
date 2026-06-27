# RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1 Source Audit

Decision: `completed_controlled_external_beta_enablement_source_contract_default_off`

Execution: `completed_source_contract_no_environment_mutation_or_deployment`

Base source: `RP-EXTERNAL-BETA-RELEASE-GO-NO-GO-1`

Release go/no-go: `approved_external_beta_release_go_no_go_source_chain_accepted`

Single active Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

External beta source contract: `ready_for_explicit_staging_flag_application`

External beta enabled in this phase: `false`

Product-ready end-to-end local OSS tools: `0`

## Accepted Source Chain

This packet carries forward the merged release go/no-go source chain:

- main Reeditpro staging migration sync;
- service-role grant-boundary validation;
- approved snapshot persistence;
- credit reservation ledger;
- job queue lease/events;
- private artifact storage/access;
- service-role route read;
- approved snapshot route write;
- generated-local Remotion private preview/export validation;
- disabled-by-default provider/model policy closure;
- QA/cleanup/observability/rollback review;
- release go/no-go source-chain acceptance.

PR #577 remains open/draft/blocked and excluded as source-of-truth.

## New Source Contract

`server/config/external-beta-controlled-enablement-contract.ts` adds a fail-closed source contract for a future staging flag application. It does not read process secrets, mutate Google Cloud, mutate Supabase, run SQL, deploy, route, dispatch workers, call providers/models, process media, render, or create artifacts.

The future flag application is valid only when all required values are present:

- `REEDITPRO_EXTERNAL_BETA_READY=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_EXTERNAL_BETA_SCOPE=controlled_private_preview`
- `REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE=disable_REEDITPRO_EXTERNAL_BETA_READY`

Without those exact values the contract fails closed.
