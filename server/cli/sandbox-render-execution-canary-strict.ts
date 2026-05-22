import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { runPersistedBasicRenderSmoke } from '../services/supabase-e2e-smoke-service'
import type { ServiceContext } from '../types'

const expectDisabled = process.argv.includes('--expect-disabled')
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const env = loadRuntimeEnv(process.env)
const allowRenderExecution = process.env.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true'
const allowCloudRun = process.env.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true'
const allowRemotion = process.env.SUPABASE_E2E_ALLOW_REMOTION === 'true'
const maxWaitSeconds = Number(process.env.SUPABASE_E2E_MAX_WAIT_SECONDS ?? '120')

if (!env.supabaseE2eUserId || !UUID_PATTERN.test(env.supabaseE2eUserId)) {
  console.log(JSON.stringify({
    ok: false,
    status: 'failed',
    error: {
      code: 'missing_dependency',
      message: 'SUPABASE_E2E_USER_ID must be an existing safe staging Supabase auth user UUID before sandbox render execution canary can run.',
    },
    strictValidation: {
      ok: false,
      blockers: ['SUPABASE_E2E_USER_ID is missing or is not a UUID.'],
    },
  }, null, 2))
  process.exit(expectDisabled ? 0 : 1)
}

const context: ServiceContext = {
  env,
  clients: {
    admin: createSupabaseAdminClient(env),
    public: null,
  },
  requestId: 'cli-sandbox-render-execution-canary-strict',
  auth: {
    userId: env.supabaseE2eUserId,
    isMockUser: true,
  },
}

const result = await runPersistedBasicRenderSmoke(context, { renderExecutionMode: 'local_ffmpeg' })
const renderSmoke = result.renderSmoke && typeof result.renderSmoke === 'object' && !Array.isArray(result.renderSmoke)
  ? result.renderSmoke as Record<string, unknown>
  : undefined
const previewRender = renderSmoke?.previewRender && typeof renderSmoke.previewRender === 'object' && !Array.isArray(renderSmoke.previewRender)
  ? renderSmoke.previewRender as Record<string, unknown>
  : undefined
const commandSummary = previewRender?.commandSummary && typeof previewRender.commandSummary === 'object' && !Array.isArray(previewRender.commandSummary)
  ? previewRender.commandSummary as Record<string, unknown>
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

if (expectDisabled && (result.status === 'skipped' || result.error?.code === 'missing_env' || result.error?.code === 'disabled')) {
  console.log(JSON.stringify({
    ...result,
    strictValidation: {
      ok: true,
      dryRun: true,
      blockers: [],
      message: 'Sandbox render execution strict canary dry-run stopped before live writes, as expected.',
    },
  }, null, 2))
  process.exit(0)
}

if (!allowRenderExecution) {
  blockers.push('SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true was not acknowledged by the sandbox render execution canary.')
}
if (allowCloudRun) {
  blockers.push('SUPABASE_E2E_ALLOW_CLOUD_RUN must remain false for this local_ffmpeg sandbox canary.')
}
if (allowRemotion) {
  blockers.push('SUPABASE_E2E_ALLOW_REMOTION must remain false for this local_ffmpeg sandbox canary.')
}
if (!Number.isFinite(maxWaitSeconds) || maxWaitSeconds < 30 || maxWaitSeconds > 300) {
  blockers.push('SUPABASE_E2E_MAX_WAIT_SECONDS must be a bounded value from 30 to 300 seconds.')
}
if (!result.ok || result.status !== 'passed') {
  blockers.push(result.error?.message ?? 'Sandbox render execution canary did not pass.')
}
if (!result.writesAllowed) {
  blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged by the smoke result.')
}
if (!result.cleanupEnabled) {
  blockers.push('SUPABASE_E2E_CLEANUP=true is required for strict sandbox render execution validation.')
}
if (!result.cleanup?.attempted) {
  blockers.push('Strict sandbox render execution validation requires cleanup to be attempted.')
}
if (cleanupErrors.length > 0) {
  blockers.push(`Cleanup reported ${cleanupErrors.length} error(s).`)
}
if (deletedCount === 0) {
  blockers.push('Cleanup did not delete any smoke-tagged sandbox render records.')
}
if (!result.records?.smokeRunId) {
  blockers.push('Smoke result did not include a smokeRunId.')
}
if (renderSmoke?.status !== 'preview_ready') {
  blockers.push('Sandbox render execution pipeline did not reach preview_ready.')
}
if (renderSmoke?.renderExecutionMode !== 'local_ffmpeg') {
  blockers.push('Sandbox render execution pipeline did not use local_ffmpeg mode.')
}
if (commandSummary?.tool !== 'ffmpeg') {
  blockers.push('Sandbox render execution did not report an FFmpeg command summary.')
}
if (commandSummary?.audioMode !== 'muted') {
  blockers.push('Sandbox render execution must render the canary with muted audio.')
}
if (typeof commandSummary?.maxDurationSeconds !== 'number' || commandSummary.maxDurationSeconds > 3) {
  blockers.push('Sandbox render execution must cap preview duration at 3 seconds or less.')
}
if (!events.some((event) => event.eventName === 'worker_claimed')) {
  blockers.push('Sandbox render execution did not record a worker_claimed event.')
}
if (!events.some((event) => event.eventName === 'completed' || event.eventName === 'worker_completed')) {
  blockers.push('Sandbox render execution did not record a completion event.')
}
if (readbackBlockers.length > 0 || result.readback?.ok !== true) {
  blockers.push(...readbackBlockers)
}
if (leftoverRecords.length > 0) {
  blockers.push(`Cleanup left ${leftoverRecords.length} exact record(s) behind.`)
}
if (leftoverQueryErrors.length > 0) {
  blockers.push(`Cleanup leftover readback reported ${leftoverQueryErrors.length} query error(s).`)
}
for (const idName of ['approvedPlanSnapshotId', 'creditReservationId', 'jobBatchId', 'jobId', 'renderJobId', 'workerJobClaimId', 'renderId', 'previewStorageObjectId', 'qaReportId']) {
  if (!result.records?.[idName as keyof typeof result.records]) blockers.push(`Smoke result missing ${idName}.`)
}

const strictResult = {
  ...result,
  strictValidation: {
    ok: blockers.length === 0,
    blockers,
    allowWritesAcknowledged: result.writesAllowed,
    allowRenderExecutionAcknowledged: allowRenderExecution,
    cleanupAcknowledged: result.cleanupEnabled,
    allowCloudRunAcknowledged: allowCloudRun,
    allowRemotionAcknowledged: allowRemotion,
    stagingOnly: env.supabaseE2eSmokeMode === 'live' && env.hasSupabaseAdmin,
    renderExecutionMode: renderSmoke?.renderExecutionMode,
    commandSummary,
    jobStatusTransitionsObserved: events.map((event) => ({
      eventName: event.eventName,
      eventType: event.eventType,
      status: event.status,
      jobEventId: event.jobEventId,
    })),
    cleanupDeletedCount: deletedCount,
    leftoverRecords,
    leftoverQueryErrors,
    noProviderCallsRan: true,
    noStripeOrPaymentFlowsRan: true,
    noCloudRunCallsRan: true,
    noRemotionCallsRan: true,
    noProductionFlowsRan: true,
    noBroadE2eSuiteRan: true,
  },
}

console.log(JSON.stringify(strictResult, null, 2))
if (blockers.length > 0) process.exitCode = 1
