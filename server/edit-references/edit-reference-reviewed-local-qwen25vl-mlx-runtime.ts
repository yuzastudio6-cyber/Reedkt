import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, type Stats } from 'node:fs'
import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { z } from 'zod'
import { QWEN_VISUAL_UNDERSTANDING_RETIREMENT } from
  '../services/qwen-visual-understanding-provider'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUNTIME_VERSION =
  'edit-reference-reviewed-local-qwen25vl-mlx-runtime-v1' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUN_VALIDATION_VERSION =
  'edit-reference-reviewed-local-qwen25vl-mlx-run-validation-v1' as const

const MANIFEST_VERSION = 'reeditpro-internal-testing-qwen25vl-mlx-model-v1' as const
const TOOL_ID = 'qwen25vl_mlx_visual_understanding' as const
const RUNTIME_PACKAGE = 'mlx-vlm' as const
const MLX_VLM_VERSION = '0.6.5' as const
const MLX_VERSION = '0.32.0' as const
const MLX_LM_VERSION = '0.31.3' as const
const TRANSFORMERS_VERSION = '5.14.1' as const
const HUGGINGFACE_HUB_VERSION = '1.24.0' as const
const PILLOW_VERSION = '12.3.0' as const
const NUMPY_VERSION = '2.5.1' as const
const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const MODEL_NAME = 'mlx-community/Qwen2.5-VL-7B-Instruct-4bit' as const
const MODEL_VERSION = 'fdcc572e8b05ba9daeaf71be8c9e4267c826ff9b' as const
const BASE_MODEL_NAME = 'Qwen/Qwen2.5-VL-7B-Instruct' as const
const BASE_MODEL_VERSION = 'cc594898137f460bfe9f0759e9844b3ce807cfb5' as const
const EXPECTED_FILES = [
  'added_tokens.json',
  'chat_template.json',
  'config.json',
  'merges.txt',
  'model-00001-of-00002.safetensors',
  'model-00002-of-00002.safetensors',
  'model.safetensors.index.json',
  'preprocessor_config.json',
  'special_tokens_map.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'vocab.json',
] as const
const MAX_MANIFEST_BYTES = 128 * 1024
const MAX_MODEL_DIRECTORY_BYTES = 8 * 1024 * 1024 * 1024
const SAFE_RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const execFileAsync = promisify(execFile)

const packageVersionsSchema = z.object({
  'huggingface-hub': z.literal(HUGGINGFACE_HUB_VERSION),
  mlx: z.literal(MLX_VERSION),
  'mlx-lm': z.literal(MLX_LM_VERSION),
  'mlx-vlm': z.literal(MLX_VLM_VERSION),
  numpy: z.literal(NUMPY_VERSION),
  pillow: z.literal(PILLOW_VERSION),
  transformers: z.literal(TRANSFORMERS_VERSION),
}).strict()

const manifestSchema = z.object({
  manifestVersion: z.literal(MANIFEST_VERSION),
  toolId: z.literal(TOOL_ID),
  runtimePackage: z.literal(RUNTIME_PACKAGE),
  runtimePackageVersion: z.literal(MLX_VLM_VERSION),
  packageVersions: packageVersionsSchema,
  runtimeLicense: z.literal('mit'),
  modelName: z.literal(MODEL_NAME),
  modelVersion: z.literal(MODEL_VERSION),
  baseModelName: z.literal(BASE_MODEL_NAME),
  baseModelVersion: z.literal(BASE_MODEL_VERSION),
  modelLicense: z.literal('apache-2.0'),
  quantization: z.literal('4bit'),
  conversionRuntimeVersion: z.literal('0.1.11'),
  source: z.literal(`https://huggingface.co/${MODEL_NAME}`),
  commercialUseStatus: z.literal('internal_testing_only'),
  approvedForInternalTesting: z.literal(true),
  approvedBy: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  approvedAt: z.string().min(1),
  localModelPath: z.string().min(1),
  allowModelDownload: z.literal(false),
  allowExternalUrlFetch: z.literal(false),
  redistributionAllowed: z.literal(false),
  requiresAttribution: z.literal(false),
  expectedFiles: z.array(z.string().min(1).max(160)).length(EXPECTED_FILES.length),
  modelDirectorySha256: z.string().regex(/^[a-f0-9]{64}$/),
  riskNotes: z.array(z.string().min(1).max(600)).min(1).max(16),
}).strict()

