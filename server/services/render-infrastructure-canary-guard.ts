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

export interface RenderInfrastructureCanaryGuardResult {
  ok: boolean
  status: 'skipped' | 'blocked'
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
    boundedLimits: RenderInfrastructureCanaryLimits
    previousSmokeRunIds: Record<string, string | undefined>
    previousSmokeLeftoverChecks: RenderInfrastructurePreviousSmokeLeftoverCheck[]
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noSmokeRecordsCreated: true
  }
}

interface RenderInfrastructureCanaryLimits {
  maxWaitSeconds: number
  durationSeconds: number
  width: number
  height: number
  fps: number
  maxRetries: number
  concurrency: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const RISKY_ENV_NAME_PATTERNS = [
  /^STRIPE/i,
  /^OPENAI/i,
  /^WAN_/i,
  /^HAILUO/i,
  /^VEO/i,
  /^LYRIA/i,
  /^MIRELO/i,
  /^MMAUDIO/i,
  /^GOOGLE_SECRET_(OPENAI|WAN|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO)/i,
]

export function evaluateRenderInfrastructureCanaryGuard(
  input: RenderInfrastructureCanaryGuardInput,
): RenderInfrastructureCanaryGuardResult {
  const sourceEnv = input.sourceEnv
  const allowRenderExecution = sourceEnv.SUPABASE_E2E_ALLOW_RENDER_EXECUTION === 'true'
  const allowCloudRun = sourceEnv.SUPABASE_E2E_ALLOW_CLOUD_RUN === 'true'
  const allowRemotion = sourceEnv.SUPABASE_E2E_ALLOW_REMOTION === 'true'
  const previousSmokeRunIds = input.previousSmokeRunIds ?? readPreviousSmokeRunIds(sourceEnv)
  const leftoverChecks = input.leftoverChecks ?? []
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
      dryRun: true,
      env: input.env,
      allowRenderExecution,
      allowCloudRun,
      allowRemotion,
      previousSmokeRunIds,
      leftoverChecks,
      limits,
    })
  }

  const canaryConfig = readCanaryConfig(sourceEnv)
  const blockers = [
    ...validateSafetyInputs({
      env: input.env,
      allowRenderExecution,
      allowCloudRun,
      allowRemotion,
      previousSmokeRunIds,
      sourceEnv,
      limits,
    }),
    ...validateCanaryConfig(canaryConfig, limits),
    ...validateLeftoverChecks(leftoverChecks),
    'missing_staging_render_infrastructure_canary_path: this repository still has only mock Remotion and placeholder Cloud Run transport, so no real Cloud Run/Remotion canary was invoked.',
  ]

  return createResult({
    ok: false,
    status: 'blocked',
    blockers,
    errorCode: 'missing_staging_render_infrastructure_canary_path',
    errorMessage: 'A dedicated staging Cloud Run/Remotion render canary target and auth path are not implemented in this repository yet.',
    env: input.env,
    allowRenderExecution,
    allowCloudRun,
    allowRemotion,
    previousSmokeRunIds,
    leftoverChecks,
    limits,
    cloudRunConfigured: Boolean(canaryConfig.cloudRunUrl),
    remotionConfigured: Boolean(canaryConfig.remotionCompositionId && canaryConfig.remotionEntrypoint),
    dedicatedTargetConfigured: canaryConfig.dedicatedTargetConfigured,
  })
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
  allowRenderExecution: boolean
  allowCloudRun: boolean
  allowRemotion: boolean
  previousSmokeRunIds: Record<string, string | undefined>
  sourceEnv: Record<string, string | undefined>
  limits: RenderInfrastructureCanaryLimits
}): string[] {
  const blockers: string[] = []
  if (input.env.supabaseE2eSmokeMode !== 'live' || !input.env.hasSupabaseAdmin) {
    blockers.push('SUPABASE_E2E_SMOKE_MODE=live with staging Supabase service-role env is required.')
  }
  if (!input.env.supabaseE2eAllowWrites) {
    blockers.push('SUPABASE_E2E_ALLOW_WRITES=true was not acknowledged.')
  }
  if (!input.allowRenderExecution) {
    blockers.push('SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true was not acknowledged.')
  }
  if (!input.allowCloudRun) {
    blockers.push('SUPABASE_E2E_ALLOW_CLOUD_RUN=true is required for this infrastructure gate.')
  }
  if (!input.allowRemotion) {
    blockers.push('SUPABASE_E2E_ALLOW_REMOTION=true is required for this infrastructure gate.')
  }
  if (!input.env.supabaseE2eCleanup) {
    blockers.push('SUPABASE_E2E_CLEANUP=true is required for this infrastructure gate.')
  }
  if (!input.env.supabaseE2eUserId || !UUID_PATTERN.test(input.env.supabaseE2eUserId)) {
    blockers.push('SUPABASE_E2E_USER_ID must be an existing safe staging Supabase auth user UUID.')
  }

  for (const [label, smokeRunId] of Object.entries(input.previousSmokeRunIds)) {
    if (!smokeRunId || !SMOKE_RUN_PATTERN.test(smokeRunId)) {
      blockers.push(`${label} previous smoke run id must match rp-e2e-smoke-<uuid>.`)
    }
  }

  for (const name of configuredRiskyEnvNames(input.sourceEnv)) {
    blockers.push(`${name} is configured; provider, Stripe, and payment env must be absent for this render infrastructure canary.`)
  }

  if (!isBounded(input.limits.maxWaitSeconds, 30, 300)) {
    blockers.push('SUPABASE_E2E_MAX_WAIT_SECONDS must stay between 30 and 300.')
  }
  if (!isBounded(input.limits.durationSeconds, 1, 3)) {
    blockers.push('STAGING_RENDER_CANARY_DURATION_SECONDS must stay between 1 and 3.')
  }
  if (!isBounded(input.limits.width, 16, 320) || !isBounded(input.limits.height, 16, 240)) {
    blockers.push('Staging render canary resolution must stay at or below 320x240.')
  }
  if (!isBounded(input.limits.fps, 1, 30)) {
    blockers.push('STAGING_RENDER_CANARY_FPS must stay between 1 and 30.')
  }
  if (!isBounded(input.limits.maxRetries, 0, 1)) {
    blockers.push('STAGING_RENDER_CANARY_MAX_RETRIES must be 0 or 1.')
  }
  if (input.limits.concurrency !== 1) {
    blockers.push('STAGING_RENDER_CANARY_CONCURRENCY must be exactly 1.')
  }

  return blockers
}

