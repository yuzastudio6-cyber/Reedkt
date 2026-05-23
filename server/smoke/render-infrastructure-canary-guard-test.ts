import { loadRuntimeEnv } from '../config/env'
import { evaluateRenderInfrastructureCanaryGuard } from '../services/render-infrastructure-canary-guard'

const smokeIds = {
  write: 'rp-e2e-smoke-79ce5e86-b894-4bf4-967d-d702a1c16ccf',
  persistedRender: 'rp-e2e-smoke-c60fc032-7fee-4810-bc4e-4d799d2a1438',
  sandboxRender: 'rp-e2e-smoke-5a57ff5e-2017-4cf1-963b-703097fc9ec8',
}

const liveBaseEnv = {
  NODE_ENV: 'test',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'false',
  E2E_RUNTIME_MODE: 'cloud_run',
  WORKER_RUNTIME_MODE: 'cloud_run',
  STORAGE_MODE: 'gcs',
  SUPABASE_E2E_SMOKE_MODE: 'live',
  SUPABASE_E2E_ALLOW_WRITES: 'true',
  SUPABASE_E2E_ALLOW_RENDER_EXECUTION: 'true',
  SUPABASE_E2E_ALLOW_CLOUD_RUN: 'true',
  SUPABASE_E2E_ALLOW_REMOTION: 'true',
  SUPABASE_E2E_CLEANUP: 'true',
  SUPABASE_E2E_MAX_WAIT_SECONDS: '180',
  SUPABASE_URL: 'https://staging-example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-placeholder',
  SUPABASE_E2E_USER_ID: 'bb300bde-97fa-438d-ab97-a47dec0ca7d1',
  STAGING_RENDER_CANARY_DURATION_SECONDS: '3',
  STAGING_RENDER_CANARY_WIDTH: '160',
  STAGING_RENDER_CANARY_HEIGHT: '90',
  STAGING_RENDER_CANARY_FPS: '15',
  STAGING_RENDER_CANARY_MAX_RETRIES: '0',
  STAGING_RENDER_CANARY_CONCURRENCY: '1',
  STAGING_RENDER_CANARY_TIMEOUT_SECONDS: '300',
  STAGING_RENDER_CANARY_MEMORY: '2Gi',
  STAGING_RENDER_CANARY_CPU: '2',
  STAGING_RENDER_CANARY_NODE_OPTIONS: '--max-old-space-size=1536',
}

const readyCanaryEnv = {
  ...liveBaseEnv,
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-east1',
  GCP_WORKLOAD_IDENTITY_PROVIDER: 'projects/123/locations/global/workloadIdentityPools/reeditpro-staging/providers/github',
  GCP_SERVICE_ACCOUNT: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com',
  STAGING_CLOUD_RUN_RENDER_CANARY_URL: 'https://reeditpro-staging-render-canary-390722338345.us-east1.run.app/canary/render',
  STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://reeditpro-staging-render-canary-390722338345.us-east1.run.app',
  STAGING_RENDER_CANARY_ID_TOKEN: 'header.payload.signature',
  STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX: 'gs://reeditpro-staging-render-canary-smoke/previews',
}

const cleanLeftoverChecks = [
  { label: 'previous_write_smoke', smokeRunId: smokeIds.write, result: cleanLeftoverResult(smokeIds.write) },
  { label: 'previous_persisted_render_smoke', smokeRunId: smokeIds.persistedRender, result: cleanLeftoverResult(smokeIds.persistedRender) },
  { label: 'previous_sandbox_render_smoke', smokeRunId: smokeIds.sandboxRender, result: cleanLeftoverResult(smokeIds.sandboxRender) },
]

const disabled = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv({
    NODE_ENV: 'test',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
  }),
  sourceEnv: {
    NODE_ENV: 'test',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    SUPABASE_E2E_SMOKE_MODE: 'disabled',
  },
  expectDisabled: true,
})

const missingConfig = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: liveBaseEnv,
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [],
})

