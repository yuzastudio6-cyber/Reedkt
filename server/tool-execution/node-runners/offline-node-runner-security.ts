import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'

import {
  OFFLINE_NODE_RUNNER_LIMITS,
  OFFLINE_NODE_RUNNER_PROTOCOL,
  type OfflineAnimeMotionInput,
  type OfflineSatoriCardInput,
  type OfflineSvgCardInput,
  type OfflineStructuredChartInput,
  type OfflineThreeSceneInput,
  type OfflineVizGraphInput,
} from './offline-node-runner-types'

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const GRAPH_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,47}$/

export class OfflineNodeRunnerValidationError extends Error {
  readonly code:
    | 'INVALID_INPUT'
    | 'INPUT_TOO_LARGE'
    | 'UNSAFE_CONTENT'
    | 'TIMEOUT'
    | 'OUTPUT_TOO_LARGE'
    | 'INVALID_OUTPUT'

  constructor(
    code: OfflineNodeRunnerValidationError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'OfflineNodeRunnerValidationError'
    this.code = code
  }
}

export interface OfflineNodeRunnerDeadline {
  readonly startedAt: number
  readonly timeoutMilliseconds: number
  assertWithin(stage: string): void
  elapsedMilliseconds(): number
}

export function createOfflineNodeRunnerDeadline(
  timeoutMilliseconds = OFFLINE_NODE_RUNNER_LIMITS.timeoutMilliseconds,
): OfflineNodeRunnerDeadline {
  if (!Number.isSafeInteger(timeoutMilliseconds) || timeoutMilliseconds < 1 ||
      timeoutMilliseconds > OFFLINE_NODE_RUNNER_LIMITS.timeoutMilliseconds) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Runner timeout must stay inside the fixed operation ceiling.')
  }
  const startedAt = performance.now()
  return {
    startedAt,
    timeoutMilliseconds,
    assertWithin(stage: string): void {
      if (performance.now() - startedAt > timeoutMilliseconds) {
        throw new OfflineNodeRunnerValidationError('TIMEOUT', `Offline library operation exceeded its deadline during ${stage}.`)
      }
    },
    elapsedMilliseconds(): number {
      return Math.max(0, performance.now() - startedAt)
    },
  }
}

export async function awaitWithOfflineDeadline<T>(
  work: Promise<T>,
  deadline: OfflineNodeRunnerDeadline,
  stage: string,
): Promise<T> {
  const remaining = Math.max(1, deadline.timeoutMilliseconds - deadline.elapsedMilliseconds())
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new OfflineNodeRunnerValidationError('TIMEOUT', `Offline library operation timed out during ${stage}.`))
        }, remaining)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function validateStructuredChartInput(value: unknown): OfflineStructuredChartInput {
  const input = exactObject(value, [
    'protocol',
    'source',
    'width',
    'height',
    'title',
    'xAxisLabel',
    'yAxisLabel',
    'theme',
    'data',
  ], 'chart input')
  assertProtocol(input)
  const width = boundedInteger(input.width, 'width', OFFLINE_NODE_RUNNER_LIMITS.minimumWidth, OFFLINE_NODE_RUNNER_LIMITS.maximumWidth)
  const height = boundedInteger(input.height, 'height', OFFLINE_NODE_RUNNER_LIMITS.minimumHeight, OFFLINE_NODE_RUNNER_LIMITS.maximumHeight)
  const title = safeText(input.title, 'title', 96)
  const xAxisLabel = safeText(input.xAxisLabel, 'xAxisLabel', 48)
  const yAxisLabel = safeText(input.yAxisLabel, 'yAxisLabel', 48)
  const theme = oneOf(input.theme, ['light', 'dark'] as const, 'theme')
  if (!Array.isArray(input.data) || input.data.length < 1 || input.data.length > OFFLINE_NODE_RUNNER_LIMITS.maximumChartDataItems) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      `data must contain 1-${OFFLINE_NODE_RUNNER_LIMITS.maximumChartDataItems} structured points.`,
    )
  }
  const labels = new Set<string>()
  const data = input.data.map((item, index) => {
    const record = exactObject(item, ['label', 'value'], `data[${index}]`)
    const label = safeText(record.label, `data[${index}].label`, 48)
    if (labels.has(label)) {
      throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Chart labels must be unique after normalization.')
    }
    labels.add(label)
    const valueNumber = finiteNumber(record.value, `data[${index}].value`, 0, 1_000_000_000)
    return { label, value: valueNumber }
  })
  const normalized: OfflineStructuredChartInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width,
    height,
    title,
    xAxisLabel,
    yAxisLabel,
    theme,
    data,
  }
  assertSerializedJsonSize(normalized)
  return normalized
}

