import { loadRuntimeEnv } from '../config/env'
import {
  evaluateRenderInfrastructureCanaryGuard,
  readPreviousSmokeRunIds,
  readRenderInfrastructureCanaryLiveConfig,
  type RenderInfrastructurePreviousSmokeLeftoverCheck,
} from '../services/render-infrastructure-canary-guard'
import { invokeStagingRenderInfrastructureCanary } from '../cloud-run/render-canary-client'
import { runPersistedBasicRenderSmoke } from '../services/supabase-e2e-smoke-service'
import { findSupabaseSmokeRunLeftovers } from '../services/supabase-smoke-leftover-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const expectDisabled = process.argv.includes('--expect-disabled')
const env = loadRuntimeEnv(process.env)
const admin = createSupabaseAdminClient(env)
const previousSmokeRunIds = readPreviousSmokeRunIds(process.env)
const leftoverChecks = await runPreviousSmokeLeftoverChecks()
const guard = evaluateRenderInfrastructureCanaryGuard({
  env,
  sourceEnv: process.env,
  expectDisabled,
  previousSmokeRunIds,
  leftoverChecks,
})

if (!guard.ok || guard.status !== 'ready') {
  console.log(JSON.stringify(guard, null, 2))
  if (!guard.ok) process.exitCode = 1
  process.exit()
}

const liveConfig = readRenderInfrastructureCanaryLiveConfig(process.env)
const context: ServiceContext = {
  env,
  clients: {
    admin,
    public: null,
  },
  requestId: 'cli-render-infrastructure-canary-strict',
  auth: {
    userId: env.supabaseE2eUserId ?? 'unknown-staging-smoke-user',
    isMockUser: true,
  },
}

const result = await runPersistedBasicRenderSmoke(context, {
  renderExecutionMode: 'staging_cloud_run_remotion_canary',
  createExternalRenderArtifacts: async ({ smokeRunId }) => {
    const invocation = await invokeStagingRenderInfrastructureCanary({
      smokeRunId,
      config: {
        cloudRunUrl: liveConfig.cloudRunUrl!,
        audience: liveConfig.cloudRunAudience!,
        idToken: liveConfig.idToken!,
        durationSeconds: liveConfig.durationSeconds,
        width: liveConfig.width,
        height: liveConfig.height,
        fps: liveConfig.fps,
        timeoutSeconds: liveConfig.timeoutSeconds,
      },
    })

    return {
      outputBucketName: invocation.outputBucketName,
      outputObjectPath: invocation.outputObjectPath,
      durationSeconds: invocation.durationSeconds,
      sizeBytes: invocation.sizeBytes,
      checksumSha256: invocation.checksumSha256,
      mediaProbe: {
        durationSeconds: invocation.durationSeconds,
        width: invocation.width,
        height: invocation.height,
        videoCodec: 'h264',
        audioCodec: 'muted',
        formatName: 'mp4',
        sizeBytes: invocation.sizeBytes,
        streamCount: 1,
        rawSummary: {
          mode: 'staging_cloud_run_remotion_canary',
          frameCount: invocation.frameCount,
          outputArtifactCleaned: true,
        },
      },
      previewRender: {
        durationSeconds: invocation.durationSeconds,
        sizeBytes: invocation.sizeBytes,
        checksumSha256: invocation.checksumSha256,
        commandSummary: invocation.commandSummary,
      },
      outputArtifactSummary: invocation.outputArtifactSummary,
    }
  },
})

const renderSmoke = result.renderSmoke && typeof result.renderSmoke === 'object' && !Array.isArray(result.renderSmoke)
  ? result.renderSmoke as Record<string, unknown>
  : undefined
const previewRender = renderSmoke?.previewRender && typeof renderSmoke.previewRender === 'object' && !Array.isArray(renderSmoke.previewRender)
  ? renderSmoke.previewRender as Record<string, unknown>
  : undefined
const commandSummary = previewRender?.commandSummary && typeof previewRender.commandSummary === 'object' && !Array.isArray(previewRender.commandSummary)
  ? previewRender.commandSummary as Record<string, unknown>
  : undefined
const outputArtifactSummary = renderSmoke?.outputArtifactSummary && typeof renderSmoke.outputArtifactSummary === 'object' && !Array.isArray(renderSmoke.outputArtifactSummary)
  ? renderSmoke.outputArtifactSummary as Record<string, unknown>
  : undefined
const events = Array.isArray(renderSmoke?.events)
  ? renderSmoke.events.filter((event): event is Record<string, unknown> => Boolean(event && typeof event === 'object' && !Array.isArray(event)))
  : []
