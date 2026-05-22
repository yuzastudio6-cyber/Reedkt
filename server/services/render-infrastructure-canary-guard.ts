import {
  clean,
  readRenderCanaryConfig,
  readRenderCanaryLimits,
  selectRenderCanaryErrorCode,
  validateRenderCanaryConfig,
} from '../cloud-run/render-canary-config'
import type {
  RenderCanaryConfig,
  RenderCanaryConfigValidationIssue,
  RenderCanaryGuardCode,
  RenderCanaryLimits,
} from '../cloud-run/render-canary-types'
import type { RuntimeEnv } from '../config/env'
import type { SupabaseSmokeLeftoverResult } from './supabase-smoke-leftover-service'

export interface RenderInfrastructurePreviousSmokeLeftoverCheck {
  label: string
  smokeRunId?: string
  result?: SupabaseSmokeLeftoverResult
  error?: string
}

export interface RenderInfrastructureCanaryGuardInput {
  env: RuntimeEnv
  sourceEnv: Record<string, string | undefined>
  expectDisabled?: boolean
  previousSmokeRunIds?: Record<string, string | undefined>
  leftoverChecks?: RenderInfrastructurePreviousSmokeLeftoverCheck[]
}

export type RenderInfrastructureCanaryLiveConfig = RenderCanaryConfig
export type RenderInfrastructureCanaryLimits = RenderCanaryLimits

