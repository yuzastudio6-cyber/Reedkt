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

export const EDIT_REFERENCE_REVIEWED_LOCAL_AST_AUDIOSET_RUNTIME_VERSION =
  'edit-reference-reviewed-local-ast-audioset-runtime-v1' as const

const MANIFEST_VERSION = 'reeditpro-internal-testing-ast-audioset-model-v1' as const
const TRANSFORMERS_VERSION = '5.14.1' as const
const TORCH_VERSION = '2.13.0' as const
const NUMPY_VERSION = '2.5.1' as const
const HUGGINGFACE_HUB_VERSION = '1.24.0' as const
const SAFETENSORS_VERSION = '0.8.0' as const
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MODEL_NAME = 'MIT/ast-finetuned-audioset-10-10-0.4593' as const
const MODEL_VERSION = 'f826b80d28226b62986cc218e5cec390b1096902' as const
const EXPECTED_FILES = [
  'config.json',
  'model.safetensors',
  'preprocessor_config.json',
] as const
const MAX_MANIFEST_BYTES = 128 * 1024
const MAX_MODEL_DIRECTORY_BYTES = 1024 * 1024 * 1024
const execFileAsync = promisify(execFile)

const packageVersionsSchema = z.object({
  'huggingface-hub': z.literal(HUGGINGFACE_HUB_VERSION),
  numpy: z.literal(NUMPY_VERSION),
  safetensors: z.literal(SAFETENSORS_VERSION),
  torch: z.literal(TORCH_VERSION),
  transformers: z.literal(TRANSFORMERS_VERSION),
}).strict()

const manifestSchema = z.object({
  manifestVersion: z.literal(MANIFEST_VERSION),
  toolIds: z.tuple([z.literal('transformers'), z.literal('torch_torchvision')]),
  runtimePackage: z.literal('transformers'),
  runtimePackageVersion: z.literal(TRANSFORMERS_VERSION),
  packageVersions: packageVersionsSchema,
  runtimeLicense: z.literal('apache-2.0-and-bsd-3-clause'),
  modelName: z.literal(MODEL_NAME),
  modelVersion: z.literal(MODEL_VERSION),
  modelLicense: z.literal('bsd-3-clause'),
  source: z.literal(`https://huggingface.co/${MODEL_NAME}`),
  commercialUseStatus: z.literal('internal_testing_only'),
  approvedForInternalTesting: z.literal(true),
  approvedBy: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  approvedAt: z.string().min(1),
  localModelPath: z.string().min(1),
  allowModelDownload: z.literal(false),
  allowExternalUrlFetch: z.literal(false),
  redistributionAllowed: z.literal(false),
  requiresAttribution: z.literal(true),
  expectedFiles: z.array(z.string().min(1).max(160)).length(EXPECTED_FILES.length),
  modelDirectorySha256: z.string().regex(/^[a-f0-9]{64}$/),
  riskNotes: z.array(z.string().min(1).max(600)).min(1).max(16),
}).strict()

export interface EditReferenceReviewedLocalAstAudioSetRuntimeReceipt {
  readonly receiptVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_AST_AUDIOSET_RUNTIME_VERSION
  readonly runtimeId: string
  readonly toolIds: readonly ['transformers', 'torch_torchvision']
  readonly packageVersions: z.infer<typeof packageVersionsSchema>
  readonly adapterVersion: 'ast-audioset-transformers-5.14.1-v1'
  readonly modelId: 'MIT.ast-finetuned-audioset-10-10-0.4593'
  readonly modelRevision: typeof MODEL_VERSION
  readonly manifestVersion: typeof MANIFEST_VERSION
  readonly manifestDigestSha256: string
  readonly modelAggregateSha256: string
  readonly runtimeLicense: 'apache-2.0-and-bsd-3-clause'
  readonly modelLicense: 'bsd-3-clause'
  readonly commercialUseStatus: 'internal_testing_only'
  readonly approvedForInternalTesting: true
  readonly allowModelDownload: false
  readonly allowExternalUrlFetch: false
  readonly providerCallMade: false
  readonly externalUrlFetched: false
  readonly localPathsPersisted: false
  readonly productionReady: false
}

export interface ValidateEditReferenceReviewedLocalAstAudioSetRuntimeInput {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly timeoutMs?: number
}

/**
 * Verifies exact external-SD runtime and model bytes without granting provider,
 * production-cost, customer-charging, or public-delivery authority.
 */