function validateCanaryConfig(
  config: ReturnType<typeof readCanaryConfig>,
  limits: RenderInfrastructureCanaryLimits,
): string[] {
  const blockers: string[] = []
  if (!config.cloudRunUrl) {
    blockers.push('STAGING_RENDER_CANARY_CLOUD_RUN_URL is required and must point to a dedicated staging canary endpoint.')
  } else {
    blockers.push(...validateCloudRunUrl(config.cloudRunUrl))
  }
  if (!config.authMode) {
    blockers.push('STAGING_RENDER_CANARY_AUTH_MODE is required for the dedicated staging Cloud Run canary path.')
  } else if (!['github_oidc', 'canary_shared_secret'].includes(config.authMode)) {
    blockers.push('STAGING_RENDER_CANARY_AUTH_MODE must be github_oidc or canary_shared_secret.')
  }
  if (!config.remotionCompositionId) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_COMPOSITION_ID is required for the tiny Remotion canary.')
  } else if (!/canary|smoke/i.test(config.remotionCompositionId) || PRODUCTION_WORD_PATTERN.test(config.remotionCompositionId)) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_COMPOSITION_ID must be smoke/canary-scoped and not production-looking.')
  }
  if (!config.remotionEntrypoint) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT is required for the tiny Remotion canary.')
  } else if (!/canary|smoke/i.test(config.remotionEntrypoint) || PRODUCTION_WORD_PATTERN.test(config.remotionEntrypoint)) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT must be smoke/canary-scoped and not production-looking.')
  }
  if (!config.outputBucket) {
    blockers.push('STAGING_RENDER_CANARY_OUTPUT_BUCKET is required for a traceable tiny staging artifact.')
  } else if (!/staging/i.test(config.outputBucket) || !/canary|smoke/i.test(config.outputBucket) || PRODUCTION_WORD_PATTERN.test(config.outputBucket)) {
    blockers.push('STAGING_RENDER_CANARY_OUTPUT_BUCKET must be staging smoke/canary-scoped and not production-looking.')
  }
  if (limits.durationSeconds * limits.fps > 90) {
    blockers.push('Render infrastructure canary frame count must stay at or below 90 frames.')
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

function readCanaryConfig(sourceEnv: Record<string, string | undefined>) {
  const cloudRunUrl = clean(sourceEnv.STAGING_RENDER_CANARY_CLOUD_RUN_URL)
  const remotionCompositionId = clean(sourceEnv.STAGING_RENDER_CANARY_REMOTION_COMPOSITION_ID)
  const remotionEntrypoint = clean(sourceEnv.STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT)
  return {
    cloudRunUrl,
    authMode: clean(sourceEnv.STAGING_RENDER_CANARY_AUTH_MODE),
    remotionCompositionId,
    remotionEntrypoint,
    outputBucket: clean(sourceEnv.STAGING_RENDER_CANARY_OUTPUT_BUCKET),
    dedicatedTargetConfigured: Boolean(cloudRunUrl && remotionCompositionId && remotionEntrypoint),
  }
}

function validateCloudRunUrl(value: string): string[] {
  const blockers: string[] = []
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return ['STAGING_RENDER_CANARY_CLOUD_RUN_URL must be a valid HTTPS URL.']
  }

  const safeUrlText = `${url.hostname}${url.pathname}`
  if (url.protocol !== 'https:') {
    blockers.push('STAGING_RENDER_CANARY_CLOUD_RUN_URL must use HTTPS.')
  }
  if (!url.hostname.endsWith('.run.app')) {
    blockers.push('STAGING_RENDER_CANARY_CLOUD_RUN_URL must target a Cloud Run run.app host.')
  }
  if (!/staging/i.test(safeUrlText) || !/canary|smoke/i.test(safeUrlText)) {
    blockers.push('STAGING_RENDER_CANARY_CLOUD_RUN_URL must be explicitly staging and smoke/canary scoped.')
  }
  if (PRODUCTION_WORD_PATTERN.test(safeUrlText)) {
    blockers.push('STAGING_RENDER_CANARY_CLOUD_RUN_URL must not look like a production/live endpoint.')
  }
  return blockers
}

