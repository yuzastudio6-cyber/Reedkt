import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  runOfflineNodeToolOperation,
  type OfflineNodeRunnerResult,
  type OfflineNodeRunnerToolId,
} from '../node-runners/index'
import {
  createValidatedOfflineNodeRunnerPayload,
  OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL,
  structuredExecutionRequestSha256,
} from './offline-node-structured-execution-protocol'

const MAXIMUM_STDIN_BYTES = 48 * 1024 * 1024 + 8 * 1024
const PACKAGE_JSON_PATHS: Readonly<Record<OfflineNodeRunnerToolId, string>> = Object.freeze({
  d3: 'd3/package.json',
  echarts: 'echarts/package.json',
  vega_lite: 'vega-lite/package.json',
  vega: 'vega/package.json',
  satori: 'satori/package.json',
  sharp: 'sharp/package.json',
  svg_js: '@svgdotjs/svg.js/package.json',
  viz_js: '@viz-js/viz/package.json',
  animejs: 'animejs/package.json',
  three_js: 'three/package.json',
})

if (process.argv.length !== 2) {
  fail('INVALID_INPUT')
} else {
  main().catch((error: unknown) => fail(errorCode(error)))
}

async function main(): Promise<void> {
  const raw = await readBoundedStdin()
  let decoded: unknown
  try {
    decoded = JSON.parse(raw)
  } catch {
    throw codedError('INVALID_INPUT')
  }
  const satoriFont = loadImageBakedFont()
  const { request, runnerPayload } = createValidatedOfflineNodeRunnerPayload(decoded, satoriFont)
  const observedStartedAtMs = Date.now()
  const resourceBefore = process.resourceUsage()
  const memoryBefore = process.memoryUsage()
  const wallStartedAt = process.hrtime.bigint()
  const result = await runOfflineNodeToolOperation({
    toolId: request.toolId,
    operationId: request.operationId,
    payload: runnerPayload,
  })
  const wallEndedAt = process.hrtime.bigint()
  const resourceAfter = process.resourceUsage()
  const memoryAfter = process.memoryUsage()
  const observedDurationMilliseconds = Math.max(
    1,
    Number((wallEndedAt - wallStartedAt + 999_999n) / 1_000_000n),
  )
  const observedFinishedAtMs = Math.max(
    Date.now(),
    observedStartedAtMs + observedDurationMilliseconds,
  )
  const output = {
    schemaVersion: OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL,
    ok: true as const,
    toolId: result.toolId,
    operationId: result.operationId,
    status: result.status,
    actualToolPackageExecuted: result.actualToolPackageExecuted,
    source: result.source,
    requestEnvelopeSha256: structuredExecutionRequestSha256(request),
    packageIdentity: packageIdentity(result),
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
    resourceObservation: {
      schemaVersion: 'private-embedded-process-resource-observation-wire-v1' as const,
      observerKind: 'node_process_resource_usage_v1' as const,
      measurementAgentVersion: 'embedded_node_process_resource_observer_v1' as const,
      start: resourceObservationPoint(resourceBefore, memoryBefore, observedStartedAtMs),
      finish: resourceObservationPoint(resourceAfter, memoryAfter, observedFinishedAtMs),
    },
    confinementExpectations: {
      networkMode: 'none',
      readOnlyRootFilesystem: true,
      nonRootUid: 10_001,
      noCallerMounts: true,
      noCallerEnvironment: true,
      noCallerCommandOrEntrypoint: true,
      noCallerPathsUrlsCommandsCodeOrSecrets: true,
    },
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      canonicalDispatchIntegrated: false,
    },
  }
  process.stdout.write(`${JSON.stringify(output)}\n`)
}

function resourceObservationPoint(
  usage: NodeJS.ResourceUsage,
  memory: NodeJS.MemoryUsage,
  capturedAtMs: number,
) {
  return {
    capturedAt: new Date(capturedAtMs).toISOString(),
    cpuUsageNanoseconds: (usage.userCPUTime + usage.systemCPUTime) * 1_000,
    memoryCurrentBytes: memory.rss,
    memoryPeakBytes: Math.max(memory.rss, usage.maxRSS * 1_024),
    gpuActiveMilliseconds: null,
  }
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

function loadImageBakedFont() {
  const fontUrl = new URL('./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf', import.meta.url)
  const bytes = new Uint8Array(readFileSync(fontUrl))
  return {
    family: 'ReeditProSans' as const,
    sha256: sha256(bytes),
    bytes,
  }
}

function packageIdentity(result: OfflineNodeRunnerResult) {
  const relativePath = PACKAGE_JSON_PATHS[result.toolId]
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
  const bytes = readFileSync(fileURLToPath(import.meta.url))
  return { sha256: sha256(bytes), byteLength: bytes.byteLength }
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function codedError(code: string): Error & { code: string } {
  return Object.assign(new Error('Private structured runner request rejected.'), { code })
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return 'INTERNAL_ERROR'
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' && /^[A-Z_]{3,40}$/.test(code) ? code : 'INTERNAL_ERROR'
}

function fail(code: string): never {
  process.stderr.write(`${JSON.stringify({
    schemaVersion: OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL,
    ok: false,
    error: { code, message: 'Private structured runner request rejected.' },
    readiness: {
      privateInternalOnly: true,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
    },
  })}\n`)
  process.exit(2)
}
