import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../security/private-local-persistence'
import { sha256AuthorityValue, stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegExecutionRequest,
  validateOfflineFfprobeExecutionRequest,
  type OfflineFfmpegExecutionRequest,
  type OfflineFfprobeExecutionRequest,
} from './offline-media-binary-protocol'
import type {
  OfflineFfmpegExecutionResult,
  OfflineFfprobeExecutionResult,
  OfflineMediaBinaryConfinementEvidence,
  OfflineMediaBinaryImageEvidence,
} from './offline-media-binary-types'

const IMAGE_TAG = 'reeditpro/ffmpeg-lgpl-internal:8.1.2-local' as const
const FFPROBE_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffprobe' as const
const FFMPEG_ENTRYPOINT = '/opt/reeditpro-ffmpeg/bin/ffmpeg' as const
const SOURCE_VERSION = '8.1.2' as const
const SOURCE_SHA256 = '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c' as const
const STORAGE_ROOT = '/tmp/reeditpro-offline-media-binary-execution' as const
const AUTHORITY_PATH = 'runtime-authority/offline-media-binary-runtime-v1.json' as const
const TIMEOUT_MS = 30_000

export interface OfflineMediaBinaryRuntimeAuthority {
  schemaVersion: 'offline-media-binary-runtime-authority-v1'
  source: 'private_local_pinned_ffmpeg_lgpl_runtime'
  activatedAt: string
  image: OfflineMediaBinaryImageEvidence
  supportedOperations: readonly [
    { toolId: 'ffmpeg'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
    { toolId: 'ffprobe'; operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
  ]
  readiness: {
    privateInternalExecutionReady: true
    exactStructuredPayloadOnly: true
    canonicalDispatchMayReference: true
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalExportReady: false
  }
  blockers: readonly string[]
  authorityHash: string
}

export interface PrivateOfflineMediaBinaryRuntime {
  readonly image: OfflineMediaBinaryImageEvidence
  execute(request: OfflineFfprobeExecutionRequest): Promise<OfflineFfprobeExecutionResult>
  execute(request: OfflineFfmpegExecutionRequest): Promise<OfflineFfmpegExecutionResult>
  execute(request: unknown): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult>
}

export async function activatePrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary activation accepts no caller input.')
  const image = await inspectImage()
  await persistAuthority(image)
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  return Object.freeze({ image, execute: executeBound })
}

export async function openPrivateOfflineMediaBinaryRuntime(): Promise<PrivateOfflineMediaBinaryRuntime> {
  if (arguments.length !== 0) throw invalid('Media binary runtime open accepts no caller input.')
  const authority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (!authority) throw unavailable('Media binary runtime authority is unavailable.')
  const image = await inspectImage()
  if (stableAuthorityStringify(image) !== stableAuthorityStringify(authority.image)) {
    throw unavailable('Pinned media binary image changed after runtime activation.')
  }
  const executeBound = ((request: unknown) => execute(image, request)) as PrivateOfflineMediaBinaryRuntime['execute']
  return Object.freeze({ image, execute: executeBound })
}

export async function readPersistedOfflineMediaBinaryRuntimeAuthority():
Promise<OfflineMediaBinaryRuntimeAuthority | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({ rootPath: STORAGE_ROOT, relativePath: AUTHORITY_PATH })
  if (!content) return undefined
  let parsed: unknown
  try { parsed = JSON.parse(content) } catch { throw unavailable('Media binary runtime authority is invalid JSON.') }
  const envelope = record(parsed)
  const authority = record(envelope.authority)
  if (
    envelope.recordVersion !== 'offline-media-binary-runtime-authority-record-v1' ||
    envelope.source !== 'private_local_checksum_protected_media_binary_runtime' ||
    envelope.checksumSha256 !== sha256AuthorityValue(authority)
  ) throw unavailable('Media binary runtime authority checksum is invalid.')
  const { authorityHash, ...withoutHash } = authority
  if (
    authorityHash !== sha256AuthorityValue(withoutHash) ||
    authority.schemaVersion !== 'offline-media-binary-runtime-authority-v1' ||
    authority.source !== 'private_local_pinned_ffmpeg_lgpl_runtime' ||
    record(authority.readiness).privateInternalExecutionReady !== true ||
    record(authority.readiness).productReady !== false ||
    record(authority.readiness).finalExportReady !== false
  ) throw unavailable('Media binary runtime authority boundary is invalid.')
  return authority as unknown as OfflineMediaBinaryRuntimeAuthority
}

