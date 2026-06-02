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

export * from './kernel-compat'
export * from './fixed-kernel'
export * from './auth-preflight'

const execFileAsync = promisify(execFile)

export type VlmSglangRuntimeStatus = 'passed' | 'blocked' | 'skipped'
export type VlmSglangRuntimeStageId = 'SG0' | 'SG1' | 'SG2' | 'SG3' | 'SG4' | 'SG5' | 'SG6' | 'SG7'

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

export interface VlmSglangRuntimeAttempt {
  readonly candidate: VlmL4Candidate
  readonly status: VlmSglangRuntimeStatus
  readonly selected: boolean
  readonly manifestStatus: VlmSglangRuntimeStatus
  readonly runtimeStatus: VlmSglangRuntimeStatus
  readonly privateModelPrefix: string
  readonly privateQaPrefix?: string
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly runtimeReport?: Record<string, unknown>
  readonly canaryLabelRecall?: number
  readonly canaryCoarseRegionAccuracy?: number
  readonly fixtureLabelRecall?: number
  readonly fixtureCoarseRegionAccuracy?: number
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmSglangRuntimeResult {
  readonly runId: string
  readonly selectedCandidate?: VlmL4Candidate
  readonly attempts: readonly VlmSglangRuntimeAttempt[]
  readonly status: VlmSglangRuntimeStatus
  readonly localArtifactDir: string
  readonly privateQaPrefix?: string
  readonly imageDigest?: string
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
  readonly vlmToolFamilyBetaStatus: 'blocked' | 'phase-complete but tool-family incomplete'
}

export interface VlmSglangCloudBuildResult {
  readonly phase: '39C-SG-BUILD'
  readonly runId: string
  readonly status: VlmSglangRuntimeStatus
  readonly imageRef: string
  readonly imageDigest?: string
  readonly buildId?: string
  readonly buildStatus?: string
  readonly durationSeconds?: number
  readonly artifactDir: string
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const ENV = 'staging'
const GENERATED_ASSETS_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
const QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
const GPU_WORKER_SA = 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
const IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang'
const JOB_NAME = 'reeditpro-stg-vlm-runtime-phase39c-sglang'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-sglang-runtime'
const REPORT_DIR = 'docs/activation-phase-39c-sg-sglang-vlm-runtime-reports'
const MATRIX_ID = 'phase39c-sglang-generated-vlm-v1'
const SGLANG_PACKAGE_VERSION = '0.4.10.post2'
const CLOUD_BUILD_FULL_CONFIG = 'cloudbuild/vlm-sglang-runtime-phase39c.yaml'
const CLOUD_BUILD_OVERLAY_CONFIG = 'cloudbuild/vlm-sglang-runtime-phase39c-overlay.yaml'
const CLOUD_BUILD_OVERLAY_BASE_IMAGE = `${IMAGE_PATH}@sha256:299d8d5b3d463c50a156b436f5d463c00c3bea662b74b82ddee2ab6ecdff015d`
const PR100_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/100'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const PR90_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90'
const PR97_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/97'

export const VLM_SGLANG_RUNTIME_REPORT_DIR = REPORT_DIR
export const VLM_SGLANG_RUNTIME_MATRIX_ID = MATRIX_ID

export const vlmSglangRuntimeCandidateExecutionOrder = [
  'Qwen/Qwen3-VL-2B-Instruct',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
] as const

export const vlmSglangRuntimeCandidateSelectionPriority = [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
] as const

export const vlmSglangRuntimeCanaryFixtures = [
  'canary-basic-shapes',
  'canary-colored-layout',
  'canary-text-and-shape',
  'canary-ui-simplified',
  'canary-caption-safe-zone-simple',
] as const

export const vlmSglangRuntimeStages = [
  {
    id: 'SG0',
    name: 'capability introspection',
    passCounting: false,
    description: 'Captures SGLang, Python, Torch, CUDA, OpenAI-compatible, native/offline, and structured-output support. Diagnostic only.',
  },
  {
    id: 'SG1',
    name: 'text-only json structured smoke',
    passCounting: false,
    description: 'Runs T0 choice, T1 tiny JSON, and T2 compact VLM schema without image input before image tests.',
  },
  {
    id: 'SG2',
    name: 'freeform image perception canary',
    passCounting: false,
    description: 'Captures private freeform perception traces for generated canary images. It can stop the candidate early, but never completes Phase 39C-SG alone.',
  },
  {
    id: 'SG3',
    name: 'labels-only structured output',
    passCounting: true,
    description: 'Checks expected label/alias recall without boxes or safe-zone reasoning.',
  },
  {
    id: 'SG4',
    name: 'coarse-region structured output',
    passCounting: true,
    description: 'Checks broad zones only: top, bottom, left, right, center, lower_third, upper_third.',
  },
  {
    id: 'SG5',
    name: 'safe-zone reasoning',
    passCounting: true,
    description: 'Checks generated safe-zone recommendations and blocks unknown decisions.',
  },
  {
    id: 'SG6',
    name: 'composed canonical report',
    passCounting: true,
    description: 'Composes the Phase 39C-SG generated-runtime decision from SG3/SG4/SG5 outputs only.',
  },
  {
    id: 'SG7',
    name: 'optional strict full json report',
    passCounting: false,
    description: 'Optional future-facing strict JSON full report after decomposed QA passes. Not required for Phase 39C-SG pass.',
  },
] as const satisfies readonly {
  readonly id: VlmSglangRuntimeStageId
  readonly name: string
  readonly passCounting: boolean
  readonly description: string
}[]

export function getVlmSglangRuntimePlan() {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_sglang_runtime_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    sourceEvidence: sourceEvidence(),
    sglangEvidence: sglangEvidence(),
    candidatePolicy: {
      allowedCandidates: vlmL4CompatibleCandidates.map(candidateSummary),
      executionOrder: vlmSglangRuntimeCandidateExecutionOrder,
      selectionPriority: vlmSglangRuntimeCandidateSelectionPriority,
      newModelDownloadsAllowed: false,
      modelUploadsAllowed: false,
      communityQuantizationsAllowed: false,
      nonQwenCandidatesAllowed: false,
      modelIdRuntimePathAllowed: false,
    },
    strategyMatrix: {
      matrixId: MATRIX_ID,
      stages: vlmSglangRuntimeStages,
      passCountingStages: ['SG3', 'SG4', 'SG5', 'SG6'],
      diagnosticStages: ['SG0', 'SG1', 'SG2', 'SG7'],
      freeformAloneCanPass: false,
      regexRepairCanPass: false,
      extractFirstJsonCanPass: false,
      manualPatchCanPass: false,
    },
    qaDesign: {
      canaryFixtures: vlmSglangRuntimeCanaryFixtures,
      requiredGeneratedFixturesAfterCanaryPass: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
      coarseZones: ['top', 'bottom', 'left', 'right', 'center', 'lower_third', 'upper_third'],
      thresholds: {
        canaryLabelRecall: 0.8,
        canaryCoarseRegionAccuracy: 0.8,
        generatedFixtureLabelRecall: 0.6,
        generatedFixtureCoarseRegionAccuracy: 0.6,
        safeZoneDecisionUnknownAllowed: false,
        ambiguousFixtureMustRequireManualReview: true,
      },
      normalizedBoxesRequiredInFirstPass: false,
      aliasMatchingEnabled: true,
    },
    execution: executionPolicy(),
    confirmationsRequiredForExecution: [
      'REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK',
      'REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_BUILD',
      'REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH',
      'REEDITPRO_CONFIRM_VLM_SGLANG_STAGING_CLOUD_RUN_JOB',
      'REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE',
    ],
  }
}

export function getVlmSglangRuntimeIamPlan() {
  const qaPrefix = 'activation/phase39c/generated-vlm-sglang-runtime/'
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_sglang_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmationForMissingScopedBindings: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    notes: [
      'Phase 39C-SG reuses PR #87 exact private model objects; no new model download or model upload is allowed.',
      'The runtime copies exact object paths from the PR #87 checksum manifest and does not rely on broad bucket listing.',
      'No public buckets, public objects, signed URLs, provider calls, real media, or Track A runtime paths are allowed.',
    ],
    plans: [
      ...vlmL4CompatibleCandidates.map((candidate) => ({
        bindingId: `phase39c-sg-model-read-${candidate.slug}`,
        bucket: GENERATED_ASSETS_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: `phase39c-sg-model-read-${candidate.slug}`,
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${GENERATED_ASSETS_BUCKET}/objects/${candidateObjectPrefix(candidate)}')`,
        description: 'GPU worker may read only already staged official Qwen candidate objects from PR #87.',
        required: true,
      })),
      {
        bindingId: 'phase39c-sg-qa-create',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39c-sg-qa-create',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may create private Phase 39C-SG QA artifacts only under the approved prefix.',
        required: true,
      },
      {
        bindingId: 'phase39c-sg-qa-readback',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39c-sg-qa-readback',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may read back private Phase 39C-SG QA artifacts only to verify upload metadata.',
        required: true,
      },
    ],
  }
}

