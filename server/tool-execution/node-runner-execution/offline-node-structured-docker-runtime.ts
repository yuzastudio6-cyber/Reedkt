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
import { join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import type {
  OfflineNodeStructuredExecutionConfinementEvidence,
  OfflineNodeStructuredExecutionImageEvidence,
} from './offline-node-structured-execution-types'

export const OFFLINE_NODE_STRUCTURED_EXECUTION_IMAGE_TAG =
  'reeditpro-offline-node-structured-execution:private-local-v1' as const
const BASE_IMAGE_DIGEST =
  'sha256:cb4e8f7c443347358b7875e717c29e27bf9befc8f5a26cf18af3c3dec80e58c5' as const
const PINNED_BASE_IMAGE = `node:24-bookworm-slim@${BASE_IMAGE_DIGEST}` as const
const BUILD_CONTEXT_PATH = '/tmp/reeditpro-offline-node-structured-execution-build-context-v1'
const MAXIMUM_COMMAND_OUTPUT_BYTES = 32 * 1024 * 1024
const BUILD_TIMEOUT_MS = 15 * 60 * 1_000
const RUN_TIMEOUT_MS = 30_000
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const CONTAINER_ENTRYPOINT = [
  'node',
  '--no-warnings',
  '/app/offline-node-structured-execution-cli.mjs',
] as const

interface DockerImageInspect {
  Id?: unknown
  Architecture?: unknown
  Os?: unknown
  Config?: unknown
  RootFS?: unknown
}

interface DockerContainerInspect {
  Image?: unknown
  State?: unknown
  HostConfig?: unknown
  Mounts?: unknown
  Config?: unknown
}

interface HostCommandResult {
  exitCode: number
  stdout: string
  stderr: string
}

export interface OfflineNodeStructuredContainerResult {
  stdout: string
  stderr: string
  exitCode: number
  oomKilled: boolean
  confinement: OfflineNodeStructuredExecutionConfinementEvidence
}

export async function prepareOfflineNodeStructuredDockerRuntime():
Promise<OfflineNodeStructuredExecutionImageEvidence> {
  const repositoryRoot = repositoryRootPath()
  const dockerfilePath = join(
    repositoryRoot,
    'docker/prod/offline-node-structured-execution/Dockerfile',
  )
  const lockfilePath = join(repositoryRoot, 'docker/prod/offline-node-runner/package-lock.json')
  const dependencyLockSha256 = await sha256File(lockfilePath)
  const dockerfileSha256 = await sha256File(dockerfilePath)
  await assertPinnedDockerfile(dockerfilePath)
  await prepareBuildContext(repositoryRoot)
  try {
    const build = await runHostCommand([
      'build',
      '--pull=false',
      '--progress=plain',
      '--build-arg',
      `RUNNER_LOCK_SHA256=${dependencyLockSha256}`,
      '--tag',
      OFFLINE_NODE_STRUCTURED_EXECUTION_IMAGE_TAG,
      '--file',
      'docker/prod/offline-node-structured-execution/Dockerfile',
      '.',
    ], {
      cwd: BUILD_CONTEXT_PATH,
      timeoutMs: BUILD_TIMEOUT_MS,
    })
    if (build.exitCode !== 0) {
      throw runtimeFailure('The private structured Node execution image did not build successfully.')
    }
    return await inspectAndValidateImage({
      dependencyLockSha256,
      dockerfileSha256,
    })
  } finally {
    await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflineNodeStructuredDockerRuntime():
Promise<OfflineNodeStructuredExecutionImageEvidence> {
  if (arguments.length !== 0) {
    throw new ApiError('VALIDATION_FAILED', 'Structured runtime image inspection accepts no caller input.', 400)
  }
  const repositoryRoot = repositoryRootPath()
  const dockerfilePath = join(
    repositoryRoot,
    'docker/prod/offline-node-structured-execution/Dockerfile',
  )
  const lockfilePath = join(repositoryRoot, 'docker/prod/offline-node-runner/package-lock.json')
  const dependencyLockSha256 = await sha256File(lockfilePath)
  const dockerfileSha256 = await sha256File(dockerfilePath)
  await assertPinnedDockerfile(dockerfilePath)
  return inspectAndValidateImage({ dependencyLockSha256, dockerfileSha256 })
}

/**
 * Low-level container transport for the validated service and its adversarial
 * smoke only. Product code must enter through
 * createPrivateOfflineNodeStructuredExecutionRuntime().execute().
 */
export async function runOfflineNodeStructuredContainer(input: {
  image: OfflineNodeStructuredExecutionImageEvidence
  serializedRequest: string
}): Promise<OfflineNodeStructuredContainerResult> {
  if (Buffer.byteLength(input.serializedRequest, 'utf8') > 3 * 1024 * 1024 + 8 * 1024) {
    throw runtimeFailure('Structured execution request exceeds the fixed container stdin ceiling.')
  }
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
    input.image.imageId,
  ], { timeoutMs: RUN_TIMEOUT_MS })
  if (createResult.exitCode !== 0 || createResult.stderr.trim()) {
    throw runtimeFailure('The confined structured Node execution container could not be created.')
  }
  const containerId = createResult.stdout.trim()
  if (!/^[a-f0-9]{64}$/.test(containerId)) {
    throw runtimeFailure('Docker returned an invalid structured execution container identity.')
  }
  try {
    const before = await inspectContainer(containerId)
    const confinement = validateConfinement(before, input.image)
    const startResult = await runHostCommand(['start', '--attach', '--interactive', containerId], {
      input: `${input.serializedRequest}\n`,
      timeoutMs: RUN_TIMEOUT_MS,
      maximumOutputBytes: 24 * 1024 * 1024,
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
      throw runtimeFailure('Structured Node execution container exit state is inconsistent.')
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

async function prepareBuildContext(repositoryRoot: string): Promise<void> {
  await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true })
  await mkdir(BUILD_CONTEXT_PATH, { recursive: true, mode: 0o700 })
  const sources = [
    'docker/prod/offline-node-runner',
    'docker/prod/offline-node-structured-execution',
    'server/tool-execution',
    'server/tool-registry',
    'src/backend/contracts',
  ] as const
  for (const source of sources) {
    await copyCleanTree(
      resolveWithinRepository(repositoryRoot, source),
      join(BUILD_CONTEXT_PATH, source),
    )
  }
}

async function copyCleanTree(sourcePath: string, targetPath: string): Promise<void> {
  const sourceStat = await lstat(sourcePath)
  if (sourceStat.isSymbolicLink()) {
    throw runtimeFailure('Structured runner build inputs must not contain symbolic links.')
  }
  if (sourceStat.isDirectory()) {
    await mkdir(targetPath, { recursive: true, mode: 0o700 })
    const entries = await readdir(sourcePath, { withFileTypes: true })
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
      await copyCleanTree(join(sourcePath, entry.name), join(targetPath, entry.name))
    }
    return
  }
  if (!sourceStat.isFile() || sourceStat.size > 8 * 1024 * 1024) {
    throw runtimeFailure('Structured runner build input is not a bounded regular file.')
  }
  await mkdir(join(targetPath, '..'), { recursive: true, mode: 0o700 })
  await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL)
}

async function inspectAndValidateImage(input: {
  dependencyLockSha256: string
  dockerfileSha256: string
}): Promise<OfflineNodeStructuredExecutionImageEvidence> {
  const result = await runHostCommand(['image', 'inspect', OFFLINE_NODE_STRUCTURED_EXECUTION_IMAGE_TAG], {
    timeoutMs: RUN_TIMEOUT_MS,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw runtimeFailure('The private structured Node image could not be inspected.')
  }
  const inspect = parseSingleInspect<DockerImageInspect>(result.stdout, 'Docker image inspect')
  const config = asRecord(inspect.Config, 'Docker image config')
  const rootFs = asRecord(inspect.RootFS, 'Docker image root filesystem')
  const labels = stringRecord(config.Labels, 'Docker image labels')
  const entrypoint = stringArray(config.Entrypoint, 'Docker image entrypoint')
  const envNames = environmentNames(stringArray(config.Env, 'Docker image environment'))
  const layerDigests = stringArray(rootFs.Layers, 'Docker root filesystem layers')
  if (
    inspect.Os !== 'linux' ||
    typeof inspect.Architecture !== 'string' ||
    typeof inspect.Id !== 'string' ||
    !SHA256_PATTERN.test(stripShaPrefix(inspect.Id)) ||
    config.User !== '10001:10001' ||
    config.WorkingDir !== '/app' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(CONTAINER_ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_IMAGE_DIGEST ||
    labels['com.reeditpro.runner.lock.sha256'] !== input.dependencyLockSha256 ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-node-structured-execution-container-v1' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' ||
    labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    labels['com.reeditpro.runner.external-beta-ready'] !== 'false' ||
    labels['com.reeditpro.runner.production-ready'] !== 'false' ||
    layerDigests.length < 2 ||
    layerDigests.some((digest) => !SHA256_PATTERN.test(stripShaPrefix(digest))) ||
    secretLikeEnvironmentNames(envNames).length > 0
  ) {
    throw runtimeFailure('The private structured Node image identity is invalid.')
  }
  const identity = {
    imageId: inspect.Id,
    architecture: inspect.Architecture,
    os: inspect.Os,
    entrypoint,
    envNames,
    layerDigests,
    labels,
    dependencyLockSha256: input.dependencyLockSha256,
    dockerfileSha256: input.dockerfileSha256,
  }
  return {
    imageTag: OFFLINE_NODE_STRUCTURED_EXECUTION_IMAGE_TAG,
    imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue(identity),
    pinnedBaseImage: PINNED_BASE_IMAGE,
    baseImageDigest: BASE_IMAGE_DIGEST,
    dependencyLockSha256: input.dependencyLockSha256,
    dockerfileSha256: input.dockerfileSha256,
    imageUser: '10001:10001',
    imageEntrypoint: CONTAINER_ENTRYPOINT,
    imageEnvironmentNames: envNames,
    rootFilesystemLayerDigests: layerDigests,
    labels,
  }
}

async function inspectContainer(containerId: string): Promise<DockerContainerInspect> {
  const result = await runHostCommand(['inspect', containerId], { timeoutMs: RUN_TIMEOUT_MS })
  if (result.exitCode !== 0 || result.stderr.trim()) {
    throw runtimeFailure('The structured Node container could not be inspected.')
  }
  return parseSingleInspect<DockerContainerInspect>(result.stdout, 'Docker container inspect')
}

function validateConfinement(
  inspect: DockerContainerInspect,
  image: OfflineNodeStructuredExecutionImageEvidence,
): OfflineNodeStructuredExecutionConfinementEvidence {
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
  const environment = stringArray(config.Env, 'Docker container environment')
  const envNames = environmentNames(environment)
  const tmpfsTokens = new Set(String(tmpfs['/tmp'] ?? '').split(','))
  const projection = {
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
    envNames,
  }
  if (
    inspect.Image !== image.imageId ||
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
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) ||
    Object.keys(tmpfs).length !== 1 ||
    !tmpfsTokens.has('rw') ||
    !tmpfsTokens.has('noexec') ||
    !tmpfsTokens.has('nosuid') ||
    !tmpfsTokens.has('nodev') ||
    !tmpfsTokens.has('size=67108864') ||
    secretLikeEnvironmentNames(envNames).length !== 0
  ) {
    throw runtimeFailure('The structured Node container confinement profile is invalid.')
  }
  return {
    configurationHash: sha256AuthorityValue(projection),
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
    let settled = false
    const rejectOnce = (error: Error) => {
      if (settled) return
      settled = true
      rejectPromise(error)
    }
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, options.timeoutMs)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes + stderrBytes > maximumOutputBytes) {
        exceededOutputLimit = true
        child.kill('SIGKILL')
      } else {
        stdoutChunks.push(chunk)
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stdoutBytes + stderrBytes > maximumOutputBytes) {
        exceededOutputLimit = true
        child.kill('SIGKILL')
      } else {
        stderrChunks.push(chunk)
      }
    })
    child.stdin.on('error', () => undefined)
    child.on('error', () => {
      clearTimeout(timeout)
      rejectOnce(runtimeFailure('The Docker process could not be started.'))
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (settled) return
      if (timedOut) {
        rejectOnce(runtimeFailure('The Docker process exceeded its fixed timeout.'))
        return
      }
      if (exceededOutputLimit) {
        rejectOnce(runtimeFailure('The Docker process exceeded its fixed output ceiling.'))
        return
      }
      settled = true
      resolvePromise({
        exitCode: code ?? 255,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      })
    })
    child.stdin.end(options.input ?? '')
  })
}

