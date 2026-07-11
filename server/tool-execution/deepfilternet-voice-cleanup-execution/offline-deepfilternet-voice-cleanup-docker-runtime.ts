import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, open, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type { OfflineDeepFilterNetVoiceCleanupConfinementEvidence, OfflineDeepFilterNetVoiceCleanupImageEvidence } from './offline-deepfilternet-voice-cleanup-types'

export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_IMAGE_TAG = 'reeditpro-offline-deepfilternet-voice-cleanup-execution:private-local-v1' as const
const BASE_DIGEST = 'sha256:f5cf0344c9886ff24d34797578d5d7dd6e8911ae0fe5962bb55d0f89603ec361' as const
const PINNED_BASE = `python:3.11.15-slim-bookworm@${BASE_DIGEST}` as const
const ENTRYPOINT = ['python', '-s', '/app/runner.py'] as const
const SOURCE_FILES = ['Dockerfile', 'requirements.lock.txt', 'runner.py'] as const
const BUILD_CONTEXT = '/tmp/reeditpro-offline-deepfilternet-voice-cleanup-build-context-v1'
const COMMAND_TIMEOUT_MS = 5 * 60_000

interface HostResult { exitCode: number; stdout: string; stderr: string }
interface Inspect { Image?: unknown; State?: unknown; HostConfig?: unknown; Mounts?: unknown; Config?: unknown; RootFS?: unknown; Id?: unknown; Os?: unknown; Architecture?: unknown }