export interface RenderInfrastructureCanaryGuardResult {
  ok: boolean
  status: 'skipped' | 'blocked' | 'ready'
  error?: {
    code: string
    message: string
  }
  smokeRunId: null
  createdRecordsSummary: Record<string, never>
  renderJobId: null
  renderId: null
  outputStorageObjectId: null
  outputArtifactSummary: null
  finalRenderStatus: null
  jobStatusTransitionsObserved: unknown[]
  cleanup: {
    attempted: boolean
    deletedCount: number
    errors: string[]
  }
  strictValidation: {
    ok: boolean
    dryRun?: boolean
    blockers: string[]
    blockerCodes: RenderCanaryGuardCode[]
    allowWritesAcknowledged: boolean
    allowRenderExecutionAcknowledged: boolean
    allowCloudRunAcknowledged: boolean
    allowRemotionAcknowledged: boolean
    cleanupAcknowledged: boolean
    stagingOnly: boolean
    renderInfrastructureMode: 'cloud_run_remotion'
    cloudRunServiceConfigured: boolean
    remotionPathConfigured: boolean
    dedicatedCanaryTargetConfigured: boolean
    oidcAuthConfigured: boolean
    outputBucketConfigured: boolean
    boundedLimits: RenderInfrastructureCanaryLimits
    previousSmokeRunIds: Record<string, string | undefined>
    previousSmokeLeftoverChecks: RenderInfrastructurePreviousSmokeLeftoverCheck[]
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noSmokeRecordsCreated: boolean
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i

export function evaluateRenderInfrastructureCanaryGuard(
  input: RenderInfrastructureCanaryGuardInput,
): RenderInfrastructureCanaryGuardResult {
  const sourceEnv = input.sourceEnv
  const allowRenderExecution = sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true'
  const allowCloudRun = sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true'
  const allowRemotion = sourceEnv.SUPABASE_E2E_ALLOW_REMOTION === 'true'
  const previousSmokeRunIds = input.previousSmokeRunIds ?? readPreviousSmokeRunIds(sourceEnv)
  const leftoverChecks = input.leftoverChecks ?? []
  const liveConfig = readRenderInfrastructureCanaryLiveConfig(sourceEnv)
  const limits = readCanaryLimits(sourceEnv)

  if (
    input.expectDisabled &&
    (
      input.env.supabaseE2eSmokeMode !== 'live' ||
      !input.env.supabaseE2eAllowWrites ||
      !allowRenderExecution ||
      !allowCloudRun ||
      !allowRemotion
    )
  ) {
    return createResult({
      ok: true,
      status: 'skipped',
      blockers: [],
      blockerCodes: [],
      dryRun: true,
      env: input.env,
      allowRenderExecution,
      allowCloudRun,
      allowRemotion,
      previousSmokeRunIds,
      leftoverChecks,
      limits,
      noSmokeRecordsCreated: true,
    })
  }

  const configIssues = validateRenderCanaryConfig({
    config: liveConfig,
    limits,
    sourceEnv,
    allowRenderExecution,
    allowCloudRun,
    allowRemotion,
    cleanupAcknowledged: input.env.supabaseE2eCleanup,
  })
  const blockers = [
    ...validateSafetyInputs({
      env: input.env,
      previousSmokeRunIds,
    }),
    ...configIssues.map((issue) => issue.message),
    ...validateLeftoverChecks(leftoverChecks),
  ]
  const blockerCodes = uniqueIssueCodes(configIssues)

  if (blockers.length > 0) {
    return createResult({
      ok: false,
      status: 'blocked',
      blockers,
      blockerCodes,
      errorCode: configIssues.length > 0
        ? selectRenderCanaryErrorCode(configIssues)
        : 'missing_staging_render_infrastructure_canary_path',
      errorMessage: 'A dedicated staging Cloud Run/Remotion render canary target and GitHub OIDC auth path are not fully configured.',
      env: input.env,
      allowRenderExecution,
      allowCloudRun,
      allowRemotion,
      previousSmokeRunIds,
      leftoverChecks,
      limits,
      cloudRunConfigured: Boolean(liveConfig.cloudRunUrl),
      remotionConfigured: liveConfig.mode === 'staging_cloud_run_remotion_canary',
      dedicatedTargetConfigured: Boolean(liveConfig.cloudRunUrl && liveConfig.cloudRunAudience && liveConfig.outputBucketOrPrefix),
      oidcAuthConfigured: Boolean(liveConfig.idToken && liveConfig.workloadIdentityProvider && liveConfig.serviceAccount),
      outputBucketConfigured: Boolean(liveConfig.outputBucketOrPrefix),
      noSmokeRecordsCreated: true,
    })
  }

  return createResult({
    ok: true,
    status: 'ready',
    blockers: [],
    blockerCodes: [],
    env: input.env,
    allowRenderExecution,
    allowCloudRun,
    allowRemotion,
    previousSmokeRunIds,
    leftoverChecks,
    limits,
    cloudRunConfigured: true,
    remotionConfigured: true,
    dedicatedTargetConfigured: true,
    oidcAuthConfigured: true,
    outputBucketConfigured: true,
    noSmokeRecordsCreated: true,
  })
}

export function readRenderInfrastructureCanaryLiveConfig(
  sourceEnv: Record<string, string | undefined>,
): RenderInfrastructureCanaryLiveConfig {
  return readRenderCanaryConfig(sourceEnv)
}

export function readPreviousSmokeRunIds(sourceEnv: Record<string, string | undefined>): Record<string, string | undefined> {
  return {
    write: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_WRITE_SMOKE_RUN_ID) ?? clean(sourceEnv.SUPABASE_E2E_PREVIOUS_SMOKE_RUN_ID),
    persistedRender: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_PERSISTED_RENDER_SMOKE_RUN_ID),
    sandboxRender: clean(sourceEnv.SUPABASE_E2E_PREVIOUS_SANDBOX_RENDER_SMOKE_RUN_ID),
  }
}

function validateSafetyInputs(input: {
  env: RuntimeEnv
  previousSmokeRunIds: Record<string, string | undefined>
}): string[] {
  const blockers: string[] = []
  if (input.env.supabaseE2eSmokeMode !== 'live' || !input.env.hasSupabaseAdmin) {
    blockers.push('SUPABASE_E2E_SMOKE_MODE=live with staging Supabase service-role env is required.')
  }
  if (!input.env.supabaseE2eAllowWrites) {
    blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged.')
  }
  if (!input.env.supabaseE2eUserId || !UUID_PATTERN.test(input.env.supabaseE2eUserId)) {
    blockers.push('SUPABASE_E2E_USER_ID must be an existing safe staging Supabase auth user UUID.')
  }

  for (const [label, smokeRunId] of Object.entries(input.previousSmokeRunIds)) {
    if (!smokeRunId || !SMOKE_RUN_PATTERN.test(smokeRunId)) {
      blockers.push(`${label} previous smoke run id must match rp-e2e-smoke-<uuid>.`)
    }
  }

  return blockers
}

