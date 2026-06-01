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

export type VlmStructuredOutputCompatStatus = 'passed' | 'blocked' | 'skipped'
export type VlmStructuredOutputCompatSchemaId = 'T0' | 'T1' | 'T2'
export type VlmStructuredOutputCompatStrategyId =
  | 'O1'
  | 'O2'
  | 'O3'
  | 'O4'
  | 'O5'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'D1'

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

export interface VlmStructuredOutputCompatAttempt {
  readonly candidate: VlmL4Candidate
  readonly status: VlmStructuredOutputCompatStatus
  readonly selected: boolean
  readonly manifestStatus: VlmStructuredOutputCompatStatus
  readonly runtimeStatus: VlmStructuredOutputCompatStatus
  readonly bestStrategyId?: VlmStructuredOutputCompatStrategyId
  readonly privateModelPrefix: string
  readonly privateQaPrefix?: string
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly runtimeReport?: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmStructuredOutputCompatResult {
  readonly runId: string
  readonly selectedCandidate?: VlmL4Candidate
  readonly selectedStrategyId?: VlmStructuredOutputCompatStrategyId
  readonly attempts: readonly VlmStructuredOutputCompatAttempt[]
  readonly status: VlmStructuredOutputCompatStatus
  readonly localArtifactDir: string
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
const IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-structured-output-compat'
const JOB_NAME = 'reeditpro-stg-vlm-runtime-phase39c-structured-output-compat'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-structured-output-compat'
const REPORT_DIR = 'docs/activation-phase-39cq-so2-vllm-structured-output-compat-reports'
const MATRIX_ID = 'phase39c-qwen-so2-vllm-api-compat-v1'
const COMPACT_SCHEMA_VERSION = 'phase39c_qwen_vlm_compact_v1'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const PR90_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90'
const PR66_OOM_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T214216/'
const PR90_PRIVATE_TRACE_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-structured-output/phase39cq-so-20260601T041325-qwen3-vl-2b-instruct/'

export const VLM_STRUCTURED_OUTPUT_COMPAT_REPORT_DIR = REPORT_DIR
export const VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX_ID = MATRIX_ID

export const vlmStructuredOutputCompatCandidateExecutionOrder = [
  'Qwen/Qwen3-VL-2B-Instruct',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
] as const

export const vlmStructuredOutputCompatCandidateSelectionPriority = [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
] as const

export const vlmStructuredOutputCompatSchemas = [
  {
    id: 'T0',
    name: 'choice enum smoke',
    passCounting: false,
    description: 'Text-only enum-shaped JSON smoke. It proves a guided backend can constrain a tiny answer but never completes Phase 39C-Q-SO2.',
    schema: t0ChoiceSchema(),
  },
  {
    id: 'T1',
    name: 'tiny JSON object',
    passCounting: false,
    description: 'Text-only minimal status/confidence/reason object for structured-output backend probing.',
    schema: t1TinyJsonSchema(),
  },
  {
    id: 'T2',
    name: 'compact VLM QA schema',
    passCounting: true,
    description: 'Compact generated-fixture schema used for full Phase 39C-Q-SO2 image QA after text-only backend proof.',
    schema: compactVlmQaSchema(),
  },
] as const satisfies readonly {
  readonly id: VlmStructuredOutputCompatSchemaId
  readonly name: string
  readonly passCounting: boolean
  readonly description: string
  readonly schema: Record<string, unknown>
}[]

export const vlmStructuredOutputCompatStrategies = [
  {
    id: 'O1',
    name: 'OpenAI loopback response_format json_schema',
    passCounting: true,
    backend: 'localhost_openai_response_format',
    description: 'Localhost-only vLLM OpenAI-compatible server request with response_format json_schema.',
  },
  {
    id: 'O2',
    name: 'OpenAI loopback structured_outputs json',
    passCounting: true,
    backend: 'localhost_openai_structured_outputs_json',
    description: 'Localhost-only vLLM OpenAI-compatible request with structured_outputs JSON in the request body where supported.',
  },
  {
    id: 'O3',
    name: 'OpenAI loopback structured_outputs grammar',
    passCounting: true,
    backend: 'localhost_openai_structured_outputs_grammar',
    description: 'Localhost-only vLLM OpenAI-compatible grammar-constrained JSON request where supported.',
  },
  {
    id: 'O4',
    name: 'OpenAI loopback structural tag',
    passCounting: true,
    backend: 'localhost_openai_structural_tag',
    description: 'Localhost-only structural-tag protocol that counts only if the final JSON validates directly.',
  },
  {
    id: 'O5',
    name: 'OpenAI loopback strict prompt diagnostic',
    passCounting: false,
    backend: 'localhost_openai_strict_prompt',
    description: 'Strict prompt-only loopback diagnostic. It cannot make SO2 pass by itself.',
  },
  {
    id: 'F1',
    name: 'offline StructuredOutputsParams json',
    passCounting: true,
    backend: 'offline_structured_outputs_json',
    description: 'Offline vLLM LLM path using StructuredOutputsParams(json=...).',
  },
  {
    id: 'F2',
    name: 'offline StructuredOutputsParams grammar',
    passCounting: true,
    backend: 'offline_structured_outputs_grammar',
    description: 'Offline vLLM LLM path using StructuredOutputsParams(grammar=...) where installed runtime supports it.',
  },
  {
    id: 'F3',
    name: 'offline Structural tag',
    passCounting: true,
    backend: 'offline_structural_tag',
    description: 'Offline structural-tag protocol that counts only when installed runtime support and direct validation both pass.',
  },
  {
    id: 'F4',
    name: 'offline strict prompt diagnostic',
    passCounting: false,
    backend: 'offline_strict_prompt',
    description: 'Strict prompt-only offline diagnostic. It cannot make SO2 pass by itself.',
  },
  {
    id: 'D1',
    name: 'deterministic repair diagnostic',
    passCounting: false,
    backend: 'diagnostic_repair',
    description: 'Extract/repair taxonomy only. It never counts as a generated runtime verification pass.',
  },
] as const satisfies readonly {
  readonly id: VlmStructuredOutputCompatStrategyId
  readonly name: string
  readonly passCounting: boolean
  readonly backend: string
  readonly description: string
}[]

export function getVlmStructuredOutputCompatPlan() {
  return {
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_vllm_structured_output_compat_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    sourceEvidence: {
      phase39cOriginalOom: { pr: PR66_URL, preserved: true, evidencePrefix: PR66_OOM_PREFIX },
      phase39bq39cqCandidateRecovery: { pr: PR87_URL, preserved: true, candidatesOnly: true },
      phase39cqStructuredOutputAttempt: { pr: PR90_URL, preserved: true, privateTracePrefix: PR90_PRIVATE_TRACE_PREFIX },
    },
    candidatePolicy: {
      allowedCandidates: vlmL4CompatibleCandidates.map(candidateSummary),
      executionOrder: vlmStructuredOutputCompatCandidateExecutionOrder,
      selectionPriority: vlmStructuredOutputCompatCandidateSelectionPriority,
      newModelDownloadsAllowed: false,
      modelUploadsAllowed: false,
      modelIdRuntimePathAllowed: false,
      communityQuantizationsAllowed: false,
      nonQwenCandidatesAllowed: false,
    },
    capabilityIntrospection: {
      installedRuntimeMustBeProbed: true,
      docsOnlyEvidenceAccepted: false,
      probes: [
        'vllm version and package path',
        'StructuredOutputsParams import and constructor support',
        'xgrammar/guidance/outlines/lm-format-enforcer availability',
        'vLLM OpenAI server help and localhost model list',
        'response_format json_schema acceptance',
        'extra_body structured_outputs json acceptance',
        'grammar and structural_tag support',
      ],
    },
    schemas: vlmStructuredOutputCompatSchemas,
    strategies: vlmStructuredOutputCompatStrategies,
    escalationPolicy: {
      textOnlyHarnessFirst: true,
      imageSmokeRequiresTextOnlyPass: true,
      fullGeneratedFixtureQaRequiresAllFixtures: true,
      diagnosticRepairCountsAsPass: false,
      requiredGeneratedFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
    },
    execution: {
      privateModelBucket: GENERATED_ASSETS_BUCKET,
      privateQaBucket: QA_BUCKET,
      qaPrefixPattern: 'activation/phase39c/generated-vlm-structured-output-compat/<run-id>/',
      imagePath: IMAGE_PATH,
      cloudRunJob: JOB_NAME,
      gpu: '1 x nvidia-l4',
      cpu: 8,
      memory: '32Gi',
      generatedFixturesOnly: true,
      localVerifiedModelPathOnly: true,
      runtimeAutoDownloadBlocked: true,
      providerCallsBlocked: true,
      externalApiCallsBlocked: true,
      localLoopbackOnlyInsideJob: true,
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
      'REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_COMPAT_DEBUG',
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

export function getVlmStructuredOutputCompatIamPlan() {
  const qaPrefix = 'activation/phase39c/generated-vlm-structured-output-compat/'
  return {
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_vllm_structured_output_compat_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmationForMissingScopedBindings: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    modelReadBindings: vlmL4CompatibleCandidates.map((candidate) => ({
      bindingId: `phase39cq-so2-model-read-${candidate.slug}`,
      bucket: GENERATED_ASSETS_BUCKET,
      role: 'roles/storage.objectViewer',
      conditionTitle: `phase39cq-so2-model-read-${candidate.slug}`,
      conditionExpression: `resource.name.startsWith('projects/_/buckets/${GENERATED_ASSETS_BUCKET}/objects/${candidateObjectPrefix(candidate)}')`,
      description: 'GPU worker may read only the already staged PR #87 official Qwen candidate objects.',
      required: true,
    })),
    qaBindings: [
      {
        bindingId: 'phase39cq-so2-qa-create',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39cq-so2-qa-create',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may create private SO2 artifacts only under the approved compatibility prefix.',
        required: true,
      },
      {
        bindingId: 'phase39cq-so2-qa-readback',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39cq-so2-qa-readback',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may read back private SO2 artifacts only for upload verification.',
        required: true,
      },
    ],
    notes: [
      'Phase 39C-Q-SO2 reuses already staged PR #87 model objects and does not add broad bucket or project IAM.',
      'Exact-object runtime copy is driven by PR #87 checksum manifests; bucket listing is not required.',
      'Local OpenAI-compatible calls are localhost-only inside the Cloud Run job and never provider calls.',
    ],
  }
}

export function getVlmStructuredOutputCompatCostSummary() {
  return {
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_vllm_structured_output_compat_cost_summary',
    createdAt: new Date().toISOString(),
    cloudRunShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    candidateExecutionOrder: vlmStructuredOutputCompatCandidateExecutionOrder,
    compatibilityMatrix: MATRIX_ID,
    modelDownloadCost: 'none_new_models_reuse_pr87_private_assets',
    stagingGpuCostRisk: 'bounded_l4_structured_output_debug',
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function buildVlmStructuredOutputCompatStaticReport() {
  return {
    ok: false,
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_structured_output_compat_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: getVlmStructuredOutputCompatPlan().sourceEvidence,
    failureTaxonomy: buildFailureTaxonomy(),
    capabilityIntrospection: { status: 'blocked', reason: 'execution_not_run' },
    textOnlyHarness: { status: 'blocked', reason: 'execution_not_run' },
    openAiLoopback: { status: 'blocked', reason: 'execution_not_run' },
    offlineStructuredOutputs: { status: 'blocked', reason: 'execution_not_run' },
    candidateResults: [],
    blockers: ['execution_not_run'],
    vlmToolFamilyBetaStatus: 'blocked',
    blockedScopes: blockedScopes(),
  }
}

export async function runVlmStructuredOutputCompatDebug(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  safeArtifactDir?: string
}): Promise<VlmStructuredOutputCompatResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-Q-SO2 structured-output compatibility debug.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39cq-so2-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const localRoot = path.join(LOCAL_ROOT, runId)
  const safeArtifactDir = input.safeArtifactDir ?? REPORT_DIR
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  await mkdir(safeArtifactDir, { recursive: true })

  const envBlockers = validateExecutionEnv()
  const attempts: VlmStructuredOutputCompatAttempt[] = []
  const warnings: string[] = []
  if (envBlockers.length) {
    return writeCombinedCompatReport({
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
    return writeCombinedCompatReport({
      runId,
      createdAt,
      attempts,
      status: 'blocked',
      localArtifactDir: safeArtifactDir,
      blockers: [`runtime_image_build_push_failed:${summarizeCommandError(error)}`],
      warnings,
    })
  }

  for (const candidate of orderedExecutionCandidates()) {
    const candidateReportDir = path.join(safeArtifactDir, 'candidates', candidate.slug)
    const attempt = await attemptCompatCandidate({
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
  const status: VlmStructuredOutputCompatStatus = selectedAttempt ? 'passed' : 'blocked'
  const blockers = status === 'passed'
    ? []
    : Array.from(new Set(attempts.flatMap((attempt) => attempt.blockers))).filter(Boolean)
  const result = await writeCombinedCompatReport({
    runId,
    createdAt,
    selectedCandidate: selectedAttempt?.candidate,
    selectedStrategyId: selectedAttempt?.bestStrategyId,
    attempts,
    status,
    localArtifactDir: safeArtifactDir,
    privateQaPrefix: selectedAttempt?.privateQaPrefix,
    imageDigest,
    blockers: blockers.length ? blockers : ['no_candidate_passed_structured_output_compat_matrix'],
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function attemptCompatCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  imageDigest?: string
  candidateReportDir: string
  localRoot: string
}): Promise<VlmStructuredOutputCompatAttempt> {
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
    return compatAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const manifestBlockers = validateChecksumManifest(candidate, manifest)
  if (manifestBlockers.length) {
    blockers.push(...manifestBlockers)
    return compatAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const runtimeRunId = `${runId}-${candidate.slug}`
  const privateQaPrefix = `gs://${QA_BUCKET}/${compatQaObjectPrefix(runtimeRunId)}/`
  let runtimeReport: Record<string, unknown> | undefined
  try {
    const runtime = await runCompatCloudRunJob({
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
    blockers.push(`structured_output_compat_l4_runtime_failed:${summarizeCommandError(error)}`)
  }
  const passed = Boolean(runtimeReport?.ok) && blockers.length === 0
  const bestStrategyId = parseStrategyId(runtimeReport?.selectedStrategyId)
  return compatAttempt({
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
    blockers: passed ? [] : blockers.length ? blockers : ['structured_output_compat_runtime_report_not_ok'],
    warnings,
  })
}

async function runCompatCloudRunJob(input: {
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
  const artifactPrefix = compatQaObjectPrefix(input.runId)
  const expectedAssetsJson = JSON.stringify(input.manifest.entries.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: input.runId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-Q-SO2',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39cq_so2',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: input.manifest.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: JOB_NAME,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-runtime/phase39cq-so2',
    REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_COMPAT_DEBUG: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_STRUCTURED_OUTPUT_COMPAT_MATRIX: MATRIX_ID,
    GENERATED_VLM_FIXTURES_ONLY: 'true',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    RAW_VLM_PROMPT_ENABLED: 'false',
    PROVIDER_EXECUTION_ENABLED: 'false',
    EXTERNAL_API_CALLS_ENABLED: 'false',
    LOCAL_OPENAI_LOOPBACK_ONLY: 'true',
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
  for (const fileName of compatExpectedReports()) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${fileName}`
    const localPath = path.join(input.candidateReportDir, fileName)
    try {
      await rm(localPath, { force: true })
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_structured_output_compat_artifact_verified:${input.candidate.slug}:${fileName}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`structured_output_compat_artifact_fetch_failed:${input.candidate.slug}:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.candidateReportDir, 'phase_39cq_so2_structured_output_compat_recovery_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) blockers.push(`structured_output_compat_runtime_report_not_ok:${input.candidate.slug}`)
  } catch (error) {
    blockers.push(`structured_output_compat_runtime_report_unreadable:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  return { runtimeReport, blockers: Array.from(new Set(blockers)), warnings }
}

async function writeCombinedCompatReport(input: {
  runId: string
  createdAt: string
  selectedCandidate?: VlmL4Candidate
  selectedStrategyId?: VlmStructuredOutputCompatStrategyId
  attempts: readonly VlmStructuredOutputCompatAttempt[]
  status: VlmStructuredOutputCompatStatus
  localArtifactDir: string
  privateQaPrefix?: string
  imageDigest?: string
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmStructuredOutputCompatResult> {
  const fullReport = {
    ok: input.status === 'passed',
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_structured_output_compat_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    sourceEvidence: getVlmStructuredOutputCompatPlan().sourceEvidence,
    capabilityIntrospectionRequired: true,
    failureTaxonomy: buildFailureTaxonomy(),
    schemas: vlmStructuredOutputCompatSchemas,
    strategies: vlmStructuredOutputCompatStrategies,
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
    generatedFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({
      fixtureId,
      status: input.status === 'passed' ? 'passed_or_warning_within_policy' : 'blocked_or_not_run',
    })),
    blockedScopes: blockedScopes(),
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
    nextPhaseDecision: input.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : 'Do not start Phase 39D; use the exact structured-output blocker-specific follow-up recorded in this report.',
  }
  await mkdir(input.localArtifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so2_vllm_structured_output_compat_plan.json'), getVlmStructuredOutputCompatPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so2_failure_taxonomy_update.json'), buildFailureTaxonomy())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so2_candidate_strategy_matrix.json'), {
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_candidate_strategy_matrix',
    runId: input.runId,
    createdAt: input.createdAt,
    matrixId: MATRIX_ID,
    schemas: vlmStructuredOutputCompatSchemas,
    strategies: vlmStructuredOutputCompatStrategies,
    candidateResults: fullReport.candidateResults,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so2_structured_output_compat_recovery_report.json'), fullReport)
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

function compatAttempt(input: {
  candidate: VlmL4Candidate
  status: VlmStructuredOutputCompatStatus
  manifestStatus: VlmStructuredOutputCompatStatus
  runtimeStatus: VlmStructuredOutputCompatStatus
  privateModelPrefix: string
  privateQaPrefix?: string
  imageRef?: string
  imageDigest?: string
  runtimeReport?: Record<string, unknown>
  bestStrategyId?: VlmStructuredOutputCompatStrategyId
  blockers: readonly string[]
  warnings: readonly string[]
}): VlmStructuredOutputCompatAttempt {
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
  const localReport = path.join('docs/activation-phase-39bq-39cq-vlm-l4-compatible-candidate-reports', 'phase_39bq_vlm_checksum_manifest.json')
  try {
    const maybeLocal = JSON.parse(await readFile(localReport, 'utf8')) as ChecksumManifest
    if (maybeLocal.modelId === candidate.modelId && maybeLocal.revision === candidate.revision) return maybeLocal
  } catch {
    // The committed PR #87 report directory may contain only the last attempted candidate; fetch exact reports by object path for other candidates.
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
    REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_COMPAT_DEBUG: 'true',
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
    'REEDITPRO_CONFIRM_VLM_STRUCTURED_OUTPUT_RERUN',
    'RAW_VLM_PROMPT_ENABLED',
    'PROVIDER_EXECUTION_ENABLED',
    'EXTERNAL_API_CALLS_ENABLED',
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

function t0ChoiceSchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'phase39cq_so2_t0_choice',
    type: 'object',
    additionalProperties: false,
    required: ['decision'],
    properties: { decision: { enum: ['pass', 'fail'] } },
  }
}

function t1TinyJsonSchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'phase39cq_so2_t1_tiny_json',
    type: 'object',
    additionalProperties: false,
    required: ['status', 'confidence', 'reason'],
    properties: {
      status: { enum: ['pass', 'warn', 'block'] },
      confidence: confidenceSchema(),
      reason: { type: 'string', minLength: 1, maxLength: 160 },
    },
  }
}

function compactVlmQaSchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: COMPACT_SCHEMA_VERSION,
    type: 'object',
    additionalProperties: false,
    required: [
      'fixture_id',
      'candidate_id',
      'schema_version',
      'objects',
      'text_like_regions',
      'safe_zone_suggestions',
      'uncertainty',
      'blocked_actions',
    ],
    properties: {
      fixture_id: { type: 'string', minLength: 1, maxLength: 80 },
      candidate_id: { type: 'string', enum: vlmL4CompatibleCandidates.map((candidate) => candidate.modelId) },
      schema_version: { const: COMPACT_SCHEMA_VERSION },
      objects: { type: 'array', maxItems: 10, items: regionItemSchema() },
      text_like_regions: { type: 'array', maxItems: 8, items: regionItemSchema() },
      safe_zone_suggestions: {
        type: 'array',
        maxItems: 6,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['zone_id', 'box', 'confidence', 'status'],
          properties: {
            zone_id: { type: 'string', minLength: 1, maxLength: 80 },
            box: normalizedBoxSchema(),
            confidence: confidenceSchema(),
            status: { enum: ['pass', 'warn', 'block'] },
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
          reason: { type: 'string', minLength: 1, maxLength: 160 },
        },
      },
      blocked_actions: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 120 } },
    },
  }
}

function regionItemSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'confidence', 'box'],
    properties: {
      label: { type: 'string', minLength: 1, maxLength: 80 },
      confidence: confidenceSchema(),
      box: normalizedBoxSchema(),
    },
  }
}

function normalizedBoxSchema(): Record<string, unknown> {
  return { type: 'array', minItems: 4, maxItems: 4, items: confidenceSchema() }
}

function confidenceSchema(): Record<string, unknown> {
  return { type: 'number', minimum: 0, maximum: 1 }
}

function buildFailureTaxonomy() {
  return {
    phase: '39C-Q-SO2',
    reportId: 'phase_39cq_so2_failure_taxonomy_update',
    createdAt: new Date().toISOString(),
    sourcePr90: PR90_URL,
    privateTracePrefix: PR90_PRIVATE_TRACE_PREFIX,
    committedFullRawOutputs: false,
    summary: 'PR #90 reached generated output for the 2B candidate but did not prove installed vLLM structured-output API compatibility across all required generated fixtures.',
    priorCategories: [
      'direct_json_object_required',
      'output_json_parse_failed',
      'fixture_id_mismatch',
      'candidate_id_mismatch',
      'safe_zone_unknown',
      'object_region_qa_failed',
      'structured_output_strategy_matrix_exhausted',
      '4b_8b_fp8_final_direct_constructor_retries_cancelled_no_safe_artifacts',
    ],
    currentHypotheses: [
      'OpenAI response_format json_schema support may differ from offline constructor support.',
      'StructuredOutputsParams may be importable but not accepted for multimodal Qwen prompts.',
      'Qwen no-thinking controls may not have been applied through the actual chat template path.',
      'The compact fixture schema may still be too broad before text-only compatibility is proven.',
    ],
  }
}

function orderedExecutionCandidates(): VlmL4Candidate[] {
  return vlmStructuredOutputCompatCandidateExecutionOrder
    .map((modelId) => vlmL4CompatibleCandidates.find((candidate) => candidate.modelId === modelId))
    .filter((candidate): candidate is VlmL4Candidate => Boolean(candidate))
}

function selectBestPassingAttempt(attempts: readonly VlmStructuredOutputCompatAttempt[]): VlmStructuredOutputCompatAttempt | undefined {
  const passed = attempts.filter((attempt) => attempt.status === 'passed')
  if (!passed.length) return undefined
  return passed.slice().sort((a, b) => (
    vlmStructuredOutputCompatCandidateSelectionPriority.indexOf(a.candidate.modelId) - vlmStructuredOutputCompatCandidateSelectionPriority.indexOf(b.candidate.modelId)
  ))[0]
}

function parseStrategyId(value: unknown): VlmStructuredOutputCompatStrategyId | undefined {
  return vlmStructuredOutputCompatStrategies.some((strategy) => strategy.id === value)
    ? value as VlmStructuredOutputCompatStrategyId
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

function compatQaObjectPrefix(runId: string): string {
  return `activation/phase39c/generated-vlm-structured-output-compat/${runId}`
}

function compatExpectedReports(): string[] {
  return [
    'phase_39cq_so2_vllm_structured_output_compat_plan.json',
    'phase_39cq_so2_vllm_structured_output_capability_report.json',
    'phase_39cq_so2_failure_taxonomy_update.json',
    'phase_39cq_so2_text_only_structured_output_harness.json',
    'phase_39cq_so2_text_only_trace_manifest.json',
    'phase_39cq_so2_openai_loopback_strategy_report.json',
    'phase_39cq_so2_offline_structured_outputs_report.json',
    'phase_39cq_so2_candidate_strategy_matrix.json',
    'phase_39cq_so2_selected_candidate_report.json',
    'phase_39cq_so2_generated_fixture_manifest.json',
    'phase_39cq_so2_runtime_results.json',
    'phase_39cq_so2_output_schema_validation_report.json',
    'phase_39cq_so2_object_region_qa_report.json',
    'phase_39cq_so2_safe_zone_qa_report.json',
    'phase_39cq_so2_hallucination_safety_report.json',
    'phase_39cq_so2_private_artifact_manifest.json',
    'phase_39cq_so2_structured_output_compat_recovery_report.json',
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
    'new model downloads',
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
