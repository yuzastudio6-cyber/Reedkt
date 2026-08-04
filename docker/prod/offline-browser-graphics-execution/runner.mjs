import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const PROTOCOL = 'offline-browser-graphics-execution-v1'
const OPERATIONS = Object.freeze({
  lottie: 'tool.lottie.render_lottie_motion.v1',
  pixijs: 'tool.pixijs.render_pixi_scene.v1',
  konva: 'tool.konva.render_canvas_overlay.v1',
  babylon_js: 'tool.babylon_js.render_babylon_scene.v1',
  playwright: 'tool.playwright.capture_authorized_internal_page.v1',
})
const PACKAGE_IDENTITIES = Object.freeze({
  lottie: { packageName: 'lottie-web', version: '5.13.0' },
  pixijs: { packageName: 'pixi.js', version: '8.19.0' },
  konva: { packageName: 'konva', version: '10.3.0' },
  babylon_js: { packageName: '@babylonjs/core', version: '9.15.0' },
  playwright: { packageName: 'playwright', version: '1.60.0' },
})
const PACKAGE_PATHS = Object.freeze({
  lottie: '/app/node_modules/lottie-web/package.json',
  pixijs: '/app/node_modules/pixi.js/package.json',
  konva: '/app/node_modules/konva/package.json',
  babylon_js: '/app/node_modules/@babylonjs/core/package.json',
  playwright: '/app/node_modules/playwright/package.json',
})
const SAFE_TEXT = /^(?!.*(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|[A-Za-z]:[\\/]|\$\(|`|&&|\|\||#!|(?:api|access|auth|private|secret)[_-]?(?:key|token|password)))[\x20-\x7E]+$/i
const MAXIMUM_REQUEST_BYTES = 64 * 1024
const MAXIMUM_OUTPUT_BYTES = 8 * 1024 * 1024
const SAFE_DIAGNOSTIC_CODES = new Set([
  'LOTTIE_CANVAS_MISSING', 'LOTTIE_PIXEL_EMPTY', 'BABYLON_READBACK_MISSING',
  'BABYLON_READBACK_FAILED', 'BABYLON_PIXEL_EMPTY', 'BABYLON_OUTPUT_CANVAS_MISSING',
  'BABYLON_IMAGE_DATA_FAILED', 'BABYLON_ENGINE_FAILED', 'BABYLON_SCENE_FAILED',
  'BABYLON_RENDER_FAILED', 'BABYLON_OUTPUT_FAILED', 'OUTPUT_PIXEL_EMPTY',
])

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value
}
function exact(value, keys, label) {
  const item = record(value, label)
  if (Object.keys(item).sort().join('|') !== [...keys].sort().join('|')) throw new Error(`${label} contains unsupported fields`)
  return item
}
function integer(value, expected, label) {
  if (!Number.isSafeInteger(value) || value !== expected) throw new Error(`${label} is unsupported`)
  return value
}
function safeText(value, maximum, label) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || value !== value.trim() || !SAFE_TEXT.test(value)) {
    throw new Error(`${label} is unsafe`)
  }
  return value
}
function textTokens(value) {
  const tokens = exact(value, ['eyebrow', 'title', 'body', 'callout'], 'textTokens')
  return {
    eyebrow: safeText(tokens.eyebrow, 60, 'eyebrow'),
    title: safeText(tokens.title, 100, 'title'),
    body: safeText(tokens.body, 220, 'body'),
    callout: safeText(tokens.callout, 80, 'callout'),
  }
}

function validateRequest(value) {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== PROTOCOL || !Object.hasOwn(OPERATIONS, request.toolId) || request.operationId !== OPERATIONS[request.toolId]) {
    throw new Error('request identity is unsupported')
  }
  const payload = request.toolId === 'lottie' || request.toolId === 'pixijs'
    ? vectorPayload(request.payload)
    : request.toolId === 'konva'
      ? konvaPayload(request.payload)
      : request.toolId === 'babylon_js'
        ? babylonPayload(request.payload)
        : playwrightPayload(request.payload)
  return { schemaVersion: PROTOCOL, toolId: request.toolId, operationId: request.operationId, payload }
}

function vectorPayload(value) {
  const payload = exact(value, ['width', 'height', 'fps', 'durationFrames', 'motionProfileId', 'backgroundMode'], 'vector payload')
  if (payload.motionProfileId !== 'approved_motion_card_v1' || payload.backgroundMode !== 'opaque_panel') throw new Error('vector policy is unsupported')
  return {
    width: integer(payload.width, 640, 'width'), height: integer(payload.height, 360, 'height'),
    fps: integer(payload.fps, 30, 'fps'), durationFrames: integer(payload.durationFrames, 60, 'durationFrames'),
    motionProfileId: payload.motionProfileId, backgroundMode: payload.backgroundMode,
  }
}
function konvaPayload(value) {
  const payload = exact(value, ['width', 'height', 'themeProfileId', 'fontProfileId', 'maximumTextItems', 'reviewedCopy'], 'konva payload')
  if (payload.themeProfileId !== 'approved_light_card_v1' || payload.fontProfileId !== 'reeditpro_reviewed_fonts_v1') throw new Error('konva policy is unsupported')
  const tokens = textTokens(payload.reviewedCopy)
  return {
    width: integer(payload.width, 640, 'width'), height: integer(payload.height, 360, 'height'),
    themeProfileId: payload.themeProfileId, fontProfileId: payload.fontProfileId,
    maximumTextItems: integer(payload.maximumTextItems, 4, 'maximumTextItems'),
    reviewedCopy: tokens,
  }
}
function babylonPayload(value) {
  const payload = exact(value, ['width', 'height', 'fps', 'durationFrames', 'sceneProfileId', 'cameraProfileId', 'lightingProfileId'], 'babylon payload')
  if (payload.sceneProfileId !== 'approved_product_cube_v1' || payload.cameraProfileId !== 'approved_perspective_v1' || payload.lightingProfileId !== 'approved_studio_v1') throw new Error('babylon policy is unsupported')
  return {
    width: integer(payload.width, 640, 'width'), height: integer(payload.height, 360, 'height'),
    fps: integer(payload.fps, 30, 'fps'), durationFrames: integer(payload.durationFrames, 60, 'durationFrames'),
    sceneProfileId: payload.sceneProfileId, cameraProfileId: payload.cameraProfileId,
    lightingProfileId: payload.lightingProfileId,
  }
}
function playwrightPayload(value) {
  const payload = exact(value, ['captureSourceKind', 'captureTemplateId', 'captureAuthorizationConfirmed', 'viewportWidth', 'viewportHeight', 'deviceScaleFactor', 'reviewedCopy'], 'playwright payload')
  if (payload.captureSourceKind !== 'approved_internal_html_v1' || payload.captureTemplateId !== 'reeditpro_private_capture_card_v1' || payload.captureAuthorizationConfirmed !== true) throw new Error('playwright capture policy is unsupported')
  return {
    captureSourceKind: payload.captureSourceKind, captureTemplateId: payload.captureTemplateId,
    captureAuthorizationConfirmed: true,
    viewportWidth: integer(payload.viewportWidth, 640, 'viewportWidth'),
    viewportHeight: integer(payload.viewportHeight, 360, 'viewportHeight'),
    deviceScaleFactor: integer(payload.deviceScaleFactor, 1, 'deviceScaleFactor'),
    reviewedCopy: textTokens(payload.reviewedCopy),
  }
}

async function execute(request) {
  const expectedPackage = PACKAGE_IDENTITIES[request.toolId]
  const installed = JSON.parse(await readFile(PACKAGE_PATHS[request.toolId], 'utf8'))
  if (installed.name !== expectedPackage.packageName || installed.version !== expectedPackage.version) throw new Error('package identity mismatch')
  const browserPath = (await readFile('/app/browser-path.txt', 'utf8')).trim()
  if (!browserPath.startsWith('/app/node_modules/.remotion/chrome-headless-shell/')) throw new Error('browser identity is invalid')
  const browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader'],
  })
  let networkRequestCount = 0
  try {
    const context = await browser.newContext({
      viewport: { width: 640, height: 360 }, deviceScaleFactor: 1,
      javaScriptEnabled: request.toolId !== 'playwright', serviceWorkers: 'block',
      acceptDownloads: false, hasTouch: false, locale: 'en-US', timezoneId: 'UTC',
    })
    await context.route('**/*', async (route) => {
      networkRequestCount += 1
      await route.abort('blockedbyclient')
    })
    const page = await context.newPage()
    let operationEvidence
    let operationArtifactBytes = null
    if (request.toolId === 'playwright') {
      await page.setContent(playwrightHtml(request.payload.reviewedCopy), { waitUntil: 'domcontentloaded', timeout: 10_000 })
      operationEvidence = { entrypoint: 'chromium.launch', fixedTemplateRendered: true }
    } else {
      const bundle = await readFile('/app/browser-operations.bundle.js', 'utf8')
      await page.setContent(`<div id="root"></div><script>${bundle}</script>`, { waitUntil: 'domcontentloaded', timeout: 10_000 })
      operationEvidence = await page.evaluate(async ({ toolId, payload }) => {
        if (!window.__reeditproExecuteBrowserGraphic) throw new Error('browser operation bundle is unavailable')
        return window.__reeditproExecuteBrowserGraphic(toolId, payload)
      }, { toolId: request.toolId, payload: request.payload })
      if (typeof operationEvidence.artifactDataUrl === 'string') {
        if (!operationEvidence.artifactDataUrl.startsWith('data:image/png;base64,')) throw new Error('operation artifact encoding is invalid')
        operationArtifactBytes = Buffer.from(operationEvidence.artifactDataUrl.slice('data:image/png;base64,'.length), 'base64')
        delete operationEvidence.artifactDataUrl
      }
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    }
    if (networkRequestCount !== 0) throw new Error('browser operation attempted network access')
    const bytes = operationArtifactBytes ?? await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', fullPage: false, timeout: 10_000 })
    await context.close()
    if (bytes.byteLength < 1024 || bytes.byteLength > MAXIMUM_OUTPUT_BYTES || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.readUInt32BE(16) !== 640 || bytes.readUInt32BE(20) !== 360) throw new Error('browser output PNG is invalid')
    const pixelEvidence = validateRenderedPixels(bytes)
    return { bytes, operationEvidence, packageIdentity: expectedPackage, networkRequestCount, pixelEvidence }
  } finally {
    await browser.close()
  }
}

function validateRenderedPixels(bytes) {
  const decoded = PNG.sync.read(bytes, { checkCRC: true })
  if (decoded.width !== 640 || decoded.height !== 360 || decoded.data.byteLength !== 640 * 360 * 4) throw new Error('decoded browser output is invalid')
  const first = decoded.data.subarray(0, 4).toString('hex')
  const colors = new Set([first])
  let pixelsDifferentFromFirst = 0
  for (let index = 0; index < decoded.data.length; index += 4) {
    const color = decoded.data.subarray(index, index + 4).toString('hex')
    if (color !== first) pixelsDifferentFromFirst += 1
    if (colors.size < 512) colors.add(color)
  }
  if (pixelsDifferentFromFirst < 1_000 || colors.size < 2) throw new Error('OUTPUT_PIXEL_EMPTY')
  return { decodedPngVerified: true, pixelsDifferentFromFirst, sampledUniqueColorCount: colors.size }
}

function playwrightHtml(tokens) {
  const escaped = Object.fromEntries(Object.entries(tokens).map(([key, value]) => [key, String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])]))
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:640px;height:360px;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;display:flex;align-items:center;justify-content:center}.card{width:520px;padding:38px;border-radius:28px;background:#fff;box-shadow:0 20px 55px rgba(15,23,42,.14)}.eyebrow{color:#4f46e5;font-size:15px;font-weight:700;text-transform:uppercase}.title{font-size:34px;font-weight:800;margin-top:12px}.body{font-size:18px;line-height:1.45;color:#475569;margin-top:15px}.callout{font-size:16px;font-weight:700;color:#4f46e5;margin-top:18px}</style></head><body><main class="card"><div class="eyebrow">${escaped.eyebrow}</div><div class="title">${escaped.title}</div><div class="body">${escaped.body}</div><div class="callout">${escaped.callout}</div></main></body></html>`
}

const chunks = []
let byteLength = 0
for await (const chunk of process.stdin) {
  byteLength += chunk.byteLength
  if (byteLength > MAXIMUM_REQUEST_BYTES) process.exit(2)
  chunks.push(chunk)
}

try {
  const request = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
  const result = await execute(request)
  process.stdout.write(JSON.stringify({
    schemaVersion: 'offline-browser-graphics-execution-container-v1', ok: true,
    toolId: request.toolId, operationId: request.operationId,
    status: 'actual_browser_graphics_operation_completed',
    packageIdentity: result.packageIdentity,
    requestEnvelopeSha256: sha256(JSON.stringify(request)),
    artifact: { mimeType: 'image/png', bytesBase64: result.bytes.toString('base64'), byteLength: result.bytes.byteLength, sha256: sha256(result.bytes), width: 640, height: 360 },
    semanticEvidence: { actualPackageEntrypointExecuted: true, ...result.operationEvidence, ...result.pixelEvidence, zeroNetworkVerified: true, fixedViewportVerified: true, privatePngProduced: true },
    networkRequestCount: result.networkRequestCount,
    readiness: { privateInternalOnly: true, productReady: false, externalBetaReady: false, productionReady: false },
  }))
} catch (error) {
  const code = error instanceof Error
    ? [...SAFE_DIAGNOSTIC_CODES].find((candidate) => error.message.includes(candidate)) ?? 'EXECUTION_FAILED'
    : 'EXECUTION_FAILED'
  process.stderr.write('Private browser graphics execution failed.\n')
  process.stdout.write(JSON.stringify({ ok: false, code }))
  process.exit(3)
}
