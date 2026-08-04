import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL = 'offline-browser-graphics-execution-v1' as const
export const OFFLINE_BROWSER_GRAPHICS_CONTAINER_PROTOCOL = 'offline-browser-graphics-execution-container-v1' as const
export const OFFLINE_BROWSER_GRAPHICS_TOOL_IDS = ['lottie', 'pixijs', 'konva', 'babylon_js', 'playwright'] as const
export type OfflineBrowserGraphicsToolId = (typeof OFFLINE_BROWSER_GRAPHICS_TOOL_IDS)[number]

export const OFFLINE_BROWSER_GRAPHICS_OPERATIONS = Object.freeze({
  lottie: 'tool.lottie.render_lottie_motion.v1',
  pixijs: 'tool.pixijs.render_pixi_scene.v1',
  konva: 'tool.konva.render_canvas_overlay.v1',
  babylon_js: 'tool.babylon_js.render_babylon_scene.v1',
  playwright: 'tool.playwright.capture_authorized_internal_page.v1',
} as const)

export const OFFLINE_BROWSER_GRAPHICS_PACKAGE_IDENTITIES = Object.freeze({
  lottie: { packageName: 'lottie-web', version: '5.13.0' },
  pixijs: { packageName: 'pixi.js', version: '8.19.0' },
  konva: { packageName: 'konva', version: '10.3.0' },
  babylon_js: { packageName: '@babylonjs/core', version: '9.15.0' },
  playwright: { packageName: 'playwright', version: '1.60.0' },
} as const)

export interface BrowserTextTokens {
  eyebrow: string
  title: string
  body: string
  callout: string
}

export type OfflineBrowserGraphicsRequest = {
  [ToolId in OfflineBrowserGraphicsToolId]: {
    schemaVersion: typeof OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL
    toolId: ToolId
    operationId: (typeof OFFLINE_BROWSER_GRAPHICS_OPERATIONS)[ToolId]
    payload: ToolId extends 'lottie' | 'pixijs'
      ? { width: 640; height: 360; fps: 30; durationFrames: 60; motionProfileId: 'approved_motion_card_v1'; backgroundMode: 'opaque_panel' }
      : ToolId extends 'konva'
        ? { width: 640; height: 360; themeProfileId: 'approved_light_card_v1'; fontProfileId: 'reeditpro_reviewed_fonts_v1'; maximumTextItems: 4; reviewedCopy: BrowserTextTokens }
        : ToolId extends 'babylon_js'
          ? { width: 640; height: 360; fps: 30; durationFrames: 60; sceneProfileId: 'approved_product_cube_v1'; cameraProfileId: 'approved_perspective_v1'; lightingProfileId: 'approved_studio_v1' }
          : { captureSourceKind: 'approved_internal_html_v1'; captureTemplateId: 'reeditpro_private_capture_card_v1'; captureAuthorizationConfirmed: true; viewportWidth: 640; viewportHeight: 360; deviceScaleFactor: 1; reviewedCopy: BrowserTextTokens }
  }
}[OfflineBrowserGraphicsToolId]

