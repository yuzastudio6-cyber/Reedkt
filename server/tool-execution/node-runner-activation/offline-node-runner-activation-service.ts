import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  open,
  readdir,
  rm,
} from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import { getOfflineNodeRunnerCanonicalOperation } from '../node-runners/offline-node-runner-canonical-operations'
import type { OfflineNodeRunnerSvgSemanticEvidence } from '../node-runners'
import {
  OFFLINE_NODE_RUNNER_ACTIVATION_RECORD_VERSION,
  OFFLINE_NODE_RUNNER_ACTIVATION_VERSION,
  type ActivatedOfflineNodeToolId,
  type OfflineNodeRunnerActivationAttestation,
  type OfflineNodeRunnerAdversarialEvidence,
  type OfflineNodeRunnerConfinementEvidence,
  type OfflineNodeRunnerDeterminismEvidence,
  type OfflineNodeRunnerPackageEvidence,
  type OfflineNodeRunnerResourceUsageEvidence,
  type OfflineNodeRunnerSuccessfulOperationEvidence,
  type PersistedOfflineNodeRunnerActivationAttestation,
} from './offline-node-runner-activation-types'

export const OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT =
  '/tmp/reeditpro-offline-node-runner-activation' as const
export const OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH =
  'attestations/offline-node-runner-activation-v1.json' as const

const IMAGE_TAG = 'reeditpro-offline-node-runners:local-activation-v1' as const
const BASE_IMAGE_DIGEST =
  'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5' as const
const PINNED_BASE_IMAGE = `node:24-bookworm-slim@${BASE_IMAGE_DIGEST}` as const
const BUILD_CONTEXT_PATH = '/tmp/reeditpro-offline-node-runner-build-context-v1'
const MAXIMUM_COMMAND_OUTPUT_BYTES = 32 * 1024 * 1024
const BUILD_TIMEOUT_MS = 15 * 60 * 1_000
const RUN_TIMEOUT_MS = 30_000
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const CONTAINER_ENTRYPOINT = [
  'node',
  '--no-warnings',
  '/app/offline-node-runner-cli.mjs',
] as const
const TOOL_IDS = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'viz_js',
] as const satisfies readonly ActivatedOfflineNodeToolId[]

const EXPECTED_PACKAGES: Readonly<Record<ActivatedOfflineNodeToolId, {
  packageName: string
  version: string
}>> = Object.freeze({
  d3: { packageName: 'd3', version: '7.9.0' },
  echarts: { packageName: 'echarts', version: '6.1.0' },
  vega_lite: { packageName: 'vega-lite', version: '6.4.3' },
  vega: { packageName: 'vega', version: '6.2.0' },
  satori: { packageName: 'satori', version: '0.26.0' },
  viz_js: { packageName: '@viz-js/viz', version: '3.28.0' },
})

const EXTRA_FIELD_CASES: Readonly<Record<ActivatedOfflineNodeToolId, Record<string, unknown>>> =
  Object.freeze({
    d3: { url: 'https://caller.invalid/source' },
    echarts: { command: 'caller-command' },
    vega_lite: { path: '/caller/path' },
    vega: { env: { CALLER_VALUE: 'forbidden' } },
    satori: { secret: 'caller-secret-value' },
    viz_js: { mount: '/caller/source-mount' },
  })

interface HostCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

interface DockerImageInspect {
  Id?: unknown
  RepoDigests?: unknown
  Architecture?: unknown
  Os?: unknown
  Config?: unknown
  RootFS?: unknown
  Descriptor?: unknown
}

interface DockerContainerInspect {
  Image?: unknown
  State?: unknown
  HostConfig?: unknown
  Mounts?: unknown
  Config?: unknown
}

interface ConfinedContainerResult {
  stdout: string
  stderr: string
  exitCode: number
  oomKilled: boolean
  confinement: OfflineNodeRunnerConfinementEvidence
}

interface VerifiedRunnerOutput {
  evidence: OfflineNodeRunnerSuccessfulOperationEvidence
  svg: string
}

