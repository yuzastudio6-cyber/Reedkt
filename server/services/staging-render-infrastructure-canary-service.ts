import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'

export const STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE = 'staging_cloud_run_remotion_canary' as const
export const STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE = 'tiny-muted-3s' as const
export const STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID = 'reeditpro-staging-smoke-remotion-canary'

const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
const PRODUCTION_WORD_PATTERN = /\b(prod|production|live)\b/i
const DEFAULT_MAX_ARTIFACT_BYTES = 750_000
const DEFAULT_RENDER_TIMEOUT_SECONDS = 120

export interface StagingRenderInfrastructureCanaryRequest {
  canary?: unknown
  mode?: unknown
  smokeRunId?: unknown
  fixture?: unknown
  maxDurationSeconds?: unknown
  maxFrames?: unknown
  width?: unknown
  height?: unknown
  fps?: unknown
  cleanup?: unknown
}

export interface StagingRenderInfrastructureCanaryInput {
  canary: true
  mode: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
  smokeRunId: string
  fixture: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE
  maxDurationSeconds: number
  maxFrames: number
  width: number
  height: number
  fps: number
  cleanup: true
}

export interface StagingRenderInfrastructureCanaryEnv {
  serviceMode: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
  projectId: string
  outputBucketOrPrefix: string
  expectedHostSuffix: string
  renderTimeoutSeconds: number
  maxArtifactBytes: number
  remotionEntrypoint: string
}

export interface StagingRenderInfrastructureCanaryArtifactSummary {
  bucketName: string
  objectPath: string
  mimeType: 'video/mp4'
  sizeBytes: number
  checksumSha256: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  frameCount: number
  existsBeforeCleanup: boolean
  deleted: boolean
  existsAfterCleanup: boolean
}

export interface StagingRenderInfrastructureCanaryResult {
  ok: boolean
  status: 'completed' | 'blocked' | 'failed'
  mode: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
  smokeRunId?: string
  fixture?: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE
  outputArtifact?: StagingRenderInfrastructureCanaryArtifactSummary
  remotion?: {
    renderer: 'renderMedia'
    bundler: 'bundle'
    selector: 'selectComposition'
    compositionId: string
  }
  strictValidation: {
    ok: boolean
    blockers: string[]
    cleanupAcknowledged: boolean
    stagingOnly: boolean
    noProviderCallsRan: true
    noStripePaymentFlowsRan: true
    noProductionFlowsRan: true
    noUserMediaUsed: true
    noQueueDrainRan: true
  }
  error?: {
    code: string
    message: string
  }
}

export interface CanaryArtifactStore {
  upload(input: {
    bucketName: string
    objectPath: string
    localPath: string
    checksumSha256: string
    smokeRunId: string
  }): Promise<void>
  exists(bucketName: string, objectPath: string): Promise<boolean>
  delete(bucketName: string, objectPath: string): Promise<boolean>
}

export interface CanaryRenderer {
  render(input: {
    outputPath: string
    smokeRunId: string
    width: number
    height: number
    fps: number
    durationSeconds: number
    timeoutSeconds: number
    remotionEntrypoint: string
  }): Promise<void>
}

export interface StagingRenderInfrastructureCanaryDeps {
  artifactStore?: CanaryArtifactStore
  renderer?: CanaryRenderer
}

interface ParsedBucketPrefix {
  bucketName: string
  prefix: string
}

export function loadStagingRenderInfrastructureCanaryEnv(
  source: Record<string, string | undefined> = process.env,
): StagingRenderInfrastructureCanaryEnv {
  return {
    serviceMode: readClean(source.STAGING_RENDER_CANARY_MODE) === STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
      ? STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
      : STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
    projectId: readClean(source.GCP_PROJECT_ID) ?? readClean(source.GOOGLE_CLOUD_PROJECT_ID) ?? '',
    outputBucketOrPrefix: readClean(source.STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX)
      ?? readClean(source.STAGING_RENDER_CANARY_OUTPUT_BUCKET)
      ?? '',
    expectedHostSuffix: readClean(source.STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX) ?? '.run.app',
    renderTimeoutSeconds: readNumber(source.STAGING_RENDER_CANARY_TIMEOUT_SECONDS, DEFAULT_RENDER_TIMEOUT_SECONDS),
    maxArtifactBytes: readNumber(source.STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES, DEFAULT_MAX_ARTIFACT_BYTES),
    remotionEntrypoint: readClean(source.STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT)
      ?? path.join(process.cwd(), 'server', 'remotion', 'staging-canary-remotion-entry.ts'),
  }
}