export function getVlmSglangRuntimeCostSummary() {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_sglang_cost_summary',
    createdAt: new Date().toISOString(),
    cloudRunShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    candidateExecutionOrder: vlmSglangRuntimeCandidateExecutionOrder,
    matrixId: MATRIX_ID,
    runtimePackage: `sglang==${SGLANG_PACKAGE_VERSION}`,
    generatedFixturesOnly: true,
    modelDownloadCost: 'none_new_models_reuse_pr87_private_assets',
    stagingGpuCostRisk: 'bounded_l4_sglang_perception_canary_then_decomposed_generated_fixture_qa',
    stopEarlyPolicy: 'stop candidate after failed SG1/SG2 canaries; continue to next candidate',
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function getVlmSglangRuntimeCloudBuildPlan() {
  const createdAt = new Date().toISOString()
  return {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_build_plan',
    createdAt,
    defaultMode: 'non_mutating',
    sourceEvidence: sourceEvidence(),
    buildFailureAudit: buildFailureAudit(createdAt),
    cloudBuild: {
      projectId: PROJECT_ID,
      region: REGION,
      configPath: selectedCloudBuildConfig(),
      fullConfigPath: CLOUD_BUILD_FULL_CONFIG,
      overlayConfigPath: CLOUD_BUILD_OVERLAY_CONFIG,
      mode: selectedCloudBuildMode(),
      dockerfile: 'docker/prod/vlm-sglang-runtime/Dockerfile',
      overlayDockerfile: 'docker/prod/vlm-sglang-runtime/Dockerfile.overlay',
      overlayBaseImage: CLOUD_BUILD_OVERLAY_BASE_IMAGE,
      context: '.',
      platform: 'linux/amd64',
      imagePath: IMAGE_PATH,
      machineType: 'E2_HIGHCPU_8',
      timeout: selectedCloudBuildMode() === 'overlay' ? '1800s' : '7200s',
      noModelFilesBaked: true,
      noSecretsBaked: true,
      artifactRegistryOnly: true,
      overlayPurpose: 'reuse the previous private SGLang image and copy only patched worker files after the full Cloud Build path stalled during publish/finalization',
    },
    confirmationsRequiredForExecution: [
      'REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK',
      'REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD',
      'REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH',
    ],
    executionBlockedByDefault: true,
    betaProductionBlocked: true,
  }
}

export async function buildVlmSglangRuntimeBuildContextGuardReport(createdAt = new Date().toISOString()) {
  const requiredDockerignorePatterns = [
    '**/node_modules',
    '**/.git',
    '**/.venv',
    '**/__pycache__',
    '**/.cache',
    '**/hf-cache',
    '**/huggingface',
    '**/*.safetensors',
    '**/*.bin',
    '**/*.pt',
    '**/*.pth',
    '**/*.onnx',
    '**/model-weights',
    '**/generated-vlm-*',
    '**/activation/phase39*',
    '**/*.log',
    '**/.env',
    '**/.env.*',
    '**/*secret*',
    '**/*credential*',
  ]
  const dockerignore = await readTextFileOrEmpty('.dockerignore')
  const dockerfileIgnore = await readTextFileOrEmpty('docker/prod/vlm-sglang-runtime/Dockerfile.dockerignore')
  const missingRootPatterns = requiredDockerignorePatterns.filter((pattern) => !dockerignore.includes(pattern))
  const missingDockerfilePatterns = requiredDockerignorePatterns.filter((pattern) => !dockerfileIgnore.includes(pattern))
  const forbiddenTrackedFiles = await findForbiddenTrackedBuildFiles()
  const requiredSources = [
    'docker/prod/vlm-sglang-runtime/Dockerfile',
    'docker/prod/vlm-sglang-runtime/Dockerfile.overlay',
    'docker/prod/vlm-sglang-runtime/requirements.sglang.txt',
    'cloudbuild/vlm-sglang-runtime-phase39c.yaml',
    'cloudbuild/vlm-sglang-runtime-phase39c-overlay.yaml',
    'server/workers/vlm-sglang-runtime/run-phase39c-sglang-cloud-job.py',
    'server/workers/vlm-sglang-runtime/run_sglang_generated_fixture.py',
  ]
  const requiredSourcePresence = await Promise.all(requiredSources.map(async (filePath) => [filePath, await fileExists(filePath)] as const))
  const missingRequiredSources = requiredSourcePresence.filter(([, exists]) => !exists).map(([filePath]) => filePath)
  const blockers = [
    ...missingRootPatterns.map((pattern) => `root_dockerignore_missing:${pattern}`),
    ...missingDockerfilePatterns.map((pattern) => `dockerfile_dockerignore_missing:${pattern}`),
    ...forbiddenTrackedFiles.violations.map((filePath) => `forbidden_tracked_build_context_file:${filePath}`),
    ...missingRequiredSources.map((filePath) => `required_sglang_build_source_missing:${filePath}`),
  ]
  return {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_build_context_guard_report',
    createdAt,
    status: blockers.length ? 'blocked' : 'passed',
    context: '.',
    dockerfile: 'docker/prod/vlm-sglang-runtime/Dockerfile',
    overlayDockerfile: 'docker/prod/vlm-sglang-runtime/Dockerfile.overlay',
    cloudBuildMode: selectedCloudBuildMode(),
    overlayBaseImage: CLOUD_BUILD_OVERLAY_BASE_IMAGE,
    rootDockerignorePresent: Boolean(dockerignore),
    dockerfileDockerignorePresent: Boolean(dockerfileIgnore),
    requiredDockerignorePatterns,
    missingRootPatterns,
    missingDockerfilePatterns,
    forbiddenTrackedFiles: forbiddenTrackedFiles.violations,
    requiredSources,
    missingRequiredSources,
    blockers,
  }
}

export function buildVlmSglangRuntimeCloudBuildStaticReport() {
  const createdAt = new Date().toISOString()
  return {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_build_report',
    createdAt,
    status: 'blocked',
    cloudBuildConfig: selectedCloudBuildConfig(),
    fullCloudBuildConfig: CLOUD_BUILD_FULL_CONFIG,
    overlayCloudBuildConfig: CLOUD_BUILD_OVERLAY_CONFIG,
    cloudBuildMode: selectedCloudBuildMode(),
    overlayBaseImage: CLOUD_BUILD_OVERLAY_BASE_IMAGE,
    imagePath: IMAGE_PATH,
    blockers: ['cloud_build_execution_not_run'],
    warnings: [],
    vlmToolFamilyBetaStatus: 'blocked',
  }
}

export async function writeVlmSglangRuntimeCloudBuildStaticArtifacts(artifactDir = REPORT_DIR): Promise<void> {
  const createdAt = new Date().toISOString()
  await mkdir(artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_build_unblock_plan.json'), getVlmSglangRuntimeCloudBuildPlan())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_build_failure_audit.json'), buildFailureAudit(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_build_context_guard_report.json'), await buildVlmSglangRuntimeBuildContextGuardReport(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_cloud_build_plan.json'), getVlmSglangRuntimeCloudBuildPlan())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_cloud_build_report.json'), buildVlmSglangRuntimeCloudBuildStaticReport())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_image_verification_report.json'), {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_image_verification_report',
    createdAt,
    status: 'blocked',
    imagePath: IMAGE_PATH,
    blockers: ['image_digest_unavailable_execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_cloud_run_job_report.json'), {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_run_job_report',
    createdAt,
    status: 'blocked',
    cloudRunJob: JOB_NAME,
    blockers: ['cloud_run_job_not_run'],
  })
}

