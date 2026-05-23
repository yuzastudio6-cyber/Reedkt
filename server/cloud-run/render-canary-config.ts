import {
  REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
  RENDER_CANARY_MODE,
  type RenderCanaryConfig,
  type RenderCanaryConfigValidationIssue,
  type RenderCanaryGuardCode,
  type RenderCanaryLimits,
} from './render-canary-types'

export interface RenderCanaryConfigValidationInput {
  config: RenderCanaryConfig
  limits: RenderCanaryLimits
  sourceEnv: Record<string, string | undefined>
  allowRenderExecution: boolean
  allowCloudRun: boolean
  allowRemotion: boolean
  cleanupAcknowledged: boolean
  expectedMode?: RenderCanaryConfig['mode']
}

const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const STRIPE_ENV_NAME_PATTERNS = [/^STRIPE/i, /^PAYMENT/i, /^BILLING/i]
const PROVIDER_ENV_NAME_PATTERNS = [
  /^OPENAI/i,
  /^WAN_/i,
  /^HAILUO/i,
  /^VEO/i,
  /^LYRIA/i,
  /^MIRELO/i,
  /^MMAUDIO/i,
  /^GOOGLE_SECRET_(OPENAI|WAN|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO)/i,
]
const BOUNDED_CANARY_MEMORY = '2Gi'
const BOUNDED_CANARY_CPU = 2
const BOUNDED_CANARY_NODE_OPTIONS = '--max-old-space-size=1536'

export function readRenderCanaryConfig(sourceEnv: Record<string, string | undefined>): RenderCanaryConfig {
  const configuredMode = clean(sourceEnv.STAGING_RENDER_CANARY_MODE)
  return {
    mode: configuredMode === REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE ? REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE : RENDER_CANARY_MODE,
    cloudRunUrl: clean(sourceEnv.STAGING_CLOUD_RUN_RENDER_CANARY_URL)
      ?? clean(sourceEnv.STAGING_RENDER_CANARY_CLOUD_RUN_URL),
    cloudRunAudience: clean(sourceEnv.STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE)
      ?? clean(sourceEnv.STAGING_RENDER_CANARY_CLOUD_RUN_AUDIENCE),
    remotionUrl: clean(sourceEnv.STAGING_REMOTION_CANARY_URL),
    remotionAudience: clean(sourceEnv.STAGING_REMOTION_CANARY_AUDIENCE),
    idToken: clean(sourceEnv.STAGING_RENDER_CANARY_ID_TOKEN),
    outputBucketOrPrefix: clean(sourceEnv.STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX)
      ?? clean(sourceEnv.STAGING_RENDER_CANARY_OUTPUT_BUCKET),
    gcpProjectId: clean(sourceEnv.GCP_PROJECT_ID) ?? clean(sourceEnv.GOOGLE_CLOUD_PROJECT_ID),
    gcpRegion: clean(sourceEnv.GCP_REGION) ?? clean(sourceEnv.GOOGLE_CLOUD_REGION),
    workloadIdentityProvider: clean(sourceEnv.GCP_WORKLOAD_IDENTITY_PROVIDER),
    serviceAccount: clean(sourceEnv.GCP_SERVICE_ACCOUNT),
    expectedHostSuffix: clean(sourceEnv.STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX) ?? '.run.app',
    durationSeconds: readNumber(sourceEnv.STAGING_RENDER_CANARY_DURATION_SECONDS, 3),
    width: readNumber(sourceEnv.STAGING_RENDER_CANARY_WIDTH, 160),
    height: readNumber(sourceEnv.STAGING_RENDER_CANARY_HEIGHT, 90),
    fps: readNumber(sourceEnv.STAGING_RENDER_CANARY_FPS, 15),
    maxRetries: readNumber(sourceEnv.STAGING_RENDER_CANARY_MAX_RETRIES, 0),
    concurrency: readNumber(sourceEnv.STAGING_RENDER_CANARY_CONCURRENCY, 1),
    timeoutSeconds: readNumber(sourceEnv.STAGING_RENDER_CANARY_TIMEOUT_SECONDS, 300),
    memory: clean(sourceEnv.STAGING_RENDER_CANARY_MEMORY) ?? '',
    cpu: readNumber(sourceEnv.STAGING_RENDER_CANARY_CPU, Number.NaN),
    nodeOptions: clean(sourceEnv.STAGING_RENDER_CANARY_NODE_OPTIONS) ?? clean(sourceEnv.NODE_OPTIONS),
  }
}

