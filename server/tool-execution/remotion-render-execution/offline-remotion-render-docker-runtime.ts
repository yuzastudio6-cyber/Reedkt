import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, open, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { createPrivateDockerCliInvocation } from '../private-docker-cli'
import { OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES } from './offline-remotion-render-execution-protocol'
import type { OfflineRemotionConfinementEvidence, OfflineRemotionImageEvidence } from './offline-remotion-render-execution-types'
import {
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES,
  OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
} from './offline-remotion-render-streaming-protocol'
import {
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE,
} from './offline-remotion-delivery-h264-chunk-protocol'

export const OFFLINE_REMOTION_IMAGE_TAG = 'reeditpro-offline-remotion-render-execution:canonical-private-local-v1' as const
const BASE_DIGEST = 'sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf' as const
const PINNED_BASE = `node:22-bookworm-slim@${BASE_DIGEST}` as const
const ENTRYPOINT = ['node', '/app/runner.mjs'] as const
const SOURCE_FILES = ['Dockerfile', 'package.json', 'package-lock.json', 'entry.tsx', 'composition.tsx', 'build-bundle.mjs', 'ensure-browser.mjs', 'runner.mjs'] as const
const BUILD_CONTEXT = '/tmp/reeditpro-canonical-private-offline-remotion-build-context-v1'
const TIMEOUT_MS = 15 * 60_000

export const OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE =
  'standard_remotion_cpu_2vcpu_4gib_v1' as const
export type OfflineRemotionContainerResourceProfileId =
  | typeof OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE
  | typeof OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE

const RESOURCE_PROFILES = {
  [OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE]: {
    memoryArgument: '4g',
    memoryLimitBytes: 4_294_967_296 as const,
    cpuArgument: '2',
    nanoCpus: 2_000_000_000 as const,
    tmpfsSizeBytes: 1_073_741_824 as const,
    shmSizeBytes: 536_870_912 as const,
    timeoutMs: TIMEOUT_MS,
    maximumOutputBytes: OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES,
  },
  [OFFLINE_REMOTION_DELIVERY_H264_CHUNK_RESOURCE_PROFILE]: {
    memoryArgument: '8g',
    memoryLimitBytes: 8_589_934_592 as const,
    cpuArgument: '4',
    nanoCpus: 4_000_000_000 as const,
    tmpfsSizeBytes: 7_516_192_768 as const,
    shmSizeBytes: 1_073_741_824 as const,
    timeoutMs: 6 * 60 * 60_000,
    maximumOutputBytes:
      OFFLINE_REMOTION_DELIVERY_H264_CHUNK_MAXIMUM_OUTPUT_BYTES,
  },
} as const

interface HostResult { exitCode: number; stdout: string; stderr: string }
interface Inspect { Image?: unknown; State?: unknown; HostConfig?: unknown; Mounts?: unknown; Config?: unknown; RootFS?: unknown; Id?: unknown; Os?: unknown; Architecture?: unknown }

export interface OfflineRemotionContainerStreamingInput {
  inputId: string
  mimeType: 'video/mp4' | 'video/x-matroska' | 'image/png' | 'audio/wav'
  byteLength: number
  sha256: string
  openStream(): Promise<Readable>
}

export interface OfflineRemotionContainerStreamingOutputSink {
  maximumBytes: number
  persist(input: {
    stream: Readable
    mimeType: 'video/mp4'
    expectedByteLength: number
    expectedSha256: string
  }): Promise<{ byteLength: number; sha256: string }>
}

