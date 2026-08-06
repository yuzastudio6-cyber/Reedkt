import {
  OFFLINE_NODE_RUNNER_LIMITS,
  OFFLINE_NODE_RUNNER_PROTOCOL,
  type OfflineNodeRunnerArtifact,
  type OfflineNodeRunnerResult,
  type OfflineNodeRunnerSvgSemanticEvidence,
  type OfflineNodeRunnerToolId,
} from './offline-node-runner-types'
import {
  OfflineNodeRunnerValidationError,
  sha256,
  stableStringify,
} from './offline-node-runner-security'
import { getOfflineNodeRunnerCanonicalOperation } from './offline-node-runner-canonical-operations'

export interface CreateOfflineNodeRunnerResultInput {
  toolId: OfflineNodeRunnerToolId
  packageName: string
  invokedEntrypoints: readonly string[]
  sourceInput: unknown
  svg: string
  elapsedMilliseconds: number
  normalizedForDeterminism: boolean
  expectedWidth?: number
  expectedHeight?: number
  minimumTextElements?: number
  minimumPathElements?: number
  minimumRectElements?: number
  minimumGroupElements?: number
}

export function createOfflineNodeRunnerResult(
  input: CreateOfflineNodeRunnerResultInput,
): OfflineNodeRunnerResult {
  const canonicalOperation = getOfflineNodeRunnerCanonicalOperation(input.toolId)
  if (canonicalOperation.packageName !== input.packageName) {
    throw new OfflineNodeRunnerValidationError(
      'INVALID_OUTPUT',
      `${input.toolId} runner package does not match its authoritative entrypoint identity.`,
    )
  }
  const normalizedSvg = normalizeSvgDocument(input.svg)
  const semanticEvidence = validateSvgDocument(normalizedSvg, input)
  const svgArtifact = createArtifact('svg', 'image/svg+xml', Buffer.from(normalizedSvg, 'utf8'))
  const inputSha256 = sha256(stableStringify(input.sourceInput))
  const verificationDocument = {
    schemaVersion: 'offline-node-runner-verification-v1',
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    toolId: input.toolId,
    operationId: canonicalOperation.operationId,
    packageName: input.packageName,
    invokedEntrypoints: [...input.invokedEntrypoints],
    actualToolPackageExecuted: true,
    source: 'server_resolved_in_memory',
    inputSha256,
    svgSha256: svgArtifact.sha256,
    svgByteLength: svgArtifact.byteLength,
    semanticEvidence,
    networkPolicy: 'offline_no_caller_targets_no_provider_calls',
    frontendExecutionAllowed: false,
    readinessScope: 'tool_specific_operation_evidence_only',
  }
  const verificationArtifact = createArtifact(
    'verification_json',
    'application/json',
    Buffer.from(stableStringify(verificationDocument), 'utf8'),
  )
  if (verificationArtifact.byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumVerificationJsonBytes) {
    throw new OfflineNodeRunnerValidationError('OUTPUT_TOO_LARGE', 'Verification JSON exceeds its fixed byte ceiling.')
  }

  return {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    toolId: input.toolId,
    operationId: canonicalOperation.operationId,
    status: 'actual_library_operation_completed',
    source: 'server_resolved_in_memory',
    actualToolPackageExecuted: true,
    packageName: input.packageName,
    invokedEntrypoints: [...input.invokedEntrypoints],
    normalizedForDeterminism: input.normalizedForDeterminism,
    inputSha256,
    elapsedMilliseconds: input.elapsedMilliseconds,
    timeoutCeilingMilliseconds: OFFLINE_NODE_RUNNER_LIMITS.timeoutMilliseconds,
    outputByteCeiling: OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes,
    artifacts: [svgArtifact, verificationArtifact],
    semanticEvidence,
    networkPolicy: 'offline_no_caller_targets_no_provider_calls',
    frontendExecutionAllowed: false,
    readinessScope: 'tool_specific_operation_evidence_only',
  }
}

export function normalizeEchartsGeneratedIdentifiers(svg: string): string {
  const tokenPattern = /\bzr\d+-(?:cls|clip|gradient|pattern)-\d+\b/g
  const replacements = new Map<string, string>()
  return svg.replace(tokenPattern, (token) => {
    let replacement = replacements.get(token)
    if (!replacement) {
      replacement = `reeditpro-zr-${replacements.size}`
      replacements.set(token, replacement)
    }
    return replacement
  })
}

export function normalizeVegaGeneratedIdentifiers(svg: string): string {
  const tokenPattern = /\b(?:clip|gradient|symbol)\d+\b/g
  const replacements = new Map<string, string>()
  return svg.replace(tokenPattern, (token) => {
    let replacement = replacements.get(token)
    if (!replacement) {
      replacement = `reeditpro-vega-${replacements.size}`
      replacements.set(token, replacement)
    }
    return replacement
  })
}

export function normalizeSvgDocument(svg: string): string {
  if (typeof svg !== 'string') throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'Library SVG output must be text.')
  const normalized = svg
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
  const byteLength = Buffer.byteLength(normalized, 'utf8')
  if (byteLength < 64) throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'Library SVG output is unexpectedly empty.')
  if (byteLength > OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes) {
    throw new OfflineNodeRunnerValidationError(
      'OUTPUT_TOO_LARGE',
      `Library SVG output exceeds ${OFFLINE_NODE_RUNNER_LIMITS.maximumSvgBytes} bytes.`,
    )
  }
  return normalized
}

