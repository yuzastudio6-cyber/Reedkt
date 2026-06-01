import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { copyFile, mkdir, readFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { VLM_RUNTIME_L4_TUNING_MATRIX_ID } from '../vlm-runtime/vlm-runtime-l4-tuning-profiles'
import { parseGcloudJson, runGcloud } from '../vlm-runtime/vlm-runtime-gcs-model-resolver'
import { writeVlmRuntimeJsonArtifact, writeVlmRuntimeTextArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export type VlmL4CandidateId =
  | 'Qwen/Qwen3-VL-8B-Instruct-FP8'
  | 'Qwen/Qwen3-VL-4B-Instruct'
  | 'Qwen/Qwen3-VL-2B-Instruct'

export type VlmL4CandidateAttemptStatus = 'selected' | 'rejected' | 'attempted' | 'blocked' | 'passed'

export interface VlmL4CandidateFile {
  readonly relativePath: string
  readonly sizeBytes: number
}

export interface VlmL4Candidate {
  readonly candidateKey: 'candidate-a-fp8-8b' | 'candidate-b-bf16-4b' | 'candidate-c-bf16-2b'
  readonly modelId: VlmL4CandidateId
  readonly slug: string
  readonly revision: string
  readonly rationale: string
  readonly weightProfile: 'fp8' | 'bf16'
  readonly selectedFiles: readonly VlmL4CandidateFile[]
  readonly expectedTensorEvidence: readonly string[]
  readonly sourceEvidenceUrls: readonly string[]
  readonly licenseEvidence: 'Apache-2.0'
  readonly runtimeEvidence: readonly string[]
  readonly transformersLimitation?: string
}

export interface VlmL4CandidateFileChecksum extends VlmL4CandidateFile {
  readonly sha256: string
  readonly localPath: string
}

export interface VlmL4CandidateAttemptReport {
  readonly candidate: VlmL4Candidate
  readonly status: VlmL4CandidateAttemptStatus
  readonly selected: boolean
  readonly sourceLicenseStatus: 'passed' | 'failed' | 'blocked'
  readonly revisionStatus: 'passed' | 'failed' | 'blocked'
  readonly downloadStatus: 'passed' | 'failed' | 'blocked' | 'skipped'
  readonly checksumStatus: 'passed' | 'failed' | 'blocked' | 'skipped'
  readonly privateGcsUploadStatus: 'passed' | 'failed' | 'blocked' | 'skipped'
  readonly runtimeStatus: 'passed' | 'failed' | 'blocked' | 'skipped'
  readonly aggregateSha256?: string
  readonly privateModelPrefix: string
  readonly privateQaPrefix?: string
  readonly objectCount?: number
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly runtimeReport?: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmL4CompatibleCandidateResult {
  readonly runId: string
  readonly selectedCandidate?: VlmL4Candidate
  readonly attempts: readonly VlmL4CandidateAttemptReport[]
  readonly status: 'passed' | 'blocked'
  readonly localArtifactDir: string
  readonly privateModelPrefix?: string
  readonly privateQaPrefix?: string
  readonly imageDigest?: string
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
  readonly vlmToolFamilyBetaStatus: 'blocked' | 'phase-complete but tool-family incomplete'
}

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const ENV = 'staging'
const GENERATED_ASSETS_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
const QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
const GPU_WORKER_SA = 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-l4-compatible'
const JOB_NAME = 'reeditpro-stg-vlm-runtime-phase39c-l4-compatible'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-l4-compatible-candidate'
const REPORT_DIR = 'docs/activation-phase-39bq-39cq-vlm-l4-compatible-candidate-reports'
const ORIGINAL_PHASE39B_MODEL_ID = 'Qwen/Qwen3-VL-8B-Instruct'
const ORIGINAL_PHASE39B_REVISION = '0c351dd01ed87e9c1b53cbc748cba10e6187ff3b'
const ORIGINAL_PHASE39C_OOM_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/'

export const vlmL4CompatibleCandidates: readonly VlmL4Candidate[] = [
  {
    candidateKey: 'candidate-a-fp8-8b',
    modelId: 'Qwen/Qwen3-VL-8B-Instruct-FP8',
    slug: 'qwen3-vl-8b-instruct-fp8',
    revision: '9cdc6310a8cb770ce18efaf4e9935334512aee45',
    rationale: 'Official Qwen FP8 quantized variant of the same 8B Instruct VLM; first recovery attempt because it preserves the 8B family while reducing L4 memory pressure.',
    weightProfile: 'fp8',
    licenseEvidence: 'Apache-2.0',
    sourceEvidenceUrls: [
      'https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-FP8',
      'https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-FP8/blob/9cdc6310a8cb770ce18efaf4e9935334512aee45/README.md',
    ],
    runtimeEvidence: [
      'Official Qwen model card recommends vLLM or SGLang for FP8 weights.',
      'Hugging Face metadata tags include qwen3_vl, safetensors, fp8, image-text-to-text, and license:apache-2.0.',
    ],
    expectedTensorEvidence: ['FP8/F8_E4M3 quantized weight profile', 'safetensors weight shards'],
    transformersLimitation: 'Official model card notes Transformers does not support directly loading these FP8 weights; vLLM is the required runtime for this candidate.',
    selectedFiles: [
      { relativePath: 'README.md', sizeBytes: 10439 },
      { relativePath: 'chat_template.json', sizeBytes: 5497 },
      { relativePath: 'config.json', sizeBytes: 12005 },
      { relativePath: 'generation_config.json', sizeBytes: 241 },
      { relativePath: 'model-00001-of-00002.safetensors', sizeBytes: 5363407552 },
      { relativePath: 'model-00002-of-00002.safetensors', sizeBytes: 5226891960 },
      { relativePath: 'model.safetensors.index.json', sizeBytes: 94475 },
      { relativePath: 'preprocessor_config.json', sizeBytes: 336 },
      { relativePath: 'tokenizer.json', sizeBytes: 10179867 },
      { relativePath: 'tokenizer_config.json', sizeBytes: 10868 },
      { relativePath: 'video_preprocessor_config.json', sizeBytes: 331 },
      { relativePath: 'vocab.json', sizeBytes: 4957462 },
    ],
  },
  {
    candidateKey: 'candidate-b-bf16-4b',
    modelId: 'Qwen/Qwen3-VL-4B-Instruct',
    slug: 'qwen3-vl-4b-instruct',
    revision: 'ebb281ec70b05090aa6165b016eac8ec08e71b17',
    rationale: 'Official smaller Qwen3-VL Instruct candidate; fallback only if FP8 8B is blocked or fails generated runtime before inference.',
    weightProfile: 'bf16',
    licenseEvidence: 'Apache-2.0',
    sourceEvidenceUrls: [
      'https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct',
      'https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct/tree/ebb281ec70b05090aa6165b016eac8ec08e71b17',
    ],
    runtimeEvidence: [
      'Official Qwen-owned Qwen3-VL image-text-to-text repository.',
      'Hugging Face metadata tags include qwen3_vl, safetensors, image-text-to-text, and license:apache-2.0.',
    ],
    expectedTensorEvidence: ['BF16/safetensors weight profile', 'smaller 4B parameter class than the original 8B BF16 model'],
    selectedFiles: [
      { relativePath: 'README.md', sizeBytes: 7133 },
      { relativePath: 'chat_template.json', sizeBytes: 5502 },
      { relativePath: 'config.json', sizeBytes: 1505 },
      { relativePath: 'generation_config.json', sizeBytes: 269 },
      { relativePath: 'merges.txt', sizeBytes: 1671839 },
      { relativePath: 'model-00001-of-00002.safetensors', sizeBytes: 4967229296 },
      { relativePath: 'model-00002-of-00002.safetensors', sizeBytes: 3908490048 },
      { relativePath: 'model.safetensors.index.json', sizeBytes: 64742 },
      { relativePath: 'preprocessor_config.json', sizeBytes: 390 },
      { relativePath: 'tokenizer.json', sizeBytes: 7032403 },
      { relativePath: 'tokenizer_config.json', sizeBytes: 10868 },
      { relativePath: 'video_preprocessor_config.json', sizeBytes: 385 },
      { relativePath: 'vocab.json', sizeBytes: 2776833 },
    ],
  },
  {
    candidateKey: 'candidate-c-bf16-2b',
    modelId: 'Qwen/Qwen3-VL-2B-Instruct',
    slug: 'qwen3-vl-2b-instruct',
    revision: '89644892e4d85e24eaac8bacfd4f463576704203',
    rationale: 'Official smallest Qwen3-VL Instruct fallback; acceptable only after the FP8 8B and 4B candidates cannot complete generated runtime verification.',
    weightProfile: 'bf16',
    licenseEvidence: 'Apache-2.0',
    sourceEvidenceUrls: [
      'https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct',
      'https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct/tree/89644892e4d85e24eaac8bacfd4f463576704203',
    ],
    runtimeEvidence: [
      'Official Qwen-owned Qwen3-VL image-text-to-text repository.',
      'Hugging Face metadata tags include qwen3_vl, safetensors, image-text-to-text, and license:apache-2.0.',
    ],
    expectedTensorEvidence: ['BF16/safetensors weight profile', 'smaller 2B parameter class than the original 8B BF16 model'],
    selectedFiles: [
      { relativePath: 'README.md', sizeBytes: 7136 },
      { relativePath: 'chat_template.json', sizeBytes: 5502 },
      { relativePath: 'config.json', sizeBytes: 1505 },
      { relativePath: 'generation_config.json', sizeBytes: 269 },
      { relativePath: 'merges.txt', sizeBytes: 1671839 },
      { relativePath: 'model.safetensors', sizeBytes: 4255140312 },
      { relativePath: 'preprocessor_config.json', sizeBytes: 390 },
      { relativePath: 'tokenizer.json', sizeBytes: 7032403 },
      { relativePath: 'tokenizer_config.json', sizeBytes: 10868 },
      { relativePath: 'video_preprocessor_config.json', sizeBytes: 385 },
      { relativePath: 'vocab.json', sizeBytes: 2776833 },
    ],
  },
]

export const VLM_L4_COMPATIBLE_REQUIRED_FIXTURES = [
  'generated-object-layout',
  'generated-ui-safe-zone',
  'generated-ocr-vlm-comparison',
  'generated-ambiguous-scene',
  'generated-spatial-reasoning',
] as const

export function getVlmL4CompatibleCandidatePlan() {
  const createdAt = new Date().toISOString()
  return {
    phase: '39B-Q/39C-Q',
    reportId: 'phase_39bq_39cq_vlm_l4_candidate_plan',
    createdAt,
    defaultMode: 'non_mutating',
    originalPhase39cBlocker: {
      modelId: ORIGINAL_PHASE39B_MODEL_ID,
      revision: ORIGINAL_PHASE39B_REVISION,
      latestEvidencePrefix: ORIGINAL_PHASE39C_OOM_PREFIX,
      blocker: 'Cloud Run L4 copied and verified the BF16 8B model, then vLLM OOMed during engine initialization before generated fixture inference.',
      preserved: true,
    },
    candidateOrder: vlmL4CompatibleCandidates.map((candidate, index) => ({
      order: index + 1,
      modelId: candidate.modelId,
      revision: candidate.revision,
      slug: candidate.slug,
      selectedFileCount: candidate.selectedFiles.length,
      selectedTotalSizeBytes: candidateTotalSize(candidate),
      privateModelPrefix: candidateModelPrefix(candidate),
      rationale: candidate.rationale,
      sourceEvidenceUrls: candidate.sourceEvidenceUrls,
      licenseEvidence: candidate.licenseEvidence,
      runtimeEvidence: candidate.runtimeEvidence,
      transformersLimitation: candidate.transformersLimitation,
    })),
    execution: {
      privateModelBucket: GENERATED_ASSETS_BUCKET,
      privateQaBucket: QA_BUCKET,
      qaPrefixPattern: 'activation/phase39c/generated-vlm-runtime-l4-compatible/<run-id>/',
      imagePath: IMAGE_PATH,
      cloudRunJob: JOB_NAME,
      gpu: '1 x nvidia-l4',
      cpu: 8,
      memory: '32Gi',
      generatedFixturesOnly: true,
      requiredFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
      localVerifiedModelPathOnly: true,
      runtimeAutoDownloadBlocked: true,
      providerCallsBlocked: true,
      rawPromptsBlocked: true,
      realMediaBlocked: true,
      publicOutputBlocked: true,
      phase39DBlocked: true,
      phase39EBlocked: true,
      betaProductionBlocked: true,
    },
    confirmationsRequiredForMutation: [
      'REEDITPRO_CONFIRM_VLM_L4_COMPAT_CANDIDATE_APPROVAL',
      'REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD',
      'REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD',
      'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH',
      'REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB',
      'REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE',
    ],
  }
}

export function getVlmL4CompatibleCandidateIamPlan(candidate: VlmL4Candidate = vlmL4CompatibleCandidates[0]) {
  const qaPrefix = 'activation/phase39c/generated-vlm-runtime-l4-compatible/'
  return {
    phase: '39B-Q/39C-Q',
    reportId: 'phase_39bq_39cq_vlm_l4_candidate_scoped_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmation: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    plans: [
      {
        bindingId: 'phase39bq-vlm-l4-candidate-model-read',
        bucket: GENERATED_ASSETS_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: `phase39bq-vlm-model-read-${candidate.slug}`,
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${GENERATED_ASSETS_BUCKET}/objects/${candidateObjectPrefix(candidate)}')`,
        description: 'GPU worker may read only exact staged candidate model objects under the selected official Qwen candidate prefix.',
        required: true,
      },
      {
        bindingId: 'phase39cq-vlm-l4-compatible-qa-create',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39cq-vlm-qa-create',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may create private Phase 39C-Q generated-runtime QA reports only under the approved QA prefix.',
        required: true,
      },
      {
        bindingId: 'phase39cq-vlm-l4-compatible-qa-readback',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39cq-vlm-qa-readback',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may read back private Phase 39C-Q QA reports only for upload verification.',
        required: true,
      },
    ],
  }
}

export function getVlmL4CompatibleCandidateCostSummary() {
  return {
    phase: '39B-Q/39C-Q',
    reportId: 'phase_39bq_39cq_vlm_l4_candidate_cost_summary',
    createdAt: new Date().toISOString(),
    candidateOrder: vlmL4CompatibleCandidates.map((candidate) => ({
      modelId: candidate.modelId,
      selectedTotalSizeBytes: candidateTotalSize(candidate),
      l4MemoryRisk: candidate.weightProfile === 'fp8' ? 'medium' : candidate.slug.includes('2b') ? 'lower' : 'medium_high',
      costRisk: 'staging_gpu_job_only',
    })),
    cloudRunShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function buildVlmL4CompatibleCandidateStaticReport() {
  const plan = getVlmL4CompatibleCandidatePlan()
  return {
    ok: false,
    phase: '39B-Q/39C-Q',
    reportId: 'phase_39bq_39cq_vlm_l4_candidate_recovery_report',
    createdAt: new Date().toISOString(),
    plan,
    candidateSelection: vlmL4CompatibleCandidates.map((candidate, index) => ({
      modelId: candidate.modelId,
      revision: candidate.revision,
      order: index + 1,
      status: index === 0 ? 'selected_for_first_guarded_attempt' : 'fallback_only',
      reason: candidate.rationale,
    })),
    status: 'blocked',
    blockers: ['execution_not_run'],
    vlmToolFamilyBetaStatus: 'blocked',
    blockedScopes: blockedScopes(),
  }
}

export async function runVlmL4CompatibleCandidateRecovery(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  safeArtifactDir?: string
}): Promise<VlmL4CompatibleCandidateResult> {
  if (!input.execute) throw new Error('Pass --execute to run the guarded Phase 39B-Q/39C-Q VLM L4-compatible candidate recovery.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39cq-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const localRoot = path.join(LOCAL_ROOT, runId)
  const safeArtifactDir = input.safeArtifactDir ?? REPORT_DIR
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  await mkdir(safeArtifactDir, { recursive: true })

  const envBlockers = validateExecutionEnv()
  const attempts: VlmL4CandidateAttemptReport[] = []
  const warnings: string[] = []
  if (envBlockers.length) {
    const result = await writeCombinedReport({
      runId,
      createdAt,
      attempts,
      status: 'blocked',
      localArtifactDir: safeArtifactDir,
      blockers: envBlockers,
      warnings,
    })
    return result
  }

  for (const candidate of vlmL4CompatibleCandidates) {
    const attempt = await attemptCandidate({ candidate, runId, createdAt, localRoot, safeArtifactDir })
    attempts.push(attempt)
    if (attempt.status === 'passed') {
      const result = await writeCombinedReport({
        runId,
        createdAt,
        selectedCandidate: candidate,
        attempts,
        status: 'passed',
        localArtifactDir: safeArtifactDir,
        privateModelPrefix: attempt.privateModelPrefix,
        privateQaPrefix: attempt.privateQaPrefix,
        imageDigest: attempt.imageDigest,
        blockers: [],
        warnings: attempt.warnings,
      })
      if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
      return result
    }
    warnings.push(...attempt.warnings)
    if (attempt.blockers.some((blocker) => blocker.includes('confirmation_missing') || blocker.includes('source_license'))) break
  }

  const blockers = Array.from(new Set(attempts.flatMap((attempt) => attempt.blockers)))
  const result = await writeCombinedReport({
    runId,
    createdAt,
    attempts,
    status: 'blocked',
    localArtifactDir: safeArtifactDir,
    blockers: blockers.length ? blockers : ['all_l4_compatible_candidates_failed_or_blocked'],
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function attemptCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  createdAt: string
  localRoot: string
  safeArtifactDir: string
}): Promise<VlmL4CandidateAttemptReport> {
  const { candidate, runId, createdAt, localRoot, safeArtifactDir } = input
  const blockers: string[] = []
  const warnings: string[] = []
  const candidateRoot = path.join(localRoot, candidate.slug)
  const modelRoot = path.join(candidateRoot, 'model')
  const privateModelPrefix = candidateModelPrefix(candidate)
  const reportDir = path.join(candidateRoot, 'reports')
  await mkdir(reportDir, { recursive: true })

  const sourceLicense = await verifyCandidateSourceLicense(candidate)
  blockers.push(...sourceLicense.blockers)
  warnings.push(...sourceLicense.warnings)
  await writeCandidatePlanningArtifacts({ candidate, createdAt, runId, reportDir, sourceLicense })
  if (blockers.length) {
    await copySafeCandidateReports(reportDir, safeArtifactDir)
    return candidateAttempt({ candidate, status: 'blocked', sourceLicenseStatus: 'blocked', revisionStatus: 'blocked', privateModelPrefix, blockers, warnings })
  }

  let checksums: VlmL4CandidateFileChecksum[] = []
  let aggregateSha256 = ''
  try {
    checksums = await downloadCandidateFiles(candidate, modelRoot)
    aggregateSha256 = aggregateCandidateSha256(checksums)
    await writeCandidateDownloadArtifacts({ candidate, runId, createdAt, reportDir, checksums, aggregateSha256, privateModelPrefix, blockers, warnings })
  } catch (error) {
    blockers.push(`model_download_failed:${summarizeCommandError(error)}`)
    await writeCandidateDownloadArtifacts({ candidate, runId, createdAt, reportDir, checksums, aggregateSha256, privateModelPrefix, blockers, warnings })
    await copySafeCandidateReports(reportDir, safeArtifactDir)
    return candidateAttempt({ candidate, status: 'blocked', sourceLicenseStatus: 'passed', revisionStatus: 'passed', downloadStatus: 'failed', checksumStatus: checksums.length ? 'passed' : 'skipped', privateModelPrefix, aggregateSha256, blockers, warnings })
  }

  let objectCount = 0
  try {
    const upload = await uploadAndVerifyCandidateFiles({ candidate, checksums, reportDir, privateModelPrefix })
    objectCount = upload.objectCount
    warnings.push(...upload.warnings)
    await copySafeCandidateReports(reportDir, safeArtifactDir)
  } catch (error) {
    blockers.push(`private_gcs_upload_failed:${summarizeCommandError(error)}`)
    await copySafeCandidateReports(reportDir, safeArtifactDir)
    return candidateAttempt({ candidate, status: 'blocked', sourceLicenseStatus: 'passed', revisionStatus: 'passed', downloadStatus: 'passed', checksumStatus: 'passed', privateGcsUploadStatus: 'failed', privateModelPrefix, aggregateSha256, objectCount, blockers, warnings })
  }

  try {
    await applyScopedIamIfConfirmed(candidate, warnings)
  } catch (error) {
    blockers.push(`scoped_iam_apply_failed:${summarizeCommandError(error)}`)
  }
  if (blockers.length) {
    return candidateAttempt({ candidate, status: 'blocked', sourceLicenseStatus: 'passed', revisionStatus: 'passed', downloadStatus: 'passed', checksumStatus: 'passed', privateGcsUploadStatus: 'passed', runtimeStatus: 'blocked', privateModelPrefix, aggregateSha256, objectCount, blockers, warnings })
  }

  let imageRef = ''
  let imageDigest: string | undefined
  try {
    const image = await buildAndPushRuntimeImage(runId, candidate)
    imageRef = image.imageRef
    imageDigest = image.imageDigest
    warnings.push(...image.warnings)
  } catch (error) {
    blockers.push(`runtime_image_build_push_failed:${summarizeCommandError(error)}`)
    await copySafeCandidateReports(reportDir, safeArtifactDir)
    return candidateAttempt({ candidate, status: 'blocked', sourceLicenseStatus: 'passed', revisionStatus: 'passed', downloadStatus: 'passed', checksumStatus: 'passed', privateGcsUploadStatus: 'passed', runtimeStatus: 'blocked', privateModelPrefix, aggregateSha256, objectCount, imageRef, imageDigest, blockers, warnings })
  }

  const privateQaPrefix = `gs://${QA_BUCKET}/${candidateQaObjectPrefix(runId)}`
  let runtimeReport: Record<string, unknown> | undefined
  try {
    const runtime = await runCandidateCloudRunJob({ candidate, runId, imageRef, checksums, aggregateSha256, safeArtifactDir })
    runtimeReport = runtime.runtimeReport
    warnings.push(...runtime.warnings)
    blockers.push(...runtime.blockers)
  } catch (error) {
    blockers.push(`l4_runtime_failed:${summarizeCommandError(error)}`)
  }

  const runtimePassed = Boolean(runtimeReport?.ok) && blockers.length === 0
  return candidateAttempt({
    candidate,
    status: runtimePassed ? 'passed' : 'attempted',
    sourceLicenseStatus: 'passed',
    revisionStatus: 'passed',
    downloadStatus: 'passed',
    checksumStatus: 'passed',
    privateGcsUploadStatus: 'passed',
    runtimeStatus: runtimePassed ? 'passed' : 'failed',
    privateModelPrefix,
    privateQaPrefix,
    aggregateSha256,
    objectCount,
    imageRef,
    imageDigest,
    runtimeReport,
    blockers: runtimePassed ? [] : blockers.length ? blockers : ['generated_runtime_verification_failed'],
    warnings,
  })
}

async function verifyCandidateSourceLicense(candidate: VlmL4Candidate): Promise<{ blockers: string[]; warnings: string[]; metadata?: Record<string, unknown> }> {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!candidate.modelId.startsWith('Qwen/Qwen3-VL-')) blockers.push(`non_qwen_candidate_rejected:${candidate.modelId}`)
  if (String(candidate.modelId) === ORIGINAL_PHASE39B_MODEL_ID) blockers.push('unquantized_8b_bf16_retry_rejected')
  if (candidate.licenseEvidence !== 'Apache-2.0') blockers.push(`license_evidence_not_apache_2:${candidate.modelId}`)
  let metadata: Record<string, unknown> | undefined
  try {
    const response = await fetch(`https://huggingface.co/api/models/${candidate.modelId}/revision/${candidate.revision}`)
    if (!response.ok) throw new Error(`hf_metadata_http_${response.status}`)
    metadata = await response.json() as Record<string, unknown>
    const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : []
    const sha = typeof metadata.sha === 'string' ? metadata.sha : ''
    if (sha !== candidate.revision) blockers.push(`candidate_revision_mismatch:${candidate.modelId}:${sha || 'missing'}`)
    for (const requiredTag of ['safetensors', 'qwen3_vl', 'image-text-to-text', 'license:apache-2.0']) {
      if (!tags.includes(requiredTag)) blockers.push(`candidate_required_tag_missing:${candidate.modelId}:${requiredTag}`)
    }
  } catch (error) {
    blockers.push(`candidate_source_license_metadata_unavailable:${candidate.modelId}:${summarizeCommandError(error)}`)
  }
  warnings.push('Candidate source/license evidence is metadata-based and does not complete production legal approval.')
  return { blockers: Array.from(new Set(blockers)), warnings, metadata }
}

async function downloadCandidateFiles(candidate: VlmL4Candidate, modelRoot: string): Promise<VlmL4CandidateFileChecksum[]> {
  if (process.env.REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD !== 'true') throw new Error('download_confirmation_missing')
  await mkdir(modelRoot, { recursive: true })
  const checksums: VlmL4CandidateFileChecksum[] = []
  for (const file of candidate.selectedFiles) {
    const localPath = path.join(modelRoot, file.relativePath)
    await mkdir(path.dirname(localPath), { recursive: true })
    let fileStat = await stat(localPath).catch(() => undefined)
    if (!fileStat || fileStat.size !== file.sizeBytes) {
      const url = `https://huggingface.co/${candidate.modelId}/resolve/${candidate.revision}/${encodeURI(file.relativePath)}`
      await runCommand('curl', ['--fail', '--location', '--retry', '5', '--retry-delay', '5', '--output', localPath, url], 2 * 60 * 60 * 1000)
      fileStat = await stat(localPath)
    }
    if (fileStat.size !== file.sizeBytes) throw new Error(`download_size_mismatch:${file.relativePath}:expected=${file.sizeBytes}:actual=${fileStat.size}`)
    checksums.push({ ...file, localPath, sha256: await sha256File(localPath) })
  }
  return checksums
}

async function writeCandidatePlanningArtifacts(input: {
  candidate: VlmL4Candidate
  runId: string
  createdAt: string
  reportDir: string
  sourceLicense: { blockers: string[]; warnings: string[]; metadata?: Record<string, unknown> }
}) {
  const { candidate, runId, createdAt, reportDir, sourceLicense } = input
  const selectionReport = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_l4_candidate_selection_report',
    runId,
    createdAt,
    originalPhase39cBlocker: ORIGINAL_PHASE39C_OOM_PREFIX,
    selectedCandidate: candidate.modelId,
    revision: candidate.revision,
    rationale: candidate.rationale,
    candidateOrder: vlmL4CompatibleCandidates.map((item) => item.modelId),
    rejectedCandidates: [],
    sourceLicenseStatus: sourceLicense.blockers.length ? 'blocked' : 'passed',
    blockers: sourceLicense.blockers,
    warnings: sourceLicense.warnings,
  }
  const sourceEvidence = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_source_evidence',
    runId,
    createdAt,
    modelId: candidate.modelId,
    officialOrgRequired: 'Qwen',
    officialOrgSatisfied: candidate.modelId.startsWith('Qwen/'),
    sourceEvidenceUrls: candidate.sourceEvidenceUrls,
    huggingFaceMetadataChecked: Boolean(sourceLicense.metadata),
    metadataSha: typeof sourceLicense.metadata?.sha === 'string' ? sourceLicense.metadata.sha : undefined,
    tags: Array.isArray(sourceLicense.metadata?.tags) ? sourceLicense.metadata.tags : [],
    runtimeEvidence: candidate.runtimeEvidence,
    transformersLimitation: candidate.transformersLimitation,
    blockers: sourceLicense.blockers,
    warnings: sourceLicense.warnings,
  }
  const licenseEvidence = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_license_evidence',
    runId,
    createdAt,
    modelId: candidate.modelId,
    licenseEvidence: candidate.licenseEvidence,
    productionLegalApproval: 'blocked_until_later_gate',
    blockers: sourceLicense.blockers.filter((blocker) => blocker.includes('license')),
    warnings: ['Apache-2.0 evidence is recorded for activation only; production legal approval remains blocked.'],
  }
  const revisionManifest = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_exact_revision_manifest',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    floatingMainAllowed: false,
    status: sourceLicense.blockers.length ? 'blocked' : 'pinned',
  }
  const assetSelection = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_asset_selection_manifest',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    selectedFiles: candidate.selectedFiles,
    selectedFileCount: candidate.selectedFiles.length,
    selectedTotalSizeBytes: candidateTotalSize(candidate),
    excludedFilePatterns: ['.gitattributes', 'demos/', 'images/', 'notebooks/', 'examples/'],
    modelPayloadCommittedToGit: false,
    blockers: sourceLicense.blockers,
  }
  const storagePlan = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_storage_plan',
    runId,
    createdAt,
    privateOnly: true,
    privateModelPrefix: candidateModelPrefix(candidate),
    publicBucketsAllowed: false,
    signedUrlsAllowedAsSourceOfTruth: false,
    modelIdRuntimePathAllowed: false,
  }
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_l4_candidate_selection_report.json'), selectionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_source_evidence.json'), sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_license_evidence.json'), licenseEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_exact_revision_manifest.json'), revisionManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_asset_selection_manifest.json'), assetSelection)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_storage_plan.json'), storagePlan)
}

