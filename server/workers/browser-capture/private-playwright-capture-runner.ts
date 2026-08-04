import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

import {
  approvedToolWorkManifestRef,
  createApprovedPrivateArtifactToolOperationEvidence,
  requireApprovedExecutableToolStrategyOperation,
  type ApprovedToolWorkManifest,
} from '../../edit-architecture/approved-tool-work-manifest'
import { ApiError } from '../../errors/api-error'
import { assertPathInsideRoot } from '../../media/local-media-paths'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND,
  PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID,
  type ApprovedPrivateBrowserCaptureSpec,
  type ApprovedPrivateBrowserCaptureTextTokens,
  type PrivatePlaywrightCaptureArtifact,
  type PrivatePlaywrightCaptureImageProbe,
} from './private-playwright-capture-types'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CAPTURE_WIDTH = 640
const CAPTURE_HEIGHT = 360
const MAX_CAPTURE_BYTES = 8 * 1024 * 1024

export async function runApprovedPrivatePlaywrightCapture(input: {
  manifest: ApprovedToolWorkManifest
  operationId: string
  localStorageRoot: string
  completedAt?: string
}): Promise<PrivatePlaywrightCaptureArtifact> {
  const operation = requireApprovedExecutableToolStrategyOperation(input.manifest, input.operationId, 'playwright')
  const spec = approvedCaptureSpecFromOperation(operation.settings)
  const sourceSpecSha256 = sha256(stableStringify(spec))
  const operationScopeHash = sha256(operation.operationId).slice(0, 20)
  const artifactId = `private-playwright-capture:${input.manifest.fingerprintSha256.slice(0, 20)}:${operationScopeHash}:${sourceSpecSha256.slice(0, 16)}`
  const storageObjectPath = join(
    'edit-execution',
    collisionResistantPathPart(input.manifest.workspaceId),
    collisionResistantPathPart(input.manifest.projectId),
    collisionResistantPathPart(input.manifest.approvedPlanSnapshotId),
    'approved-tool-output',
    'playwright',
    `${collisionResistantPathPart(operation.operationId)}-${sourceSpecSha256.slice(0, 16)}.png`,
  )
  const localFilePath = assertPathInsideRoot(input.localStorageRoot, join(input.localStorageRoot, storageObjectPath))
  const startedAt = Date.now()
  // Re-render before accepting a deterministic-path artifact. A valid PNG with the
  // same dimensions is not sufficient proof of provenance; byte equality binds
  // reuse to the current fixed template and approved structured source spec.
  const capture = await createCaptureBytes(spec)
  const existing = await readExistingCapture(
    input.localStorageRoot,
    storageObjectPath,
    spec,
    sourceSpecSha256,
    capture.bytes,
  )
  let reusedExistingArtifact = Boolean(existing)

  if (!existing) {
    try {
      const writeResult = await writePrivateFileCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: storageObjectPath,
        content: capture.bytes,
      })
      reusedExistingArtifact = !writeResult.created
    } catch (error) {
      if (!isCreateOnlyCaptureRace(error)) throw error
      const concurrentArtifact = await waitForConcurrentCapture({
        rootPath: input.localStorageRoot,
        relativePath: storageObjectPath,
        spec,
        sourceSpecSha256,
        expectedBytes: capture.bytes,
      })
      if (!concurrentArtifact) throw error
      reusedExistingArtifact = true
    }
  }

  const persistedBytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: storageObjectPath,
  })
  if (!persistedBytes) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Private Playwright capture disappeared before evidence could be created.',
      409,
      { reason: 'private_playwright_capture_missing_after_persistence' },
    )
  }
  assertDeterministicCaptureBytes(persistedBytes, capture.bytes, sourceSpecSha256)
  const persistedProbe = validatePngBytes(persistedBytes, spec, sourceSpecSha256)
  const outputSha256 = sha256(persistedBytes)
  const completedAt = input.completedAt ?? new Date().toISOString()
  const toolOperationEvidence = createApprovedPrivateArtifactToolOperationEvidence({
    manifest: input.manifest,
    operationId: operation.operationId,
    operationInstanceId: `${operation.operationId}:artifact:${artifactId}`,
    workspaceId: input.manifest.workspaceId,
    projectId: input.manifest.projectId,
    creditReservationId: input.manifest.creditReservationId,
    outputArtifactId: artifactId,
    outputSha256,
    outputByteSize: persistedBytes.byteLength,
    sourceSpecSha256,
    elapsedMilliseconds: Math.max(1, Date.now() - startedAt),
    imageProbe: persistedProbe,
    qaChecks: [
      'Playwright rendered the fixed server-owned capture template from approved structured text tokens.',
      'PNG signature, IHDR dimensions, checksum, byte size, private path, and zero-network policy passed.',
    ],
    completedAt,
  })

  return Object.freeze({
    artifactId,
    operationId: operation.operationId,
    workspaceId: input.manifest.workspaceId,
    projectId: input.manifest.projectId,
    approvedPlanSnapshotId: input.manifest.approvedPlanSnapshotId,
    creditReservationId: input.manifest.creditReservationId,
    storageProvider: 'local_private',
    storageObjectPath: relative(input.localStorageRoot, localFilePath).split('\\').join('/'),
    localFilePath,
    mimeType: 'image/png',
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    sourceOfTruth: true,
    sourceOfTruthScope: 'approved_playwright_private_capture',
    sha256: outputSha256,
    byteSize: persistedBytes.byteLength,
    width: persistedProbe.width,
    height: persistedProbe.height,
    sourceSpecSha256,
    networkRequestCount: 0,
    rendererLayerIds: [...operation.rendererLayerIds],
    segmentIds: [...operation.segmentIds],
    assetPlanItemIds: [...operation.assetPlanItemIds],
    workItemIds: [...operation.sourceReferences.workItemIds],
    reusedExistingArtifact,
    toolWorkManifestRef: approvedToolWorkManifestRef(input.manifest),
    toolOperationEvidence,
    createdAt: completedAt,
  })
}

