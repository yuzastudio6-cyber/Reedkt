import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import type { OfflineLibassConfinementEvidence, OfflineLibassImageEvidence } from './offline-libass-caption-types'

export const OFFLINE_LIBASS_IMAGE_TAG = 'reeditpro-offline-libass-caption-execution:private-local-v1' as const
const BASE_DIGEST = 'sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf'
const ENTRYPOINT = ['/opt/reeditpro-caption-runner'] as const
const SOURCE_SHA = 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a' as const
const SOURCE_FILES = ['Dockerfile', 'caption_runner.c', 'source-provenance.lock'] as const
interface HostResult { exitCode: number; stdout: Buffer; stderr: Buffer }

export async function inspectExistingOfflineLibassRuntime(): Promise<OfflineLibassImageEvidence> {
  const sourceHashes = await hashes()
  const result = await docker(['image', 'inspect', OFFLINE_LIBASS_IMAGE_TAG], undefined, 8 * 1024 * 1024)
  if (result.exitCode !== 0 || result.stderr.length) throw unavailable('Private libass image is unavailable.')
  const parsed = JSON.parse(result.stdout.toString()) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('Private libass image inspect is invalid.')
  const inspect = record(parsed[0]); const config = record(inspect.Config); const root = record(inspect.RootFS)
  const labels = stringRecord(config.Labels); const entrypoint = stringArray(config.Entrypoint)
  const envNames = environmentNames(stringArray(config.Env)); const layers = stringArray(root.Layers)
  if (
    inspect.Os !== 'linux' || typeof inspect.Architecture !== 'string' || typeof inspect.Id !== 'string' ||
    config.User !== '10001:10001' || config.WorkingDir !== '/app' ||
    stableAuthorityStringify(entrypoint) !== stableAuthorityStringify(ENTRYPOINT) ||
    labels['org.opencontainers.image.base.digest'] !== BASE_DIGEST || labels['com.reeditpro.libass.version'] !== '0.17.5' ||
    labels['com.reeditpro.libass.source.sha256'] !== SOURCE_SHA ||
    labels['com.reeditpro.runner.protocol'] !== 'offline-libass-caption-execution-container-v1' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' || labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    secretNames(envNames).length || layers.length < 2
  ) throw unavailable('Private libass image identity is invalid.')
  return {
    imageTag: OFFLINE_LIBASS_IMAGE_TAG, imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({ imageId: inspect.Id, architecture: inspect.Architecture, entrypoint, envNames, layers, labels, sourceHashes }),
    libassVersion: '0.17.5', libassSourceSha256: SOURCE_SHA, sourceHashes,
    imageUser: '10001:10001', imageEntrypoint: ENTRYPOINT, imageEnvironmentNames: envNames,
    rootFilesystemLayerDigests: layers, labels,
  }
}