async function writeCandidateDownloadArtifacts(input: {
  candidate: VlmL4Candidate
  runId: string
  createdAt: string
  reportDir: string
  checksums: readonly VlmL4CandidateFileChecksum[]
  aggregateSha256: string
  privateModelPrefix: string
  blockers: readonly string[]
  warnings: readonly string[]
}) {
  const { candidate, runId, createdAt, reportDir, checksums, aggregateSha256, privateModelPrefix, blockers, warnings } = input
  const checksumManifest = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_checksum_manifest',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    aggregateSha256,
    entries: checksums.map((entry) => ({
      relativePath: entry.relativePath,
      sizeBytes: entry.sizeBytes,
      sha256: entry.sha256,
    })),
    status: checksums.length === candidate.selectedFiles.length && !blockers.length ? 'verified' : 'blocked',
    blockers,
    warnings,
  }
  const treeManifest = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_model_tree_manifest',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    fileCount: checksums.length,
    totalSizeBytes: checksums.reduce((sum, item) => sum + item.sizeBytes, 0),
    files: checksums.map((item) => ({ relativePath: item.relativePath, sizeBytes: item.sizeBytes })),
  }
  const downloadReport = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_model_download_report',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    downloadedFileCount: checksums.length,
    downloadedTotalSizeBytes: checksums.reduce((sum, item) => sum + item.sizeBytes, 0),
    providerApisCalled: false,
    inferenceRun: false,
    blockers,
    warnings,
  }
  const handoff = {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_runtime_handoff_manifest',
    runId,
    createdAt,
    modelId: candidate.modelId,
    revision: candidate.revision,
    privateModelPrefix,
    aggregateSha256,
    expectedAssetsJsonReady: checksums.length === candidate.selectedFiles.length,
    runtimePhase: '39C-Q',
    localVerifiedModelPathOnly: true,
    runtimeAutoDownloadBlocked: true,
  }
  const text = checksums
    .slice()
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256}  ${entry.relativePath}`)
    .join('\n')
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_checksum_manifest.json'), checksumManifest)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_39bq_vlm_file_checksums_sha256.txt'), text)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_model_tree_manifest.json'), treeManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_model_download_report.json'), downloadReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_39bq_vlm_runtime_handoff_manifest.json'), handoff)
}

async function uploadAndVerifyCandidateFiles(input: {
  candidate: VlmL4Candidate
  checksums: readonly VlmL4CandidateFileChecksum[]
  reportDir: string
  privateModelPrefix: string
}): Promise<{ objectCount: number; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD !== 'true') throw new Error('private_gcs_upload_confirmation_missing')
  const warnings: string[] = []
  let objectCount = 0
  for (const file of input.checksums) {
    const target = `${input.privateModelPrefix}${file.relativePath}`
    const existingMetadata = await describeGcsObjectIfPresent(target)
    const existingSize = existingMetadata ? Number(existingMetadata.size ?? existingMetadata.contentLength ?? 0) : 0
    if (existingSize === file.sizeBytes) {
      warnings.push(`private_model_object_reused_after_size_verification:${file.relativePath}:generation=${String(existingMetadata?.generation ?? 'unknown')}`)
    } else {
      await uploadPrivateGcsObject(file.localPath, target)
    }
    const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', target, '--format=json'])) as Record<string, unknown>
    if (Number(metadata.size ?? metadata.contentLength ?? 0) !== file.sizeBytes) throw new Error(`uploaded_object_size_mismatch:${file.relativePath}`)
    objectCount += 1
  }
  const safeReportFiles = [
    'phase_39bq_vlm_l4_candidate_selection_report.json',
    'phase_39bq_vlm_exact_revision_manifest.json',
    'phase_39bq_vlm_asset_selection_manifest.json',
    'phase_39bq_vlm_source_evidence.json',
    'phase_39bq_vlm_license_evidence.json',
    'phase_39bq_vlm_checksum_manifest.json',
    'phase_39bq_vlm_file_checksums_sha256.txt',
    'phase_39bq_vlm_model_tree_manifest.json',
    'phase_39bq_vlm_model_download_report.json',
    'phase_39bq_vlm_runtime_handoff_manifest.json',
  ]
  for (const fileName of safeReportFiles) {
    const local = path.join(input.reportDir, fileName)
    try {
      await stat(local)
      await runGcloud(['storage', 'cp', local, `${input.privateModelPrefix}_reports/${fileName}`], 10 * 60 * 1000)
      objectCount += 1
    } catch {
      warnings.push(`candidate_safe_report_not_uploaded:${fileName}`)
    }
  }
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_39bq_vlm_private_gcs_upload_report.json'), {
    phase: '39B-Q',
    reportId: 'phase_39bq_vlm_private_gcs_upload_report',
    createdAt: new Date().toISOString(),
    modelId: input.candidate.modelId,
    revision: input.candidate.revision,
    privateModelPrefix: input.privateModelPrefix,
    objectCount,
    publicObjects: false,
    signedUrlsCreated: false,
    status: 'verified',
    warnings,
  })
  return { objectCount, warnings }
}

async function uploadPrivateGcsObject(localPath: string, targetGcsUri: string): Promise<void> {
  const local = await stat(localPath)
  if (local.size > 100 * 1024 * 1024) {
    try {
      await runCommand('gsutil', ['cp', localPath, targetGcsUri], 60 * 60 * 1000)
      return
    } catch (gsutilError) {
      try {
        await runGcloud(['storage', 'cp', localPath, targetGcsUri], 10 * 60 * 1000)
        return
      } catch (gcloudError) {
        throw new Error([
          `private_gcs_upload_failed:${targetGcsUri}`,
          `gsutil=${summarizeCommandError(gsutilError)}`,
          `gcloud=${summarizeCommandError(gcloudError)}`,
        ].join(' '), { cause: gcloudError })
      }
    }
  }
  try {
    await runGcloud(['storage', 'cp', localPath, targetGcsUri], 10 * 60 * 1000)
    return
  } catch (gcloudError) {
    try {
      await runCommand('gsutil', ['cp', localPath, targetGcsUri], 60 * 60 * 1000)
      return
    } catch (gsutilError) {
      throw new Error([
        `private_gcs_upload_failed:${targetGcsUri}`,
        `gcloud=${summarizeCommandError(gcloudError)}`,
        `gsutil=${summarizeCommandError(gsutilError)}`,
      ].join(' '), { cause: gsutilError })
    }
  }
}

async function describeGcsObjectIfPresent(gcsUri: string): Promise<Record<string, unknown> | undefined> {
  try {
    return parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
  } catch {
    return undefined
  }
}

async function applyScopedIamIfConfirmed(candidate: VlmL4Candidate, warnings: string[]): Promise<void> {
  if (process.env.REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE !== 'true') {
    warnings.push('scoped_iam_apply_skipped_confirmation_not_set')
    return
  }
  const plan = getVlmL4CompatibleCandidateIamPlan(candidate)
  for (const binding of plan.plans) {
    await runGcloud([
      'storage',
      'buckets',
      'add-iam-policy-binding',
      `gs://${binding.bucket}`,
      `--member=${plan.member}`,
      `--role=${binding.role}`,
      `--condition=title=${binding.conditionTitle},expression=${binding.conditionExpression},description=${binding.description}`,
    ], 10 * 60 * 1000)
  }
  warnings.push('scoped_iam_bindings_applied_for_selected_candidate')
}