export interface EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt {
  readonly receiptVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUNTIME_VERSION
  readonly runtimeId: string
  readonly toolId: typeof TOOL_ID
  readonly packageVersions: z.infer<typeof packageVersionsSchema>
  readonly adapterVersion: 'qwen25vl-mlx-0.6.5-4bit-v1'
  readonly modelId: 'mlx-community.Qwen2.5-VL-7B-Instruct-4bit'
  readonly modelRevision: typeof MODEL_VERSION
  readonly baseModelRevision: typeof BASE_MODEL_VERSION
  readonly manifestVersion: typeof MANIFEST_VERSION
  readonly manifestDigestSha256: string
  readonly modelAggregateSha256: string
  readonly runtimeLicense: 'mit'
  readonly modelLicense: 'apache-2.0'
  readonly commercialUseStatus: 'internal_testing_only'
  readonly approvedForInternalTesting: true
  readonly allowModelDownload: false
  readonly allowExternalUrlFetch: false
  readonly providerCallMade: false
  readonly externalUrlFetched: false
  readonly localPathsPersisted: false
  readonly productionReady: false
}

export interface ValidateEditReferenceReviewedLocalQwen25VlMlxRuntimeInput {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly timeoutMs?: number
}

/**
 * Process-local, run-bound capability. It is created only after one complete
 * model-directory hash and cannot be reconstructed from persisted JSON.
 */
export interface EditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority {
  readonly authorityVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUN_VALIDATION_VERSION
  readonly runIdDigestSha256: string
  readonly bindingDigestSha256: string
  readonly receipt: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
}

export interface EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding {
  readonly authority: EditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority
  readonly runId: string
}

export interface CreateEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthorityInput
  extends ValidateEditReferenceReviewedLocalQwen25VlMlxRuntimeInput {
  readonly runId: string
}

interface RuntimeFileFingerprint {
  readonly resolvedPath: string
  readonly device: number
  readonly inode: number
  readonly mode: number
  readonly sizeBytes: number
  readonly modifiedAtMs: number
  readonly changedAtMs: number
}

interface RuntimeBindingSnapshot {
  readonly manifestDigestSha256: string
  readonly manifest: RuntimeFileFingerprint
  readonly modelDirectory: RuntimeFileFingerprint
  readonly modelFiles: readonly RuntimeFileFingerprint[]
  readonly pythonCommand: RuntimeFileFingerprint
}

interface RunValidationState {
  readonly runId: string
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly receipt: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt
  readonly snapshot: RuntimeBindingSnapshot
  fullModelDirectoryHashCount: number
  lightweightBindingValidationCount: number
}

const runValidationStates = new WeakMap<object, RunValidationState>()

export async function createEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority(
  input: CreateEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthorityInput,
): Promise<EditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority> {
  assertReviewedLocalQwenRuntimeRetired()
  if (!SAFE_RUN_ID_PATTERN.test(input.runId)) throw new Error('Reviewed local Qwen run-validation ID is invalid.')
  const snapshotBeforeValidation = await captureRuntimeBindingSnapshot(input)
  const receipt = freezeRuntimeReceipt(await validateEditReferenceReviewedLocalQwen25VlMlxRuntime(input))
  const snapshot = await captureRuntimeBindingSnapshot(input)
  if (stableString(snapshotBeforeValidation) !== stableString(snapshot)) {
    throw new Error('Reviewed local Qwen runtime changed while creating run-validation authority.')
  }
  const runIdDigestSha256 = sha256(input.runId)
  const bindingDigestSha256 = sha256(stableString({
    authorityVersion: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUN_VALIDATION_VERSION,
    runIdDigestSha256,
    runtimeId: receipt.runtimeId,
    manifestDigestSha256: receipt.manifestDigestSha256,
    modelAggregateSha256: receipt.modelAggregateSha256,
  }))
  const authority = Object.freeze({
    authorityVersion: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUN_VALIDATION_VERSION,
    runIdDigestSha256,
    bindingDigestSha256,
    receipt,
  })
  runValidationStates.set(authority, {
    runId: input.runId,
    manifestPath: path.resolve(input.manifestPath),
    modelPath: path.resolve(input.modelPath),
    pythonCommand: path.resolve(input.pythonCommand),
    receipt,
    snapshot,
    fullModelDirectoryHashCount: 1,
    lightweightBindingValidationCount: 0,
  })
  return authority
}

