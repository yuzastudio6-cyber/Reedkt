import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, type Stats } from 'node:fs'
import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { z } from 'zod'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../workers/media/media-path-safety'

export const EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUNTIME_VERSION =
  'edit-reference-reviewed-local-paddleocr-runtime-v1' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUN_VALIDATION_VERSION =
  'edit-reference-reviewed-local-paddleocr-run-validation-v1' as const

const MANIFEST_VERSION = 'reeditpro-internal-testing-paddleocr-models-v1' as const
const PADDLEOCR_VERSION = '3.5.0' as const
const PADDLEPADDLE_VERSION = '3.3.0' as const
const PADDLEX_VERSION = '3.5.2' as const
const DETECTION_MODEL_NAME = 'PaddlePaddle/PP-OCRv5_mobile_det' as const
const DETECTION_MODEL_VERSION = '0d63e78e2b680928f6b1747d76a08db6e645efb7' as const
const RECOGNITION_MODEL_NAME = 'PaddlePaddle/en_PP-OCRv5_mobile_rec' as const
const RECOGNITION_MODEL_VERSION = '267c36e24c331595590fe7bd72bde2436fd286f2' as const
const EXPECTED_FILES = ['config.json', 'inference.json', 'inference.pdiparams', 'inference.yml'] as const
const MAX_MANIFEST_BYTES = 96 * 1024
const MAX_MODEL_DIRECTORY_BYTES = 512 * 1024 * 1024
const SAFE_RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const execFileAsync = promisify(execFile)