export async function validateEditReferenceReviewedLocalAstAudioSetRuntime(
  input: ValidateEditReferenceReviewedLocalAstAudioSetRuntimeInput,
): Promise<EditReferenceReviewedLocalAstAudioSetRuntimeReceipt> {
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local AST manifest path')
  assertAbsoluteLocalPath(input.modelPath, 'Reviewed local AST model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local AST Python command')

  const manifestStat = await lstat(input.manifestPath)
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size < 1 || manifestStat.size > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local AST manifest must be one bounded regular file.')
  }
  const manifestBytes = await readFile(input.manifestPath)
  assertNoForbiddenManifestContent(manifestBytes.toString('utf8'))
  const parsed = manifestSchema.safeParse(JSON.parse(manifestBytes.toString('utf8')) as unknown)
  if (!parsed.success) throw new Error('Reviewed local AST manifest schema is invalid.')
  const manifest = parsed.data
  if (!isExactIso(manifest.approvedAt)) throw new Error('Reviewed local AST approval timestamp is invalid.')
  if (
    path.resolve(manifest.localModelPath) !== path.resolve(input.modelPath)
    || stableString([...manifest.expectedFiles].sort()) !== stableString([...EXPECTED_FILES].sort())
  ) throw new Error('Reviewed local AST model identity does not match its exact manifest authority.')

  const modelAggregateSha256 = await validateModelDirectory(input.modelPath, manifest.modelDirectorySha256)
  const pythonResolved = await realpath(input.pythonCommand)
  if (!(await stat(pythonResolved)).isFile()) throw new Error('Reviewed local AST Python command is unavailable.')
  const timeoutMs = Math.min(60_000, Math.max(2_000, input.timeoutMs ?? 20_000))
  const versions = await resolveRuntimeVersions(input.pythonCommand, timeoutMs)
  if (stableString(versions) !== stableString(manifest.packageVersions)) {
    throw new Error('Reviewed local AST package versions do not match the approved manifest.')
  }

  const manifestDigestSha256 = sha256(manifestBytes)
  return {
    receiptVersion: EDIT_REFERENCE_REVIEWED_LOCAL_AST_AUDIOSET_RUNTIME_VERSION,
    runtimeId: `reviewed-local-ast-audioset-${sha256([
      manifestDigestSha256,
      modelAggregateSha256,
      ...Object.entries(versions).flat(),
    ].join(':')).slice(0, 24)}`,
    toolIds: ['transformers', 'torch_torchvision'],
    packageVersions: versions,
    adapterVersion: 'ast-audioset-transformers-5.14.1-v1',
    modelId: 'MIT.ast-finetuned-audioset-10-10-0.4593',
    modelRevision: MODEL_VERSION,
    manifestVersion: MANIFEST_VERSION,
    manifestDigestSha256,
    modelAggregateSha256,
    runtimeLicense: 'apache-2.0-and-bsd-3-clause',
    modelLicense: 'bsd-3-clause',
    commercialUseStatus: 'internal_testing_only',
    approvedForInternalTesting: true,
    allowModelDownload: false,
    allowExternalUrlFetch: false,
    providerCallMade: false,
    externalUrlFetched: false,
    localPathsPersisted: false,
    productionReady: false,
  }
}

async function validateModelDirectory(modelPath: string, expectedDigest: string): Promise<string> {
  const modelStat = await lstat(modelPath)
  if (!modelStat.isDirectory() || modelStat.isSymbolicLink() || await realpath(modelPath) !== path.resolve(modelPath)) {
    throw new Error('Reviewed local AST model path must be one non-aliased directory.')
  }
  const entries = (await readdir(modelPath)).sort()
  if (stableString(entries) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local AST model directory contains missing or unreviewed files.')
  }
  let totalBytes = 0
  const files: string[] = []
  for (const entry of entries) {
    const file = path.join(modelPath, entry)
    const fileStat = await lstat(file)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new Error('Reviewed local AST model directory contains an unsupported entry.')
    }
    totalBytes += fileStat.size
    files.push(file)
  }
  if (totalBytes < 1 || totalBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error('Reviewed local AST model directory size is outside its reviewed bound.')
  }
  const digest = await hashDirectory(modelPath, files)
  if (digest !== expectedDigest) throw new Error('Reviewed local AST model checksum does not match its manifest.')
  return digest
}

async function resolveRuntimeVersions(
  pythonCommand: string,
  timeoutMs: number,
): Promise<EditReferenceReviewedLocalAstAudioSetRuntimeReceipt['packageVersions']> {
  try {
    const packages = ['huggingface-hub', 'numpy', 'safetensors', 'torch', 'transformers']
    const result = await execFileAsync(pythonCommand, ['-c', [
      'import importlib.metadata, json, sys',
      'print(json.dumps({name: importlib.metadata.version(name) for name in sys.argv[1:]}))',
    ].join('; '), ...packages], {
      timeout: timeoutMs,
      maxBuffer: 64 * 1024,
      windowsHide: true,
      env: offlineEnvironment(),
    })
    return packageVersionsSchema.parse(JSON.parse(result.stdout.trim()) as unknown)
  } catch {
    throw new Error('Reviewed local AST Python runtime is unavailable or incompatible.')
  }
}

async function hashDirectory(root: string, files: readonly string[]): Promise<string> {
  const aggregate = createHash('sha256')
  for (const file of [...files].sort()) {
    aggregate.update(file.slice(root.length + 1))
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
  if (!path.resolve(value).startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error(`${label} must remain on the authorized external SD volume.`)
  }
}

function assertNoForbiddenManifestContent(value: string): void {
  if (/signed_url|supabase_service_role|api[_-]?key|authorization|secret|public_url|x-goog-signature/i.test(value)) {
    throw new Error('Reviewed local AST manifest contains forbidden credential or signed-URL fields.')
  }
}

function offlineEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_HUB_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    TRANSFORMERS_OFFLINE: '1',
    TOKENIZERS_PARALLELISM: 'false',
  }
}

function stableString(value: unknown): string {
  return JSON.stringify(value)
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex')
}

function isExactIso(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}