export function approvedCaptureSpecFromOperation(settings: Record<string, unknown>): ApprovedPrivateBrowserCaptureSpec {
  const allowedSettingIds = new Set([
    'captureSourceKind',
    'captureTemplateId',
    'captureAuthorizationConfirmed',
    'captureTextTokens',
    'viewportWidth',
    'viewportHeight',
    'deviceScaleFactor',
  ])
  const unsupportedSettingIds = Object.keys(settings).filter((settingId) => !allowedSettingIds.has(settingId))
  if (unsupportedSettingIds.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture only accepts the fixed capture specification.', 400, {
      unsupportedSettingIds,
    })
  }
  if (settings.captureSourceKind !== PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture requires approved_internal_html_v1 source kind.', 400)
  }
  if (settings.captureTemplateId !== PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture requires the fixed server-owned capture template.', 400)
  }
  if (settings.captureAuthorizationConfirmed !== true) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture requires explicit approved capture authorization.', 400)
  }
  if (settings.url || settings.rawHtml || settings.html || settings.javascript || settings.css || settings.authHeaders || settings.cookies) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture rejects URL, raw HTML, JavaScript, CSS, authentication, and cookie inputs.', 400)
  }
  const textTokens = validateTextTokens(settings.captureTextTokens)
  const viewportWidth = numberSetting(settings.viewportWidth, CAPTURE_WIDTH)
  const viewportHeight = numberSetting(settings.viewportHeight, CAPTURE_HEIGHT)
  const deviceScaleFactor = numberSetting(settings.deviceScaleFactor, 1)
  if (viewportWidth !== CAPTURE_WIDTH || viewportHeight !== CAPTURE_HEIGHT || deviceScaleFactor !== 1) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture v1 requires the fixed 640x360 viewport at device scale factor 1.', 400)
  }
  return {
    sourceKind: PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND,
    templateId: PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID,
    authorizationConfirmed: true,
    viewportWidth: CAPTURE_WIDTH,
    viewportHeight: CAPTURE_HEIGHT,
    deviceScaleFactor: 1,
    textTokens,
  }
}