export async function activateOfflineNodeRunners(): Promise<OfflineNodeRunnerActivationAttestation> {
  if (arguments.length !== 0) {
    throw activationFailure('Offline Node runner activation does not accept caller input.')
  }
  const startedAt = new Date().toISOString()
  const repositoryRoot = repositoryRootPath()
  const dockerfilePath = join(repositoryRoot, 'docker/prod/offline-node-runner/Dockerfile')
  const lockfilePath = join(repositoryRoot, 'docker/prod/offline-node-runner/package-lock.json')
  const entrypointSourcePath = join(
    repositoryRoot,
    'server/tool-execution/node-runner-activation/offline-node-runner-container-cli.ts',
  )
  const dependencyLockSha256 = await sha256File(lockfilePath)
  const dockerfileSha256 = await sha256File(dockerfilePath)
  const containerEntrypointSourceSha256 = await sha256File(entrypointSourcePath)
  await assertPinnedDockerfile(dockerfilePath)

  await prepareBuildContext(repositoryRoot)
  try {
    const dockerServer = await readDockerServerIdentity()
    await buildRunnerImage(dependencyLockSha256)
    const image = await inspectAndValidateImage(dependencyLockSha256)

    const successfulOperations: OfflineNodeRunnerSuccessfulOperationEvidence[] = []
    const deterministicOperations: OfflineNodeRunnerDeterminismEvidence[] = []
    const packageByTool = new Map<ActivatedOfflineNodeToolId, OfflineNodeRunnerPackageEvidence>()
    let canonicalBundle: { sha256: string; byteLength: number } | undefined

    for (const toolId of TOOL_IDS) {
      const canonicalOperation = getOfflineNodeRunnerCanonicalOperation(toolId)
      const repetitions: VerifiedRunnerOutput[] = []
      for (const repetition of [1, 2] as const) {
        const container = await runConfinedContainer({
          toolId,
          operationId: canonicalOperation.operationId,
        }, image.imageId)
        if (container.exitCode !== 0 || container.oomKilled || container.stderr.trim()) {
          throw activationFailure('A canonical offline Node runner container did not exit cleanly.')
        }
        const verified = verifySuccessfulOutput({
          toolId,
          operationId: canonicalOperation.operationId,
          repetition,
          container,
        })
        repetitions.push(verified)
        successfulOperations.push(verified.evidence)
        const previousPackage = packageByTool.get(toolId)
        if (previousPackage && stableAuthorityStringify(previousPackage) !==
            stableAuthorityStringify(verified.evidence.packageIdentity)) {
          throw activationFailure(`${toolId} package identity changed between deterministic runs.`)
        }
        packageByTool.set(toolId, verified.evidence.packageIdentity)
        const observedBundle = {
          sha256: verified.evidence.bundleSha256,
          byteLength: verified.evidence.bundleByteLength,
        }
        if (canonicalBundle && stableAuthorityStringify(canonicalBundle) !==
            stableAuthorityStringify(observedBundle)) {
          throw activationFailure('The container runner bundle identity changed across operations.')
        }
        canonicalBundle = observedBundle
      }
      deterministicOperations.push(verifyDeterminism(toolId, canonicalOperation.operationId, repetitions))
    }

    if (!canonicalBundle || packageByTool.size !== TOOL_IDS.length) {
      throw activationFailure('Runner bundle or package evidence is incomplete.')
    }

    const adversarialCases = await runAdversarialCases(image.imageId)
    const packages = TOOL_IDS.map((toolId) => packageByTool.get(toolId))
    if (packages.some((value) => value === undefined)) {
      throw activationFailure('One or more package identities were not recorded.')
    }

    const attestationWithoutHash = {
      schemaVersion: OFFLINE_NODE_RUNNER_ACTIVATION_VERSION,
      source: 'private_local_docker_offline_node_runner_activation' as const,
      startedAt,
      completedAt: new Date().toISOString(),
      build: {
        imageTag: IMAGE_TAG,
        pinnedBaseImage: PINNED_BASE_IMAGE,
        baseImageDigest: BASE_IMAGE_DIGEST,
        dependencyLockSha256,
        dockerfileSha256,
        containerEntrypointSourceSha256,
        dockerServerVersion: dockerServer.version,
        dockerServerArchitecture: dockerServer.architecture,
        ...image,
      },
      runnerBundle: canonicalBundle,
      packages: packages as OfflineNodeRunnerPackageEvidence[],
      successfulOperations,
      deterministicOperations,
      adversarialCases,
      summary: {
        canonicalToolCount: 6 as const,
        successfulContainerRunCount: 12 as const,
        deterministicOperationCount: 6 as const,
        adversarialCaseCount: 13 as const,
        confinedContainerCount: 25 as const,
        actualLibraryExecutionObserved: true as const,
        allArtifactsPrivate: true as const,
        allOutputsSemanticallyVerified: true as const,
        allOperationsDeterministicAcrossTwoRuns: true as const,
        allAdversarialInputsRejected: true as const,
      },
      readiness: {
        privateInternalActivationEvidenceOnly: true as const,
        productReady: false as const,
        externalBetaReady: false as const,
        productionReady: false as const,
        dispatchAuthorityChanged: false as const,
      },
      blockers: [
        'Evidence is from one private local Docker engine and is not deployed-runtime, multi-architecture, or worker-fleet evidence.',
        'Canonical private dispatch intentionally does not consume this attestation; no dispatch-to-runner execution path is activated.',
        'No approved-snapshot, credit reservation, worker lease, private artifact store, render, export, or delivery integration is activated.',
        'Only six fixed offline Node operations have real container execution evidence; the remaining canonical tool operations still require their own runners and evidence.',
        'The pinned Debian runtime retains essential perl-base; its current unfixed critical/high vulnerability findings require a base-image remediation decision and a fresh promotion scan.',
        'External beta and production remain blocked pending deployment security, supply-chain, observability, recovery, and end-to-end acceptance evidence.',
      ],
    }
    const attestation: OfflineNodeRunnerActivationAttestation = {
      ...attestationWithoutHash,
      attestationHash: sha256AuthorityValue(attestationWithoutHash),
    }
    await persistAttestation(attestation)
    return attestation
  } finally {
    await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function readPersistedOfflineNodeRunnerActivationAttestation():
Promise<OfflineNodeRunnerActivationAttestation | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
  })
  if (!content) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw activationFailure('Persisted offline Node runner attestation is not valid JSON.')
  }
  const record = asRecord(parsed, 'Persisted offline Node runner attestation')
  assertExactKeys(record, ['attestation', 'checksumSha256', 'recordVersion', 'source'])
  if (
    record.recordVersion !== OFFLINE_NODE_RUNNER_ACTIVATION_RECORD_VERSION ||
    record.source !== 'private_local_checksum_protected_offline_node_runner_activation' ||
    typeof record.checksumSha256 !== 'string'
  ) {
    throw activationFailure('Persisted offline Node runner attestation has an unsupported record shape.')
  }
  const attestationRecord = asRecord(record.attestation, 'Offline Node runner attestation payload')
  if (record.checksumSha256 !== sha256AuthorityValue(attestationRecord)) {
    throw activationFailure('Persisted offline Node runner attestation checksum is invalid.')
  }
  const attestationHash = attestationRecord.attestationHash
  if (typeof attestationHash !== 'string' || !SHA256_PATTERN.test(attestationHash)) {
    throw activationFailure('Persisted offline Node runner attestation hash is missing or invalid.')
  }
  const withoutHash = Object.fromEntries(
    Object.entries(attestationRecord).filter(([key]) => key !== 'attestationHash'),
  )
  if (attestationHash !== sha256AuthorityValue(withoutHash)) {
    throw activationFailure('Persisted offline Node runner attestation content hash is invalid.')
  }
  assertPersistedAttestationCore(attestationRecord)
  return attestationRecord as unknown as OfflineNodeRunnerActivationAttestation
}

async function persistAttestation(attestation: OfflineNodeRunnerActivationAttestation): Promise<void> {
  const persisted: PersistedOfflineNodeRunnerActivationAttestation = {
    recordVersion: OFFLINE_NODE_RUNNER_ACTIVATION_RECORD_VERSION,
    source: 'private_local_checksum_protected_offline_node_runner_activation',
    attestation,
    checksumSha256: sha256AuthorityValue(attestation),
  }
  const content = `${stableAuthorityStringify(persisted)}\n`
  if (Buffer.byteLength(content, 'utf8') > 2 * 1024 * 1024) {
    throw activationFailure('Offline Node runner attestation exceeded its private local byte ceiling.')
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: OFFLINE_NODE_RUNNER_ACTIVATION_STORAGE_ROOT,
    relativePath: OFFLINE_NODE_RUNNER_ACTIVATION_RELATIVE_PATH,
    content,
  })
}