export async function runOfflineLibassContainer(input: { image: OfflineLibassImageEvidence; args: readonly string[]; caption: string }) {
  const created = await docker([
    'create', '--interactive', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true', '--pids-limit', '64', '--memory', '256m', '--memory-swap', '256m', '--cpus', '1',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=33554432', '--user', '10001:10001', input.image.imageId, ...input.args,
  ], undefined, 64 * 1024)
  if (created.exitCode !== 0 || created.stderr.length) throw unavailable('Confined libass container could not be created.')
  const id = created.stdout.toString().trim()
  if (!/^[a-f0-9]{64}$/.test(id)) throw unavailable('Docker returned an invalid libass container identity.')
  try {
    const confinement = validateConfinement(await inspectContainer(id), input.image, input.args)
    const started = await docker(['start', '--attach', '--interactive', id], Buffer.from(`${input.caption}\n`), 8 * 1024 * 1024)
    const after = await inspectContainer(id); const state = record(after.State)
    if (state.Status !== 'exited' || state.Running !== false || state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean') {
      throw unavailable('libass container exit state is inconsistent.')
    }
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally { await docker(['rm', '--force', id], undefined, 64 * 1024).catch(() => undefined) }
}

function validateConfinement(inspect: Record<string, unknown>, image: OfflineLibassImageEvidence, args: readonly string[]): OfflineLibassConfinementEvidence {
  const host = record(inspect.HostConfig); const config = record(inspect.Config); const tmpfs = stringRecord(host.Tmpfs)
  const tokens = new Set(String(tmpfs['/tmp'] ?? '').split(',')); const envNames = environmentNames(stringArray(config.Env))
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true || host.Privileged !== false ||
    stringArray(host.CapDrop).join('|') !== 'ALL' || !stringArray(host.SecurityOpt).some((v) => v.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 64 || Number(host.Memory) !== 268435456 || Number(host.MemorySwap) !== 268435456 || Number(host.NanoCpus) !== 1000000000 ||
    config.User !== '10001:10001' || stableAuthorityStringify(stringArray(config.Cmd)) !== stableAuthorityStringify(args) ||
    (Array.isArray(inspect.Mounts) && inspect.Mounts.length) || (Array.isArray(host.Binds) && host.Binds.length) ||
    !tokens.has('noexec') || !tokens.has('nosuid') || !tokens.has('nodev') || !tokens.has('size=33554432') ||
    stableAuthorityStringify(envNames) !== stableAuthorityStringify(image.imageEnvironmentNames) || secretNames(envNames).length
  ) throw unavailable('libass container confinement is invalid.')
  return { networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true, noNewPrivileges: true, privileged: false, pidsLimit: 64, memoryLimitBytes: 268435456, memoryAndSwapLimitBytes: 268435456, nanoCpus: 1000000000, tmpfsPath: '/tmp', tmpfsSizeBytes: 33554432, tmpfsNoExec: true, tmpfsNoSuid: true, tmpfsNoDevice: true, user: '10001:10001', callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false, serverDerivedArgumentsOnly: true, secretLikeImageEnvironmentNames: [] }
}
async function inspectContainer(id: string) { const result = await docker(['inspect', id], undefined, 8 * 1024 * 1024); if (result.exitCode || result.stderr.length) throw unavailable('libass container inspect failed.'); const parsed = JSON.parse(result.stdout.toString()) as unknown; if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('libass container inspect is invalid.'); return record(parsed[0]) }
async function hashes() { const output: Record<string, string> = {}; for (const name of SOURCE_FILES) output[name] = await shaFile(join(sourceDir(), name)); return output }
async function shaFile(path: string) { const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > 1024 * 1024) throw unavailable('libass source hash target is invalid.'); return createHash('sha256').update(await handle.readFile()).digest('hex') } finally { await handle.close() } }
function sourceDir() { return join(repositoryRoot(), 'docker/prod/offline-libass-caption-execution') }
function repositoryRoot() { const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..'); if (!root.endsWith(`${sep}REeditpro`) && !root.endsWith(`${sep}reeditpro`)) throw unavailable('Repository root is invalid.'); return root }
function docker(args: string[], input: Buffer | undefined, maxBytes: number): Promise<HostResult> { return new Promise((resolvePromise, reject) => { const child = spawn('docker', args, { env: { PATH: process.env.PATH ?? '' }, stdio: ['pipe', 'pipe', 'pipe'] }); const out: Buffer[] = [], err: Buffer[] = []; let total = 0, settled = false; const timer = setTimeout(() => { child.kill('SIGKILL'); if (!settled) { settled = true; reject(unavailable('Docker command timed out.')) } }, 30_000); const collect = (target: Buffer[]) => (chunk: Buffer) => { total += chunk.length; if (total > maxBytes) { child.kill('SIGKILL'); if (!settled) { settled = true; clearTimeout(timer); reject(unavailable('Docker output exceeded ceiling.')) } } else target.push(Buffer.from(chunk)) }; child.stdout.on('data', collect(out)); child.stderr.on('data', collect(err)); child.on('error', (cause) => { if (!settled) { settled = true; clearTimeout(timer); reject(new ApiError('TOOL_NOT_READY', 'Docker is unavailable.', 503, undefined, { cause })) } }); child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); resolvePromise({ exitCode: code ?? -1, stdout: Buffer.concat(out), stderr: Buffer.concat(err) }) } }); child.stdin.end(input) }) }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Docker evidence object is invalid.'); return value as Record<string, unknown> }
function stringArray(value: unknown): string[] { if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw unavailable('Docker evidence string array is invalid.'); return value }
function stringRecord(value: unknown): Record<string, string> { const r = record(value); if (Object.values(r).some((v) => typeof v !== 'string')) throw unavailable('Docker evidence string record is invalid.'); return r as Record<string, string> }
function environmentNames(values: string[]) { return values.map((v) => v.split('=', 1)[0] ?? '').sort() }
function secretNames(values: string[]) { return values.filter((name) => /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name)) }
function unavailable(message: string) { return new ApiError('TOOL_NOT_READY', message, 503) }