async function createCaptureBytes(spec: ApprovedPrivateBrowserCaptureSpec): Promise<{
  bytes: Buffer
  probe: PrivatePlaywrightCaptureImageProbe
}> {
  let chromium: typeof import('@playwright/test')['chromium']
  try {
    ;({ chromium } = await import('@playwright/test'))
  } catch (error) {
    throw new ApiError('JOB_DEPENDENCY_NOT_READY', 'Private Playwright capture requires the local internal Playwright runtime.', 409, {
      toolId: 'playwright',
      packageName: '@playwright/test',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  }

  const browser = await chromium.launch({ headless: true })
  let networkRequestCount = 0
  try {
    const context = await browser.newContext({
      viewport: { width: spec.viewportWidth, height: spec.viewportHeight },
      deviceScaleFactor: spec.deviceScaleFactor,
      javaScriptEnabled: false,
      serviceWorkers: 'block',
      acceptDownloads: false,
      hasTouch: false,
      locale: 'en-US',
      timezoneId: 'UTC',
    })
    await context.route('**/*', async (route) => {
      networkRequestCount += 1
      await route.abort('blockedbyclient')
    })
    const page = await context.newPage()
    await page.setContent(renderFixedCaptureHtml(spec.textTokens), { waitUntil: 'domcontentloaded', timeout: 5_000 })
    if (networkRequestCount !== 0) {
      throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture attempted a forbidden network request.', 400, {
        networkRequestCount,
      })
    }
    const screenshot = await page.screenshot({
      type: 'png',
      animations: 'disabled',
      caret: 'hide',
      fullPage: false,
      timeout: 5_000,
    })
    await context.close()
    const bytes = Buffer.from(screenshot)
    const sourceSpecSha256 = sha256(stableStringify(spec))
    return { bytes, probe: validatePngBytes(bytes, spec, sourceSpecSha256) }
  } finally {
    await browser.close()
  }
}

async function readExistingCapture(
  rootPath: string,
  relativePath: string,
  spec: ApprovedPrivateBrowserCaptureSpec,
  sourceSpecSha256: string,
  expectedBytes: Buffer,
): Promise<{ bytes: Buffer; probe: PrivatePlaywrightCaptureImageProbe } | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({ rootPath, relativePath })
  if (!bytes) return undefined
  const probe = validatePngBytes(bytes, spec, sourceSpecSha256)
  assertDeterministicCaptureBytes(bytes, expectedBytes, sourceSpecSha256)
  return { bytes, probe }
}

function assertDeterministicCaptureBytes(
  actualBytes: Buffer,
  expectedBytes: Buffer,
  sourceSpecSha256: string,
): void {
  if (actualBytes.length === expectedBytes.length && actualBytes.equals(expectedBytes)) return
  throw new ApiError(
    'VALIDATION_FAILED',
    'Existing private Playwright capture failed deterministic provenance validation.',
    409,
    {
      existingSha256: sha256(actualBytes),
      expectedSha256: sha256(expectedBytes),
      sourceSpecSha256,
    },
  )
}

async function waitForConcurrentCapture(input: {
  rootPath: string
  relativePath: string
  spec: ApprovedPrivateBrowserCaptureSpec
  sourceSpecSha256: string
  expectedBytes: Buffer
}): Promise<{ bytes: Buffer; probe: PrivatePlaywrightCaptureImageProbe } | undefined> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const existing = await readExistingCapture(
      input.rootPath,
      input.relativePath,
      input.spec,
      input.sourceSpecSha256,
      input.expectedBytes,
    )
    if (existing) return existing
    await delay(25)
  }
  return undefined
}

function isCreateOnlyCaptureRace(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.code === 'IDEMPOTENCY_CONFLICT') return true
  if (error.code !== 'UPLOAD_NOT_FINALIZED') return false
  const details = error.details
  return Boolean(
    details
    && typeof details === 'object'
    && 'reason' in details
    && details.reason === 'create_only_object_collision',
  )
}

