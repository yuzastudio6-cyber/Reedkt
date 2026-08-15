import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({
  quiet: true,
  path: process.env.REEDITPRO_DISABLE_DOTENV === 'true' ? [] : undefined,
})

export type E2ERuntimeMode = 'local' | 'mock' | 'cloud_run' | 'disabled'
export type StorageMode = 'local' | 'gcs_disabled' | 'gcs'
export type LargeMediaFinalizationMode = 'disabled' | 'private_local' | 'distributed'
export type WorkerRuntimeMode = 'local' | 'mock' | 'cloud_run' | 'disabled'
export type BrowserApiTransportMode = 'direct' | 'google_api_gateway'
export type KimiRuntimeMode = 'disabled' | 'internal_test' | 'cloud_run'
export type OpenAiRuntimeMode = 'disabled' | 'internal_test' | 'cloud_run'
export type VisualIntelligenceRuntimeMode = 'disabled' | 'cloud_run'

export interface RuntimeEnv {
  nodeEnv: string
  mode: E2ERuntimeMode
  apiPort: number
  jsonBodyLimit: string
  allowedCorsOrigins: string[]
  browserApiTransport: BrowserApiTransportMode
  internalServiceToken?: string
  allowMockWithoutSupabase: boolean
  allowInternalTestExecutionWithSupabase: boolean
  storageMode: StorageMode
  largeMediaFinalizationMode: LargeMediaFinalizationMode
  localStorageRoot: string
  signedUrlTtlSeconds: number
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceRoleKey?: string
  googleCloudProjectId?: string
  googleCloudRegion?: string
  googleCloudBillingAccountResourceName?: string
  professionalGpuTaskTargetOrigin?: string
  gcsDefaultRegion: string
  gcsSourceMediaBucket?: string
  gcsGeneratedAssetsBucket?: string
  gcsProcessedMediaBucket?: string
  gcsPreviewsBucket?: string
  gcsExportsBucket?: string
  gcsThumbnailsBucket?: string
  gcsQaArtifactsBucket?: string
  gcsWorkerTempBucket?: string
  gcsControlPlaneStateBucket?: string
  workerRuntimeMode: WorkerRuntimeMode
  workerInstanceId: string
  workerHeartbeatIntervalSeconds: number
  workerClaimLeaseSeconds: number
  strictToolReadiness: boolean
  toolCheckTimeoutMs: number
  ffmpegBin: string
  ffprobeBin: string
  remotionBin: string
  pythonBin: string
  toolAdapterPythonBin: string
  toolAdapterPythonBinConfigured: boolean
  playwrightBin: string
  kimiRuntimeMode: KimiRuntimeMode
  openAiRuntimeMode: OpenAiRuntimeMode
  visualIntelligenceRuntimeMode: VisualIntelligenceRuntimeMode
  visualIntelligenceReleaseObjectName?: string
  visualIntelligenceReleaseGeneration?: string
  visualIntelligenceReleaseEtag?: string
  visualIntelligenceReleaseContentSha256?: string
  visualIntelligenceRateObjectName?: string
  visualIntelligenceRateGeneration?: string
  visualIntelligenceRateEtag?: string
  visualIntelligenceRateContentSha256?: string
  providerSecretReferenceNames: Record<string, string | undefined>
  hasSupabaseAdmin: boolean
  hasSupabasePublic: boolean
  mockOnly: boolean
  warnings: string[]
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().max(65535).optional(),
  API_JSON_BODY_LIMIT: z.string().default('8mb'),
  API_ALLOWED_CORS_ORIGINS: z.string().optional(),
  REEDITPRO_BROWSER_API_TRANSPORT: z.enum(['direct', 'google_api_gateway']).default('direct'),
  REEDITPRO_INTERNAL_SERVICE_TOKEN: z.string().optional(),
  PORT: z.coerce.number().int().positive().max(65535).optional(),
  E2E_RUNTIME_MODE: z.enum(['local', 'mock', 'cloud_run', 'disabled']).default('local'),
  API_ALLOW_MOCK_WITHOUT_SUPABASE: z.string().optional(),
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: z.string().optional(),
  STORAGE_MODE: z.enum(['local', 'gcs_disabled', 'gcs']).default('local'),
  REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE: z.enum(['disabled', 'private_local', 'distributed'])
    .default('private_local'),
  LOCAL_STORAGE_ROOT: z.string().default('.reeditpro-local-storage'),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().max(86400).default(900),
  SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_CLOUD_REGION: z.string().optional(),
  WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME: z.string().optional(),
  WEEDITPRO_PROFESSIONAL_GPU_TASK_TARGET_ORIGIN: z.string().optional(),
  GCS_DEFAULT_REGION: z.string().default('us-east1'),
  GCS_SOURCE_MEDIA_BUCKET: z.string().optional(),
  GCS_GENERATED_ASSETS_BUCKET: z.string().optional(),
  GCS_PROCESSED_MEDIA_BUCKET: z.string().optional(),
  GCS_PREVIEWS_BUCKET: z.string().optional(),
  GCS_EXPORTS_BUCKET: z.string().optional(),
  GCS_THUMBNAILS_BUCKET: z.string().optional(),
  GCS_QA_ARTIFACTS_BUCKET: z.string().optional(),
  GCS_WORKER_TEMP_BUCKET: z.string().optional(),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.string().optional(),
  WORKER_RUNTIME_MODE: z.enum(['local', 'mock', 'cloud_run', 'disabled']).default('local'),
  WORKER_INSTANCE_ID: z.string().default('local-worker-1'),
  WORKER_HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().max(3600).default(30),
  WORKER_CLAIM_LEASE_SECONDS: z.coerce.number().int().positive().max(86400).default(300),
  STRICT_TOOL_READINESS: z.string().optional(),
  TOOL_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(10000),
  FFMPEG_BIN: z.string().default('ffmpeg'),
  FFPROBE_BIN: z.string().default('ffprobe'),
  REMOTION_BIN: z.string().default('npx remotion'),
  PYTHON_BIN: z.string().default('python'),
  TOOL_ADAPTER_PYTHON_BIN: z.string().optional(),
  PLAYWRIGHT_BIN: z.string().default('npx playwright'),
  REEDITPRO_KIMI_RUNTIME_MODE: z.enum([
    'disabled',
    'internal_test',
    'cloud_run',
  ]).default('disabled'),
  REEDITPRO_OPENAI_RUNTIME_MODE: z.enum([
    'disabled',
    'internal_test',
    'cloud_run',
  ]).default('disabled'),
  REEDITPRO_VISUAL_INTELLIGENCE_RUNTIME_MODE: z.enum([
    'disabled',
    'cloud_run',
  ]).default('disabled'),
  REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_OBJECT: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_GENERATION: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_ETAG: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_SHA256: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RATE_OBJECT: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RATE_GENERATION: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RATE_ETAG: z.string().optional(),
  REEDITPRO_VISUAL_INTELLIGENCE_RATE_SHA256: z.string().optional(),
  GOOGLE_SECRET_OPENAI_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_GEMINI_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_KIMI_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_WAN_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_HAILUO_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME: z.string().optional(),
  GOOGLE_SECRET_LYRIA_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_MIRELO_API_KEY_NAME: z.string().optional(),
  GOOGLE_SECRET_MMAUDIO_API_KEY_NAME: z.string().optional(),
})