export function validateSatoriCardInput(value: unknown): OfflineSatoriCardInput {
  const input = exactObject(value, [
    'protocol',
    'source',
    'width',
    'height',
    'theme',
    'eyebrow',
    'title',
    'body',
    'callout',
    'font',
  ], 'Satori card input')
  assertProtocol(input)
  const font = exactObject(input.font, ['family', 'sha256', 'bytes'], 'font')
  if (font.family !== 'ReeditProSans') {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Satori font family must use the fixed ReeditProSans runtime alias.')
  }
  if (typeof font.sha256 !== 'string' || !SHA256_PATTERN.test(font.sha256)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'font.sha256 must be a lowercase SHA-256 digest.')
  }
  if (!(font.bytes instanceof Uint8Array) || font.bytes.byteLength < 256 ||
      font.bytes.byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumFontBytes) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      `font.bytes must be 256-${OFFLINE_NODE_RUNNER_LIMITS.maximumFontBytes} server-resolved bytes.`,
    )
  }
  const fontBytes = new Uint8Array(font.bytes)
  const magic = Buffer.from(fontBytes.subarray(0, 4)).toString('hex')
  if (!['00010000', '4f54544f', '74727565'].includes(magic)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'font.bytes must contain a supported in-memory OpenType or TrueType font.')
  }
  if (sha256(fontBytes) !== font.sha256) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'font.sha256 does not match the server-resolved font bytes.')
  }
  const normalized: OfflineSatoriCardInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: boundedInteger(input.width, 'width', OFFLINE_NODE_RUNNER_LIMITS.minimumWidth, OFFLINE_NODE_RUNNER_LIMITS.maximumWidth),
    height: boundedInteger(input.height, 'height', OFFLINE_NODE_RUNNER_LIMITS.minimumHeight, OFFLINE_NODE_RUNNER_LIMITS.maximumHeight),
    theme: oneOf(input.theme, ['light', 'dark'] as const, 'theme'),
    eyebrow: safeText(input.eyebrow, 'eyebrow', 48),
    title: safeText(input.title, 'title', 96),
    body: safeText(input.body, 'body', 240),
    callout: safeText(input.callout, 'callout', 72),
    font: {
      family: 'ReeditProSans',
      sha256: font.sha256,
      bytes: fontBytes,
    },
  }
  assertSerializedJsonSize({
    ...normalized,
    font: { family: normalized.font.family, sha256: normalized.font.sha256, byteLength: fontBytes.byteLength },
  })
  return normalized
}

export function validateSvgCardInput(value: unknown): OfflineSvgCardInput {
  const input = exactObject(value, [
    'protocol', 'source', 'width', 'height', 'theme', 'eyebrow', 'title', 'body', 'callout',
  ], 'SVG.js card input')
  assertProtocol(input)
  const normalized: OfflineSvgCardInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: boundedInteger(input.width, 'width', OFFLINE_NODE_RUNNER_LIMITS.minimumWidth, OFFLINE_NODE_RUNNER_LIMITS.maximumWidth),
    height: boundedInteger(input.height, 'height', OFFLINE_NODE_RUNNER_LIMITS.minimumHeight, OFFLINE_NODE_RUNNER_LIMITS.maximumHeight),
    theme: oneOf(input.theme, ['light', 'dark'] as const, 'theme'),
    eyebrow: safeText(input.eyebrow, 'eyebrow', 48),
    title: safeText(input.title, 'title', 96),
    body: safeText(input.body, 'body', 240),
    callout: safeText(input.callout, 'callout', 72),
  }
  assertSerializedJsonSize(normalized)
  return normalized
}

export function validateAnimeMotionInput(value: unknown): OfflineAnimeMotionInput {
  const input = exactObject(value, [
    'protocol', 'source', 'width', 'height', 'fps', 'durationFrames',
    'motionProfileId', 'backgroundMode', 'title',
  ], 'Anime.js motion input')
  assertProtocol(input)
  const fps = boundedInteger(input.fps, 'fps', 12, 60)
  if (![12, 24, 25, 30, 50, 60].includes(fps)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Anime.js fps is unsupported.')
  }
  const normalized: OfflineAnimeMotionInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: boundedInteger(
      input.width, 'width', OFFLINE_NODE_RUNNER_LIMITS.minimumWidth,
      OFFLINE_NODE_RUNNER_LIMITS.maximumWidth,
    ),
    height: boundedInteger(
      input.height, 'height', OFFLINE_NODE_RUNNER_LIMITS.minimumHeight,
      OFFLINE_NODE_RUNNER_LIMITS.maximumHeight,
    ),
    fps: fps as OfflineAnimeMotionInput['fps'],
    durationFrames: boundedInteger(input.durationFrames, 'durationFrames', 1, 18_000),
    motionProfileId: oneOf(
      input.motionProfileId, ['approved_card_reveal_v1'] as const, 'motionProfileId',
    ),
    backgroundMode: oneOf(
      input.backgroundMode, ['opaque_panel', 'transparent_overlay'] as const,
      'backgroundMode',
    ),
    title: safeText(input.title, 'title', 96),
  }
  const durationMilliseconds = normalized.durationFrames / normalized.fps * 1_000
  if (durationMilliseconds > 30_000) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT', 'Anime.js motion duration exceeds the fixed 30-second ceiling.',
    )
  }
  assertSerializedJsonSize(normalized)
  return normalized
}