export function buildVlmSglangRuntimeStaticReport() {
  return {
    ok: false,
    phase: '39C-SG',
    reportId: 'phase_39c_sg_generated_runtime_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: sourceEvidence(),
    sglangEvidence: sglangEvidence(),
    strategyMatrix: vlmSglangRuntimeStages,
    canaryFixtureManifest: canaryFixtureManifest(),
    aliasMap: aliasMap(),
    decomposedQaPolicy: decomposedQaPolicy(),
    candidateResults: vlmL4CompatibleCandidates.map((candidate) => ({
      modelId: candidate.modelId,
      revision: candidate.revision,
      status: 'not_run',
      privateModelPrefix: candidateModelPrefix(candidate),
      blockers: ['execution_not_run'],
    })),
    blockers: ['execution_not_run'],
    blockedScopes: blockedScopes(),
    vlmToolFamilyBetaStatus: 'blocked',
  }
}

export async function writeVlmSglangRuntimeStaticArtifacts(artifactDir = REPORT_DIR): Promise<void> {
  await mkdir(artifactDir, { recursive: true })
  const createdAt = new Date().toISOString()
  const report = buildVlmSglangRuntimeStaticReport()
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_sglang_runtime_plan.json'), getVlmSglangRuntimePlan())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_sglang_source_evidence.json'), sglangEvidence().sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_sglang_license_evidence.json'), sglangEvidence().licenseEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_sglang_runtime_support_evidence.json'), sglangEvidence().runtimeSupportEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_sglang_structured_output_evidence.json'), sglangEvidence().structuredOutputEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_candidate_manifest.json'), candidateManifest(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_canary_fixture_manifest.json'), canaryFixtureManifest(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_generated_fixture_manifest.json'), generatedFixtureManifest(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_label_alias_map.json'), aliasMap(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_model_asset_verification.json'), staticBlockedReport('phase_39c_sg_model_asset_verification', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_runtime_capability_report.json'), staticBlockedReport('phase_39c_sg_runtime_capability_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_strategy_matrix_report.json'), strategyMatrixReport(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_text_only_smoke_report.json'), staticBlockedReport('phase_39c_sg_text_only_smoke_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_freeform_perception_report.json'), staticBlockedReport('phase_39c_sg_freeform_perception_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_labels_only_qa_report.json'), staticBlockedReport('phase_39c_sg_labels_only_qa_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_coarse_region_qa_report.json'), staticBlockedReport('phase_39c_sg_coarse_region_qa_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_safe_zone_reasoning_report.json'), staticBlockedReport('phase_39c_sg_safe_zone_reasoning_report', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_decomposed_canonical_report.json'), staticBlockedReport('phase_39c_sg_decomposed_canonical_report', createdAt, { stages: vlmSglangRuntimeStages }))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_candidate_results.json'), staticBlockedReport('phase_39c_sg_candidate_results', createdAt, { candidates: candidateManifest(createdAt).candidates }))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_runtime_results.json'), staticBlockedReport('phase_39c_sg_runtime_results', createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_hallucination_safety_report.json'), hallucinationSafetyBaseline(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_private_artifact_manifest.json'), staticBlockedReport('phase_39c_sg_private_artifact_manifest', createdAt, { privateOnly: true, artifactCount: 0, artifacts: [] }))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_generated_runtime_recovery_report.json'), report)
}

export async function writeVlmSglangRuntimeBlockedExecutionArtifacts(input: {
  runId: string
  artifactDir?: string
  blocker: string
  detail?: string
}): Promise<VlmSglangRuntimeResult> {
  const createdAt = new Date().toISOString()
  const blocker = sanitizeBlocker(input.blocker)
  const detail = input.detail ? sanitizeBlocker(input.detail) : undefined
  const blockers = [detail ? `${blocker}:${detail}` : blocker]
  const attempts = vlmL4CompatibleCandidates.map((candidate) => sglangAttempt({
    candidate,
    status: 'blocked',
    manifestStatus: 'skipped',
    runtimeStatus: 'skipped',
    privateModelPrefix: candidateModelPrefix(candidate),
    blockers,
    warnings: ['candidate_not_attempted_after_pre_runtime_blocker'],
  }))
  return writeCombinedSglangRuntimeReport({
    runId: input.runId,
    createdAt,
    attempts,
    status: 'blocked',
    localArtifactDir: input.artifactDir ?? REPORT_DIR,
    blockers,
    warnings: [
      'private_model_copy_not_started',
      'checksum_verification_not_started',
      'cloud_run_l4_job_not_started',
      'private_qa_artifact_upload_not_started',
    ],
  })
}

