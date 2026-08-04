import { chmod, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { writePrivateTextFileAtomicWithinRoot } from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  activateOfflineNodeRunners,
  OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
  OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
  readPersistedOfflineNodeRunnerActivationAttestation,
} from '../tool-execution/node-runner-activation/offline-node-runner-activation-service'
import { OFFLINE_NODE_RUNNER_ACTIVATION_VERSION } from '../tool-execution/node-runner-activation/offline-node-runner-activation-types'

const TOOL_IDS = ['d3', 'echarts', 'vega_lite', 'vega', 'satori', 'viz_js'] as const
const persistedPath = join(
  OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
  OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
)

let callerInputRejected = false
try {
  await (activateOfflineNodeRunners as unknown as (callerInput: unknown) => Promise<unknown>)({
    path: '/caller/path',
  })
} catch {
  callerInputRejected = true
}
check(callerInputRejected, 'Host activation service must reject every caller-supplied input before building or running.')

const attestation = await activateOfflineNodeRunners()

check(attestation.schemaVersion === OFFLINE_NODE_RUNNER_ACTIVATION_VERSION, 'Activation schema version must be exact.')
check(attestation.summary.canonicalToolCount === 6, 'All six offline Node tools must be represented.')
check(attestation.summary.successfulContainerRunCount === 12, 'Each offline Node tool must run in two fresh containers.')
check(attestation.summary.deterministicOperationCount === 6, 'All six operations must have determinism evidence.')
check(attestation.summary.adversarialCaseCount === 13, 'All fixed adversarial cases must be executed.')
check(attestation.summary.confinedContainerCount === 25, 'Every positive and adversarial run must use a fresh confined container.')
check(attestation.summary.actualLibraryExecutionObserved, 'Actual package execution must be observed.')
check(attestation.summary.allArtifactsPrivate, 'Every runner artifact must remain private.')
check(attestation.summary.allOutputsSemanticallyVerified, 'Every successful SVG/JSON result must be semantically verified.')
check(attestation.summary.allOperationsDeterministicAcrossTwoRuns, 'Every operation must be deterministic across two containers.')
check(attestation.summary.allAdversarialInputsRejected, 'Every adversarial request must fail closed.')
check(attestation.readiness.privateInternalActivationEvidenceOnly, 'Attestation must remain private-internal evidence only.')
check(!attestation.readiness.productReady, 'Activation must not claim product readiness.')
check(!attestation.readiness.externalBetaReady, 'Activation must not claim external-beta readiness.')
check(!attestation.readiness.productionReady, 'Activation must not claim production readiness.')
check(!attestation.readiness.dispatchAuthorityChanged, 'Activation must not modify dispatch authority.')
check(attestation.blockers.length >= 5, 'Truthful remaining blockers must be recorded.')

check(attestation.build.baseImageDigest ===
  'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5',
'The exact pinned Node base digest must be attested.')
check(attestation.build.imageUser === '10001:10001', 'The image must default to the fixed non-root identity.')
check(attestation.build.imageLabels['com.reeditpro.runner.product-ready'] === 'false', 'Image label must block product readiness.')
check(attestation.build.imageLabels['com.reeditpro.runner.external-beta-ready'] === 'false', 'Image label must block external beta.')
check(attestation.build.imageLabels['com.reeditpro.runner.production-ready'] === 'false', 'Image label must block production.')
check(attestation.build.imageLabels['com.reeditpro.runner.lock.sha256'] ===
  attestation.build.dependencyLockSha256, 'Image lock label must bind the exact dedicated lockfile.')
check(attestation.build.rootFilesystemLayerDigests.length >= 2, 'Image root filesystem layers must be attested.')
check(attestation.build.imageEnvironmentNames.join(',') === 'NODE_ENV,NODE_VERSION,PATH,YARN_VERSION',
  'Only expected non-secret image environment names may be attested.')
check(attestation.runnerBundle.byteLength > 16_000, 'The bundled runner must have a nontrivial byte identity.')
check(/^[a-f0-9]{64}$/.test(attestation.runnerBundle.sha256), 'Runner bundle SHA-256 must be valid.')

check(attestation.packages.length === TOOL_IDS.length, 'Each tool must expose one exact package identity.')
check(new Set(attestation.packages.map((entry) => entry.packageJsonSha256)).size === TOOL_IDS.length,
  'Each package.json identity must be independently recorded.')
for (const packageEvidence of attestation.packages) {
  check(/^[a-f0-9]{64}$/.test(packageEvidence.packageJsonSha256), `${packageEvidence.packageName} package identity must be a SHA-256.`)
  check(packageEvidence.invokedEntrypoints.length >= 1, `${packageEvidence.packageName} must record an invoked entrypoint.`)
}

