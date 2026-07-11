import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  OFFLINE_NODE_RUNNER_PROTOCOL,
  runOfflineNodeToolOperation,
  type OfflineNodeRunnerResult,
  type OfflineNodeRunnerToolId,
  type OfflineSatoriCardInput,
  type OfflineStructuredChartInput,
  type OfflineVizGraphInput,
} from '../node-runners/index'

const CONTAINER_PROTOCOL = 'offline-node-runner-container-v1' as const
const MAXIMUM_STDIN_BYTES = 4 * 1024
type OfflineNodeActivationToolId = Exclude<
  OfflineNodeRunnerToolId,
  'svg_js' | 'sharp' | 'animejs' | 'three_js'
>
const PACKAGE_JSON_PATHS: Readonly<Record<OfflineNodeActivationToolId, string>> = Object.freeze({
  d3: 'd3/package.json',
  echarts: 'echarts/package.json',
  vega_lite: 'vega-lite/package.json',
  vega: 'vega/package.json',
  satori: 'satori/package.json',
  viz_js: '@viz-js/viz/package.json',
})

interface ContainerRequest {
  toolId: OfflineNodeActivationToolId
  operationId: string
}

if (process.argv.length !== 2) {
  fail('INVALID_INPUT')
} else {
  main().catch((error: unknown) => fail(errorCode(error)))
}

async function main(): Promise<void> {
  const request = parseRequest(await readBoundedStdin())
  const resourceBefore = process.resourceUsage()
  const memoryBefore = process.memoryUsage()
  const wallStartedAt = process.hrtime.bigint()
  const result = await runOfflineNodeToolOperation({
    toolId: request.toolId,
    operationId: request.operationId,
    payload: fixedFixtureFor(request.toolId),
  })
  const wallEndedAt = process.hrtime.bigint()
  const resourceAfter = process.resourceUsage()
  const memoryAfter = process.memoryUsage()
  const output = {
    schemaVersion: CONTAINER_PROTOCOL,
    ok: true as const,
    toolId: result.toolId,
    operationId: result.operationId,
    status: result.status,
    actualToolPackageExecuted: result.actualToolPackageExecuted,
    source: result.source,
    packageIdentity: packageIdentity(result, request.toolId),
    bundleIdentity: bundleIdentity(),
    runtimeIdentity: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uid: typeof process.getuid === 'function' ? process.getuid() : null,
      gid: typeof process.getgid === 'function' ? process.getgid() : null,
    },
    inputSha256: result.inputSha256,
    artifacts: result.artifacts.map((artifact) => ({
      artifactKind: artifact.artifactKind,
      mimeType: artifact.mimeType,
      sha256: artifact.sha256,
      byteLength: artifact.byteLength,
      bytesBase64: artifact.bytes.toString('base64'),
      privateArtifactRequired: artifact.privateArtifactRequired,
      publicUrl: artifact.publicUrl,
    })),
    semanticEvidence: result.semanticEvidence,
    processResourceUsage: {
      wallTimeMicroseconds: Number((wallEndedAt - wallStartedAt) / 1_000n),
      userCpuMicroseconds: resourceAfter.userCPUTime - resourceBefore.userCPUTime,
      systemCpuMicroseconds: resourceAfter.systemCPUTime - resourceBefore.systemCPUTime,
      maxRssKilobytes: resourceAfter.maxRSS,
      minorPageFaults: resourceAfter.minorPageFault - resourceBefore.minorPageFault,
      majorPageFaults: resourceAfter.majorPageFault - resourceBefore.majorPageFault,
      voluntaryContextSwitches: resourceAfter.voluntaryContextSwitches - resourceBefore.voluntaryContextSwitches,
      involuntaryContextSwitches: resourceAfter.involuntaryContextSwitches - resourceBefore.involuntaryContextSwitches,
      fsReadOperations: resourceAfter.fsRead - resourceBefore.fsRead,
      fsWriteOperations: resourceAfter.fsWrite - resourceBefore.fsWrite,
      rssBytesBefore: memoryBefore.rss,
      rssBytesAfter: memoryAfter.rss,
      heapUsedBytesBefore: memoryBefore.heapUsed,
      heapUsedBytesAfter: memoryAfter.heapUsed,
    },
    confinementExpectations: {
      networkMode: 'none',
      readOnlyRootFilesystem: true,
      nonRootUid: 10_001,
      noCallerMounts: true,
      noCallerEnvironment: true,
      noCallerPathsUrlsCommandsOrSecrets: true,
    },
    readiness: {
      privateInternalActivationEvidenceOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      dispatchAuthorityChanged: false,
    },
  }
  process.stdout.write(`${JSON.stringify(output)}\n`)
}

