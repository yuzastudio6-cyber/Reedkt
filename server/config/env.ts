import { createRequire } from 'node:module'

const optionalRequire = createRequire(import.meta.url)

try {
  const dotenv = optionalRequire('dotenv') as { config(options?: { quiet?: boolean }): void }
  dotenv.config({ quiet: true })
} catch (error) {
  if (!isMissingOptionalPackageError(error)) throw error
}

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

interface ParsedRuntimeEnvSource {
  NODE_ENV: string
  API_PORT?: number
  PORT?: number
  E2E_RUNTIME_MODE: E2ERuntimeMode
  API_ALLOW_MOCK_WITHOUT_SUPABASE?: string
  STORAGE_MODE: StorageMode
  LOCAL_STORAGE_ROOT: string
  SIGNED_URL_TTL_SECONDS: number
  SUPABASE_URL?: string
  VITE_SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  VITE_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  GOOGLE_CLOUD_PROJECT_ID?: string
  GOOGLE_CLOUD_REGION?: string
  GCS_DEFAULT_REGION: string
  GCS_SOURCE_MEDIA_BUCKET?: string
  GCS_GENERATED_ASSETS_BUCKET?: string
  GCS_PROCESSED_MEDIA_BUCKET?: string
  GCS_PREVIEWS_BUCKET?: string
  GCS_EXPORTS_BUCKET?: string
  GCS_THUMBNAILS_BUCKET?: string
  GCS_QA_ARTIFACTS_BUCKET?: string
  GCS_WORKER_TEMP_BUCKET?: string
  WORKER_RUNTIME_MODE: WorkerRuntimeMode
  WORKER_INSTANCE_ID: string
  WORKER_HEARTBEAT_INTERVAL_SECONDS: number
  WORKER_CLAIM_LEASE_SECONDS: number
  STRICT_TOOL_READINESS?: string
  TOOL_CHECK_TIMEOUT_MS: number
  FFMPEG_BIN: string
  FFPROBE_BIN: string
  REMOTION_BIN: string
  PYTHON_BIN: string
  PLAYWRIGHT_BIN: string
  GOOGLE_SECRET_OPENAI_API_KEY_NAME?: string
  GOOGLE_SECRET_WAN_API_KEY_NAME?: string
  GOOGLE_SECRET_HAILUO_API_KEY_NAME?: string
  GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME?: string
  GOOGLE_SECRET_LYRIA_API_KEY_NAME?: string
  GOOGLE_SECRET_MIRELO_API_KEY_NAME?: string
  GOOGLE_SECRET_MMAUDIO_API_KEY_NAME?: string
}