async function buildAndPushRuntimeImage(runId: string, candidate: VlmL4Candidate): Promise<{ imageRef: string; imageDigest?: string; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD !== 'true') throw new Error('docker_build_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH !== 'true') throw new Error('docker_push_confirmation_missing')
  const imageRef = `${IMAGE_PATH}:${runId.toLowerCase()}-${candidate.slug}`
  await runCommand('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/amd64',
    '--push',
    '--provenance=false',
    '--sbom=false',
    '-f',
    'docker/prod/vlm-runtime/Dockerfile',
    '-t',
    imageRef,
    '.',
  ], 2 * 60 * 60 * 1000)
  let imageDigest: string | undefined
  const warnings: string[] = [`runtime_image_built_and_pushed:${imageRef}`]
  try {
    const metadata = parseGcloudJson(await runGcloud(['artifacts', 'docker', 'images', 'describe', imageRef, '--format=json'])) as Record<string, unknown>
    imageDigest = typeof metadata.image_summary === 'object' && metadata.image_summary
      ? String((metadata.image_summary as { digest?: unknown }).digest ?? '')
      : typeof metadata.digest === 'string' ? metadata.digest : undefined
  } catch (error) {
    warnings.push(`runtime_image_digest_lookup_failed:${summarizeCommandError(error)}`)
  }
  return { imageRef, imageDigest, warnings }
}

