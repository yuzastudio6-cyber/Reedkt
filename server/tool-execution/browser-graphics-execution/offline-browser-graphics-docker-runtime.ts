import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, open, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type { OfflineBrowserGraphicsConfinementEvidence, OfflineBrowserGraphicsImageEvidence } from './offline-browser-graphics-types'

export const OFFLINE_BROWSER_GRAPHICS_IMAGE_TAG = 'reeditpro-offline-browser-graphics-execution:private-local-v1' as const
const BASE_DIGEST = 'sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf' as const
const PINNED_BASE = `node:22-bookworm-slim@${BASE_DIGEST}` as const
const ENTRYPOINT = ['node', '/app/runner.mjs'] as const
const SOURCE_FILES = ['Dockerfile', 'package.json', 'package-lock.json', 'browser-operations.ts', 'build-bundle.mjs', 'ensure-browser.mjs', 'runner.mjs'] as const
const BUILD_CONTEXT = '/tmp/reeditpro-offline-browser-graphics-build-context-v1'
const TIMEOUT_MS = 120_000

interface HostResult { exitCode: number; stdout: string; stderr: string }
interface Inspect { Image?: unknown; State?: unknown; HostConfig?: unknown; Mounts?: unknown; Config?: unknown; RootFS?: unknown; Id?: unknown; Os?: unknown; Architecture?: unknown }