export async function prepareOfflineDeepFilterNetVoiceCleanupDockerRuntime(): Promise<OfflineDeepFilterNetVoiceCleanupImageEvidence> {
  const source = sourceDirectory()
  await assertPinnedDockerfile(join(source, 'Dockerfile'))
  await assertPinnedRequirements(join(source, 'requirements.lock.txt'))
  await rm(BUILD_CONTEXT, { recursive: true, force: true })
  try {
    await copyCleanTree(source, join(BUILD_CONTEXT, 'docker/prod/offline-deepfilternet-voice-cleanup-execution'))
    const built = await runDocker(['build', '--pull=false', '--progress=plain', '--tag', OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_IMAGE_TAG, '--file', 'docker/prod/offline-deepfilternet-voice-cleanup-execution/Dockerfile', '.'], { cwd: BUILD_CONTEXT, timeoutMs: 30 * 60_000, maxBytes: 64 * 1024 * 1024 })
    if (built.exitCode !== 0) throw failure('Private DeepFilterNet voice-cleanup image build failed.', new Error(bounded(built)))
    return inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime()
  } finally {
    await rm(BUILD_CONTEXT, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflineDeepFilterNetVoiceCleanupDockerRuntime(): Promise<OfflineDeepFilterNetVoiceCleanupImageEvidence> {
  const hashes = await sourceHashes()
  const result = await runDocker(['image', 'inspect', OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_IMAGE_TAG], { timeoutMs: COMMAND_TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw failure('Private DeepFilterNet voice-cleanup image is unavailable.')
  const parsed = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw failure('Private DeepFilterNet voice-cleanup image identity is invalid.')
  const inspect = record(parsed[0])
  const config = record(inspect.Config)
  const root = record(inspect.RootFS)
  const labels = stringRecord(config.Labels)
  const entrypoint = stringArray(config.Entrypoint)
  const envNames = environmentNames(stringArray(config.Env))
  const layers = stringArray(root.Layers)
  if (
    inspect.Os !== 'linux' || inspect.Architecture !== 'arm64' || typeof inspect.Id !== 'string' ||
    config.User !== '10001:10001' || config.WorkingDir !== '/app' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_DIGEST ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-deepfilternet-voice-cleanup-execution-container-v1' ||
    labels['com.reeditpro.debian.snapshot'] !== '20260623T000000Z' ||
    labels['com.reeditpro.deepfilternet.version'] !== '0.5.6' ||
    labels['com.reeditpro.deepfilterlib.version'] !== '0.5.6' ||
    labels['com.reeditpro.torch.version'] !== '2.2.2' ||
    labels['com.reeditpro.torchaudio.version'] !== '2.2.2' ||
    labels['com.reeditpro.model.id'] !== 'DeepFilterNet3' ||
    labels['com.reeditpro.model.archive.sha256'] !== '49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2' ||
    labels['com.reeditpro.model.checkpoint.sha256'] !== '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003' ||
    labels['com.reeditpro.model.config.sha256'] !== '415eb925d44990d938fb739f514aa3662c1ec0ea836cff044fa1291b82cb4290' ||
    labels['com.reeditpro.fixture.sha256'] !== 'db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec' ||
    labels['com.reeditpro.model.upstream.license'] !== 'MIT_private_test_only_production_review_required' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' ||
    labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    labels['com.reeditpro.runner.external-beta-ready'] !== 'false' ||
    labels['com.reeditpro.runner.production-ready'] !== 'false' ||
    secretLikeEnvironmentNames(envNames).length || layers.length < 2
  ) throw failure('Private DeepFilterNet voice-cleanup image identity is invalid.')
  return {
    imageTag: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_IMAGE_TAG,
    imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({ imageId: inspect.Id, architecture: inspect.Architecture, entrypoint, envNames, layers, labels, hashes }),
    pinnedBaseImage: PINNED_BASE,
    debianSnapshot: '20260623T000000Z',
    sourceHashes: hashes,
    imageUser: '10001:10001',
    imageEntrypoint: ENTRYPOINT,
    imageEnvironmentNames: envNames,
    rootFilesystemLayerDigests: layers,
    labels,
  }
}

export async function runOfflineDeepFilterNetVoiceCleanupContainer(input: { image: OfflineDeepFilterNetVoiceCleanupImageEvidence; serializedRequest: string }) {
  if (Buffer.byteLength(input.serializedRequest) > 64 * 1024) throw invalid('DeepFilterNet voice-cleanup request exceeds stdin ceiling.')
  const created = await runDocker([
    'create', '--interactive', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true', '--pids-limit', '128', '--memory', '4g', '--memory-swap', '4g',
    '--cpus', '4', '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=536870912', '--user', '10001:10001', input.image.imageId,
  ], { timeoutMs: COMMAND_TIMEOUT_MS, maxBytes: 64 * 1024 })
  if (created.exitCode !== 0 || created.stderr.trim()) throw failure('Confined DeepFilterNet voice-cleanup container could not be created.')
  const id = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/.test(id)) throw failure('Docker returned an invalid DeepFilterNet container identity.')
  try {
    const confinement = validateConfinement(await inspectContainer(id), input.image)
    const started = await runDocker(['start', '--attach', '--interactive', id], { input: `${input.serializedRequest}\n`, timeoutMs: COMMAND_TIMEOUT_MS, maxBytes: 16 * 1024 * 1024 })
    const after = await inspectContainer(id)
    const state = record(after.State)
    if (state.Status !== 'exited' || state.Running !== false || state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean') throw failure('DeepFilterNet container exit state is inconsistent.')
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally {
    await runDocker(['rm', '--force', id], { timeoutMs: COMMAND_TIMEOUT_MS, maxBytes: 64 * 1024 }).catch(() => undefined)
  }
}

function validateConfinement(inspect: Inspect, image: OfflineDeepFilterNetVoiceCleanupImageEvidence): OfflineDeepFilterNetVoiceCleanupConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop)
  const security = stringArray(host.SecurityOpt)
  const tmpfs = stringRecord(host.Tmpfs)
  const tokens = new Set(String(tmpfs['/tmp'] ?? '').split(','))
  const mounts = array(inspect.Mounts)
  const binds = host.Binds == null ? [] : array(host.Binds)
  const command = config.Cmd == null ? [] : array(config.Cmd)
  const envNames = environmentNames(stringArray(config.Env))
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true || host.Privileged !== false ||
    caps.length !== 1 || caps[0] !== 'ALL' || !security.some((value) => value.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 128 || Number(host.Memory) !== 4294967296 || Number(host.MemorySwap) !== 4294967296 || Number(host.NanoCpus) !== 4000000000 ||
    config.User !== '10001:10001' || command.length || mounts.length || binds.length ||
    !tokens.has('rw') || !tokens.has('noexec') || !tokens.has('nosuid') || !tokens.has('nodev') || !tokens.has('size=536870912') ||
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) || secretLikeEnvironmentNames(envNames).length
  ) throw failure('DeepFilterNet container confinement is invalid.')
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true, noNewPrivileges: true, privileged: false,
    pidsLimit: 128, memoryLimitBytes: 4294967296, memoryAndSwapLimitBytes: 4294967296, nanoCpus: 4000000000,
    tmpfsPath: '/tmp', tmpfsSizeBytes: 536870912, tmpfsNoExec: true, tmpfsNoSuid: true, tmpfsNoDevice: true,
    user: '10001:10001', callerCommandPresent: false, callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false,
    secretLikeImageEnvironmentNames: [],
  }
}

async function inspectContainer(id: string): Promise<Inspect> {
  const result = await runDocker(['inspect', id], { timeoutMs: COMMAND_TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw failure('DeepFilterNet container inspect failed.')
  const value = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(value) || value.length !== 1) throw failure('DeepFilterNet container inspect is invalid.')
  return value[0] as Inspect
}

async function sourceHashes(): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const name of SOURCE_FILES) result[name] = await sha256File(join(sourceDirectory(), name))
  return result
}

async function assertPinnedDockerfile(path: string) {
  const value = await readBoundedFile(path, 128 * 1024)
  if (
    !value.includes(`FROM ${PINNED_BASE} AS build`) || !value.includes(`FROM ${PINNED_BASE} AS runtime`) ||
    !value.includes('20260623T000000Z') ||
    !value.includes('DEEPFILTERNET_MODEL_ARCHIVE_SHA256=49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2') ||
    !value.includes('23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003') ||
    !value.includes('db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec') ||
    !value.includes('USER 10001:10001') || !value.includes('ENTRYPOINT ["python", "-s", "/app/runner.py"]')
  ) throw failure('DeepFilterNet Dockerfile pinning policy failed.')
}

async function assertPinnedRequirements(path: string) {
  const value = await readBoundedFile(path, 128 * 1024)
  const lines = value.split('\n').filter(Boolean)
  if (
    !value.includes('DeepFilterNet==0.5.6 --hash=sha256:99f5688d954fcfa8f853bf8bb8c3b2a59e4f9dc5d95643c9e6a32053234ba7c6') ||
    !value.includes('DeepFilterLib==0.5.6 --hash=sha256:87b58093ab6e8379306e6ae330374856ee62e1cf7893cfbfb094177db478a850') ||
    !value.includes('torch==2.2.2 --hash=sha256:32827fa1fbe5da8851686256b4cd94cc7b11be962862c2293811c94eea9457bf') ||
    !value.includes('torchaudio==2.2.2 --hash=sha256:0a03a48b6d55d17d48f419a7f1d0d4018d48a04c76585c16a9b5e69281f92f94') ||
    lines.length !== 21 || lines.some((line) => !line.includes('--hash=sha256:'))
  ) throw failure('DeepFilterNet requirements lock pinning policy failed.')
}

async function copyCleanTree(source: string, target: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw failure('DeepFilterNet build input cannot contain symbolic links.')
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.DS_Store' || entry.name.startsWith('._') || entry.name === '__pycache__') continue
      await copyCleanTree(join(source, entry.name), join(target, entry.name))
    }
    return
  }
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024) throw failure('DeepFilterNet build input is not a bounded file.')
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await copyFile(source, target, constants.COPYFILE_EXCL)
}

