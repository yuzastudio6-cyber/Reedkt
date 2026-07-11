import { chmod, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { writePrivateTextFileAtomicWithinRoot } from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { getOfflineNodeRunnerCanonicalOperation } from '../tool-execution/node-runners/offline-node-runner-canonical-operations'
import { runOfflineNodeStructuredContainer } from '../tool-execution/node-runner-execution/offline-node-structured-docker-runtime'
import {
  createPrivateOfflineNodeStructuredExecutionRuntime,
  OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
  readPersistedOfflineNodeStructuredExecutionAttestation,
  readPersistedOfflineNodeStructuredRuntimeAuthority,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-service'
import {
  OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL,
  type OfflineNodeStructuredExecutionRequest,
} from '../tool-execution/node-runner-execution/offline-node-structured-execution-protocol'

const TOOL_IDS = [
  'd3', 'echarts', 'vega_lite', 'vega', 'satori', 'svg_js', 'viz_js', 'animejs',
  'three_js',
] as const

let preparationInputRejected = false
try {
  await (createPrivateOfflineNodeStructuredExecutionRuntime as unknown as
    (input: unknown) => Promise<unknown>)({ env: { SECRET: 'not-allowed' } })
} catch {
  preparationInputRejected = true
}
check(preparationInputRejected, 'Runtime preparation must reject every caller-supplied input.')

const runtime = await createPrivateOfflineNodeStructuredExecutionRuntime()
check(runtime.image.imageId.startsWith('sha256:'), 'Runtime must execute the inspected immutable image ID.')
check(runtime.image.baseImageDigest ===
  'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5',
'Runtime base image must use the exact pinned digest.')
check(runtime.image.labels['com.reeditpro.runner.private-internal-only'] === 'true',
  'Image must be labeled private-internal only.')
check(runtime.image.labels['com.reeditpro.runner.product-ready'] === 'false',
  'Image must block product readiness.')
check(runtime.image.labels['com.reeditpro.runner.external-beta-ready'] === 'false',
  'Image must block external-beta readiness.')
check(runtime.image.labels['com.reeditpro.runner.production-ready'] === 'false',
  'Image must block production readiness.')
const runtimeAuthority = await readPersistedOfflineNodeStructuredRuntimeAuthority()
check(Boolean(runtimeAuthority), 'Runtime preparation must persist checksum-protected private authority.')
check(runtimeAuthority?.image.imageIdentityHash === runtime.image.imageIdentityHash,
  'Runtime authority must bind the exact inspected image identity.')
check(runtimeAuthority?.supportedOperations.length === TOOL_IDS.length + 1,
  'Runtime authority must enumerate the nine SVG operations plus Sharp.')
check(runtimeAuthority?.readiness.privateInternalExecutionReady === true,
  'Runtime authority must explicitly enable only private-internal execution.')
check(runtimeAuthority?.readiness.productReady === false &&
  runtimeAuthority?.readiness.externalBetaReady === false &&
  runtimeAuthority?.readiness.productionReady === false,
'Runtime authority must keep product, external-beta, and production blocked.')

const successfulResults = new Map<string, Awaited<ReturnType<typeof runtime.execute>>[]>()
const confinementHashes = new Set<string>()
for (const toolId of TOOL_IDS) {
  const request = fixtureFor(toolId)
  const repetitions = []
  for (let repetition = 0; repetition < 2; repetition += 1) {
    const result = await runtime.execute(request)
    repetitions.push(result)
    confinementHashes.add(result.evidence.confinement.configurationHash)
    check(result.schemaVersion === 'offline-node-structured-execution-result-v1', `${toolId} result schema must be exact.`)
    check(result.evidence.toolId === toolId, `${toolId} result must bind the exact tool identity.`)
    check(result.evidence.operationId === request.operationId, `${toolId} result must bind the exact operation identity.`)
    check(result.svg.bytes.toString('utf8').startsWith('<svg'), `${toolId} must return verified in-memory SVG.`)
    check(result.verificationJson.document.toolId === toolId, `${toolId} verification JSON must bind the tool.`)
    check(result.verificationJson.document.operationId === request.operationId,
      `${toolId} verification JSON must bind the operation.`)
    check(result.evidence.semanticEvidence.unsafeMarkupRejected, `${toolId} must reject unsafe SVG markup.`)
    check(result.evidence.semanticEvidence.externalReferencesRejected, `${toolId} must reject external SVG references.`)
    check(result.evidence.confinement.networkMode === 'none', `${toolId} container must have no network.`)
    check(result.evidence.confinement.readOnlyRootFilesystem, `${toolId} root filesystem must be read-only.`)
    check(result.evidence.confinement.capDropAll, `${toolId} must drop all capabilities.`)
    check(result.evidence.confinement.noNewPrivileges, `${toolId} must set no-new-privileges.`)
    check(result.evidence.confinement.user === '10001:10001', `${toolId} must execute non-root.`)
    check(!result.evidence.confinement.callerBindsPresent, `${toolId} must have no caller binds.`)
    check(!result.evidence.confinement.callerMountsPresent, `${toolId} must have no caller mounts.`)
    check(!result.evidence.confinement.callerEnvironmentPresent, `${toolId} must have no caller environment.`)
    check(!result.evidence.confinement.callerCommandPresent, `${toolId} must have no caller command.`)
    check(result.readiness.privateInternalOnly, `${toolId} result must remain private-internal only.`)
    check(!result.readiness.productReady, `${toolId} result must not claim product readiness.`)
    check(!result.readiness.externalBetaReady, `${toolId} result must not claim external-beta readiness.`)
    check(!result.readiness.productionReady, `${toolId} result must not claim production readiness.`)
    check(!result.readiness.canonicalDispatchIntegrated, `${toolId} result must not claim canonical dispatch integration.`)
    check(result.attestation.blockers.some((blocker) => blocker.includes('known unresolved vulnerability')),
      `${toolId} attestation must disclose the Debian vulnerability blocker.`)
  }
  check(repetitions[0].evidence.requestEnvelopeSha256 === repetitions[1].evidence.requestEnvelopeSha256,
    `${toolId} normalized request identity must be deterministic.`)
  check(repetitions[0].evidence.runnerInputSha256 === repetitions[1].evidence.runnerInputSha256,
    `${toolId} validated runner input must be deterministic.`)
  check(repetitions[0].svg.sha256 === repetitions[1].svg.sha256,
    `${toolId} SVG output must be deterministic across fresh containers.`)
  check(repetitions[0].verificationJson.sha256 === repetitions[1].verificationJson.sha256,
    `${toolId} verification JSON must be deterministic across fresh containers.`)
  check(repetitions[0].evidence.runnerBundleSha256 === repetitions[1].evidence.runnerBundleSha256,
    `${toolId} bundle identity must remain immutable.`)
  successfulResults.set(toolId, repetitions)
}

const hostRejectedRequests: unknown[] = [
  { ...fixtureFor('d3'), url: 'https://caller.invalid/source' },
  { ...fixtureFor('d3'), operationId: `${fixtureFor('d3').operationId}.spoofed` },
  { ...fixtureFor('d3'), toolId: 'unknown_tool' },
  { ...fixtureFor('d3'), payload: { ...(fixtureFor('d3').payload as object), path: '/caller/path' } },
  { ...fixtureFor('satori'), payload: { ...(fixtureFor('satori').payload as object), title: '<script>bad</script>' } },
  { ...fixtureFor('satori'), payload: { ...(fixtureFor('satori').payload as object), body: 'https://caller.invalid' } },
  { ...fixtureFor('viz_js'), payload: { ...(fixtureFor('viz_js').payload as object), dot: 'digraph { a -> b }' } },
  { ...fixtureFor('vega'), payload: { ...(fixtureFor('vega').payload as object), spec: { signal: 'process.env' } } },
  { ...fixtureFor('satori'), payload: { ...(fixtureFor('satori').payload as object), body: '$(rm -rf /tmp/value)' } },
  { ...fixtureFor('satori'), payload: { ...(fixtureFor('satori').payload as object), body: 'x'.repeat(241) } },
  { ...fixtureFor('d3'), payload: { ...(fixtureFor('d3').payload as object), data: Array.from({ length: 65 }, (_, index) => ({ label: `L${index}`, value: index })) } },
]
for (const request of hostRejectedRequests) await expectHostRejected(request)

const rawAdversarialRequests: unknown[] = [
  { ...fixtureFor('d3'), operationId: `${fixtureFor('d3').operationId}.spoofed` },
  { ...fixtureFor('d3'), toolId: 'unknown_tool' },
  { ...fixtureFor('d3'), url: 'https://caller.invalid/source' },
  { ...fixtureFor('echarts'), command: 'caller-command' },
  { ...fixtureFor('vega_lite'), path: '/caller/path' },
  { ...fixtureFor('vega'), env: { CALLER_VALUE: 'forbidden' } },
  { ...fixtureFor('satori'), secret: 'caller-secret-value' },
  { ...fixtureFor('viz_js'), mount: '/caller/source-mount' },
  { ...fixtureFor('d3'), entrypoint: ['/bin/sh'] },
  { ...fixtureFor('vega'), code: 'process.exit(0)' },
  { ...fixtureFor('satori'), svg: '<svg onload="bad()"></svg>' },
  { ...fixtureFor('vega_lite'), payload: { ...(fixtureFor('vega_lite').payload as object), spec: { $schema: 'https://caller.invalid' } } },
  { ...fixtureFor('satori'), payload: { ...(fixtureFor('satori').payload as object), body: 'javascript:alert(1)' } },
]
for (const request of rawAdversarialRequests) {
  const rejection = await verifyRawContainerRejection(request)
  confinementHashes.add(rejection.configurationHash)
}

check(confinementHashes.size === 1,
  'All 25 successful and adversarial cases must use one exact inspected confinement profile.')

const persistedResult = successfulResults.get('d3')?.[0]
check(persistedResult !== undefined, 'D3 persisted attestation fixture must exist.')
const recordId = persistedResult.attestation.recordId
const relativePath = `attestations/${recordId.slice(0, 2)}/${recordId}.json`
const persistedPath = join(OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT, relativePath)
const content = await readFile(persistedPath, 'utf8')
check(!content.includes('bytesBase64'), 'Persisted attestation must not retain artifact bytes.')
for (const prohibited of [
  'Quarterly structured evidence',
  'https://caller.invalid/source',
  'caller-command',
  '/caller/path',
  'caller-secret-value',
  '/caller/source-mount',
  'process.exit(0)',
]) {
  check(!content.includes(prohibited), 'Persisted attestation must not retain structured or adversarial payload values.')
}
check(((await stat(persistedPath)).mode & 0o777) === 0o600, 'Persisted attestation must be mode 0600.')
check(((await stat(dirname(persistedPath))).mode & 0o777) === 0o700, 'Attestation directory must be mode 0700.')
check(((await stat(OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT)).mode & 0o777) === 0o700,
  'Attestation root must be mode 0700.')
check((await readPersistedOfflineNodeStructuredExecutionAttestation(recordId))?.attestationHash ===
  persistedResult.attestation.attestationHash, 'Persisted checksum attestation must verify.')

const parsedOriginal = JSON.parse(content) as {
  attestation: Record<string, unknown>
  checksumSha256: string
}
try {
  await persistRaw(relativePath, { ...parsedOriginal, checksumSha256: '0'.repeat(64) })
  await expectPersistedReadRejected(recordId, 'Outer checksum tampering must fail closed.')

  const nestedTamper = structuredClone(parsedOriginal)
  nestedTamper.attestation.completedAt = '2026-01-01T00:00:00.000Z'
  nestedTamper.checksumSha256 = sha256AuthorityValue(nestedTamper.attestation)
  await persistRaw(relativePath, nestedTamper)
  await expectPersistedReadRejected(recordId, 'Nested attestation tampering must fail closed.')
} finally {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath,
    content,
  })
  await chmod(persistedPath, 0o600)
}
check((await readPersistedOfflineNodeStructuredExecutionAttestation(recordId))?.attestationHash ===
  persistedResult.attestation.attestationHash, 'Original checksum attestation must remain readable after restore.')