async function prepareBuildContext(repositoryRoot: string): Promise<void> {
  await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true })
  await mkdir(BUILD_CONTEXT_PATH, { recursive: true, mode: 0o700 })
  const relativeSources = [
    'docker/prod/offline-node-runner',
    'server/tool-execution',
    'server/tool-registry',
    'src/backend/contracts',
  ] as const
  for (const relativeSource of relativeSources) {
    await copyCleanTree(
      resolveWithinRepository(repositoryRoot, relativeSource),
      join(BUILD_CONTEXT_PATH, relativeSource),
    )
  }
}

async function copyCleanTree(sourcePath: string, targetPath: string): Promise<void> {
  const sourceStat = await lstat(sourcePath)
  if (sourceStat.isSymbolicLink()) {
    throw activationFailure('Runner image build inputs must not contain symbolic links.')
  }
  if (sourceStat.isDirectory()) {
    await mkdir(targetPath, { recursive: true, mode: 0o700 })
    const entries = await readdir(sourcePath, { withFileTypes: true })
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name.startsWith('._') || entry.name === '.DS_Store') continue
      if (!entry.isDirectory() && !entry.isFile()) {
        throw activationFailure('Runner image build inputs contain an unsupported filesystem object.')
      }
      await copyCleanTree(join(sourcePath, entry.name), join(targetPath, entry.name))
    }
    return
  }
  if (!sourceStat.isFile()) throw activationFailure('Runner image build input is not a regular file.')
  await mkdir(dirname(targetPath), { recursive: true, mode: 0o700 })
  await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL)
}

async function buildRunnerImage(lockSha256: string): Promise<void> {
  const result = await runHostCommand([
    'build',
    '--pull',
    '--provenance=false',
    '--build-arg',
    `RUNNER_LOCK_SHA256=${lockSha256}`,
    '--file',
    'docker/prod/offline-node-runner/Dockerfile',
    '--tag',
    IMAGE_TAG,
    '.',
  ], {
    cwd: BUILD_CONTEXT_PATH,
    timeoutMs: BUILD_TIMEOUT_MS,
    maximumOutputBytes: MAXIMUM_COMMAND_OUTPUT_BYTES,
  })
  if (result.exitCode !== 0) {
    throw activationFailure('Digest-pinned offline Node runner image build failed.')
  }
}

async function readDockerServerIdentity(): Promise<{ version: string; architecture: string }> {
  const result = await runHostCommand(['version', '--format', '{{json .Server}}'], {
    timeoutMs: RUN_TIMEOUT_MS,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw activationFailure('Docker server identity could not be read.')
  }
  const record = asRecord(parseJson(result.stdout, 'Docker server identity'), 'Docker server identity')
  if (typeof record.Version !== 'string' || typeof record.Arch !== 'string') {
    throw activationFailure('Docker server identity is incomplete.')
  }
  return { version: record.Version, architecture: record.Arch }
}

async function inspectAndValidateImage(lockSha256: string): Promise<
OfflineNodeRunnerActivationAttestation['build'] extends infer Build
  ? Omit<Extract<Build, object>,
  | 'imageTag'
  | 'pinnedBaseImage'
  | 'baseImageDigest'
  | 'dependencyLockSha256'
  | 'dockerfileSha256'
  | 'containerEntrypointSourceSha256'
  | 'dockerServerVersion'
  | 'dockerServerArchitecture'>
  : never> {
  const result = await runHostCommand(['image', 'inspect', IMAGE_TAG], { timeoutMs: RUN_TIMEOUT_MS })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw activationFailure('Built offline Node runner image could not be inspected.')
  }
  const inspect = parseSingleInspect<DockerImageInspect>(result.stdout, 'Docker image inspect')
  const config = asRecord(inspect.Config, 'Docker image config')
  const labels = stringRecord(config.Labels, 'Docker image labels')
  const env = stringArray(config.Env, 'Docker image environment')
  const envNames = environmentNames(env)
  const entrypoint = stringArray(config.Entrypoint, 'Docker image entrypoint')
  const rootFs = asRecord(inspect.RootFS, 'Docker image root filesystem')
  const layerDigests = stringArray(rootFs.Layers, 'Docker image root filesystem layers')
  const descriptor = asRecord(inspect.Descriptor, 'Docker image descriptor')
  const descriptorAnnotations = stringRecord(descriptor.annotations, 'Docker image descriptor annotations')
  if (
    inspect.Os !== 'linux' ||
    typeof inspect.Architecture !== 'string' ||
    typeof inspect.Id !== 'string' ||
    !SHA256_PATTERN.test(stripShaPrefix(inspect.Id)) ||
    typeof descriptor.digest !== 'string' ||
    !SHA256_PATTERN.test(stripShaPrefix(descriptor.digest)) ||
    typeof descriptorAnnotations['config.digest'] !== 'string' ||
    !SHA256_PATTERN.test(stripShaPrefix(descriptorAnnotations['config.digest'])) ||
    config.User !== '10001:10001' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(CONTAINER_ENTRYPOINT) ||
    config.WorkingDir !== '/app' ||
    labels['org.opencontainers.image.base.digest'] !== BASE_IMAGE_DIGEST ||
    labels['com.reeditpro.runner.lock.sha256'] !== lockSha256 ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-node-runner-container-v1' ||
    labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    labels['com.reeditpro.runner.external-beta-ready'] !== 'false' ||
    labels['com.reeditpro.runner.production-ready'] !== 'false' ||
    layerDigests.length < 2 ||
    layerDigests.some((digest) => !SHA256_PATTERN.test(stripShaPrefix(digest))) ||
    secretLikeEnvironmentNames(envNames).length > 0
  ) {
    throw activationFailure('Built offline Node runner image identity or readiness labels are invalid.')
  }
  const imageIdentity = {
    imageId: inspect.Id,
    imageManifestSha256: descriptor.digest,
    imageConfigSha256: descriptorAnnotations['config.digest'],
    rootFilesystemLayerDigests: layerDigests,
    imageLabels: labels,
    imageUser: '10001:10001' as const,
    imageEntrypoint: CONTAINER_ENTRYPOINT,
    imageEnvironmentNames: envNames,
    architecture: inspect.Architecture,
    os: inspect.Os,
  }
  return {
    imageId: inspect.Id,
    imageManifestSha256: descriptor.digest,
    imageConfigSha256: descriptorAnnotations['config.digest'],
    imageIdentityHash: sha256AuthorityValue(imageIdentity),
    rootFilesystemLayerDigests: layerDigests,
    imageLabels: labels,
    imageUser: '10001:10001',
    imageEntrypoint: CONTAINER_ENTRYPOINT,
    imageEnvironmentNames: envNames,
  }
}