const cleanupErrors = result.cleanup?.errors ?? []
const deletedCount = result.cleanup?.deleted.length ?? 0
const readbackBlockers = result.readback?.blockers ?? []
const leftoverRecords = result.leftoverRecords ?? []
const leftoverQueryErrors = result.leftoverQueryErrors ?? []
const blockers: string[] = []

if (!result.ok || result.status !== 'passed') {
  blockers.push(result.error?.message ?? 'Render infrastructure canary did not pass.')
}
if (!result.writesAllowed) blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged by the smoke result.')
if (!result.cleanupEnabled) blockers.push('SUPABASE_E2E_CLEANUP=true is required for strict render infrastructure validation.')
if (!result.cleanup?.attempted) blockers.push('Strict render infrastructure validation requires cleanup to be attempted.')
if (cleanupErrors.length > 0) blockers.push(`Cleanup reported ${cleanupErrors.length} error(s).`)
if (deletedCount === 0) blockers.push('Cleanup did not delete any smoke-tagged render infrastructure records.')
if (!result.records?.smokeRunId) blockers.push('Smoke result did not include a smokeRunId.')
if (renderSmoke?.status !== 'preview_ready') blockers.push('Render infrastructure pipeline did not reach preview_ready.')
if (renderSmoke?.renderExecutionMode !== 'staging_cloud_run_remotion_canary') {
  blockers.push('Render infrastructure pipeline did not use staging_cloud_run_remotion_canary mode.')
}
if (commandSummary?.cloudRunInvoked !== true) blockers.push('Cloud Run canary invocation was not confirmed.')
if (commandSummary?.remotionRenderMediaInvoked !== true) blockers.push('Remotion renderMedia invocation was not confirmed.')
if (outputArtifactSummary?.existsBeforeCleanup !== true || outputArtifactSummary?.existsAfterCleanup !== false) {
  blockers.push('Output artifact creation and cleanup were not confirmed.')
}
if (outputArtifactSummary?.smokeTraceable !== true) blockers.push('Output artifact path was not traceable to smokeRunId.')
if (!events.some((event) => event.eventName === 'worker_claimed')) blockers.push('Render infrastructure canary did not record a worker_claimed event.')
if (!events.some((event) => event.eventName === 'completed' || event.eventName === 'worker_completed')) {
  blockers.push('Render infrastructure canary did not record a completion event.')
}
if (readbackBlockers.length > 0 || result.readback?.ok !== true) blockers.push(...readbackBlockers)
if (leftoverRecords.length > 0) blockers.push(`Cleanup left ${leftoverRecords.length} exact record(s) behind.`)
if (leftoverQueryErrors.length > 0) blockers.push(`Cleanup leftover readback reported ${leftoverQueryErrors.length} query error(s).`)
for (const idName of ['approvedPlanSnapshotId', 'creditReservationId', 'jobBatchId', 'jobId', 'renderJobId', 'workerJobClaimId', 'renderId', 'previewStorageObjectId', 'qaReportId']) {
  if (!result.records?.[idName as keyof typeof result.records]) blockers.push(`Smoke result missing ${idName}.`)
}

const strictResult = {
  ...result,
  strictValidation: {
    ok: blockers.length === 0,
    blockers,
    allowWritesAcknowledged: result.writesAllowed,
    allowRenderExecutionAcknowledged: process.env.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true',
    allowCloudRunAcknowledged: process.env.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true',
    allowRemotionAcknowledged: process.env.SUPABASE_E2E_ALLOW_REMOTION === 'true',
    cleanupAcknowledged: result.cleanupEnabled,
    stagingOnly: env.supabaseE2eSmokeMode === 'live' && env.hasSupabaseAdmin,
    renderInfrastructureMode: renderSmoke?.renderExecutionMode,
    cloudRunServicePathUsed: liveConfig.cloudRunUrl ? new URL(liveConfig.cloudRunUrl).pathname || '/canary/render' : undefined,
    remotionPathUsed: 'renderMedia/bundle/selectComposition',
    commandSummary,
    outputArtifactSummary,
    jobStatusTransitionsObserved: events.map((event) => ({
      eventName: event.eventName,
      eventType: event.eventType,
      status: event.status,
      jobEventId: event.jobEventId,
    })),
    cleanupDeletedCount: deletedCount,
    leftoverRecords,
    leftoverQueryErrors,
    noProductionFlowsRan: true,
    noStripeOrPaymentFlowsRan: true,
    noExternalProviderGenerationCallsRan: true,
    noBroadE2eSuiteRan: true,
  },
}

console.log(JSON.stringify(strictResult, null, 2))
if (blockers.length > 0) process.exitCode = 1

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
