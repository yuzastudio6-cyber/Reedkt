import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, open, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type {
  OfflinePythonStructuredConfinementEvidence,
  OfflinePythonStructuredImageEvidence,
} from './offline-python-structured-execution-types'

export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_IMAGE_TAG =
  'reeditpro-offline-python-structured-execution:private-local-v1' as const
const BASE_IMAGE_DIGEST =
  'sha256:20080e807bfc404f8450b185cf0fc95d553462673598549613735f70a5b4d5d0' as const
const PINNED_BASE_IMAGE = `python:3.13.11-slim-bookworm@${BASE_IMAGE_DIGEST}` as const
const BUILD_CONTEXT_PATH = '/tmp/reeditpro-offline-python-structured-build-context-v1'
const ENTRYPOINT = ['python', '-s', '/app/runner.py'] as const
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const RUN_TIMEOUT_MS = 30_000
const BUILD_TIMEOUT_MS = 15 * 60 * 1_000

interface HostResult { exitCode: number; stdout: string; stderr: string }
interface ContainerInspect { Image?: unknown; State?: unknown; HostConfig?: unknown; Mounts?: unknown; Config?: unknown }

export interface OfflinePythonStructuredContainerResult {
  stdout: string
  stderr: string
  exitCode: number
  oomKilled: boolean
  confinement: OfflinePythonStructuredConfinementEvidence
}

