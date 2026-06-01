import { execFile } from 'node:child_process'
import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
  type VlmL4Candidate,
  vlmL4CompatibleCandidates,
} from '../vlm-l4-compatible-candidate'
import { parseGcloudJson, runGcloud } from '../vlm-runtime/vlm-runtime-gcs-model-resolver'
import { writeVlmRuntimeJsonArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export type VlmStructuredOutputStatus = 'passed' | 'blocked' | 'skipped'
export type VlmStructuredOutputStrategyId = 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'

export interface VlmStructuredOutputAttempt {
  readonly candidate: VlmL4Candidate
  readonly status: VlmStructuredOutputStatus
  readonly selected: boolean
  readonly manifestStatus: VlmStructuredOutputStatus
  readonly runtimeStatus: VlmStructuredOutputStatus
  readonly bestStrategyId?: VlmStructuredOutputStrategyId
  readonly privateModelPrefix: string
  readonly privateQaPrefix?: string
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly runtimeReport?: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmStructuredOutputResult {
  readonly runId: string
  readonly selectedCandidate?: VlmL4Candidate
  readonly selectedStrategyId?: VlmStructuredOutputStrategyId
  readonly attempts: readonly VlmStructuredOutputAttempt[]
  readonly status: VlmStructuredOutputStatus
  readonly localArtifactDir: string
  readonly privateQaPrefix?: string
  readonly imageDigest?: string
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
  readonly vlmToolFamilyBetaStatus: 'blocked' | 'phase-complete but tool-family incomplete'
}

interface ChecksumManifest {
  readonly modelId: string
  readonly revision: string
  readonly aggregateSha256: string
  readonly entries: readonly {
    readonly relativePath: string
    readonly sizeBytes: number
    readonly sha256: string
  }[]
}

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const ENV = 'staging'
const GENERATED_ASSETS_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
const QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
const GPU_WORKER_SA = 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-structured-output'
const JOB_NAME = 'reeditpro-stg-vlm-runtime-phase39c-structured-output'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-structured-output'
const REPORT_DIR = 'docs/activation-phase-39cq-vlm-structured-output-reports'
const MATRIX_ID = 'phase39c-qwen-structured-output-v1'
const SCHEMA_VERSION = 'phase39c_qwen_vlm_v1'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const ORIGINAL_OOM_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/'
const PR87_QA_PREFIX_PATTERN = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime-l4-compatible/phase39cq-20260531T235421-<candidate-slug>/'

export const VLM_STRUCTURED_OUTPUT_REPORT_DIR = REPORT_DIR
export const VLM_STRUCTURED_OUTPUT_MATRIX_ID = MATRIX_ID

export const vlmStructuredOutputCandidateExecutionOrder = [
  'Qwen/Qwen3-VL-2B-Instruct',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
] as const

export const vlmStructuredOutputCandidateSelectionPriority = [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
] as const

export const vlmStructuredOutputStrategies = [
  {
    id: 'S0',
    name: 'baseline trace only',
    passCounting: false,
    status: 'diagnostic_only',
    description: 'Replays the PR #87 prompt shape to capture safe failure traces. It cannot complete Phase 39C-Q-SO unless it unexpectedly validates and is promoted through another pass-counting strategy.',
  },
  {
    id: 'S1',
    name: 'no-thinking strict prompt',
    passCounting: true,
    status: 'allowed',
    description: 'Uses compact schema instructions, JSON-only prompting, no tools, no prose, no markdown, and prompt-level no-thinking guidance.',
  },
  {
    id: 'S2',
    name: 'OpenAI response_format JSON Schema',
    passCounting: true,
    status: 'conditional',
    description: 'Allowed only when a local loopback OpenAI-compatible vLLM server path is available. Otherwise it is recorded as skipped.',
  },
  {
    id: 'S3',
    name: 'vLLM structured_outputs JSON',
    passCounting: true,
    status: 'allowed',
    description: 'Uses vLLM guided/structured JSON schema support through the installed runtime API.',
  },
  {
    id: 'S4',
    name: 'vLLM grammar',
    passCounting: true,
    status: 'conditional',
    description: 'Uses vLLM grammar decoding only if the installed runtime exposes a supported grammar parameter.',
  },
  {
    id: 'S5',
    name: 'structural tag',
    passCounting: true,
    status: 'conditional',
    description: 'Accepts JSON inside an approved structural tag only if the runtime supports structural tags.',
  },
  {
    id: 'S6',
    name: 'deterministic repair diagnostic only',
    passCounting: false,
    status: 'diagnostic_only',
    description: 'Extracts or repairs simple wrappers for diagnosis only. It never counts as a Phase 39C-Q-SO pass.',
  },
] as const satisfies readonly {
  readonly id: VlmStructuredOutputStrategyId
  readonly name: string
  readonly passCounting: boolean
  readonly status: string
  readonly description: string
}[]

export function getVlmStructuredOutputPlan() {
  return {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    sourceEvidence: {
      phase39cOriginalOom: { pr: PR66_URL, preserved: true, evidencePrefix: ORIGINAL_OOM_PREFIX },
      phase39bq39cqCandidateRecovery: { pr: PR87_URL, preserved: true, privateQaPrefixPattern: PR87_QA_PREFIX_PATTERN },
    },
    candidatePolicy: {
      allowedCandidates: vlmL4CompatibleCandidates.map(candidateSummary),
      executionOrder: vlmStructuredOutputCandidateExecutionOrder,
      selectionPriority: vlmStructuredOutputCandidateSelectionPriority,
      newModelDownloadsAllowed: false,
      modelUploadsAllowed: false,
      communityQuantizationsAllowed: false,
    },
    compactSchema: getVlmStructuredOutputCompactSchema(),
    strategyMatrix: vlmStructuredOutputStrategies,
    execution: {
      privateModelBucket: GENERATED_ASSETS_BUCKET,
      privateQaBucket: QA_BUCKET,
      qaPrefixPattern: 'activation/phase39c/generated-vlm-structured-output/<run-id>/',
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
      arbitraryMediaBlocked: true,
      publicOutputBlocked: true,
      phase39DBlocked: true,
      phase39EBlocked: true,
      betaProductionBlocked: true,
      trackABlocked: true,
    },
    confirmationsRequiredForExecution: [
      'REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN',
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

export function getVlmStructuredOutputIamPlan() {
  const qaPrefix = 'activation/phase39c/generated-vlm-structured-output/'
  return {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmationForMissingScopedBindings: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    notes: [
      'Phase 39C-Q-SO reuses already staged PR #87 model objects and does not add broad bucket or project IAM.',
      'Exact-object runtime copy is driven by PR #87 checksum manifests; listing is not required.',
    ],
    plans: [
      ...vlmL4CompatibleCandidates.map((candidate) => ({
        bindingId: `phase39cq-so-model-read-${candidate.slug}`,
        bucket: GENERATED_ASSETS_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: `phase39cq-so-model-read-${candidate.slug}`,
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${GENERATED_ASSETS_BUCKET}/objects/${candidateObjectPrefix(candidate)}')`,
        description: 'GPU worker may read only the already staged official Qwen candidate objects from PR #87.',
        required: true,
      })),
      {
        bindingId: 'phase39cq-so-qa-create',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39cq-so-qa-create',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may create private Phase 39C-Q-SO QA artifacts only under the approved prefix.',
        required: true,
      },
      {
        bindingId: 'phase39cq-so-qa-readback',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39cq-so-qa-readback',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may read back private Phase 39C-Q-SO QA artifacts only for upload verification.',
        required: true,
      },
    ],
  }
}

export function getVlmStructuredOutputCostSummary() {
  return {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_cost_summary',
    createdAt: new Date().toISOString(),
    cloudRunShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    candidateExecutionOrder: vlmStructuredOutputCandidateExecutionOrder,
    strategyMatrix: MATRIX_ID,
    generatedFixturesOnly: true,
    modelDownloadCost: 'none_new_models_reuse_pr87_private_assets',
    stagingGpuCostRisk: 'bounded_l4_generated_fixture_rerun',
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function buildVlmStructuredOutputStaticReport() {
  return {
    ok: false,
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: getVlmStructuredOutputPlan().sourceEvidence,
    failureTaxonomy: buildPriorFailureTaxonomy(),
    strategyMatrix: vlmStructuredOutputStrategies,
    compactSchema: getVlmStructuredOutputCompactSchema(),
    blockers: ['execution_not_run'],
    vlmToolFamilyBetaStatus: 'blocked',
    blockedScopes: blockedScopes(),
  }
}

export async function runVlmStructuredOutputRecovery(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  safeArtifactDir?: string
}): Promise<VlmStructuredOutputResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-Q-SO structured-output recovery.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39cq-so-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const localRoot = path.join(LOCAL_ROOT, runId)
  const safeArtifactDir = input.safeArtifactDir ?? REPORT_DIR
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  await mkdir(safeArtifactDir, { recursive: true })

  const envBlockers = validateExecutionEnv()
  const attempts: VlmStructuredOutputAttempt[] = []
  const warnings: string[] = []
  if (envBlockers.length) {
    return writeCombinedStructuredOutputReport({
      runId,
      createdAt,
      attempts,
      status: 'blocked',
      localArtifactDir: safeArtifactDir,
      blockers: envBlockers,
      warnings,
    })
  }

  let imageRef: string
  let imageDigest: string | undefined
  try {
    const image = await buildAndPushRuntimeImage(runId)
    imageRef = image.imageRef
    imageDigest = image.imageDigest
    warnings.push(...image.warnings)
  } catch (error) {
    return writeCombinedStructuredOutputReport({
      runId,
      createdAt,
      attempts,
      status: 'blocked',
      localArtifactDir: safeArtifactDir,
      blockers: [`runtime_image_build_push_failed:${summarizeCommandError(error)}`],
      warnings,
    })
  }

  const orderedCandidates = orderedExecutionCandidates()
  for (const candidate of orderedCandidates) {
    const candidateReportDir = path.join(safeArtifactDir, 'candidates', candidate.slug)
    const attempt = await attemptStructuredOutputCandidate({
      candidate,
      runId,
      imageRef,
      imageDigest,
      candidateReportDir,
      localRoot,
    })
    attempts.push(attempt)
    warnings.push(...attempt.warnings)
  }

  const selectedAttempt = selectBestPassingAttempt(attempts)
  const status: VlmStructuredOutputStatus = selectedAttempt ? 'passed' : 'blocked'
  const blockers = status === 'passed'
    ? []
    : Array.from(new Set(attempts.flatMap((attempt) => attempt.blockers))).filter(Boolean)
  const result = await writeCombinedStructuredOutputReport({
    runId,
    createdAt,
    selectedCandidate: selectedAttempt?.candidate,
    selectedStrategyId: selectedAttempt?.bestStrategyId,
    attempts,
    status,
    localArtifactDir: safeArtifactDir,
    privateQaPrefix: selectedAttempt?.privateQaPrefix,
    imageDigest,
    blockers: blockers.length ? blockers : ['no_candidate_passed_structured_output_strategy_matrix'],
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function attemptStructuredOutputCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  imageDigest?: string
  candidateReportDir: string
  localRoot: string
}): Promise<VlmStructuredOutputAttempt> {
  const { candidate, runId, imageRef, imageDigest, candidateReportDir, localRoot } = input
  const warnings: string[] = []
  const blockers: string[] = []
  await mkdir(candidateReportDir, { recursive: true })
  const privateModelPrefix = candidateModelPrefix(candidate)
  let manifest: ChecksumManifest | undefined
  try {
    manifest = await loadPr87ChecksumManifest(candidate, path.join(localRoot, `${candidate.slug}-checksum-manifest.json`))
  } catch (error) {
    blockers.push(`pr87_checksum_manifest_unavailable:${candidate.modelId}:${summarizeCommandError(error)}`)
    return structuredAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const manifestBlockers = validateChecksumManifest(candidate, manifest)
  if (manifestBlockers.length) {
    blockers.push(...manifestBlockers)
    return structuredAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const runtimeRunId = `${runId}-${candidate.slug}`
  const privateQaPrefix = `gs://${QA_BUCKET}/${structuredQaObjectPrefix(runtimeRunId)}/`
  let runtimeReport: Record<string, unknown> | undefined
  try {
    const runtime = await runStructuredOutputCloudRunJob({
      candidate,
      runId: runtimeRunId,
      imageRef,
      manifest,
      candidateReportDir,
    })
    runtimeReport = runtime.runtimeReport
    warnings.push(...runtime.warnings)
    blockers.push(...runtime.blockers)
  } catch (error) {
    blockers.push(`structured_output_l4_runtime_failed:${summarizeCommandError(error)}`)
  }
  const passed = Boolean(runtimeReport?.ok) && blockers.length === 0
  const bestStrategyId = parseStrategyId(runtimeReport?.selectedStrategyId)
  return structuredAttempt({
    candidate,
    status: passed ? 'passed' : 'blocked',
    manifestStatus: 'passed',
    runtimeStatus: passed ? 'passed' : 'blocked',
    privateModelPrefix,
    privateQaPrefix,
    imageRef,
    imageDigest,
    runtimeReport,
    bestStrategyId,
    blockers: passed ? [] : blockers.length ? blockers : ['structured_output_runtime_report_not_ok'],
    warnings,
  })
}

async function runStructuredOutputCloudRunJob(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  manifest: ChecksumManifest
  candidateReportDir: string
}): Promise<{ runtimeReport?: Record<string, unknown>; blockers: string[]; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_STAGING_CLOUD_RUN_JOB !== 'true') throw new Error('cloud_run_job_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE !== 'true') throw new Error('l4_gpu_execute_confirmation_missing')
  const warnings: string[] = []
  const blockers: string[] = []
  const artifactPrefix = structuredQaObjectPrefix(input.runId)
  const expectedAssetsJson = JSON.stringify(input.manifest.entries.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: input.runId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-Q-SO',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39cq',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: input.manifest.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: JOB_NAME,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-runtime/phase39cq-so',
    REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_STRUCTURED_OUTPUT_MATRIX: MATRIX_ID,
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
  await mkdir(input.candidateReportDir, { recursive: true })
  for (const fileName of structuredExpectedReports()) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${fileName}`
    const localPath = path.join(input.candidateReportDir, fileName)
    try {
      await rm(localPath, { force: true })
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_structured_output_artifact_verified:${input.candidate.slug}:${fileName}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`structured_output_artifact_fetch_failed:${input.candidate.slug}:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.candidateReportDir, 'phase_39cq_structured_output_recovery_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) blockers.push(`structured_output_runtime_report_not_ok:${input.candidate.slug}`)
  } catch (error) {
    blockers.push(`structured_output_runtime_report_unreadable:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  return { runtimeReport, blockers: Array.from(new Set(blockers)), warnings }
}

async function writeCombinedStructuredOutputReport(input: {
  runId: string
  createdAt: string
  selectedCandidate?: VlmL4Candidate
  selectedStrategyId?: VlmStructuredOutputStrategyId
  attempts: readonly VlmStructuredOutputAttempt[]
  status: VlmStructuredOutputStatus
  localArtifactDir: string
  privateQaPrefix?: string
  imageDigest?: string
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmStructuredOutputResult> {
  const fullReport = {
    ok: input.status === 'passed',
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    sourceEvidence: getVlmStructuredOutputPlan().sourceEvidence,
    failureTaxonomy: buildPriorFailureTaxonomy(),
    compactSchema: getVlmStructuredOutputCompactSchema(),
    strategyMatrix: vlmStructuredOutputStrategies,
    candidateResults: input.attempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      revision: attempt.candidate.revision,
      status: attempt.status,
      selected: attempt.selected,
      bestStrategyId: attempt.bestStrategyId,
      manifestStatus: attempt.manifestStatus,
      runtimeStatus: attempt.runtimeStatus,
      privateModelPrefix: attempt.privateModelPrefix,
      privateQaPrefix: attempt.privateQaPrefix,
      imageDigest: attempt.imageDigest,
      blockers: attempt.blockers,
      warnings: attempt.warnings,
    })),
    selectedCandidate: input.selectedCandidate ? {
      modelId: input.selectedCandidate.modelId,
      revision: input.selectedCandidate.revision,
      strategyId: input.selectedStrategyId,
      privateQaPrefix: input.privateQaPrefix,
    } : undefined,
    generatedFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({ fixtureId, status: input.status === 'passed' ? 'passed_or_warning_within_policy' : 'blocked_or_not_run' })),
    blockedScopes: blockedScopes(),
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
    nextPhaseDecision: input.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : 'Do not start Phase 39D; use the exact blocker-specific follow-up recorded in this report.',
  }
  await mkdir(input.localArtifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_structured_output_plan.json'), getVlmStructuredOutputPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_structured_output_failure_taxonomy.json'), buildPriorFailureTaxonomy())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_structured_output_schema.json'), getVlmStructuredOutputCompactSchema())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_structured_output_strategy_matrix.json'), {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_strategy_matrix',
    runId: input.runId,
    createdAt: input.createdAt,
    matrixId: MATRIX_ID,
    strategies: vlmStructuredOutputStrategies,
    candidateResults: fullReport.candidateResults,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_structured_output_recovery_report.json'), fullReport)
  return {
    runId: input.runId,
    selectedCandidate: input.selectedCandidate,
    selectedStrategyId: input.selectedStrategyId,
    attempts: input.attempts,
    status: input.status,
    localArtifactDir: input.localArtifactDir,
    privateQaPrefix: input.privateQaPrefix,
    imageDigest: input.imageDigest,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
  }
}

function structuredAttempt(input: {
  candidate: VlmL4Candidate
  status: VlmStructuredOutputStatus
  manifestStatus: VlmStructuredOutputStatus
  runtimeStatus: VlmStructuredOutputStatus
  privateModelPrefix: string
  privateQaPrefix?: string
  imageRef?: string
  imageDigest?: string
  runtimeReport?: Record<string, unknown>
  bestStrategyId?: VlmStructuredOutputStrategyId
  blockers: readonly string[]
  warnings: readonly string[]
}): VlmStructuredOutputAttempt {
  return {
    candidate: input.candidate,
    status: input.status,
    selected: input.status === 'passed',
    manifestStatus: input.manifestStatus,
    runtimeStatus: input.runtimeStatus,
    bestStrategyId: input.bestStrategyId,
    privateModelPrefix: input.privateModelPrefix,
    privateQaPrefix: input.privateQaPrefix,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    runtimeReport: input.runtimeReport,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
  }
}

async function loadPr87ChecksumManifest(candidate: VlmL4Candidate, localPath: string): Promise<ChecksumManifest> {
  const localReport = path.join(REPORT_DIR.replace('39cq-vlm-structured-output', '39bq-39cq-vlm-l4-compatible-candidate'), 'phase_39bq_vlm_checksum_manifest.json')
  try {
    const maybeLocal = JSON.parse(await readFile(localReport, 'utf8')) as ChecksumManifest
    if (maybeLocal.modelId === candidate.modelId && maybeLocal.revision === candidate.revision) return maybeLocal
  } catch {
    // The committed PR #87 report directory only contains the last attempted candidate; fetch exact reports by object path for other candidates.
  }
  await mkdir(path.dirname(localPath), { recursive: true })
  const gcsUri = `${candidateModelPrefix(candidate)}_reports/phase_39bq_vlm_checksum_manifest.json`
  await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
  return JSON.parse(await readFile(localPath, 'utf8')) as ChecksumManifest
}

function validateChecksumManifest(candidate: VlmL4Candidate, manifest: ChecksumManifest): string[] {
  const blockers: string[] = []
  if (manifest.modelId !== candidate.modelId) blockers.push(`manifest_model_id_mismatch:${candidate.modelId}:${manifest.modelId}`)
  if (manifest.revision !== candidate.revision) blockers.push(`manifest_revision_mismatch:${candidate.modelId}:${manifest.revision}`)
  if (!/^[0-9a-f]{64}$/.test(manifest.aggregateSha256)) blockers.push(`manifest_aggregate_sha_invalid:${candidate.modelId}`)
  if (manifest.entries.length !== candidate.selectedFiles.length) blockers.push(`manifest_file_count_mismatch:${candidate.modelId}:${manifest.entries.length}`)
  for (const file of candidate.selectedFiles) {
    const entry = manifest.entries.find((item) => item.relativePath === file.relativePath)
    if (!entry) blockers.push(`manifest_file_missing:${candidate.modelId}:${file.relativePath}`)
    else {
      if (entry.sizeBytes !== file.sizeBytes) blockers.push(`manifest_file_size_mismatch:${candidate.modelId}:${file.relativePath}`)
      if (!/^[0-9a-f]{64}$/.test(entry.sha256)) blockers.push(`manifest_file_sha_invalid:${candidate.modelId}:${file.relativePath}`)
    }
  }
  return blockers
}

async function buildAndPushRuntimeImage(runId: string): Promise<{ imageRef: string; imageDigest?: string; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_BUILD !== 'true') throw new Error('docker_build_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_RUNTIME_DOCKER_PUSH !== 'true') throw new Error('docker_push_confirmation_missing')
  const imageRef = `${IMAGE_PATH}:${runId.toLowerCase()}`
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
  const warnings = [`runtime_image_built_and_pushed:${imageRef}`]
  let imageDigest: string | undefined
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

function validateExecutionEnv(): string[] {
  const required: Record<string, string> = {
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN: 'true',
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
  for (const key of [
    'REEDITPRO_CONFIRM_VLM_L4_COMPAT_MODEL_DOWNLOAD',
    'REEDITPRO_CONFIRM_VLM_L4_COMPAT_PRIVATE_GCS_UPLOAD',
    'RAW_VLM_PROMPT_ENABLED',
    'PROVIDER_EXECUTION_ENABLED',
    'REAL_MEDIA_INPUT_ENABLED',
    'ARBITRARY_MEDIA_INPUT_ENABLED',
    'PUBLIC_OUTPUT_ENABLED',
    'REEDITPRO_PRODUCTION_READY',
    'REEDITPRO_INTERNAL_BETA_READY',
    'REEDITPRO_EXTERNAL_BETA_READY',
    'TRACK_A_EXECUTION_ENABLED',
  ]) {
    if (process.env[key] === 'true') blockers.push(`forbidden_env_enabled:${key}`)
  }
  return blockers
}

function getVlmStructuredOutputCompactSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: SCHEMA_VERSION,
    type: 'object',
    additionalProperties: false,
    required: [
      'fixture_id',
      'candidate_id',
      'prompt_template_id',
      'schema_version',
      'objects',
      'text_like_regions',
      'safe_zone_suggestions',
      'spatial_relations',
      'uncertainty',
      'blocked_actions',
    ],
    properties: {
      fixture_id: { type: 'string', minLength: 1, maxLength: 80 },
      candidate_id: { type: 'string', enum: vlmL4CompatibleCandidates.map((candidate) => candidate.modelId) },
      prompt_template_id: { type: 'string', minLength: 1, maxLength: 120 },
      schema_version: { const: SCHEMA_VERSION },
      objects: { type: 'array', maxItems: 12, items: regionItemSchema() },
      text_like_regions: { type: 'array', maxItems: 12, items: regionItemSchema() },
      safe_zone_suggestions: {
        type: 'array',
        maxItems: 8,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['zone_id', 'box', 'confidence', 'status', 'reason'],
          properties: {
            zone_id: { type: 'string', minLength: 1, maxLength: 80 },
            box: normalizedBoxSchema(),
            confidence: confidenceSchema(),
            status: { enum: ['pass', 'warn', 'block'] },
            reason: { type: 'string', minLength: 1, maxLength: 180 },
          },
        },
      },
      spatial_relations: {
        type: 'array',
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['relation', 'confidence', 'evidence'],
          properties: {
            relation: { type: 'string', minLength: 1, maxLength: 160 },
            confidence: confidenceSchema(),
            evidence: { type: 'string', minLength: 1, maxLength: 180 },
          },
        },
      },
      uncertainty: {
        type: 'object',
        additionalProperties: false,
        required: ['confidence', 'manual_review_required', 'reason'],
        properties: {
          confidence: confidenceSchema(),
          manual_review_required: { type: 'boolean' },
          reason: { type: 'string', minLength: 1, maxLength: 180 },
        },
      },
      blocked_actions: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 120 } },
    },
  }
}

function regionItemSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'confidence', 'box', 'evidence'],
    properties: {
      label: { type: 'string', minLength: 1, maxLength: 80 },
      confidence: confidenceSchema(),
      box: normalizedBoxSchema(),
      evidence: { type: 'string', minLength: 1, maxLength: 180 },
    },
  }
}

function normalizedBoxSchema() {
  return {
    type: 'array',
    minItems: 4,
    maxItems: 4,
    items: confidenceSchema(),
  }
}

function confidenceSchema() {
  return { type: 'number', minimum: 0, maximum: 1 }
}

function buildPriorFailureTaxonomy() {
  return {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_failure_taxonomy',
    createdAt: new Date().toISOString(),
    sourcePr: PR87_URL,
    privateQaPrefixPattern: PR87_QA_PREFIX_PATTERN,
    committedRawOutputs: false,
    summary: 'PR #87 reached generated vLLM output generation for all official Qwen L4-compatible candidates, but every required generated fixture failed direct JSON parsing and schema validation.',
    categories: [
      'output_json_parse_failed',
      'output_schema_invalid',
      'direct_json_required_not_met',
    ],
    candidates: vlmL4CompatibleCandidates.map((candidate) => ({
      modelId: candidate.modelId,
      revision: candidate.revision,
      status: 'blocked_in_pr87',
      fixtureFailures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({
        fixtureId,
        categories: ['output_json_parse_failed', 'output_schema_invalid'],
      })),
    })),
  }
}

function orderedExecutionCandidates(): VlmL4Candidate[] {
  return vlmStructuredOutputCandidateExecutionOrder
    .map((modelId) => vlmL4CompatibleCandidates.find((candidate) => candidate.modelId === modelId))
    .filter((candidate): candidate is VlmL4Candidate => Boolean(candidate))
}

function selectBestPassingAttempt(attempts: readonly VlmStructuredOutputAttempt[]): VlmStructuredOutputAttempt | undefined {
  const passed = attempts.filter((attempt) => attempt.status === 'passed')
  if (!passed.length) return undefined
  return passed.slice().sort((a, b) => (
    vlmStructuredOutputCandidateSelectionPriority.indexOf(a.candidate.modelId) - vlmStructuredOutputCandidateSelectionPriority.indexOf(b.candidate.modelId)
  ))[0]
}

function parseStrategyId(value: unknown): VlmStructuredOutputStrategyId | undefined {
  return vlmStructuredOutputStrategies.some((strategy) => strategy.id === value)
    ? value as VlmStructuredOutputStrategyId
    : undefined
}

function candidateSummary(candidate: VlmL4Candidate) {
  return {
    modelId: candidate.modelId,
    slug: candidate.slug,
    revision: candidate.revision,
    privateModelPrefix: candidateModelPrefix(candidate),
    selectedFileCount: candidate.selectedFiles.length,
    selectedTotalSizeBytes: candidate.selectedFiles.reduce((sum, file) => sum + file.sizeBytes, 0),
  }
}

function candidateObjectPrefix(candidate: VlmL4Candidate): string {
  return `model-weights/qwen3-vl/${candidate.slug}/${candidate.revision}/`
}

function candidateModelPrefix(candidate: VlmL4Candidate): string {
  return `gs://${GENERATED_ASSETS_BUCKET}/${candidateObjectPrefix(candidate)}`
}

function structuredQaObjectPrefix(runId: string): string {
  return `activation/phase39c/generated-vlm-structured-output/${runId}`
}

function structuredExpectedReports(): string[] {
  return [
    'phase_39cq_structured_output_plan.json',
    'phase_39cq_structured_output_failure_taxonomy.json',
    'phase_39cq_structured_output_schema.json',
    'phase_39cq_structured_output_strategy_matrix.json',
    'phase_39cq_structured_output_prompt_template_manifest.json',
    'phase_39cq_candidate_trace_manifest.json',
    'phase_39cq_candidate_strategy_results.json',
    'phase_39cq_selected_candidate_report.json',
    'phase_39cq_generated_fixture_manifest.json',
    'phase_39cq_vlm_runtime_results.json',
    'phase_39cq_output_schema_validation_report.json',
    'phase_39cq_object_region_qa_report.json',
    'phase_39cq_safe_zone_qa_report.json',
    'phase_39cq_hallucination_safety_report.json',
    'phase_39cq_private_artifact_manifest.json',
    'phase_39cq_structured_output_recovery_report.json',
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