export async function prepareOfflineBrowserGraphicsDockerRuntime(): Promise<OfflineBrowserGraphicsImageEvidence> {
  const source = sourceDirectory()
  await assertPinnedDockerfile(join(source, 'Dockerfile'))
  await rm(BUILD_CONTEXT, { recursive: true, force: true })
  try {
    await copyCleanTree(source, join(BUILD_CONTEXT, 'docker/prod/offline-browser-graphics-execution'))
    const built = await runDocker(['build', '--pull=false', '--progress=plain', '--tag', OFFLINE_BROWSER_GRAPHICS_IMAGE_TAG, '--file', 'docker/prod/offline-browser-graphics-execution/Dockerfile', '.'], { cwd: BUILD_CONTEXT, timeoutMs: 20 * 60_000, maxBytes: 32 * 1024 * 1024 })
    if (built.exitCode !== 0) throw runtimeFailure('Private browser graphics image build failed.', new Error(bounded(built)))
    return inspectExistingOfflineBrowserGraphicsDockerRuntime()
  } finally {
    await rm(BUILD_CONTEXT, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflineBrowserGraphicsDockerRuntime(): Promise<OfflineBrowserGraphicsImageEvidence> {
  const hashes = await sourceHashes()
  const result = await runDocker(['image', 'inspect', OFFLINE_BROWSER_GRAPHICS_IMAGE_TAG], { timeoutMs: TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Private browser graphics image is unavailable.')
  const parsed = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw runtimeFailure('Private browser graphics image identity is invalid.')
  const inspect = record(parsed[0]); const config = record(inspect.Config); const root = record(inspect.RootFS)
  const labels = stringRecord(config.Labels); const entrypoint = stringArray(config.Entrypoint)
  const envNames = environmentNames(stringArray(config.Env)); const layers = stringArray(root.Layers)
  if (
    inspect.Os !== 'linux' || typeof inspect.Architecture !== 'string' || typeof inspect.Id !== 'string' ||
    config.User !== '10001:10001' || config.WorkingDir !== '/app' || stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_DIGEST || labels['com.reeditpro.runner.protocol'] !== 'offline-browser-graphics-execution-container-v1' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' || labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    labels['com.reeditpro.runner.external-beta-ready'] !== 'false' || labels['com.reeditpro.runner.production-ready'] !== 'false' ||
    secretLikeEnvironmentNames(envNames).length > 0 || layers.length < 2
  ) throw runtimeFailure('Private browser graphics image identity is invalid.')
  return {
    imageTag: OFFLINE_BROWSER_GRAPHICS_IMAGE_TAG, imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({ imageId: inspect.Id, architecture: inspect.Architecture, entrypoint, envNames, layers, labels, hashes }),
    pinnedBaseImage: PINNED_BASE, sourceHashes: hashes, imageUser: '10001:10001', imageEntrypoint: ENTRYPOINT,
    imageEnvironmentNames: envNames, rootFilesystemLayerDigests: layers, labels,
  }
}

export async function runOfflineBrowserGraphicsContainer(input: { image: OfflineBrowserGraphicsImageEvidence; serializedRequest: string }) {
  if (Buffer.byteLength(input.serializedRequest) > 64 * 1024) throw validationFailure('Browser graphics request exceeds stdin ceiling.')
  const created = await runDocker([
    'create', '--interactive', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '256', '--memory', '2g', '--memory-swap', '2g', '--cpus', '2', '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=536870912',
    '--shm-size', '268435456', '--user', '10001:10001', input.image.imageId,
  ], { timeoutMs: TIMEOUT_MS, maxBytes: 64 * 1024 })
  if (created.exitCode !== 0 || created.stderr.trim()) throw runtimeFailure('Confined browser graphics container could not be created.')
  const id = created.stdout.trim()
  if (!/^[a-f0-9]{64}$/.test(id)) throw runtimeFailure('Docker returned an invalid browser graphics container identity.')
  try {
    const confinement = validateConfinement(await inspectContainer(id), input.image)
    const started = await runDocker(['start', '--attach', '--interactive', id], { input: `${input.serializedRequest}\n`, timeoutMs: TIMEOUT_MS, maxBytes: 16 * 1024 * 1024 })
    const after = await inspectContainer(id); const state = record(after.State)
    if (state.Status !== 'exited' || state.Running !== false || state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean') throw runtimeFailure('Browser graphics container exit state is inconsistent.')
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally {
    await runDocker(['rm', '--force', id], { timeoutMs: TIMEOUT_MS, maxBytes: 64 * 1024 }).catch(() => undefined)
  }
}

function validateConfinement(inspect: Inspect, image: OfflineBrowserGraphicsImageEvidence): OfflineBrowserGraphicsConfinementEvidence {
  const host = record(inspect.HostConfig); const config = record(inspect.Config)
  const caps = stringArray(host.CapDrop); const security = stringArray(host.SecurityOpt); const tmpfs = stringRecord(host.Tmpfs)
  const tokens = new Set(String(tmpfs['/tmp'] ?? '').split(',')); const mounts = array(inspect.Mounts); const binds = host.Binds == null ? [] : array(host.Binds)
  const command = config.Cmd == null ? [] : array(config.Cmd); const envNames = environmentNames(stringArray(config.Env))
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true || host.Privileged !== false ||
    caps.length !== 1 || caps[0] !== 'ALL' || !security.some((value) => value.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 256 || Number(host.Memory) !== 2147483648 || Number(host.MemorySwap) !== 2147483648 || Number(host.NanoCpus) !== 2000000000 ||
    Number(host.ShmSize) !== 268435456 || config.User !== '10001:10001' || command.length || mounts.length || binds.length ||
    !tokens.has('rw') || !tokens.has('noexec') || !tokens.has('nosuid') || !tokens.has('nodev') || !tokens.has('size=536870912') ||
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) || secretLikeEnvironmentNames(envNames).length
  ) throw runtimeFailure('Browser graphics container confinement is invalid.')
  return { networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true, noNewPrivileges: true, privileged: false, pidsLimit: 256, memoryLimitBytes: 2147483648, memoryAndSwapLimitBytes: 2147483648, nanoCpus: 2000000000, tmpfsPath: '/tmp', tmpfsSizeBytes: 536870912, tmpfsNoExec: true, tmpfsNoSuid: true, tmpfsNoDevice: true, shmSizeBytes: 268435456, user: '10001:10001', callerCommandPresent: false, callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false, secretLikeImageEnvironmentNames: [] }
}

async function inspectContainer(id: string): Promise<Inspect> {
  const result = await runDocker(['inspect', id], { timeoutMs: TIMEOUT_MS, maxBytes: 8 * 1024 * 1024 })
  if (result.exitCode !== 0 || result.stderr.trim()) throw runtimeFailure('Browser graphics container inspect failed.')
  const value = JSON.parse(result.stdout) as unknown
  if (!Array.isArray(value) || value.length !== 1) throw runtimeFailure('Browser graphics container inspect is invalid.')
  return value[0] as Inspect
}
async function sourceHashes(): Promise<Record<string, string>> { const result: Record<string, string> = {}; for (const name of SOURCE_FILES) result[name] = await sha256File(join(sourceDirectory(), name)); return result }
async function assertPinnedDockerfile(path: string) {
  const text = await readBoundedFile(path, 64 * 1024)
  if (!text.includes(`FROM ${PINNED_BASE} AS build`) || !text.includes(`FROM ${PINNED_BASE} AS runtime`) || !text.includes('npm ci --no-audit --no-fund') || !text.includes('USER 10001:10001') || !text.includes('ENTRYPOINT ["node", "/app/runner.mjs"]')) throw runtimeFailure('Browser graphics Dockerfile pinning policy failed.')
}
async function copyCleanTree(source: string, target: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw runtimeFailure('Browser graphics build input cannot contain symbolic links.')
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === 'node_modules' || entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
      await copyCleanTree(join(source, entry.name), join(target, entry.name))
    }
    return
  }
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024) throw runtimeFailure('Browser graphics build input is not a bounded file.')
  await mkdir(dirname(target), { recursive: true, mode: 0o700 }); await copyFile(source, target, constants.COPYFILE_EXCL)
}
async function sha256File(path: string) { return createHash('sha256').update(await readBoundedBuffer(path, 4 * 1024 * 1024)).digest('hex') }
async function readBoundedFile(path: string, max: number) { return (await readBoundedBuffer(path, max)).toString('utf8') }
async function readBoundedBuffer(path: string, max: number) { const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > max) throw runtimeFailure('Browser graphics source file is invalid.'); return await handle.readFile() } finally { await handle.close() } }
function sourceDirectory() { return join(repositoryRoot(), 'docker/prod/offline-browser-graphics-execution') }
function repositoryRoot() { return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '') }
function runDocker(args: string[], options: { cwd?: string; input?: string; timeoutMs: number; maxBytes: number }): Promise<HostResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('docker', args, { cwd: options.cwd, env: { PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin' }, stdio: ['pipe', 'pipe', 'pipe'] })
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
function stringArray(value: unknown): string[] { const values = array(value); if (values.some((value) => typeof value !== 'string')) throw runtimeFailure('Docker evidence contains a non-string array.'); return values as string[] }
function stringRecord(value: unknown): Record<string, string> { const valueRecord = record(value); if (Object.values(valueRecord).some((value) => typeof value !== 'string')) throw runtimeFailure('Docker evidence contains a non-string record.'); return valueRecord as Record<string, string> }
function environmentNames(values: string[]) { return values.map((value) => value.split('=', 1)[0] ?? '').sort() }
function secretLikeEnvironmentNames(values: string[]) { return values.filter((name) => /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name)) }
function bounded(result: HostResult) { return `${result.stderr}\n${result.stdout}`.trim().slice(-4_000) }
function runtimeFailure(message: string, cause?: unknown) { return new ApiError('TOOL_NOT_READY', message, 503, undefined, { cause }) }
function validationFailure(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
