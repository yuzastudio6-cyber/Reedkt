import { loadRuntimeEnv } from '../config/env'
import {
  evaluateStagingRealVideoUploadPreviewCanaryPreflight,
  runStagingRealVideoUploadPreviewCanary,
} from '../services/staging-real-video-upload-preview-canary-service'
import { findSupabaseSmokeRunLeftovers } from '../services/supabase-smoke-leftover-service'
import { readPreviousSmokeRunIds } from '../services/render-infrastructure-canary-guard'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const expectDisabled = process.argv.includes('--expect-disabled')
const preflightOnly = process.argv.includes('--preflight')
const env = loadRuntimeEnv(process.env)
const admin = createSupabaseAdminClient(env)
const previousSmokeRunIds = readPreviousSmokeRunIds(process.env)
const leftoverChecks = await runPreviousSmokeLeftoverChecks()

const preflight = evaluateStagingRealVideoUploadPreviewCanaryPreflight({
  env,
  sourceEnv: process.env,
  expectDisabled,
  previousSmokeLeftoverChecks: leftoverChecks.map((check) => ({
    label: check.label,
    smokeRunId: check.smokeRunId,
    ok: 'result' in check ? check.result.ok : undefined,
    leftovers: 'result' in check ? check.result.leftovers : undefined,
    queryErrors: 'result' in check ? check.result.queryErrors : undefined,
    error: 'error' in check ? check.error : undefined,
  })),
})

if (preflightOnly || !preflight.ok || preflight.status !== 'ready') {
  console.log(JSON.stringify({
    ...preflight,
    previousSmokeLeftoverChecks: leftoverChecks,
  }, null, 2))
  if (!preflight.ok) process.exitCode = 1
  process.exit()
}

const context: ServiceContext = {
  env,
  clients: {
    admin,
    public: null,
  },
  requestId: 'cli-staging-real-video-upload-preview-canary',
  auth: {
    userId: env.supabaseE2eUserId ?? 'unknown-staging-smoke-user',
    isMockUser: true,
  },
}

const result = await runStagingRealVideoUploadPreviewCanary(context)
console.log(JSON.stringify(result, null, 2))
if (!result.ok || result.status !== 'passed' || !result.strictValidation.ok) process.exitCode = 1

async function runPreviousSmokeLeftoverChecks() {
  const checks = [
    { label: 'previous_write_smoke', smokeRunId: previousSmokeRunIds.write },
    { label: 'previous_persisted_render_smoke', smokeRunId: previousSmokeRunIds.persistedRender },
    { label: 'previous_sandbox_render_smoke', smokeRunId: previousSmokeRunIds.sandboxRender },
  ]

  if (expectDisabled && (env.supabaseE2eSmokeMode !== 'live' || !env.hasSupabaseAdmin)) {
    return []
  }

  return Promise.all(checks.map(async (check) => {
    if (!check.smokeRunId) return { ...check, error: 'missing smoke run id' }
    if (env.supabaseE2eSmokeMode !== 'live' || !env.hasSupabaseAdmin || !admin) {
      return { ...check, error: 'live staging Supabase admin env is required for previous smoke leftover checks' }
    }

    try {
      return {
        ...check,
        result: await findSupabaseSmokeRunLeftovers(admin, check.smokeRunId),
      }
    } catch (error) {
      return {
        ...check,
        error: error instanceof Error ? error.message : 'unknown leftover check error',
      }
    }
  }))
}