const modelSchema = z.object({
  role: z.enum(['text_detection', 'english_text_recognition']),
  modelName: z.enum([DETECTION_MODEL_NAME, RECOGNITION_MODEL_NAME]),
  modelVersion: z.enum([DETECTION_MODEL_VERSION, RECOGNITION_MODEL_VERSION]),
  source: z.enum([
    `https://huggingface.co/${DETECTION_MODEL_NAME}`,
    `https://huggingface.co/${RECOGNITION_MODEL_NAME}`,
  ]),
  localModelPath: z.string().min(1),
  expectedFiles: z.array(z.string().min(1).max(120)).length(EXPECTED_FILES.length),
  modelDirectorySha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

const manifestSchema = z.object({
  manifestVersion: z.literal(MANIFEST_VERSION),
  toolId: z.literal('paddleocr'),
  packageVersions: z.object({
    paddleocr: z.literal(PADDLEOCR_VERSION),
    paddlepaddle: z.literal(PADDLEPADDLE_VERSION),
    paddlex: z.literal(PADDLEX_VERSION),
  }).strict(),
  license: z.literal('apache-2.0'),
  commercialUseStatus: z.literal('internal_testing_only'),
  approvedForInternalTesting: z.literal(true),
  approvedBy: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/),
  approvedAt: z.string().min(1),
  allowModelDownload: z.literal(false),
  redistributionAllowed: z.literal(false),
  requiresAttribution: z.literal(false),
  languagePackIds: z.tuple([z.literal('en_PP-OCRv5_mobile_rec')]),
  riskNotes: z.array(z.string().min(1).max(500)).min(1).max(16),
  models: z.array(modelSchema).length(2),
}).strict()

export interface EditReferenceReviewedLocalPaddleOcrRuntimeReceipt {
  readonly receiptVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUNTIME_VERSION
  readonly runtimeId: string
  readonly toolId: 'paddleocr'
  readonly packageVersions: {
    readonly paddleocr: typeof PADDLEOCR_VERSION
    readonly paddlepaddle: typeof PADDLEPADDLE_VERSION
    readonly paddlex: typeof PADDLEX_VERSION
  }
  readonly adapterVersion: string
  readonly detectionModelVersion: typeof DETECTION_MODEL_VERSION
  readonly recognitionModelVersion: typeof RECOGNITION_MODEL_VERSION
  readonly manifestVersion: typeof MANIFEST_VERSION
  readonly manifestDigestSha256: string
  readonly combinedModelDigestSha256: string
  readonly languagePackIds: readonly ['en_PP-OCRv5_mobile_rec']
  readonly license: 'apache-2.0'
  readonly commercialUseStatus: 'internal_testing_only'
  readonly approvedForInternalTesting: true
  readonly allowModelDownload: false
  readonly providerCallMade: false
  readonly externalUrlFetched: false
  readonly localPathsPersisted: false
  readonly productionReady: false
}

export interface ValidateEditReferenceReviewedLocalPaddleOcrRuntimeInput {
  readonly manifestPath: string
  readonly detectionModelPath: string
  readonly recognitionModelPath: string
  readonly pythonCommand: string
  readonly timeoutMs?: number
}

/**
 * Process-local, run-bound capability. The authority is stored in a WeakMap,
 * cannot be reconstructed from persisted JSON, and is created only after both
 * reviewed model directories and the exact Python package runtime pass one
 * complete validation.
 */
export interface EditReferenceReviewedLocalPaddleOcrRunValidationAuthority {
  readonly authorityVersion: typeof EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUN_VALIDATION_VERSION
  readonly runIdDigestSha256: string
  readonly bindingDigestSha256: string
  readonly receipt: EditReferenceReviewedLocalPaddleOcrRuntimeReceipt
}

export interface EditReferenceReviewedLocalPaddleOcrRunValidationBinding {
  readonly authority: EditReferenceReviewedLocalPaddleOcrRunValidationAuthority
  readonly runId: string
}

export interface CreateEditReferenceReviewedLocalPaddleOcrRunValidationAuthorityInput
  extends ValidateEditReferenceReviewedLocalPaddleOcrRuntimeInput {
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
  readonly detectionModelDirectory: RuntimeFileFingerprint
  readonly detectionModelFiles: readonly RuntimeFileFingerprint[]
  readonly recognitionModelDirectory: RuntimeFileFingerprint
  readonly recognitionModelFiles: readonly RuntimeFileFingerprint[]
  readonly pythonCommand: RuntimeFileFingerprint
}

interface RunValidationState {
  readonly runId: string
  readonly manifestPath: string
  readonly detectionModelPath: string
  readonly recognitionModelPath: string
  readonly pythonCommand: string
  readonly receipt: EditReferenceReviewedLocalPaddleOcrRuntimeReceipt
  readonly snapshot: RuntimeBindingSnapshot
  fullModelDirectoryHashCount: number
  lightweightBindingValidationCount: number
}

const runValidationStates = new WeakMap<object, RunValidationState>()

export async function createEditReferenceReviewedLocalPaddleOcrRunValidationAuthority(
  input: CreateEditReferenceReviewedLocalPaddleOcrRunValidationAuthorityInput,
): Promise<EditReferenceReviewedLocalPaddleOcrRunValidationAuthority> {
  if (!SAFE_RUN_ID_PATTERN.test(input.runId)) {
    throw new Error('Reviewed local PaddleOCR run-validation ID is invalid.')
  }
  const snapshotBeforeValidation = await captureRuntimeBindingSnapshot(input)
  const receipt = freezeRuntimeReceipt(await validateEditReferenceReviewedLocalPaddleOcrRuntime(input))
  const snapshot = await captureRuntimeBindingSnapshot(input)
  if (stableString(snapshotBeforeValidation) !== stableString(snapshot)) {
    throw new Error('Reviewed local PaddleOCR runtime changed while creating run-validation authority.')
  }
  const runIdDigestSha256 = sha256(input.runId)
  const bindingDigestSha256 = sha256(stableString({
    authorityVersion: EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUN_VALIDATION_VERSION,
    runIdDigestSha256,
    runtimeId: receipt.runtimeId,
    manifestDigestSha256: receipt.manifestDigestSha256,
    combinedModelDigestSha256: receipt.combinedModelDigestSha256,
  }))
  const authority = Object.freeze({
    authorityVersion: EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUN_VALIDATION_VERSION,
    runIdDigestSha256,
    bindingDigestSha256,
    receipt,
  })
  runValidationStates.set(authority, {
    runId: input.runId,
    manifestPath: path.resolve(input.manifestPath),
    detectionModelPath: path.resolve(input.detectionModelPath),
    recognitionModelPath: path.resolve(input.recognitionModelPath),
    pythonCommand: path.resolve(input.pythonCommand),
    receipt,
    snapshot,
    fullModelDirectoryHashCount: 2,
    lightweightBindingValidationCount: 0,
  })
  return authority
}

/**
 * Reuses one genuine run authority while still checking manifest bytes,
 * directory membership, real paths, device/inode identity, size, mode, and
 * mtime/ctime for both model trees and the Python command on every use.
 */
export async function resolveEditReferenceReviewedLocalPaddleOcrRuntimeReceipt(
  input: ValidateEditReferenceReviewedLocalPaddleOcrRuntimeInput & {
    readonly runValidation?: EditReferenceReviewedLocalPaddleOcrRunValidationBinding
  },
): Promise<EditReferenceReviewedLocalPaddleOcrRuntimeReceipt> {
  if (!input.runValidation) return validateEditReferenceReviewedLocalPaddleOcrRuntime(input)
  const { authority, runId } = input.runValidation
  const state = runValidationStates.get(authority)
  if (!state) {
    throw new Error('Reviewed local PaddleOCR run-validation authority is not genuine in this process.')
  }
  if (
    authority.authorityVersion !== EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUN_VALIDATION_VERSION
    || authority.runIdDigestSha256 !== sha256(runId)
    || runId !== state.runId
    || path.resolve(input.manifestPath) !== state.manifestPath
    || path.resolve(input.detectionModelPath) !== state.detectionModelPath
    || path.resolve(input.recognitionModelPath) !== state.recognitionModelPath
    || path.resolve(input.pythonCommand) !== state.pythonCommand
  ) throw new Error('Reviewed local PaddleOCR run-validation authority does not match this exact run or runtime binding.')
  const current = await captureRuntimeBindingSnapshot(input)
  if (stableString(current) !== stableString(state.snapshot)) {
    throw new Error('Reviewed local PaddleOCR runtime bytes or filesystem identity changed after run validation.')
  }
  state.lightweightBindingValidationCount += 1
  return state.receipt
}

export function inspectEditReferenceReviewedLocalPaddleOcrRunValidationAuthority(
  authority: EditReferenceReviewedLocalPaddleOcrRunValidationAuthority,
): {
  readonly fullModelDirectoryHashCount: number
  readonly lightweightBindingValidationCount: number
  readonly processLocalAuthority: true
  readonly localPathsPersisted: false
  readonly productionReady: false
} {
  const state = runValidationStates.get(authority)
  if (!state) {
    throw new Error('Reviewed local PaddleOCR run-validation authority is not genuine in this process.')
  }
  return {
    fullModelDirectoryHashCount: state.fullModelDirectoryHashCount,
    lightweightBindingValidationCount: state.lightweightBindingValidationCount,
    processLocalAuthority: true,
    localPathsPersisted: false,
    productionReady: false,
  }
}

/**
 * Validates the exact SD-local PaddleOCR package and model bytes. The receipt
 * intentionally contains no filesystem paths and cannot be treated as
 * production model-weight or cost authority.
 */
export async function validateEditReferenceReviewedLocalPaddleOcrRuntime(
  input: ValidateEditReferenceReviewedLocalPaddleOcrRuntimeInput,
): Promise<EditReferenceReviewedLocalPaddleOcrRuntimeReceipt> {
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local PaddleOCR manifest path')
  assertAbsoluteLocalPath(input.detectionModelPath, 'Reviewed local PaddleOCR detection model path')
  assertAbsoluteLocalPath(input.recognitionModelPath, 'Reviewed local PaddleOCR recognition model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local PaddleOCR Python command')

  const manifestStat = await lstat(input.manifestPath)
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink() || manifestStat.size < 1 || manifestStat.size > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local PaddleOCR manifest must be one bounded regular file.')
  }
  const manifestBytes = await readFile(input.manifestPath)
  assertNoForbiddenManifestContent(manifestBytes.toString('utf8'))
  const parsed = manifestSchema.safeParse(JSON.parse(manifestBytes.toString('utf8')) as unknown)
  if (!parsed.success) throw new Error('Reviewed local PaddleOCR manifest schema is invalid.')
  const manifest = parsed.data
  if (!isExactIso(manifest.approvedAt)) {
    throw new Error('Reviewed local PaddleOCR approval timestamp is invalid.')
  }

  const detection = requireOneModel(manifest.models, 'text_detection')
  const recognition = requireOneModel(manifest.models, 'english_text_recognition')
  validateModelIdentity({
    model: detection,
    expectedName: DETECTION_MODEL_NAME,
    expectedVersion: DETECTION_MODEL_VERSION,
    expectedPath: input.detectionModelPath,
  })
  validateModelIdentity({
    model: recognition,
    expectedName: RECOGNITION_MODEL_NAME,
    expectedVersion: RECOGNITION_MODEL_VERSION,
    expectedPath: input.recognitionModelPath,
  })

  const detectionDigest = await validateModelDirectory(input.detectionModelPath, detection.modelDirectorySha256)
  const recognitionDigest = await validateModelDirectory(input.recognitionModelPath, recognition.modelDirectorySha256)
  const pythonResolved = await realpath(input.pythonCommand)
  if (!(await stat(pythonResolved)).isFile()) {
    throw new Error('Reviewed local PaddleOCR Python command is unavailable.')
  }
  const timeoutMs = Math.min(60_000, Math.max(2_000, input.timeoutMs ?? 20_000))
  const versions = await resolveRuntimeVersions(input.pythonCommand, timeoutMs)
  if (
    versions.paddleocr !== PADDLEOCR_VERSION
    || versions.paddlepaddle !== PADDLEPADDLE_VERSION
    || versions.paddlex !== PADDLEX_VERSION
  ) throw new Error('Reviewed local PaddleOCR package versions do not match the approved runtime.')

  const manifestDigestSha256 = sha256(manifestBytes)
  const combinedModelDigestSha256 = sha256([detectionDigest, recognitionDigest].join(':'))
  return {
    receiptVersion: EDIT_REFERENCE_REVIEWED_LOCAL_PADDLEOCR_RUNTIME_VERSION,
    runtimeId: `reviewed-local-paddleocr-${sha256([
      manifestDigestSha256,
      combinedModelDigestSha256,
      versions.paddleocr,
      versions.paddlepaddle,
      versions.paddlex,
    ].join(':')).slice(0, 24)}`,
    toolId: 'paddleocr',
    packageVersions: versions,
    adapterVersion: `paddleocr-${PADDLEOCR_VERSION}-mobile-en-v1`,
    detectionModelVersion: DETECTION_MODEL_VERSION,
    recognitionModelVersion: RECOGNITION_MODEL_VERSION,
    manifestVersion: MANIFEST_VERSION,
    manifestDigestSha256,
    combinedModelDigestSha256,
    languagePackIds: ['en_PP-OCRv5_mobile_rec'],
    license: 'apache-2.0',
    commercialUseStatus: 'internal_testing_only',
    approvedForInternalTesting: true,
    allowModelDownload: false,
    providerCallMade: false,
    externalUrlFetched: false,
    localPathsPersisted: false,
    productionReady: false,
  }
}