async function runCandidateCloudRunJob(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  checksums: readonly VlmL4CandidateFileChecksum[]
  aggregateSha256: string
  safeArtifactDir: string
}): Promise<{ runtimeReport?: Record<string, unknown>; blockers: string[]; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB !== 'true') throw new Error('cloud_run_job_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE !== 'true') throw new Error('l4_gpu_execute_confirmation_missing')
  const blockers: string[] = []
  const warnings: string[] = []
  const runtimeRunId = `${input.runId}-${input.candidate.slug}`
  const artifactPrefix = candidateQaObjectPrefix(runtimeRunId)
  const expectedAssetsJson = JSON.stringify(input.checksums.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: runtimeRunId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-Q',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39cq',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: input.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: JOB_NAME,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-runtime/phase39cq',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_L4_TUNING_PROFILE_MATRIX: VLM_RUNTIME_L4_TUNING_MATRIX_ID,
    REEDITPRO_VLM_L4_TUNING_PROFILE_IDS: 'conservative-eager-short-context,conservative-cuda-graph-lower-reservation',
    GENERATED_VLM_FIXTURES_ONLY: 'true',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    RAW_VLM_PROMPT_ENABLED: 'false',
    PROVIDER_EXECUTION_ENABLED: 'false',
    MEDIA_PROCESSING_ENABLED: 'false',
    REAL_MEDIA_INPUT_ENABLED: 'false',
    ARBITRARY_MEDIA_INPUT_ENABLED: 'false',
    PUBLIC_OUTPUT_ENABLED: 'false',
    REEDITPRO_PRODUCTION_READY: 'false',
    REEDITPRO_INTERNAL_BETA_READY: 'false',
    REEDITPRO_EXTERNAL_BETA_READY: 'false',
    REEDITPRO_BROAD_REAL_MEDIA_READY: 'false',
    TRACK_A_EXECUTION_ENABLED: 'false',
    VLLM_WORKER_MULTIPROC_METHOD: 'spawn',
    PYTORCH_CUDA_ALLOC_CONF: 'expandable_segments:True',
  })
  await runGcloud([
    'run',
    'jobs',
    'deploy',
    JOB_NAME,
    '--project',
    PROJECT_ID,
    '--region',
    REGION,
    '--image',
    input.imageRef,
    '--service-account',
    GPU_WORKER_SA,
    '--tasks',
    '1',
    '--parallelism',
    '1',
    '--max-retries',
    '0',
    '--task-timeout',
    '3600s',
    '--cpu',
    '8',
    '--memory',
    '32Gi',
    '--gpu',
    '1',
    '--gpu-type',
    'nvidia-l4',
    '--no-gpu-zonal-redundancy',
    '--set-env-vars',
    envVars,
  ], 30 * 60 * 1000)
  try {
    await runGcloud(['run', 'jobs', 'execute', JOB_NAME, '--project', PROJECT_ID, '--region', REGION, '--wait'], 3 * 60 * 60 * 1000)
  } catch (error) {
    blockers.push(`cloud_run_job_nonzero:${summarizeCommandError(error)}`)
  }
  const expectedReports = phase39cqExpectedReports()
  await mkdir(input.safeArtifactDir, { recursive: true })
  for (const fileName of expectedReports) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${fileName}`
    const localPath = path.join(input.safeArtifactDir, fileName)
    try {
      await rm(localPath, { force: true })
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_runtime_artifact_verified:${fileName}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`runtime_artifact_fetch_failed:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.safeArtifactDir, 'phase_39cq_generated_vlm_runtime_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) blockers.push('phase39cq_generated_runtime_report_not_ok')
  } catch (error) {
    blockers.push(`phase39cq_runtime_report_unreadable:${summarizeCommandError(error)}`)
  }
  return { runtimeReport, blockers: Array.from(new Set(blockers)), warnings }
}