export function readRenderCanaryLimits(sourceEnv: Record<string, string | undefined>): RenderCanaryLimits {
  return {
    maxWaitSeconds: readNumber(sourceEnv.SUPABASE_E2E_MAX_WAIT_SECONDS, 180),
    durationSeconds: readNumber(sourceEnv.STAGING_RENDER_CANARY_DURATION_SECONDS, 3),
    width: readNumber(sourceEnv.STAGING_RENDER_CANARY_WIDTH, 160),
    height: readNumber(sourceEnv.STAGING_RENDER_CANARY_HEIGHT, 90),
    fps: readNumber(sourceEnv.STAGING_RENDER_CANARY_FPS, 15),
    maxRetries: readNumber(sourceEnv.STAGING_RENDER_CANARY_MAX_RETRIES, 0),
    concurrency: readNumber(sourceEnv.STAGING_RENDER_CANARY_CONCURRENCY, 1),
    timeoutSeconds: readNumber(sourceEnv.STAGING_RENDER_CANARY_TIMEOUT_SECONDS, 300),
    memory: clean(sourceEnv.STAGING_RENDER_CANARY_MEMORY) ?? '',
    cpu: readNumber(sourceEnv.STAGING_RENDER_CANARY_CPU, Number.NaN),
    nodeOptions: clean(sourceEnv.STAGING_RENDER_CANARY_NODE_OPTIONS) ?? clean(sourceEnv.NODE_OPTIONS),
  }
}

export function validateRenderCanaryConfig(input: RenderCanaryConfigValidationInput): RenderCanaryConfigValidationIssue[] {
  const issues: RenderCanaryConfigValidationIssue[] = []
  const configuredMode = clean(input.sourceEnv.STAGING_RENDER_CANARY_MODE)
  const expectedMode = input.expectedMode ?? RENDER_CANARY_MODE

  if (configuredMode && configuredMode !== expectedMode) {
    issues.push({
      code: 'missing_staging_render_infrastructure_canary_path',
      message: `STAGING_RENDER_CANARY_MODE must be ${expectedMode}.`,
    })
  }
  if (!input.allowRenderExecution) {
    issues.push({
      code: 'cloud_run_invocation_disabled',
      message: 'SUPABASE_E2E_ALLOW_RENDER_EXECUTION=true was not acknowledged.',
    })
  }
  if (!input.allowCloudRun) {
    issues.push({
      code: 'cloud_run_invocation_disabled',
      message: 'SUPABASE_E2E_ALLOW_CLOUD_RUN=true is required for this infrastructure gate.',
    })
  }
  if (!input.allowRemotion) {
    issues.push({
      code: 'remotion_invocation_disabled',
      message: 'SUPABASE_E2E_ALLOW_REMOTION=true is required for this infrastructure gate.',
    })
  }
  if (!input.cleanupAcknowledged) {
    issues.push({
      code: 'cleanup_required',
      message: 'SUPABASE_E2E_CLEANUP=true is required for this infrastructure gate.',
    })
  }

  for (const name of configuredEnvNames(input.sourceEnv, STRIPE_ENV_NAME_PATTERNS)) {
    issues.push({
      code: 'stripe_must_be_disabled',
      message: `${name} is configured; Stripe, payment, and billing env must be absent for this render infrastructure canary.`,
    })
  }
  for (const name of configuredEnvNames(input.sourceEnv, PROVIDER_ENV_NAME_PATTERNS)) {
    issues.push({
      code: 'providers_must_be_disabled',
      message: `${name} is configured; external provider generation env must be absent for this render infrastructure canary.`,
    })
  }

  issues.push(...validateLimits(input.limits))
  issues.push(...validateEndpointConfig(input.config, input.limits))

  return issues
}

export function selectRenderCanaryErrorCode(issues: RenderCanaryConfigValidationIssue[]): RenderCanaryGuardCode {
  return issues[0]?.code ?? 'missing_staging_render_infrastructure_canary_path'
}