export function validateThreeSceneInput(value: unknown): OfflineThreeSceneInput {
  const input = exactObject(value, [
    'protocol', 'source', 'width', 'height', 'fps', 'durationFrames',
    'sceneProfileId', 'cameraProfileId', 'lightingProfileId', 'title',
  ], 'Three.js scene input')
  assertProtocol(input)
  const fps = boundedInteger(input.fps, 'fps', 12, 60)
  if (![12, 24, 25, 30, 50, 60].includes(fps)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Three.js fps is unsupported.')
  }
  const normalized: OfflineThreeSceneInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: boundedInteger(
      input.width, 'width', OFFLINE_NODE_RUNNER_LIMITS.minimumWidth,
      OFFLINE_NODE_RUNNER_LIMITS.maximumWidth,
    ),
    height: boundedInteger(
      input.height, 'height', OFFLINE_NODE_RUNNER_LIMITS.minimumHeight,
      OFFLINE_NODE_RUNNER_LIMITS.maximumHeight,
    ),
    fps: fps as OfflineThreeSceneInput['fps'],
    durationFrames: boundedInteger(input.durationFrames, 'durationFrames', 1, 9_000),
    sceneProfileId: oneOf(
      input.sceneProfileId, ['approved_product_cube_v1'] as const, 'sceneProfileId',
    ),
    cameraProfileId: oneOf(
      input.cameraProfileId, ['approved_perspective_v1'] as const, 'cameraProfileId',
    ),
    lightingProfileId: oneOf(
      input.lightingProfileId, ['approved_studio_v1'] as const, 'lightingProfileId',
    ),
    title: safeText(input.title, 'title', 96),
  }
  if (normalized.durationFrames / normalized.fps * 1_000 > 30_000) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT', 'Three.js scene duration exceeds the fixed 30-second ceiling.',
    )
  }
  assertSerializedJsonSize(normalized)
  return normalized
}

export function validateVizGraphInput(value: unknown): OfflineVizGraphInput {
  const input = exactObject(value, [
    'protocol',
    'source',
    'direction',
    'theme',
    'title',
    'nodes',
    'edges',
  ], 'Viz.js graph input')
  assertProtocol(input)
  if (!Array.isArray(input.nodes) || input.nodes.length < 1 ||
      input.nodes.length > OFFLINE_NODE_RUNNER_LIMITS.maximumGraphNodes) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      `nodes must contain 1-${OFFLINE_NODE_RUNNER_LIMITS.maximumGraphNodes} structured nodes.`,
    )
  }
  const ids = new Set<string>()
  const nodes = input.nodes.map((item, index) => {
    const record = exactObject(item, ['id', 'label'], `nodes[${index}]`)
    if (typeof record.id !== 'string' || !GRAPH_ID_PATTERN.test(record.id)) {
      throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `nodes[${index}].id is not a safe graph identifier.`)
    }
    if (ids.has(record.id)) throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Graph node IDs must be unique.')
    ids.add(record.id)
    return { id: record.id, label: safeText(record.label, `nodes[${index}].label`, 72) }
  })
  if (!Array.isArray(input.edges) || input.edges.length > OFFLINE_NODE_RUNNER_LIMITS.maximumGraphEdges) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      `edges must contain 0-${OFFLINE_NODE_RUNNER_LIMITS.maximumGraphEdges} structured edges.`,
    )
  }
  const edges = input.edges.map((item, index) => {
    const record = exactObject(item, ['from', 'to'], `edges[${index}]`, ['label'])
    if (typeof record.from !== 'string' || !ids.has(record.from) ||
        typeof record.to !== 'string' || !ids.has(record.to)) {
      throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `edges[${index}] must reference declared node IDs.`)
    }
    const edge: OfflineVizGraphInput['edges'][number] = { from: record.from, to: record.to }
    if (record.label !== undefined) edge.label = safeText(record.label, `edges[${index}].label`, 48)
    return edge
  })
  const normalized: OfflineVizGraphInput = {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    direction: oneOf(input.direction, ['left_to_right', 'top_to_bottom'] as const, 'direction'),
    theme: oneOf(input.theme, ['light', 'dark'] as const, 'theme'),
    title: safeText(input.title, 'title', 96),
    nodes,
    edges,
  }
  assertSerializedJsonSize(normalized)
  return normalized
}