async function captureRuntimeBindingSnapshot(
  input: ValidateEditReferenceReviewedLocalPaddleOcrRuntimeInput,
): Promise<RuntimeBindingSnapshot> {
  assertAbsoluteLocalPath(input.manifestPath, 'Reviewed local PaddleOCR manifest path')
  assertAbsoluteLocalPath(input.detectionModelPath, 'Reviewed local PaddleOCR detection model path')
  assertAbsoluteLocalPath(input.recognitionModelPath, 'Reviewed local PaddleOCR recognition model path')
  assertAbsoluteLocalPath(input.pythonCommand, 'Reviewed local PaddleOCR Python command')
  const manifestBytes = await readFile(input.manifestPath)
  if (manifestBytes.length < 1 || manifestBytes.length > MAX_MANIFEST_BYTES) {
    throw new Error('Reviewed local PaddleOCR manifest changed outside its bounded size.')
  }
  const detection = await captureModelDirectorySnapshot(
    input.detectionModelPath,
    'Reviewed local PaddleOCR detection model',
  )
  const recognition = await captureModelDirectorySnapshot(
    input.recognitionModelPath,
    'Reviewed local PaddleOCR recognition model',
  )
  const pythonResolved = await realpath(input.pythonCommand)
  return {
    manifestDigestSha256: sha256(manifestBytes),
    manifest: await captureRegularFileFingerprint(input.manifestPath, 'Reviewed local PaddleOCR manifest'),
    detectionModelDirectory: detection.directory,
    detectionModelFiles: detection.files,
    recognitionModelDirectory: recognition.directory,
    recognitionModelFiles: recognition.files,
    pythonCommand: await captureRegularFileFingerprint(
      pythonResolved,
      'Reviewed local PaddleOCR Python command',
    ),
  }
}