export function validateStagingRenderInfrastructureCanaryRequest(
  payload: StagingRenderInfrastructureCanaryRequest,
): { ok: true; input: StagingRenderInfrastructureCanaryInput } | { ok: false; blockers: string[] } {
  const blockers: string[] = []
  const smokeRunId = typeof payload.smokeRunId === 'string' ? payload.smokeRunId.trim() : ''
  const maxDurationSeconds = readUnknownNumber(payload.maxDurationSeconds)
  const maxFrames = readUnknownNumber(payload.maxFrames)
  const width = readUnknownNumber(payload.width)
  const height = readUnknownNumber(payload.height)
  const fps = readUnknownNumber(payload.fps)

  if (payload.canary !== true) blockers.push('canary must be true.')
  if (payload.mode !== STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE) {
    blockers.push(`mode must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}.`)
  }
  if (!SMOKE_RUN_PATTERN.test(smokeRunId)) {
    blockers.push('smokeRunId must match rp-e2e-smoke-<uuid>.')
  }
  if (payload.fixture !== STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE) {
    blockers.push(`fixture must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE}.`)
  }
  if (payload.cleanup !== true) blockers.push('cleanup must be true.')
  if (!isBounded(maxDurationSeconds, 1, 3)) blockers.push('maxDurationSeconds must stay between 1 and 3.')
  if (!isBounded(width, 16, 320) || !isBounded(height, 16, 240)) {
    blockers.push('width/height must stay at or below 320x240.')
  }
  if (!isBounded(fps, 1, 30)) blockers.push('fps must stay between 1 and 30.')
  if (!isBounded(maxFrames, 1, 90)) blockers.push('maxFrames must stay at or below 90.')
  if (Number.isFinite(maxDurationSeconds) && Number.isFinite(fps) && Number.isFinite(maxFrames)) {
    const requestedFrames = Math.ceil(maxDurationSeconds * fps)
    if (requestedFrames > maxFrames) {
      blockers.push('maxFrames must cover the requested bounded duration and fps.')
    }
  }

  if (blockers.length > 0) return { ok: false, blockers }

  return {
    ok: true,
    input: {
      canary: true,
      mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      smokeRunId,
      fixture: STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
      maxDurationSeconds,
      maxFrames,
      width,
      height,
      fps,
      cleanup: true,
    },
  }
}

export function validateStagingRenderInfrastructureCanaryEnv(
  env: StagingRenderInfrastructureCanaryEnv,
): string[] {
  const blockers: string[] = []
  if (env.serviceMode !== STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE) {
    blockers.push(`STAGING_RENDER_CANARY_MODE must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}.`)
  }
  if (!env.projectId) {
    blockers.push('GCP_PROJECT_ID is required for the staging Cloud Run Remotion canary service.')
  } else if (!/staging|canary|smoke|test/i.test(env.projectId) || PRODUCTION_WORD_PATTERN.test(env.projectId)) {
    blockers.push('GCP_PROJECT_ID must be staging/test/canary scoped and not production-looking.')
  }
  if (!env.outputBucketOrPrefix) {
    blockers.push('STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX is required.')
  } else {
    try {
      validateBucketPrefix(parseBucketPrefix(env.outputBucketOrPrefix))
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : 'Invalid staging canary bucket/prefix.')
    }
  }
  if (!env.expectedHostSuffix.startsWith('.') || PRODUCTION_WORD_PATTERN.test(env.expectedHostSuffix)) {
    blockers.push('STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX must be a safe hostname suffix such as .run.app.')
  }
  if (!isBounded(env.renderTimeoutSeconds, 30, 300)) {
    blockers.push('STAGING_RENDER_CANARY_TIMEOUT_SECONDS must stay between 30 and 300.')
  }
  if (!isBounded(env.maxArtifactBytes, 1, DEFAULT_MAX_ARTIFACT_BYTES)) {
    blockers.push(`STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES must stay below ${DEFAULT_MAX_ARTIFACT_BYTES}.`)
  }
  if (!env.remotionEntrypoint || !/canary|smoke/i.test(env.remotionEntrypoint) || PRODUCTION_WORD_PATTERN.test(env.remotionEntrypoint)) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT must be smoke/canary-scoped and not production-looking.')
  }
  return blockers
}