export function stableStringify(value: unknown): string {
  const seen = new Set<object>()
  const normalize = (candidate: unknown): unknown => {
    if (candidate === null || typeof candidate !== 'object') {
      if (typeof candidate === 'number' && !Number.isFinite(candidate)) {
        throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Non-finite numbers are not valid runner input.')
      }
      return candidate
    }
    if (seen.has(candidate)) throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Cyclic runner input is not allowed.')
    seen.add(candidate)
    if (Array.isArray(candidate)) {
      const output = candidate.map(normalize)
      seen.delete(candidate)
      return output
    }
    if (candidate instanceof Uint8Array) {
      const output = { sha256: sha256(candidate), byteLength: candidate.byteLength }
      seen.delete(candidate)
      return output
    }
    if (!isPlainObject(candidate)) {
      throw new OfflineNodeRunnerValidationError('INVALID_INPUT', 'Runner input must contain plain JSON objects only.')
    }
    const output: Record<string, unknown> = {}
    for (const key of Object.keys(candidate).sort()) output[key] = normalize(candidate[key])
    seen.delete(candidate)
    return output
  }
  return JSON.stringify(normalize(value))
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function quoteDot(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', ' ')}"`
}

export function themeTokens(theme: 'light' | 'dark'): {
  background: string
  foreground: string
  muted: string
  grid: string
  accent: string
  accentSecondary: string
} {
  return theme === 'dark'
    ? {
        background: '#111318',
        foreground: '#f5f7fa',
        muted: '#a9b0bc',
        grid: '#2e333c',
        accent: '#7c9cff',
        accentSecondary: '#62d6c5',
      }
    : {
        background: '#ffffff',
        foreground: '#17191d',
        muted: '#646b76',
        grid: '#e7e9ee',
        accent: '#4f6fe8',
        accentSecondary: '#159b89',
      }
}

function assertProtocol(input: Record<string, unknown>): void {
  if (input.protocol !== OFFLINE_NODE_RUNNER_PROTOCOL || input.source !== 'server_resolved_in_memory') {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_INPUT',
      'Runner input must use offline-node-runner-v1 and server_resolved_in_memory source.',
    )
  }
}

function assertSerializedJsonSize(value: unknown): void {
  const byteLength = Buffer.byteLength(stableStringify(value), 'utf8')
  if (byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumInputJsonBytes) {
    throw new OfflineNodeRunnerValidationError(
      'INPUT_TOO_LARGE',
      `Runner input exceeds ${OFFLINE_NODE_RUNNER_LIMITS.maximumInputJsonBytes} bytes.`,
    )
  }
}

function exactObject(
  value: unknown,
  requiredKeys: readonly string[],
  label: string,
  optionalKeys: readonly string[] = [],
): Record<string, unknown> {
  if (!isPlainObject(value)) throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} must be a plain object.`)
  const allowed = new Set([...requiredKeys, ...optionalKeys])
  const unknownKeys = Object.keys(value).filter((key) => !allowed.has(key))
  if (unknownKeys.length > 0) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} contains unsupported fields: ${unknownKeys.join(', ')}.`)
  }
  const missingKeys = requiredKeys.filter((key) => !Object.hasOwn(value, key))
  if (missingKeys.length > 0) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} is missing required fields: ${missingKeys.join(', ')}.`)
  }
  return value
}

function safeText(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== 'string') throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} must be text.`)
  const hasControlCharacter = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return (codePoint <= 31 && codePoint !== 9 && codePoint !== 10 && codePoint !== 13) || codePoint === 127
  })
  if (hasControlCharacter) {
    throw new OfflineNodeRunnerValidationError('UNSAFE_CONTENT', `${label} contains a forbidden control character.`)
  }
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized || normalized.length > maximumLength) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} must contain 1-${maximumLength} safe characters.`)
  }
  if (
    /[<>]/.test(normalized) ||
    /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|www\.|@import\b|url\s*\()/i.test(normalized) ||
    /(?:\.\.\/|\.\.\\|[A-Za-z]:[\\/]|^\/)/.test(normalized) ||
    /\b(?:zr\d+-(?:cls|clip|gradient|pattern)-\d+|(?:clip|gradient|symbol)\d+)\b/i.test(normalized)
  ) {
    throw new OfflineNodeRunnerValidationError('UNSAFE_CONTENT', `${label} contains markup, a URL, a path, or executable content.`)
  }
  return normalized
}

function boundedInteger(value: unknown, label: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} must be an integer from ${minimum} to ${maximum}.`)
  }
  return value as number
}

function finiteNumber(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} must be a finite number from ${minimum} to ${maximum}.`)
  }
  return value
}

function oneOf<const T extends readonly string[]>(value: unknown, values: T, label: string): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new OfflineNodeRunnerValidationError('INVALID_INPUT', `${label} is not an allowlisted value.`)
  }
  return value as T[number]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