process.stdout.write(`${JSON.stringify({
  smoke: 'offline-node-structured-execution',
  status: 'passed',
  tools: TOOL_IDS.length,
  successfulFreshContainers: TOOL_IDS.length * 2,
  adversarialFreshContainers: rawAdversarialRequests.length,
  totalConfinedFreshContainers: TOOL_IDS.length * 2 + rawAdversarialRequests.length,
  deterministicOperations: TOOL_IDS.length,
  hostRejectedRequests: hostRejectedRequests.length,
  imageId: runtime.image.imageId,
  dependencyLockSha256: runtime.image.dependencyLockSha256,
  privateInternalOnly: true,
  productReady: false,
  externalBetaReady: false,
  productionReady: false,
})}\n`)

function fixtureFor(toolId: typeof TOOL_IDS[number]): OfflineNodeStructuredExecutionRequest {
  const operationId = getOfflineNodeRunnerCanonicalOperation(toolId).operationId
  if (toolId === 'satori' || toolId === 'svg_js') {
    return {
      toolId,
      operationId,
      payload: {
        width: 720,
        height: 405,
        theme: 'dark',
        eyebrow: 'ReeditPro',
        title: 'Approved editing evidence',
        body: 'A structured card rendered privately from bounded server-resolved text.',
        callout: 'Private internal',
      },
    }
  }
  if (toolId === 'viz_js') {
    return {
      toolId,
      operationId,
      payload: {
        direction: 'left_to_right',
        theme: 'dark',
        title: 'Approved execution graph',
        nodes: [
          { id: 'source', label: 'Source clips' },
          { id: 'plan', label: 'Approved plan' },
          { id: 'asset', label: 'Private asset' },
        ],
        edges: [
          { from: 'source', to: 'plan', label: 'compile' },
          { from: 'plan', to: 'asset', label: 'execute' },
        ],
      },
    }
  }
  if (toolId === 'animejs') {
    return {
      toolId,
      operationId,
      payload: {
        width: 720, height: 405, fps: 30, durationFrames: 60,
        motionProfileId: 'approved_card_reveal_v1', backgroundMode: 'opaque_panel',
        title: 'Approved deterministic motion',
      },
    }
  }
  if (toolId === 'three_js') {
    return {
      toolId,
      operationId,
      payload: {
        width: 720, height: 405, fps: 30, durationFrames: 60,
        sceneProfileId: 'approved_product_cube_v1',
        cameraProfileId: 'approved_perspective_v1',
        lightingProfileId: 'approved_studio_v1',
        title: 'Approved product scene',
      },
    }
  }
  return {
    toolId,
    operationId,
    payload: {
      width: 720,
      height: 405,
      title: 'Quarterly structured evidence',
      xAxisLabel: 'Quarter',
      yAxisLabel: 'Approved value',
      theme: 'light',
      data: [
        { label: 'Q1', value: 14 },
        { label: 'Q2', value: 23 },
        { label: 'Q3', value: 31 },
      ],
    },
  }
}