export function loadRuntimeEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = envSchema.parse(source)
  const supabaseUrl = clean(parsed.SUPABASE_URL) ?? clean(parsed.VITE_SUPABASE_URL)
  const supabaseAnonKey = clean(parsed.SUPABASE_ANON_KEY) ?? clean(parsed.VITE_SUPABASE_ANON_KEY)
  const supabaseServiceRoleKey = clean(parsed.SUPABASE_SERVICE_ROLE_KEY)
  const allowMockWithoutSupabase = parseBoolean(parsed.API_ALLOW_MOCK_WITHOUT_SUPABASE)
  const allowedCorsOrigins = parseCorsOrigins(parsed.API_ALLOWED_CORS_ORIGINS)
  const internalServiceToken = clean(parsed.REEDITPRO_INTERNAL_SERVICE_TOKEN)
  const allowInternalTestExecutionWithSupabase = parseBoolean(parsed.API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE)
  const hasSupabaseAdmin = Boolean(supabaseUrl && supabaseServiceRoleKey)
  const hasSupabasePublic = Boolean(supabaseUrl && supabaseAnonKey)
  const toolAdapterPythonBin = clean(parsed.TOOL_ADAPTER_PYTHON_BIN) ?? parsed.PYTHON_BIN
  const mockOnly = parsed.E2E_RUNTIME_MODE === 'mock' || parsed.E2E_RUNTIME_MODE === 'disabled' || !hasSupabaseAdmin
  const warnings: string[] = []

  if (!hasSupabaseAdmin) {
    warnings.push('Supabase service-role runtime is unavailable; privileged writes are disabled.')
  }

  if (!hasSupabaseAdmin && !allowMockWithoutSupabase) {
    warnings.push('API_ALLOW_MOCK_WITHOUT_SUPABASE is false; server startup should fail unless Supabase admin env is configured.')
  }

  if (parsed.NODE_ENV === 'production' && allowedCorsOrigins.length === 0) {
    warnings.push('API_ALLOWED_CORS_ORIGINS is empty; browser cross-origin API access will be denied in production.')
  }

  if (parsed.NODE_ENV === 'production' && !internalServiceToken) {
    warnings.push('REEDITPRO_INTERNAL_SERVICE_TOKEN is missing; internal worker/provider routes cannot start securely.')
  }

  if (parsed.REEDITPRO_BROWSER_API_TRANSPORT === 'google_api_gateway') {
    warnings.push(
      'Google API Gateway browser transport is selected; the gateway JWT policy, exclusive service-level Cloud Run invoker binding, and deployed route evidence must pass before browser traffic is enabled.',
    )
  }

  if (hasSupabaseAdmin && parsed.E2E_RUNTIME_MODE === 'mock') {
    warnings.push('Supabase admin env is present, but E2E_RUNTIME_MODE=mock keeps runtime in mock-only mode.')
  }

  if (allowInternalTestExecutionWithSupabase) {
    warnings.push(
      'API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE is enabled; approved source-upload and edit-execution routes may use local/in-memory internal-test persistence while Supabase auth is configured.',
    )
  }

  if (parsed.STORAGE_MODE === 'gcs' && !hasRequiredGcsBuckets(parsed)) {
    warnings.push('STORAGE_MODE=gcs is configured without all required GCS bucket names; storage adapter should fail closed.')
  }

  if (
    parsed.REEDITPRO_VISUAL_INTELLIGENCE_RUNTIME_MODE !== 'disabled'
    && !hasVisualIntelligenceCoordinates(parsed)
  ) warnings.push(
    'Visual Intelligence runtime is selected without every immutable release and account-effective pricing coordinate; startup will fail closed.',
  )

  return {
    nodeEnv: parsed.NODE_ENV,
    mode: parsed.E2E_RUNTIME_MODE,
    apiPort: parsed.API_PORT ?? parsed.PORT ?? 8787,
    jsonBodyLimit: clean(parsed.API_JSON_BODY_LIMIT) ?? '8mb',
    allowedCorsOrigins,
    browserApiTransport: parsed.REEDITPRO_BROWSER_API_TRANSPORT,
    internalServiceToken,
    allowMockWithoutSupabase,
    allowInternalTestExecutionWithSupabase,
    storageMode: parsed.STORAGE_MODE,
    largeMediaFinalizationMode: parsed.REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE,
    localStorageRoot: parsed.LOCAL_STORAGE_ROOT,
    signedUrlTtlSeconds: parsed.SIGNED_URL_TTL_SECONDS,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    googleCloudProjectId: clean(parsed.GOOGLE_CLOUD_PROJECT_ID),
    googleCloudRegion: clean(parsed.GOOGLE_CLOUD_REGION),
    googleCloudBillingAccountResourceName:
      clean(parsed.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME),
    professionalGpuTaskTargetOrigin:
      clean(parsed.WEEDITPRO_PROFESSIONAL_GPU_TASK_TARGET_ORIGIN),
    gcsDefaultRegion: clean(parsed.GCS_DEFAULT_REGION) ?? 'us-east1',
    gcsSourceMediaBucket: clean(parsed.GCS_SOURCE_MEDIA_BUCKET),
    gcsGeneratedAssetsBucket: clean(parsed.GCS_GENERATED_ASSETS_BUCKET),
    gcsProcessedMediaBucket: clean(parsed.GCS_PROCESSED_MEDIA_BUCKET),
    gcsPreviewsBucket: clean(parsed.GCS_PREVIEWS_BUCKET),
    gcsExportsBucket: clean(parsed.GCS_EXPORTS_BUCKET),
    gcsThumbnailsBucket: clean(parsed.GCS_THUMBNAILS_BUCKET),
    gcsQaArtifactsBucket: clean(parsed.GCS_QA_ARTIFACTS_BUCKET),
    gcsWorkerTempBucket: clean(parsed.GCS_WORKER_TEMP_BUCKET),
    gcsControlPlaneStateBucket:
      clean(parsed.GCS_CONTROL_PLANE_STATE_BUCKET),
    workerRuntimeMode: parsed.WORKER_RUNTIME_MODE,
    workerInstanceId: parsed.WORKER_INSTANCE_ID,
    workerHeartbeatIntervalSeconds: parsed.WORKER_HEARTBEAT_INTERVAL_SECONDS,
    workerClaimLeaseSeconds: parsed.WORKER_CLAIM_LEASE_SECONDS,
    strictToolReadiness: parseBoolean(parsed.STRICT_TOOL_READINESS),
    toolCheckTimeoutMs: parsed.TOOL_CHECK_TIMEOUT_MS,
    ffmpegBin: parsed.FFMPEG_BIN,
    ffprobeBin: parsed.FFPROBE_BIN,
    remotionBin: parsed.REMOTION_BIN,
    pythonBin: parsed.PYTHON_BIN,
    toolAdapterPythonBin,
    toolAdapterPythonBinConfigured: Boolean(clean(parsed.TOOL_ADAPTER_PYTHON_BIN)),
    playwrightBin: parsed.PLAYWRIGHT_BIN,
    kimiRuntimeMode: parsed.REEDITPRO_KIMI_RUNTIME_MODE,
    openAiRuntimeMode: parsed.REEDITPRO_OPENAI_RUNTIME_MODE,
    visualIntelligenceRuntimeMode:
      parsed.REEDITPRO_VISUAL_INTELLIGENCE_RUNTIME_MODE,
    visualIntelligenceReleaseObjectName:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_OBJECT),
    visualIntelligenceReleaseGeneration:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_GENERATION),
    visualIntelligenceReleaseEtag:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_ETAG),
    visualIntelligenceReleaseContentSha256:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_SHA256),
    visualIntelligenceRateObjectName:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_OBJECT),
    visualIntelligenceRateGeneration:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_GENERATION),
    visualIntelligenceRateEtag:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_ETAG),
    visualIntelligenceRateContentSha256:
      clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_SHA256),
    providerSecretReferenceNames: {
      openai: clean(parsed.GOOGLE_SECRET_OPENAI_API_KEY_NAME),
      gemini: clean(parsed.GOOGLE_SECRET_GEMINI_API_KEY_NAME),
      kimi: clean(parsed.GOOGLE_SECRET_KIMI_API_KEY_NAME),
      wan: clean(parsed.GOOGLE_SECRET_WAN_API_KEY_NAME),
      hailuo: clean(parsed.GOOGLE_SECRET_HAILUO_API_KEY_NAME),
      veo: clean(parsed.GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME),
      lyria: clean(parsed.GOOGLE_SECRET_LYRIA_API_KEY_NAME),
      mirelo: clean(parsed.GOOGLE_SECRET_MIRELO_API_KEY_NAME),
      mmaudio: clean(parsed.GOOGLE_SECRET_MMAUDIO_API_KEY_NAME),
    },
    hasSupabaseAdmin,
    hasSupabasePublic,
    mockOnly,
    warnings,
  }
}