const readyConfig = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: readyCanaryEnv,
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const missingOidc = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_RENDER_CANARY_ID_TOKEN: '',
    GCP_WORKLOAD_IDENTITY_PROVIDER: '',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const missingAudience = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: '',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const audienceMismatch = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://different-staging-canary-abc.run.app',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const localhostUrl = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_CLOUD_RUN_RENDER_CANARY_URL: 'https://localhost/canary/render',
    STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://localhost',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const productionUrl = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    GCP_PROJECT_ID: 'reeditpro-production',
    STAGING_CLOUD_RUN_RENDER_CANARY_URL: 'https://reeditpro-production-render-canary-abc.run.app/canary/render',
    STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: 'https://reeditpro-production-render-canary-abc.run.app',
    STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX: 'gs://reeditpro-production-canary-previews',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const legacyAliasConfig = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_CLOUD_RUN_RENDER_CANARY_URL: '',
    STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE: '',
    STAGING_RENDER_CANARY_CLOUD_RUN_URL: readyCanaryEnv.STAGING_CLOUD_RUN_RENDER_CANARY_URL,
    STAGING_RENDER_CANARY_CLOUD_RUN_AUDIENCE: readyCanaryEnv.STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE,
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const oversized = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    SUPABASE_E2E_MAX_WAIT_SECONDS: '999',
    STAGING_RENDER_CANARY_DURATION_SECONDS: '8',
    STAGING_RENDER_CANARY_WIDTH: '1920',
    STAGING_RENDER_CANARY_HEIGHT: '1080',
    STAGING_RENDER_CANARY_FPS: '60',
    STAGING_RENDER_CANARY_MAX_RETRIES: '3',
    STAGING_RENDER_CANARY_CONCURRENCY: '4',
    STAGING_RENDER_CANARY_TIMEOUT_SECONDS: '600',
    STAGING_RENDER_CANARY_MEMORY: '4Gi',
    STAGING_RENDER_CANARY_CPU: '4',
    STAGING_RENDER_CANARY_NODE_OPTIONS: '--max-old-space-size=4096',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const missingNodeOptions = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: {
    ...readyCanaryEnv,
    STAGING_RENDER_CANARY_NODE_OPTIONS: '',
    NODE_OPTIONS: '',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const cleanupDisabled = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv({ ...liveBaseEnv, SUPABASE_E2E_CLEANUP: 'false' }),
  sourceEnv: { ...readyCanaryEnv, SUPABASE_E2E_CLEANUP: 'false' },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const leftoverBlocked = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: readyCanaryEnv,
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [
    {
      label: 'previous_write_smoke',
      smokeRunId: smokeIds.write,
      result: {
        ok: false,
        smokeRunId: smokeIds.write,
        checkedTables: ['render_jobs'],
        leftovers: [{ table: 'render_jobs', id: 'render-job-leftover', matchedBy: 'metadata->>smokeRunId' }],
        queryErrors: ['renders: test query failure'],
        warnings: [],
      },
    },
  ],
})

const riskyEnv = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: { ...readyCanaryEnv, STRIPE_SECRET_KEY: 'sk_test_should_not_leak' },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const providerEnv = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(readyCanaryEnv),
  sourceEnv: { ...readyCanaryEnv, OPENAI_API_KEY: 'provider-secret-should-not-leak' },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: cleanLeftoverChecks,
})

const serialized = JSON.stringify({
  disabled,
  missingConfig,
  readyConfig,
  missingOidc,
  missingAudience,
  audienceMismatch,
  localhostUrl,
  productionUrl,
  legacyAliasConfig,
  oversized,
  missingNodeOptions,
  cleanupDisabled,
  leftoverBlocked,
  riskyEnv,
  providerEnv,
})
const checks = [
  disabled.ok && disabled.status === 'skipped' && disabled.strictValidation.dryRun ? 'disabled_mode_dry_run_skips' : undefined,
  missingConfig.error?.code === 'missing_staging_render_infrastructure_canary_path' ? 'missing_path_blocks' : undefined,
  readyConfig.ok && readyConfig.status === 'ready' ? 'ready_config_passes_guard' : undefined,
  missingOidc.error?.code === 'missing_gcp_oidc_auth' ? 'missing_oidc_rejected' : undefined,
  missingAudience.error?.code === 'missing_cloud_run_audience' ? 'missing_audience_rejected' : undefined,
  audienceMismatch.strictValidation.blockers.some((blocker) => blocker.includes('AUDIENCE host')) ? 'audience_mismatch_rejected' : undefined,
  localhostUrl.error?.code === 'invalid_cloud_run_url' ? 'localhost_url_rejected' : undefined,
  productionUrl.strictValidation.blockers.some((blocker) => blocker.includes('production')) ? 'production_url_rejected' : undefined,
  legacyAliasConfig.ok && legacyAliasConfig.status === 'ready' ? 'legacy_alias_config_passes_guard' : undefined,
  oversized.strictValidation.blockers.some((blocker) => blocker.includes('320x240')) ? 'oversized_render_rejected' : undefined,
  oversized.strictValidation.blockers.some((blocker) => blocker.includes('2Gi'))
    && oversized.strictValidation.blockers.some((blocker) => blocker.includes('exactly 2'))
    && oversized.strictValidation.blockers.some((blocker) => blocker.includes('NODE_OPTIONS'))
    ? 'unbounded_resource_profile_rejected'
    : undefined,
  missingNodeOptions.strictValidation.blockers.some((blocker) => blocker.includes('NODE_OPTIONS')) ? 'missing_node_options_rejected' : undefined,
  cleanupDisabled.strictValidation.blockers.some((blocker) => blocker.includes('CLEANUP=true')) ? 'cleanup_required' : undefined,
  leftoverBlocked.strictValidation.blockers.some((blocker) => blocker.includes('leftover check found')) ? 'leftovers_block' : undefined,
  riskyEnv.error?.code === 'stripe_must_be_disabled' ? 'stripe_env_rejected' : undefined,
  providerEnv.error?.code === 'providers_must_be_disabled' ? 'provider_env_rejected' : undefined,
  !serialized.includes('sk_test_should_not_leak')
    && !serialized.includes('provider-secret-should-not-leak')
    && !serialized.includes('test-service-role-placeholder')
    && !serialized.includes('header.payload.signature')
    ? 'secret_values_not_printed'
    : undefined,
].filter(Boolean)

const ok = checks.length === 17
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1

function cleanLeftoverResult(smokeRunId: string) {
  return {
    ok: true,
    smokeRunId,
    checkedTables: ['jobs', 'render_jobs', 'renders'],
    leftovers: [],
    queryErrors: [],
    warnings: [],
  }
}