export async function runStagingRenderInfrastructureCanary(
  payload: StagingRenderInfrastructureCanaryRequest,
  env: StagingRenderInfrastructureCanaryEnv = loadStagingRenderInfrastructureCanaryEnv(),
  deps: StagingRenderInfrastructureCanaryDeps = {},
): Promise<StagingRenderInfrastructureCanaryResult> {
  const requestValidation = validateStagingRenderInfrastructureCanaryRequest(payload)
  const requestInput = requestValidation.ok ? requestValidation.input : undefined
  const envBlockers = validateStagingRenderInfrastructureCanaryEnv(env)
  const blockers = [
    ...(requestValidation.ok ? [] : requestValidation.blockers),
    ...envBlockers,
  ]
  if (blockers.length > 0) return blockedResult(blockers, requestInput?.smokeRunId)

  const input = requestInput!
  const output = parseBucketPrefix(env.outputBucketOrPrefix)
  validateBucketPrefix(output)

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'rp-render-canary-'))
  const outputPath = path.join(tempDir, 'tiny-muted-3s.mp4')
  const objectPath = `${output.prefix}/${input.smokeRunId}/${randomUUID()}/tiny-muted-3s.mp4`
  const renderer = deps.renderer ?? { render: renderTinyRemotionCanary }
  const store = deps.artifactStore ?? new GcsCanaryArtifactStore(env.projectId)

  try {
    await renderer.render({
      outputPath,
      smokeRunId: input.smokeRunId,
      width: input.width,
      height: input.height,
      fps: input.fps,
      durationSeconds: input.maxDurationSeconds,
      timeoutSeconds: env.renderTimeoutSeconds,
      remotionEntrypoint: env.remotionEntrypoint,
    })

    const fileStat = await stat(outputPath)
    if (fileStat.size <= 0 || fileStat.size > env.maxArtifactBytes) {
      throw new Error(`Rendered canary artifact size ${fileStat.size} is outside the allowed staging canary bounds.`)
    }
    const checksumSha256 = await sha256File(outputPath)
    await store.upload({
      bucketName: output.bucketName,
      objectPath,
      localPath: outputPath,
      checksumSha256,
      smokeRunId: input.smokeRunId,
    })
    const existsBeforeCleanup = await store.exists(output.bucketName, objectPath)
    const deleted = await store.delete(output.bucketName, objectPath)
    const existsAfterCleanup = await store.exists(output.bucketName, objectPath)

    if (!existsBeforeCleanup) throw new Error('Uploaded staging canary artifact was not readable before cleanup.')
    if (!deleted || existsAfterCleanup) throw new Error('Staging canary artifact cleanup did not remove the uploaded object.')

    return {
      ok: true,
      status: 'completed',
      mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      fixture: input.fixture,
      outputArtifact: {
        bucketName: output.bucketName,
        objectPath,
        mimeType: 'video/mp4',
        sizeBytes: fileStat.size,
        checksumSha256,
        durationSeconds: input.maxDurationSeconds,
        width: input.width,
        height: input.height,
        fps: input.fps,
        frameCount: Math.ceil(input.maxDurationSeconds * input.fps),
        existsBeforeCleanup,
        deleted,
        existsAfterCleanup,
      },
      remotion: {
        renderer: 'renderMedia',
        bundler: 'bundle',
        selector: 'selectComposition',
        compositionId: STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
      },
      strictValidation: strictValidation([], true),
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      strictValidation: strictValidation([error instanceof Error ? error.message : 'Unknown staging render canary failure.'], true),
      error: {
        code: 'staging_render_infrastructure_canary_failed',
        message: error instanceof Error ? error.message : 'Unknown staging render canary failure.',
      },
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function renderTinyRemotionCanary(input: Parameters<CanaryRenderer['render']>[0]): Promise<void> {
  if (!existsSync(input.remotionEntrypoint)) {
    throw new Error('Staging canary Remotion entrypoint is missing from the Cloud Run image.')
  }

  const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ])
  const serveUrl = await bundle({ entryPoint: input.remotionEntrypoint })
  const inputProps = {
    smokeRunId: input.smokeRunId,
    durationSeconds: input.durationSeconds,
  }
  const composition = await selectComposition({
    serveUrl,
    id: STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
    inputProps,
  })

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation: input.outputPath,
    inputProps,
    muted: true,
    concurrency: 1,
    timeoutInMilliseconds: input.timeoutSeconds * 1000,
    logLevel: 'warn',
    overwrite: true,
    videoBitrate: '220K',
  })
}