export function assertRuntimeCanStart(env: RuntimeEnv): void {
  if (env.allowMockWithoutSupabase && (env.nodeEnv === 'production' || !['local', 'mock'].includes(env.mode))) {
    throw new Error('API_ALLOW_MOCK_WITHOUT_SUPABASE is restricted to non-production local/mock runtimes.')
  }

  if (env.nodeEnv === 'production' && env.allowInternalTestExecutionWithSupabase) {
    throw new Error('API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE is forbidden in production.')
  }

  if (env.nodeEnv === 'production' && (env.mode === 'local' || env.mode === 'mock')) {
    throw new Error('Production E2E_RUNTIME_MODE must not use local or mock execution.')
  }

  if (env.nodeEnv === 'production' && (env.workerRuntimeMode === 'local' || env.workerRuntimeMode === 'mock')) {
    throw new Error('Production WORKER_RUNTIME_MODE must not use local or mock execution.')
  }

  if (env.nodeEnv === 'production' && env.storageMode === 'local') {
    throw new Error('Production STORAGE_MODE must not use local storage.')
  }

  if (env.nodeEnv === 'production' && env.largeMediaFinalizationMode === 'private_local') {
    throw new Error('Production large-media finalization must not use the private single-host authority.')
  }

  if (env.largeMediaFinalizationMode === 'distributed') {
    throw new Error(
      'Distributed large-media finalization is not available in this source build; keep the mode disabled until its execution evidence is integrated.',
    )
  }

  if (env.storageMode === 'gcs') {
    assertGcsRuntimeConfigured(env)
  }

  if (!env.hasSupabaseAdmin && !env.allowMockWithoutSupabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Set API_ALLOW_MOCK_WITHOUT_SUPABASE=true for explicit local mock mode.')
  }

  if (env.nodeEnv === 'production' && !env.hasSupabasePublic) {
    throw new Error('SUPABASE_ANON_KEY is required for production bearer-token verification.')
  }

  if (env.nodeEnv === 'production' && env.allowedCorsOrigins.length === 0) {
    throw new Error('API_ALLOWED_CORS_ORIGINS must contain at least one exact browser origin in production.')
  }

  if (env.nodeEnv === 'production' && !env.internalServiceToken) {
    throw new Error('REEDITPRO_INTERNAL_SERVICE_TOKEN is required for production internal control-plane routes.')
  }

  if (env.browserApiTransport === 'google_api_gateway') {
    if (env.mode !== 'cloud_run') {
      throw new Error('REEDITPRO_BROWSER_API_TRANSPORT=google_api_gateway requires E2E_RUNTIME_MODE=cloud_run.')
    }
    if (!env.hasSupabasePublic || !isSecureSupabaseOrigin(env.supabaseUrl)) {
      throw new Error('Google API Gateway browser transport requires an exact HTTPS Supabase origin and anon key for user-token revalidation.')
    }
    if (env.allowedCorsOrigins.length === 0) {
      throw new Error('Google API Gateway browser transport requires at least one exact API_ALLOWED_CORS_ORIGINS entry.')
    }
  }

  if (env.kimiRuntimeMode !== 'disabled') {
    const secretReference = env.providerSecretReferenceNames.kimi
    if (
      !secretReference
      || !/^projects\/(?:[a-z][a-z0-9-]{4,28}[a-z0-9]|[0-9]{6,20})\/secrets\/[A-Za-z0-9_-]{1,255}\/versions\/[1-9][0-9]*$/u.test(
        secretReference,
      )
    ) {
      throw new Error(
        'Kimi runtime requires GOOGLE_SECRET_KIMI_API_KEY_NAME as an explicitly pinned Secret Manager version.',
      )
    }
  }

  if (
    env.nodeEnv === 'production'
    && env.kimiRuntimeMode === 'internal_test'
  ) {
    throw new Error(
      'REEDITPRO_KIMI_RUNTIME_MODE=internal_test is forbidden in production.',
    )
  }

  if (
    env.kimiRuntimeMode === 'cloud_run'
    && env.mode !== 'cloud_run'
  ) {
    throw new Error(
      'REEDITPRO_KIMI_RUNTIME_MODE=cloud_run requires E2E_RUNTIME_MODE=cloud_run.',
    )
  }

  if (env.openAiRuntimeMode !== 'disabled') {
    if (env.kimiRuntimeMode === 'disabled') {
      throw new Error(
        'GPT-5.6 Terra is a Kimi fallback and requires the Kimi primary runtime.',
      )
    }
    const secretReference = env.providerSecretReferenceNames.openai
    if (
      !secretReference
      || !/^projects\/(?:[a-z][a-z0-9-]{4,28}[a-z0-9]|[0-9]{6,20})\/secrets\/[A-Za-z0-9_-]{1,255}\/versions\/[1-9][0-9]*$/u.test(
        secretReference,
      )
    ) {
      throw new Error(
        'OpenAI runtime requires GOOGLE_SECRET_OPENAI_API_KEY_NAME as an explicitly pinned Secret Manager version.',
      )
    }
  }

  if (
    env.nodeEnv === 'production'
    && env.openAiRuntimeMode === 'internal_test'
  ) {
    throw new Error(
      'REEDITPRO_OPENAI_RUNTIME_MODE=internal_test is forbidden in production.',
    )
  }

  if (
    env.openAiRuntimeMode === 'cloud_run'
    && env.mode !== 'cloud_run'
  ) {
    throw new Error(
      'REEDITPRO_OPENAI_RUNTIME_MODE=cloud_run requires E2E_RUNTIME_MODE=cloud_run.',
    )
  }

  if (env.visualIntelligenceRuntimeMode === 'cloud_run') {
    assertVisualIntelligenceRuntimeConfigured(env)
  }
}

