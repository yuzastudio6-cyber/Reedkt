import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { copyFile, lstat, mkdir, open, readdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../../errors/api-error'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { createPrivateDockerCliInvocation } from '../private-docker-cli'
import type { OfflineLibassConfinementEvidence, OfflineLibassImageEvidence } from './offline-libass-caption-types'

const REPOSITORY_ROOT = repositoryRoot()
export const OFFLINE_LIBASS_LOCAL_RUNTIME_NAMESPACE = createHash('sha256')
  .update(REPOSITORY_ROOT)
  .digest('hex')
  .slice(0, 16)
export const OFFLINE_LIBASS_IMAGE_TAG =
  `reeditpro-offline-libass-caption-execution:canonical-private-local-v2-${OFFLINE_LIBASS_LOCAL_RUNTIME_NAMESPACE}` as const
const BASE_DIGEST = 'sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf'
const ENTRYPOINT = ['/opt/reeditpro-caption-runner'] as const
const SOURCE_SHA = 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a' as const
const FONT_PACK_RELEASE_ID = 'reeditpro-reviewed-noto-caption-fonts-2026-08-04-v1' as const
const FONT_SHA256 = Object.freeze({
  notoSans: '478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823',
  notoSansArabic: 'bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48',
  notoSansDevanagari: 'da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8',
  notoSansJp: 'dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073',
} as const)
const SOURCE_FILES = ['99-reeditpro-caption-fonts.conf', 'Dockerfile', 'caption_runner.c', 'font-provenance.lock', 'source-provenance.lock'] as const
const BUILD_CONTEXT =
  `/tmp/reeditpro-canonical-private-offline-libass-build-context-v2-${OFFLINE_LIBASS_LOCAL_RUNTIME_NAMESPACE}-${process.pid}`
const INSPECTION_TIMEOUT_MS = 120_000
interface HostResult { exitCode: number; stdout: Buffer; stderr: Buffer }

export async function prepareOfflineLibassDockerRuntime(): Promise<OfflineLibassImageEvidence> {
  const source = sourceDir()
  await assertPinnedDockerfile(join(source, 'Dockerfile'))
  const sourceTreeSha256 = sha256AuthorityValue(await hashes())
  await rm(BUILD_CONTEXT, { recursive: true, force: true })
  try {
    await copyCleanTree(source, join(BUILD_CONTEXT, 'docker/prod/offline-libass-caption-execution'))
    const built = await docker([
      'build', '--pull=false', '--progress=plain',
      '--build-arg', `REEDITPRO_SOURCE_TREE_SHA256=${sourceTreeSha256}`,
      '--tag', OFFLINE_LIBASS_IMAGE_TAG,
      '--file', 'docker/prod/offline-libass-caption-execution/Dockerfile', '.',
    ], undefined, 64 * 1024 * 1024, 30 * 60_000, BUILD_CONTEXT)
    if (built.exitCode !== 0) throw unavailable(`Private libass image build failed: ${bounded(built)}`)
    return inspectExistingOfflineLibassRuntime()
  } finally {
    await rm(BUILD_CONTEXT, { recursive: true, force: true }).catch(() => undefined)
  }
}

export async function inspectExistingOfflineLibassRuntime(): Promise<OfflineLibassImageEvidence> {
  const sourceHashes = await hashes()
  const sourceTreeSha256 = sha256AuthorityValue(sourceHashes)
  const result = await docker(['image', 'inspect', OFFLINE_LIBASS_IMAGE_TAG], undefined, 8 * 1024 * 1024, INSPECTION_TIMEOUT_MS)
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
    labels['com.reeditpro.runner.protocol'] !== 'offline-libass-caption-execution-container-v2' ||
    labels['com.reeditpro.runner.source-tree.sha256'] !== sourceTreeSha256 ||
    labels['com.reeditpro.caption-font-pack.profile'] !== 'reeditpro_reviewed_fonts_v2' ||
    labels['com.reeditpro.caption-font-pack.release'] !== FONT_PACK_RELEASE_ID ||
    labels['com.reeditpro.caption-font-pack.fonttools.version'] !== '4.38.0' ||
    labels['com.reeditpro.caption-font-pack.fonttools-subset-roundtrip'] !== 'true' ||
    labels['com.reeditpro.caption-font-pack.opentype-sanitizer.version'] !== '8.2.1' ||
    labels['com.reeditpro.caption-font-pack.ots-malformed-rejection'] !== 'true' ||
    labels['com.reeditpro.caption-font-pack.noto-sans.sha256'] !== FONT_SHA256.notoSans ||
    labels['com.reeditpro.caption-font-pack.noto-sans-arabic.sha256'] !== FONT_SHA256.notoSansArabic ||
    labels['com.reeditpro.caption-font-pack.noto-sans-devanagari.sha256'] !== FONT_SHA256.notoSansDevanagari ||
    labels['com.reeditpro.caption-font-pack.noto-sans-jp.sha256'] !== FONT_SHA256.notoSansJp ||
    labels['com.reeditpro.caption-font-pack.color-emoji-included'] !== 'false' ||
    labels['com.reeditpro.caption-font-pack.runtime-download-allowed'] !== 'false' ||
    labels['com.reeditpro.runner.private-internal-only'] !== 'true' || labels['com.reeditpro.runner.product-ready'] !== 'false' ||
    secretNames(envNames).length || layers.length < 2
  ) throw unavailable('Private libass image identity is invalid.')
  return {
    imageTag: OFFLINE_LIBASS_IMAGE_TAG, imageId: inspect.Id,
    imageIdentityHash: sha256AuthorityValue({ imageId: inspect.Id, architecture: inspect.Architecture, entrypoint, envNames, layers, labels, sourceHashes, sourceTreeSha256 }),
    libassVersion: '0.17.5', libassSourceSha256: SOURCE_SHA, sourceHashes, sourceTreeSha256,
    fontPackProfileId: 'reeditpro_reviewed_fonts_v2', fontPackReleaseId: FONT_PACK_RELEASE_ID,
    fontToolsVersion: '4.38.0', openTypeSanitizerVersion: '8.2.1',
    fontToolsSubsetRoundTripPassed: true, malformedFontRejectedByOpenTypeSanitizer: true,
    fontSha256: FONT_SHA256, colorEmojiIncluded: false, runtimeFontDownloadAllowed: false,
    callerFontPathAllowed: false,
    imageUser: '10001:10001', imageEntrypoint: ENTRYPOINT, imageEnvironmentNames: envNames,
    rootFilesystemLayerDigests: layers, labels,
  }
}