export async function prepareOfflineRemotionDockerRuntime(): Promise<OfflineRemotionImageEvidence> {
  const source = sourceDirectory()
  await assertPinnedDockerfile(join(source, 'Dockerfile'))
  const sourceTreeSha256 = sha256AuthorityValue(await sourceHashes())
  await rm(BUILD_CONTEXT, { recursive: true, force: true })
  try {
    await copyCleanTree(source, join(BUILD_CONTEXT, 'docker/prod/offline-remotion-render-execution'))
    const built = await runDocker([
      'build', '--pull=false', '--progress=plain',
      '--build-arg', `REEDITPRO_SOURCE_TREE_SHA256=${sourceTreeSha256}`,
      '--tag', OFFLINE_REMOTION_IMAGE_TAG,
      '--file', 'docker/prod/offline-remotion-render-execution/Dockerfile', '.',
    ], { cwd: BUILD_CONTEXT, timeoutMs: 20 * 60_000, maxBytes: 32 * 1024 * 1024 })
    if (built.exitCode !== 0) throw runtimeFailure('Private Remotion image build failed.', new Error(bounded(built)))
    return inspectExistingOfflineRemotionDockerRuntime()
  } finally {
    await rm(BUILD_CONTEXT, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflineRemotionDockerRuntime(): Promise<OfflineRemotionImageEvidence> {
  const hashes = await sourceHashes()
  const sourceTreeSha256 = sha256AuthorityValue(hashes)
  const result = await runDocker(['image', 'inspect', OFFLINE_REMOTION_IMAGE_TAG], { timeoutMs: TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Private Remotion image is unavailable.')
  const parsed = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw runtimeFailure('Private Remotion image identity is invalid.')
  const inspect = record(parsed[0]); const config = record(inspect.Config); const root = record(inspect.RootFS)
  const labels = stringRecord(config.Labels); const entrypoint = stringArray(config.Entrypoint)
  const envNames = environmentNames(stringArray(config.Env)); const layers = stringArray(root.Layers)
  if (
    inspect.Os !== 'linux' || typeof inspect.Architecture !== 'string' || typeof inspect.Id !== 'string' ||
    config.User !== '10001:10001' || config.WorkingDir !== '/app' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_DIGEST ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-remotion-render-execution-container-v1' ||
    labels['com.reeditpro.runner.source-tree.sha256'] !== sourceTreeSha256 ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' ||
    labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    secretLikeEnvironmentNames(envNames).length > 0 || layers.length < 2
  ) throw runtimeFailure('Private Remotion image identity is invalid.')
  return {
    imageTag: OFFLINE_REMOTION_IMAGE_TAG, imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({ imageId: inspect.Id, architecture: inspect.Architecture, entrypoint, envNames, layers, labels, hashes }),
    pinnedBaseImage: PINNED_BASE, sourceHashes: hashes, sourceTreeSha256, imageUser: '10001:10001',
    imageEntrypoint: ENTRYPOINT, imageEnvironmentNames: envNames, rootFilesystemLayerDigests: layers, labels,
  }
}

export async function runOfflineRemotionContainer(input: { image: OfflineRemotionImageEvidence; serializedRequest: string }) {
  if (Buffer.byteLength(input.serializedRequest) > OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES) {
    throw validationFailure('Remotion request exceeds stdin ceiling.')
  }
  const id = await createRemotionContainer(
    input.image,
    OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE,
  )
  try {
    const confinement = validateConfinement(
      await inspectContainer(id),
      input.image,
      OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE,
    )
    const started = await runDocker(['start', '--attach', '--interactive', id], { input: `${input.serializedRequest}\n`, timeoutMs: TIMEOUT_MS, maxBytes: 24 * 1024 * 1024 })
    const after = await inspectContainer(id); const state = record(after.State)
    if (state.Status !== 'exited' || state.Running !== false || state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean') {
      throw runtimeFailure('Remotion container exit state is inconsistent.')
    }
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally {
    await runDocker(['rm', '--force', id], { timeoutMs: TIMEOUT_MS, maxBytes: 64 * 1024 }).catch(() => undefined)
  }
}

export async function runOfflineRemotionStreamingContainer(input: {
  image: OfflineRemotionImageEvidence
  serializedManifest: string
  inputs: OfflineRemotionContainerStreamingInput[]
  outputSink: OfflineRemotionContainerStreamingOutputSink
  resourceProfileId?: OfflineRemotionContainerResourceProfileId
}) {
  const resourceProfileId = input.resourceProfileId ??
    OFFLINE_REMOTION_STANDARD_RESOURCE_PROFILE
  const resourceProfile = RESOURCE_PROFILES[resourceProfileId]
  const manifestBytes = Buffer.byteLength(input.serializedManifest)
  if (
    manifestBytes < 1 ||
    manifestBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES ||
    !Number.isSafeInteger(input.outputSink.maximumBytes) ||
    input.outputSink.maximumBytes < 1_024 ||
    input.outputSink.maximumBytes > resourceProfile.maximumOutputBytes
  ) throw validationFailure('Streaming Remotion transport bounds are invalid.')
  const id = await createRemotionContainer(input.image, resourceProfileId)
  try {
    const confinement = validateConfinement(
      await inspectContainer(id),
      input.image,
      resourceProfileId,
    )
    const started = await runStreamingDockerStart({
      id,
      serializedManifest: input.serializedManifest,
      inputs: input.inputs,
      outputSink: input.outputSink,
      timeoutMs: resourceProfile.timeoutMs,
    })
    const after = await inspectContainer(id)
    const state = record(after.State)
    if (
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean'
    ) throw runtimeFailure('Streaming Remotion container exit state is inconsistent.')
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally {
    await runDocker(['rm', '--force', id], {
      timeoutMs: TIMEOUT_MS,
      maxBytes: 64 * 1024,
    }).catch(() => undefined)
  }
}

async function createRemotionContainer(
  image: OfflineRemotionImageEvidence,
  resourceProfileId: OfflineRemotionContainerResourceProfileId,
): Promise<string> {
  const profile = RESOURCE_PROFILES[resourceProfileId]
  const created = await runDocker([
    'create', '--interactive', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true', '--pids-limit', '256',
    '--memory', profile.memoryArgument,
    '--memory-swap', profile.memoryArgument,
    '--cpus', profile.cpuArgument,
    '--tmpfs',
    `/tmp:rw,noexec,nosuid,nodev,size=${profile.tmpfsSizeBytes}`,
    '--shm-size', String(profile.shmSizeBytes),
    '--user', '10001:10001', image.imageId,
  ], { timeoutMs: profile.timeoutMs, maxBytes: 64 * 1024 })
  if (created.exitCode !== 0 || created.stderr.trim()) {
    throw runtimeFailure('Confined Remotion container could not be created.')
  }
  const id = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/u.test(id)) {
    throw runtimeFailure('Docker returned an invalid Remotion container identity.')
  }
  return id
}

async function runStreamingDockerStart(input: {
  id: string
  serializedManifest: string
  inputs: OfflineRemotionContainerStreamingInput[]
  outputSink: OfflineRemotionContainerStreamingOutputSink
  timeoutMs: number
}): Promise<{
  exitCode: number
  stdoutHeader: string
  stderr: string
  outputReceipt: { byteLength: number; sha256: string }
}> {
  const invocation = createPrivateDockerCliInvocation(['start', '--attach', '--interactive', input.id])
  const child = spawn(invocation.executable, invocation.args, {
    env: invocation.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const stderr: Buffer[] = []
  let stderrBytes = 0
  let settled = false
  const closePromise = new Promise<number>((resolvePromise, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      if (!settled) {
        settled = true
        reject(runtimeFailure('Streaming Remotion command exceeded timeout.'))
      }
    }, input.timeoutMs)
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
      else stderr.push(Buffer.from(chunk))
    })
    child.once('error', (cause) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(runtimeFailure('Streaming Docker runtime is unavailable.', cause))
      }
    })
    child.once('close', (code) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        if (stderrBytes > 512 * 1024) {
          reject(runtimeFailure('Streaming Remotion stderr exceeded its fixed ceiling.'))
        } else resolvePromise(code ?? -1)
      }
    })
  })
  try {
    const [output, exitCode] = await Promise.all([
      receiveStreamingOutput(child.stdout, input.outputSink),
      Promise.all([
        writeStreamingInputs(child.stdin, input.serializedManifest, input.inputs),
        closePromise,
      ]).then(([, code]) => code),
    ])
    return {
      exitCode,
      stdoutHeader: output.stdoutHeader,
      stderr: Buffer.concat(stderr).toString('utf8'),
      outputReceipt: output.outputReceipt,
    }
  } catch (error) {
    child.stdin.destroy()
    child.stdout.destroy()
    child.kill('SIGKILL')
    await closePromise.catch(() => undefined)
    throw error
  }
}

