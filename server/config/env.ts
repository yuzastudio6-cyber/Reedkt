import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

export type E2ERuntimeMode = 'local' | 'mock' | 'cloud_run' | 'disabled'
export type StorageMode = 'local' | 'gcs_disabled' | 'gcs'
export type WorkerRuntimeMode = 'local' | 'mock' | 'cloud_run' | 'disabled'

export interface RuntimeEnv {
  nodeEnv: string
  mode: E2ERuntimeMode
  apiPort: number
  allowMockWithoutSupabase: boolean
  storageMode: StorageMode
  localStorageRoot: string
  signedUrlTtlSeconds: number
  supabaseUrl?: string
  supabaseAnonKey?: string
  supabaseServiceRoleKey?: string
  googleCloudProjectId?: string
  googleCloudRegion?: string
  gcsDefaultRegion: string
  gcsSourceMediaBucket?: string
  gcsGeneratedAssetsBucket?: string
  gcsProcessedMediaBucket?: string
  gcsPreviewsBucket?: string
  gcsExportsBucket?: string
  gcsThumbnailsBucket?: string
  gcsQaArtifactsBucket?: string
  gcsWorkerTempBucket?: string
  workerRuntimeMode: WorkerRuntimeMode
  workerInstanceId: string
  workerHeartbeatIntervalSeconds: number
  workerClaimLeaseSeconds: number
  aiGraphicsExternalBetaToolCallRouteMountEnabled: boolean
  strictToolReadiness: boolean
  toolCheckTimeoutMs: number
  ffmpegBin: string
  ffprobeBin: string
  remotionBin: string
  pythonBin: string
  playwrightBin: string
  providerSecretReferenceNames: Record<string, string | undefined>
  hasSupabaseAdmin: boolean
  hasSupabasePublic: boolean
  mockOnly: boolean
  warnings: string[]
}

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().int().positive().max(65535).default(8787),
  PORT: z.coerce.number().int().positive().max(65535).optional(),
  E2E_RUNTIME_MODE: z.enum(['local', 'mock', 'cloud_run', 'disabled']).default('local'),
  API_ALLOW_MOCK_WITHOUT_SUPABASE: z.string().optional(),
  STORAGE_MODE: z.enum(['local', 'gcs_disabled', 'gcs']).default('local'),
  LOCAL_STORAGE_ROOT: z.string().default('.reeditpro-local-storage'),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().max(86400).default(900),
  SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_CLOUD_REGION: z.string().optional(),
  GCS_DEFAULT_REGION: z.string().default('us-east1'),
  GCS_SOURCE_MEDIA_BUCKET: z.string().optional(),
  GCS_GENERATED_ASSETS_BUCKET: z.string().optional(),
  GCS_PROCESSED_MEDIA_BUCKET: z.string().optional(),
  GCS_PREVIEWS_BUCKET: z.string().optional(),
  GCS_EXPORTS_BUCKET: z.string().optional(),
  GCS_THUMBNAILS_BUCKET: z.string().optional(),
  GCS_QA_ARTIFACTS_BUCKET: z.string().optional(),
  GCS_WORKER_TEMP_BUCKET: z.string().optional(),
  WORKER_RUNTIME_MODE: z.enum(['local', 'mock', 'cloud_run', 'disabled']).default('local'),
  WORKER_INSTANCE_ID: z.string().default('local-worker-1'),
  WORKER_HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().max(3600).default(30),
  WORKER_CLAIM_LEASE_SECONDS: z.coerce.number().int().positive().max(86400).default(300),
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: z.string().optional(),
  STRICT_TOOL_READINESS: z.string().optional(),
  TOOL_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().max(120000).default(10000),
  FFMPEG_BIN: z.string().default('ffmpeg'),
  FFPROBE_BIN: z.string().default('ffprobe'),
  REMOTION_BIN: z.string().default('npx remotion'),
  PYTHON_BIN: z.string().default('python'),
  PLAYWRIGHT_BIN: z.string().default('npx playwright'),
  GOOGLE_SECRET_OPENAI_API_KEY_NAME: z.string().optional(),
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
  const hasSupabaseAdmin = Boolean(supabaseUrl && supabaseServiceRoleKey)
  const hasSupabasePublic = Boolean(supabaseUrl && supabaseAnonKey)
  const mockOnly = parsed.E2E_RUNTIME_MODE === 'mock' || parsed.E2E_RUNTIME_MODE === 'disabled' || !hasSupabaseAdmin
  const warnings: string[] = []

  if (!hasSupabaseAdmin) {
    warnings.push('Supabase service-role runtime is unavailable; privileged writes are disabled.')
  }

  if (!hasSupabaseAdmin && !allowMockWithoutSupabase) {
    warnings.push('API_ALLOW_MOCK_WITHOUT_SUPABASE is false; server startup should fail unless Supabase admin env is configured.')
  }

  if (hasSupabaseAdmin && parsed.E2E_RUNTIME_MODE === 'mock') {
    warnings.push('Supabase admin env is present, but E2E_RUNTIME_MODE=mock keeps runtime in mock-only mode.')
  }

  if (parsed.STORAGE_MODE === 'gcs' && !hasRequiredGcsBuckets(parsed)) {
    warnings.push('STORAGE_MODE=gcs is configured without all required GCS bucket names; storage adapter should fail closed.')
  }

  return {
    nodeEnv: parsed.NODE_ENV,
    mode: parsed.E2E_RUNTIME_MODE,
    apiPort: parsed.API_PORT ?? parsed.PORT ?? 8787,
    allowMockWithoutSupabase,
    storageMode: parsed.STORAGE_MODE,
    localStorageRoot: parsed.LOCAL_STORAGE_ROOT,
    signedUrlTtlSeconds: parsed.SIGNED_URL_TTL_SECONDS,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    googleCloudProjectId: clean(parsed.GOOGLE_CLOUD_PROJECT_ID),
    googleCloudRegion: clean(parsed.GOOGLE_CLOUD_REGION),
    gcsDefaultRegion: clean(parsed.GCS_DEFAULT_REGION) ?? 'us-east1',
    gcsSourceMediaBucket: clean(parsed.GCS_SOURCE_MEDIA_BUCKET),
    gcsGeneratedAssetsBucket: clean(parsed.GCS_GENERATED_ASSETS_BUCKET),
    gcsProcessedMediaBucket: clean(parsed.GCS_PROCESSED_MEDIA_BUCKET),
    gcsPreviewsBucket: clean(parsed.GCS_PREVIEWS_BUCKET),
    gcsExportsBucket: clean(parsed.GCS_EXPORTS_BUCKET),
    gcsThumbnailsBucket: clean(parsed.GCS_THUMBNAILS_BUCKET),
    gcsQaArtifactsBucket: clean(parsed.GCS_QA_ARTIFACTS_BUCKET),
    gcsWorkerTempBucket: clean(parsed.GCS_WORKER_TEMP_BUCKET),
    workerRuntimeMode: parsed.WORKER_RUNTIME_MODE,
    workerInstanceId: parsed.WORKER_INSTANCE_ID,
    workerHeartbeatIntervalSeconds: parsed.WORKER_HEARTBEAT_INTERVAL_SECONDS,
    workerClaimLeaseSeconds: parsed.WORKER_CLAIM_LEASE_SECONDS,
    aiGraphicsExternalBetaToolCallRouteMountEnabled:
      parseBoolean(parsed.AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED),
    strictToolReadiness: parseBoolean(parsed.STRICT_TOOL_READINESS),
    toolCheckTimeoutMs: parsed.TOOL_CHECK_TIMEOUT_MS,
    ffmpegBin: parsed.FFMPEG_BIN,
    ffprobeBin: parsed.FFPROBE_BIN,
    remotionBin: parsed.REMOTION_BIN,
    pythonBin: parsed.PYTHON_BIN,
    playwrightBin: parsed.PLAYWRIGHT_BIN,
    providerSecretReferenceNames: {
      openai: clean(parsed.GOOGLE_SECRET_OPENAI_API_KEY_NAME),
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
  if (!env.hasSupabaseAdmin && !env.allowMockWithoutSupabase) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Set API_ALLOW_MOCK_WITHOUT_SUPABASE=true for explicit local mock mode.')
  }
}