export async function prepareOfflinePythonStructuredDockerRuntime():
Promise<OfflinePythonStructuredImageEvidence> {
  const repositoryRoot = repositoryRootPath()
  const sourceDirectory = join(repositoryRoot, 'docker/prod/offline-python-structured-execution')
  const hashes = await sourceHashes(sourceDirectory)
  await assertPinnedDockerfile(join(sourceDirectory, 'Dockerfile'))
  await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true })
  try {
    await copyCleanTree(
      sourceDirectory,
      join(BUILD_CONTEXT_PATH, 'docker/prod/offline-python-structured-execution'),
    )
    const build = await runDocker([
      'build',
      '--pull=false',
      '--progress=plain',
      '--tag',
      OFFLINE_PYTHON_STRUCTURED_EXECUTION_IMAGE_TAG,
      '--file',
      'docker/prod/offline-python-structured-execution/Dockerfile',
      '.',
    ], { cwd: BUILD_CONTEXT_PATH, timeoutMs: BUILD_TIMEOUT_MS, maximumOutputBytes: 32 * 1024 * 1024 })
    if (build.exitCode !== 0) {
      throw runtimeFailure(
        'Private structured Python image build failed.',
        new Error(boundedDockerDiagnostic(build)),
      )
    }
    return inspectAndValidateImage(hashes)
  } finally {
    await rm(BUILD_CONTEXT_PATH, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflinePythonStructuredDockerRuntime():
Promise<OfflinePythonStructuredImageEvidence> {
  if (arguments.length !== 0) throw validationFailure('Python runtime image inspection accepts no caller input.')
  const sourceDirectory = join(repositoryRootPath(), 'docker/prod/offline-python-structured-execution')
  await assertPinnedDockerfile(join(sourceDirectory, 'Dockerfile'))
  return inspectAndValidateImage(await sourceHashes(sourceDirectory))
}

export async function runOfflinePythonStructuredContainer(input: {
  image: OfflinePythonStructuredImageEvidence
  serializedRequest: string
}): Promise<OfflinePythonStructuredContainerResult> {
  if (Buffer.byteLength(input.serializedRequest, 'utf8') > 24 * 1024 * 1024) {
    throw validationFailure('Structured Python request exceeds the container stdin ceiling.')
  }
  const created = await runDocker([
    'create', '--interactive',
    '--network', 'none',
    '--read-only',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '64',
    '--memory', '768m',
    '--memory-swap', '768m',
    '--cpus', '1',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=67108864',
    '--user', '10001:10001',
    input.image.imageId,
  ], { timeoutMs: RUN_TIMEOUT_MS, maximumOutputBytes: 64 * 1024 })
  if (created.exitCode !== 0 || created.stderr.trim()) {
    throw runtimeFailure('Confined structured Python container could not be created.')
  }
  const containerId = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/.test(containerId)) throw runtimeFailure('Docker returned an invalid Python container identity.')
  try {
    const before = await inspectContainer(containerId)
    const confinement = validateConfinement(before, input.image)
    const started = await runDocker(['start', '--attach', '--interactive', containerId], {
      input: `${input.serializedRequest}\n`,
      timeoutMs: RUN_TIMEOUT_MS,
      maximumOutputBytes: 8 * 1024 * 1024,
    })
    const after = await inspectContainer(containerId)
    const state = asRecord(after.State, 'container state')
    if (
      state.ExitCode !== started.exitCode ||
      typeof state.OOMKilled !== 'boolean' ||
      state.Status !== 'exited' ||
      state.Running !== false
    ) {
      throw runtimeFailure('Structured Python container exit state is inconsistent.')
    }
    return {
      stdout: started.stdout,
      stderr: started.stderr,
      exitCode: started.exitCode,
      oomKilled: state.OOMKilled,
      confinement,
    }
  } finally {
    await runDocker(['rm', '--force', containerId], {
      timeoutMs: RUN_TIMEOUT_MS,
      maximumOutputBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

async function inspectAndValidateImage(hashes: {
  requirementsLockSha256: string
  sceneDetectLockSha256: string
  runnerSha256: string
  dockerfileSha256: string
}): Promise<OfflinePythonStructuredImageEvidence> {
  const result = await runDocker(['image', 'inspect', OFFLINE_PYTHON_STRUCTURED_EXECUTION_IMAGE_TAG], {
    timeoutMs: RUN_TIMEOUT_MS,
    maximumOutputBytes: 8 * 1024 * 1024,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Structured Python image is unavailable.')
  const parsed = parseJson(result.stdout, 'image inspect')
  if (!Array.isArray(parsed) || parsed.length !== 1) throw runtimeFailure('Structured Python image inspect is invalid.')
  const inspect = asRecord(parsed[0], 'image inspect')
  const config = asRecord(inspect.Config, 'image config')
  const rootFs = asRecord(inspect.RootFS, 'image root filesystem')
  const labels = stringRecord(config.Labels, 'image labels')
  const entrypoint = stringArray(config.Entrypoint, 'image entrypoint')
  const envNames = environmentNames(stringArray(config.Env, 'image environment'))
  const layers = stringArray(rootFs.Layers, 'image layers')
  if (
    inspect.Os !== 'linux' ||
    typeof inspect.Architecture !== 'string' ||
    typeof inspect.Id !== 'string' ||
    !SHA256_PATTERN.test(stripSha(inspect.Id)) ||
    config.User !== '10001:10001' ||
    config.WorkingDir !== '/app' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_IMAGE_DIGEST ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-python-structured-execution-container-v1' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' ||
    labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    labels['com.reeditpro.runner.external-beta-ready'] !== 'false' ||
    labels['com.reeditpro.runner.production-ready'] !== 'false' ||
    layers.length < 2 ||
    layers.some((layer) => !SHA256_PATTERN.test(stripSha(layer))) ||
    secretLikeEnvironmentNames(envNames).length > 0
  ) {
    throw runtimeFailure('Structured Python image identity is invalid.')
  }
  const imageIdentityHash = sha256AuthorityValue({
    imageId: inspect.Id,
    architecture: inspect.Architecture,
    os: inspect.Os,
    entrypoint,
    envNames,
    layers,
    labels,
    ...hashes,
  })
  return {
    imageTag: OFFLINE_PYTHON_STRUCTURED_EXECUTION_IMAGE_TAG,
    imageId: inspect.Id,
    imageIdentityHash,
    pinnedBaseImage: PINNED_BASE_IMAGE,
    baseImageDigest: BASE_IMAGE_DIGEST,
    ...hashes,
    imageUser: '10001:10001',
    imageEntrypoint: ENTRYPOINT,
    imageEnvironmentNames: envNames,
    rootFilesystemLayerDigests: layers,
    labels,
  }
}

function validateConfinement(
  inspect: ContainerInspect,
  image: OfflinePythonStructuredImageEvidence,
): OfflinePythonStructuredConfinementEvidence {
  const host = asRecord(inspect.HostConfig, 'container host configuration')
  const config = asRecord(inspect.Config, 'container configuration')
  const capDrop = stringArray(host.CapDrop, 'dropped capabilities')
  const securityOptions = stringArray(host.SecurityOpt, 'security options')
  const tmpfs = stringRecord(host.Tmpfs, 'tmpfs configuration')
  const mounts = arrayValue(inspect.Mounts, 'container mounts')
  const binds = host.Binds === null || host.Binds === undefined ? [] : arrayValue(host.Binds, 'container binds')
  const entrypoint = stringArray(config.Entrypoint, 'container entrypoint')
  const command = config.Cmd === null || config.Cmd === undefined ? [] : arrayValue(config.Cmd, 'container command')
  const envNames = environmentNames(stringArray(config.Env, 'container environment'))
  const tmpfsTokens = new Set(String(tmpfs['/tmp'] ?? '').split(','))
  if (
    inspect.Image !== image.imageId ||
    host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true || host.Privileged !== false ||
    capDrop.length !== 1 || capDrop[0] !== 'ALL' ||
    (!securityOptions.includes('no-new-privileges') &&
      !securityOptions.includes('no-new-privileges:true')) ||
    Number(host.PidsLimit) !== 64 || Number(host.Memory) !== 805_306_368 ||
    Number(host.MemorySwap) !== 805_306_368 || Number(host.NanoCpus) !== 1_000_000_000 ||
    config.User !== '10001:10001' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    command.length !== 0 || binds.length !== 0 || mounts.length !== 0 ||
    !tmpfsTokens.has('rw') || !tmpfsTokens.has('noexec') || !tmpfsTokens.has('nosuid') ||
    !tmpfsTokens.has('nodev') || !tmpfsTokens.has('size=67108864') ||
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) ||
    secretLikeEnvironmentNames(envNames).length > 0
  ) {
    throw runtimeFailure('Structured Python container confinement is invalid.')
  }
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true,
    noNewPrivileges: true, privileged: false, pidsLimit: 64,
    memoryLimitBytes: 805_306_368, memoryAndSwapLimitBytes: 805_306_368,
    nanoCpus: 1_000_000_000, tmpfsPath: '/tmp', tmpfsSizeBytes: 67_108_864,
    tmpfsNoExec: true, tmpfsNoSuid: true, tmpfsNoDevice: true,
    user: '10001:10001', entrypoint: ENTRYPOINT,
    callerCommandPresent: false, callerBindsPresent: false, callerMountsPresent: false,
    callerEnvironmentPresent: false, secretLikeImageEnvironmentNames: [],
  }
}

async function inspectContainer(containerId: string): Promise<ContainerInspect> {
  const result = await runDocker(['inspect', containerId], {
    timeoutMs: RUN_TIMEOUT_MS,
    maximumOutputBytes: 8 * 1024 * 1024,
  })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Structured Python container inspect failed.')
  const parsed = parseJson(result.stdout, 'container inspect')
  if (!Array.isArray(parsed) || parsed.length !== 1) throw runtimeFailure('Structured Python container inspect is invalid.')
  return parsed[0] as ContainerInspect
}

async function sourceHashes(directory: string) {
  return {
    requirementsLockSha256: await sha256File(join(directory, 'requirements.lock.txt')),
    sceneDetectLockSha256: await sha256File(join(directory, 'requirements.scenedetect.lock.txt')),
    runnerSha256: await sha256File(join(directory, 'runner.py')),
    dockerfileSha256: await sha256File(join(directory, 'Dockerfile')),
  }
}

async function assertPinnedDockerfile(path: string): Promise<void> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    const text = await handle.readFile('utf8')
    if (
      !stat.isFile() || stat.size > 64 * 1024 ||
      !text.includes(`FROM ${PINNED_BASE_IMAGE} AS dependencies`) ||
      !text.includes(`FROM ${PINNED_BASE_IMAGE} AS runtime`) ||
      !text.includes('--require-hashes') ||
      !text.includes('USER 10001:10001') ||
      !text.includes('ENTRYPOINT ["python", "-s", "/app/runner.py"]')
    ) {
      throw runtimeFailure('Structured Python Dockerfile pinning policy failed.')
    }
  } finally {
    await handle.close()
  }
}

async function copyCleanTree(source: string, target: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw runtimeFailure('Python runner build input cannot contain symbolic links.')
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    const entries = await readdir(source, { withFileTypes: true })
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
      await copyCleanTree(join(source, entry.name), join(target, entry.name))
    }
    return
  }
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw runtimeFailure('Python runner build input is not a bounded file.')
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await copyFile(source, target, constants.COPYFILE_EXCL)
}

async function sha256File(path: string): Promise<string> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size <= 0 || stat.size > 4 * 1024 * 1024) throw runtimeFailure('Runner source hash target is invalid.')
    return createHash('sha256').update(await handle.readFile()).digest('hex')
  } finally {
    await handle.close()
  }
}