async function execute(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult | OfflineFfmpegExecutionResult> {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  return candidate?.toolId === 'ffmpeg'
    ? executeFfmpeg(image, value)
    : executeFfprobe(image, value)
}

async function executeFfprobe(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfprobeExecutionResult> {
  let request: OfflineFfprobeExecutionRequest
  try { request = validateOfflineFfprobeExecutionRequest(value) } catch {
    throw invalid('Structured FFprobe execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  const command = ffprobeArguments(request)
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFPROBE_ENTRYPOINT, command)
    const started = await dockerBuffer(['start', '--attach', '--interactive', container.id], sourceBytes, 4 * 1024 * 1024)
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      started.exitCode !== 0 || started.stderr.length > 0 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || state.OOMKilled !== false
    ) throw unavailable('Confined FFprobe operation failed closed.')
    const document = normalizeProbe(started.stdout, request)
    const canonical = stableAuthorityStringify(document)
    const bytes = Buffer.from(canonical, 'utf8')
    const resultSha256 = sha256(bytes)
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt,
      imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffprobe' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
      sourceSha256: request.payload.sourceSha256,
      resultSha256,
      confinement,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    return {
      resultJson: {
        mimeType: 'application/json', bytes, document,
        sha256: resultSha256, byteLength: bytes.byteLength,
      },
      evidence: {
        toolId: 'ffprobe', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue({
          ...request,
          payload: { ...request.payload, sourceBytesBase64: '[server-injected-approved-bytes]' },
        }),
        sourceSha256: request.payload.sourceSha256,
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          machineJsonOnly: true,
          durationAndSyncVerified: true,
          streamCount: Array.isArray(document.streams) ? document.streams.length : 0,
          frameCountsRequested: request.payload.countFrames,
        },
        confinement,
        containerExitCode: 0,
        oomKilled: false,
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function executeFfmpeg(
  image: OfflineMediaBinaryImageEvidence,
  value: unknown,
): Promise<OfflineFfmpegExecutionResult> {
  let request: OfflineFfmpegExecutionRequest
  try { request = validateOfflineFfmpegExecutionRequest(value) } catch {
    throw invalid('Structured FFmpeg execution request was rejected.')
  }
  const sourceBytes = Buffer.from(request.payload.sourceBytesBase64, 'base64')
  const command = [
    '-hide_banner', '-loglevel', 'error', '-nostdin',
    '-i', 'pipe:0', '-map', '0:v:0',
    '-vf', `trim=start_frame=${request.payload.trimStartFrame}:end_frame=${request.payload.trimEndFrameExclusive},setpts=PTS-STARTPTS`,
    '-an', '-threads', '1', '-c:v', 'ffv1', '-level', '3', '-f', 'nut', 'pipe:1',
  ]
  const container = await createContainer(image, FFMPEG_ENTRYPOINT, command)
  try {
    const before = await inspectContainer(container.id)
    const confinement = validateConfinement(before, image, FFMPEG_ENTRYPOINT, command)
    const started = await dockerBuffer(['start', '--attach', '--interactive', container.id], sourceBytes, 32 * 1024 * 1024)
    const after = await inspectContainer(container.id)
    const state = record(after.State)
    if (
      started.exitCode !== 0 || started.stderr.length > 0 || started.stdout.byteLength < 64 ||
      state.Status !== 'exited' || state.Running !== false ||
      state.ExitCode !== started.exitCode || state.OOMKilled !== false
    ) throw unavailable('Confined FFmpeg operation failed closed.')
    if (!started.stdout.subarray(0, 25).toString('ascii').includes('nut/multimedia')) {
      throw unavailable('FFmpeg output is not the fixed NUT intermediate container.')
    }
    const expectedFrameCount = request.payload.trimEndFrameExclusive - request.payload.trimStartFrame
    const outputProbe = await probeFfmpegOutput(image, started.stdout, expectedFrameCount, request.payload.frameRate)
    const resultSha256 = sha256(started.stdout)
    const completedAt = new Date().toISOString()
    const attestationWithoutHash = {
      domain: 'offline_media_binary_execution_attestation_v1',
      completedAt, imageIdentityHash: image.imageIdentityHash,
      toolId: 'ffmpeg' as const,
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      sourceSha256: request.payload.sourceSha256,
      resultSha256, confinement, outputProbe,
    }
    const attestationHash = sha256AuthorityValue(attestationWithoutHash)
    const recordId = sha256AuthorityValue({ attestationHash, completedAt })
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: STORAGE_ROOT,
      relativePath: `attestations/${recordId.slice(0, 2)}/${recordId}.json`,
      content: `${stableAuthorityStringify({
        recordVersion: 'offline-media-binary-execution-attestation-record-v1',
        source: 'private_local_checksum_protected_media_binary_execution',
        attestation: { ...attestationWithoutHash, recordId, attestationHash },
        checksumSha256: sha256AuthorityValue({ ...attestationWithoutHash, recordId, attestationHash }),
      })}\n`,
    })
    return {
      resultArtifact: {
        mimeType: 'video/x-nut', bytes: started.stdout,
        sha256: resultSha256, byteLength: started.stdout.byteLength,
      },
      evidence: {
        toolId: 'ffmpeg', operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        binaryVersion: SOURCE_VERSION,
        requestEnvelopeSha256: sha256AuthorityValue({
          ...request,
          payload: { ...request.payload, sourceBytesBase64: '[server-injected-approved-bytes]' },
        }),
        sourceSha256: request.payload.sourceSha256,
        resultSha256,
        semanticEvidence: {
          sourceBytesVerified: true,
          fixedRecipeExecuted: true,
          recipeProfileId: request.payload.recipeProfileId,
          trimStartFrame: request.payload.trimStartFrame,
          trimEndFrameExclusive: request.payload.trimEndFrameExclusive,
          outputFrameCount: expectedFrameCount,
          outputContainer: 'nut', outputVideoCodec: 'ffv1', audioRemoved: true,
          outputProbeVerified: true,
        },
        confinement, containerExitCode: 0, oomKilled: false,
      },
      image,
      attestation: { recordId, completedAt, attestationHash },
      readiness: {
        privateInternalOnly: true, productReady: false,
        externalBetaReady: false, productionReady: false,
      },
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function probeFfmpegOutput(
  image: OfflineMediaBinaryImageEvidence,
  bytes: Buffer,
  expectedFrameCount: number,
  expectedFrameRate: number,
): Promise<Record<string, unknown>> {
  const command = [
    '-v', 'error', '-count_frames', '-show_entries',
    'format=format_name,duration,size:stream=codec_name,codec_type,width,height,avg_frame_rate,nb_read_frames',
    '-print_format', 'json', '-i', 'pipe:0',
  ]
  const container = await createContainer(image, FFPROBE_ENTRYPOINT, command)
  try {
    validateConfinement(await inspectContainer(container.id), image, FFPROBE_ENTRYPOINT, command)
    const result = await dockerBuffer(['start', '--attach', '--interactive', container.id], bytes, 2 * 1024 * 1024)
    if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFmpeg output verification failed closed.')
    const parsed = record(JSON.parse(result.stdout.toString('utf8')))
    const format = record(parsed.format)
    const streams = Array.isArray(parsed.streams) ? parsed.streams.map(record) : []
    const video = streams.find((stream) => stream.codec_type === 'video')
    if (
      !video || video.codec_name !== 'ffv1' || !String(format.format_name ?? '').includes('nut') ||
      optionalInteger(video.nb_read_frames) !== expectedFrameCount ||
      rational(video.avg_frame_rate) !== expectedFrameRate
    ) throw unavailable('FFmpeg intermediate output failed codec, container, frame-count, or rate verification.')
    return {
      container: 'nut', videoCodec: 'ffv1', frameCount: expectedFrameCount,
      frameRate: expectedFrameRate,
      width: optionalInteger(video.width), height: optionalInteger(video.height),
      durationSeconds: optionalNumber(format.duration), sizeBytes: optionalInteger(format.size),
    }
  } finally {
    await dockerBuffer(['rm', '--force', container.id], undefined, 64 * 1024).catch(() => undefined)
  }
}

async function inspectImage(): Promise<OfflineMediaBinaryImageEvidence> {
  const inspected = await dockerBuffer(['image', 'inspect', IMAGE_TAG], undefined, 8 * 1024 * 1024)
  if (inspected.exitCode !== 0 || inspected.stderr.length > 0) throw unavailable('Pinned FFmpeg LGPL image is unavailable.')
  const parsed = JSON.parse(inspected.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('Pinned media image inspection is invalid.')
  const image = record(parsed[0])
  const config = record(image.Config)
  const labels = stringRecord(config.Labels)
  if (
    image.Os !== 'linux' || typeof image.Architecture !== 'string' ||
    typeof image.Id !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(image.Id) ||
    config.User !== '65532:65532' || labels['org.opencontainers.image.version'] !== SOURCE_VERSION ||
    labels['reeditpro.product-ready'] !== 'false' ||
    labels['reeditpro.h264-encoding'] !== 'blocked_not_compiled'
  ) throw unavailable('Pinned media image identity or safety labels are invalid.')
  const sourcePolicyHashes = await policyHashes()
  const imageIdentityHash = sha256AuthorityValue({
    imageId: image.Id, architecture: image.Architecture, os: image.Os,
    user: config.User, labels, sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256, sourcePolicyHashes,
  })
  return {
    imageTag: IMAGE_TAG,
    imageId: image.Id,
    imageIdentityHash,
    architecture: image.Architecture,
    os: 'linux',
    user: '65532:65532',
    sourceVersion: SOURCE_VERSION,
    sourceSha256: SOURCE_SHA256,
    productReady: false,
    h264Encoding: 'blocked_not_compiled',
    sourcePolicyHashes,
  }
}

async function persistAuthority(image: OfflineMediaBinaryImageEvidence): Promise<void> {
  const withoutHash = {
    schemaVersion: 'offline-media-binary-runtime-authority-v1' as const,
    source: 'private_local_pinned_ffmpeg_lgpl_runtime' as const,
    activatedAt: new Date().toISOString(),
    image,
    supportedOperations: [
      { toolId: 'ffmpeg' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg },
      { toolId: 'ffprobe' as const, operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe },
    ] as const,
    readiness: {
      privateInternalExecutionReady: true as const,
      exactStructuredPayloadOnly: true as const,
      canonicalDispatchMayReference: true as const,
      productReady: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
      finalExportReady: false as const,
    },
    blockers: [
      'Private single-host evidence is not deployed worker-fleet or production authority.',
      'The reviewed LGPL image has unresolved base-image CVEs and legal/distribution review gates.',
      'H.264/MP4 encoding and final export are intentionally not compiled or authorized.',
    ] as const,
  }
  const authority: OfflineMediaBinaryRuntimeAuthority = {
    ...withoutHash,
    authorityHash: sha256AuthorityValue(withoutHash),
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: STORAGE_ROOT,
    relativePath: AUTHORITY_PATH,
    content: `${stableAuthorityStringify({
      recordVersion: 'offline-media-binary-runtime-authority-record-v1',
      source: 'private_local_checksum_protected_media_binary_runtime',
      authority,
      checksumSha256: sha256AuthorityValue(authority),
    })}\n`,
  })
}

function ffprobeArguments(request: OfflineFfprobeExecutionRequest): string[] {
  return [
    '-v', 'error',
    ...(request.payload.countFrames ? ['-count_frames'] : []),
    '-show_entries',
    'format=format_name,duration,size:stream=index,codec_name,codec_type,width,height,avg_frame_rate,r_frame_rate,duration,pix_fmt,color_space,sample_rate,channels,nb_read_frames',
    '-print_format', 'json',
    '-i', 'pipe:0',
  ]
}

async function createContainer(
  image: OfflineMediaBinaryImageEvidence,
  entrypoint: typeof FFPROBE_ENTRYPOINT | typeof FFMPEG_ENTRYPOINT,
  command: string[],
) {
  const created = await dockerBuffer([
    'create', '--interactive', '--network', 'none', '--read-only',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
    '--pids-limit', '128', '--memory', '512m', '--memory-swap', '512m', '--cpus', '2',
    '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=67108864,mode=1777',
    '--user', '65532:65532', '--entrypoint', entrypoint,
    image.imageId, ...command,
  ], undefined, 64 * 1024)
  const id = created.stdout.toString('utf8').trim()
  if (created.exitCode !== 0 || created.stderr.length > 0 || !/^[a-f0-9]{64}$/.test(id)) {
    throw unavailable('Confined FFprobe container could not be created.')
  }
  return { id }
}

function validateConfinement(
  inspect: Record<string, unknown>,
  image: OfflineMediaBinaryImageEvidence,
  entrypoint: typeof FFPROBE_ENTRYPOINT | typeof FFMPEG_ENTRYPOINT,
  command: string[],
): OfflineMediaBinaryConfinementEvidence {
  const host = record(inspect.HostConfig)
  const config = record(inspect.Config)
  const tmpfs = stringRecord(host.Tmpfs)
  const security = stringArray(host.SecurityOpt)
  if (
    inspect.Image !== image.imageId || host.NetworkMode !== 'none' || host.ReadonlyRootfs !== true ||
    host.Privileged !== false || stringArray(host.CapDrop).join('|') !== 'ALL' ||
    !security.some((value) => value.startsWith('no-new-privileges')) ||
    Number(host.PidsLimit) !== 128 || Number(host.Memory) !== 536_870_912 ||
    Number(host.MemorySwap) !== 536_870_912 || Number(host.NanoCpus) !== 2_000_000_000 ||
    config.User !== '65532:65532' || stringArray(config.Entrypoint).join('|') !== entrypoint ||
    stableAuthorityStringify(stringArray(config.Cmd)) !== stableAuthorityStringify(command) ||
    (Array.isArray(inspect.Mounts) && inspect.Mounts.length > 0) ||
    (Array.isArray(host.Binds) && host.Binds.length > 0) ||
    !String(tmpfs['/tmp'] ?? '').includes('noexec')
  ) throw unavailable('FFprobe container confinement does not match server policy.')
  return {
    networkMode: 'none', readOnlyRootFilesystem: true, capDropAll: true,
    noNewPrivileges: true, privileged: false, pidsLimit: 128,
    memoryLimitBytes: 536_870_912, memoryAndSwapLimitBytes: 536_870_912,
    nanoCpus: 2_000_000_000, tmpfsPath: '/tmp', user: '65532:65532',
    callerBindsPresent: false, callerMountsPresent: false, callerEnvironmentPresent: false,
    serverOwnedEntrypoint: entrypoint, serverDerivedArgumentsOnly: true,
  }
}

function normalizeProbe(bytes: Buffer, request: OfflineFfprobeExecutionRequest): Readonly<Record<string, unknown>> {
  let raw: Record<string, unknown>
  try { raw = record(JSON.parse(bytes.toString('utf8'))) } catch { throw unavailable('FFprobe did not return valid JSON.') }
  const rawStreams = Array.isArray(raw.streams) ? raw.streams.slice(0, 32).map(record) : []
  const rawFormat = record(raw.format)
  const streams = rawStreams.map((stream) => ({
    index: safeInteger(stream.index),
    codecName: safeText(stream.codec_name),
    codecType: safeText(stream.codec_type),
    width: optionalInteger(stream.width),
    height: optionalInteger(stream.height),
    fps: rational(stream.avg_frame_rate ?? stream.r_frame_rate),
    durationSeconds: optionalNumber(stream.duration),
    pixelFormat: optionalText(stream.pix_fmt),
    colorSpace: optionalText(stream.color_space),
    sampleRate: optionalNumber(stream.sample_rate),
    channels: optionalInteger(stream.channels),
    readFrameCount: request.payload.countFrames ? optionalInteger(stream.nb_read_frames) : undefined,
  }))
  if (streams.length === 0 || !streams.some((stream) => stream.codecType === 'video' || stream.codecType === 'audio')) {
    throw unavailable('FFprobe found no supported media streams.')
  }
  const durationSeconds = optionalNumber(rawFormat.duration) ??
    Math.max(...streams.map((stream) => stream.durationSeconds ?? 0))
  if (!durationSeconds || durationSeconds <= 0) throw unavailable('FFprobe found no positive media duration.')
  const streamDurations = streams.map((stream) => stream.durationSeconds).filter((value): value is number => Boolean(value))
  if (streamDurations.length > 1 && Math.max(...streamDurations) - Math.min(...streamDurations) > 1) {
    throw unavailable('FFprobe detected source stream duration drift above the fixed tolerance.')
  }
  return {
    profileId: request.payload.inspectionProfileId,
    formatName: safeText(rawFormat.format_name),
    durationSeconds: rounded(durationSeconds),
    sizeBytes: optionalInteger(rawFormat.size) ?? request.payload.sourceByteLength,
    streamCount: streams.length,
    streams,
  }
}

async function inspectContainer(id: string): Promise<Record<string, unknown>> {
  const result = await dockerBuffer(['inspect', id], undefined, 8 * 1024 * 1024)
  if (result.exitCode !== 0 || result.stderr.length > 0) throw unavailable('FFprobe container inspection failed.')
  const parsed = JSON.parse(result.stdout.toString('utf8')) as unknown
  if (!Array.isArray(parsed) || parsed.length !== 1) throw unavailable('FFprobe container inspection is invalid.')
  return record(parsed[0])
}

async function policyHashes(): Promise<Record<string, string>> {
  const directory = join(process.cwd(), 'docker/prod/ffmpeg-lgpl-runtime')
  const names = [
    'Dockerfile', 'source-provenance.lock', 'configure-flags.txt',
    'allowed-encoders.txt', 'allowed-decoders.txt', 'allowed-filters.txt',
    'allowed-demuxers.txt', 'allowed-muxers.txt', 'allowed-protocols.txt', 'allowed-bsfs.txt',
  ]
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, sha256(await readFile(join(directory, name)))])))
}

function dockerBuffer(args: string[], input: Buffer | undefined, maximumBytes: number): Promise<{ exitCode: number; stdout: Buffer; stderr: Buffer }> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '' } })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(unavailable('Docker media operation timed out.')) }, TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes > maximumBytes) child.kill('SIGKILL')
      else stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > 512 * 1024) child.kill('SIGKILL')
      else stderr.push(chunk)
    })
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (stdoutBytes > maximumBytes || stderrBytes > 512 * 1024) return reject(unavailable('Docker media output exceeded its fixed bound.'))
      resolve({ exitCode: code ?? 1, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) })
    })
    if (input) child.stdin.end(input)
    else child.stdin.end()
  })
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw unavailable('Media runtime record is invalid.')
  return value as Record<string, unknown>
}
function stringRecord(value: unknown): Record<string, string> {
  const output = record(value)
  if (Object.values(output).some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string record is invalid.')
  return output as Record<string, string>
}
function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) throw unavailable('Media runtime string array is invalid.')
  return value
}
function safeInteger(value: unknown): number { const parsed = optionalInteger(value); if (parsed === undefined) throw unavailable('FFprobe integer is invalid.'); return parsed }
function optionalInteger(value: unknown): number | undefined { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined }
function optionalNumber(value: unknown): number | undefined { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? rounded(parsed) : undefined }
function rational(value: unknown): number | undefined { const [a, b] = String(value ?? '').split('/').map(Number); return Number.isFinite(a) && Number.isFinite(b) && b ? rounded(a / b) : undefined }
function safeText(value: unknown): string { const text = String(value ?? 'unknown'); return /^[A-Za-z0-9,._ -]{1,160}$/.test(text) ? text : 'unknown' }
function optionalText(value: unknown): string | undefined { return value === undefined ? undefined : safeText(value) }
function rounded(value: number): number { return Number(value.toFixed(6)) }
function sha256(value: Buffer): string { return createHash('sha256').update(value).digest('hex') }
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
function unavailable(message: string): ApiError { return new ApiError('TOOL_NOT_READY', message, 503) }