/**
 * Resolves a receipt either through the full validator or through a genuine
 * process-local run authority. Reuse still rechecks manifest bytes, exact
 * directory entries, real paths, inode/size/mode, and mtime/ctime metadata.
 * Any restart requires a new full validation; no process-global/path cache is
 * accepted.
 */
export async function resolveEditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt(
  input: ValidateEditReferenceReviewedLocalQwen25VlMlxRuntimeInput & {
    readonly runValidation?: EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding
  },
): Promise<EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt> {
  assertReviewedLocalQwenRuntimeRetired()
  if (!input.runValidation) return validateEditReferenceReviewedLocalQwen25VlMlxRuntime(input)
  const { authority, runId } = input.runValidation
  const state = runValidationStates.get(authority)
  if (!state) throw new Error('Reviewed local Qwen run-validation authority is not genuine in this process.')
  if (
    authority.authorityVersion !== EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUN_VALIDATION_VERSION
    || authority.runIdDigestSha256 !== sha256(runId)
    || runId !== state.runId
    || path.resolve(input.manifestPath) !== state.manifestPath
    || path.resolve(input.modelPath) !== state.modelPath
    || path.resolve(input.pythonCommand) !== state.pythonCommand
  ) throw new Error('Reviewed local Qwen run-validation authority does not match this exact run or runtime binding.')
  const current = await captureRuntimeBindingSnapshot(input)
  if (stableString(current) !== stableString(state.snapshot)) {
    throw new Error('Reviewed local Qwen runtime bytes or filesystem identity changed after run validation.')
  }
  state.lightweightBindingValidationCount += 1
  return state.receipt
}

export function inspectEditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority(
  authority: EditReferenceReviewedLocalQwen25VlMlxRunValidationAuthority,
): {
  readonly fullModelDirectoryHashCount: number
  readonly lightweightBindingValidationCount: number
  readonly processLocalAuthority: true
  readonly localPathsPersisted: false
  readonly productionReady: false
} {
  const state = runValidationStates.get(authority)
  if (!state) throw new Error('Reviewed local Qwen run-validation authority is not genuine in this process.')
  return {
    fullModelDirectoryHashCount: state.fullModelDirectoryHashCount,
    lightweightBindingValidationCount: state.lightweightBindingValidationCount,
    processLocalAuthority: true,
    localPathsPersisted: false,
    productionReady: false,
  }
}

/**
 * Validates the exact external-SD MLX runtime and model bytes. The returned
 * receipt omits local paths and cannot serve as provider, production-cost, or
 * public-delivery authority.
 */