export function createSafeRuntimeSummary(env: RuntimeEnv): Record<string, unknown> {
  return {
    nodeEnv: env.nodeEnv,
    mode: env.mode,
    apiPort: env.apiPort,
    allowedCorsOriginCount: env.allowedCorsOrigins.length,
    browserApiTransport: env.browserApiTransport,
    internalServiceAuthConfigured: Boolean(env.internalServiceToken),
    allowMockWithoutSupabase: env.allowMockWithoutSupabase,
    allowInternalTestExecutionWithSupabase: env.allowInternalTestExecutionWithSupabase,
    storageMode: env.storageMode,
    largeMediaFinalizationMode: env.largeMediaFinalizationMode,
    localStorageRootConfigured: Boolean(env.localStorageRoot),
    signedUrlTtlSeconds: env.signedUrlTtlSeconds,
    supabaseUrlConfigured: Boolean(env.supabaseUrl),
    supabaseAnonKeyConfigured: Boolean(env.supabaseAnonKey),
    supabaseServiceRoleConfigured: env.hasSupabaseAdmin,
    googleCloudProjectConfigured: Boolean(env.googleCloudProjectId),
    googleCloudRegionConfigured: Boolean(env.googleCloudRegion),
    professionalGpuTaskTargetOriginConfigured:
      Boolean(env.professionalGpuTaskTargetOrigin),
    gcsBucketsConfigured: {
      sourceMedia: Boolean(env.gcsSourceMediaBucket),
      generatedAssets: Boolean(env.gcsGeneratedAssetsBucket),
      processedMedia: Boolean(env.gcsProcessedMediaBucket),
      previews: Boolean(env.gcsPreviewsBucket),
      exports: Boolean(env.gcsExportsBucket),
      thumbnails: Boolean(env.gcsThumbnailsBucket),
      qaArtifacts: Boolean(env.gcsQaArtifactsBucket),
      workerTemp: Boolean(env.gcsWorkerTempBucket),
      controlPlaneState: Boolean(env.gcsControlPlaneStateBucket),
    },
    workerRuntime: {
      mode: env.workerRuntimeMode,
      workerInstanceIdConfigured: Boolean(env.workerInstanceId),
      heartbeatIntervalSeconds: env.workerHeartbeatIntervalSeconds,
      claimLeaseSeconds: env.workerClaimLeaseSeconds,
      strictToolReadiness: env.strictToolReadiness,
      toolCheckTimeoutMs: env.toolCheckTimeoutMs,
      ffmpegBinConfigured: Boolean(env.ffmpegBin),
      ffprobeBinConfigured: Boolean(env.ffprobeBin),
      remotionBinConfigured: Boolean(env.remotionBin),
      pythonBinConfigured: Boolean(env.pythonBin),
      toolAdapterPythonBinConfigured: env.toolAdapterPythonBinConfigured,
      playwrightBinConfigured: Boolean(env.playwrightBin),
    },
    kimiRuntime: {
      mode: env.kimiRuntimeMode,
      pinnedSecretReferenceConfigured: Boolean(
        env.providerSecretReferenceNames.kimi,
      ),
      endpoint: 'https://api.moonshot.ai/v1/chat/completions',
      model: 'kimi-k3',
    },
    openAiRuntime: {
      mode: env.openAiRuntimeMode,
      pinnedSecretReferenceConfigured: Boolean(
        env.providerSecretReferenceNames.openai,
      ),
      endpoint: 'https://api.openai.com/v1/responses',
      model: 'gpt-5.6-terra',
      role: 'kimi_fallback',
    },
    visualIntelligenceRuntime: {
      mode: env.visualIntelligenceRuntimeMode,
      capabilityId: 'visual_intelligence',
      semanticEngine: 'gemini-3.1-pro-preview',
      thinkingLevel: 'high',
      mediaResolution: 'high',
      immutableReleaseCoordinateConfigured: Boolean(
        env.visualIntelligenceReleaseObjectName
        && env.visualIntelligenceReleaseGeneration
        && env.visualIntelligenceReleaseEtag
        && env.visualIntelligenceReleaseContentSha256,
      ),
      accountEffectiveRateCoordinateConfigured: Boolean(
        env.visualIntelligenceRateObjectName
        && env.visualIntelligenceRateGeneration
        && env.visualIntelligenceRateEtag
        && env.visualIntelligenceRateContentSha256,
      ),
      gpuBillingAccountPricingConfigured: Boolean(
        env.googleCloudBillingAccountResourceName,
      ),
      apiKeyConfiguredOrRequired: false,
      qwenFallbackAllowed: false,
      cpuSubstantiveMediaProcessingAllowed: false,
    },
    providerSecretReferenceNamesConfigured: Object.fromEntries(
      Object.entries(env.providerSecretReferenceNames).map(([key, value]) => [key, Boolean(value)]),
    ),
    mockOnly: env.mockOnly,
    warnings: env.warnings,
  }
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseCorsOrigins(value: string | undefined): string[] {
  const origins = Array.from(new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ))

  for (const origin of origins) {
    let parsed: URL
    try {
      parsed = new URL(origin)
    } catch {
      throw new Error(`API_ALLOWED_CORS_ORIGINS contains an invalid origin: ${origin}`)
    }

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(`API_ALLOWED_CORS_ORIGINS must contain exact http(s) origins without paths, credentials, queries, or wildcards: ${origin}`)
    }
  }

  return origins
}