async function writeStreamingInputs(
  stdin: NodeJS.WritableStream,
  serializedManifest: string,
  inputs: OfflineRemotionContainerStreamingInput[],
): Promise<void> {
  await writeChunk(stdin, Buffer.from(`${serializedManifest}\n`, 'utf8'))
  for (const input of inputs) {
    const checksum = createHash('sha256')
    let observedBytes = 0
    let stream: Readable | undefined
    try {
      stream = await input.openStream()
      if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
        throw new Error('Server-injected Remotion input is not readable.')
      }
      for await (const chunk of stream) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        observedBytes += bytes.byteLength
        if (observedBytes > input.byteLength) {
          throw new Error('Server-injected Remotion input exceeded its byte commitment.')
        }
        checksum.update(bytes)
        await writeChunk(stdin, bytes)
      }
      if (observedBytes !== input.byteLength || checksum.digest('hex') !== input.sha256) {
        throw new Error('Server-injected Remotion input failed exact host verification.')
      }
    } catch (error) {
      stream?.destroy()
      throw error
    }
  }
  await new Promise<void>((resolvePromise, reject) => {
    const onError = (error: Error) => reject(error)
    stdin.once('error', onError)
    stdin.end(() => {
      stdin.removeListener('error', onError)
      resolvePromise()
    })
  })
}