async function readBoundedStdin(): Promise<string> {
  const chunks: Buffer[] = []
  let byteLength = 0
  for await (const chunk of process.stdin) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    byteLength += bytes.byteLength
    if (byteLength > MAXIMUM_STDIN_BYTES) throw codedError('INPUT_TOO_LARGE')
    chunks.push(bytes)
  }
  if (byteLength < 2) throw codedError('INVALID_INPUT')
  return Buffer.concat(chunks).toString('utf8')
}

function parseRequest(serialized: string): ContainerRequest {
  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch {
    throw codedError('INVALID_INPUT')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw codedError('INVALID_INPUT')
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('\u0000') !== ['operationId', 'toolId'].join('\u0000')) {
    throw codedError('INVALID_INPUT')
  }
  if (
    !['d3', 'echarts', 'vega_lite', 'vega', 'satori', 'viz_js'].includes(String(record.toolId)) ||
    typeof record.operationId !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,199}$/.test(record.operationId) ||
    record.operationId.includes('..')
  ) {
    throw codedError('INVALID_INPUT')
  }
  return record as unknown as ContainerRequest
}

function fixedFixtureFor(toolId: OfflineNodeActivationToolId): unknown {
  if (toolId === 'satori') return satoriFixture()
  if (toolId === 'viz_js') return vizFixture()
  return chartFixture()
}

function chartFixture(): OfflineStructuredChartInput {
  return {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: 640,
    height: 360,
    title: 'Quarterly revenue',
    xAxisLabel: 'Quarter',
    yAxisLabel: 'Revenue',
    theme: 'light',
    data: [
      { label: 'Q1', value: 14 },
      { label: 'Q2', value: 23 },
      { label: 'Q3', value: 31 },
    ],
  }
}

function satoriFixture(): OfflineSatoriCardInput {
  const fontUrl = new URL('./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf', import.meta.url)
  const fontBytes = new Uint8Array(readFileSync(fontUrl))
  return {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    width: 640,
    height: 360,
    theme: 'dark',
    eyebrow: 'ReeditPro',
    title: 'Professional editing, approved first',
    body: 'A fixed private card rendered from structured text and an image-baked font.',
    callout: 'Private activation',
    font: {
      family: 'ReeditProSans',
      sha256: sha256(fontBytes),
      bytes: fontBytes,
    },
  }
}

function vizFixture(): OfflineVizGraphInput {
  return {
    protocol: OFFLINE_NODE_RUNNER_PROTOCOL,
    source: 'server_resolved_in_memory',
    direction: 'left_to_right',
    theme: 'dark',
    title: 'Approved edit flow',
    nodes: [
      { id: 'source', label: 'Source clips' },
      { id: 'plan', label: 'Approved plan' },
      { id: 'output', label: 'Private output' },
    ],
    edges: [
      { from: 'source', to: 'plan', label: 'analyze' },
      { from: 'plan', to: 'output', label: 'execute' },
    ],
  }
}

function packageIdentity(result: OfflineNodeRunnerResult, toolId: OfflineNodeActivationToolId) {
  if (result.toolId !== toolId) throw codedError('INVALID_OUTPUT')
  const relativePath = PACKAGE_JSON_PATHS[toolId]
  const packageUrl = new URL(`./node_modules/${relativePath}`, import.meta.url)
  const bytes = readFileSync(packageUrl)
  const metadata = JSON.parse(bytes.toString('utf8')) as { name?: unknown; version?: unknown }
  if (metadata.name !== result.packageName || typeof metadata.version !== 'string') {
    throw codedError('INVALID_OUTPUT')
  }
  return {
    packageName: result.packageName,
    version: metadata.version,
    packageJsonSha256: sha256(bytes),
    invokedEntrypoints: [...result.invokedEntrypoints],
  }
}

function bundleIdentity() {
  const bundleBytes = readFileSync(fileURLToPath(import.meta.url))
  return {
    sha256: sha256(bundleBytes),
    byteLength: bundleBytes.byteLength,
  }
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function codedError(code: string): Error & { code: string } {
  return Object.assign(new Error('Offline runner request rejected.'), { code })
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'INTERNAL_ERROR'
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' && /^[A-Z_]{3,40}$/.test(code) ? code : 'INTERNAL_ERROR'
}

function fail(code: string): never {
  process.stderr.write(`${JSON.stringify({
    schemaVersion: CONTAINER_PROTOCOL,
    ok: false,
    error: { code, message: 'Offline runner request rejected.' },
    readiness: {
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  })}\n`)
  process.exit(2)
}