export function loadRuntimeEnv(source: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = parseRuntimeEnvSource(source)
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

function parseRuntimeEnvSource(source: NodeJS.ProcessEnv): ParsedRuntimeEnvSource {
  return {
    NODE_ENV: stringValue(source.NODE_ENV, 'development'),
    API_PORT: optionalPositiveInt(source.API_PORT, 'API_PORT', 65535),
    PORT: optionalPositiveInt(source.PORT, 'PORT', 65535),
    E2E_RUNTIME_MODE: enumValue(source.E2E_RUNTIME_MODE, 'E2E_RUNTIME_MODE', ['local', 'mock', 'cloud_run', 'disabled'], 'local'),
    API_ALLOW_MOCK_WITHOUT_SUPABASE: optionalString(source.API_ALLOW_MOCK_WITHOUT_SUPABASE),
    STORAGE_MODE: enumValue(source.STORAGE_MODE, 'STORAGE_MODE', ['local', 'gcs_disabled', 'gcs'], 'local'),
    LOCAL_STORAGE_ROOT: stringValue(source.LOCAL_STORAGE_ROOT, '.reeditpro-local-storage'),
    SIGNED_URL_TTL_SECONDS: positiveInt(source.SIGNED_URL_TTL_SECONDS, 'SIGNED_URL_TTL_SECONDS', 86400, 900),
    SUPABASE_URL: optionalString(source.SUPABASE_URL),
    VITE_SUPABASE_URL: optionalString(source.VITE_SUPABASE_URL),
    SUPABASE_ANON_KEY: optionalString(source.SUPABASE_ANON_KEY),
    VITE_SUPABASE_ANON_KEY: optionalString(source.VITE_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: optionalString(source.SUPABASE_SERVICE_ROLE_KEY),
    GOOGLE_CLOUD_PROJECT_ID: optionalString(source.GOOGLE_CLOUD_PROJECT_ID),
    GOOGLE_CLOUD_REGION: optionalString(source.GOOGLE_CLOUD_REGION),
    GCS_DEFAULT_REGION: stringValue(source.GCS_DEFAULT_REGION, 'us-east1'),
    GCS_SOURCE_MEDIA_BUCKET: optionalString(source.GCS_SOURCE_MEDIA_BUCKET),
    GCS_GENERATED_ASSETS_BUCKET: optionalString(source.GCS_GENERATED_ASSETS_BUCKET),
    GCS_PROCESSED_MEDIA_BUCKET: optionalString(source.GCS_PROCESSED_MEDIA_BUCKET),
    GCS_PREVIEWS_BUCKET: optionalString(source.GCS_PREVIEWS_BUCKET),
    GCS_EXPORTS_BUCKET: optionalString(source.GCS_EXPORTS_BUCKET),
    GCS_THUMBNAILS_BUCKET: optionalString(source.GCS_THUMBNAILS_BUCKET),
    GCS_QA_ARTIFACTS_BUCKET: optionalString(source.GCS_QA_ARTIFACTS_BUCKET),
    GCS_WORKER_TEMP_BUCKET: optionalString(source.GCS_WORKER_TEMP_BUCKET),
    WORKER_RUNTIME_MODE: enumValue(source.WORKER_RUNTIME_MODE, 'WORKER_RUNTIME_MODE', ['local', 'mock', 'cloud_run', 'disabled'], 'local'),
    WORKER_INSTANCE_ID: stringValue(source.WORKER_INSTANCE_ID, 'local-worker-1'),
    WORKER_HEARTBEAT_INTERVAL_SECONDS: positiveInt(source.WORKER_HEARTBEAT_INTERVAL_SECONDS, 'WORKER_HEARTBEAT_INTERVAL_SECONDS', 3600, 30),
    WORKER_CLAIM_LEASE_SECONDS: positiveInt(source.WORKER_CLAIM_LEASE_SECONDS, 'WORKER_CLAIM_LEASE_SECONDS', 86400, 300),
    STRICT_TOOL_READINESS: optionalString(source.STRICT_TOOL_READINESS),
    TOOL_CHECK_TIMEOUT_MS: positiveInt(source.TOOL_CHECK_TIMEOUT_MS, 'TOOL_CHECK_TIMEOUT_MS', 120000, 10000),
    FFMPEG_BIN: stringValue(source.FFMPEG_BIN, 'ffmpeg'),
    FFPROBE_BIN: stringValue(source.FFPROBE_BIN, 'ffprobe'),
    REMOTION_BIN: stringValue(source.REMOTION_BIN, 'npx remotion'),
    PYTHON_BIN: stringValue(source.PYTHON_BIN, 'python'),
    PLAYWRIGHT_BIN: stringValue(source.PLAYWRIGHT_BIN, 'npx playwright'),
    GOOGLE_SECRET_OPENAI_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_OPENAI_API_KEY_NAME),
    GOOGLE_SECRET_WAN_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_WAN_API_KEY_NAME),
    GOOGLE_SECRET_HAILUO_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_HAILUO_API_KEY_NAME),
    GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME: optionalString(source.GOOGLE_SECRET_VEO_VERTEX_CONFIG_NAME),
    GOOGLE_SECRET_LYRIA_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_LYRIA_API_KEY_NAME),
    GOOGLE_SECRET_MIRELO_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_MIRELO_API_KEY_NAME),
    GOOGLE_SECRET_MMAUDIO_API_KEY_NAME: optionalString(source.GOOGLE_SECRET_MMAUDIO_API_KEY_NAME),
  }
}

function stringValue(value: string | undefined, defaultValue: string): string {
  return optionalString(value) ?? defaultValue
}

function optionalString(value: string | undefined): string | undefined {
  return clean(value)
}

function enumValue<const T extends string>(
  value: string | undefined,
  name: string,
  allowed: readonly T[],
  defaultValue: T,
): T {
  const normalized = clean(value)
  if (!normalized) return defaultValue
  if ((allowed as readonly string[]).includes(normalized)) return normalized as T
  throw new Error(`${name} must be one of: ${allowed.join(', ')}.`)
}

function optionalPositiveInt(value: string | undefined, name: string, max: number): number | undefined {
  const normalized = clean(value)
  if (!normalized) return undefined
  return parsePositiveInt(normalized, name, max)
}

function positiveInt(value: string | undefined, name: string, max: number, defaultValue: number): number {
  const normalized = clean(value)
  if (!normalized) return defaultValue
  return parsePositiveInt(normalized, name, max)
}

function parsePositiveInt(value: string, name: string, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > max) {
    throw new Error(`${name} must be a positive integer no greater than ${max}.`)
  }
  return parsed
}

function isMissingOptionalPackageError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND')
}

function hasRequiredGcsBuckets(parsed: ParsedRuntimeEnvSource): boolean {
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
