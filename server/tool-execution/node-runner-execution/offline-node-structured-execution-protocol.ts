import {
  OFFLINE_NODE_RUNNER_LIMITS,
  OFFLINE_NODE_RUNNER_PROTOCOL,
  type OfflineAnimeMotionInput,
  type OfflineSatoriCardInput,
  type OfflineSharpImageInput,
  type OfflineSvgCardInput,
  type OfflineStructuredChartInput,
  type OfflineThreeSceneInput,
  type OfflineVizGraphInput,
  type OfflineNodeRunnerToolId,
} from '../node-runners/offline-node-runner-types'
import {
  OfflineNodeRunnerValidationError,
  sha256,
  stableStringify,
  validateSatoriCardInput,
  validateAnimeMotionInput,
  validateSvgCardInput,
  validateStructuredChartInput,
  validateThreeSceneInput,
  validateVizGraphInput,
} from '../node-runners/offline-node-runner-security'
import { getOfflineNodeRunnerCanonicalOperation } from '../node-runners/offline-node-runner-canonical-operations'
import { isOfflineNodeRunnerToolId } from '../node-runners/offline-node-runner-tool-ids'

export const OFFLINE_NODE_STRUCTURED_EXECUTION_PROTOCOL =
  'offline-node-structured-execution-v1' as const
export const OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL =
  'offline-node-structured-execution-container-v1' as const