async function sha256File(path: string) { return createHash('sha256').update(await readBoundedBuffer(path, 4 * 1024 * 1024)).digest('hex') }
async function readBoundedFile(path: string, max: number) { return (await readBoundedBuffer(path, max)).toString('utf8') }
async function readBoundedBuffer(path: string, max: number) { const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > max) throw failure('DeepFilterNet source file is invalid.'); return await handle.readFile() } finally { await handle.close() } }
function sourceDirectory() { return join(repositoryRoot(), 'docker/prod/offline-deepfilternet-voice-cleanup-execution') }
function repositoryRoot() { return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '') }
function runDocker(args: string[], options: { cwd?: string; input?: string; timeoutMs: number; maxBytes: number }): Promise<HostResult> { return new Promise((resolvePromise, reject) => { const child = spawn('docker', args, { cwd: options.cwd, env: { PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin' }, stdio: ['pipe', 'pipe', 'pipe'] }); const stdout: Buffer[] = []; const stderr: Buffer[] = []; let total = 0; let settled = false; const timer = setTimeout(() => { child.kill('SIGKILL'); if (!settled) { settled = true; reject(failure('Docker command exceeded timeout.')) } }, options.timeoutMs); const collect = (target: Buffer[]) => (chunk: Buffer) => { total += chunk.length; if (total > options.maxBytes) { child.kill('SIGKILL'); if (!settled) { settled = true; clearTimeout(timer); reject(failure('Docker output exceeded ceiling.')) } } else target.push(Buffer.from(chunk)) }; child.stdout.on('data', collect(stdout)); child.stderr.on('data', collect(stderr)); child.on('error', (cause) => { if (!settled) { settled = true; clearTimeout(timer); reject(failure('Docker runtime is unavailable.', cause)) } }); child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); resolvePromise({ exitCode: code ?? -1, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() }) } }); child.stdin.end(options.input ?? '') }) }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw failure('Docker evidence contains an invalid object.'); return value as Record<string, unknown> }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw failure('Docker evidence contains an invalid array.'); return value }
function stringArray(value: unknown): string[] { const values = array(value); if (values.some((value) => typeof value !== 'string')) throw failure('Docker evidence contains a non-string array.'); return values as string[] }
function stringRecord(value: unknown): Record<string, string> { const valueRecord = record(value); if (Object.values(valueRecord).some((entry) => typeof entry !== 'string')) throw failure('Docker evidence contains a non-string record.'); return valueRecord as Record<string, string> }
function environmentNames(values: string[]) { return values.map((value) => value.split('=', 1)[0] ?? '').sort() }
function secretLikeEnvironmentNames(values: string[]) { const knownNonSecrets = new Set(['GPG_KEY']); return values.filter((name) => !knownNonSecrets.has(name) && /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name)) }
function bounded(result: HostResult) { return `${result.stderr}\n${result.stdout}`.trim().slice(-4_000) }
function failure(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