async function sha256File(path: string): Promise<string> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile()) throw runtimeFailure('Structured runner identity input is not a file.')
    return createHash('sha256').update(await handle.readFile()).digest('hex')
  } finally {
    await handle.close()
  }
}

async function assertPinnedDockerfile(path: string): Promise<void> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > 32 * 1024) {
      throw runtimeFailure('Structured runner Dockerfile is not a bounded regular file.')
    }
    const dockerfile = (await handle.readFile()).toString('utf8')
    const fromCount = dockerfile.split('\n').filter((line) => line.startsWith(`FROM ${PINNED_BASE_IMAGE}`)).length
    if (
      !dockerfile.startsWith('# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e\n') ||
      fromCount !== 3 ||
      dockerfile.includes('ARG NODE_BASE_IMAGE') ||
      !dockerfile.includes('sha256sum --check --strict') ||
      !dockerfile.includes('docker/prod/offline-node-runner/package-lock.json') ||
      !dockerfile.includes('USER 10001:10001') ||
      !dockerfile.includes('ENTRYPOINT ["node", "--no-warnings", "/app/offline-node-structured-execution-cli.mjs"]')
    ) {
      throw runtimeFailure('Structured runner Dockerfile does not match the immutable build policy.')
    }
  } finally {
    await handle.close()
  }
}