async function writeCombinedReport(input: {
  runId: string
  createdAt: string
  selectedCandidate?: VlmL4Candidate
  attempts: readonly VlmL4CandidateAttemptReport[]
  status: 'passed' | 'blocked'
  localArtifactDir: string
  privateModelPrefix?: string
  privateQaPrefix?: string
  imageDigest?: string
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmL4CompatibleCandidateResult> {
  const selectedCandidate = input.selectedCandidate
  const selectedAttempt = selectedCandidate ? input.attempts.find((attempt) => attempt.candidate.modelId === selectedCandidate.modelId) : undefined
  const fullReport = {
    ok: input.status === 'passed',
    phase: '39B-Q/39C-Q',
    reportId: 'phase_39bq_39cq_vlm_l4_candidate_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    sourcePhase39A: { pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/62', commit: '698410e', status: 'approval_planning_passed' },
    sourcePhase39B: {
      modelId: ORIGINAL_PHASE39B_MODEL_ID,
      revision: ORIGINAL_PHASE39B_REVISION,
      status: 'verified_then_l4_runtime_blocked',
      oomEvidencePrefix: ORIGINAL_PHASE39C_OOM_PREFIX,
    },
    sourcePhase39C: {
      pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66',
      status: 'blocked_for_original_bf16_8b',
      blocker: 'vLLM CUDA OOM during engine initialization before generated fixture inference.',
    },
    candidateSelection: input.attempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      revision: attempt.candidate.revision,
      status: attempt.status,
      selected: attempt.selected,
      rationale: attempt.candidate.rationale,
      blockers: attempt.blockers,
      warnings: attempt.warnings,
    })),
    selectedCandidate: selectedCandidate ? {
      modelId: selectedCandidate.modelId,
      revision: selectedCandidate.revision,
      weightProfile: selectedCandidate.weightProfile,
      privateModelPrefix: selectedAttempt?.privateModelPrefix,
      aggregateSha256: selectedAttempt?.aggregateSha256,
      imageDigest: selectedAttempt?.imageDigest,
      privateQaPrefix: selectedAttempt?.privateQaPrefix,
    } : undefined,
    generatedFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({ fixtureId, status: input.status === 'passed' ? 'passed_or_warning_within_policy' : 'blocked_or_not_run' })),
    runtime: selectedAttempt?.runtimeReport ?? { status: 'blocked', reason: 'generated_runtime_verification_not_passed' },
    blockedScopes: blockedScopes(),
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
    nextPhaseDecision: input.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : 'Do not start Phase 39D; use the exact blocker-specific follow-up recorded in this report.',
  }
  await mkdir(input.localArtifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39bq_39cq_vlm_l4_candidate_plan.json'), getVlmL4CompatibleCandidatePlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39bq_39cq_vlm_l4_candidate_recovery_report.json'), fullReport)
  const result: VlmL4CompatibleCandidateResult = {
    runId: input.runId,
    selectedCandidate,
    attempts: input.attempts,
    status: input.status,
    localArtifactDir: input.localArtifactDir,
    privateModelPrefix: input.privateModelPrefix,
    privateQaPrefix: input.privateQaPrefix,
    imageDigest: input.imageDigest,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
  }
  return result
}