async function runConfinedContainer(
  request: Readonly<Record<string, unknown>>,
  expectedImageId: string,
): Promise<ConfinedContainerResult> {
  const createResult = await runHostCommand([
    'create',
    '--interactive',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '--pids-limit',
    '64',
    '--memory',
    '768m',
    '--memory-swap',
    '768m',
    '--cpus',
    '1',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=67108864',
    '--user',
    '10001:10001',
    IMAGE_TAG,
  ], { timeoutMs: RUN_TIMEOUT_MS })
  if (createResult.exitCode !== 0 || createResult.stderr.trim()) {
    throw activationFailure('Confined offline Node runner container could not be created.')
  }
  const containerId = createResult.stdout.trim()
  if (!/^[a-f0-9]{64}$/.test(containerId)) {
    throw activationFailure('Docker returned an invalid container identity.')
  }
  try {
    const before = await inspectContainer(containerId)
    const confinement = validateConfinement(before, expectedImageId)
    const startResult = await runHostCommand(['start', '--attach', '--interactive', containerId], {
      input: `${JSON.stringify(request)}\n`,
      timeoutMs: RUN_TIMEOUT_MS,
      maximumOutputBytes: 5 * 1024 * 1024,
    })
    const after = await inspectContainer(containerId)
    const state = asRecord(after.State, 'Completed Docker container state')
    if (
      typeof state.ExitCode !== 'number' ||
      state.ExitCode !== startResult.exitCode ||
      typeof state.OOMKilled !== 'boolean' ||
      state.Status !== 'exited' ||
      state.Running !== false
    ) {
      throw activationFailure('Offline Node runner container exit state is inconsistent.')
    }
    return {
      stdout: startResult.stdout,
      stderr: startResult.stderr,
      exitCode: startResult.exitCode,
      oomKilled: state.OOMKilled,
      confinement,
    }
  } finally {
    await runHostCommand(['rm', '--force', containerId], {
      timeoutMs: RUN_TIMEOUT_MS,
      maximumOutputBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

async function inspectContainer(containerId: string): Promise<DockerContainerInspect> {
  const result = await runHostCommand(['inspect', containerId], { timeoutMs: RUN_TIMEOUT_MS })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw activationFailure('Confined offline Node runner container could not be inspected.')
  }
  return parseSingleInspect<DockerContainerInspect>(result.stdout, 'Docker container inspect')
}

function validateConfinement(
  inspect: DockerContainerInspect,
  expectedImageId: string,
): OfflineNodeRunnerConfinementEvidence {
  const host = asRecord(inspect.HostConfig, 'Docker container host configuration')
  const config = asRecord(inspect.Config, 'Docker container configuration')
  const capDrop = stringArray(host.CapDrop, 'Docker container dropped capabilities')
  const securityOptions = stringArray(host.SecurityOpt, 'Docker container security options')
  const tmpfs = stringRecord(host.Tmpfs, 'Docker container tmpfs')
  const mounts = arrayValue(inspect.Mounts, 'Docker container mounts')
  const binds = host.Binds === null || host.Binds === undefined
    ? []
    : arrayValue(host.Binds, 'Docker container binds')
  const entrypoint = stringArray(config.Entrypoint, 'Docker container entrypoint')
  const containerEnvironment = stringArray(config.Env, 'Docker container environment')
  const imageEnvironmentNames = environmentNames(containerEnvironment)
  const tmpfsTokens = new Set(String(tmpfs['/tmp'] ?? '').split(','))
  const secretLikeNames = secretLikeEnvironmentNames(imageEnvironmentNames)
  const configurationProjection = {
    image: inspect.Image,
    networkMode: host.NetworkMode,
    readOnlyRootFilesystem: host.ReadonlyRootfs,
    capDrop,
    securityOptions,
    privileged: host.Privileged,
    pidsLimit: host.PidsLimit,
    memory: host.Memory,
    memoryAndSwap: host.MemorySwap,
    nanoCpus: host.NanoCpus,
    tmpfs,
    user: config.User,
    entrypoint,
    command: config.Cmd,
    binds,
    mounts,
    environmentNames: imageEnvironmentNames,
  }
  if (
    inspect.Image !== expectedImageId ||
    host.NetworkMode !== 'none' ||
    host.ReadonlyRootfs !== true ||
    capDrop.length !== 1 || capDrop[0] !== 'ALL' ||
    !securityOptions.includes('no-new-privileges:true') ||
    host.Privileged !== false ||
    host.PidsLimit !== 64 ||
    host.Memory !== 805_306_368 ||
    host.MemorySwap !== 805_306_368 ||
    host.NanoCpus !== 1_000_000_000 ||
    host.AutoRemove !== false ||
    config.User !== '10001:10001' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(CONTAINER_ENTRYPOINT) ||
    config.Cmd !== null ||
    binds.length !== 0 ||
    mounts.length !== 0 ||
    Object.keys(tmpfs).length !== 1 ||
    !tmpfsTokens.has('rw') ||
    !tmpfsTokens.has('noexec') ||
    !tmpfsTokens.has('nosuid') ||
    !tmpfsTokens.has('nodev') ||
    !tmpfsTokens.has('size=67108864') ||
    secretLikeNames.length !== 0
  ) {
    throw activationFailure('Offline Node runner confinement does not match the fixed security profile.')
  }
  return {
    configurationHash: sha256AuthorityValue(configurationProjection),
    networkMode: 'none',
    readOnlyRootFilesystem: true,
    capDropAll: true,
    noNewPrivileges: true,
    privileged: false,
    pidsLimit: 64,
    memoryLimitBytes: 805_306_368,
    memoryAndSwapLimitBytes: 805_306_368,
    nanoCpus: 1_000_000_000,
    tmpfsPath: '/tmp',
    tmpfsSizeBytes: 67_108_864,
    tmpfsNoExec: true,
    tmpfsNoSuid: true,
    tmpfsNoDevice: true,
    user: '10001:10001',
    entrypoint: CONTAINER_ENTRYPOINT,
    callerCommandPresent: false,
    callerBindsPresent: false,
    callerMountsPresent: false,
    callerEnvironmentPresent: false,
    secretLikeImageEnvironmentNames: [],
  }
}

function verifySuccessfulOutput(input: {
  toolId: ActivatedOfflineNodeToolId
  operationId: string
  repetition: 1 | 2
  container: ConfinedContainerResult
}): VerifiedRunnerOutput {
  const wire = asRecord(parseJson(input.container.stdout, `${input.toolId} runner stdout`), 'Runner output')
  if (
    wire.schemaVersion !== 'offline-node-runner-container-v1' ||
    wire.ok !== true ||
    wire.toolId !== input.toolId ||
    wire.operationId !== input.operationId ||
    wire.status !== 'actual_library_operation_completed' ||
    wire.actualToolPackageExecuted !== true ||
    wire.source !== 'server_resolved_in_memory'
  ) {
    throw activationFailure(`${input.toolId} returned an invalid canonical result identity.`)
  }
  const readiness = asRecord(wire.readiness, `${input.toolId} readiness`)
  if (
    readiness.privateInternalActivationEvidenceOnly !== true ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    readiness.dispatchAuthorityChanged !== false
  ) {
    throw activationFailure(`${input.toolId} returned an invalid readiness boundary.`)
  }
  const packageRecord = asRecord(wire.packageIdentity, `${input.toolId} package identity`)
  const expectedPackage = EXPECTED_PACKAGES[input.toolId]
  if (
    packageRecord.packageName !== expectedPackage.packageName ||
    packageRecord.version !== expectedPackage.version ||
    typeof packageRecord.packageJsonSha256 !== 'string' ||
    !SHA256_PATTERN.test(packageRecord.packageJsonSha256)
  ) {
    throw activationFailure(`${input.toolId} returned an unexpected package identity.`)
  }
  const invokedEntrypoints = stringArray(
    packageRecord.invokedEntrypoints,
    `${input.toolId} invoked entrypoints`,
  )
  if (invokedEntrypoints.length < 1 || invokedEntrypoints.some((entrypoint) => entrypoint.length > 120)) {
    throw activationFailure(`${input.toolId} package entrypoint evidence is invalid.`)
  }
  const bundle = asRecord(wire.bundleIdentity, `${input.toolId} bundle identity`)
  if (
    typeof bundle.sha256 !== 'string' || !SHA256_PATTERN.test(bundle.sha256) ||
    !Number.isSafeInteger(bundle.byteLength) || Number(bundle.byteLength) < 16_000
  ) {
    throw activationFailure(`${input.toolId} bundle identity is invalid.`)
  }
  const runtime = asRecord(wire.runtimeIdentity, `${input.toolId} runtime identity`)
  if (
    typeof runtime.nodeVersion !== 'string' || !/^v24\./.test(runtime.nodeVersion) ||
    runtime.platform !== 'linux' || typeof runtime.architecture !== 'string' ||
    runtime.uid !== 10_001 || runtime.gid !== 10_001
  ) {
    throw activationFailure(`${input.toolId} runtime identity is invalid.`)
  }
  if (typeof wire.inputSha256 !== 'string' || !SHA256_PATTERN.test(wire.inputSha256)) {
    throw activationFailure(`${input.toolId} input identity is invalid.`)
  }

  const artifacts = arrayValue(wire.artifacts, `${input.toolId} artifacts`)
  if (artifacts.length !== 2) throw activationFailure(`${input.toolId} must return exactly two private artifacts.`)
  const svgArtifact = artifactByKind(artifacts, 'svg', 'image/svg+xml')
  const verificationArtifact = artifactByKind(artifacts, 'verification_json', 'application/json')
  const svg = decodeAndVerifyArtifact(svgArtifact, `${input.toolId} SVG`)
  const verificationBytes = decodeAndVerifyArtifact(verificationArtifact, `${input.toolId} verification JSON`)
  verifySvg(input.toolId, svg.toString('utf8'))
  const semanticEvidence = verifySemanticEvidence(wire.semanticEvidence, input.toolId)
  verifyVerificationDocument({
    toolId: input.toolId,
    operationId: input.operationId,
    packageName: expectedPackage.packageName,
    inputSha256: wire.inputSha256,
    svgSha256: svgArtifact.sha256,
    svgByteLength: svg.byteLength,
    invokedEntrypoints,
    semanticEvidence,
    serialized: verificationBytes.toString('utf8'),
  })
  const resourceUsage = verifyResourceUsage(wire.processResourceUsage, input.toolId)
  const expectedConfinement = asRecord(wire.confinementExpectations, `${input.toolId} confinement expectations`)
  if (
    expectedConfinement.networkMode !== 'none' ||
    expectedConfinement.readOnlyRootFilesystem !== true ||
    expectedConfinement.nonRootUid !== 10_001 ||
    expectedConfinement.noCallerMounts !== true ||
    expectedConfinement.noCallerEnvironment !== true ||
    expectedConfinement.noCallerPathsUrlsCommandsOrSecrets !== true
  ) {
    throw activationFailure(`${input.toolId} did not emit the fixed confinement expectation boundary.`)
  }

  const packageIdentity: OfflineNodeRunnerPackageEvidence = {
    packageName: expectedPackage.packageName,
    version: expectedPackage.version,
    packageJsonSha256: packageRecord.packageJsonSha256,
    invokedEntrypoints,
  }
  return {
    evidence: {
      toolId: input.toolId,
      operationId: input.operationId,
      repetition: input.repetition,
      status: 'actual_library_operation_completed',
      inputSha256: wire.inputSha256,
      svgSha256: String(svgArtifact.sha256),
      svgByteLength: svg.byteLength,
      verificationJsonSha256: String(verificationArtifact.sha256),
      verificationJsonByteLength: verificationBytes.byteLength,
      semanticEvidence,
      packageIdentity,
      bundleSha256: bundle.sha256,
      bundleByteLength: Number(bundle.byteLength),
      runtimeIdentity: {
        nodeVersion: runtime.nodeVersion,
        platform: 'linux',
        architecture: runtime.architecture,
        uid: 10_001,
        gid: 10_001,
      },
      processResourceUsage: resourceUsage,
      confinement: input.container.confinement,
      containerExitCode: 0,
      oomKilled: false,
    },
    svg: svg.toString('utf8'),
  }
}

function verifyDeterminism(
  toolId: ActivatedOfflineNodeToolId,
  operationId: string,
  repetitions: readonly VerifiedRunnerOutput[],
): OfflineNodeRunnerDeterminismEvidence {
  if (repetitions.length !== 2) throw activationFailure(`${toolId} did not run exactly twice.`)
  const [left, right] = repetitions
  const leftEvidence = left.evidence
  const rightEvidence = right.evidence
  const comparableLeft = {
    inputSha256: leftEvidence.inputSha256,
    svgSha256: leftEvidence.svgSha256,
    verificationJsonSha256: leftEvidence.verificationJsonSha256,
    packageJsonSha256: leftEvidence.packageIdentity.packageJsonSha256,
    bundleSha256: leftEvidence.bundleSha256,
  }
  const comparableRight = {
    inputSha256: rightEvidence.inputSha256,
    svgSha256: rightEvidence.svgSha256,
    verificationJsonSha256: rightEvidence.verificationJsonSha256,
    packageJsonSha256: rightEvidence.packageIdentity.packageJsonSha256,
    bundleSha256: rightEvidence.bundleSha256,
  }
  if (
    stableAuthorityStringify(comparableLeft) !== stableAuthorityStringify(comparableRight) ||
    left.svg !== right.svg
  ) {
    throw activationFailure(`${toolId} output was not deterministic across two fresh containers.`)
  }
  return {
    toolId,
    operationId,
    ...comparableLeft,
    repetitionsCompared: 2,
    identical: true,
  }
}

async function runAdversarialCases(imageId: string): Promise<OfflineNodeRunnerAdversarialEvidence[]> {
  const evidence: OfflineNodeRunnerAdversarialEvidence[] = []
  for (const toolId of TOOL_IDS) {
    const operationId = getOfflineNodeRunnerCanonicalOperation(toolId).operationId
    evidence.push(await expectInvalidInput({
      caseId: `${toolId}_spoofed_operation`,
      toolId,
      rejectionKind: 'spoofed_operation',
      request: { toolId, operationId: `${operationId}.spoofed` },
      imageId,
    }))
    evidence.push(await expectInvalidInput({
      caseId: `${toolId}_prohibited_extra_field`,
      toolId,
      rejectionKind: 'prohibited_extra_field',
      request: { toolId, operationId, ...EXTRA_FIELD_CASES[toolId] },
      imageId,
    }))
  }
  evidence.push(await expectInvalidInput({
    caseId: 'unknown_tool_identity',
    toolId: 'unknown_tool',
    rejectionKind: 'unknown_tool',
    request: { toolId: 'unknown_tool', operationId: 'tool.unknown_tool.operation.v1' },
    imageId,
  }))
  return evidence
}

async function expectInvalidInput(input: {
  caseId: string
  toolId: ActivatedOfflineNodeToolId | 'unknown_tool'
  rejectionKind: OfflineNodeRunnerAdversarialEvidence['rejectionKind']
  request: Readonly<Record<string, unknown>>
  imageId: string
}): Promise<OfflineNodeRunnerAdversarialEvidence> {
  const container = await runConfinedContainer(input.request, input.imageId)
  if (container.exitCode !== 2 || container.oomKilled || container.stdout.length !== 0) {
    throw activationFailure(`Adversarial case ${input.caseId} was not rejected safely.`)
  }
  const errorOutput = asRecord(parseJson(container.stderr, `${input.caseId} rejection`), 'Runner rejection')
  const error = asRecord(errorOutput.error, `${input.caseId} rejection error`)
  const readiness = asRecord(errorOutput.readiness, `${input.caseId} rejection readiness`)
  if (
    errorOutput.schemaVersion !== 'offline-node-runner-container-v1' ||
    errorOutput.ok !== false ||
    error.code !== 'INVALID_INPUT' ||
    error.message !== 'Offline runner request rejected.' ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false
  ) {
    throw activationFailure(`Adversarial case ${input.caseId} returned an unsafe rejection shape.`)
  }
  return {
    caseId: input.caseId,
    toolId: input.toolId,
    rejectionKind: input.rejectionKind,
    errorCode: 'INVALID_INPUT',
    containerExitCode: 2,
    stdoutEmpty: true,
    rejected: true,
    confinementConfigurationHash: container.confinement.configurationHash,
    oomKilled: false,
  }
}

function verifySvg(toolId: ActivatedOfflineNodeToolId, svg: string): void {
  if (
    Buffer.byteLength(svg, 'utf8') < 64 ||
    !svg.startsWith('<svg') || !svg.endsWith('</svg>') ||
    (svg.match(/<svg\b/gi)?.length ?? 0) !== 1 ||
    (svg.match(/<\/svg>/gi)?.length ?? 0) !== 1 ||
    /<(?:script|foreignObject|iframe|object|embed|audio|video)\b/i.test(svg) ||
    /\son[a-z]+\s*=/i.test(svg) ||
    /(?:href|src)\s*=\s*["']\s*(?:https?:|file:|data:|javascript:)/i.test(svg) ||
    /url\(\s*["']?\s*(?:https?:|file:|data:|javascript:)/i.test(svg)
  ) {
    throw activationFailure(`${toolId} SVG failed the host active-content and external-reference check.`)
  }
  const signatures: Readonly<Record<ActivatedOfflineNodeToolId, readonly RegExp[]>> = {
    d3: [/data-reeditpro-library="d3\.line"/, /Quarterly revenue/],
    echarts: [/reeditpro-zr-/, /ecmeta_series_index=/, /Quarterly revenue/],
    vega_lite: [/role-mark/, /Quarterly revenue/],
    vega: [/role-mark/, /Quarterly revenue/],
    satori: [/<mask\b/, /<path\b/, /satori_/],
    viz_js: [/class="graph"/, /class="node"/, /class="edge"/, /Approved edit flow/],
  }
  if (signatures[toolId].some((signature) => !signature.test(svg))) {
    throw activationFailure(`${toolId} SVG does not contain its expected library-specific semantics.`)
  }
}

function verifyVerificationDocument(input: {
  toolId: ActivatedOfflineNodeToolId
  operationId: string
  packageName: string
  inputSha256: unknown
  svgSha256: unknown
  svgByteLength: number
  invokedEntrypoints: readonly string[]
  semanticEvidence: OfflineNodeRunnerSvgSemanticEvidence
  serialized: string
}): void {
  const document = asRecord(parseJson(input.serialized, `${input.toolId} verification JSON`), 'Verification JSON')
  if (
    document.schemaVersion !== 'offline-node-runner-verification-v1' ||
    document.protocol !== 'offline-node-runner-v1' ||
    document.toolId !== input.toolId ||
    document.operationId !== input.operationId ||
    document.packageName !== input.packageName ||
    document.actualToolPackageExecuted !== true ||
    document.source !== 'server_resolved_in_memory' ||
    document.inputSha256 !== input.inputSha256 ||
    document.svgSha256 !== input.svgSha256 ||
    document.svgByteLength !== input.svgByteLength ||
    document.networkPolicy !== 'offline_no_caller_targets_no_provider_calls' ||
    document.frontendExecutionAllowed !== false ||
    document.readinessScope !== 'tool_specific_operation_evidence_only' ||
    stableAuthorityStringify(document.invokedEntrypoints) !==
      stableAuthorityStringify(input.invokedEntrypoints) ||
    stableAuthorityStringify(document.semanticEvidence) !==
      stableAuthorityStringify(input.semanticEvidence)
  ) {
    throw activationFailure(`${input.toolId} verification JSON does not bind the actual SVG operation.`)
  }
}

function verifySemanticEvidence(value: unknown, toolId: string): OfflineNodeRunnerSvgSemanticEvidence {
  const record = asRecord(value, `${toolId} semantic evidence`)
  const integerFields = [
    'svgRootCount',
    'elementCount',
    'textElementCount',
    'pathElementCount',
    'rectElementCount',
    'groupElementCount',
  ] as const
  if (
    integerFields.some((field) => !Number.isSafeInteger(record[field]) || Number(record[field]) < 0) ||
    record.svgRootCount !== 1 ||
    record.elementCount === 0 ||
    record.unsafeMarkupRejected !== true ||
    record.externalReferencesRejected !== true ||
    record.finiteNumericOutputVerified !== true ||
    (record.declaredWidth !== undefined && (!Number.isFinite(record.declaredWidth) || Number(record.declaredWidth) <= 0)) ||
    (record.declaredHeight !== undefined && (!Number.isFinite(record.declaredHeight) || Number(record.declaredHeight) <= 0)) ||
    (record.viewBox !== undefined && typeof record.viewBox !== 'string')
  ) {
    throw activationFailure(`${toolId} semantic evidence is invalid.`)
  }
  return record as unknown as OfflineNodeRunnerSvgSemanticEvidence
}

function verifyResourceUsage(value: unknown, toolId: string): OfflineNodeRunnerResourceUsageEvidence {
  const record = asRecord(value, `${toolId} process resource usage`)
  const fields = [
    'wallTimeMicroseconds',
    'userCpuMicroseconds',
    'systemCpuMicroseconds',
    'maxRssKilobytes',
    'minorPageFaults',
    'majorPageFaults',
    'voluntaryContextSwitches',
    'involuntaryContextSwitches',
    'fsReadOperations',
    'fsWriteOperations',
    'rssBytesBefore',
    'rssBytesAfter',
    'heapUsedBytesBefore',
    'heapUsedBytesAfter',
  ] as const
  if (
    fields.some((field) => !Number.isSafeInteger(record[field]) || Number(record[field]) < 0) ||
    Number(record.wallTimeMicroseconds) === 0 ||
    Number(record.maxRssKilobytes) === 0 ||
    Number(record.rssBytesBefore) === 0 ||
    Number(record.rssBytesAfter) === 0
  ) {
    throw activationFailure(`${toolId} process resource usage evidence is invalid.`)
  }
  return record as unknown as OfflineNodeRunnerResourceUsageEvidence
}

function artifactByKind(
  artifacts: readonly unknown[],
  artifactKind: string,
  mimeType: string,
): Record<string, unknown> {
  const matching = artifacts.filter((artifact) => {
    const record = asRecord(artifact, 'Runner artifact')
    return record.artifactKind === artifactKind
  })
  if (matching.length !== 1) throw activationFailure(`Runner must emit one ${artifactKind} artifact.`)
  const artifact = asRecord(matching[0], `${artifactKind} artifact`)
  if (
    artifact.mimeType !== mimeType ||
    artifact.privateArtifactRequired !== true ||
    artifact.publicUrl !== null ||
    typeof artifact.sha256 !== 'string' || !SHA256_PATTERN.test(artifact.sha256) ||
    !Number.isSafeInteger(artifact.byteLength) || Number(artifact.byteLength) < 1 ||
    typeof artifact.bytesBase64 !== 'string'
  ) {
    throw activationFailure(`${artifactKind} artifact identity or privacy boundary is invalid.`)
  }
  return artifact
}

function decodeAndVerifyArtifact(artifact: Record<string, unknown>, label: string): Buffer {
  const base64 = String(artifact.bytesBase64)
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    throw activationFailure(`${label} is not canonical base64.`)
  }
  const bytes = Buffer.from(base64, 'base64')
  if (
    bytes.toString('base64') !== base64 ||
    bytes.byteLength !== artifact.byteLength ||
    sha256(bytes) !== artifact.sha256
  ) {
    throw activationFailure(`${label} checksum or byte length is invalid.`)
  }
  return bytes
}

async function runHostCommand(args: readonly string[], options: {
  cwd?: string
  input?: string
  timeoutMs: number
  maximumOutputBytes?: number
}): Promise<HostCommandResult> {
  const maximumOutputBytes = options.maximumOutputBytes ?? MAXIMUM_COMMAND_OUTPUT_BYTES
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('docker', [...args], {
      cwd: options.cwd,
      env: process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    let exceededOutputLimit = false
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, options.timeoutMs)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes + stderrBytes > maximumOutputBytes) {
        exceededOutputLimit = true
        child.kill('SIGKILL')
        return
      }
      stdoutChunks.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stdoutBytes + stderrBytes > maximumOutputBytes) {
        exceededOutputLimit = true
        child.kill('SIGKILL')
        return
      }
      stderrChunks.push(chunk)
    })
    child.stdin.on('error', () => undefined)
    child.on('error', () => {
      clearTimeout(timeout)
      rejectPromise(activationFailure('Docker process could not be started.'))
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (timedOut) {
        rejectPromise(activationFailure('Docker process exceeded its fixed timeout.'))
        return
      }
      if (exceededOutputLimit) {
        rejectPromise(activationFailure('Docker process exceeded its fixed output ceiling.'))
        return
      }
      resolvePromise({
        exitCode: code ?? 255,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      })
    })
    child.stdin.end(options.input ?? '')
  })
}