async function writeChunk(stream: NodeJS.WritableStream, bytes: Buffer): Promise<void> {
  if (bytes.byteLength === 0) return
  if (!stream.write(bytes)) await once(stream, 'drain')
}

async function receiveStreamingOutput(
  stdout: Readable,
  outputSink: OfflineRemotionContainerStreamingOutputSink,
): Promise<{
  stdoutHeader: string
  outputReceipt: { byteLength: number; sha256: string }
}> {
  const { line, remainder, iterator } = await readOutputHeader(stdout)
  let response: Record<string, unknown>
  try { response = record(JSON.parse(line.toString('utf8'))) } catch {
    throw runtimeFailure('Streaming Remotion response header is invalid JSON.')
  }
  const artifact = record(response.artifact)
  const expectedByteLength = Number(artifact.byteLength)
  const expectedSha256 = artifact.sha256
  if (
    response.ok !== true || artifact.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(expectedByteLength) || expectedByteLength < 1_024 ||
    expectedByteLength > outputSink.maximumBytes ||
    typeof expectedSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(expectedSha256)
  ) throw runtimeFailure('Streaming Remotion response commitment is invalid.')
  let observedBytes = 0
  const checksum = createHash('sha256')
  let bodyCompleted = false
  const body = Readable.from((async function* () {
    const emit = (bytes: Buffer) => {
      observedBytes += bytes.byteLength
      if (observedBytes > expectedByteLength) {
        throw runtimeFailure('Streaming Remotion output exceeded its exact byte commitment.')
      }
      checksum.update(bytes)
      return bytes
    }
    if (remainder.byteLength) yield emit(remainder)
    while (true) {
      const next = await iterator.next()
      if (next.done) break
      const bytes = Buffer.isBuffer(next.value)
        ? next.value
        : Buffer.from(next.value as Uint8Array)
      if (bytes.byteLength) yield emit(bytes)
    }
    if (observedBytes !== expectedByteLength || checksum.digest('hex') !== expectedSha256) {
      throw runtimeFailure('Streaming Remotion output failed exact size and checksum verification.')
    }
    bodyCompleted = true
  })())
  const outputReceipt = await outputSink.persist({
    stream: body,
    mimeType: 'video/mp4',
    expectedByteLength,
    expectedSha256,
  })
  if (
    !bodyCompleted || outputReceipt.byteLength !== expectedByteLength ||
    outputReceipt.sha256 !== expectedSha256
  ) throw runtimeFailure('Streaming Remotion output sink changed the artifact commitment.')
  return { stdoutHeader: line.toString('utf8'), outputReceipt }
}

