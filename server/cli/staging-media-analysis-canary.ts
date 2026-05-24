import { loadRuntimeEnv } from '../config/env'
import {
  evaluateStagingMediaAnalysisCanaryPreflight,
  runStagingMediaAnalysisCanary,
} from '../services/staging-media-analysis-canary-service'
import { findSupabaseSmokeRunLeftovers } from '../services/supabase-smoke-leftover-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const expectDisabled = process.argv.includes('--expect-disabled')
const preflightOnly = process.argv.includes('--preflight')
const env = loadRuntimeEnv(process.env)
const admin = createSupabaseAdminClient(env)
const previousSmokeRunIds = readMediaAnalysisPreviousSmokeRunIds(process.env)
const leftoverChecks = await runPreviousSmokeLeftoverChecks()

const preflight = evaluateStagingMediaAnalysisCanaryPreflight({
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
  requestId: 'cli-staging-media-analysis-canary',
  auth: {
    userId: env.supabaseE2eUserId ?? 'unknown-staging-smoke-user',
    isMockUser: true,
  },
}

const result = await runStagingMediaAnalysisCanary(context)
console.log(JSON.stringify(result, null, 2))
if (!result.ok || result.status !== 'passed' || !result.strictValidation.ok) process.exitCode = 1

function readMediaAnalysisPreviousSmokeRunIds(sourceEnv: Record<string, string | undefined>): Array<{
  label: string
  smokeRunId?: string
}> {
  return [
    {
      label: 'previous_write_smoke',
      smokeRunId: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_WRITE_SMOKE_RUN_ID) ?? clean(sourceEnv.SUPABASE_E2E_PREVIOUS_SMOKE_RUN_ID),
    },
    {
      label: 'previous_persisted_render_smoke',
      smokeRunId: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_PERSISTED_RENDER_SMOKE_RUN_ID),
    },
    {
      label: 'previous_sandbox_render_smoke',
      smokeRunId: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_SANDBOX_RENDER_SMOKE_RUN_ID),
    },
    {
      label: 'previous_render_infrastructure_smoke',
      smokeRunId: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_RENDER_INFRASTRUCTURE_SMOKE_RUN_ID),
    },
    {
      label: 'previous_real_video_smoke',
      smokeRunId: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_REAL_VIDEO_SMOKE_RUN_ID),
    },
  ]
}

async function runPreviousSmokeLeftoverChecks() {
  if (expectDisabled && (env.supabaseE2eSmokeMode !== 'live' || !env.hasSupabaseAdmin)) {
    return []
  }

  return Promise.all(previousSmokeRunIds.map(async (check) => {
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

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
