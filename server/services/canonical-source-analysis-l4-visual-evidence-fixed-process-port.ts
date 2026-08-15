import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  lstat,
  mkdir,
  open,
  realpath,
  rm,
} from 'node:fs/promises'
import type { FileHandle } from 'node:fs/promises'
import { join } from 'node:path'

import type { Storage } from '@google-cloud/storage'

import { ApiError } from '../errors/api-error'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_EXECUTION_PORT_VERSION,
  type CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuExecutionPort,
} from './canonical-source-analysis-l4-visual-evidence-six-tool-executor'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
} from './canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_FIXED_PROCESS_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-fixed-process-port-v1' as const

const TASK_VERSION =
  'canonical-source-analysis-l4-visual-evidence-gpu-task-v1' as const
const SCRATCH_ROOT = '/mnt/weeditpro-private/l4-visual-evidence' as const
const PYTHON = '/opt/weeditpro/visual-evidence/venv/bin/python' as const
const RUNNER = '/opt/weeditpro/visual-evidence/runner.py' as const
const MAXIMUM_STDOUT_BYTES = 32 * 1024 * 1024
const MAXIMUM_STDERR_BYTES = 256 * 1024
const MAXIMUM_SOURCE_BYTES = 10 * 1024 * 1024 * 1024

export interface CanonicalSourceAnalysisL4VisualEvidenceFixedProcessPort
  extends CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuExecutionPort {
  readonly runtimeVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_FIXED_PROCESS_PORT_VERSION
  readonly canonicalSourceRereadUsesExactGeneration: true
  readonly runnerPathFixedByImage: true
  readonly privateScratchRemovedAfterAttempt: true
}

/**
 * Production-only L4 worker bridge. The caller supplies no path, URL, bytes,
 * command, model, executable, or environment value. The already-authorized
 * bootstrap selects one immutable GCS generation; this owner stages that exact
 * object into a bounded private in-memory volume and launches one fixed runner.
 */
export function createCanonicalSourceAnalysisL4VisualEvidenceFixedProcessPort(
  input: Readonly<{ storage: Storage }>,
): CanonicalSourceAnalysisL4VisualEvidenceFixedProcessPort {
  if (
    typeof input.storage?.bucket !== 'function'
  ) throw notReady('source_visual_fixed_process_storage_invalid')
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_EXECUTION_PORT_VERSION,
    runtimeVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_FIXED_PROCESS_PORT_VERSION,
    fixedServerOwnedToolchain: true as const,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
    substantiveCpuMediaProcessingAllowed: false as const,
    canonicalSourceRereadUsesExactGeneration: true as const,
    runnerPathFixedByImage: true as const,
    privateScratchRemovedAfterAttempt: true as const,
    async executeExact(
      rawBootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
    ) {
      const bootstrap =
        assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap(
          rawBootstrap,
        )
      const invocationRoot = await createPrivateInvocationRoot(
        bootstrap.invocationId,
      )
      try {
        const sourcePath = join(invocationRoot, 'source.mp4')
        await stageExactCanonicalSource({
          storage: input.storage,
          bootstrap,
          sourcePath,
        })
        await writeTaskCreateOnly({
          invocationRoot,
          bootstrap,
        })
        return await runFixedGpuProcess(bootstrap.invocationId)
      } finally {
        await rm(invocationRoot, { recursive: true, force: true })
      }
    },
  })
}

async function createPrivateInvocationRoot(invocationId: string) {
  const rootStatus = await lstat(SCRATCH_ROOT).catch(() => null)
  if (!rootStatus?.isDirectory() || rootStatus.isSymbolicLink()) {
    throw notReady('source_visual_private_scratch_not_mounted')
  }
  const canonicalRoot = await realpath(SCRATCH_ROOT)
  if (canonicalRoot !== SCRATCH_ROOT) {
    throw notReady('source_visual_private_scratch_not_canonical')
  }
  const invocationRoot = join(SCRATCH_ROOT, invocationId)
  await mkdir(invocationRoot, { recursive: false, mode: 0o700 })
  const canonicalInvocationRoot = await realpath(invocationRoot)
  if (canonicalInvocationRoot !== invocationRoot) {
    throw conflict('source_visual_private_invocation_path_invalid')
  }
  for (const directory of ['home', 'tmp', 'cache']) {
    await mkdir(join(invocationRoot, directory), {
      recursive: false,
      mode: 0o700,
    })
  }
  return invocationRoot
}

