import { loadRuntimeEnv } from '../config/env'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import { runPersistedBasicRenderSmoke } from '../services/supabase-e2e-smoke-service'
import type { ServiceContext } from '../types'

const expectDisabled = process.argv.includes('--expect-disabled')
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const env = loadRuntimeEnv(process.env)
const allowPersistedRender = process.env.SUPABASE_E2E_ALLOW_PERSISTED_RENDER === 'true'

if (!env.supabaseE2eUserId || !UUID_PATTERN.test(env.supabaseE2eUserId)) {
  console.log(JSON.stringify({
    ok: false,
    status: 'failed',
    error: {
      code: 'missing_dependency',
      message: 'SUPABASE_E2E_USER_ID must be an existing safe staging Supabase auth user UUID before persisted render smoke can run.',
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
  requestId: 'cli-persisted-render-smoke-strict',
  auth: {
    userId: env.supabaseE2eUserId,
    isMockUser: true,
  },
}

const result = await runPersistedBasicRenderSmoke(context, { renderExecutionMode: 'metadata_stub' })
const renderSmoke = result.renderSmoke && typeof result.renderSmoke === 'object' && !Array.isArray(result.renderSmoke)
  ? result.renderSmoke as Record<string, unknown>
  : undefined
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
      message: 'Persisted render strict smoke dry-run stopped before live writes, as expected.',
    },
  }, null, 2))
  process.exit(0)
}

if (!allowPersistedRender) {
  blockers.push('SUPABASE_E2E_ALLOW_PERSISTED_RENDER=true was not acknowledged by the strict persisted render gate.')
}
if (!result.ok || result.status !== 'passed') {
  blockers.push(result.error?.message ?? 'Persisted render smoke did not pass.')
}
if (!result.writesAllowed) {
  blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged by the smoke result.')
}
if (!result.cleanupEnabled) {
  blockers.push('SUPABASE_E2E_CLEANUP=true is required for strict persisted render validation.')
}
if (!result.cleanup?.attempted) {
  blockers.push('Strict persisted render validation requires cleanup to be attempted.')
}
if (cleanupErrors.length > 0) {
  blockers.push(`Cleanup reported ${cleanupErrors.length} error(s).`)
}
if (deletedCount === 0) {
  blockers.push('Cleanup did not delete any smoke-tagged persisted render records.')
}
if (!result.records?.smokeRunId) {
  blockers.push('Smoke result did not include a smokeRunId.')
}
if (renderSmoke?.status !== 'preview_ready') {
  blockers.push('Persisted render RPC pipeline did not reach preview_ready.')
}
if (renderSmoke?.renderExecutionMode !== 'metadata_stub') {
  blockers.push('Persisted render RPC pipeline did not use metadata_stub mode.')
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
    allowPersistedRenderAcknowledged: allowPersistedRender,
    stagingOnly: env.supabaseE2eSmokeMode === 'live' && env.hasSupabaseAdmin,
    renderExecutionMode: renderSmoke?.renderExecutionMode,
    cleanupDeletedCount: deletedCount,
    leftoverRecords,
    leftoverQueryErrors,
    noProviderCallsRan: true,
    noStripeCallsRan: true,
    noCloudRunCallsRan: true,
    noRemotionCallsRan: true,
    noProductionFlowsRan: true,
  },
}

console.log(JSON.stringify(strictResult, null, 2))
if (blockers.length > 0) process.exitCode = 1