export function createSafeRuntimeSummary(env: RuntimeEnv): Record<string, unknown> {
  return {
    nodeEnv: env.nodeEnv,
    mode: env.mode,
    apiPort: env.apiPort,
    allowMockWithoutSupabase: env.allowMockWithoutSupabase,
    storageMode: env.storageMode,
    localStorageRootConfigured: Boolean(env.localStorageRoot),
    signedUrlTtlSeconds: env.signedUrlTtlSeconds,
    supabaseUrlConfigured: Boolean(env.supabaseUrl),
    supabaseAnonKeyConfigured: Boolean(env.supabaseAnonKey),
    supabaseServiceRoleConfigured: env.hasSupabaseAdmin,
    googleCloudProjectConfigured: Boolean(env.googleCloudProjectId),
    googleCloudRegionConfigured: Boolean(env.googleCloudRegion),
    gcsBucketsConfigured: {
      sourceMedia: Boolean(env.gcsSourceMediaBucket),
      generatedAssets: Boolean(env.gcsGeneratedAssetsBucket),
      processedMedia: Boolean(env.gcsProcessedMediaBucket),
      previews: Boolean(env.gcsPreviewsBucket),
      exports: Boolean(env.gcsExportsBucket),
      thumbnails: Boolean(env.gcsThumbnailsBucket),
      qaArtifacts: Boolean(env.gcsQaArtifactsBucket),
      workerTemp: Boolean(env.gcsWorkerTempBucket),
    },
    workerRuntime: {
      mode: env.workerRuntimeMode,
      workerInstanceIdConfigured: Boolean(env.workerInstanceId),
      heartbeatIntervalSeconds: env.workerHeartbeatIntervalSeconds,
      claimLeaseSeconds: env.workerClaimLeaseSeconds,
      aiGraphicsExternalBetaToolCallRouteMountEnabled:
        env.aiGraphicsExternalBetaToolCallRouteMountEnabled,
      strictToolReadiness: env.strictToolReadiness,
      toolCheckTimeoutMs: env.toolCheckTimeoutMs,
      ffmpegBinConfigured: Boolean(env.ffmpegBin),
      ffprobeBinConfigured: Boolean(env.ffprobeBin),
      remotionBinConfigured: Boolean(env.remotionBin),
      pythonBinConfigured: Boolean(env.pythonBin),
      playwrightBinConfigured: Boolean(env.playwrightBin),
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