for (const toolId of TOOL_IDS) {
  const successful = attestation.successfulOperations.filter((entry) => entry.toolId === toolId)
  check(successful.length === 2, `${toolId} must have exactly two successful container runs.`)
  check(successful[0].repetition === 1 && successful[1].repetition === 2, `${toolId} repetition identities must be ordered.`)
  check(successful.every((entry) => entry.containerExitCode === 0 && !entry.oomKilled), `${toolId} must exit cleanly without OOM.`)
  check(successful.every((entry) => entry.semanticEvidence.svgRootCount === 1), `${toolId} must produce one SVG root.`)
  check(successful.every((entry) => entry.semanticEvidence.unsafeMarkupRejected), `${toolId} unsafe markup must be rejected.`)
  check(successful.every((entry) => entry.semanticEvidence.externalReferencesRejected), `${toolId} external references must be rejected.`)
  check(successful.every((entry) => entry.processResourceUsage.wallTimeMicroseconds > 0), `${toolId} process usage must be measured.`)
  check(successful.every((entry) => entry.processResourceUsage.maxRssKilobytes > 0), `${toolId} RSS usage must be measured.`)
  check(successful.every((entry) => entry.confinement.networkMode === 'none'), `${toolId} must have no network namespace.`)
  check(successful.every((entry) => entry.confinement.readOnlyRootFilesystem), `${toolId} root filesystem must be read-only.`)
  check(successful.every((entry) => entry.confinement.capDropAll), `${toolId} must drop every capability.`)
  check(successful.every((entry) => entry.confinement.noNewPrivileges), `${toolId} must set no-new-privileges.`)
  check(successful.every((entry) => entry.confinement.memoryLimitBytes === 805_306_368 &&
    entry.confinement.memoryAndSwapLimitBytes === 805_306_368), `${toolId} memory and swap must share the fixed 768 MiB ceiling.`)
  check(successful.every((entry) => entry.confinement.user === '10001:10001'), `${toolId} must run non-root.`)
  check(successful.every((entry) => !entry.confinement.callerBindsPresent), `${toolId} must reject caller binds.`)
  check(successful.every((entry) => !entry.confinement.callerMountsPresent), `${toolId} must reject caller mounts.`)
  check(successful.every((entry) => !entry.confinement.callerCommandPresent), `${toolId} must reject caller commands.`)
  check(successful.every((entry) => !entry.confinement.callerEnvironmentPresent), `${toolId} must reject caller environment.`)
  const deterministic = attestation.deterministicOperations.find((entry) => entry.toolId === toolId)
  check(Boolean(deterministic?.identical), `${toolId} deterministic comparison must pass.`)
  check(deterministic?.svgSha256 === successful[0].svgSha256, `${toolId} deterministic SVG identity must bind the run.`)
  check(deterministic?.verificationJsonSha256 === successful[0].verificationJsonSha256,
    `${toolId} deterministic verification identity must bind the run.`)
  const adversarial = attestation.adversarialCases.filter((entry) => entry.toolId === toolId)
  check(adversarial.length === 2, `${toolId} must run spoofed-operation and extra-field rejection cases.`)
  check(adversarial.every((entry) => entry.rejected && entry.errorCode === 'INVALID_INPUT'),
    `${toolId} adversarial cases must fail as INVALID_INPUT.`)
}
check(attestation.adversarialCases.some((entry) => entry.toolId === 'unknown_tool' && entry.rejected),
  'Unknown canonical tool identity must fail closed.')

const confinementHashes = new Set([
  ...attestation.successfulOperations.map((entry) => entry.confinement.configurationHash),
  ...attestation.adversarialCases.map((entry) => entry.confinementConfigurationHash),
])
check(confinementHashes.size === 1, 'All 25 containers must use the identical inspected confinement profile.')

const persistedStat = await stat(persistedPath)
const persistedDirectoryStat = await stat(dirname(persistedPath))
const persistedRootStat = await stat(OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT)
check((persistedStat.mode & 0o777) === 0o600, 'Persisted attestation must be mode 0600.')
check((persistedDirectoryStat.mode & 0o777) === 0o700, 'Attestation directory must be mode 0700.')
check((persistedRootStat.mode & 0o777) === 0o700, 'Attestation root must be mode 0700.')
const originalContent = await readFile(persistedPath, 'utf8')
check(!originalContent.includes('bytesBase64'), 'Persisted evidence must not include artifact payload bytes.')
for (const prohibitedValue of [
  'https://caller.invalid/source',
  'caller-command',
  '/caller/path',
  'CALLER_VALUE',
  'caller-secret-value',
  '/caller/source-mount',
]) {
  check(!originalContent.includes(prohibitedValue), 'Persisted evidence must not retain adversarial caller values.')
}
const persisted = await readPersistedOfflineNodeRunnerActivationAttestation()
check(persisted?.attestationHash === attestation.attestationHash, 'Persisted attestation must verify and bind the returned evidence.')

const parsedOriginal = JSON.parse(originalContent) as Record<string, unknown>
try {
  await persistRaw({ ...parsedOriginal, checksumSha256: '0'.repeat(64) })
  await expectReadRejected('Outer attestation checksum tampering must be rejected.')

  const nestedTamper = structuredClone(parsedOriginal) as {
    attestation: Record<string, unknown>
    checksumSha256: string
  }
  nestedTamper.attestation.completedAt = '2026-01-01T00:00:00.000Z'
  nestedTamper.checksumSha256 = sha256AuthorityValue(nestedTamper.attestation)
  await persistRaw(nestedTamper)
  await expectReadRejected('Nested attestation hash tampering must be rejected even with a valid outer checksum.')
} finally {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
    content: originalContent,
  })
  await chmod(persistedPath, 0o600)
}
check((await readPersistedOfflineNodeRunnerActivationAttestation())?.attestationHash === attestation.attestationHash,
  'Original attestation must remain readable after tamper tests restore it.')

process.stdout.write(`${JSON.stringify({
  smoke: 'offline-node-runner-container-activation',
  status: 'passed',
  attestationHash: attestation.attestationHash,
  imageManifestSha256: attestation.build.imageManifestSha256,
  runnerBundleSha256: attestation.runnerBundle.sha256,
  tools: TOOL_IDS.length,
  successfulRuns: attestation.successfulOperations.length,
  adversarialCases: attestation.adversarialCases.length,
  confinedContainers: attestation.summary.confinedContainerCount,
  readiness: attestation.readiness,
})}\n`)

async function persistRaw(value: unknown): Promise<void> {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
    content: `${stableAuthorityStringify(value)}\n`,
  })
}

async function expectReadRejected(message: string): Promise<void> {
  let rejected = false
  try {
    await readPersistedOfflineNodeRunnerActivationAttestation()
  } catch {
    rejected = true
  }
  check(rejected, message)
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
