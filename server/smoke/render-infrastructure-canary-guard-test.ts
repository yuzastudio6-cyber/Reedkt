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
}

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

const productionUrl = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: {
    ...liveBaseEnv,
    STAGING_RENDER_CANARY_CLOUD_RUN_URL: 'https://reeditpro-production-render-canary-abc.run.app/canary',
    STAGING_RENDER_CANARY_AUTH_MODE: 'github_oidc',
    STAGING_RENDER_CANARY_REMOTION_COMPOSITION_ID: 'production-render-canary',
    STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT: 'production-remotion-canary',
    STAGING_RENDER_CANARY_OUTPUT_BUCKET: 'reeditpro-production-canary-previews',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [],
})

const oversized = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: {
    ...liveBaseEnv,
    SUPABASE_E2E_MAX_WAIT_SECONDS: '999',
    STAGING_RENDER_CANARY_DURATION_SECONDS: '8',
    STAGING_RENDER_CANARY_WIDTH: '1920',
    STAGING_RENDER_CANARY_HEIGHT: '1080',
    STAGING_RENDER_CANARY_FPS: '60',
    STAGING_RENDER_CANARY_MAX_RETRIES: '3',
    STAGING_RENDER_CANARY_CONCURRENCY: '4',
  },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [],
})

const cleanupDisabled = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv({ ...liveBaseEnv, SUPABASE_E2E_CLEANUP: 'false' }),
  sourceEnv: { ...liveBaseEnv, SUPABASE_E2E_CLEANUP: 'false' },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [],
})

const leftoverBlocked = evaluateRenderInfrastructureCanaryGuard({
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: liveBaseEnv,
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
  env: loadRuntimeEnv(liveBaseEnv),
  sourceEnv: { ...liveBaseEnv, STRIPE_SECRET_KEY: 'sk_test_should_not_leak' },
  previousSmokeRunIds: smokeIds,
  leftoverChecks: [],
})

const serialized = JSON.stringify({
  disabled,
  missingConfig,
  productionUrl,
  oversized,
  cleanupDisabled,
  leftoverBlocked,
  riskyEnv,
})
const checks = [
  disabled.ok && disabled.status === 'skipped' && disabled.strictValidation.dryRun ? 'disabled_mode_dry_run_skips' : undefined,
  missingConfig.error?.code === 'missing_staging_render_infrastructure_canary_path' ? 'missing_path_blocks' : undefined,
  productionUrl.strictValidation.blockers.some((blocker) => blocker.includes('production')) ? 'production_url_rejected' : undefined,
  oversized.strictValidation.blockers.some((blocker) => blocker.includes('320x240')) ? 'oversized_render_rejected' : undefined,
  cleanupDisabled.strictValidation.blockers.some((blocker) => blocker.includes('CLEANUP=true')) ? 'cleanup_required' : undefined,
  leftoverBlocked.strictValidation.blockers.some((blocker) => blocker.includes('leftover check found')) ? 'leftovers_block' : undefined,
  riskyEnv.strictValidation.blockers.some((blocker) => blocker.includes('STRIPE_SECRET_KEY')) ? 'stripe_env_rejected' : undefined,
  !serialized.includes('sk_test_should_not_leak') && !serialized.includes('test-service-role-placeholder') ? 'secret_values_not_printed' : undefined,
].filter(Boolean)

const ok = checks.length === 8
console.log(JSON.stringify({ ok, checks }, null, 2))
if (!ok) process.exitCode = 1