async function captureModelDirectorySnapshot(
  value: string,
  label: string,
): Promise<{
  readonly directory: RuntimeFileFingerprint
  readonly files: readonly RuntimeFileFingerprint[]
}> {
  const configured = path.resolve(value)
  const directory = await captureDirectoryFingerprint(configured, `${label} directory`)
  const entries = (await readdir(configured)).sort()
  if (stableString(entries) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error(`${label} directory entries changed after validation.`)
  }
  const files = await Promise.all(entries.map((entry) => (
    captureRegularFileFingerprint(path.join(configured, entry), `${label} file`)
  )))
  const totalBytes = files.reduce((total, file) => total + file.sizeBytes, 0)
  if (totalBytes < 1 || totalBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error(`${label} directory size changed outside its reviewed bound.`)
  }
  return { directory, files }
}

async function captureRegularFileFingerprint(
  value: string,
  label: string,
): Promise<RuntimeFileFingerprint> {
  const configured = path.resolve(value)
  const valueStat = await lstat(configured)
  if (!valueStat.isFile() || valueStat.isSymbolicLink()) {
    throw new Error(`${label} is no longer one regular file.`)
  }
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
  if (!valueStat.isDirectory() || valueStat.isSymbolicLink()) {
    throw new Error(`${label} is no longer one directory.`)
  }
  const resolvedPath = await realpath(configured)
  if (resolvedPath !== configured) throw new Error(`${label} changed into an aliased directory.`)
  return fingerprint(resolvedPath, valueStat)
}