function assertPersistedAttestationCore(record: Record<string, unknown>): void {
  const readiness = asRecord(record.readiness, 'Persisted activation readiness')
  const summary = asRecord(record.summary, 'Persisted activation summary')
  if (
    record.schemaVersion !== OFFLINE_NODE_RUNNER_ACTIVATION_VERSION ||
    record.source !== 'private_local_docker_offline_node_runner_activation' ||
    readiness.privateInternalActivationEvidenceOnly !== true ||
    readiness.productReady !== false ||
    readiness.externalBetaReady !== false ||
    readiness.productionReady !== false ||
    readiness.dispatchAuthorityChanged !== false ||
    summary.canonicalToolCount !== 6 ||
    summary.successfulContainerRunCount !== 12 ||
    summary.deterministicOperationCount !== 6 ||
    summary.adversarialCaseCount !== 13 ||
    summary.confinedContainerCount !== 25 ||
    !Array.isArray(record.successfulOperations) || record.successfulOperations.length !== 12 ||
    !Array.isArray(record.deterministicOperations) || record.deterministicOperations.length !== 6 ||
    !Array.isArray(record.adversarialCases) || record.adversarialCases.length !== 13
  ) {
    throw activationFailure('Persisted offline Node runner attestation core evidence is invalid.')
  }
}

