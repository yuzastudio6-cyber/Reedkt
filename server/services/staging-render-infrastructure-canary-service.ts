import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Storage } from '@google-cloud/storage'
import { canaryErrorMessage } from '../cloud-run/canary-safe-json'
import {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
  STAGING_TIMELINE_COMPOSITION_CANARY_COMPOSITION_ID,
} from '../remotion/staging-canary-constants'
import type { TimelineCompositionSpec } from '../timeline/timeline-composition-contracts'

export const STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE = 'staging_cloud_run_remotion_canary' as const
export const STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE = 'tiny-muted-3s' as const
export const STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE = 'staging_real_video_upload_preview_canary' as const
export const STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE = 'tiny-upload-source-3s' as const
export const STAGING_TIMELINE_COMPOSITION_CANARY_MODE = 'staging_timeline_composition_canary' as const
export {
  STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
  STAGING_RENDER_INFRASTRUCTURE_CANARY_COMPOSITION_ID,
  STAGING_TIMELINE_COMPOSITION_CANARY_COMPOSITION_ID,
} from '../remotion/staging-canary-constants'

const SMOKE_RUN_PATTERN = /^rp-e2e-smoke-[0-9a-f-]{36}$/i
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
const DEFAULT_MAX_ARTIFACT_BYTES = 750_000
const DEFAULT_RENDER_TIMEOUT_SECONDS = 300
const BOUNDED_CANARY_MEMORY = '2Gi'
const BOUNDED_CANARY_CPU = 2
const BOUNDED_CANARY_CONCURRENCY = 1
const BOUNDED_CANARY_NODE_OPTIONS = '--max-old-space-size=1536'
const VERIFIED_STAGING_PROJECT_ID = 'reeditpro'
const VERIFIED_STAGING_REGION = 'us-east1'
const REAL_VIDEO_STATIC_SOURCE_FILE = 'source.mp4'

export interface StagingRenderInfrastructureCanaryRequest {
  canary?: unknown
  mode?: unknown
  smokeRunId?: unknown
  stagingOnly?: unknown
  allowCloudRun?: unknown
  allowRemotion?: unknown
  allowProviders?: unknown
  allowStripe?: unknown
  allowPaymentFlows?: unknown
  allowQueueDrain?: unknown
  allowUserMedia?: unknown
  allowProduction?: unknown
  maxWaitSeconds?: unknown
  allow?: unknown
  safety?: unknown
  fixture?: unknown
  maxDurationSeconds?: unknown
  maxFrames?: unknown
  width?: unknown
  height?: unknown
  fps?: unknown
  cleanup?: unknown
  source?: unknown
  preview?: unknown
  render?: unknown
  analysis?: unknown
  timeline?: unknown
}

export type StagingRenderCanaryMode =
  | typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
  | typeof STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
  | typeof STAGING_TIMELINE_COMPOSITION_CANARY_MODE

export interface BaseStagingRenderCanaryInput {
  canary: true
  mode: StagingRenderCanaryMode
  smokeRunId: string
  maxDurationSeconds: number
  maxFrames: number
  width: number
  height: number
  fps: number
  cleanup: true
}

export interface StagingRenderInfrastructureCanaryInput extends BaseStagingRenderCanaryInput {
  mode: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
  fixture: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE
}

export interface StagingRealVideoUploadPreviewCanaryInput extends BaseStagingRenderCanaryInput {
  mode: typeof STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
  source: {
    bucketName: string
    objectPath: string
    mimeType: 'video/mp4'
    sizeBytes: number
    checksumSha256: string
  }
  preview: {
    bucketName: string
    objectPath: string
  }
}

export interface StagingTimelineCompositionCanaryInput extends BaseStagingRenderCanaryInput {
  mode: typeof STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  source: StagingRealVideoUploadPreviewCanaryInput['source']
  preview: StagingRealVideoUploadPreviewCanaryInput['preview']
  analysis: Record<string, unknown>
  timeline: TimelineCompositionSpec
}

export type StagingRenderCanaryInput =
  | StagingRenderInfrastructureCanaryInput
  | StagingRealVideoUploadPreviewCanaryInput
  | StagingTimelineCompositionCanaryInput

export interface StagingRenderInfrastructureCanaryEnv {
  serviceMode: string
  projectId: string
  googleCloudProject: string
  region: string
  outputBucketOrPrefix: string
  expectedHostSuffix: string
  renderTimeoutSeconds: number
  maxArtifactBytes: number
  memory: string
  cpu: number
  concurrency: number
  nodeOptions: string
  remotionEntrypoint: string
  forbiddenEnvNames: string[]
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
  cleanupDelegatedToCaller?: boolean
  smokeTraceable?: boolean
}