function fingerprint(resolvedPath: string, valueStat: Stats): RuntimeFileFingerprint {
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
  receipt: EditReferenceReviewedLocalPaddleOcrRuntimeReceipt,
): EditReferenceReviewedLocalPaddleOcrRuntimeReceipt {
  return Object.freeze({
    ...receipt,
    packageVersions: Object.freeze({ ...receipt.packageVersions }),
    languagePackIds: Object.freeze([...receipt.languagePackIds]) as readonly ['en_PP-OCRv5_mobile_rec'],
  })
}

async function validateModelDirectory(modelPath: string, expectedDigest: string): Promise<string> {
  const modelStat = await lstat(modelPath)
  if (!modelStat.isDirectory() || modelStat.isSymbolicLink() || await realpath(modelPath) !== path.resolve(modelPath)) {
    throw new Error('Reviewed local PaddleOCR model path must be one non-aliased directory.')
  }
  const entries = (await readdir(modelPath)).sort()
  if (stableString(entries) !== stableString([...EXPECTED_FILES].sort())) {
    throw new Error('Reviewed local PaddleOCR model directory contains missing or unreviewed files.')
  }
  let totalBytes = 0
  const files: string[] = []
  for (const entry of entries) {
    const file = path.join(modelPath, entry)
    const fileStat = await lstat(file)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new Error('Reviewed local PaddleOCR model directory contains an unsupported entry.')
    }
    totalBytes += fileStat.size
    files.push(file)
  }
  if (totalBytes < 1 || totalBytes > MAX_MODEL_DIRECTORY_BYTES) {
    throw new Error('Reviewed local PaddleOCR model directory size is outside its reviewed bound.')
  }
  const digest = await hashDirectoryLikeBootstrap(modelPath, files)
  if (digest !== expectedDigest) {
    throw new Error('Reviewed local PaddleOCR model directory checksum does not match its manifest.')
  }
  return digest
}