async function readOutputHeader(stdout: Readable): Promise<{
  line: Buffer
  remainder: Buffer
  iterator: AsyncIterator<Buffer | Uint8Array>
}> {
  const iterator = stdout[Symbol.asyncIterator]() as AsyncIterator<Buffer | Uint8Array>
  let buffer = Buffer.alloc(0)
  while (true) {
    const newline = buffer.indexOf(10)
    if (newline >= 0) {
      if (newline > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES) {
        throw runtimeFailure('Streaming Remotion response header exceeded its ceiling.')
      }
      return {
        line: buffer.subarray(0, newline),
        remainder: buffer.subarray(newline + 1),
        iterator,
      }
    }
    if (buffer.byteLength > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES) {
      throw runtimeFailure('Streaming Remotion response header exceeded its ceiling.')
    }
    const next = await iterator.next()
    if (next.done) throw runtimeFailure('Streaming Remotion response header is incomplete.')
    const bytes = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value as Uint8Array)
    buffer = buffer.byteLength ? Buffer.concat([buffer, bytes]) : Buffer.from(bytes)
  }
}

function validateConfinement(
  inspect: Inspect,
  image: OfflineRemotionImageEvidence,
  resourceProfileId: OfflineRemotionContainerResourceProfileId,
): OfflineRemotionConfinementEvidence {
  const profile = RESOURCE_PROFILES[resourceProfileId]
  const host = record(inspect.HostConfig); const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop); const security = stringArray(host.SecurityOpt); const tmpfs = stringRecord(host.Tmpfs)
  const tokens = new Set(String(tmpfs['/tmp'] ?? '').split(',')); const mounts = array(inspect.Mounts); const binds = host.Binds == null ? [] : array(host.Binds)
  const command = config.Cmd == null ? [] : array(config.Cmd); const envNames = environmentNames(stringArray(config.Env))
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true || host.Privileged !== false ||
    caps.length !== 1 || caps[0] !== 'ALL' || !security.some((v) => v.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 256 ||
    Number(host.Memory) !== profile.memoryLimitBytes ||
    Number(host.MemorySwap) !== profile.memoryLimitBytes ||
    Number(host.NanoCpus) !== profile.nanoCpus ||
    Number(host.ShmSize) !== profile.shmSizeBytes ||
    config.User !== '10001:10001' || command.length || mounts.length || binds.length ||
    !tokens.has('rw') || !tokens.has('noexec') || !tokens.has('nosuid') || !tokens.has('nodev') ||
    !tokens.has(`size=${profile.tmpfsSizeBytes}`) ||
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) || secretLikeEnvironmentNames(envNames).length
  ) throw runtimeFailure('Remotion container confinement is invalid.')
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true,
    noNewPrivileges: true, privileged: false, pidsLimit: 256,
    memoryLimitBytes: profile.memoryLimitBytes,
    memoryAndSwapLimitBytes: profile.memoryLimitBytes,
    nanoCpus: profile.nanoCpus, tmpfsPath: '/tmp',
    tmpfsSizeBytes: profile.tmpfsSizeBytes, tmpfsNoExec: true,
    tmpfsNoSuid: true, tmpfsNoDevice: true,
    shmSizeBytes: profile.shmSizeBytes, user: '10001:10001',
    callerCommandPresent: false, callerBindsPresent: false,
    callerMountsPresent: false, callerEnvironmentPresent: false,
    secretLikeImageEnvironmentNames: [],
  }
}