function candidateAttempt(input: {
  candidate: VlmL4Candidate
  status: VlmL4CandidateAttemptStatus
  sourceLicenseStatus?: VlmL4CandidateAttemptReport['sourceLicenseStatus']
  revisionStatus?: VlmL4CandidateAttemptReport['revisionStatus']
  downloadStatus?: VlmL4CandidateAttemptReport['downloadStatus']
  checksumStatus?: VlmL4CandidateAttemptReport['checksumStatus']
  privateGcsUploadStatus?: VlmL4CandidateAttemptReport['privateGcsUploadStatus']
  runtimeStatus?: VlmL4CandidateAttemptReport['runtimeStatus']
  privateModelPrefix: string
  privateQaPrefix?: string
  aggregateSha256?: string
  objectCount?: number
  imageRef?: string
  imageDigest?: string
  runtimeReport?: Record<string, unknown>
  blockers: readonly string[]
  warnings: readonly string[]
}): VlmL4CandidateAttemptReport {
  return {
    candidate: input.candidate,
    status: input.status,
    selected: input.status === 'passed',
    sourceLicenseStatus: input.sourceLicenseStatus ?? 'blocked',
    revisionStatus: input.revisionStatus ?? 'blocked',
    downloadStatus: input.downloadStatus ?? 'skipped',
    checksumStatus: input.checksumStatus ?? 'skipped',
    privateGcsUploadStatus: input.privateGcsUploadStatus ?? 'skipped',
    runtimeStatus: input.runtimeStatus ?? 'skipped',
    aggregateSha256: input.aggregateSha256,
    privateModelPrefix: input.privateModelPrefix,
    privateQaPrefix: input.privateQaPrefix,
    objectCount: input.objectCount,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    runtimeReport: input.runtimeReport,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
  }
}