const CHART_TOOL_IDS = new Set<OfflineNodeRunnerToolId>([
  'd3',
  'echarts',
  'vega_lite',
  'vega',
])
const EXECUTABLE_TEXT_PATTERN = /(?:\$\(|`|&&|\|\||;\s*(?:bash|sh|rm|curl|wget|python|node)\b|#!\s*\/)/i
const URL_OR_PATH_PATTERN = /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|www\.|@import\b|url\s*\(|\.\.\/|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)(?:~\/|\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+))/i

export interface OfflineNodeStructuredChartPayload {
  width: number
  height: number
  title: string
  xAxisLabel: string
  yAxisLabel: string
  theme: 'light' | 'dark'
  data: Array<{ label: string; value: number }>
}

export interface OfflineNodeStructuredCardPayload {
  width: number
  height: number
  theme: 'light' | 'dark'
  eyebrow: string
  title: string
  body: string
  callout: string
}

export interface OfflineNodeStructuredGraphPayload {
  direction: 'left_to_right' | 'top_to_bottom'
  theme: 'light' | 'dark'
  title: string
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ from: string; to: string; label?: string }>
}

export interface OfflineNodeStructuredSharpSvgPayload {
  imageRecipeId: 'approved_thumbnail_v1' | 'approved_panel_asset_v1' | 'approved_overlay_asset_v1'
  outputFormat: 'png' | 'jpeg' | 'webp'
  outputWidth: number
  outputHeight: number
  preserveMetadata: false
  allowUpscale: false
  sourceMimeType: 'image/svg+xml'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

export interface OfflineNodeStructuredSharpAlphaComponentPayload {
  imageRecipeId: 'approved_living_frame_alpha_component_v1'
  outputFormat: 'png'
  outputWidth: number
  outputHeight: number
  preserveMetadata: false
  allowUpscale: false
  sourceMimeType: 'image/png'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  maskMimeType: 'image/png'
  maskByteLength: number
  maskSha256: string
  maskBytesBase64: string
}

export type OfflineNodeStructuredSharpPayload =
  | OfflineNodeStructuredSharpSvgPayload
  | OfflineNodeStructuredSharpAlphaComponentPayload

export interface OfflineSharpPlanningPayload {
  imageRecipeId:
    | 'approved_thumbnail_v1'
    | 'approved_panel_asset_v1'
    | 'approved_overlay_asset_v1'
    | 'approved_living_frame_alpha_component_v1'
  outputFormat: 'png' | 'jpeg' | 'webp'
  outputWidth: number
  outputHeight: number
  preserveMetadata: false
  allowUpscale: false
}

export interface OfflineNodeStructuredAnimePayload {
  width: number
  height: number
  fps: 12 | 24 | 25 | 30 | 50 | 60
  durationFrames: number
  motionProfileId: 'approved_card_reveal_v1'
  backgroundMode: 'opaque_panel' | 'transparent_overlay'
  title: string
}

export interface OfflineNodeStructuredThreePayload {
  width: number
  height: number
  fps: 12 | 24 | 25 | 30 | 50 | 60
  durationFrames: number
  sceneProfileId: 'approved_product_cube_v1'
  cameraProfileId: 'approved_perspective_v1'
  lightingProfileId: 'approved_studio_v1'
  title: string
}

export type OfflineNodeStructuredExecutionPayload =
  | OfflineNodeStructuredChartPayload
  | OfflineNodeStructuredCardPayload
  | OfflineNodeStructuredGraphPayload
  | OfflineNodeStructuredSharpPayload
  | OfflineNodeStructuredAnimePayload
  | OfflineNodeStructuredThreePayload

export interface OfflineNodeStructuredExecutionRequest {
  toolId: OfflineNodeRunnerToolId
  operationId: string
  payload: OfflineNodeStructuredExecutionPayload
}

export interface OfflineNodeStructuredExecutionFont {
  family: 'ReeditProSans'
  sha256: string
  bytes: Uint8Array
}

export function validateOfflineNodeStructuredExecutionRequest(
  value: unknown,
): OfflineNodeStructuredExecutionRequest {
  assertJsonData(value, '$', 0, { nodes: 0 })
  const request = exactObject(
    value,
    ['toolId', 'operationId', 'payload'],
    'structured execution request',
  )
  if (!isOfflineNodeRunnerToolId(request.toolId)) {
    throw invalidInput('Structured execution requires one of the exact offline Node tool identities.')
  }
  const canonicalOperation = getOfflineNodeRunnerCanonicalOperation(request.toolId)
  if (request.operationId !== canonicalOperation.operationId) {
    throw invalidInput('Structured execution requires the exact canonical operation identity.')
  }

  const normalizedPayload = CHART_TOOL_IDS.has(request.toolId)
    ? normalizeChartPayload(request.payload)
    : request.toolId === 'satori' || request.toolId === 'svg_js'
      ? normalizeCardPayload(request.payload)
      : request.toolId === 'sharp'
        ? normalizeSharpPayload(request.payload)
        : request.toolId === 'animejs'
          ? normalizeAnimePayload(request.payload)
          : request.toolId === 'three_js'
            ? normalizeThreePayload(request.payload)
      : normalizeGraphPayload(request.payload)
  const normalized: OfflineNodeStructuredExecutionRequest = {
    toolId: request.toolId,
    operationId: canonicalOperation.operationId,
    payload: normalizedPayload,
  }
  const byteLength = Buffer.byteLength(stableStringify(normalized), 'utf8')
  if (byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumInputJsonBytes) {
    throw new OfflineNodeRunnerValidationError(
      'INPUT_TOO_LARGE',
      'Structured execution request exceeds the fixed in-memory request ceiling.',
    )
  }
  return normalized
}

export function createValidatedOfflineNodeRunnerPayload(
  requestValue: unknown,
  satoriFont?: OfflineNodeStructuredExecutionFont,
): {
  request: OfflineNodeStructuredExecutionRequest
  runnerPayload: OfflineStructuredChartInput | OfflineSatoriCardInput | OfflineSvgCardInput |
  OfflineVizGraphInput | OfflineSharpImageInput | OfflineAnimeMotionInput
  | OfflineThreeSceneInput
} {
  const request = validateOfflineNodeStructuredExecutionRequest(requestValue)
  if (CHART_TOOL_IDS.has(request.toolId)) {
    return {
      request,
      runnerPayload: validateStructuredChartInput({
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...(request.payload as OfflineNodeStructuredChartPayload),
      }),
    }
  }
  if (request.toolId === 'viz_js') {
    return {
      request,
      runnerPayload: validateVizGraphInput({
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...(request.payload as OfflineNodeStructuredGraphPayload),
      }),
    }
  }
  if (request.toolId === 'svg_js') {
    return {
      request,
      runnerPayload: validateSvgCardInput({
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...(request.payload as OfflineNodeStructuredCardPayload),
      }),
    }
  }
  if (request.toolId === 'sharp') {
    const payload = request.payload as OfflineNodeStructuredSharpPayload
    if (payload.imageRecipeId === 'approved_living_frame_alpha_component_v1') {
      const {
        sourceBytesBase64,
        maskBytesBase64,
        ...withoutEncodedBytes
      } = payload
      return {
        request,
        runnerPayload: {
          protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
          source: 'server_resolved_in_memory',
          ...withoutEncodedBytes,
          sourceBytes: new Uint8Array(Buffer.from(sourceBytesBase64, 'base64')),
          maskBytes: new Uint8Array(Buffer.from(maskBytesBase64, 'base64')),
        },
      }
    }
    const { sourceBytesBase64, ...withoutEncodedBytes } =
      payload as OfflineNodeStructuredSharpSvgPayload
    return {
      request,
      runnerPayload: {
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...withoutEncodedBytes,
        sourceBytes: new Uint8Array(Buffer.from(sourceBytesBase64, 'base64')),
      },
    }
  }
  if (request.toolId === 'animejs') {
    return {
      request,
      runnerPayload: validateAnimeMotionInput({
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...(request.payload as OfflineNodeStructuredAnimePayload),
      }),
    }
  }
  if (request.toolId === 'three_js') {
    return {
      request,
      runnerPayload: validateThreeSceneInput({
        protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
        source: 'server_resolved_in_memory',
        ...(request.payload as OfflineNodeStructuredThreePayload),
      }),
    }
  }
  if (!satoriFont) {
    throw invalidInput('The Satori operation requires the image-baked server font.')
  }
  return {
    request,
    runnerPayload: validateSatoriCardInput({
      protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
      source: 'server_resolved_in_memory',
      ...(request.payload as OfflineNodeStructuredCardPayload),
      font: {
        family: satoriFont.family,
        sha256: satoriFont.sha256,
        bytes: new Uint8Array(satoriFont.bytes),
      },
    }),
  }
}

export function structuredExecutionRequestSha256(
  request: OfflineNodeStructuredExecutionRequest,
): string {
  return sha256(stableStringify(request))
}

function normalizeChartPayload(value: unknown): OfflineNodeStructuredChartPayload {
  const payload = exactObject(value, [
    'width',
    'height',
    'title',
    'xAxisLabel',
    'yAxisLabel',
    'theme',
    'data',
  ], 'chart payload')
  const validated = validateStructuredChartInput({
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    ...payload,
  })
  return {
    width: validated.width,
    height: validated.height,
    title: safeText(validated.title, 'title', 96),
    xAxisLabel: safeText(validated.xAxisLabel, 'xAxisLabel', 48),
    yAxisLabel: safeText(validated.yAxisLabel, 'yAxisLabel', 48),
    theme: validated.theme,
    data: validated.data.map((datum, index) => ({
      label: safeText(datum.label, `data[${index}].label`, 48),
      value: datum.value,
    })),
  }
}

function normalizeGraphPayload(value: unknown): OfflineNodeStructuredGraphPayload {
  const payload = exactObject(
    value,
    ['direction', 'theme', 'title', 'nodes', 'edges'],
    'graph payload',
  )
  const validated = validateVizGraphInput({
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    ...payload,
  })
  return {
    direction: validated.direction,
    theme: validated.theme,
    title: safeText(validated.title, 'title', 96),
    nodes: validated.nodes.map((node, index) => ({
      id: node.id,
      label: safeText(node.label, `nodes[${index}].label`, 72),
    })),
    edges: validated.edges.map((edge, index) => ({
      from: edge.from,
      to: edge.to,
      ...(edge.label === undefined
        ? {}
        : { label: safeText(edge.label, `edges[${index}].label`, 48) }),
    })),
  }
}

function normalizeCardPayload(value: unknown): OfflineNodeStructuredCardPayload {
  const payload = exactObject(value, [
    'width',
    'height',
    'theme',
    'eyebrow',
    'title',
    'body',
    'callout',
  ], 'card payload')
  return {
    width: boundedInteger(payload.width, 'width'),
    height: boundedInteger(payload.height, 'height'),
    theme: oneOf(payload.theme, ['light', 'dark'] as const, 'theme'),
    eyebrow: safeText(payload.eyebrow, 'eyebrow', 48),
    title: safeText(payload.title, 'title', 96),
    body: safeText(payload.body, 'body', 240),
    callout: safeText(payload.callout, 'callout', 72),
  }
}

function normalizeAnimePayload(value: unknown): OfflineNodeStructuredAnimePayload {
  const payload = exactObject(value, [
    'width', 'height', 'fps', 'durationFrames', 'motionProfileId',
    'backgroundMode', 'title',
  ], 'Anime.js motion payload')
  const validated = validateAnimeMotionInput({
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    ...payload,
  })
  return {
    width: validated.width,
    height: validated.height,
    fps: validated.fps,
    durationFrames: validated.durationFrames,
    motionProfileId: validated.motionProfileId,
    backgroundMode: validated.backgroundMode,
    title: validated.title,
  }
}

function normalizeThreePayload(value: unknown): OfflineNodeStructuredThreePayload {
  const payload = exactObject(value, [
    'width', 'height', 'fps', 'durationFrames', 'sceneProfileId',
    'cameraProfileId', 'lightingProfileId', 'title',
  ], 'Three.js scene payload')
  const validated = validateThreeSceneInput({
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    ...payload,
  })
  return {
    width: validated.width,
    height: validated.height,
    fps: validated.fps,
    durationFrames: validated.durationFrames,
    sceneProfileId: validated.sceneProfileId,
    cameraProfileId: validated.cameraProfileId,
    lightingProfileId: validated.lightingProfileId,
    title: validated.title,
  }
}

export function validateOfflineSharpPlanningPayload(
  value: unknown,
): OfflineSharpPlanningPayload {
  const payload = exactObject(value, [
    'imageRecipeId', 'outputFormat', 'outputWidth', 'outputHeight',
    'preserveMetadata', 'allowUpscale',
  ], 'Sharp planning payload')
  const imageRecipeId = oneOf(payload.imageRecipeId, [
    'approved_thumbnail_v1',
    'approved_panel_asset_v1',
    'approved_overlay_asset_v1',
    'approved_living_frame_alpha_component_v1',
  ] as const, 'imageRecipeId')
  const outputFormat = oneOf(
    payload.outputFormat,
    ['png', 'jpeg', 'webp'] as const,
    'outputFormat',
  )
  const livingFrameAlphaComponent =
    imageRecipeId === 'approved_living_frame_alpha_component_v1'
  const maximumWidth = livingFrameAlphaComponent ? 4_096 : 1_920
  const maximumHeight = livingFrameAlphaComponent ? 4_096 : 1_080
  if (
    payload.preserveMetadata !== false || payload.allowUpscale !== false ||
    !Number.isSafeInteger(payload.outputWidth) || Number(payload.outputWidth) < 1 ||
    Number(payload.outputWidth) > maximumWidth ||
    !Number.isSafeInteger(payload.outputHeight) || Number(payload.outputHeight) < 1 ||
    Number(payload.outputHeight) > maximumHeight ||
    Number(payload.outputWidth) * Number(payload.outputHeight) > 16_777_216 ||
    (livingFrameAlphaComponent && outputFormat !== 'png')
  ) throw invalidInput('Sharp planning dimensions, format, or metadata policy are invalid.')
  return {
    imageRecipeId,
    outputFormat,
    outputWidth: Number(payload.outputWidth),
    outputHeight: Number(payload.outputHeight),
    preserveMetadata: false,
    allowUpscale: false,
  }
}

function normalizeSharpPayload(value: unknown): OfflineNodeStructuredSharpPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput('Sharp execution payload must be a plain object.')
  }
  const candidate = value as Record<string, unknown>
  if (candidate.imageRecipeId === 'approved_living_frame_alpha_component_v1') {
    const payload = exactObject(value, [
      'imageRecipeId', 'outputFormat', 'outputWidth', 'outputHeight',
      'preserveMetadata', 'allowUpscale', 'sourceMimeType', 'sourceByteLength',
      'sourceSha256', 'sourceBytesBase64', 'maskMimeType', 'maskByteLength',
      'maskSha256', 'maskBytesBase64',
    ], 'Sharp alpha-component execution payload')
    const planning = validateOfflineSharpPlanningPayload({
      imageRecipeId: payload.imageRecipeId,
      outputFormat: payload.outputFormat,
      outputWidth: payload.outputWidth,
      outputHeight: payload.outputHeight,
      preserveMetadata: payload.preserveMetadata,
      allowUpscale: payload.allowUpscale,
    })
    if (
      planning.imageRecipeId !== 'approved_living_frame_alpha_component_v1' ||
      planning.outputFormat !== 'png' ||
      payload.sourceMimeType !== 'image/png' ||
      payload.maskMimeType !== 'image/png'
    ) throw invalidInput('Sharp alpha-component media policy is invalid.')
    const source = committedPngBytes(payload, 'source')
    const mask = committedPngBytes(payload, 'mask')
    return {
      ...planning,
      imageRecipeId: 'approved_living_frame_alpha_component_v1',
      outputFormat: 'png',
      sourceMimeType: 'image/png',
      sourceByteLength: source.byteLength,
      sourceSha256: String(payload.sourceSha256),
      sourceBytesBase64: String(payload.sourceBytesBase64),
      maskMimeType: 'image/png',
      maskByteLength: mask.byteLength,
      maskSha256: String(payload.maskSha256),
      maskBytesBase64: String(payload.maskBytesBase64),
    }
  }
  const payload = exactObject(value, [
    'imageRecipeId', 'outputFormat', 'outputWidth', 'outputHeight',
    'preserveMetadata', 'allowUpscale', 'sourceMimeType', 'sourceByteLength',
    'sourceSha256', 'sourceBytesBase64',
  ], 'Sharp execution payload')
  const planning = validateOfflineSharpPlanningPayload({
    imageRecipeId: payload.imageRecipeId,
    outputFormat: payload.outputFormat,
    outputWidth: payload.outputWidth,
    outputHeight: payload.outputHeight,
    preserveMetadata: payload.preserveMetadata,
    allowUpscale: payload.allowUpscale,
  })
  if (
    payload.sourceMimeType !== 'image/svg+xml' ||
    !Number.isSafeInteger(payload.sourceByteLength) || Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > 2 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalidInput('Sharp source commitment is invalid.')
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    sha256(bytes) !== payload.sourceSha256
  ) throw invalidInput('Sharp source bytes do not match their immutable commitment.')
  return {
    ...planning,
    imageRecipeId: planning.imageRecipeId as
      'approved_thumbnail_v1' | 'approved_panel_asset_v1' | 'approved_overlay_asset_v1',
    outputFormat: planning.outputFormat,
    sourceMimeType: 'image/svg+xml', sourceByteLength: bytes.byteLength,
    sourceSha256: payload.sourceSha256, sourceBytesBase64: payload.sourceBytesBase64,
  }
}

function committedPngBytes(
  payload: Record<string, unknown>,
  prefix: 'source' | 'mask',
): Buffer {
  const byteLength = payload[`${prefix}ByteLength`]
  const digest = payload[`${prefix}Sha256`]
  const encoded = payload[`${prefix}BytesBase64`]
  if (
    !Number.isSafeInteger(byteLength) ||
    Number(byteLength) < 64 ||
    Number(byteLength) > OFFLINE_NODE_RUNNER_LIMITS.maximumImageBytes ||
    typeof digest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(digest) ||
    typeof encoded !== 'string'
  ) throw invalidInput(`Sharp ${prefix} PNG commitment is invalid.`)
  const bytes = Buffer.from(encoded, 'base64')
  if (
    bytes.byteLength !== byteLength ||
    bytes.toString('base64') !== encoded ||
    sha256(bytes) !== digest ||
    !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
  ) throw invalidInput(`Sharp ${prefix} PNG bytes do not match their immutable commitment.`)
  return bytes
}

function assertJsonData(
  value: unknown,
  path: string,
  depth: number,
  counter: { nodes: number },
): void {
  counter.nodes += 1
  if (counter.nodes > 1_024 || depth > 8) {
    throw new OfflineNodeRunnerValidationError('INPUT_TOO_LARGE', 'Structured execution JSON is too complex.')
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw invalidInput(`${path} contains a non-finite number.`)
    return
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      assertJsonData(value[index], `${path}[${index}]`, depth + 1, counter)
    }
    return
  }
  if (!value || typeof value !== 'object') {
    throw invalidInput(`${path} must contain JSON data only.`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw invalidInput(`${path} must contain plain JSON objects only.`)
  }
  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw invalidInput(`${path} must not contain symbol fields.`)
  }
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value') || descriptor.value === undefined) {
      throw invalidInput(`${path}.${key} must be an enumerable JSON value.`)
    }
    assertJsonData(descriptor.value, `${path}.${key}`, depth + 1, counter)
  }
}

function exactObject(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidInput(`${label} must be a plain object.`)
  }
  const observed = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (observed.join('\u0000') !== expected.join('\u0000')) {
    throw invalidInput(`${label} contains missing or unsupported fields.`)
  }
  return value as Record<string, unknown>
}

function boundedInteger(value: unknown, label: string): number {
  const minimum = label === 'width'
    ? OFFLINE_NODE_RUNNER_LIMITS.minimumWidth
    : OFFLINE_NODE_RUNNER_LIMITS.minimumHeight
  const maximum = label === 'width'
    ? OFFLINE_NODE_RUNNER_LIMITS.maximumWidth
    : OFFLINE_NODE_RUNNER_LIMITS.maximumHeight
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  ) {
    throw invalidInput(`${label} is outside the fixed runner bounds.`)
  }
  return Number(value)
}

function safeText(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== 'string') throw invalidInput(`${label} must be text.`)
  const hasControlCharacter = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return (codePoint <= 31 && ![9, 10, 13].includes(codePoint)) || codePoint === 127
  })
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (
    hasControlCharacter ||
    !normalized ||
    normalized.length > maximumLength ||
    /[<>]/.test(normalized) ||
    URL_OR_PATH_PATTERN.test(normalized) ||
    EXECUTABLE_TEXT_PATTERN.test(normalized)
  ) {
    throw new OfflineNodeRunnerValidationError('UNSAFE_CONTENT', `${label} contains unsafe content.`)
  }
  return normalized
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  options: T,
  label: string,
): T[number] {
  if (typeof value !== 'string' || !options.includes(value)) {
    throw invalidInput(`${label} is not allowlisted.`)
  }
  return value as T[number]
}

function invalidInput(message: string): OfflineNodeRunnerValidationError {
  return new OfflineNodeRunnerValidationError('INVALID_INPUT', message)
}