async function inspectContainer(id: string): Promise<Inspect> {
  const result = await runDocker(['inspect', id], { timeoutMs: TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Remotion container inspect failed.')
  const value = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(value) || value.length !== 1) throw runtimeFailure('Remotion container inspect is invalid.')
  return value[0] as Inspect
}
async function sourceHashes(): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const name of SOURCE_FILES) result[name] = await sha256File(join(sourceDirectory(), name))
  return result
}
async function assertPinnedDockerfile(path: string) {
  const text = await readBoundedFile(path, 64 * 1024)
  if (
    !text.includes(`FROM ${PINNED_BASE} AS build`) ||
    !text.includes(`FROM ${PINNED_BASE} AS runtime`) ||
    !text.includes('ARG REEDITPRO_SOURCE_TREE_SHA256') ||
    !text.includes('com.reeditpro.runner.source-tree.sha256="${REEDITPRO_SOURCE_TREE_SHA256}"') ||
    !text.includes('npm ci --no-audit --no-fund') ||
    !text.includes('USER 10001:10001') ||
    !text.includes('ENTRYPOINT ["node", "/app/runner.mjs"]')
  ) throw runtimeFailure('Remotion Dockerfile pinning policy failed.')
}
async function copyCleanTree(source: string, target: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw runtimeFailure('Remotion build input cannot contain symbolic links.')
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === 'node_modules' || entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
      await copyCleanTree(join(source, entry.name), join(target, entry.name))
    }
    return
  }
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024) throw runtimeFailure('Remotion build input is not a bounded file.')
  await mkdir(dirname(target), { recursive: true, mode: 0o700 }); await copyFile(source, target, constants.COPYFILE_EXCL)
}
async function sha256File(path: string) { return createHash('sha256').update(await readBoundedBuffer(path, 4 * 1024 * 1024)).digest('hex') }
async function readBoundedFile(path: string, max: number) { return (await readBoundedBuffer(path, max)).toString('utf8') }
async function readBoundedBuffer(path: string, max: number) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > max) throw runtimeFailure('Remotion source file is invalid.'); return await handle.readFile() } finally { await handle.close() }
}
function sourceDirectory() { return join(repositoryRoot(), 'docker/prod/offline-remotion-render-execution') }
function repositoryRoot() { return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '') }
function runDocker(args: string[], options: { cwd?: string; input?: string; timeoutMs: number; maxBytes: number }): Promise<HostResult> {
  return new Promise((resolvePromise, reject) => {
    const invocation = createPrivateDockerCliInvocation(args)
    const child = spawn(invocation.executable, invocation.args, { cwd: options.cwd, env: invocation.env, stdio: ['pipe', 'pipe', 'pipe'] })
    const stdout: Buffer[] = []; const stderr: Buffer[] = []; let total = 0; let settled = false
    const timer = setTimeout(() => { child.kill('SIGKILL'); if (!settled) { settled = true; reject(runtimeFailure('Docker command exceeded timeout.')) } }, options.timeoutMs)
    const collect = (target: Buffer[]) => (chunk: Buffer) => { total += chunk.length; if (total > options.maxBytes) { child.kill('SIGKILL'); if (!settled) { settled = true; clearTimeout(timer); reject(runtimeFailure('Docker output exceeded ceiling.')) } } else target.push(Buffer.from(chunk)) }
    child.stdout.on('data', collect(stdout)); child.stderr.on('data', collect(stderr))
    child.on('error', (cause) => { if (!settled) { settled = true; clearTimeout(timer); reject(runtimeFailure('Docker runtime is unavailable.', cause)) } })
    child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); resolvePromise({ exitCode: code ?? -1, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() }) } })
    child.stdin.end(options.input ?? '')
  })
}
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw runtimeFailure('Docker evidence contains an invalid object.'); return value as Record<string, unknown> }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw runtimeFailure('Docker evidence contains an invalid array.'); return value }
function stringArray(value: unknown): string[] { const values = array(value); if (values.some((v) => typeof v !== 'string')) throw runtimeFailure('Docker evidence contains a non-string array.'); return values as string[] }
function stringRecord(value: unknown): Record<string, string> { const valueRecord = record(value); if (Object.values(valueRecord).some((v) => typeof v !== 'string')) throw runtimeFailure('Docker evidence contains a non-string record.'); return valueRecord as Record<string, string> }
function environmentNames(values: string[]) { return values.map((value) => value.split('=', 1)[0] ?? '').sort() }
function secretLikeEnvironmentNames(values: string[]) { return values.filter((name) => /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name)) }
function bounded(result: HostResult) { return `${result.stderr}\n${result.stdout}`.trim().slice(-4_000) }
function runtimeFailure(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function validationFailure(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
