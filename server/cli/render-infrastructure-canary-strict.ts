import { loadRuntimeEnv } from '../config/env'
import { evaluateRenderInfrastructureCanaryGuard, readPreviousSmokeRunIds } from '../services/render-infrastructure-canary-guard'
import type { RenderInfrastructurePreviousSmokeLeftoverCheck } from '../services/render-infrastructure-canary-guard'
import { findSupabaseSmokeRunLeftovers } from '../services/supabase-smoke-leftover-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'

const expectDisabled = process.argv.includes('--expect-disabled')
const env = loadRuntimeEnv(process.env)
const admin = createSupabaseAdminClient(env)
const previousSmokeRunIds = readPreviousSmokeRunIds(process.env)
const leftoverChecks = await runPreviousSmokeLeftoverChecks()

const result = evaluateRenderInfrastructureCanaryGuard({
  env,
  sourceEnv: process.env,
  expectDisabled,
  previousSmokeRunIds,
  leftoverChecks,
})

console.log(JSON.stringify(result, null, 2))
if (!result.ok) process.exitCode = 1

async function runPreviousSmokeLeftoverChecks(): Promise<RenderInfrastructurePreviousSmokeLeftoverCheck[]> {
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
