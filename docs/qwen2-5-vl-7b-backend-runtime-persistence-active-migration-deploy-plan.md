# Qwen2.5-VL 7B Backend Runtime Persistence Active Migration Deploy Plan

Decision: `qwen2_5_vl_backend_runtime_persistence_active_migration_deploy_plan_recorded_deploy_approval_required`.

This packet plans deployment of the locally validated Qwen2.5-VL backend runtime persistence active migration. It does not deploy the migration, touch Supabase cloud, staging, production, or live data, run SQL, run Supabase deployment commands, call Cloud Run, run Qwen inference, initialize vLLM, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Inputs

- Active migration validation result: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-validation-result.md`
- Active migration create packet: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-create.md`
- Active migration plan: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-plan.md`
- Active migration: `supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql`
- Local SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Private invoke readiness rollup: `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-readiness-rollup.md`
- Supabase deployment documentation and changelog were inspected before this plan. Future deployment still requires owner approval and current CLI command discovery before any cloud command is allowed.

## Validated Candidate

- Migration file: `supabase/migrations/20260629011700_qwen2_5_vl_backend_runtime_persistence.sql`
- Migration history version observed locally: `20260629011700`
- Local harness project id: `reeditpro_qwen_local_harness`
- Active ReEditPro baseline migrations applied locally: true
- Active Qwen migration applied locally: true
- Qwen SQL tests passed locally: true
- Selected GPU metadata preserved: `nvidia_l4`
- Serving profile preserved: `bounded_preview_scale_to_zero`

## Deployment Scope

The future deploy scope is limited to the validated active migration file. It may only promote already-validated metadata and guard changes for Qwen backend runtime persistence:

- Qwen-specific job payload source-of-truth checks;
- sanitized job-event payload checks;
- worker runtime config checks for Qwen;
- worker lease, runtime message, and job claim attempt Qwen guards;
- `tool_runtime_checks` support for `qwen_vl`;
- Qwen indexes;
- L4 scale-to-zero metadata;
- private storage, approved snapshot, checksum, structured findings, and edit-intent requirements.

The future deploy scope must not seed rows, create worker runtime config rows, create tool capability rows, create jobs, create job events, create storage objects, create signed URL events, create generated assets, create QA rows, mutate credits, call providers, invoke Cloud Run, or enable beta/production.

## Future Deployment Preconditions

Before a future deploy prompt may run any cloud deployment command, it must re-check:

- the intended Supabase target environment and project reference;
- the target branch/environment ownership and allowed data class;
- current migration status and whether version `20260629011700` is already present;
- the active migration text matches the locally validated file;
- advisor output for security and performance issues where available;
- backup/restore or rollback expectations for the selected environment;
- Data API exposure/grant expectations, because new exposed-schema tables can require explicit grants and RLS review. This Qwen migration does not add new tables, but the future deploy prompt must still verify it does not accidentally change API exposure;
- pg_graphql exposure remains out of scope for this migration;
- all generated Supabase local metadata directories remain unstaged;
- no credentials, tokens, passwords, connection strings, or local default development keys are recorded in repo evidence.

## Future Command Plan

The following command families are future-only examples and were not run by this prompt:

- inspect Supabase CLI help before choosing a command;
- inspect migration status for the approved target;
- deploy the active migration only after target approval;
- collect advisor output after deployment if the target owner approves it;
- verify the migration history contains `20260629011700` on the approved target.

This prompt did not run `supabase login`, `supabase link`, `supabase db push`, `supabase migration up`, SQL, psql, Docker, local harness startup, Cloud Run, or provider/runtime commands.

## Rollback And Recovery Expectations

The active migration is additive guard/index/comment metadata. A future deployment approval must still define:

- whether rollback is allowed for the target environment;
- who owns rollback decision authority;
- whether rollback requires a separate migration;
- how to preserve approved snapshot/private storage/source-of-truth integrity;
- how to keep Qwen workers fail-closed if deployment partially succeeds;
- what evidence proves no generated assets, jobs, storage objects, signed URLs, or credit rows were created by the deploy.

No rollback command or migration was created by this plan.

## Runtime Gates

- `backendRuntimePersistenceActiveMigrationDeployPlanRecorded=true`
- `backendRuntimePersistenceActiveMigrationDeployApprovalRequired=true`
- `backendRuntimePersistenceActiveMigrationDeploymentTargetApproved=false`
- `backendRuntimePersistenceActiveMigrationDeployed=false`
- `migrationDeployed=false`
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `cloudRunInvocationAttempted=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Plan Proves

- The locally validated active migration has a documented future deployment boundary.
- Deployment approval, target selection, advisor review, rollback expectations, and no-runtime-unlock gates are required before deployment.
- The next blocker is deployment approval, not additional local harness validation.

## What This Plan Does Not Prove

- No migration has been deployed to Supabase cloud, staging, production, or live data.
- No Supabase target environment is approved.
- No real worker dispatch is enabled.
- No Cloud Run private invoke request is sent.
- No Qwen inference has run.
- No generated asset, public artifact, signed URL, QA row, audit row, or credit mutation is created.
- `dry_run_passed` is not claimed.
- `generated_local_fixture_passed` is not claimed.
- Beta and production remain blocked.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BD-BACKEND-RUNTIME-PERSISTENCE-ACTIVE-MIGRATION-DEPLOY-APPROVAL: approve deployment target for validated Qwen persistence migration, no deploy/no cloud/no assets/no beta`