function repositoryRootPath(): string {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
  if (!root.endsWith(`${sep}REeditpro`) && !root.endsWith(`${sep}reeditpro`)) {
    throw runtimeFailure('Structured Python repository root could not be resolved.')
  }
  return root
}

async function runDocker(
  args: string[],
  options: { cwd?: string; input?: string; timeoutMs: number; maximumOutputBytes: number },
): Promise<HostResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('docker', args, {
      cwd: options.cwd,
      env: { PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let byteLength = 0
    let settled = false
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      if (!settled) {
        settled = true
        reject(runtimeFailure('Docker command exceeded its fixed timeout.'))
      }
    }, options.timeoutMs)
    const collect = (target: Buffer[]) => (chunk: Buffer) => {
      byteLength += chunk.byteLength
      if (byteLength > options.maximumOutputBytes) {
        child.kill('SIGKILL')
        if (!settled) {
          settled = true
          clearTimeout(timer)
          reject(runtimeFailure('Docker command exceeded its output ceiling.'))
        }
        return
      }
      target.push(Buffer.from(chunk))
    }
    child.stdout.on('data', collect(stdout))
    child.stderr.on('data', collect(stderr))
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new ApiError('TOOL_NOT_READY', 'Docker runtime is unavailable.', 503, undefined, { cause: error }))
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolvePromise({
        exitCode: code ?? -1,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
      })
    })
    child.stdin.end(options.input ?? '')
  })
}