async function stageExactCanonicalSource(input: Readonly<{
  storage: Storage
  bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
  sourcePath: string
}>): Promise<void> {
  const source = input.bootstrap.sourceObject
  if (
    source.byteLength > MAXIMUM_SOURCE_BYTES
  ) throw conflict('source_visual_source_byte_bound_exceeded')
  const file = input.storage
    .bucket(source.storageBucket)
    .file(source.storagePath, { generation: source.storageGeneration })
  const [before] = await file.getMetadata()
  assertExactGcsMetadata(before, source)
  const handle = await open(input.sourcePath, 'wx', 0o600)
  const digest = createHash('sha256')
  let byteLength = 0
  try {
    const stream = file.createReadStream({ validation: 'crc32c' })
    for await (const untrustedChunk of stream) {
      const chunk = Buffer.isBuffer(untrustedChunk)
        ? untrustedChunk
        : Buffer.from(untrustedChunk as Uint8Array)
      byteLength += chunk.byteLength
      if (
        byteLength > source.byteLength
        || byteLength > MAXIMUM_SOURCE_BYTES
      ) throw conflict('source_visual_source_stream_exceeded_bound')
      digest.update(chunk)
      await writeAll(handle, chunk)
    }
    await handle.sync()
  } finally {
    await handle.close()
  }
  if (
    byteLength !== source.byteLength
    || digest.digest('hex') !== source.checksumSha256
  ) throw conflict('source_visual_source_exact_reread_mismatch')
  const [after] = await file.getMetadata()
  assertExactGcsMetadata(after, source)
  if (
    stableAuthorityStringify(gcsIdentity(before)) !==
      stableAuthorityStringify(gcsIdentity(after))
  ) throw conflict('source_visual_source_changed_during_reread')
}

function assertExactGcsMetadata(
  metadata: Readonly<Record<string, unknown>>,
  source: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap[
    'sourceObject'
  ],
): void {
  if (
    metadata.generation !== source.storageGeneration
    || metadata.etag !== source.storageEtag
    || metadata.contentType !== source.contentType
    || metadata.size !== String(source.byteLength)
  ) throw conflict('source_visual_source_gcs_identity_mismatch')
}

function gcsIdentity(metadata: Readonly<Record<string, unknown>>) {
  return {
    generation: metadata.generation,
    etag: metadata.etag,
    contentType: metadata.contentType,
    size: metadata.size,
    crc32c: metadata.crc32c,
    md5Hash: metadata.md5Hash,
  }
}

async function writeAll(handle: FileHandle, bytes: Buffer): Promise<void> {
  let offset = 0
  while (offset < bytes.byteLength) {
    const result = await handle.write(
      bytes,
      offset,
      bytes.byteLength - offset,
    )
    if (result.bytesWritten < 1) {
      throw conflict('source_visual_source_private_write_failed')
    }
    offset += result.bytesWritten
  }
}