export function isSafeStagingText(value: string): boolean {
  return /staging|canary|smoke|test/i.test(value) && !PRODUCTION_WORD_PATTERN.test(value)
}

function looksProduction(value: string): boolean {
  return PRODUCTION_WORD_PATTERN.test(value)
}

export function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function validateLimits(limits: RenderCanaryLimits): RenderCanaryConfigValidationIssue[] {
  const issues: RenderCanaryConfigValidationIssue[] = []
  if (!isBounded(limits.maxWaitSeconds, 30, 300)) {
    issues.push({ code: 'unsafe_timeout', message: 'SUPABASE_E2E_MAX_WAIT_SECONDS must stay between 30 and 300.' })
  }
  if (!isBounded(limits.durationSeconds, 1, 3)) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_DURATION_SECONDS must stay between 1 and 3.' })
  }
  if (!isBounded(limits.width, 16, 320) || !isBounded(limits.height, 16, 240)) {
    issues.push({ code: 'unsafe_timeout', message: 'Staging render canary resolution must stay at or below 320x240.' })
  }
  if (!isBounded(limits.fps, 1, 30)) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_FPS must stay between 1 and 30.' })
  }
  if (!isBounded(limits.maxRetries, 0, 1)) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_MAX_RETRIES must be 0 or 1.' })
  }
  if (limits.concurrency !== 1) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_CONCURRENCY must be exactly 1.' })
  }
  if (!isBounded(limits.timeoutSeconds, 30, 300)) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_TIMEOUT_SECONDS must stay between 30 and 300.' })
  }
  if (limits.timeoutSeconds !== 300) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_TIMEOUT_SECONDS must be exactly 300 for this bounded Remotion canary.' })
  }
  if (limits.memory !== BOUNDED_CANARY_MEMORY) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_MEMORY must be exactly 2Gi for this bounded Remotion canary.' })
  }
  if (limits.cpu !== BOUNDED_CANARY_CPU) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_CPU must be exactly 2 for this bounded Remotion canary.' })
  }
  if (limits.nodeOptions !== BOUNDED_CANARY_NODE_OPTIONS) {
    issues.push({ code: 'unsafe_timeout', message: 'STAGING_RENDER_CANARY_NODE_OPTIONS or NODE_OPTIONS must be exactly --max-old-space-size=1536.' })
  }
  if (Number.isFinite(limits.durationSeconds) && Number.isFinite(limits.fps) && limits.durationSeconds * limits.fps > 90) {
    issues.push({ code: 'unsafe_timeout', message: 'Render infrastructure canary frame count must stay at or below 90 frames.' })
  }
  return issues
}

function validateEndpointConfig(config: RenderCanaryConfig, limits: RenderCanaryLimits): RenderCanaryConfigValidationIssue[] {
  const issues: RenderCanaryConfigValidationIssue[] = []

  if (!config.cloudRunUrl) {
    issues.push({
      code: 'missing_staging_render_infrastructure_canary_path',
      message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL is required and must point to a dedicated staging canary endpoint.',
    })
  } else {
    issues.push(...validateCloudRunUrl(config.cloudRunUrl, config.expectedHostSuffix))
  }

  if (!config.cloudRunAudience) {
    issues.push({
      code: 'missing_cloud_run_audience',
      message: 'STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE is required for GitHub OIDC ID-token invocation.',
    })
  } else {
    issues.push(...validateAudience(config.cloudRunAudience, config.cloudRunUrl))
  }

  if (!config.idToken || !config.workloadIdentityProvider || !config.serviceAccount) {
    issues.push({
      code: 'missing_gcp_oidc_auth',
      message: 'GCP_WORKLOAD_IDENTITY_PROVIDER, GCP_SERVICE_ACCOUNT, and STAGING_RENDER_CANARY_ID_TOKEN are required for GitHub OIDC invocation.',
    })
  } else if (looksProduction(config.serviceAccount)) {
    issues.push({
      code: 'missing_gcp_oidc_auth',
      message: 'GCP_SERVICE_ACCOUNT must not look production/live.',
    })
  }

  if (!config.gcpProjectId) {
    issues.push({ code: 'missing_gcp_oidc_auth', message: 'GCP_PROJECT_ID is required for the staging canary target.' })
  } else if (looksProduction(config.gcpProjectId)) {
    issues.push({ code: 'production_like_cloud_run_url', message: 'GCP_PROJECT_ID must not look production/live.' })
  }
  if (!config.gcpRegion) {
    issues.push({ code: 'missing_gcp_oidc_auth', message: 'GCP_REGION is required for the staging canary target.' })
  }

  if (!config.outputBucketOrPrefix) {
    issues.push({
      code: 'missing_staging_render_infrastructure_canary_path',
      message: 'STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX is required for a traceable tiny staging artifact.',
    })
  } else if (!isSafeStagingText(config.outputBucketOrPrefix)) {
    issues.push({
      code: 'production_like_cloud_run_url',
      message: 'STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX must be staging smoke/canary-scoped and not production-looking.',
    })
  }

  if (!isBounded(limits.timeoutSeconds, 30, 300)) {
    issues.push({
      code: 'unsafe_timeout',
      message: 'Cloud Run request timeout must stay between 30 and 300 seconds.',
    })
  }

  return issues
}