export async function runOfflineLibassContainer(input: { image: OfflineLibassImageEvidence; args: readonly string[]; caption: string }) {
  const created = await docker([
    'create', '--interactive', '--network', 'none', '--read-only', '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true', '--pids-limit', '64', '--memory', '256m', '--memory-swap', '256m', '--cpus', '1',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=33554432', '--user', '10001:10001', input.image.imageId, ...input.args,
  ], undefined, 64 * 1024, INSPECTION_TIMEOUT_MS)
  if (created.exitCode !== 0 || created.stderr.length) throw unavailable('Confined libass container could not be created.')
  const id = created.stdout.toString().trim()
  if (!/^[a-f0-9]{64}$/.test(id)) throw unavailable('Docker returned an invalid libass container identity.')
  try {
    const confinement = validateConfinement(await inspectContainer(id), input.image, input.args)
    const started = await docker(['start', '--attach', '--interactive', id], Buffer.from(`${input.caption}\n`), 8 * 1024 * 1024, INSPECTION_TIMEOUT_MS)
    const after = await inspectContainer(id); const state = record(after.State)
    if (state.Status !== 'exited' || state.Running !== false || state.ExitCode !== started.exitCode || typeof state.OOMKilled !== 'boolean') {
      throw unavailable('libass container exit state is inconsistent.')
    }
    return { ...started, oomKilled: state.OOMKilled, confinement }
  } finally { await docker(['rm', '--force', id], undefined, 64 * 1024, INSPECTION_TIMEOUT_MS).catch(() => undefined) }
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
async function inspectContainer(id: string) { const result = await docker(['inspect', id], undefined, 8 * 1024 * 1024, INSPECTION_TIMEOUT_MS); if (result.exitCode || result.stderr.length) throw unavailable('libass container inspect failed.'); const parsed = JSON.parse(result.stdout.toString()) as unknown; if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('libass container inspect is invalid.'); return record(parsed[0]) }
async function hashes() { const output: Record<string, string> = {}; for (const name of SOURCE_FILES) output[name] = await shaFile(join(sourceDir(), name)); return output }
async function assertPinnedDockerfile(path: string) {
  const value = (await readBoundedBuffer(path, 256 * 1024)).toString('utf8')
  if (
    !value.includes(`FROM node:22-bookworm-slim@${BASE_DIGEST} AS build`) ||
    !value.includes(`FROM node:22-bookworm-slim@${BASE_DIGEST} AS runtime`) ||
    !value.includes('REEDITPRO_SOURCE_TREE_SHA256') ||
    !value.includes('NotoSans-v2.015.zip') || !value.includes('NotoSansArabic-v2.013.zip') ||
    !value.includes('NotoSansDevanagari-v2.006.zip') || !value.includes('16_NotoSansJP.zip') ||
    !value.includes('opentype-sanitizer=8.2.1+dfsg-2') ||
    !value.includes('python3-fonttools=4.38.0-1+deb12u1') ||
    !value.includes('ots-sanitize') ||
    !value.includes('python3 -m fontTools.ttx -q -l') ||
    !value.includes('python3 -m fontTools.subset') ||
    !value.includes('reeditpro-malformed-font.ttf') ||
    !value.includes('99-reeditpro-caption-fonts.conf') ||
    !value.includes('USER 10001:10001') ||
    !value.includes('ENTRYPOINT ["/opt/reeditpro-caption-runner"]') ||
    value.includes('http://github.com/')
  ) throw unavailable('Private libass Dockerfile pinning policy failed.')
}
async function copyCleanTree(source: string, target: string): Promise<void> {
  const stat = await lstat(source)
  if (stat.isSymbolicLink()) throw unavailable('Private libass build input cannot contain symbolic links.')
  if (stat.isDirectory()) {
    await mkdir(target, { recursive: true, mode: 0o700 })
    for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue
      await copyCleanTree(join(source, entry.name), join(target, entry.name))
    }
    return
  }
  if (!stat.isFile() || stat.size < 1 || stat.size > 1024 * 1024) throw unavailable('Private libass build input is not a bounded file.')
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await copyFile(source, target, constants.COPYFILE_EXCL)
}
async function shaFile(path: string) { const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > 1024 * 1024) throw unavailable('libass source hash target is invalid.'); return createHash('sha256').update(await handle.readFile()).digest('hex') } finally { await handle.close() } }
async function readBoundedBuffer(path: string, maxBytes: number) { const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { const stat = await handle.stat(); if (!stat.isFile() || stat.size < 1 || stat.size > maxBytes) throw unavailable('libass source file is invalid.'); return await handle.readFile() } finally { await handle.close() } }
function sourceDir() { return join(repositoryRoot(), 'docker/prod/offline-libass-caption-execution') }
function repositoryRoot() { return fileURLToPath(new URL('../../../', import.meta.url)).replace(/[\\/]$/, '') }
function docker(args: string[], input: Buffer | undefined, maxBytes: number, timeoutMs = 30_000, cwd?: string): Promise<HostResult> { return new Promise((resolvePromise, reject) => { const invocation = createPrivateDockerCliInvocation(args); const child = spawn(invocation.executable, invocation.args, { cwd, env: invocation.env, stdio: ['pipe', 'pipe', 'pipe'] }); const out: Buffer[] = [], err: Buffer[] = []; let total = 0, settled = false; const timer = setTimeout(() => { child.kill('SIGKILL'); if (!settled) { settled = true; reject(unavailable('Docker command timed out.')) } }, timeoutMs); const collect = (target: Buffer[]) => (chunk: Buffer) => { total += chunk.length; if (total > maxBytes) { child.kill('SIGKILL'); if (!settled) { settled = true; clearTimeout(timer); reject(unavailable('Docker output exceeded ceiling.')) } } else target.push(Buffer.from(chunk)) }; child.stdout.on('data', collect(out)); child.stderr.on('data', collect(err)); child.on('error', (cause) => { if (!settled) { settled = true; clearTimeout(timer); reject(new ApiError('TOOL_NOT_READY', 'Docker is unavailable.', 503, undefined, { cause })) } }); child.on('close', (code) => { if (!settled) { settled = true; clearTimeout(timer); resolvePromise({ exitCode: code ?? -1, stdout: Buffer.concat(out), stderr: Buffer.concat(err) }) } }); child.stdin.end(input) }) }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Docker evidence object is invalid.'); return value as Record<string, unknown> }
function stringArray(value: unknown): string[] { if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw unavailable('Docker evidence string array is invalid.'); return value }
function stringRecord(value: unknown): Record<string, string> { const r = record(value); if (Object.values(r).some((v) => typeof v !== 'string')) throw unavailable('Docker evidence string record is invalid.'); return r as Record<string, string> }
function environmentNames(values: string[]) { return values.map((v) => v.split('=', 1)[0] ?? '').sort() }
function secretNames(values: string[]) { return values.filter((name) => /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|DATABASE_URL|SUPABASE|OPENAI|GOOGLE|GCP|AWS)/i.test(name)) }
function bounded(result: HostResult) { return `${result.stderr.toString()}\n${result.stdout.toString()}`.trim().slice(-4_000) }
function unavailable(message: string) { return new ApiError('TOOL_NOT_READY', message, 503) }