function parseJson(value: string, label: string): unknown {
  try { return JSON.parse(value) } catch { throw runtimeFailure(`${label} is not valid JSON.`) }
}
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw runtimeFailure(`${label} is not an object.`)
  return value as Record<string, unknown>
}
function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw runtimeFailure(`${label} is not an array.`)
  return value
}
function stringArray(value: unknown, label: string): string[] {
  const entries = arrayValue(value, label)
  if (entries.some((entry) => typeof entry !== 'string')) throw runtimeFailure(`${label} contains non-string values.`)
  return entries as string[]
}
function stringRecord(value: unknown, label: string): Record<string, string> {
  const record = asRecord(value, label)
  if (Object.values(record).some((entry) => typeof entry !== 'string')) throw runtimeFailure(`${label} contains non-string values.`)
  return record as Record<string, string>
}
function environmentNames(entries: string[]): string[] {
  return entries.map((entry) => entry.split('=', 1)[0] ?? '').sort()
}
function secretLikeEnvironmentNames(names: string[]): string[] {
  return names.filter((name) =>
    name !== 'GPG_KEY' &&
    /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name))
}
function stripSha(value: string): string { return value.startsWith('sha256:') ? value.slice(7) : value }
function boundedDockerDiagnostic(result: HostResult): string {
  const diagnostic = `${result.stderr}\n${result.stdout}`.trim()
  return diagnostic.slice(-4_000) || `Docker exited with code ${result.exitCode}.`
}
function runtimeFailure(message: string, cause?: unknown): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause })
}
function validationFailure(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