export async function runVlmSglangRuntimeCloudBuild(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  artifactDir?: string
}): Promise<VlmSglangCloudBuildResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-SG-BUILD Cloud Build.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39c-sg-build-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactDir = input.artifactDir ?? REPORT_DIR
  await mkdir(artifactDir, { recursive: true })
  const imageRef = `${IMAGE_PATH}:${runId.toLowerCase()}`
  const cloudBuildConfig = selectedCloudBuildConfig()
  const warnings: string[] = []
  const guardReport = await buildVlmSglangRuntimeBuildContextGuardReport(createdAt)
  const envBlockers = validateCloudBuildEnv()
  const blockers = [...envBlockers, ...guardReport.blockers]
  if (blockers.length) {
    return writeCloudBuildResult({
      runId,
      createdAt,
      status: 'blocked',
      imageRef,
      artifactDir,
      blockers,
      warnings,
      guardReport,
    })
  }

  try {
    const existingImageDigest = await describeArtifactRegistryImageDigest(imageRef)
    if (existingImageDigest) {
      return writeCloudBuildResult({
        runId,
        createdAt,
        status: 'passed',
        imageRef,
        imageDigest: existingImageDigest,
        buildStatus: 'REUSED_EXISTING_IMAGE_AFTER_PREVIOUS_CLOUD_BUILD',
        artifactDir,
        blockers: [],
        warnings: ['cloud_build_reused_existing_artifact_registry_image_for_same_run_id'],
        guardReport,
      })
    }
  } catch (error) {
    warnings.push(`existing_image_lookup_before_cloud_build_failed:${summarizeCommandError(error)}`)
  }

  let buildOutput: string
  let build: Record<string, unknown>
  try {
    buildOutput = await runGcloud([
      'builds',
      'submit',
      '.',
      '--project',
      PROJECT_ID,
      '--config',
      cloudBuildConfig,
      '--substitutions',
      `_IMAGE=${imageRef}`,
      '--format=json',
    ], 2 * 60 * 60 * 1000)
    build = parseGcloudJsonObjectOutput(buildOutput)
  } catch (error) {
    return writeCloudBuildResult({
      runId,
      createdAt,
      status: 'blocked',
      imageRef,
      artifactDir,
      blockers: [`cloud_build_failed:${summarizeCommandError(error)}`],
      warnings,
      guardReport,
    })
  }

  const buildStatus = String(build.status ?? 'UNKNOWN')
  const buildId = String(build.id ?? '')
  const durationSeconds = computeBuildDurationSeconds(build)
  if (buildStatus !== 'SUCCESS') blockers.push(`cloud_build_status_${buildStatus.toLowerCase()}`)
  let imageDigest = extractCloudBuildImageDigest(build)
  if (!imageDigest && buildStatus === 'SUCCESS') {
    try {
      imageDigest = await describeArtifactRegistryImageDigest(imageRef)
    } catch (error) {
      blockers.push(`image_digest_lookup_failed:${summarizeCommandError(error)}`)
    }
  }
  if (!imageDigest && buildStatus === 'SUCCESS') blockers.push('image_digest_unavailable')
  return writeCloudBuildResult({
    runId,
    createdAt,
    status: blockers.length ? 'blocked' : 'passed',
    imageRef,
    imageDigest,
    buildId: buildId || undefined,
    buildStatus,
    durationSeconds,
    artifactDir,
    blockers,
    warnings,
    guardReport,
    rawBuildMetadata: safeCloudBuildMetadata(build),
  })
}