function repositoryRootPath(): string {
  return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '')
}

function resolveWithinRepository(repositoryRoot: string, relativePath: string): string {
  const resolved = resolve(repositoryRoot, relativePath)
  if (!resolved.startsWith(`${repositoryRoot}${sep}`)) {
    throw runtimeFailure('Fixed structured runner input escaped the repository root.')
  }
  return resolved
}

function parseSingleInspect<T>(serialized: string, label: string): T {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    throw runtimeFailure(`${label} is not valid JSON.`)
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0] || typeof parsed[0] !== 'object') {
    throw runtimeFailure(`${label} must contain exactly one object.`)
  }
  return parsed[0] as T
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw runtimeFailure(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

function stringRecord(value: unknown, label: string): Record<string, string> {
  const record = asRecord(value, label)
  if (Object.values(record).some((nested) => typeof nested !== 'string')) {
    throw runtimeFailure(`${label} must contain strings only.`)
  }
  return record as Record<string, string>
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((nested) => typeof nested !== 'string')) {
    throw runtimeFailure(`${label} must be a string array.`)
  }
  return value as string[]
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw runtimeFailure(`${label} must be an array.`)
  return value
}

function environmentNames(values: readonly string[]): string[] {
  const names = values.map((value) => value.slice(0, value.indexOf('=')))
  if (names.some((name) => !/^[A-Z][A-Z0-9_]{0,63}$/.test(name)) || new Set(names).size !== names.length) {
    throw runtimeFailure('Docker image environment names are invalid.')
  }
  return [...names].sort()
}

function secretLikeEnvironmentNames(names: readonly string[]): string[] {
  return names.filter((name) => /(?:AUTH|COOKIE|CREDENTIAL|KEY|PASSWORD|SECRET|TOKEN)/i.test(name))
}

function stripShaPrefix(value: string): string {
  return value.startsWith('sha256:') ? value.slice('sha256:'.length) : value
}

function runtimeFailure(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503)
}