function hasRequiredGcsBuckets(parsed: z.infer<typeof envSchema>): boolean {
  return Boolean(
    clean(parsed.GCS_SOURCE_MEDIA_BUCKET) &&
    clean(parsed.GCS_GENERATED_ASSETS_BUCKET) &&
    clean(parsed.GCS_PROCESSED_MEDIA_BUCKET) &&
    clean(parsed.GCS_PREVIEWS_BUCKET) &&
    clean(parsed.GCS_EXPORTS_BUCKET) &&
    clean(parsed.GCS_THUMBNAILS_BUCKET) &&
    clean(parsed.GCS_QA_ARTIFACTS_BUCKET) &&
    clean(parsed.GCS_WORKER_TEMP_BUCKET),
  )
}

function hasVisualIntelligenceCoordinates(
  parsed: z.infer<typeof envSchema>,
): boolean {
  return Boolean(
    clean(parsed.GCS_CONTROL_PLANE_STATE_BUCKET)
    && clean(parsed.WEEDITPRO_GOOGLE_CLOUD_BILLING_ACCOUNT_RESOURCE_NAME)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_OBJECT)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_GENERATION)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_ETAG)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RELEASE_SHA256)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_OBJECT)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_GENERATION)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_ETAG)
    && clean(parsed.REEDITPRO_VISUAL_INTELLIGENCE_RATE_SHA256),
  )
}