async function copySafeCandidateReports(fromReportDir: string, toArtifactDir: string): Promise<void> {
  await mkdir(toArtifactDir, { recursive: true })
  const files = [
    'phase_39bq_vlm_l4_candidate_selection_report.json',
    'phase_39bq_vlm_exact_revision_manifest.json',
    'phase_39bq_vlm_asset_selection_manifest.json',
    'phase_39bq_vlm_source_evidence.json',
    'phase_39bq_vlm_license_evidence.json',
    'phase_39bq_vlm_storage_plan.json',
    'phase_39bq_vlm_checksum_manifest.json',
    'phase_39bq_vlm_file_checksums_sha256.txt',
    'phase_39bq_vlm_model_tree_manifest.json',
    'phase_39bq_vlm_private_gcs_upload_report.json',
    'phase_39bq_vlm_model_download_report.json',
    'phase_39bq_vlm_runtime_handoff_manifest.json',
  ]
  for (const file of files) {
    try {
      await readFile(path.join(fromReportDir, file))
      await copyFile(path.join(fromReportDir, file), path.join(toArtifactDir, file))
    } catch {
      // Missing reports are expected on early blockers.
    }
  }
}

function validateExecutionEnv(): string[] {
  const required: Record<string, string> = {
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_CONFIRM_VLM_L4_COMPAT_CANDIDATE_APPROVAL: 'true',
    REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH: 'true',
    REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
  }
  const blockers = Object.entries(required)
    .filter(([key, value]) => process.env[key] !== value)
    .map(([key]) => `env_guard_mismatch:${key}`)
  const forbiddenTrue = [
    'RAW_VLM_PROMPT_ENABLED',
    'PROVIDER_EXECUTION_ENABLED',
    'REAL_MEDIA_INPUT_ENABLED',
    'ARBITRARY_MEDIA_INPUT_ENABLED',
    'PUBLIC_OUTPUT_ENABLED',
    'REEDITPRO_PRODUCTION_READY',
    'REEDITPRO_INTERNAL_BETA_READY',
    'REEDITPRO_EXTERNAL_BETA_READY',
    'REEDITPRO_BROAD_REAL_MEDIA_READY',
    'TRACK_A_EXECUTION_ENABLED',
  ]
  for (const key of forbiddenTrue) {
    if (process.env[key] === 'true') blockers.push(`forbidden_env_enabled:${key}`)
  }
  return blockers
}