function validatePngBytes(
  bytes: Buffer,
  spec: ApprovedPrivateBrowserCaptureSpec,
  sourceSpecSha256: string,
): PrivatePlaywrightCaptureImageProbe {
  if (bytes.length < 24 || bytes.length > MAX_CAPTURE_BYTES || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture did not produce a bounded valid PNG artifact.', 409)
  }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width !== spec.viewportWidth || height !== spec.viewportHeight) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture PNG dimensions do not match the approved fixed viewport.', 409, {
      width,
      height,
      approvedWidth: spec.viewportWidth,
      approvedHeight: spec.viewportHeight,
    })
  }
  return {
    mimeType: 'image/png',
    pngSignatureValid: true,
    width,
    height,
    sourceSpecSha256,
    networkRequestCount: 0,
  }
}

function validateTextTokens(value: unknown): ApprovedPrivateBrowserCaptureTextTokens {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture requires structured approved text tokens.', 400)
  }
  const record = value as Record<string, unknown>
  const allowedKeys = new Set(['eyebrow', 'title', 'body', 'callout'])
  const unknownKeys = Object.keys(record).filter((key) => !allowedKeys.has(key))
  if (unknownKeys.length) {
    throw new ApiError('VALIDATION_FAILED', 'Private Playwright capture text tokens contain unsupported fields.', 400, { unknownKeys })
  }
  return {
    eyebrow: safeTextToken(record.eyebrow, 'eyebrow', 40),
    title: safeTextToken(record.title, 'title', 84),
    body: safeTextToken(record.body, 'body', 180),
    callout: safeTextToken(record.callout, 'callout', 64),
  }
}

function safeTextToken(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new ApiError('VALIDATION_FAILED', `Private Playwright capture ${field} must be text.`, 400)
  }
  const normalized = Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint <= 31 || codePoint === 127 ? ' ' : character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized || normalized.length > maxLength) {
    throw new ApiError('VALIDATION_FAILED', `Private Playwright capture ${field} must be 1-${maxLength} characters.`, 400)
  }
  if (/[<>]/.test(normalized) || /(?:https?:\/\/|file:|data:|javascript:|localhost|127\.0\.0\.1|\[::1\])/i.test(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `Private Playwright capture ${field} contains forbidden markup or URL-like content.`, 400)
  }
  if (/\b(?:authorization|bearer|api[_ -]?key|password|secret|service[_ -]?role|credential|cookie)\b/i.test(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `Private Playwright capture ${field} contains credential-like content.`, 400)
  }
  return normalized
}

function renderFixedCaptureHtml(tokens: ApprovedPrivateBrowserCaptureTextTokens): string {
  const eyebrow = escapeHtml(tokens.eyebrow)
  const title = escapeHtml(tokens.title)
  const body = escapeHtml(tokens.body)
  const callout = escapeHtml(tokens.callout)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:640px;height:360px;overflow:hidden;background:#05070d}body{display:grid;place-items:center;font-family:Arial,Helvetica,sans-serif;color:#f8fafc}.card{position:relative;width:568px;height:288px;padding:30px 34px;border:1px solid rgba(0,229,255,.46);border-radius:24px;background:linear-gradient(145deg,#101827,#0a1020);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}.signal{position:absolute;top:0;left:38px;width:96px;height:3px;background:#00e5ff}.eyebrow{font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#67e8f9}.title{margin:20px 0 12px;max-width:470px;font-size:34px;line-height:1.04;letter-spacing:-1.2px}.body{max-width:472px;color:#a1a6b3;font-size:17px;line-height:1.42}.callout{position:absolute;left:34px;bottom:28px;padding:9px 14px;border-radius:999px;background:rgba(37,99,255,.18);border:1px solid rgba(37,99,255,.45);font-size:13px;font-weight:700;color:#dbeafe}</style></head><body><main class="card" data-reeditpro-private-capture="v1"><div class="signal"></div><div class="eyebrow">${eyebrow}</div><h1 class="title">${title}</h1><div class="body">${body}</div><div class="callout">${callout}</div></main></body></html>`
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function numberSetting(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function safePathPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120) || 'unknown'
}

function collisionResistantPathPart(value: string): string {
  return `${safePathPart(value).slice(0, 64)}-${sha256(value).slice(0, 20)}`
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableJsonValue(nested)]))
  }
  return value
}