function assertVisualIntelligenceRuntimeConfigured(env: RuntimeEnv): void {
  if (
    env.mode !== 'cloud_run'
    || env.storageMode !== 'gcs'
    || env.googleCloudProjectId !== 'reeditpro'
    || !env.internalServiceToken
    || !env.gcsControlPlaneStateBucket
    || !env.googleCloudBillingAccountResourceName
  ) throw new Error(
    'Visual Intelligence cloud runtime requires Cloud Run mode, private GCS, the immutable reeditpro cloud project coordinate, internal-service authentication, and a control-plane bucket.',
  )
  const values = [
    env.visualIntelligenceReleaseObjectName,
    env.visualIntelligenceReleaseGeneration,
    env.visualIntelligenceReleaseEtag,
    env.visualIntelligenceReleaseContentSha256,
    env.visualIntelligenceRateObjectName,
    env.visualIntelligenceRateGeneration,
    env.visualIntelligenceRateEtag,
    env.visualIntelligenceRateContentSha256,
  ]
  if (values.some((value) => !value)) throw new Error(
    'Visual Intelligence cloud runtime requires every exact immutable runtime-release and billing-account-effective rate coordinate.',
  )
  if (
    !/^billingAccounts\/[A-Za-z0-9-]+$/u.test(
      env.googleCloudBillingAccountResourceName!,
    )
    ||
    !env.visualIntelligenceReleaseObjectName!.startsWith(
      'private/visual-intelligence/releases/gemini-pro-high/v2/',
    )
    || !env.visualIntelligenceReleaseObjectName!.endsWith('.json')
    || !env.visualIntelligenceRateObjectName!.startsWith(
      'private/visual-intelligence/pricing/account-effective/v2/',
    )
    || !env.visualIntelligenceRateObjectName!.endsWith('.json')
    || !/^[1-9][0-9]{0,30}$/u.test(
      env.visualIntelligenceReleaseGeneration!,
    )
    || !/^[1-9][0-9]{0,30}$/u.test(
      env.visualIntelligenceRateGeneration!,
    )
    || !/^[a-f0-9]{64}$/u.test(
      env.visualIntelligenceReleaseContentSha256!,
    )
    || !/^[a-f0-9]{64}$/u.test(
      env.visualIntelligenceRateContentSha256!,
    )
  ) throw new Error(
    'Visual Intelligence runtime-release or rate coordinates are malformed.',
  )
}