function validateCloudRunUrl(value: string, expectedHostSuffix: string): RenderCanaryConfigValidationIssue[] {
  const issues: RenderCanaryConfigValidationIssue[] = []
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return [{ code: 'invalid_cloud_run_url', message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL must be a valid HTTPS URL.' }]
  }

  const safeUrlText = `${url.hostname}${url.pathname}`
  if (url.protocol !== 'https:') {
    issues.push({ code: 'invalid_cloud_run_url', message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL must use HTTPS.' })
  }
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    issues.push({ code: 'invalid_cloud_run_url', message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL must not target localhost in live mode.' })
  }
  if (!url.hostname.endsWith(expectedHostSuffix)) {
    issues.push({ code: 'invalid_cloud_run_url', message: `STAGING_CLOUD_RUN_RENDER_CANARY_URL must target ${expectedHostSuffix}.` })
  }
  if (!/staging/i.test(safeUrlText) || !/canary|smoke/i.test(safeUrlText)) {
    issues.push({
      code: 'invalid_cloud_run_url',
      message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL must be explicitly staging and smoke/canary scoped.',
    })
  }
  if (PRODUCTION_WORD_PATTERN.test(safeUrlText)) {
    issues.push({
      code: 'production_like_cloud_run_url',
      message: 'STAGING_CLOUD_RUN_RENDER_CANARY_URL must not look like a production/live endpoint.',
    })
  }
  return issues
}

function validateAudience(audience: string, cloudRunUrl: string | undefined): RenderCanaryConfigValidationIssue[] {
  const issues: RenderCanaryConfigValidationIssue[] = []
  let audienceUrl: URL
  try {
    audienceUrl = new URL(audience)
  } catch {
    return [{ code: 'missing_cloud_run_audience', message: 'STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE must be a valid HTTPS URL.' }]
  }
  if (audienceUrl.protocol !== 'https:') {
    issues.push({ code: 'missing_cloud_run_audience', message: 'STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE must use HTTPS.' })
  }
  if (!isSafeStagingText(`${audienceUrl.hostname}${audienceUrl.pathname}`)) {
    issues.push({
      code: 'production_like_cloud_run_url',
      message: 'STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE must be staging smoke/canary-scoped and not production-looking.',
    })
  }
  if (cloudRunUrl) {
    try {
      const targetUrl = new URL(cloudRunUrl)
      if (audienceUrl.hostname !== targetUrl.hostname) {
        issues.push({
          code: 'missing_cloud_run_audience',
          message: 'STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE host must match the Cloud Run canary service host.',
        })
      }
    } catch {
      // The URL validator reports malformed target URLs.
    }
  }
  return issues
}

function configuredEnvNames(sourceEnv: Record<string, string | undefined>, patterns: RegExp[]): string[] {
  return Object.entries(sourceEnv)
    .filter(([, value]) => Boolean(clean(value)))
    .map(([name]) => name)
    .filter((name) => patterns.some((pattern) => pattern.test(name)))
    .sort()
}

function readNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback
  return Number(value)
}

function isBounded(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}
