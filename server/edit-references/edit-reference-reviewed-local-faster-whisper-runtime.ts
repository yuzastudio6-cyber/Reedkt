import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { z } from 'zod'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

export const EDIT_REFERENCE_REVIEWED_LOCAL_FASTER_WHISPER_RUNTIME_VERSION =
  'edit-reference-reviewed-local-faster-whisper-runtime-v1' as const

const MANIFEST_VERSION = 'reeditpro-internal-testing-faster-whisper-model-v1' as const
const MODEL_NAME = 'Systran/faster-whisper-small' as const
const MODEL_SOURCE = 'https://huggingface.co/Systran/faster-whisper-small' as const
const PACKAGE_NAME = 'faster-whisper' as const
const PACKAGE_VERSION = '1.2.1' as const
const EXPECTED_FILES = ['config.json', 'model.bin', 'tokenizer.json', 'vocabulary.txt'] as const
const MAX_MANIFEST_BYTES = 64 * 1024
const MAX_MODEL_FILE_COUNT = 32
const MAX_MODEL_DIRECTORY_BYTES = 2 * 1024 * 1024 * 1024
const execFileAsync = promisify(execFile)

const manifestSchema = z.object({
  manifestVersion: z.literal(MANIFEST_VERSION),
  toolId: z.literal('faster_whisper'),
  modelName: z.literal(MODEL_NAME),
  modelVersion: z.string().regex(/^[a-f0-9]{40}$/),
  source: z.literal(MODEL_SOURCE),
  license: z.literal('mit'),
  commercialUseStatus: z.literal('internal_testing_only'),
  approvedForInternalTesting: z.literal(true),
  approvedBy: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  approvedAt: z.string().min(1),
  localModelPath: z.string().min(1),
  allowModelDownload: z.literal(false),
  redistributionAllowed: z.literal(false),
  requiresAttribution: z.literal(false),
  riskNotes: z.array(z.string().min(1).max(500)).max(16),
  expectedFiles: z.array(z.string().min(1).max(120)).length(EXPECTED_FILES.length),
  modelDirectorySha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

export interface EditReferenceReviewedLocalFasterWhisperRuntimeReceipt {
  readonly receiptVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_FASTER_WHISPER_RUNTIME_VERSION
  readonly runtimeId: string
  readonly toolId: 'faster_whisper'
  readonly packageName: typeof PACKAGE_NAME
  readonly packageVersion: typeof PACKAGE_VERSION
  readonly runtimeKind: 'python_module'
  readonly modelName: typeof MODEL_NAME
  readonly modelVersion: string
  readonly modelManifestId: 'faster_whisper_model'
  readonly manifestVersion: typeof MANIFEST_VERSION
  readonly manifestDigestSha256: string
  readonly modelDirectorySha256: string
  readonly license: 'mit'
  readonly commercialUseStatus: 'internal_testing_only'
  readonly approvedForInternalTesting: true
  readonly allowModelDownload: false
  readonly providerCallMade: false
  readonly externalUrlFetched: false
  readonly localPathsPersisted: false
  readonly productionReady: false
}

export interface ValidateEditReferenceReviewedLocalFasterWhisperRuntimeInput {
  readonly manifestPath: string
  readonly localModelPath: string
  readonly pythonCommand: string
  readonly timeoutMs?: number
}

/**
 * Verifies the exact internal-testing package and model bytes before an
 * Edit Reference worker may label a transcript `verified_local`. Paths remain
 * runtime-only. This receipt is not production model-weight approval.
 */
export async function validateEditReferenceReviewedLocalFasterWhisperRuntime(
  input: ValidateEditReferenceReviewedLocalFasterWhisperRuntimeInput,
): Promise<EditReferenceReviewedLocalFasterWhisperRuntimeReceipt> {
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local manifest path')
  assertAbsoluteLocalPath(input.localModelPath, 'Reviewed local model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local Python command')

  const manifestStat = await lstat(input.manifestPath)
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size < 1 || manifestStat.size > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local Faster Whisper manifest must be one bounded regular file.')
  }
  const manifestBytes = await readFile(input.manifestPath)
  assertNoForbiddenManifestContent(manifestBytes.toString('utf8'))
  const parsed = manifestSchema.safeParse(JSON.parse(manifestBytes.toString('utf8')) as unknown)
  if (!parsed.success) throw new Error('Reviewed local Faster Whisper manifest schema is invalid.')
  const manifest = parsed.data
  if (!isExactIso(manifest.approvedAt)) {
    throw new Error('Reviewed local Faster Whisper approval timestamp is invalid.')
  }
  if (path.resolve(manifest.localModelPath) !== path.resolve(input.localModelPath)) {
    throw new Error('Reviewed local Faster Whisper model path does not match its exact manifest.')
  }
  if (stableString([...manifest.expectedFiles].sort()) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local Faster Whisper expected-file authority is invalid.')
  }
  for (const expectedFile of manifest.expectedFiles) {
    if (path.basename(expectedFile) !== expectedFile || expectedFile === '.' || expectedFile === '..') {
      throw new Error('Reviewed local Faster Whisper manifest contains an unsafe model filename.')
    }
  }

  const modelStat = await lstat(input.localModelPath)
  if (!modelStat.isDirectory() || modelStat.isSymbolicLink()) {
    throw new Error('Reviewed local Faster Whisper model path must be one regular directory.')
  }
  if (await realpath(input.localModelPath) !== path.resolve(input.localModelPath)) {
    throw new Error('Reviewed local Faster Whisper model directory must not resolve through an alias.')
  }
  const modelFiles = await listRegularModelFiles(input.localModelPath)
  const actualRelativeFiles = modelFiles.map((file) => path.relative(input.localModelPath, file)).sort()
  if (stableString(actualRelativeFiles) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local Faster Whisper model directory contains missing or unreviewed files.')
  }
  const totalModelBytes = (await Promise.all(modelFiles.map((file) => stat(file)))).reduce(
    (sum, file) => sum + file.size,
    0,
  )
  if (totalModelBytes < 1 || totalModelBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error('Reviewed local Faster Whisper model directory size is outside its reviewed bound.')
  }
  const modelDirectorySha256 = await hashDirectoryLikeBootstrap(input.localModelPath, modelFiles)
  if (modelDirectorySha256 !== manifest.modelDirectorySha256) {
    throw new Error('Reviewed local Faster Whisper model directory checksum does not match its manifest.')
  }

  const pythonResolved = await realpath(input.pythonCommand)
  const pythonStat = await stat(pythonResolved)
  if (!pythonStat.isFile()) throw new Error('Reviewed local Faster Whisper Python command is unavailable.')
  const timeoutMs = Math.min(30_000, Math.max(1_000, input.timeoutMs ?? 10_000))
  const packageVersion = await resolveFasterWhisperPackageVersion({
    pythonCommand: input.pythonCommand,
    timeoutMs,
  })
  if (packageVersion !== PACKAGE_VERSION) {
    throw new Error('Reviewed local Faster Whisper package version does not match the approved runtime.')
  }

  const manifestDigestSha256 = sha256(manifestBytes)
  return {
    receiptVersion: EDIT_REFERENCE_REVIEWED_LOCAL_FASTER_WHISPER_RUNTIME_VERSION,
    runtimeId: `reviewed-local-faster-whisper-${sha256([
      manifestDigestSha256,
      modelDirectorySha256,
      packageVersion,
    ].join(':')).slice(0, 24)}`,
    toolId: 'faster_whisper',
    packageName: PACKAGE_NAME,
    packageVersion: PACKAGE_VERSION,
    runtimeKind: 'python_module',
    modelName: MODEL_NAME,
    modelVersion: manifest.modelVersion,
    modelManifestId: 'faster_whisper_model',
    manifestVersion: MANIFEST_VERSION,
    manifestDigestSha256,
    modelDirectorySha256,
    license: 'mit',
    commercialUseStatus: 'internal_testing_only',
    approvedForInternalTesting: true,
    allowModelDownload: false,
    providerCallMade: false,
    externalUrlFetched: false,
    localPathsPersisted: false,
    productionReady: false,
  }
}

async function resolveFasterWhisperPackageVersion(input: {
  readonly pythonCommand: string
  readonly timeoutMs: number
}): Promise<string> {
  try {
    const result = await execFileAsync(input.pythonCommand, [
      '-c',
      'import importlib.metadata; from faster_whisper import WhisperModel; print(importlib.metadata.version("faster-whisper"))',
    ], {
      timeout: input.timeoutMs,
      maxBuffer: 64 * 1024,
      windowsHide: true,
      env: {
        ...process.env,
        HF_HUB_OFFLINE: '1',
        HF_HUB_DISABLE_TELEMETRY: '1',
      },
    })
    return result.stdout.trim()
  } catch {
    throw new Error('Reviewed local Faster Whisper Python runtime is unavailable or incompatible.')
  }
}

async function listRegularModelFiles(root: string): Promise<string[]> {
  const files: string[] = []
  const visit = async (directory: string): Promise<void> => {
    for (const entry of (await readdir(directory)).sort()) {
      const file = path.join(directory, entry)
      const fileStat = await lstat(file)
      if (fileStat.isSymbolicLink()) throw new Error('Reviewed local Faster Whisper model directory contains a symbolic link.')
      if (fileStat.isDirectory()) await visit(file)
      else if (fileStat.isFile()) files.push(file)
      else throw new Error('Reviewed local Faster Whisper model directory contains an unsupported entry.')
      if (files.length > MAX_MODEL_FILE_COUNT) {
        throw new Error('Reviewed local Faster Whisper model directory exceeds its reviewed file-count bound.')
      }
    }
  }
  await visit(root)
  return files.sort()
}

async function hashDirectoryLikeBootstrap(root: string, files: readonly string[]): Promise<string> {
  const aggregate = createHash('sha256')
  for (const file of [...files].sort()) {
    const relativeFile = file.slice(root.length + 1)
    aggregate.update(relativeFile)
    aggregate.update(await hashFile(file))
  }
  return aggregate.digest('hex')
}

async function hashFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

function assertAbsoluteLocalPath(value: string, label: string): void {
  assertNoSignedUrlOrRawUrl(value, label)
  assertNoPathTraversal(value, label)
  if (!path.isAbsolute(value)) throw new Error(`${label} must be absolute.`)
}

function assertNoForbiddenManifestContent(value: string): void {
  if (/signed_url|supabase_service_role|api[_-]?key|secret|public_url|x-goog-signature/i.test(value)) {
    throw new Error('Reviewed local Faster Whisper manifest contains forbidden credential or signed-URL fields.')
  }
}

function isExactIso(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function stableString(value: unknown): string {
  return JSON.stringify(value)
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