function readCanaryLimits(sourceEnv: Record<string, string | undefined>): RenderInfrastructureCanaryLimits {
  return {
    maxWaitSeconds: readNumber(sourceEnv.SUPABASE_E2E_MAX_WAIT_SECONDS, 180),
    durationSeconds: readNumber(sourceEnv.STAGING_RENDER_CANARY_DURATION_SECONDS, 3),
    width: readNumber(sourceEnv.STAGING_RENDER_CANARY_WIDTH, 160),
    height: readNumber(sourceEnv.STAGING_RENDER_CANARY_HEIGHT, 90),
    fps: readNumber(sourceEnv.STAGING_RENDER_CANARY_FPS, 15),
    maxRetries: readNumber(sourceEnv.STAGING_RENDER_CANARY_MAX_RETRIES, 0),
    concurrency: readNumber(sourceEnv.STAGING_RENDER_CANARY_CONCURRENCY, 1),
  }
}

function configuredRiskyEnvNames(sourceEnv: Record<string, string | undefined>): string[] {
  return Object.entries(sourceEnv)
    .filter(([, value]) => Boolean(clean(value)))
    .map(([name]) => name)
    .filter((name) => RISKY_ENV_NAME_PATTERNS.some((pattern) => pattern.test(name)))
    .sort()
}

function createResult(input: {
  ok: boolean
  status: 'skipped' | 'blocked'
  blockers: string[]
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
      boundedLimits: input.limits,
      previousSmokeRunIds: input.previousSmokeRunIds,
      previousSmokeLeftoverChecks: input.leftoverChecks,
      noProductionFlowsRan: true,
      noStripePaymentFlowsRan: true,
      noExternalProviderGenerationCallsRan: true,
      noBroadE2eSuiteRan: true,
      noSmokeRecordsCreated: true,
    },
  }
}

function readNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback
  return Number(value)
}

function isBounded(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