function environmentNames(values: readonly string[]): string[] {
  const names = values.map((value) => value.slice(0, value.indexOf('=')))
  if (names.some((name) => !/^[A-Z][A-Z0-9_]{0,63}$/.test(name)) || new Set(names).size !== names.length) {
    throw activationFailure('Docker image environment names are invalid.')
  }
  return [...names].sort()
}

function secretLikeEnvironmentNames(names: readonly string[]): string[] {
  return names.filter((name) => /(?:AUTH|COOKIE|CREDENTIAL|KEY|PASSWORD|SECRET|TOKEN)/i.test(name))
}

function resolveWithinRepository(repositoryRoot: string, relativePath: string): string {
  const resolved = resolve(repositoryRoot, relativePath)
  if (!resolved.startsWith(`${repositoryRoot}${sep}`)) {
    throw activationFailure('Fixed build input escaped the repository root.')
  }
  return resolved
}

function repositoryRootPath(): string {
  return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '')
}

async function sha256File(path: string): Promise<string> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw activationFailure('Runner build identity source is not a regular file.')
    return sha256(await handle.readFile())
  } finally {
    await handle.close()
  }
}

async function assertPinnedDockerfile(path: string): Promise<void> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > 32 * 1024) {
      throw activationFailure('Offline Node runner Dockerfile is not a bounded regular file.')
    }
    const dockerfile = (await handle.readFile()).toString('utf8')
    const pinnedFrom = `FROM ${PINNED_BASE_IMAGE}`
    const pinnedFromCount = dockerfile.split('\n').filter((line) => line.startsWith(pinnedFrom)).length
    if (
      !dockerfile.startsWith('# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e\n') ||
      pinnedFromCount !== 3 ||
      dockerfile.includes('ARG NODE_BASE_IMAGE') ||
      !dockerfile.includes('sha256sum --check --strict') ||
      !dockerfile.includes('npm ci --omit=dev --ignore-scripts --no-audit --no-fund') ||
      !dockerfile.includes('USER 10001:10001') ||
      !dockerfile.includes('ENTRYPOINT ["node", "--no-warnings", "/app/offline-node-runner-cli.mjs"]')
    ) {
      throw activationFailure('Offline Node runner Dockerfile does not match the immutable build policy.')
    }
  } finally {
    await handle.close()
  }
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stripShaPrefix(value: string): string {
  return value.startsWith('sha256:') ? value.slice('sha256:'.length) : value
}

function parseJson(serialized: string, label: string): unknown {
  try {
    return JSON.parse(serialized)
  } catch {
    throw activationFailure(`${label} is not valid JSON.`)
  }
}

function parseSingleInspect<T>(serialized: string, label: string): T {
  const parsed = parseJson(serialized, label)
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0] || typeof parsed[0] !== 'object') {
    throw activationFailure(`${label} must contain exactly one object.`)
  }
  return parsed[0] as T
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw activationFailure(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function stringRecord(value: unknown, label: string): Record<string, string> {
  const record = asRecord(value, label)
  if (Object.values(record).some((nested) => typeof nested !== 'string')) {
    throw activationFailure(`${label} must contain string values only.`)
  }
  return record as Record<string, string>
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((nested) => typeof nested !== 'string')) {
    throw activationFailure(`${label} must be a string array.`)
  }
  return value as string[]
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw activationFailure(`${label} must be an array.`)
  return value
}

function assertExactKeys(record: Record<string, unknown>, expected: readonly string[]): void {
  if (Object.keys(record).sort().join('\u0000') !== [...expected].sort().join('\u0000')) {
    throw activationFailure('Persisted offline Node runner attestation contains unsupported fields.')
  }
}

function activationFailure(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}