export async function validateEditReferenceReviewedLocalQwen25VlMlxRuntime(
  input: ValidateEditReferenceReviewedLocalQwen25VlMlxRuntimeInput,
): Promise<EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt> {
  assertReviewedLocalQwenRuntimeRetired()
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local Qwen manifest path')
  assertAbsoluteLocalPath(input.modelPath, 'Reviewed local Qwen model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local Qwen Python command')

  const manifestStat = await lstat(input.manifestPath)
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size < 1 || manifestStat.size > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local Qwen manifest must be one bounded regular file.')
  }
  const manifestBytes = await readFile(input.manifestPath)
  assertNoForbiddenManifestContent(manifestBytes.toString('utf8'))
  const parsed = manifestSchema.safeParse(JSON.parse(manifestBytes.toString('utf8')) as unknown)
  if (!parsed.success) throw new Error('Reviewed local Qwen manifest schema is invalid.')
  const manifest = parsed.data
  if (!isExactIso(manifest.approvedAt)) throw new Error('Reviewed local Qwen approval timestamp is invalid.')
  if (
    path.resolve(manifest.localModelPath) !== path.resolve(input.modelPath)
    || stableString([...manifest.expectedFiles].sort()) !== stableString([...EXPECTED_FILES].sort())
  ) throw new Error('Reviewed local Qwen model identity does not match its exact manifest authority.')

  const modelAggregateSha256 = await validateModelDirectory(input.modelPath, manifest.modelDirectorySha256)
  const pythonResolved = await realpath(input.pythonCommand)
  if (!(await stat(pythonResolved)).isFile()) throw new Error('Reviewed local Qwen Python command is unavailable.')
  const timeoutMs = Math.min(60_000, Math.max(2_000, input.timeoutMs ?? 20_000))
  const versions = await resolveRuntimeVersions(input.pythonCommand, timeoutMs)
  if (stableString(versions) !== stableString(manifest.packageVersions)) {
    throw new Error('Reviewed local Qwen package versions do not match the approved manifest.')
  }

  const manifestDigestSha256 = sha256(manifestBytes)
  return {
    receiptVersion: EDIT_REFERENCE_REVIEWED_LOCAL_QWEN25VL_MLX_RUNTIME_VERSION,
    runtimeId: `reviewed-local-qwen25vl-mlx-${sha256([
      manifestDigestSha256,
      modelAggregateSha256,
      ...Object.entries(versions).flat(),
    ].join(':')).slice(0, 24)}`,
    toolId: TOOL_ID,
    packageVersions: versions,
    adapterVersion: 'qwen25vl-mlx-0.6.5-4bit-v1',
    modelId: 'mlx-community.Qwen2.5-VL-7B-Instruct-4bit',
    modelRevision: MODEL_VERSION,
    baseModelRevision: BASE_MODEL_VERSION,
    manifestVersion: MANIFEST_VERSION,
    manifestDigestSha256,
    modelAggregateSha256,
    runtimeLicense: 'mit',
    modelLicense: 'apache-2.0',
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

function assertReviewedLocalQwenRuntimeRetired(): void {
  if (!QWEN_VISUAL_UNDERSTANDING_RETIREMENT.freshExecutionAllowed) {
    throw new Error(
      'reviewed_local_qwen25vl_mlx_retired_use_visual_intelligence',
    )
  }
}

async function captureRuntimeBindingSnapshot(
  input: ValidateEditReferenceReviewedLocalQwen25VlMlxRuntimeInput,
): Promise<RuntimeBindingSnapshot> {
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local Qwen manifest path')
  assertAbsoluteLocalPath(input.modelPath, 'Reviewed local Qwen model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local Qwen Python command')
  const manifestBytes = await readFile(input.manifestPath)
  if (manifestBytes.length < 1 || manifestBytes.length > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local Qwen manifest changed outside its bounded size.')
  }
  const modelResolved = await realpath(input.modelPath)
  if (modelResolved !== path.resolve(input.modelPath)) {
    throw new Error('Reviewed local Qwen model path changed into an aliased directory.')
  }
  const entries = (await readdir(input.modelPath)).sort()
  if (stableString(entries) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local Qwen model directory entries changed after validation.')
  }
  const modelFiles = await Promise.all(entries.map(async (entry) => (
    captureRegularFileFingerprint(path.join(input.modelPath, entry), 'Reviewed local Qwen model file')
  )))
  const totalBytes = modelFiles.reduce((total, file) => total + file.sizeBytes, 0)
  if (totalBytes < 1 || totalBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error('Reviewed local Qwen model directory size changed outside its reviewed bound.')
  }
  const pythonResolved = await realpath(input.pythonCommand)
  return {
    manifestDigestSha256: sha256(manifestBytes),
    manifest: await captureRegularFileFingerprint(input.manifestPath, 'Reviewed local Qwen manifest'),
    modelDirectory: await captureDirectoryFingerprint(input.modelPath, 'Reviewed local Qwen model directory'),
    modelFiles,
    pythonCommand: await captureRegularFileFingerprint(pythonResolved, 'Reviewed local Qwen Python command'),
  }
}

async function captureRegularFileFingerprint(
  value: string,
  label: string,
): Promise<RuntimeFileFingerprint> {
  const configured = path.resolve(value)
  const valueStat = await lstat(configured)
  if (!valueStat.isFile() || valueStat.isSymbolicLink()) throw new Error(`${label} is no longer one regular file.`)
  const resolvedPath = await realpath(configured)
  if (resolvedPath !== configured) throw new Error(`${label} changed into an aliased file.`)
  return fingerprint(resolvedPath, valueStat)
}

async function captureDirectoryFingerprint(
  value: string,
  label: string,
): Promise<RuntimeFileFingerprint> {
  const configured = path.resolve(value)
  const valueStat = await lstat(configured)
  if (!valueStat.isDirectory() || valueStat.isSymbolicLink()) throw new Error(`${label} is no longer one directory.`)
  const resolvedPath = await realpath(configured)
  if (resolvedPath !== configured) throw new Error(`${label} changed into an aliased directory.`)
  return fingerprint(resolvedPath, valueStat)
}

function fingerprint(
  resolvedPath: string,
  valueStat: Stats,
): RuntimeFileFingerprint {
  return {
    resolvedPath,
    device: valueStat.dev,
    inode: valueStat.ino,
    mode: valueStat.mode,
    sizeBytes: valueStat.size,
    modifiedAtMs: valueStat.mtimeMs,
    changedAtMs: valueStat.ctimeMs,
  }
}

function freezeRuntimeReceipt(
  receipt: EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt,
): EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt {
  return Object.freeze({
    ...receipt,
    packageVersions: Object.freeze({ ...receipt.packageVersions }),
  })
}

async function validateModelDirectory(modelPath: string, expectedDigest: string): Promise<string> {
  const modelStat = await lstat(modelPath)
  if (!modelStat.isDirectory() || modelStat.isSymbolicLink() || await realpath(modelPath) !== path.resolve(modelPath)) {
    throw new Error('Reviewed local Qwen model path must be one non-aliased directory.')
  }
  const entries = (await readdir(modelPath)).sort()
  if (stableString(entries) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local Qwen model directory contains missing or unreviewed files.')
  }
  let totalBytes = 0
  const files: string[] = []
  for (const entry of entries) {
    const file = path.join(modelPath, entry)
    const fileStat = await lstat(file)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new Error('Reviewed local Qwen model directory contains an unsupported entry.')
    }
    totalBytes += fileStat.size
    files.push(file)
  }
  if (totalBytes < 1 || totalBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error('Reviewed local Qwen model directory size is outside its reviewed bound.')
  }
  const digest = await hashDirectoryLikeBootstrap(modelPath, files)
  if (digest !== expectedDigest) throw new Error('Reviewed local Qwen model checksum does not match its manifest.')
  return digest
}

async function resolveRuntimeVersions(
  pythonCommand: string,
  timeoutMs: number,
): Promise<EditReferenceReviewedLocalQwen25VlMlxRuntimeReceipt['packageVersions']> {
  try {
    const packages = ['huggingface-hub', 'mlx', 'mlx-lm', 'mlx-vlm', 'numpy', 'pillow', 'transformers']
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
    throw new Error('Reviewed local Qwen Python runtime is unavailable or incompatible.')
  }
}

async function hashDirectoryLikeBootstrap(root: string, files: readonly string[]): Promise<string> {
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
    throw new Error('Reviewed local Qwen manifest contains forbidden credential or signed-URL fields.')
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