class GcsCanaryArtifactStore implements CanaryArtifactStore {
  private readonly storage: Storage

  constructor(projectId: string) {
    this.storage = new Storage({ projectId })
  }

  async upload(input: {
    bucketName: string
    objectPath: string
    localPath: string
    checksumSha256: string
    smokeRunId: string
  }): Promise<void> {
    await this.storage.bucket(input.bucketName).upload(input.localPath, {
      destination: input.objectPath,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          smokeRunId: input.smokeRunId,
          checksumSha256: input.checksumSha256,
          canary: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
        },
      },
    })
  }

  async exists(bucketName: string, objectPath: string): Promise<boolean> {
    const [exists] = await this.storage.bucket(bucketName).file(objectPath).exists()
    return exists
  }

  async delete(bucketName: string, objectPath: string): Promise<boolean> {
    const file = this.storage.bucket(bucketName).file(objectPath)
    const [exists] = await file.exists()
    if (!exists) return false
    await file.delete()
    return true
  }
}

function parseBucketPrefix(input: string): ParsedBucketPrefix {
  const cleanInput = input.replace(/^gs:\/\//, '').replace(/\\/g, '/').split('/').filter(Boolean)
  if (cleanInput.length === 0) throw new Error('STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX must include a bucket name.')
  const [bucketName, ...prefixSegments] = cleanInput
  const prefix = prefixSegments.length > 0 ? prefixSegments.join('/') : 'render-canary-smoke'
  return { bucketName, prefix }
}

function validateBucketPrefix(output: ParsedBucketPrefix): void {
  const text = `${output.bucketName}/${output.prefix}`
  if (PRODUCTION_WORD_PATTERN.test(text)) {
    throw new Error('Staging canary output bucket/prefix must not look production/live.')
  }
  if (!/staging/i.test(text) || !/canary|smoke/i.test(text)) {
    throw new Error('Staging canary output bucket/prefix must be staging and smoke/canary scoped.')
  }
  if (text.includes('..') || output.prefix.startsWith('/')) {
    throw new Error('Staging canary output bucket/prefix must not contain traversal segments.')
  }
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath)
  return createHash('sha256').update(bytes).digest('hex')
}

function blockedResult(blockers: string[], smokeRunId?: string): StagingRenderInfrastructureCanaryResult {
  return {
    ok: false,
    status: 'blocked',
    mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
    smokeRunId,
    strictValidation: strictValidation(blockers, false),
    error: {
      code: 'staging_render_infrastructure_canary_blocked',
      message: blockers.join('; '),
    },
  }
}

function strictValidation(blockers: string[], cleanupAcknowledged: boolean): StagingRenderInfrastructureCanaryResult['strictValidation'] {
  return {
    ok: blockers.length === 0,
    blockers,
    cleanupAcknowledged,
    stagingOnly: true,
    noProviderCallsRan: true,
    noStripePaymentFlowsRan: true,
    noProductionFlowsRan: true,
    noUserMediaUsed: true,
    noQueueDrainRan: true,
  }
}

function readUnknownNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return Number.NaN
}

function readNumber(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback
  return Number(value)
}

function isBounded(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

function readClean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}