function assertGcsRuntimeConfigured(env: RuntimeEnv): void {
  if (!env.googleCloudProjectId || !env.googleCloudRegion) {
    throw new Error('STORAGE_MODE=gcs requires GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_REGION.')
  }

  const buckets = {
    GCS_SOURCE_MEDIA_BUCKET: env.gcsSourceMediaBucket,
    GCS_GENERATED_ASSETS_BUCKET: env.gcsGeneratedAssetsBucket,
    GCS_PROCESSED_MEDIA_BUCKET: env.gcsProcessedMediaBucket,
    GCS_PREVIEWS_BUCKET: env.gcsPreviewsBucket,
    GCS_EXPORTS_BUCKET: env.gcsExportsBucket,
    GCS_THUMBNAILS_BUCKET: env.gcsThumbnailsBucket,
    GCS_QA_ARTIFACTS_BUCKET: env.gcsQaArtifactsBucket,
    GCS_WORKER_TEMP_BUCKET: env.gcsWorkerTempBucket,
  }
  const missing = Object.entries(buckets)
    .filter(([, value]) => !value)
    .map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(`STORAGE_MODE=gcs is missing required bucket configuration: ${missing.join(', ')}.`)
  }

  for (const [name, value] of Object.entries(buckets)) {
    if (!isValidGcsBucketName(value!)) {
      throw new Error(`${name} is not a valid private GCS bucket name.`)
    }
  }
}

function isValidGcsBucketName(value: string): boolean {
  return value.length >= 3 && value.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])$/.test(value) &&
    !value.includes('..') &&
    !/^goog/i.test(value) &&
    !value.includes('google')
}

function isSecureSupabaseOrigin(value: string | undefined): boolean {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === '/' &&
      url.origin === value.replace(/\/$/, '')
  } catch {
    return false
  }
}