async function expectHostRejected(request: unknown): Promise<void> {
  let rejected = false
  try {
    await runtime.execute(request)
  } catch {
    rejected = true
  }
  check(rejected, 'Host structured execution boundary must reject adversarial input before execution.')
}

async function verifyRawContainerRejection(request: unknown): Promise<{ configurationHash: string }> {
  const serializedRequest = JSON.stringify(request)
  check(Buffer.byteLength(serializedRequest, 'utf8') <= 132 * 1024,
    'Adversarial smoke request must remain inside the container protocol ceiling.')
  const container = await runOfflineNodeStructuredContainer({
    image: runtime.image,
    serializedRequest,
  })
  check(container.exitCode === 2 && !container.oomKilled, 'Adversarial protocol request must fail closed.')
  check(container.stdout.length === 0, 'Rejected protocol request must not return stdout or artifact bytes.')
  const wire = JSON.parse(container.stderr) as {
    schemaVersion?: unknown
    ok?: unknown
    error?: { code?: unknown; message?: unknown }
    readiness?: {
      privateInternalOnly?: unknown
      productReady?: unknown
      externalBetaReady?: unknown
      productionReady?: unknown
    }
  }
  check(wire.schemaVersion === OFFLINE_NODE_STRUCTURED_CONTAINER_PROTOCOL && wire.ok === false,
    'Rejected protocol envelope must use the exact container schema.')
  check(['INVALID_INPUT', 'INPUT_TOO_LARGE', 'UNSAFE_CONTENT'].includes(String(wire.error?.code)),
    'Rejected protocol envelope must return a bounded validation code.')
  check(wire.error?.message === 'Private structured runner request rejected.',
    'Rejected protocol envelope must not disclose payload details.')
  check(wire.readiness?.privateInternalOnly === true, 'Rejected protocol evidence must remain private-internal only.')
  check(wire.readiness.productReady === false && wire.readiness.externalBetaReady === false &&
    wire.readiness.productionReady === false, 'Rejected protocol evidence must keep all promotion states false.')
  return { configurationHash: container.confinement.configurationHash }
}

async function persistRaw(relativePath: string, value: unknown): Promise<void> {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_STRUCTURED_EXECUTION_STORAGE_ROOT,
    relativePath,
    content: `${stableAuthorityStringify(value)}\n`,
  })
}

async function expectPersistedReadRejected(recordId: string, message: string): Promise<void> {
  let rejected = false
  try {
    await readPersistedOfflineNodeStructuredExecutionAttestation(recordId)
  } catch {
    rejected = true
  }
  check(rejected, message)
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