export async function runVlmSglangRuntimeRecovery(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  safeArtifactDir?: string
}): Promise<VlmSglangRuntimeResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-SG SGLang runtime evaluation.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39c-sg-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const localRoot = path.join(LOCAL_ROOT, runId)
  const safeArtifactDir = input.safeArtifactDir ?? REPORT_DIR
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  await mkdir(safeArtifactDir, { recursive: true })

  const envBlockers = validateExecutionEnv()
  const attempts: VlmSglangRuntimeAttempt[] = []
  const warnings: string[] = []
  if (envBlockers.length) {
    return writeCombinedSglangRuntimeReport({ runId, createdAt, attempts, status: 'blocked', localArtifactDir: safeArtifactDir, blockers: envBlockers, warnings })
  }

  let imageRef: string
  let imageDigest: string | undefined
  try {
    const image = await buildAndPushRuntimeImage(runId, safeArtifactDir)
    imageRef = image.imageRef
    imageDigest = image.imageDigest
    warnings.push(...image.warnings)
  } catch (error) {
    return writeCombinedSglangRuntimeReport({
      runId,
      createdAt,
      attempts,
      status: 'blocked',
      localArtifactDir: safeArtifactDir,
      blockers: [`sglang_runtime_image_build_push_failed:${summarizeCommandError(error)}`],
      warnings,
    })
  }

  for (const candidate of orderedExecutionCandidates()) {
    const candidateReportDir = path.join(safeArtifactDir, 'candidates', candidate.slug)
    const attempt = await attemptSglangRuntimeCandidate({ candidate, runId, imageRef, imageDigest, candidateReportDir, localRoot })
    attempts.push(attempt)
    warnings.push(...attempt.warnings)
  }

  const selectedAttempt = selectBestPassingAttempt(attempts)
  const status: VlmSglangRuntimeStatus = selectedAttempt ? 'passed' : 'blocked'
  const blockers = status === 'passed'
    ? []
    : Array.from(new Set(attempts.flatMap((attempt) => attempt.blockers))).filter(Boolean)
  const result = await writeCombinedSglangRuntimeReport({
    runId,
    createdAt,
    selectedCandidate: selectedAttempt?.candidate,
    attempts,
    status,
    localArtifactDir: safeArtifactDir,
    privateQaPrefix: selectedAttempt?.privateQaPrefix,
    imageDigest,
    blockers: blockers.length ? blockers : ['no_candidate_passed_sglang_generated_fixture_qa'],
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function attemptSglangRuntimeCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  imageDigest?: string
  candidateReportDir: string
  localRoot: string
}): Promise<VlmSglangRuntimeAttempt> {
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
    return sglangAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const manifestBlockers = validateChecksumManifest(candidate, manifest)
  if (manifestBlockers.length) {
    blockers.push(...manifestBlockers)
    return sglangAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const runtimeRunId = `${runId}-${candidate.slug}`
  const privateQaPrefix = `gs://${QA_BUCKET}/${sglangQaObjectPrefix(runtimeRunId)}/`
  let runtimeReport: Record<string, unknown> | undefined
  try {
    const deployImageRef = imageDigest ? `${IMAGE_PATH}@${imageDigest}` : imageRef
    const runtime = await runSglangRuntimeCloudRunJob({ candidate, runId: runtimeRunId, imageRef: deployImageRef, manifest, candidateReportDir })
    runtimeReport = runtime.runtimeReport
    warnings.push(...runtime.warnings)
    blockers.push(...runtime.blockers)
    const reportBlockers = Array.isArray(runtimeReport?.blockers) ? runtimeReport.blockers : []
    for (const reportBlocker of reportBlockers) {
      if (typeof reportBlocker === 'string') blockers.push(`${candidate.slug}:${reportBlocker}`)
    }
  } catch (error) {
    blockers.push(`sglang_l4_runtime_failed:${summarizeCommandError(error)}`)
  }
  const passed = Boolean(runtimeReport?.ok) && blockers.length === 0
  const qa = runtimeReport?.qa as { canaryLabelRecall?: unknown; canaryCoarseRegionAccuracy?: unknown; fixtureLabelRecall?: unknown; fixtureCoarseRegionAccuracy?: unknown } | undefined
  return sglangAttempt({
    candidate,
    status: passed ? 'passed' : 'blocked',
    manifestStatus: 'passed',
    runtimeStatus: passed ? 'passed' : 'blocked',
    privateModelPrefix,
    privateQaPrefix,
    imageRef,
    imageDigest,
    runtimeReport,
    canaryLabelRecall: typeof qa?.canaryLabelRecall === 'number' ? qa.canaryLabelRecall : undefined,
    canaryCoarseRegionAccuracy: typeof qa?.canaryCoarseRegionAccuracy === 'number' ? qa.canaryCoarseRegionAccuracy : undefined,
    fixtureLabelRecall: typeof qa?.fixtureLabelRecall === 'number' ? qa.fixtureLabelRecall : undefined,
    fixtureCoarseRegionAccuracy: typeof qa?.fixtureCoarseRegionAccuracy === 'number' ? qa.fixtureCoarseRegionAccuracy : undefined,
    blockers: passed ? [] : blockers.length ? blockers : ['sglang_runtime_report_not_ok'],
    warnings,
  })
}

async function runSglangRuntimeCloudRunJob(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  manifest: ChecksumManifest
  candidateReportDir: string
}): Promise<{ runtimeReport?: Record<string, unknown>; blockers: string[]; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_SGLANG_STAGING_CLOUD_RUN_JOB !== 'true') throw new Error('sglang_cloud_run_job_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE !== 'true') throw new Error('l4_gpu_execute_confirmation_missing')
  const warnings: string[] = []
  const blockers: string[] = []
  const artifactPrefix = sglangQaObjectPrefix(input.runId)
  const expectedAssetsJson = JSON.stringify(input.manifest.entries.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: input.runId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-SG',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39c_sg',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: input.manifest.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: JOB_NAME,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-sglang-runtime',
    REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX: MATRIX_ID,
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
  for (const fileName of sglangExpectedReports()) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${fileName}`
    const localPath = path.join(input.candidateReportDir, fileName)
    try {
      await rm(localPath, { force: true })
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_sglang_artifact_verified:${input.candidate.slug}:${fileName}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`sglang_artifact_fetch_failed:${input.candidate.slug}:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.candidateReportDir, 'phase_39c_sg_generated_runtime_recovery_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) blockers.push(`sglang_runtime_report_not_ok:${input.candidate.slug}`)
  } catch (error) {
    blockers.push(`sglang_runtime_report_unreadable:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  return { runtimeReport, blockers: Array.from(new Set(blockers)), warnings }
}

async function writeCombinedSglangRuntimeReport(input: {
  runId: string
  createdAt: string
  selectedCandidate?: VlmL4Candidate
  attempts: readonly VlmSglangRuntimeAttempt[]
  status: VlmSglangRuntimeStatus
  localArtifactDir: string
  privateQaPrefix?: string
  imageDigest?: string
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmSglangRuntimeResult> {
  const fullReport = {
    ok: input.status === 'passed',
    phase: '39C-SG',
    reportId: 'phase_39c_sg_generated_runtime_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    imageDigest: input.imageDigest,
    sourceEvidence: sourceEvidence(),
    sglangEvidence: sglangEvidence(),
    strategyMatrix: strategyMatrixReport(input.createdAt),
    canaryFixtureManifest: canaryFixtureManifest(input.createdAt),
    aliasMap: aliasMap(input.createdAt),
    decomposedQaPolicy: decomposedQaPolicy(),
    candidateResults: input.attempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      revision: attempt.candidate.revision,
      status: attempt.status,
      selected: attempt.selected,
      manifestStatus: attempt.manifestStatus,
      runtimeStatus: attempt.runtimeStatus,
      privateModelPrefix: attempt.privateModelPrefix,
      privateQaPrefix: attempt.privateQaPrefix,
      imageDigest: attempt.imageDigest,
      qa: {
        canaryLabelRecall: attempt.canaryLabelRecall,
        canaryCoarseRegionAccuracy: attempt.canaryCoarseRegionAccuracy,
        fixtureLabelRecall: attempt.fixtureLabelRecall,
        fixtureCoarseRegionAccuracy: attempt.fixtureCoarseRegionAccuracy,
      },
      blockers: attempt.blockers,
      warnings: attempt.warnings,
    })),
    selectedCandidate: input.selectedCandidate ? {
      modelId: input.selectedCandidate.modelId,
      revision: input.selectedCandidate.revision,
      privateQaPrefix: input.privateQaPrefix,
    } : undefined,
    generatedFixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({ fixtureId, status: input.status === 'passed' ? 'passed_or_warning_within_policy' : 'blocked_or_not_run' })),
    blockedScopes: blockedScopes(),
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
    nextPhaseDecision: input.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : 'Do not start Phase 39D; use an evidence-based non-Qwen candidate, alternate GPU/runtime, or fixture/QA threshold follow-up based on the recorded blocker.',
  }
  await mkdir(input.localArtifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_sglang_runtime_plan.json'), getVlmSglangRuntimePlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_sglang_source_evidence.json'), sglangEvidence().sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_sglang_license_evidence.json'), sglangEvidence().licenseEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_sglang_runtime_support_evidence.json'), sglangEvidence().runtimeSupportEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_sglang_structured_output_evidence.json'), sglangEvidence().structuredOutputEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_candidate_manifest.json'), candidateManifest(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_canary_fixture_manifest.json'), canaryFixtureManifest(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_generated_fixture_manifest.json'), generatedFixtureManifest(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_label_alias_map.json'), aliasMap(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_strategy_matrix_report.json'), strategyMatrixReport(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_decomposed_canonical_report.json'), {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_decomposed_canonical_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    selectedCandidate: fullReport.selectedCandidate,
    passRequires: decomposedQaPolicy().passRequires,
    candidateResults: fullReport.candidateResults,
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_candidate_results.json'), {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_candidate_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    selectedCandidate: fullReport.selectedCandidate ?? null,
    candidates: fullReport.candidateResults,
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_runtime_results.json'), {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_runtime_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    imageDigest: input.imageDigest,
    cloudRunJob: JOB_NAME,
    region: REGION,
    gpu: 'nvidia-l4',
    cpu: 8,
    memory: '32Gi',
    runtime: 'sglang',
    generatedSyntheticFixturesOnly: true,
    modelDownload: 'blocked_no_new_downloads',
    providerCalls: 'blocked',
    realMedia: 'blocked',
    publicOutput: 'blocked',
    candidates: fullReport.candidateResults.map((candidate) => ({
      modelId: candidate.modelId,
      revision: candidate.revision,
      status: candidate.status,
      runtimeStatus: candidate.runtimeStatus,
      qa: candidate.qa,
      blockers: candidate.blockers,
    })),
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_cloud_run_job_report.json'), {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_run_job_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    cloudRunJob: JOB_NAME,
    region: REGION,
    serviceAccount: GPU_WORKER_SA,
    imagePath: IMAGE_PATH,
    imageDigest: input.imageDigest,
    gpu: 'nvidia-l4',
    gpuCount: 1,
    cpu: 8,
    memory: '32Gi',
    taskCount: 1,
    parallelism: 1,
    generatedSyntheticFixturesOnly: true,
    productionTraffic: false,
    publicServiceEndpoint: false,
    realMedia: 'blocked',
    providerCalls: 'blocked',
    candidateCount: input.attempts.length,
    selectedCandidate: fullReport.selectedCandidate ?? null,
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_private_artifact_manifest.json'), {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_private_artifact_manifest',
    runId: input.runId,
    createdAt: input.createdAt,
    privateOnly: true,
    candidateCount: input.attempts.length,
    privateQaPrefixes: input.attempts
      .filter((attempt) => attempt.privateQaPrefix)
      .map((attempt) => ({
        modelId: attempt.candidate.modelId,
        privateQaPrefix: attempt.privateQaPrefix,
      })),
    rawTracePolicy: 'private_only_hashes_and_short_safe_excerpts_committed',
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39c_sg_generated_runtime_recovery_report.json'), fullReport)
  return {
    runId: input.runId,
    selectedCandidate: input.selectedCandidate,
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

function sglangAttempt(input: {
  candidate: VlmL4Candidate
  status: VlmSglangRuntimeStatus
  manifestStatus: VlmSglangRuntimeStatus
  runtimeStatus: VlmSglangRuntimeStatus
  privateModelPrefix: string
  privateQaPrefix?: string
  imageRef?: string
  imageDigest?: string
  runtimeReport?: Record<string, unknown>
  canaryLabelRecall?: number
  canaryCoarseRegionAccuracy?: number
  fixtureLabelRecall?: number
  fixtureCoarseRegionAccuracy?: number
  blockers: readonly string[]
  warnings: readonly string[]
}): VlmSglangRuntimeAttempt {
  return {
    candidate: input.candidate,
    status: input.status,
    selected: input.status === 'passed',
    manifestStatus: input.manifestStatus,
    runtimeStatus: input.runtimeStatus,
    privateModelPrefix: input.privateModelPrefix,
    privateQaPrefix: input.privateQaPrefix,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    runtimeReport: input.runtimeReport,
    canaryLabelRecall: input.canaryLabelRecall,
    canaryCoarseRegionAccuracy: input.canaryCoarseRegionAccuracy,
    fixtureLabelRecall: input.fixtureLabelRecall,
    fixtureCoarseRegionAccuracy: input.fixtureCoarseRegionAccuracy,
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
    // Candidate-specific PR #87 manifests are stored with the private staged candidate objects.
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

async function buildAndPushRuntimeImage(runId: string, artifactDir: string): Promise<{ imageRef: string; imageDigest?: string; warnings: string[] }> {
  if (process.env.REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_BUILD !== 'true') throw new Error('sglang_docker_build_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH !== 'true') throw new Error('sglang_docker_push_confirmation_missing')
  if (process.env.REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD === 'true') {
    const cloudBuild = await runVlmSglangRuntimeCloudBuild({ execute: true, runId, artifactDir })
    if (cloudBuild.status !== 'passed') throw new Error(`sglang_cloud_build_failed:${cloudBuild.blockers.join(';')}`)
    return {
      imageRef: cloudBuild.imageRef,
      imageDigest: cloudBuild.imageDigest,
      warnings: [`sglang_runtime_image_built_by_cloud_build:${cloudBuild.imageRef}`, ...cloudBuild.warnings],
    }
  }
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
    'docker/prod/vlm-sglang-runtime/Dockerfile',
    '-t',
    imageRef,
    '.',
  ], 45 * 60 * 1000)
  const warnings = [`sglang_runtime_image_built_and_pushed:${imageRef}`]
  let imageDigest: string | undefined
  try {
    const metadata = parseGcloudJson(await runGcloud(['artifacts', 'docker', 'images', 'describe', imageRef, '--format=json'])) as Record<string, unknown>
    imageDigest = typeof metadata.image_summary === 'object' && metadata.image_summary
      ? String((metadata.image_summary as { digest?: unknown }).digest ?? '')
      : typeof metadata.digest === 'string' ? metadata.digest : undefined
  } catch (error) {
    warnings.push(`sglang_runtime_image_digest_lookup_failed:${summarizeCommandError(error)}`)
  }
  return { imageRef, imageDigest, warnings }
}

async function writeCloudBuildResult(input: {
  runId: string
  createdAt: string
  status: VlmSglangRuntimeStatus
  imageRef: string
  imageDigest?: string
  buildId?: string
  buildStatus?: string
  durationSeconds?: number
  artifactDir: string
  blockers: readonly string[]
  warnings: readonly string[]
  guardReport: Record<string, unknown>
  rawBuildMetadata?: Record<string, unknown>
}): Promise<VlmSglangCloudBuildResult> {
  const cloudBuildReport = {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_build_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    buildId: input.buildId,
    buildStatus: input.buildStatus,
    durationSeconds: input.durationSeconds,
    configPath: selectedCloudBuildConfig(),
    fullConfigPath: CLOUD_BUILD_FULL_CONFIG,
    overlayConfigPath: CLOUD_BUILD_OVERLAY_CONFIG,
    cloudBuildMode: selectedCloudBuildMode(),
    overlayBaseImage: CLOUD_BUILD_OVERLAY_BASE_IMAGE,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    artifactRegistryPath: IMAGE_PATH,
    sourcePr100: PR100_URL,
    rawBuildMetadata: input.rawBuildMetadata,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: 'blocked',
  }
  await mkdir(input.artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_build_unblock_plan.json'), getVlmSglangRuntimeCloudBuildPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_build_failure_audit.json'), buildFailureAudit(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_build_context_guard_report.json'), input.guardReport)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_cloud_build_plan.json'), getVlmSglangRuntimeCloudBuildPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_cloud_build_report.json'), cloudBuildReport)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_image_verification_report.json'), {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_image_verification_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.imageDigest ? 'passed' : 'blocked',
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    artifactRegistryPath: IMAGE_PATH,
    blockers: input.imageDigest ? [] : ['image_digest_unavailable'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_cloud_run_job_report.json'), {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_cloud_run_job_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: 'not_run_by_cloud_build_step',
    cloudRunJob: JOB_NAME,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    note: 'Cloud Run execution is recorded by phase_39c_sg_runtime_results.json after the runtime command runs.',
  })
  return {
    phase: '39C-SG-BUILD',
    runId: input.runId,
    status: input.status,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    buildId: input.buildId,
    buildStatus: input.buildStatus,
    durationSeconds: input.durationSeconds,
    artifactDir: input.artifactDir,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
  }
}

function validateCloudBuildEnv(): string[] {
  const required: Record<string, string> = {
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH: 'true',
  }
  return Object.entries(required)
    .filter(([key, value]) => process.env[key] !== value)
    .map(([key]) => `env_guard_mismatch:${key}`)
}

function validateExecutionEnv(): string[] {
  const required: Record<string, string> = {
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_BUILD: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_STAGING_CLOUD_RUN_JOB: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
  }
  if (process.env.REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD === 'true') {
    required.REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK = 'true'
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

function sourceEvidence() {
  return {
    phase39cOriginalOom: { pr: PR66_URL, preserved: true, summary: 'Original unquantized BF16 8B evidence remains preserved as Cloud Run L4 OOM before inference.' },
    phase39bq39cqCandidates: { pr: PR87_URL, preserved: true, summary: 'Official Qwen FP8 8B, BF16 4B, and BF16 2B candidates remain the only allowed staged private assets.' },
    phase39cqStructuredOutput: { pr: PR90_URL, preserved: true, summary: 'Structured-output enforcement reached syntax/debug paths but did not pass required generated fixture QA.' },
    phase39cqSo3Perception: { pr: PR97_URL, preserved: true, summary: 'SO3 proved the current blocker is semantic perception/localization on simple generated canaries under vLLM.' },
    phase39cSglangBuildxBlocker: { pr: PR100_URL, preserved: true, summary: 'SGLang source/license/runtime scaffolding exists, but local Docker buildx hung before producing an image digest or Cloud Run execution.' },
  }
}

function sglangEvidence() {
  return {
    sourceEvidence: {
      sourceRepo: 'https://github.com/sgl-project/sglang',
      packageName: 'sglang',
      packageVersion: SGLANG_PACKAGE_VERSION,
      sourceStatus: 'passed_for_evaluation_not_beta',
      notes: [
        'SGLang is a public source project under sgl-project.',
        'This phase evaluates SGLang only for deterministic generated fixture runtime, not production or beta.',
      ],
    },
    licenseEvidence: {
      license: 'Apache-2.0',
      evidenceUrl: 'https://github.com/sgl-project/sglang/blob/main/LICENSE',
      status: 'passed_for_evaluation_legal_review_still_required_before_production',
    },
    runtimeSupportEvidence: {
      openAiCompatibleApi: true,
      vlmSupportEvidenceUrl: 'https://docs.sglang.ai/docs/start/quick_start/openai_api_completions',
      qwenDeploymentEvidenceUrl: 'https://www.mintlify.com/QwenLM/Qwen3-VL/deployment/sglang',
      localModelPathRequiredByPolicy: true,
      modelIdRuntimePathBlockedByPolicy: true,
      autoDownloadBlockedByPolicy: true,
      l4RuntimeRisk: 'unknown_until_cloud_run_l4_generated_fixture_execution',
    },
    structuredOutputEvidence: {
      evidenceUrl: 'https://docs.sglang.ai/docs/advanced_features/structured_outputs',
      supportedModesToProbe: ['json_schema', 'regex', 'ebnf', 'structural_tag'],
      defaultGrammarBackend: 'xgrammar_per_current_docs',
      passStillRequiresSemanticQa: true,
    },
  }
}

function executionPolicy() {
  return {
    privateModelBucket: GENERATED_ASSETS_BUCKET,
    privateQaBucket: QA_BUCKET,
    qaPrefixPattern: 'activation/phase39c/generated-vlm-sglang-runtime/<run-id>/',
    imagePath: IMAGE_PATH,
    cloudRunJob: JOB_NAME,
    gpu: '1 x nvidia-l4',
    cpu: 8,
    memory: '32Gi',
    runtime: 'sglang',
    generatedSyntheticFixturesOnly: true,
    localVerifiedModelPathOnly: true,
    runtimeAutoDownloadBlocked: true,
    hfOfflineRequired: true,
    transformersOfflineRequired: true,
    providerCallsBlocked: true,
    rawPromptsBlocked: true,
    realMediaBlocked: true,
    arbitraryMediaBlocked: true,
    publicOutputBlocked: true,
    phase39DBlocked: true,
    phase39EBlocked: true,
    betaProductionBlocked: true,
    trackABlocked: true,
  }
}

function canaryFixtureManifest(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_canary_fixture_manifest',
    createdAt,
    generatedOnly: true,
    fixtureImagesCommitted: false,
    fixtures: [
      { fixtureId: 'canary-basic-shapes', expectedLabels: ['red square', 'blue circle', 'green triangle'], expectedZones: ['left', 'right', 'center'] },
      { fixtureId: 'canary-colored-layout', expectedLabels: ['top banner', 'center panel', 'bottom strip'], expectedZones: ['top', 'center', 'bottom'] },
      { fixtureId: 'canary-text-and-shape', expectedLabels: ['demo text', 'orange star', 'purple box'], expectedZones: ['upper_third', 'center', 'right'] },
      { fixtureId: 'canary-ui-simplified', expectedLabels: ['toolbar', 'preview canvas', 'timeline panel'], expectedZones: ['top', 'center', 'bottom'] },
      { fixtureId: 'canary-caption-safe-zone-simple', expectedLabels: ['caption block', 'face marker', 'safe upper zone'], expectedZones: ['lower_third', 'center', 'upper_third'] },
    ],
  }
}

function generatedFixtureManifest(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_generated_fixture_manifest',
    createdAt,
    generatedOnly: true,
    fixtureImagesCommitted: false,
    fixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES.map((fixtureId) => ({
      fixtureId,
      status: 'required_after_sglang_canary_pass',
    })),
  }
}

function candidateManifest(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_candidate_manifest',
    createdAt,
    sourcePr: PR87_URL,
    candidates: vlmL4CompatibleCandidates.map(candidateSummary),
    executionOrder: vlmSglangRuntimeCandidateExecutionOrder,
    selectionPriority: vlmSglangRuntimeCandidateSelectionPriority,
    noNewModelDownloads: true,
  }
}

function strategyMatrixReport(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_strategy_matrix_report',
    createdAt,
    matrixId: MATRIX_ID,
    stages: vlmSglangRuntimeStages,
    passCountingStages: ['SG3', 'SG4', 'SG5', 'SG6'],
    diagnosticOnlyStages: ['SG0', 'SG1', 'SG2', 'SG7'],
  }
}

function aliasMap(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_label_alias_map',
    createdAt,
    aliases: {
      'timeline panel': ['timeline', 'timeline panel', 'bottom track', 'bottom tracks', 'track area', 'editing timeline'],
      toolbar: ['toolbar', 'top bar', 'menu bar', 'control bar'],
      preview: ['preview', 'preview canvas', 'canvas', 'viewer', 'video preview'],
      'caption block': ['caption', 'caption block', 'subtitle block', 'lower third text', 'lower-third caption'],
      'safe upper zone': ['safe upper zone', 'upper third', 'top safe zone', 'safe caption zone'],
      'manual review': ['manual review', 'uncertain', 'ambiguous', 'needs review', 'high uncertainty'],
    },
  }
}

function decomposedQaPolicy() {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_decomposed_qa_policy',
    passRequires: [
      'SG0 capability introspection runs and records SGLang support details',
      'SG1 text-only JSON/structured smoke proves the runtime can constrain output before image tests',
      'SG2 freeform image traces are captured but do not count as pass evidence',
      'SG3 labels-only structured output reaches canary recall >= 0.80',
      'SG4 coarse-region structured output reaches canary accuracy >= 0.80',
      'SG5 safe-zone decision is not unknown',
      'SG6 composed canonical report from SG3/SG4/SG5 passes',
      'After canary pass, all five required generated fixtures pass decomposed thresholds',
      'Ambiguous generated fixture requires manual review or high uncertainty',
      'No provider calls, real media, public output, beta, production, or Track A unlocks',
    ],
  }
}

function staticBlockedReport(reportId: string, createdAt: string, extra: Record<string, unknown> = {}) {
  return {
    phase: '39C-SG',
    reportId,
    createdAt,
    status: 'blocked',
    blockers: ['execution_not_run'],
    warnings: [],
    ...extra,
  }
}

function hallucinationSafetyBaseline(createdAt: string) {
  return {
    phase: '39C-SG',
    reportId: 'phase_39c_sg_hallucination_safety_report',
    createdAt,
    noProviderCalls: true,
    noToolCalls: true,
    noRawPrompts: true,
    noRealMedia: true,
    noPublicOutput: true,
    blockers: ['execution_not_run'],
  }
}

function orderedExecutionCandidates(): VlmL4Candidate[] {
  return vlmSglangRuntimeCandidateExecutionOrder
    .map((modelId) => vlmL4CompatibleCandidates.find((candidate) => candidate.modelId === modelId))
    .filter((candidate): candidate is VlmL4Candidate => Boolean(candidate))
}

function selectBestPassingAttempt(attempts: readonly VlmSglangRuntimeAttempt[]): VlmSglangRuntimeAttempt | undefined {
  const passed = attempts.filter((attempt) => attempt.status === 'passed')
  if (!passed.length) return undefined
  return passed.slice().sort((a, b) => (
    vlmSglangRuntimeCandidateSelectionPriority.indexOf(a.candidate.modelId) - vlmSglangRuntimeCandidateSelectionPriority.indexOf(b.candidate.modelId)
  ))[0]
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

function sglangQaObjectPrefix(runId: string): string {
  return `activation/phase39c/generated-vlm-sglang-runtime/${runId}`
}

function sglangExpectedReports(): string[] {
  return [
    'phase_39c_sg_sglang_runtime_plan.json',
    'phase_39c_sg_sglang_source_evidence.json',
    'phase_39c_sg_sglang_license_evidence.json',
    'phase_39c_sg_sglang_runtime_support_evidence.json',
    'phase_39c_sg_sglang_structured_output_evidence.json',
    'phase_39c_sg_candidate_manifest.json',
    'phase_39c_sg_canary_fixture_manifest.json',
    'phase_39c_sg_generated_fixture_manifest.json',
    'phase_39c_sg_label_alias_map.json',
    'phase_39c_sg_model_asset_verification.json',
    'phase_39c_sg_runtime_capability_report.json',
    'phase_39c_sg_strategy_matrix_report.json',
    'phase_39c_sg_text_only_smoke_report.json',
    'phase_39c_sg_freeform_perception_report.json',
    'phase_39c_sg_labels_only_qa_report.json',
    'phase_39c_sg_coarse_region_qa_report.json',
    'phase_39c_sg_safe_zone_reasoning_report.json',
    'phase_39c_sg_decomposed_canonical_report.json',
    'phase_39c_sg_candidate_results.json',
    'phase_39c_sg_runtime_results.json',
    'phase_39c_sg_hallucination_safety_report.json',
    'phase_39c_sg_private_artifact_manifest.json',
    'phase_39c_sg_generated_runtime_recovery_report.json',
  ]
}

function blockedScopes(): string[] {
  return [
    'Phase 39D controlled real-frame VLM',
    'Phase 39E planning integration',
    'provider calls',
    'production',
    'internal beta',
    'external beta',
    'paid production',
    'public output',
    'broad user media',
    'broad real-media processing',
    'arbitrary media paths',
    'unapproved GPU types',
    'non-Qwen candidates',
    'new model downloads',
    'community quantizations',
    'Track A runtime/visual/render stack',
  ]
}

function buildFailureAudit(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG-BUILD',
    reportId: 'phase_39c_sg_build_failure_audit',
    createdAt,
    sourcePr: PR100_URL,
    localBuildxCommand: 'docker buildx build --platform linux/amd64 --push --provenance=false --sbom=false -f docker/prod/vlm-sglang-runtime/Dockerfile -t us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang:phase39c-sg-20260601t201814 .',
    observedHang: {
      approximateDurationMinutes: 14,
      producedImageDigest: false,
      cloudRunExecuted: false,
      privateModelCopyStarted: false,
      blocker: 'local_docker_buildx_hung_after_14m_idle_no_image_digest_no_cloud_run_execution',
    },
    likelyRiskAreas: [
      'large Python/CUDA dependency install during image build',
      'local Docker Desktop amd64 emulation/buildx reliability',
      'large existing Docker build cache',
    ],
    cloudBuildFallbackRecommended: true,
    cloudBuildBuildUnblockFollowUp: {
      fullCloudBuildAttempt: {
        buildId: '7edfcbfd-a406-40c8-a421-d69e0f404b67',
        status: 'cancelled_after_remote_publish_stall',
        summary: 'Remote Cloud Build progressed through dependency installation and layer push output, but the Artifact Registry tag/digest never became visible and the build stayed WORKING.',
      },
      overlayCloudBuildFallback: {
        enabledByDefault: true,
        configPath: CLOUD_BUILD_OVERLAY_CONFIG,
        baseImage: CLOUD_BUILD_OVERLAY_BASE_IMAGE,
        purpose: 'reuse the prior private SGLang image that already contains SGLang/libnuma and copy only patched worker runtime files',
      },
    },
  }
}

async function readTextFileOrEmpty(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath)
    return true
  } catch {
    return false
  }
}

async function findForbiddenTrackedBuildFiles(): Promise<{ allTrackedFiles: string[]; violations: string[] }> {
  const output = await runCommand('git', ['ls-files'], 60 * 1000)
  const allTrackedFiles = output.split('\n').map((line) => line.trim()).filter(Boolean)
  const forbiddenPayloadPatterns = [
    /\.safetensors$/i,
    /\.bin$/i,
    /\.pt$/i,
    /\.pth$/i,
    /\.onnx$/i,
    /(^|\/)hf-cache(\/|$)/i,
    /(^|\/)huggingface(\/|$)/i,
    /\.mp4$/i,
    /\.mov$/i,
    /\.mkv$/i,
    /\.wav$/i,
    /\.mp3$/i,
  ]
  const forbiddenEnvPayload = /(^|\/)\.env($|\.)/i
  const allowedEnvExamples = new Set([
    '.env.example',
    '.env.gcp.production.example',
    '.env.gcp.staging.example',
  ])
  return {
    allTrackedFiles,
    violations: allTrackedFiles.filter((filePath) => {
      if (allowedEnvExamples.has(filePath)) return false
      if (forbiddenEnvPayload.test(filePath)) return true
      return forbiddenPayloadPatterns.some((pattern) => pattern.test(filePath))
    }),
  }
}

function computeBuildDurationSeconds(build: Record<string, unknown>): number | undefined {
  const start = typeof build.startTime === 'string' ? Date.parse(build.startTime) : NaN
  const finish = typeof build.finishTime === 'string' ? Date.parse(build.finishTime) : NaN
  if (Number.isFinite(start) && Number.isFinite(finish) && finish >= start) return Math.round((finish - start) / 1000)
  return undefined
}

function selectedCloudBuildMode(): 'overlay' | 'full' {
  return process.env.REEDITPRO_VLM_SGLANG_CLOUD_BUILD_MODE === 'full' ? 'full' : 'overlay'
}

function selectedCloudBuildConfig(): string {
  return selectedCloudBuildMode() === 'full' ? CLOUD_BUILD_FULL_CONFIG : CLOUD_BUILD_OVERLAY_CONFIG
}

function parseGcloudJsonObjectOutput(output: string): Record<string, unknown> {
  const jsonStart = output.indexOf('{')
  const jsonEnd = output.lastIndexOf('}')
  if (jsonStart < 0 || jsonEnd < jsonStart) throw new Error(`gcloud did not return a JSON object: ${output.slice(0, 160)}`)
  return JSON.parse(output.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>
}

function extractCloudBuildImageDigest(build: Record<string, unknown>): string | undefined {
  const results = build.results as { images?: Array<{ digest?: unknown; name?: unknown }> } | undefined
  const digest = results?.images?.find((image) => String(image.name ?? '').startsWith(IMAGE_PATH))?.digest
  return typeof digest === 'string' && digest.startsWith('sha256:') ? digest : undefined
}

async function describeArtifactRegistryImageDigest(imageRef: string): Promise<string | undefined> {
  const metadata = parseGcloudJson(await runGcloud(['artifacts', 'docker', 'images', 'describe', imageRef, '--format=json'])) as Record<string, unknown>
  const digest = typeof metadata.image_summary === 'object' && metadata.image_summary
    ? (metadata.image_summary as { digest?: unknown }).digest
    : metadata.digest
  return typeof digest === 'string' && digest.startsWith('sha256:') ? digest : undefined
}

function safeCloudBuildMetadata(build: Record<string, unknown>): Record<string, unknown> {
  return {
    id: build.id,
    name: build.name,
    status: build.status,
    createTime: build.createTime,
    startTime: build.startTime,
    finishTime: build.finishTime,
    images: build.images,
    logUrl: build.logUrl,
    serviceAccount: build.serviceAccount,
    options: build.options,
    results: build.results,
  }
}

async function runCommand(command: string, args: string[], timeout: number): Promise<string> {
  const { stdout } = await execFileAsync(command, args, { timeout, maxBuffer: 1024 * 1024 * 100 })
  return stdout
}

function summarizeCommandError(error: unknown): string {
  if (error instanceof Error) return error.message.replace(/\s+/g, ' ').slice(0, 500)
  return String(error).replace(/\s+/g, ' ').slice(0, 500)
}

function sanitizeBlocker(value: string): string {
  return value.replace(/[^0-9A-Za-z_.:/=-]+/g, '_').slice(0, 500)
}

function serializeEnvVars(values: Record<string, string>): string {
  const delimiter = '|'
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value.replaceAll(delimiter, `\\${delimiter}`)}`)
    .join(delimiter)
    .replace(/^/, `^${delimiter}^`)
}