function validateModelIdentity(input: {
  readonly model: z.infer<typeof modelSchema>
  readonly expectedName: typeof DETECTION_MODEL_NAME | typeof RECOGNITION_MODEL_NAME
  readonly expectedVersion: typeof DETECTION_MODEL_VERSION | typeof RECOGNITION_MODEL_VERSION
  readonly expectedPath: string
}): void {
  if (
    input.model.modelName !== input.expectedName
    || input.model.modelVersion !== input.expectedVersion
    || input.model.source !== `https://huggingface.co/${input.expectedName}`
    || path.resolve(input.model.localModelPath) !== path.resolve(input.expectedPath)
    || stableString([...input.model.expectedFiles].sort()) !== stableString([...EXPECTED_FILES].sort())
  ) throw new Error('Reviewed local PaddleOCR model identity does not match its exact manifest authority.')
}

function requireOneModel(
  models: readonly z.infer<typeof modelSchema>[],
  role: 'text_detection' | 'english_text_recognition',
): z.infer<typeof modelSchema> {
  const matches = models.filter((model) => model.role === role)
  if (matches.length !== 1 || !matches[0]) {
    throw new Error('Reviewed local PaddleOCR manifest must contain one exact model for every required role.')
  }
  return matches[0]
}

async function resolveRuntimeVersions(
  pythonCommand: string,
  timeoutMs: number,
): Promise<EditReferenceReviewedLocalPaddleOcrRuntimeReceipt['packageVersions']> {
  try {
    const result = await execFileAsync(pythonCommand, ['-c', [
      'import importlib.metadata, json',
      'import paddle',
      'from paddleocr import PaddleOCR',
      'print(json.dumps({"paddleocr": importlib.metadata.version("paddleocr"), "paddlepaddle": importlib.metadata.version("paddlepaddle"), "paddlex": importlib.metadata.version("paddlex")}))',
    ].join('; ')], {
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 64 * 1024,
      windowsHide: true,
      env: offlineEnvironment(),
    })
    return JSON.parse(result.stdout.trim()) as EditReferenceReviewedLocalPaddleOcrRuntimeReceipt['packageVersions']
  } catch {
    throw new Error('Reviewed local PaddleOCR Python runtime is unavailable or incompatible.')
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
}

function assertNoForbiddenManifestContent(value: string): void {
  if (/signed_url|supabase_service_role|api[_-]?key|secret|public_url|x-goog-signature/i.test(value)) {
    throw new Error('Reviewed local PaddleOCR manifest contains forbidden credential or signed-URL fields.')
  }
}

function offlineEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HF_HUB_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: 'True',
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