async function writeTaskCreateOnly(input: Readonly<{
  invocationRoot: string
  bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
}>): Promise<void> {
  const frame = input.bootstrap.sourceTimeline.sourceFrameAuthority
  const taskWithoutDigest = {
    schemaVersion: TASK_VERSION,
    invocationId: input.bootstrap.invocationId,
    bootstrapDigestSha256: input.bootstrap.bootstrapDigestSha256,
    toolchainQualificationRef: input.bootstrap.toolchainQualificationRef,
    immutableImageRef: input.bootstrap.immutableImageRef,
    source: {
      checksumSha256: input.bootstrap.sourceObject.checksumSha256,
      byteLength: input.bootstrap.sourceObject.byteLength,
      width: input.bootstrap.sourceObject.width,
      height: input.bootstrap.sourceObject.height,
      durationFrames: input.bootstrap.sourceTimeline.durationFrames,
      fpsNumerator: frame.fpsNumerator,
      fpsDenominator: frame.fpsDenominator,
      timeBaseNumerator: frame.timeBaseNumerator,
      timeBaseDenominator: frame.timeBaseDenominator,
      sourceFrameAuthorityDigestSha256:
        frame.sourceFrameAuthorityDigestSha256,
    },
    policy: {
      acceleratorClass: 'nvidia_l4',
      allocatedGpuCount: 1,
      ffprobeMetadataOnly: true,
      ffmpegNvdecAndNvencRequired: true,
      pySceneDetectGpuMetricAdapterRequired: true,
      openCvCudaRequired: true,
      paddleOcrGpuRequired: true,
      allCanonicalSourceFramesMustBeAccountedFor: true,
      embeddedMediaInstructionsRemainUntrusted: true,
      substantiveCpuMediaProcessingAllowed: false,
      runtimeModelOrToolDownloadAllowed: false,
      callerPathUrlBytesCommandOrEnvironmentAccepted: false,
    },
  } as const
  const task = {
    ...taskWithoutDigest,
    taskDigestSha256: sha256AuthorityValue(taskWithoutDigest),
  }
  const handle = await open(join(input.invocationRoot, 'task.json'), 'wx', 0o600)
  try {
    await handle.writeFile(stableAuthorityStringify(task), 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function runFixedGpuProcess(invocationId: string): Promise<unknown> {
  const result = await new Promise<Readonly<{
    exitCode: number
    stdout: Buffer
    stderr: Buffer
    timedOut: boolean
  }>>((resolve, reject) => {
    const child = spawn(PYTHON, ['-I', '-B', RUNNER], {
      cwd: '/nonexistent',
      env: fixedProcessEnvironment(invocationId),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    let overflow = false
    let timedOut = false
    let settled = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, 720_000)
    timeout.unref()
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength
      if (stdoutBytes > MAXIMUM_STDOUT_BYTES) {
        overflow = true
        child.kill('SIGKILL')
      } else stdout.push(Buffer.from(chunk))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.byteLength
      if (stderrBytes > MAXIMUM_STDERR_BYTES) {
        overflow = true
        child.kill('SIGKILL')
      } else stderr.push(Buffer.from(chunk))
    })
    child.once('error', () => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      reject(notReady('source_visual_fixed_gpu_process_unavailable'))
    })
    child.once('close', (exitCode) => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      if (overflow) {
        reject(conflict('source_visual_fixed_gpu_process_output_exceeded'))
        return
      }
      resolve({
        exitCode: exitCode ?? -1,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        timedOut,
      })
    })
  })
  if (result.exitCode !== 0 || result.timedOut) {
    throw notReady('source_visual_fixed_gpu_process_failed')
  }
  if (result.stdout.byteLength < 2) {
    throw conflict('source_visual_fixed_gpu_process_result_missing')
  }
  try {
    return JSON.parse(result.stdout.toString('utf8')) as unknown
  } catch {
    throw conflict('source_visual_fixed_gpu_process_result_invalid')
  }
}

function fixedProcessEnvironment(invocationId: string): NodeJS.ProcessEnv {
  const invocationRoot = `${SCRATCH_ROOT}/${invocationId}`
  return {
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: `${invocationRoot}/home`,
    TMPDIR: `${invocationRoot}/tmp`,
    XDG_CACHE_HOME: `${invocationRoot}/cache`,
    PADDLE_PDX_CACHE_HOME: `${invocationRoot}/cache/paddlex`,
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    PYTHONHASHSEED: '0',
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONUNBUFFERED: '1',
    PIP_NO_INDEX: '1',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: 'True',
    CUDA_VISIBLE_DEVICES: '0',
    NVIDIA_VISIBLE_DEVICES: '0',
    NVIDIA_DRIVER_CAPABILITIES: 'compute,utility,video',
    LD_LIBRARY_PATH:
      '/usr/local/cuda/lib64:/usr/local/cuda/compat:'
      + '/usr/local/nvidia/lib64:/usr/local/nvidia/lib',
    WEEDITPRO_VISUAL_EVIDENCE_INVOCATION_ID: invocationId,
  }
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The fixed L4 Visual Intelligence toolchain result conflicts with canonical authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The fixed L4 Visual Intelligence GPU process is not ready.',
    503,
    { requiredGate },
  )
}