const SAFE_TEXT = /^(?!.*(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|[A-Za-z]:[\\/]|\$\(|`|&&|\|\||#!|(?:api|access|auth|private|secret)[_-]?(?:key|token|password)))[\x20-\x7E]+$/i

export function validateOfflineBrowserGraphicsRequest(value: unknown): OfflineBrowserGraphicsRequest {
  const request = exactRecord(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL || !isToolId(request.toolId)) {
    throw invalid('Browser graphics request identity is unsupported.')
  }
  const toolId = request.toolId
  if (request.operationId !== OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId]) throw invalid('Browser graphics operation is unsupported.')
  const identity = { schemaVersion: OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL, toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId] }
  if (toolId === 'lottie' || toolId === 'pixijs') {
    const payload = exactRecord(request.payload, ['width', 'height', 'fps', 'durationFrames', 'motionProfileId', 'backgroundMode'], 'vector payload')
    exactValues(payload, { width: 640, height: 360, fps: 30, durationFrames: 60, motionProfileId: 'approved_motion_card_v1', backgroundMode: 'opaque_panel' })
    return { ...identity, toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId], payload: { width: 640, height: 360, fps: 30, durationFrames: 60, motionProfileId: 'approved_motion_card_v1', backgroundMode: 'opaque_panel' } } as OfflineBrowserGraphicsRequest
  }
  if (toolId === 'konva') {
    const payload = exactRecord(request.payload, ['width', 'height', 'themeProfileId', 'fontProfileId', 'maximumTextItems', 'reviewedCopy'], 'Konva payload')
    exactValues(payload, { width: 640, height: 360, themeProfileId: 'approved_light_card_v1', fontProfileId: 'reeditpro_reviewed_fonts_v1', maximumTextItems: 4 })
    return { ...identity, toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId], payload: { width: 640, height: 360, themeProfileId: 'approved_light_card_v1', fontProfileId: 'reeditpro_reviewed_fonts_v1', maximumTextItems: 4, reviewedCopy: validateTextTokens(payload.reviewedCopy) } }
  }
  if (toolId === 'babylon_js') {
    const payload = exactRecord(request.payload, ['width', 'height', 'fps', 'durationFrames', 'sceneProfileId', 'cameraProfileId', 'lightingProfileId'], 'Babylon payload')
    exactValues(payload, { width: 640, height: 360, fps: 30, durationFrames: 60, sceneProfileId: 'approved_product_cube_v1', cameraProfileId: 'approved_perspective_v1', lightingProfileId: 'approved_studio_v1' })
    return { ...identity, toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId], payload: { width: 640, height: 360, fps: 30, durationFrames: 60, sceneProfileId: 'approved_product_cube_v1', cameraProfileId: 'approved_perspective_v1', lightingProfileId: 'approved_studio_v1' } }
  }
  const payload = exactRecord(request.payload, ['captureSourceKind', 'captureTemplateId', 'captureAuthorizationConfirmed', 'viewportWidth', 'viewportHeight', 'deviceScaleFactor', 'reviewedCopy'], 'Playwright payload')
  exactValues(payload, { captureSourceKind: 'approved_internal_html_v1', captureTemplateId: 'reeditpro_private_capture_card_v1', captureAuthorizationConfirmed: true, viewportWidth: 640, viewportHeight: 360, deviceScaleFactor: 1 })
  return { ...identity, toolId, operationId: OFFLINE_BROWSER_GRAPHICS_OPERATIONS[toolId], payload: { captureSourceKind: 'approved_internal_html_v1', captureTemplateId: 'reeditpro_private_capture_card_v1', captureAuthorizationConfirmed: true, viewportWidth: 640, viewportHeight: 360, deviceScaleFactor: 1, reviewedCopy: validateTextTokens(payload.reviewedCopy) } }
}

export function buildOfflineBrowserGraphicsApprovedRequest(input: {
  toolId: unknown
  operationId: unknown
  planningPayload: unknown
}): OfflineBrowserGraphicsRequest {
  if (input.toolId !== 'playwright') {
    return validateOfflineBrowserGraphicsRequest({
      schemaVersion: OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL,
      toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload,
    })
  }
  const planning = exactRecord(input.planningPayload, [
    'captureSourceKind', 'captureTemplateId', 'capturePolicyConfirmed',
    'viewportWidth', 'viewportHeight', 'deviceScaleFactor', 'reviewedCopy',
  ], 'approved Playwright planning payload')
  if (planning.capturePolicyConfirmed !== true) throw invalid('Playwright capture policy is not confirmed.')
  return validateOfflineBrowserGraphicsRequest({
    schemaVersion: OFFLINE_BROWSER_GRAPHICS_REQUEST_PROTOCOL,
    toolId: input.toolId, operationId: input.operationId,
    payload: {
      captureSourceKind: planning.captureSourceKind,
      captureTemplateId: planning.captureTemplateId,
      captureAuthorizationConfirmed: true,
      viewportWidth: planning.viewportWidth, viewportHeight: planning.viewportHeight,
      deviceScaleFactor: planning.deviceScaleFactor, reviewedCopy: planning.reviewedCopy,
    },
  })
}

export function offlineBrowserGraphicsRequestSha256(request: OfflineBrowserGraphicsRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}

function validateTextTokens(value: unknown): BrowserTextTokens {
  const tokens = exactRecord(value, ['eyebrow', 'title', 'body', 'callout'], 'text tokens')
  return { eyebrow: safeText(tokens.eyebrow, 60), title: safeText(tokens.title, 100), body: safeText(tokens.body, 220), callout: safeText(tokens.callout, 80) }
}
function safeText(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum || value !== value.trim() || !SAFE_TEXT.test(value)) throw invalid('Browser graphics text is unsafe or outside its approved bounds.')
  return value
}
function exactValues(value: Record<string, unknown>, expected: Record<string, unknown>): void {
  for (const [key, expectedValue] of Object.entries(expected)) if (value[key] !== expectedValue) throw invalid(`Browser graphics ${key} is unsupported.`)
}
function isToolId(value: unknown): value is OfflineBrowserGraphicsToolId { return (OFFLINE_BROWSER_GRAPHICS_TOOL_IDS as readonly unknown[]).includes(value) }
function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`)
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`)
  return record
}
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