function aggregateCandidateSha256(checksums: readonly VlmL4CandidateFileChecksum[]): string {
  const lines = checksums
    .slice()
    .sort((a, b) => a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0)
    .map((entry) => `${entry.relativePath} ${entry.sha256} ${entry.sizeBytes}`)
  return createHash('sha256').update(lines.join('\n')).digest('hex')
}

async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function candidateTotalSize(candidate: VlmL4Candidate): number {
  return candidate.selectedFiles.reduce((sum, file) => sum + file.sizeBytes, 0)
}

function candidateObjectPrefix(candidate: VlmL4Candidate): string {
  return `model-weights/qwen3-vl/${candidate.slug}/${candidate.revision}/`
}

function candidateModelPrefix(candidate: VlmL4Candidate): string {
  return `gs://${GENERATED_ASSETS_BUCKET}/${candidateObjectPrefix(candidate)}`
}

function candidateQaObjectPrefix(runId: string): string {
  return `activation/phase39c/generated-vlm-runtime-l4-compatible/${runId}`
}

function phase39cqExpectedReports(): string[] {
  return [
    'phase_39cq_vlm_runtime_plan.json',
    'phase_39cq_vlm_model_asset_verification.json',
    'phase_39cq_generated_fixture_manifest.json',
    'phase_39cq_prompt_template_manifest.json',
    'phase_39cq_vlm_runtime_results.json',
    'phase_39cq_vlm_output_schema_validation_report.json',
    'phase_39cq_vlm_object_region_qa_report.json',
    'phase_39cq_vlm_safe_zone_qa_report.json',
    'phase_39cq_vlm_hallucination_safety_report.json',
    'phase_39cq_vlm_runtime_cost_memory_report.json',
    'phase_39cq_vlm_l4_tuning_matrix_report.json',
    'phase_39cq_private_artifact_manifest.json',
    'phase_39cq_generated_vlm_runtime_report.json',
  ]
}

function blockedScopes(): string[] {
  return [
    'Phase 39D controlled real-frame VLM',
    'Phase 39E object-aware/safe-zone planning integration',
    'provider calls',
    'production',
    'internal beta',
    'external beta',
    'paid production',
    'public output',
    'broad user media',
    'arbitrary media',
    'unapproved GPU types',
    'non-Qwen candidates',
    'community quantizations',
    'Track A',
  ]
}

function serializeEnvVars(values: Record<string, string>): string {
  const delimiter = '@'
  return `^${delimiter}^${Object.entries(values)
    .map(([key, value]) => `${key}=${value.replaceAll(delimiter, '')}`)
    .join(delimiter)}`
}

async function runCommand(command: string, args: string[], timeout: number): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 160 * 1024 * 1024,
    env: {
      ...process.env,
      CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      HF_HUB_DISABLE_TELEMETRY: '1',
    },
  })
  return stdout
}

function summarizeCommandError(error: unknown): string {
  const maybe = error as { message?: string; stderr?: string; stdout?: string }
  const summary = String(maybe?.stderr || maybe?.stdout || maybe?.message || error).replace(/\s+/g, ' ').trim()
  if (summary.length <= 900) return summary
  return `${summary.slice(0, 420)} ... ${summary.slice(-420)}`
}