function validateSvgDocument(
  svg: string,
  expectations: Pick<
    CreateOfflineNodeRunnerResultInput,
    | 'expectedWidth'
    | 'expectedHeight'
    | 'minimumTextElements'
    | 'minimumPathElements'
    | 'minimumRectElements'
    | 'minimumGroupElements'
  >,
): OfflineNodeRunnerSvgSemanticEvidence {
  const svgRoots = svg.match(/<svg\b/gi)?.length ?? 0
  const svgClosures = svg.match(/<\/svg\s*>/gi)?.length ?? 0
  if (svgRoots !== 1 || svgClosures !== 1 || !/^<svg\b/i.test(svg)) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'Library output must contain exactly one complete SVG root.')
  }
  if (/<(?:script|foreignObject|iframe|object|embed|link|meta|audio|video|canvas)\b/i.test(svg)) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG output contains a forbidden active or embedded-content element.')
  }
  if (
    /\son[a-z]+\s*=/i.test(svg) ||
    /(?:javascript:|data:|file:|vbscript:|@import\b|expression\s*\(|-moz-binding\s*:|behavior\s*:)/i.test(svg)
  ) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG output contains an executable handler or forbidden URI scheme.')
  }
  for (const match of svg.matchAll(/\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    if (!match[2]?.startsWith('#')) {
      throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG output contains an external resource reference.')
    }
  }
  for (const match of svg.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!match[2]?.startsWith('#')) {
      throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG output contains a non-local CSS resource reference.')
    }
  }
  if (/(?:\bNaN\b|[+-]?Infinity)/.test(svg)) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG output contains non-finite numeric values.')
  }
  const elementCount = svg.match(/<[A-Za-z][A-Za-z0-9:_-]*\b/g)?.length ?? 0
  if (elementCount < 1 || elementCount > OFFLINE_NODE_RUNNER_LIMITS.maximumSvgElements) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG element count is outside the fixed semantic ceiling.')
  }
  const textElementCount = svg.match(/<text\b/gi)?.length ?? 0
  const pathElementCount = svg.match(/<path\b/gi)?.length ?? 0
  const rectElementCount = svg.match(/<rect\b/gi)?.length ?? 0
  const groupElementCount = svg.match(/<g\b/gi)?.length ?? 0
  assertMinimum(textElementCount, expectations.minimumTextElements, 'text')
  assertMinimum(pathElementCount, expectations.minimumPathElements, 'path')
  assertMinimum(rectElementCount, expectations.minimumRectElements, 'rect')
  assertMinimum(groupElementCount, expectations.minimumGroupElements, 'group')

  const rootTag = svg.match(/^<svg\b[^>]*>/i)?.[0] ?? ''
  const declaredWidth = numericSvgAttribute(rootTag, 'width')
  const declaredHeight = numericSvgAttribute(rootTag, 'height')
  const viewBox = stringSvgAttribute(rootTag, 'viewBox')
  if (expectations.expectedWidth !== undefined && declaredWidth !== expectations.expectedWidth) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG width does not match the fixed runner request.')
  }
  if (expectations.expectedHeight !== undefined && declaredHeight !== expectations.expectedHeight) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG height does not match the fixed runner request.')
  }
  if (declaredWidth !== undefined && (!Number.isFinite(declaredWidth) || declaredWidth <= 0)) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG width must be finite and positive.')
  }
  if (declaredHeight !== undefined && (!Number.isFinite(declaredHeight) || declaredHeight <= 0)) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG height must be finite and positive.')
  }
  if (declaredWidth === undefined && declaredHeight === undefined && !viewBox) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', 'SVG must declare dimensions or a viewBox.')
  }

  return {
    svgRootCount: 1,
    elementCount,
    textElementCount,
    pathElementCount,
    rectElementCount,
    groupElementCount,
    declaredWidth,
    declaredHeight,
    viewBox,
    unsafeMarkupRejected: true,
    externalReferencesRejected: true,
    finiteNumericOutputVerified: true,
  }
}

function createArtifact(
  artifactKind: OfflineNodeRunnerArtifact['artifactKind'],
  mimeType: OfflineNodeRunnerArtifact['mimeType'],
  bytes: Buffer,
): OfflineNodeRunnerArtifact {
  return {
    artifactKind,
    mimeType,
    bytes: Buffer.from(bytes),
    sha256: sha256(bytes),
    byteLength: bytes.byteLength,
    privateArtifactRequired: true,
    publicUrl: null,
  }
}

function numericSvgAttribute(rootTag: string, name: string): number | undefined {
  const raw = stringSvgAttribute(rootTag, name)
  if (raw === undefined) return undefined
  const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)(?:px|pt)?$/i)
  return match ? Number(match[1]) : undefined
}

function stringSvgAttribute(rootTag: string, name: string): string | undefined {
  const match = rootTag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return match?.[1]
}

function assertMinimum(actual: number, minimum: number | undefined, label: string): void {
  if (minimum !== undefined && actual < minimum) {
    throw new OfflineNodeRunnerValidationError('INVALID_OUTPUT', `SVG output has too few ${label} elements.`)
  }
}