function validateLeftoverChecks(checks: RenderInfrastructurePreviousSmokeLeftoverCheck[]): string[] {
  const blockers: string[] = []
  for (const check of checks) {
    if (check.error) {
      blockers.push(`${check.label} leftover check failed: ${check.error}`)
      continue
    }
    if (!check.result) {
      blockers.push(`${check.label} leftover check did not run.`)
      continue
    }
    if (!check.result.ok) {
      blockers.push(`${check.label} leftover check did not pass.`)
    }
    if (check.result.leftovers.length > 0) {
      blockers.push(`${check.label} leftover check found ${check.result.leftovers.length} record(s).`)
    }
    if (check.result.queryErrors.length > 0) {
      blockers.push(`${check.label} leftover check reported ${check.result.queryErrors.length} query error(s).`)
    }
  }
  return blockers
}

function readCanaryLimits(sourceEnv: Record<string, string | undefined>): RenderInfrastructureCanaryLimits {
  return readRenderCanaryLimits(sourceEnv)
}

function createResult(input: {
  ok: boolean
  status: 'skipped' | 'blocked' | 'ready'
  blockers: string[]
  blockerCodes: RenderCanaryGuardCode[]
  dryRun?: boolean
  errorCode?: string
  errorMessage?: string
  env: RuntimeEnv
  allowRenderExecution: boolean
  allowCloudRun: boolean
  allowRemotion: boolean
  previousSmokeRunIds: Record<string, string | undefined>
  leftoverChecks: RenderInfrastructurePreviousSmokeLeftoverCheck[]
  limits: RenderInfrastructureCanaryLimits
  cloudRunConfigured?: boolean
  remotionConfigured?: boolean
  dedicatedTargetConfigured?: boolean
  oidcAuthConfigured?: boolean
  outputBucketConfigured?: boolean
  noSmokeRecordsCreated: boolean
}): RenderInfrastructureCanaryGuardResult {
  return {
    ok: input.ok,
    status: input.status,
    error: input.errorCode && input.errorMessage
      ? { code: input.errorCode, message: input.errorMessage }
      : undefined,
    smokeRunId: null,
    createdRecordsSummary: {},
    renderJobId: null,
    renderId: null,
    outputStorageObjectId: null,
    outputArtifactSummary: null,
    finalRenderStatus: null,
    jobStatusTransitionsObserved: [],
    cleanup: {
      attempted: false,
      deletedCount: 0,
      errors: [],
    },
    strictValidation: {
      ok: input.ok,
      dryRun: input.dryRun,
      blockers: input.blockers,
      blockerCodes: input.blockerCodes,
      allowWritesAcknowledged: input.env.supabaseE2eAllowWrites,
      allowRenderExecutionAcknowledged: input.allowRenderExecution,
      allowCloudRunAcknowledged: input.allowCloudRun,
      allowRemotionAcknowledged: input.allowRemotion,
      cleanupAcknowledged: input.env.supabaseE2eCleanup,
      stagingOnly: input.env.supabaseE2eSmokeMode === 'live' && input.env.hasSupabaseAdmin,
      renderInfrastructureMode: 'cloud_run_remotion',
      cloudRunServiceConfigured: input.cloudRunConfigured ?? false,
      remotionPathConfigured: input.remotionConfigured ?? false,
      dedicatedCanaryTargetConfigured: input.dedicatedTargetConfigured ?? false,
      oidcAuthConfigured: input.oidcAuthConfigured ?? false,
      outputBucketConfigured: input.outputBucketConfigured ?? false,
      boundedLimits: input.limits,
      previousSmokeRunIds: input.previousSmokeRunIds,
      previousSmokeLeftoverChecks: input.leftoverChecks,
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noSmokeRecordsCreated: input.noSmokeRecordsCreated,
    },
  }
}

function uniqueIssueCodes(issues: RenderCanaryConfigValidationIssue[]): RenderCanaryGuardCode[] {
  return Array.from(new Set(issues.map((issue) => issue.code)))
}