export interface StagingRenderInfrastructureCanaryResult {
  ok: boolean
  status: 'completed' | 'blocked' | 'failed'
  mode: StagingRenderCanaryMode
  smokeRunId?: string
  fixture?: typeof STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE | typeof STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE
  outputArtifact?: StagingRenderInfrastructureCanaryArtifactSummary
  sourceArtifact?: {
    bucketName: string
    objectPath: string
    mimeType: 'video/mp4'
    sizeBytes: number
    checksumSha256: string
    downloaded: boolean
    smokeTraceable: boolean
  }
  timeline?: {
    compositionId: string
    segmentCount: number
    layerCount: number
    captionPlaceholderLayer: boolean
    safeZoneOverlayLayer: boolean
    timingMapFrames: number
  }
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
  download?(input: {
    bucketName: string
    objectPath: string
    localPath: string
  }): Promise<void>
  upload(input: {
    bucketName: string
    objectPath: string
    localPath: string
    checksumSha256: string
    smokeRunId: string
    canaryMode?: StagingRenderCanaryMode
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
    sourcePath?: string
    sourcePublicDir?: string
    sourceStaticFilePath?: string
    timeline?: TimelineCompositionSpec
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
    serviceMode: readClean(source.STAGING_RENDER_CANARY_MODE) ?? '',
    projectId: readClean(source.GCP_PROJECT_ID)
      ?? readClean(source.GOOGLE_CLOUD_PROJECT_ID)
      ?? readClean(source.GOOGLE_CLOUD_PROJECT)
      ?? '',
    googleCloudProject: readClean(source.GOOGLE_CLOUD_PROJECT)
      ?? readClean(source.GOOGLE_CLOUD_PROJECT_ID)
      ?? '',
    region: readClean(source.GCP_REGION)
      ?? readClean(source.GOOGLE_CLOUD_REGION)
      ?? '',
    outputBucketOrPrefix: readClean(source.STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX)
      ?? readClean(source.STAGING_RENDER_CANARY_OUTPUT_BUCKET)
      ?? '',
    expectedHostSuffix: readClean(source.STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX) ?? '.run.app',
    renderTimeoutSeconds: readNumber(source.STAGING_RENDER_CANARY_TIMEOUT_SECONDS, DEFAULT_RENDER_TIMEOUT_SECONDS),
    maxArtifactBytes: readNumber(source.STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES, DEFAULT_MAX_ARTIFACT_BYTES),
    memory: readClean(source.STAGING_RENDER_CANARY_MEMORY) ?? '',
    cpu: readNumber(source.STAGING_RENDER_CANARY_CPU, Number.NaN),
    concurrency: readNumber(source.STAGING_RENDER_CANARY_CONCURRENCY, Number.NaN),
    nodeOptions: readClean(source.NODE_OPTIONS) ?? readClean(source.STAGING_RENDER_CANARY_NODE_OPTIONS) ?? '',
    remotionEntrypoint: readClean(source.STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT)
      ?? path.join(process.cwd(), 'server', 'remotion', 'staging-canary-remotion-entry.ts'),
    forbiddenEnvNames: configuredEnvNames(source, [...STRIPE_ENV_NAME_PATTERNS, ...PROVIDER_ENV_NAME_PATTERNS]),
  }
}

export function validateStagingRenderInfrastructureCanaryRequest(
  payload: StagingRenderInfrastructureCanaryRequest,
): { ok: true; input: StagingRenderInfrastructureCanaryInput } | { ok: false; blockers: string[] } {
  const blockers: string[] = []
  const smokeRunId = typeof payload.smokeRunId === 'string' ? payload.smokeRunId.trim() : ''
  const render = parseTopLevelRenderSettings(payload)
  const mode = payload.mode

  if (payload.canary !== true) blockers.push('canary must be true.')
  if (mode !== STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE) {
    blockers.push(`mode must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}.`)
  }
  if (!SMOKE_RUN_PATTERN.test(smokeRunId)) {
    blockers.push('smokeRunId must match rp-e2e-smoke-<uuid>.')
  }
  if (payload.fixture !== STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE) {
    blockers.push(`fixture must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE}.`)
  }
  if (payload.cleanup !== true) blockers.push('cleanup must be true.')
  validateRenderSettings(render, blockers)
  validateRequestSafetyPayload(payload, blockers)

  if (blockers.length > 0) return { ok: false, blockers }

  return {
    ok: true,
    input: {
      canary: true,
      mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      smokeRunId,
      fixture: STAGING_RENDER_INFRASTRUCTURE_CANARY_FIXTURE,
      maxDurationSeconds: render.maxDurationSeconds,
      maxFrames: render.maxFrames,
      width: render.width,
      height: render.height,
      fps: render.fps,
      cleanup: true,
    },
  }
}

export function validateStagingRealVideoUploadPreviewCanaryRequest(
  payload: StagingRenderInfrastructureCanaryRequest,
): { ok: true; input: StagingRealVideoUploadPreviewCanaryInput } | { ok: false; blockers: string[] } {
  const blockers: string[] = []
  const smokeRunId = typeof payload.smokeRunId === 'string' ? payload.smokeRunId.trim() : ''
  const render = parseNestedRenderSettings(payload.render)
  const source = parseArtifactRef(payload.source)
  const preview = parsePreviewRef(payload.preview)

  if (payload.canary !== true) blockers.push('canary must be true.')
  if (payload.mode !== STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE) {
    blockers.push(`mode must be ${STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE}.`)
  }
  if (!SMOKE_RUN_PATTERN.test(smokeRunId)) {
    blockers.push('smokeRunId must match rp-e2e-smoke-<uuid>.')
  }
  if (payload.fixture !== undefined && payload.fixture !== STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE) {
    blockers.push(`fixture is not required for the real-video canary; if provided it must be ${STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE}.`)
  }
  if (payload.cleanup !== true) blockers.push('cleanup must be true.')
  if (!recordFromUnknown(payload.render)) blockers.push('render settings are required for the real-video canary.')
  validateRenderSettings(render, blockers)
  validateRequestSafetyPayload(payload, blockers)

  if (!source) blockers.push('source bucket/object metadata is required for the real-video canary.')
  if (!preview) blockers.push('preview bucket/object metadata is required for the real-video canary.')
  if (source && !isSafeStagingText(source.bucketName)) {
    blockers.push('source bucket must be staging smoke/canary-scoped and not production-looking.')
  }
  if (preview && !isSafeStagingText(preview.bucketName)) {
    blockers.push('preview bucket must be staging smoke/canary-scoped and not production-looking.')
  }
  if (source && (!source.objectPath.includes(smokeRunId) || !isSmokeCanonicalPath(source.objectPath, 'source-media'))) {
    blockers.push('source object path must be canonical, smoke-tagged, and under source-media.')
  }
  if (preview && (!preview.objectPath.includes(smokeRunId) || !isSmokeCanonicalPath(preview.objectPath, 'previews'))) {
    blockers.push('preview object path must be canonical, smoke-tagged, and under previews.')
  }
  if (source && source.sizeBytes > 250_000) blockers.push('source video fixture must stay below 250000 bytes.')
  if (source && source.mimeType !== 'video/mp4') blockers.push('source video fixture must be video/mp4.')
  if (hasSignedUrlLikeField(payload.source)) blockers.push('source metadata must not include signed URLs or URL fields as canonical storage truth.')
  if (hasSignedUrlLikeField(payload.preview)) blockers.push('preview metadata must not include signed URLs or URL fields as canonical storage truth.')

  if (blockers.length > 0) return { ok: false, blockers }

  return {
    ok: true,
    input: {
      canary: true,
      mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
      smokeRunId,
      maxDurationSeconds: render.maxDurationSeconds,
      maxFrames: render.maxFrames,
      width: render.width,
      height: render.height,
      fps: render.fps,
      cleanup: true,
      source: source!,
      preview: preview!,
    },
  }
}

export function validateStagingTimelineCompositionCanaryRequest(
  payload: StagingRenderInfrastructureCanaryRequest,
): { ok: true; input: StagingTimelineCompositionCanaryInput } | { ok: false; blockers: string[] } {
  const blockers: string[] = []
  const smokeRunId = typeof payload.smokeRunId === 'string' ? payload.smokeRunId.trim() : ''
  const render = parseNestedRenderSettings(payload.render)
  const source = parseArtifactRef(payload.source)
  const preview = parsePreviewRef(payload.preview)
  const timeline = parseTimelineSpec(payload.timeline)
  const analysis = recordFromUnknown(payload.analysis)

  if (payload.canary !== true) blockers.push('canary must be true.')
  if (payload.mode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE) {
    blockers.push(`mode must be ${STAGING_TIMELINE_COMPOSITION_CANARY_MODE}.`)
  }
  if (!SMOKE_RUN_PATTERN.test(smokeRunId)) {
    blockers.push('smokeRunId must match rp-e2e-smoke-<uuid>.')
  }
  if (payload.cleanup !== true) blockers.push('cleanup must be true.')
  if (!recordFromUnknown(payload.render)) blockers.push('render settings are required for the timeline canary.')
  validateRenderSettings(render, blockers)
  validateRequestSafetyPayload(payload, blockers)

  if (!source) blockers.push('source bucket/object metadata is required for the timeline canary.')
  if (!preview) blockers.push('preview bucket/object metadata is required for the timeline canary.')
  if (!analysis) blockers.push('media analysis summary is required for the timeline canary.')
  if (!timeline) blockers.push('timeline spec is required for the timeline canary.')
  if (source && !isSafeStagingText(source.bucketName)) {
    blockers.push('source bucket must be staging smoke/canary-scoped and not production-looking.')
  }
  if (preview && !isSafeStagingText(preview.bucketName)) {
    blockers.push('preview bucket must be staging smoke/canary-scoped and not production-looking.')
  }
  if (source && (!source.objectPath.includes(smokeRunId) || !isSmokeCanonicalPath(source.objectPath, 'source-media'))) {
    blockers.push('source object path must be canonical, smoke-tagged, and under source-media.')
  }
  if (preview && (!preview.objectPath.includes(smokeRunId) || !isSmokeCanonicalPath(preview.objectPath, 'previews'))) {
    blockers.push('preview object path must be canonical, smoke-tagged, and under previews.')
  }
  if (source && source.sizeBytes > 250_000) blockers.push('source video fixture must stay below 250000 bytes.')
  if (source && source.mimeType !== 'video/mp4') blockers.push('source video fixture must be video/mp4.')
  if (hasSignedUrlLikeField(payload.source) || hasSignedUrlLikeField(payload.preview) || hasSignedUrlLikeField(payload.timeline) || hasSignedUrlLikeField(payload.analysis)) {
    blockers.push('timeline canary canonical metadata must not include signed URLs or URL fields.')
  }
  if (timeline) {
    if (timeline.mode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE) blockers.push(`timeline.mode must be ${STAGING_TIMELINE_COMPOSITION_CANARY_MODE}.`)
    if (timeline.smokeRunId !== smokeRunId) blockers.push('timeline smokeRunId must match request smokeRunId.')
    if (timeline.durationSeconds !== 3 || timeline.width !== 160 || timeline.height !== 90 || timeline.fps !== 15 || timeline.totalFrames !== 45) {
      blockers.push('timeline spec must stay fixed at 3s, 160x90, 15fps, and 45 frames.')
    }
    if (timeline.segments.length !== 1) blockers.push('timeline spec must contain exactly one source segment.')
    if (timeline.layers.length !== 3) blockers.push('timeline spec must contain exactly source, caption placeholder, and overlay layers.')
    if (!timeline.layers.some((layer) => layer.layerType === 'caption_placeholder')) blockers.push('timeline spec must include a caption placeholder layer.')
    if (!timeline.layers.some((layer) => layer.layerType === 'safe_zone_overlay' || layer.layerType === 'lower_third_placeholder')) blockers.push('timeline spec must include a safe-zone/lower-third overlay layer.')
    if (!timeline.source.objectPath.includes(smokeRunId) || !isSmokeCanonicalPath(timeline.source.objectPath, 'source-media')) {
      blockers.push('timeline source must reference the smoke-tagged source object path.')
    }
  }

  if (blockers.length > 0) return { ok: false, blockers }

  return {
    ok: true,
    input: {
      canary: true,
      mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      smokeRunId,
      maxDurationSeconds: render.maxDurationSeconds,
      maxFrames: render.maxFrames,
      width: render.width,
      height: render.height,
      fps: render.fps,
      cleanup: true,
      source: source!,
      preview: preview!,
      analysis: analysis!,
      timeline: timeline!,
    },
  }
}

function validateRenderSettings(
  render: {
    maxDurationSeconds: number
    maxFrames: number
    width: number
    height: number
    fps: number
  },
  blockers: string[],
): void {
  if (!isBounded(render.maxDurationSeconds, 1, 3)) blockers.push('maxDurationSeconds must stay between 1 and 3.')
  if (!isBounded(render.width, 16, 320) || !isBounded(render.height, 16, 240)) {
    blockers.push('width/height must stay at or below 320x240.')
  }
  if (!isBounded(render.fps, 1, 30)) blockers.push('fps must stay between 1 and 30.')
  if (!isBounded(render.maxFrames, 1, 90)) blockers.push('maxFrames must stay at or below 90.')
  if (Number.isFinite(render.maxDurationSeconds) && Number.isFinite(render.fps) && Number.isFinite(render.maxFrames)) {
    const requestedFrames = Math.ceil(render.maxDurationSeconds * render.fps)
    if (requestedFrames > render.maxFrames) {
      blockers.push('maxFrames must cover the requested bounded duration and fps.')
    }
  }
}

function parseTopLevelRenderSettings(payload: StagingRenderInfrastructureCanaryRequest): {
  maxDurationSeconds: number
  maxFrames: number
  width: number
  height: number
  fps: number
} {
  return {
    maxDurationSeconds: readUnknownNumber(payload.maxDurationSeconds),
    maxFrames: readUnknownNumber(payload.maxFrames),
    width: readUnknownNumber(payload.width),
    height: readUnknownNumber(payload.height),
    fps: readUnknownNumber(payload.fps),
  }
}

function parseNestedRenderSettings(value: unknown): {
  maxDurationSeconds: number
  maxFrames: number
  width: number
  height: number
  fps: number
} {
  const render = recordFromUnknown(value)
  return {
    maxDurationSeconds: readUnknownNumber(render?.maxDurationSeconds),
    maxFrames: readUnknownNumber(render?.maxFrames),
    width: readUnknownNumber(render?.width),
    height: readUnknownNumber(render?.height),
    fps: readUnknownNumber(render?.fps),
  }
}

export function validateStagingRenderInfrastructureCanaryEnv(
  env: StagingRenderInfrastructureCanaryEnv,
): string[] {
  const blockers: string[] = []
  if (
    env.serviceMode !== STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
    && env.serviceMode !== STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
    && env.serviceMode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  ) {
    blockers.push(`STAGING_RENDER_CANARY_MODE must be ${STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE}, ${STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE}, or ${STAGING_TIMELINE_COMPOSITION_CANARY_MODE}.`)
  }
  if (!env.projectId) {
    blockers.push('GCP_PROJECT_ID is required for the staging Cloud Run Remotion canary service.')
  } else if (PRODUCTION_WORD_PATTERN.test(env.projectId)) {
    blockers.push('GCP_PROJECT_ID must not look production/live.')
  } else if (!isSafeStagingText(env.projectId) && !hasDedicatedNeutralProjectControls(env)) {
    blockers.push('GCP_PROJECT_ID must be staging/test/canary scoped, or be the verified neutral reeditpro staging project with dedicated canary controls.')
  }
  if (!env.googleCloudProject) {
    blockers.push('GOOGLE_CLOUD_PROJECT is required for the staging Cloud Run Remotion canary service.')
  } else if (env.googleCloudProject !== env.projectId) {
    blockers.push('GOOGLE_CLOUD_PROJECT must match GCP_PROJECT_ID for the staging canary service.')
  } else if (PRODUCTION_WORD_PATTERN.test(env.googleCloudProject)) {
    blockers.push('GOOGLE_CLOUD_PROJECT must not look production/live.')
  }
  if (!env.region) {
    blockers.push('GCP_REGION is required for the staging Cloud Run Remotion canary service.')
  } else if (env.region !== VERIFIED_STAGING_REGION) {
    blockers.push(`GCP_REGION must be ${VERIFIED_STAGING_REGION} for this staging canary service.`)
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
  if (env.renderTimeoutSeconds !== DEFAULT_RENDER_TIMEOUT_SECONDS) {
    blockers.push('STAGING_RENDER_CANARY_TIMEOUT_SECONDS must be exactly 300 for this bounded Remotion canary.')
  }
  if (env.memory !== BOUNDED_CANARY_MEMORY) {
    blockers.push('STAGING_RENDER_CANARY_MEMORY must be exactly 2Gi for this bounded Remotion canary.')
  }
  if (env.cpu !== BOUNDED_CANARY_CPU) {
    blockers.push('STAGING_RENDER_CANARY_CPU must be exactly 2 for this bounded Remotion canary.')
  }
  if (env.concurrency !== BOUNDED_CANARY_CONCURRENCY) {
    blockers.push('STAGING_RENDER_CANARY_CONCURRENCY must be exactly 1 for this bounded Remotion canary.')
  }
  if (env.nodeOptions !== BOUNDED_CANARY_NODE_OPTIONS) {
    blockers.push('NODE_OPTIONS must be exactly --max-old-space-size=1536 for this bounded Remotion canary.')
  }
  if (!isBounded(env.maxArtifactBytes, 1, DEFAULT_MAX_ARTIFACT_BYTES)) {
    blockers.push(`STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES must stay below ${DEFAULT_MAX_ARTIFACT_BYTES}.`)
  }
  if (!env.remotionEntrypoint || !/canary|smoke/i.test(env.remotionEntrypoint) || PRODUCTION_WORD_PATTERN.test(env.remotionEntrypoint)) {
    blockers.push('STAGING_RENDER_CANARY_REMOTION_ENTRYPOINT must be smoke/canary-scoped and not production-looking.')
  }
  for (const name of env.forbiddenEnvNames) {
    blockers.push(`${name} is configured; provider, Stripe, payment, and billing env must be absent for this staging canary service.`)
  }
  return blockers
}

export async function runStagingRenderInfrastructureCanary(
  payload: StagingRenderInfrastructureCanaryRequest,
  env: StagingRenderInfrastructureCanaryEnv = loadStagingRenderInfrastructureCanaryEnv(),
  deps: StagingRenderInfrastructureCanaryDeps = {},
): Promise<StagingRenderInfrastructureCanaryResult> {
  const realVideoRequest = payload.mode === STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
  const timelineRequest = payload.mode === STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  const requestValidation = timelineRequest
    ? validateStagingTimelineCompositionCanaryRequest(payload)
    : realVideoRequest
      ? validateStagingRealVideoUploadPreviewCanaryRequest(payload)
      : validateStagingRenderInfrastructureCanaryRequest(payload)
  const requestInput = requestValidation.ok ? requestValidation.input : undefined
  const envBlockers = validateStagingRenderInfrastructureCanaryEnv(env)
  const blockers = [
    ...(requestValidation.ok ? [] : requestValidation.blockers),
    ...envBlockers,
  ]
  if (blockers.length > 0) {
    const blockedMode = timelineRequest
      ? STAGING_TIMELINE_COMPOSITION_CANARY_MODE
      : realVideoRequest ? STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE : STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
    return blockedResult(blockers, requestInput?.smokeRunId, blockedMode)
  }

  const input = requestInput!
  if (input.mode === STAGING_TIMELINE_COMPOSITION_CANARY_MODE) {
    return runStagingTimelineCompositionCanary(input, env, deps)
  }
  if (input.mode === STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE) {
    return runStagingRealVideoUploadPreviewCanary(input, env, deps)
  }

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
    const message = canaryErrorMessage(error)
    return {
      ok: false,
      status: 'failed',
      mode: STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      strictValidation: strictValidation([message], true),
      error: {
        code: 'staging_render_infrastructure_canary_failed',
        message,
      },
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function runStagingRealVideoUploadPreviewCanary(
  input: StagingRealVideoUploadPreviewCanaryInput,
  env: StagingRenderInfrastructureCanaryEnv,
  deps: StagingRenderInfrastructureCanaryDeps,
): Promise<StagingRenderInfrastructureCanaryResult> {
  const tempDir = path.join(os.tmpdir(), 'reeditpro-canary', input.smokeRunId)
  const publicDir = path.join(tempDir, 'public')
  const sourcePath = path.join(tempDir, REAL_VIDEO_STATIC_SOURCE_FILE)
  const publicSourcePath = path.join(publicDir, REAL_VIDEO_STATIC_SOURCE_FILE)
  const outputPath = path.join(tempDir, 'tiny-preview.mp4')
  const renderer = deps.renderer ?? { render: renderUploadedSourceRemotionCanary }
  const store = deps.artifactStore ?? new GcsCanaryArtifactStore(env.projectId)

  try {
    await rm(tempDir, { recursive: true, force: true })
    await mkdir(publicDir, { recursive: true })
    if (!store.download) {
      throw new Error('The real-video upload-to-preview canary requires a GCS artifact store with download support.')
    }
    await store.download({
      bucketName: input.source.bucketName,
      objectPath: input.source.objectPath,
      localPath: sourcePath,
    })
    const sourceStat = await stat(sourcePath)
    if (sourceStat.size !== input.source.sizeBytes) {
      throw new Error('Downloaded source video size did not match registered smoke metadata.')
    }
    const sourceChecksum = await sha256File(sourcePath)
    if (sourceChecksum !== input.source.checksumSha256) {
      throw new Error('Downloaded source video checksum did not match registered smoke metadata.')
    }
    if (sourceStat.size <= 0 || sourceStat.size > 250_000) {
      throw new Error('Downloaded source video is outside the tiny staging fixture bounds.')
    }
    await copyFile(sourcePath, publicSourcePath)
    const publicSourceStat = await stat(publicSourcePath)
    if (publicSourceStat.size !== sourceStat.size) {
      throw new Error('Prepared Remotion static source video size did not match downloaded smoke source.')
    }

    await renderer.render({
      outputPath,
      sourcePath,
      sourcePublicDir: publicDir,
      sourceStaticFilePath: REAL_VIDEO_STATIC_SOURCE_FILE,
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
      throw new Error(`Rendered real-video canary preview size ${fileStat.size} is outside the allowed staging canary bounds.`)
    }
    const checksumSha256 = await sha256File(outputPath)
    await store.upload({
      bucketName: input.preview.bucketName,
      objectPath: input.preview.objectPath,
      localPath: outputPath,
      checksumSha256,
      smokeRunId: input.smokeRunId,
      canaryMode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
    })
    const existsBeforeCleanup = await store.exists(input.preview.bucketName, input.preview.objectPath)
    if (!existsBeforeCleanup) throw new Error('Uploaded real-video preview artifact was not readable before caller cleanup.')

    return {
      ok: true,
      status: 'completed',
      mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      sourceArtifact: {
        ...input.source,
        downloaded: true,
        smokeTraceable: input.source.objectPath.includes(input.smokeRunId),
      },
      outputArtifact: {
        bucketName: input.preview.bucketName,
        objectPath: input.preview.objectPath,
        mimeType: 'video/mp4',
        sizeBytes: fileStat.size,
        checksumSha256,
        durationSeconds: input.maxDurationSeconds,
        width: input.width,
        height: input.height,
        fps: input.fps,
        frameCount: Math.ceil(input.maxDurationSeconds * input.fps),
        existsBeforeCleanup,
        deleted: false,
        existsAfterCleanup: true,
        cleanupDelegatedToCaller: true,
        smokeTraceable: input.preview.objectPath.includes(input.smokeRunId),
      },
      remotion: {
        renderer: 'renderMedia',
        bundler: 'bundle',
        selector: 'selectComposition',
        compositionId: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
      },
      strictValidation: strictValidation([], true),
    }
  } catch (error) {
    const message = canaryErrorMessage(error)
    return {
      ok: false,
      status: 'failed',
      mode: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      strictValidation: strictValidation([message], true),
      error: {
        code: 'staging_real_video_upload_preview_canary_failed',
        message,
      },
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

async function runStagingTimelineCompositionCanary(
  input: StagingTimelineCompositionCanaryInput,
  env: StagingRenderInfrastructureCanaryEnv,
  deps: StagingRenderInfrastructureCanaryDeps,
): Promise<StagingRenderInfrastructureCanaryResult> {
  const tempDir = path.join(os.tmpdir(), 'reeditpro-canary', input.smokeRunId)
  const publicDir = path.join(tempDir, 'public')
  const sourcePath = path.join(tempDir, REAL_VIDEO_STATIC_SOURCE_FILE)
  const publicSourcePath = path.join(publicDir, REAL_VIDEO_STATIC_SOURCE_FILE)
  const outputPath = path.join(tempDir, 'timeline-preview.mp4')
  const renderer = deps.renderer ?? { render: renderTimelineCompositionRemotionCanary }
  const store = deps.artifactStore ?? new GcsCanaryArtifactStore(env.projectId)

  try {
    await rm(tempDir, { recursive: true, force: true })
    await mkdir(publicDir, { recursive: true })
    if (!store.download) {
      throw new Error('The timeline composition canary requires a GCS artifact store with download support.')
    }
    await store.download({
      bucketName: input.source.bucketName,
      objectPath: input.source.objectPath,
      localPath: sourcePath,
    })
    const sourceStat = await stat(sourcePath)
    if (sourceStat.size !== input.source.sizeBytes) {
      throw new Error('Downloaded timeline source video size did not match registered smoke metadata.')
    }
    const sourceChecksum = await sha256File(sourcePath)
    if (sourceChecksum !== input.source.checksumSha256) {
      throw new Error('Downloaded timeline source video checksum did not match registered smoke metadata.')
    }
    if (sourceStat.size <= 0 || sourceStat.size > 250_000) {
      throw new Error('Downloaded timeline source video is outside the tiny staging fixture bounds.')
    }
    await copyFile(sourcePath, publicSourcePath)
    const publicSourceStat = await stat(publicSourcePath)
    if (publicSourceStat.size !== sourceStat.size) {
      throw new Error('Prepared timeline Remotion static source video size did not match downloaded smoke source.')
    }

    await renderer.render({
      outputPath,
      sourcePath,
      sourcePublicDir: publicDir,
      sourceStaticFilePath: REAL_VIDEO_STATIC_SOURCE_FILE,
      smokeRunId: input.smokeRunId,
      width: input.width,
      height: input.height,
      fps: input.fps,
      durationSeconds: input.maxDurationSeconds,
      timeoutSeconds: env.renderTimeoutSeconds,
      remotionEntrypoint: env.remotionEntrypoint,
      timeline: input.timeline,
    })

    const fileStat = await stat(outputPath)
    if (fileStat.size <= 0 || fileStat.size > env.maxArtifactBytes) {
      throw new Error(`Rendered timeline canary preview size ${fileStat.size} is outside the allowed staging canary bounds.`)
    }
    const checksumSha256 = await sha256File(outputPath)
    await store.upload({
      bucketName: input.preview.bucketName,
      objectPath: input.preview.objectPath,
      localPath: outputPath,
      checksumSha256,
      smokeRunId: input.smokeRunId,
      canaryMode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
    })
    const existsBeforeCleanup = await store.exists(input.preview.bucketName, input.preview.objectPath)
    if (!existsBeforeCleanup) throw new Error('Uploaded timeline preview artifact was not readable before caller cleanup.')

    return {
      ok: true,
      status: 'completed',
      mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      sourceArtifact: {
        ...input.source,
        downloaded: true,
        smokeTraceable: input.source.objectPath.includes(input.smokeRunId),
      },
      outputArtifact: {
        bucketName: input.preview.bucketName,
        objectPath: input.preview.objectPath,
        mimeType: 'video/mp4',
        sizeBytes: fileStat.size,
        checksumSha256,
        durationSeconds: input.maxDurationSeconds,
        width: input.width,
        height: input.height,
        fps: input.fps,
        frameCount: Math.ceil(input.maxDurationSeconds * input.fps),
        existsBeforeCleanup,
        deleted: false,
        existsAfterCleanup: true,
        cleanupDelegatedToCaller: true,
        smokeTraceable: input.preview.objectPath.includes(input.smokeRunId),
      },
      timeline: {
        compositionId: STAGING_TIMELINE_COMPOSITION_CANARY_COMPOSITION_ID,
        segmentCount: input.timeline.segments.length,
        layerCount: input.timeline.layers.length,
        captionPlaceholderLayer: input.timeline.layers.some((layer) => layer.layerType === 'caption_placeholder'),
        safeZoneOverlayLayer: input.timeline.layers.some((layer) => layer.layerType === 'safe_zone_overlay' || layer.layerType === 'lower_third_placeholder'),
        timingMapFrames: input.timeline.timingMap.totalFrames,
      },
      remotion: {
        renderer: 'renderMedia',
        bundler: 'bundle',
        selector: 'selectComposition',
        compositionId: STAGING_TIMELINE_COMPOSITION_CANARY_COMPOSITION_ID,
      },
      strictValidation: strictValidation([], true),
    }
  } catch (error) {
    const message = canaryErrorMessage(error)
    return {
      ok: false,
      status: 'failed',
      mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
      smokeRunId: input.smokeRunId,
      strictValidation: strictValidation([message], true),
      error: {
        code: 'staging_timeline_composition_canary_failed',
        message,
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

async function renderUploadedSourceRemotionCanary(input: Parameters<CanaryRenderer['render']>[0]): Promise<void> {
  if (!input.sourcePath) throw new Error('Real-video canary render requires a downloaded source video path.')
  if (!input.sourcePublicDir) throw new Error('Real-video canary render requires a Remotion public directory.')
  if (!input.sourceStaticFilePath || !isSafeStaticSourceFile(input.sourceStaticFilePath)) {
    throw new Error('Real-video canary render requires a short safe static source file path.')
  }
  if (!existsSync(input.remotionEntrypoint)) {
    throw new Error('Staging canary Remotion entrypoint is missing from the Cloud Run image.')
  }

  const sourceStat = await stat(input.sourcePath)
  if (sourceStat.size <= 0 || sourceStat.size > 250_000) {
    throw new Error('Real-video canary source video must stay below 250000 bytes.')
  }
  const publicSourcePath = path.join(input.sourcePublicDir, input.sourceStaticFilePath)
  const publicSourceStat = await stat(publicSourcePath)
  if (publicSourceStat.size !== sourceStat.size) {
    throw new Error('Real-video canary static source file does not match downloaded source size.')
  }

  const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ])
  const serveUrl = await bundle({
    entryPoint: input.remotionEntrypoint,
    publicDir: input.sourcePublicDir,
    symlinkPublicDir: false,
  })
  const inputProps = {
    smokeRunId: input.smokeRunId,
    durationSeconds: input.durationSeconds,
    sourceStaticFilePath: input.sourceStaticFilePath,
  }
  const composition = await selectComposition({
    serveUrl,
    id: STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_COMPOSITION_ID,
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

async function renderTimelineCompositionRemotionCanary(input: Parameters<CanaryRenderer['render']>[0]): Promise<void> {
  if (!input.sourcePath) throw new Error('Timeline canary render requires a downloaded source video path.')
  if (!input.sourcePublicDir) throw new Error('Timeline canary render requires a Remotion public directory.')
  if (!input.sourceStaticFilePath || !isSafeStaticSourceFile(input.sourceStaticFilePath)) {
    throw new Error('Timeline canary render requires a short safe static source file path.')
  }
  if (!input.timeline) throw new Error('Timeline canary render requires a bounded timeline spec.')
  if (!existsSync(input.remotionEntrypoint)) {
    throw new Error('Staging canary Remotion entrypoint is missing from the Cloud Run image.')
  }

  const sourceStat = await stat(input.sourcePath)
  if (sourceStat.size <= 0 || sourceStat.size > 250_000) {
    throw new Error('Timeline canary source video must stay below 250000 bytes.')
  }
  const publicSourcePath = path.join(input.sourcePublicDir, input.sourceStaticFilePath)
  const publicSourceStat = await stat(publicSourcePath)
  if (publicSourceStat.size !== sourceStat.size) {
    throw new Error('Timeline canary static source file does not match downloaded source size.')
  }

  const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
    import('@remotion/bundler'),
    import('@remotion/renderer'),
  ])
  const serveUrl = await bundle({
    entryPoint: input.remotionEntrypoint,
    publicDir: input.sourcePublicDir,
    symlinkPublicDir: false,
  })
  const inputProps = {
    smokeRunId: input.smokeRunId,
    durationSeconds: input.durationSeconds,
    sourceStaticFilePath: input.sourceStaticFilePath,
    timeline: input.timeline,
  }
  const composition = await selectComposition({
    serveUrl,
    id: STAGING_TIMELINE_COMPOSITION_CANARY_COMPOSITION_ID,
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
    videoBitrate: '240K',
  })
}

function isSafeStaticSourceFile(value: string): boolean {
  const lower = value.toLowerCase()
  return value === REAL_VIDEO_STATIC_SOURCE_FILE
    && !lower.includes('data:video')
    && !lower.includes('base64')
    && !lower.includes('/proxy?src=data')
    && !lower.startsWith('http://')
    && !lower.startsWith('https://')
    && !lower.startsWith('file:')
    && !value.startsWith('/')
    && !/^[a-z]:/i.test(value)
    && !value.includes('\\')
    && !value.split('/').includes('..')
}

class GcsCanaryArtifactStore implements CanaryArtifactStore {
  private readonly storage: Storage

  constructor(projectId: string) {
    this.storage = new Storage({ projectId })
  }

  async download(input: {
    bucketName: string
    objectPath: string
    localPath: string
  }): Promise<void> {
    await this.storage.bucket(input.bucketName).file(input.objectPath).download({
      destination: input.localPath,
    })
  }

  async upload(input: {
    bucketName: string
    objectPath: string
    localPath: string
    checksumSha256: string
    smokeRunId: string
    canaryMode?: StagingRenderCanaryMode
  }): Promise<void> {
    await this.storage.bucket(input.bucketName).upload(input.localPath, {
      destination: input.objectPath,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          smokeRunId: input.smokeRunId,
          checksumSha256: input.checksumSha256,
          canary: input.canaryMode ?? STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
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

function parseArtifactRef(value: unknown): StagingRealVideoUploadPreviewCanaryInput['source'] | undefined {
  const record = recordFromUnknown(value)
  if (!record) return undefined
  const bucketName = typeof record.bucketName === 'string' ? record.bucketName.trim() : ''
  const objectPath = typeof record.objectPath === 'string' ? record.objectPath.trim() : ''
  const mimeType = record.mimeType === 'video/mp4' ? 'video/mp4' : undefined
  const sizeBytes = readUnknownNumber(record.sizeBytes)
  const checksumSha256 = typeof record.checksumSha256 === 'string' ? record.checksumSha256.trim() : ''
  if (!bucketName || !objectPath || !mimeType || !isBounded(sizeBytes, 1, 250_000) || !/^[a-f0-9]{64}$/i.test(checksumSha256)) {
    return undefined
  }
  return { bucketName, objectPath: normalizeCanaryObjectPath(objectPath), mimeType, sizeBytes, checksumSha256 }
}

function parsePreviewRef(value: unknown): StagingRealVideoUploadPreviewCanaryInput['preview'] | undefined {
  const record = recordFromUnknown(value)
  if (!record) return undefined
  const bucketName = typeof record.bucketName === 'string' ? record.bucketName.trim() : ''
  const objectPath = typeof record.objectPath === 'string' ? record.objectPath.trim() : ''
  if (!bucketName || !objectPath) return undefined
  return { bucketName, objectPath: normalizeCanaryObjectPath(objectPath) }
}

function parseTimelineSpec(value: unknown): TimelineCompositionSpec | undefined {
  const record = recordFromUnknown(value)
  if (!record) return undefined
  const source = recordFromUnknown(record.source)
  const timingMap = recordFromUnknown(record.timingMap)
  const qaExpectations = recordFromUnknown(record.qaExpectations)
  const segments = Array.isArray(record.segments) ? record.segments.filter((item) => recordFromUnknown(item)) : []
  const layers = Array.isArray(record.layers) ? record.layers.filter((item) => recordFromUnknown(item)) : []
  if (
    record.mode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE
    || typeof record.smokeRunId !== 'string'
    || record.durationSeconds !== 3
    || record.width !== 160
    || record.height !== 90
    || record.fps !== 15
    || record.totalFrames !== 45
    || !source
    || !timingMap
    || !qaExpectations
    || segments.length !== 1
    || layers.length !== 3
  ) {
    return undefined
  }
  return record as unknown as TimelineCompositionSpec
}

function hasSignedUrlLikeField(value: unknown): boolean {
  const record = recordFromUnknown(value)
  if (!record) return false
  return Object.entries(record).some(([key, fieldValue]) => {
    const normalizedKey = key.toLowerCase()
    if (normalizedKey === 'signedurlsstoredascanonicaltruth') return fieldValue !== false
    if (normalizedKey.includes('signed') || normalizedKey === 'url' || normalizedKey === 'signedurl' || normalizedKey === 'signed_url' || normalizedKey.endsWith('_url')) return true
    if (typeof fieldValue === 'string') {
      const trimmed = fieldValue.trim()
      return /^https?:\/\//i.test(trimmed)
        || /^data:video/i.test(trimmed)
        || /base64/i.test(trimmed)
        || /\/proxy\?src=data/i.test(trimmed)
    }
    if (Array.isArray(fieldValue)) return fieldValue.some((item) => hasSignedUrlLikeField(item))
    return hasSignedUrlLikeField(fieldValue)
  })
}

function normalizeCanaryObjectPath(input: string): string {
  return input.replace(/\\/g, '/').split('/').filter(Boolean).join('/')
}

function isSmokeCanonicalPath(objectPath: string, segment: 'source-media' | 'previews'): boolean {
  if (objectPath.includes('..') || objectPath.includes('://')) return false
  return objectPath.startsWith('workspaces/')
    && objectPath.includes('/projects/')
    && objectPath.includes(`/${segment}/`)
    && !PRODUCTION_WORD_PATTERN.test(objectPath)
}

function hasDedicatedNeutralProjectControls(env: StagingRenderInfrastructureCanaryEnv): boolean {
  if (env.projectId !== VERIFIED_STAGING_PROJECT_ID) return false
  if (env.googleCloudProject !== VERIFIED_STAGING_PROJECT_ID) return false
  if (env.region !== VERIFIED_STAGING_REGION) return false
  if (
    env.serviceMode !== STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE
    && env.serviceMode !== STAGING_REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
    && env.serviceMode !== STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  ) return false
  if (env.expectedHostSuffix !== '.run.app') return false
  if (!isBounded(env.renderTimeoutSeconds, 30, 300)) return false
  if (env.renderTimeoutSeconds !== DEFAULT_RENDER_TIMEOUT_SECONDS) return false
  if (env.memory !== BOUNDED_CANARY_MEMORY) return false
  if (env.cpu !== BOUNDED_CANARY_CPU) return false
  if (env.concurrency !== BOUNDED_CANARY_CONCURRENCY) return false
  if (env.nodeOptions !== BOUNDED_CANARY_NODE_OPTIONS) return false
  if (!isBounded(env.maxArtifactBytes, 1, DEFAULT_MAX_ARTIFACT_BYTES)) return false
  try {
    validateBucketPrefix(parseBucketPrefix(env.outputBucketOrPrefix))
  } catch {
    return false
  }
  return true
}

function isSafeStagingText(value: string): boolean {
  return /staging|canary|smoke|test/i.test(value) && !PRODUCTION_WORD_PATTERN.test(value)
}

function configuredEnvNames(sourceEnv: Record<string, string | undefined>, patterns: RegExp[]): string[] {
  return Object.entries(sourceEnv)
    .filter(([, value]) => Boolean(readClean(value)))
    .map(([name]) => name)
    .filter((name) => patterns.some((pattern) => pattern.test(name)))
    .sort()
}

async function sha256File(filePath: string): Promise<string> {
  const bytes = await readFile(filePath)
  return createHash('sha256').update(bytes).digest('hex')
}

function blockedResult(
  blockers: string[],
  smokeRunId?: string,
  mode: StagingRenderCanaryMode = STAGING_RENDER_INFRASTRUCTURE_CANARY_MODE,
): StagingRenderInfrastructureCanaryResult {
  return {
    ok: false,
    status: 'blocked',
    mode,
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

function validateRequestSafetyPayload(
  payload: StagingRenderInfrastructureCanaryRequest,
  blockers: string[],
): void {
  requireOptionalBoolean(payload.stagingOnly, true, 'stagingOnly', blockers)
  requireOptionalBoolean(payload.allowCloudRun, true, 'allowCloudRun', blockers)
  requireOptionalBoolean(payload.allowRemotion, true, 'allowRemotion', blockers)
  requireOptionalBoolean(payload.allowProviders, false, 'allowProviders', blockers)
  requireOptionalBoolean(payload.allowStripe, false, 'allowStripe', blockers)
  requireOptionalBoolean(payload.allowPaymentFlows, false, 'allowPaymentFlows', blockers)
  requireOptionalBoolean(payload.allowQueueDrain, false, 'allowQueueDrain', blockers)
  requireOptionalBoolean(payload.allowUserMedia, false, 'allowUserMedia', blockers)
  requireOptionalBoolean(payload.allowProduction, false, 'allowProduction', blockers)

  if (payload.maxWaitSeconds !== undefined && !isBounded(readUnknownNumber(payload.maxWaitSeconds), 30, 300)) {
    blockers.push('maxWaitSeconds must stay between 30 and 300.')
  }

  const allow = recordFromUnknown(payload.allow)
  if (allow) {
    requireOptionalBoolean(allow.writes, true, 'allow.writes', blockers)
    requireOptionalBoolean(allow.renderExecution, true, 'allow.renderExecution', blockers)
    requireOptionalBoolean(allow.cloudRun, true, 'allow.cloudRun', blockers)
    requireOptionalBoolean(allow.remotion, true, 'allow.remotion', blockers)
    if (payload.mode === STAGING_TIMELINE_COMPOSITION_CANARY_MODE) {
      requireOptionalBoolean(allow.timelineComposition, true, 'allow.timelineComposition', blockers)
    }
    requireOptionalBoolean(allow.providers, false, 'allow.providers', blockers)
    requireOptionalBoolean(allow.providerCalls, false, 'allow.providerCalls', blockers)
    requireOptionalBoolean(allow.stripe, false, 'allow.stripe', blockers)
    requireOptionalBoolean(allow.paymentFlows, false, 'allow.paymentFlows', blockers)
    requireOptionalBoolean(allow.queueDrain, false, 'allow.queueDrain', blockers)
    requireOptionalBoolean(allow.userMedia, false, 'allow.userMedia', blockers)
    requireOptionalBoolean(allow.production, false, 'allow.production', blockers)
  }

  const safety = recordFromUnknown(payload.safety)
  if (safety) {
    requireOptionalBoolean(safety.providerCallsEnabled, false, 'safety.providerCallsEnabled', blockers)
    requireOptionalBoolean(safety.stripeCallsEnabled, false, 'safety.stripeCallsEnabled', blockers)
    requireOptionalBoolean(safety.paymentFlowsEnabled, false, 'safety.paymentFlowsEnabled', blockers)
    requireOptionalBoolean(safety.queueDrainEnabled, false, 'safety.queueDrainEnabled', blockers)
    requireOptionalBoolean(safety.userMediaEnabled, false, 'safety.userMediaEnabled', blockers)
    requireOptionalBoolean(safety.productionEnabled, false, 'safety.productionEnabled', blockers)
    if (safety.boundedTimeoutSeconds !== undefined && !isBounded(readUnknownNumber(safety.boundedTimeoutSeconds), 30, 300)) {
      blockers.push('safety.boundedTimeoutSeconds must stay between 30 and 300.')
    }
  }
}

function requireOptionalBoolean(
  value: unknown,
  expected: boolean,
  name: string,
  blockers: string[],
): void {
  if (value === undefined) return
  if (value !== expected) blockers.push(`${name} must be ${String(expected)}.`)
}

function recordFromUnknown(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
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
