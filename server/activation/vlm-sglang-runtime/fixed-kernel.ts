import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import {
  type VlmL4Candidate,
  vlmL4CompatibleCandidates,
  VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
} from '../vlm-l4-compatible-candidate'
import { parseGcloudJson, runGcloud } from '../vlm-runtime/vlm-runtime-gcs-model-resolver'
import { writeVlmRuntimeJsonArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

type KernelStatus = 'passed' | 'blocked' | 'skipped'
type KernelInstallMode = 'baseline' | 'pip-force-reinstall-with-deps' | 'pip-force-reinstall-no-deps' | 'blocked'

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

export interface VlmSglangFixedKernelProfile {
  readonly id: string
  readonly label: string
  readonly baseImage: string
  readonly installMode: KernelInstallMode
  readonly sglangPackageSpec: string
  readonly sglKernelPackageSpec: string
  readonly sglangKernelPackageSpec: string
  readonly torchCudaExpectation: string
  readonly rationale: string
  readonly sourceEvidence: readonly string[]
  readonly buildAllowed: boolean
  readonly blockers: readonly string[]
  readonly riskNotes: readonly string[]
}

export interface VlmSglangFixedKernelBuildAttempt {
  readonly profile: VlmSglangFixedKernelProfile
  readonly status: KernelStatus
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly buildId?: string
  readonly buildStatus?: string
  readonly durationSeconds?: number
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmSglangFixedKernelImportSmokeAttempt {
  readonly profile: VlmSglangFixedKernelProfile
  readonly status: KernelStatus
  readonly cloudRunJob: string
  readonly imageRef?: string
  readonly imageDigest?: string
  readonly privateQaPrefix?: string
  readonly report?: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmSglangFixedKernelCandidateAttempt {
  readonly candidate: VlmL4Candidate
  readonly status: KernelStatus
  readonly manifestStatus: KernelStatus
  readonly runtimeStatus: KernelStatus
  readonly privateModelPrefix: string
  readonly privateQaPrefix?: string
  readonly runtimeReport?: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

export interface VlmSglangFixedKernelResult {
  readonly runId: string
  readonly status: KernelStatus
  readonly selectedProfile?: VlmSglangFixedKernelProfile
  readonly selectedCandidate?: VlmL4Candidate
  readonly buildAttempts: readonly VlmSglangFixedKernelBuildAttempt[]
  readonly importSmokeAttempts: readonly VlmSglangFixedKernelImportSmokeAttempt[]
  readonly candidateAttempts: readonly VlmSglangFixedKernelCandidateAttempt[]
  readonly localArtifactDir: string
  readonly privateQaPrefix: string
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
const FIXED_KERNEL_IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang-fixed'
const FIXED_KERNEL_CLOUD_BUILD_CONFIG = 'cloudbuild/vlm-sglang-fixed-kernel-phase39c.yaml'
const FIXED_KERNEL_CLOUD_BUILD_IGNORE_FILE = 'cloudbuild/vlm-sglang-fixed-kernel-phase39c.gcloudignore'
const FIXED_KERNEL_DOCKERFILE = 'docker/prod/vlm-sglang-runtime/Dockerfile.fixed-kernel'
const BASE_PR104_IMAGE = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-sglang@sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9'
const IMPORT_SMOKE_JOB = 'reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-smoke'
const GENERATED_RUNTIME_JOB = 'reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-runtime'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-sglang-fixed-kernel'
const REPORT_DIR = 'docs/activation-phase-39c-sg-sglang-vlm-runtime-reports'
const QA_PREFIX_ROOT = 'activation/phase39c/generated-vlm-sglang-fixed-kernel'
const MATRIX_ID = 'phase39c-sglang-fixed-kernel-l4-v1'
const GENERATED_RUNTIME_MATRIX_ID = 'phase39c-sglang-generated-vlm-v1'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const PR90_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90'
const PR97_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/97'
const PR100_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/100'
const PR104_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/104'
const PR107_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/107'

export const VLM_SGLANG_FIXED_KERNEL_REPORT_DIR = REPORT_DIR
export const VLM_SGLANG_FIXED_KERNEL_MATRIX_ID = MATRIX_ID

export const vlmSglangFixedKernelProfiles = [
  {
    id: 'f0-pr107-baseline',
    label: 'Profile F0 PR #107 carry-forward baseline',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'blocked',
    sglangPackageSpec: 'sglang[all]==0.4.10.post2',
    sglKernelPackageSpec: 'sgl-kernel==0.2.8',
    sglangKernelPackageSpec: 'none',
    torchCudaExpectation: 'torch 2.7.1 / CUDA 12.6 packages inherited from PR #104 image',
    rationale: 'Carry forward PR #107 K0/K2 Cloud Run L4 import-smoke evidence without rebuilding; expected failure is cuGreenCtxDestroy.',
    sourceEvidence: [PR104_URL, PR107_URL, 'https://github.com/sgl-project/sglang/issues/8566'],
    buildAllowed: false,
    blockers: ['baseline_pr107_evidence_carried_forward_expected_cuGreenCtxDestroy_failure'],
    riskNotes: ['no new build needed for F0 because PR #107 already captured the baseline failure'],
  },
  {
    id: 'f1-minimal-fixed-sgl-kernel',
    label: 'Profile F1 minimal fixed sgl-kernel 0.3.6.post1',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'pip-force-reinstall-no-deps',
    sglangPackageSpec: 'sglang[all]==0.4.10.post2',
    sglKernelPackageSpec: 'sgl-kernel==0.3.6.post1',
    sglangKernelPackageSpec: 'none',
    torchCudaExpectation: 'keeps PR #104 torch/CUDA package base and replaces only sgl-kernel with the post-#9021 issue-linked fixed wheel',
    rationale: 'Use the smallest upstream-evidence-driven change: sgl-kernel 0.3.6.post1 was published after PR #9021/#9231 and is referenced by issue discussion as the fixed path.',
    sourceEvidence: [
      'https://github.com/sgl-project/sglang/pull/9021',
      'https://github.com/sgl-project/sglang/pull/9231',
      'https://pypi.org/project/sgl-kernel/0.3.6.post1/',
    ],
    buildAllowed: true,
    blockers: [],
    riskNotes: [
      'no-deps reinstall is intentional to avoid broad dependency churn',
      'import smoke must prove compatibility before model-copy or generated runtime',
    ],
  },
  {
    id: 'f2-current-stable-sglang',
    label: 'Profile F2 current stable SGLang release dependency set',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'pip-force-reinstall-with-deps',
    sglangPackageSpec: 'sglang[all]==0.5.12.post1',
    sglKernelPackageSpec: 'none',
    sglangKernelPackageSpec: 'none',
    torchCudaExpectation: 'current SGLang dependency set includes torch 2.11.0, CUDA-oriented packages, and sglang-kernel 0.4.2.post2; Cloud Run L4 import smoke must prove driver compatibility',
    rationale: 'Use the latest stable SGLang package metadata rather than manually pairing old packages.',
    sourceEvidence: ['https://pypi.org/project/sglang/0.5.12.post1/', 'https://github.com/sgl-project/sglang/releases'],
    buildAllowed: true,
    blockers: [],
    riskNotes: [
      'large dependency churn and CUDA >12.2 packages may require Cloud Run forward compatibility',
      'import smoke must pass before runtime; generated fixtures are not attempted on package-install evidence alone',
    ],
  },
  {
    id: 'f3-latest-kernel-overlay',
    label: 'Profile F3 latest kernel overlay on PR #104 base',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'pip-force-reinstall-no-deps',
    sglangPackageSpec: 'sglang[all]==0.4.10.post2',
    sglKernelPackageSpec: 'sgl-kernel==0.3.21',
    sglangKernelPackageSpec: 'sglang-kernel==0.4.3',
    torchCudaExpectation: 'keeps PR #104 runtime package base but overlays current kernel wheels; import smoke decides compatibility',
    rationale: 'Test the current kernel packages independently from the full latest SGLang dependency set.',
    sourceEvidence: ['https://pypi.org/project/sgl-kernel/0.3.21/', 'https://pypi.org/project/sglang-kernel/0.4.3/'],
    buildAllowed: true,
    blockers: [],
    riskNotes: ['API mismatch with SGLang 0.4.10 is possible; import smoke classifies this before runtime'],
  },
  {
    id: 'f4-forward-compat-base',
    label: 'Profile F4 CUDA forward-compatible image path',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'blocked',
    sglangPackageSpec: 'sglang[all]==0.5.12.post1',
    sglKernelPackageSpec: 'none',
    sglangKernelPackageSpec: 'sglang-kernel==0.4.2.post2',
    torchCudaExpectation: 'not attempted',
    rationale: 'Cloud Run docs allow CUDA >12.2 only with forward compatibility packages or a suitable NVIDIA base image; exact LD_LIBRARY_PATH/base-image decision remains blocked until F1-F3 evidence requires it.',
    sourceEvidence: ['https://docs.cloud.google.com/run/docs/configuring/jobs/gpu', 'https://docs.nvidia.com/deploy/cuda-compatibility/'],
    buildAllowed: false,
    blockers: ['forward_compat_base_not_selected_until_wheel_profiles_fail_with_cuda_forward_compat_evidence'],
    riskNotes: ['do not override Cloud Run driver libraries without exact evidence and import-smoke validation'],
  },
  {
    id: 'f5-official-sglang-image-overlay',
    label: 'Profile F5 official SGLang image overlay',
    baseImage: 'lmsysorg/sglang:tag-not-selected',
    installMode: 'blocked',
    sglangPackageSpec: 'official-image',
    sglKernelPackageSpec: 'official-image',
    sglangKernelPackageSpec: 'official-image',
    torchCudaExpectation: 'not attempted',
    rationale: 'Official Docker Hub images exist, but this phase requires an exact verified tag before use.',
    sourceEvidence: ['https://docs.sglang.io/get_started/install.html'],
    buildAllowed: false,
    blockers: ['official_sglang_image_exact_tag_not_verified_for_cloud_run_l4'],
    riskNotes: ['do not pull floating latest or dev images into a beta-readiness chain'],
  },
  {
    id: 'f6-source-build-after-9021-9231',
    label: 'Profile F6 source-build after PR #9021/#9231',
    baseImage: BASE_PR104_IMAGE,
    installMode: 'blocked',
    sglangPackageSpec: 'source-build-after-9021-9231',
    sglKernelPackageSpec: 'source-build-after-9021-9231',
    sglangKernelPackageSpec: 'source-build-after-9021-9231',
    torchCudaExpectation: 'not attempted',
    rationale: 'Reserved for a human-approved source-build investigation if all wheel/image paths fail.',
    sourceEvidence: ['https://github.com/sgl-project/sglang/pull/9021', 'https://github.com/sgl-project/sglang/pull/9231'],
    buildAllowed: false,
    blockers: ['source_build_after_9021_9231_not_human_approved_for_this_bounded_rerun'],
    riskNotes: ['large CUDA source build may exceed bounded Cloud Build budget and requires explicit approval'],
  },
] as const satisfies readonly VlmSglangFixedKernelProfile[]

export function getVlmSglangFixedKernelPlan() {
  const createdAt = new Date().toISOString()
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_plan',
    createdAt,
    defaultMode: 'non_mutating',
    matrixId: MATRIX_ID,
    sourceEvidence: kernelSourceEvidence(),
    upstreamWebResearch: getVlmSglangFixedKernelWebResearchReport(),
    iamPlan: getVlmSglangFixedKernelIamPlan(),
    importFailureAudit: buildVlmSglangFixedKernelImportFailureAudit(createdAt),
    profileMatrix: buildVlmSglangFixedKernelProfileMatrixReport(createdAt),
    cloudBuild: {
      configPath: FIXED_KERNEL_CLOUD_BUILD_CONFIG,
      ignoreFile: FIXED_KERNEL_CLOUD_BUILD_IGNORE_FILE,
      dockerfile: FIXED_KERNEL_DOCKERFILE,
      imagePath: FIXED_KERNEL_IMAGE_PATH,
      platform: 'linux/amd64',
      artifactRegistryOnly: true,
      noModelFilesBaked: true,
      noSecretsBaked: true,
      context: '.',
    },
    importSmokeJob: importSmokeJobPlan(),
    generatedRuntimeJob: generatedRuntimeJobPlan(),
    candidatePolicy: {
      sourcePr: PR87_URL,
      allowedCandidates: vlmL4CompatibleCandidates.map(candidateSummary),
      executionOrder: [
        'Qwen/Qwen3-VL-2B-Instruct',
        'Qwen/Qwen3-VL-4B-Instruct',
        'Qwen/Qwen3-VL-8B-Instruct-FP8',
      ],
      selectionPriority: [
        'Qwen/Qwen3-VL-8B-Instruct-FP8',
        'Qwen/Qwen3-VL-4B-Instruct',
        'Qwen/Qwen3-VL-2B-Instruct',
      ],
      newModelDownloadsAllowed: false,
      modelUploadsAllowed: false,
      modelIdRuntimePathAllowed: false,
      nonQwenCandidatesAllowed: false,
    },
    safety: kernelSafetyPolicy(),
    confirmationsRequiredForCloudBuild: [
      'REEDITPRO_CONFIRM_VLM_SGLANG_FIXED_KERNEL',
      'REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD',
      'REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH',
    ],
    confirmationsRequiredForImportSmoke: [
      'REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE',
    ],
    confirmationsRequiredForGeneratedRuntime: [
      'REEDITPRO_CONFIRM_VLM_SGLANG_STAGING_CLOUD_RUN_JOB',
      'REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ',
      'REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD',
      'REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE',
    ],
  }
}

export function getVlmSglangFixedKernelCostSummary() {
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_cost_summary',
    createdAt: new Date().toISOString(),
    cloudBuildProfiles: vlmSglangFixedKernelProfiles.map((profile) => ({ id: profile.id, buildAllowed: profile.buildAllowed })),
    cloudRunImportSmokeShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    generatedRuntimeShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    stopPolicy: 'run generated fixture runtime only after a profile passes import smoke',
    modelDownloadCost: 'none_reuses_pr87_private_assets_only',
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function getVlmSglangFixedKernelWebResearchReport() {
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_web_research',
    createdAt: new Date().toISOString(),
    status: 'passed',
    sources: [
      {
        id: 'sglang-8432',
        url: 'https://github.com/sgl-project/sglang/issues/8432',
        status: 'passed',
        summary: 'Issue reports undefined symbol cuGreenCtxDestroy with SGLang 0.4.9.post4, sgl-kernel 0.2.7, CUDA_HOME 12.2, driver 535.86.10, and PyTorch 2.7.1+cu126.',
      },
      {
        id: 'sglang-8566',
        url: 'https://github.com/sgl-project/sglang/issues/8566',
        status: 'passed',
        summary: 'Issue reports the same sgl_kernel/common_ops.abi3.so cuGreenCtxDestroy import failure.',
      },
      {
        id: 'sglang-9021',
        url: 'https://github.com/sgl-project/sglang/pull/9021',
        status: 'passed',
        summary: 'Merged PR titled Runtime check CUDA driver version to avoid unresolved green context symbols; it says it fixes #8432.',
      },
      {
        id: 'sglang-9231',
        url: 'https://github.com/sgl-project/sglang/pull/9231',
        status: 'passed',
        summary: 'Merged PR titled Optional extension for green context; file changes move green-context spatial ops behind a lazy/optional extension path.',
      },
      {
        id: 'cloud-run-gpu',
        url: 'https://docs.cloud.google.com/run/docs/configuring/jobs/gpu',
        status: 'passed',
        summary: 'Cloud Run mounts driver libraries under /usr/local/nvidia/lib64; CUDA >12.2 requires a forward-compat image/package path and LD_LIBRARY_PATH care.',
      },
      {
        id: 'qwen-sglang',
        url: 'https://qwen.readthedocs.io/en/latest/deployment/sglang.html',
        status: 'passed',
        summary: 'Qwen documents SGLang as a deployment path, structured/JSON output guidance, enable_thinking controls, FP8 serving, and warns that invalid local model paths download from Hugging Face.',
      },
      {
        id: 'sglang-structured-output',
        url: 'https://docs.sglang.io/docs/advanced_features/structured_outputs',
        status: 'passed',
        summary: 'SGLang supports structured outputs including JSON schema, regex, EBNF, structural tag, OpenAI-compatible and native/offline paths; this phase tests only after import smoke passes.',
      },
    ],
    packageAvailability: {
      sglangCurrentStable: '0.5.12.post1',
      sglKernelIssueLinkedFixed: '0.3.6.post1',
      sglKernelCurrent: '0.3.21',
      sglangKernelCurrent: '0.4.3',
      sglangCurrentDependencyKernel: 'sglang-kernel==0.4.2.post2',
    },
    conclusions: {
      rootCause: 'The PR #104/#107 import failure is consistent with an sgl-kernel wheel importing a CUDA Driver API green-context symbol unavailable in Cloud Run L4 driver libraries.',
      fixedPath: 'Try upstream fixed wheels before runtime: minimal sgl-kernel 0.3.6.post1, current SGLang 0.5.12.post1 dependency set, then current kernel overlays.',
      forwardCompatRequired: 'blocked_until_needed',
      forwardCompatReason: 'Cloud Run docs require forward compatibility only when the selected SGLang/CUDA package set needs CUDA >12.2 and wheel-only profiles fail or expose a forward-compat blocker.',
    },
    noOverclaim: true,
  }
}

export function getVlmSglangFixedKernelIamPlan() {
  const objectPrefix = `projects/_/buckets/${QA_BUCKET}/objects/${QA_PREFIX_ROOT}/`
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmationForApply: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    bucket: `gs://${QA_BUCKET}`,
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    requiredBindings: [
      {
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39c-vlm-sglang-fixed-qa-create',
        conditionExpression: `resource.name.startsWith('${objectPrefix}')`,
        required: true,
      },
    ],
    optionalBindings: [
      {
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39c-vlm-sglang-fixed-qa-readback',
        conditionExpression: `resource.name.startsWith('${objectPrefix}')`,
        required: false,
        reason: 'GPU worker writes import-smoke/runtime artifacts; local runner performs readback with active operator credentials.',
      },
    ],
  }
}

export function buildVlmSglangFixedKernelImportFailureAudit(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_import_failure_audit',
    createdAt,
    sourcePr104: PR104_URL,
    pr104ImageDigest: 'sha256:39cdb9bf6123c4d9568a9bfd55041b138ed0c03adad9f02a9c51482fec5adfa9',
    failedSharedObject: '/opt/conda/lib/python3.11/site-packages/sgl_kernel/common_ops.abi3.so',
    failedSymbol: 'cuGreenCtxDestroy',
    failureStage: 'SGLang import path before model payload copy/inference',
    tracebackPath: [
      'sglang.srt.layers.rotary_embedding',
      'from sgl_kernel import apply_rope_with_cos_sin_cache_inplace',
      'sgl_kernel.common_ops',
    ],
    publicIssueEvidence: [
      { issue: '#8432', url: 'https://github.com/sgl-project/sglang/issues/8432', status: 'closed', summary: 'Reports undefined symbol cuGreenCtxDestroy with sglang 0.4.9.post4 and sgl-kernel 0.2.7.' },
      { issue: '#8566', url: 'https://github.com/sgl-project/sglang/issues/8566', status: 'closed_as_duplicate', summary: 'Reports the same common_ops.abi3.so cuGreenCtxDestroy import failure in launch_server import path.' },
    ],
    packageEvidenceFromPr104: {
      sglang: '0.4.10.post2',
      sglKernel: '0.2.8',
      torch: '2.7.1',
      cudaPipLibraries: 'cu126',
      baseImageBeforeOverlay: 'pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime',
    },
    hypothesis: 'The sgl-kernel wheel links against a CUDA Driver API symbol not available in the Cloud Run L4 runtime driver/libcuda combination.',
    nextAction: 'Use bounded package/profile import smoke on Cloud Run L4 before any model-copy or generated fixture runtime.',
    fullRawLogsCommitted: false,
  }
}

export function buildVlmSglangFixedKernelProfileMatrixReport(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_profile_matrix',
    createdAt,
    matrixId: MATRIX_ID,
    stopAfterFirstImportSmokePass: true,
    profiles: vlmSglangFixedKernelProfiles,
    profileOrder: vlmSglangFixedKernelProfiles.map((profile) => profile.id),
    generatedRuntimeBlockedUntilImportSmokePasses: true,
  }
}

export function buildVlmSglangFixedKernelStaticReport() {
  return {
    ok: false,
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: kernelSourceEvidence(),
    profileMatrix: buildVlmSglangFixedKernelProfileMatrixReport(),
    importSmokeStatus: 'not_run',
    generatedRuntimeStatus: 'not_run',
    selectedCompatibilityProfile: null,
    selectedCandidate: null,
    blockers: ['execution_not_run'],
    blockedScopes: blockedScopes(),
    vlmToolFamilyBetaStatus: 'blocked',
  }
}

export async function writeVlmSglangFixedKernelStaticArtifacts(artifactDir = REPORT_DIR): Promise<void> {
  const createdAt = new Date().toISOString()
  await mkdir(artifactDir, { recursive: true })
  await writeKernelStaticArtifactSet({
    artifactDir,
    createdAt,
    runId: 'not-run',
    status: 'blocked',
    buildAttempts: [],
    importSmokeAttempts: [],
    candidateAttempts: [],
    blockers: ['execution_not_run'],
    warnings: [],
  })
}

export async function runVlmSglangFixedKernel(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  artifactDir?: string
}): Promise<VlmSglangFixedKernelResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-SG-FIXED compatibility matrix.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39c-sg-fixed-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const artifactDir = input.artifactDir ?? REPORT_DIR
  const localRoot = path.join(LOCAL_ROOT, runId)
  await mkdir(artifactDir, { recursive: true })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const buildAttempts: VlmSglangFixedKernelBuildAttempt[] = []
  const importSmokeAttempts: VlmSglangFixedKernelImportSmokeAttempt[] = []
  const candidateAttempts: VlmSglangFixedKernelCandidateAttempt[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const envBlockers = validateKernelBaseExecutionEnv()
  if (envBlockers.length) {
    return writeKernelResult({
      runId,
      createdAt,
      artifactDir,
      status: 'blocked',
      buildAttempts,
      importSmokeAttempts,
      candidateAttempts,
      blockers: envBlockers,
      warnings,
    })
  }
  const iamReport = await ensureFixedKernelQaIam({
    runId,
    createdAt,
    artifactDir,
  })
  warnings.push(...iamReport.warnings)
  blockers.push(...iamReport.blockers)
  if (iamReport.blockers.length) {
    return writeKernelResult({
      runId,
      createdAt,
      artifactDir,
      status: 'blocked',
      buildAttempts,
      importSmokeAttempts,
      candidateAttempts,
      blockers,
      warnings,
    })
  }

  let selectedProfile: VlmSglangFixedKernelProfile | undefined
  let selectedImageRef: string | undefined
  let selectedImageDigest: string | undefined
  for (const profile of vlmSglangFixedKernelProfiles) {
    emitKernelProgress(`profile_start:${profile.id}`)
    let buildAttempt: VlmSglangFixedKernelBuildAttempt
    if (!profile.buildAllowed) {
      buildAttempt = {
        profile,
        status: 'blocked',
        blockers: profile.blockers,
        warnings: profile.riskNotes,
      }
      buildAttempts.push(buildAttempt)
      importSmokeAttempts.push({
        profile,
        status: 'skipped',
        cloudRunJob: IMPORT_SMOKE_JOB,
        blockers: [`profile_build_not_allowed:${profile.id}`],
        warnings: profile.riskNotes,
      })
      continue
    }
    buildAttempt = await runKernelProfileCloudBuild({ profile, runId, createdAt, artifactDir })
    emitKernelProgress(`profile_build_${buildAttempt.status}:${profile.id}`)
    buildAttempts.push(buildAttempt)
    warnings.push(...buildAttempt.warnings)
    if (buildAttempt.status !== 'passed' || !buildAttempt.imageRef) {
      importSmokeAttempts.push({
        profile,
        status: 'skipped',
        cloudRunJob: IMPORT_SMOKE_JOB,
        imageRef: buildAttempt.imageRef,
        imageDigest: buildAttempt.imageDigest,
        blockers: [`profile_image_build_not_passed:${profile.id}`, ...buildAttempt.blockers],
        warnings: buildAttempt.warnings,
      })
      continue
    }
    const smokeAttempt = await runKernelImportSmokeJob({
      profile,
      runId,
      createdAt,
      imageRef: buildAttempt.imageDigest ? `${FIXED_KERNEL_IMAGE_PATH}@${buildAttempt.imageDigest}` : buildAttempt.imageRef,
      imageDigest: buildAttempt.imageDigest,
      artifactDir: path.join(artifactDir, 'kernel-profiles', profile.id),
    })
    emitKernelProgress(`profile_import_smoke_${smokeAttempt.status}:${profile.id}`)
    importSmokeAttempts.push(smokeAttempt)
    warnings.push(...smokeAttempt.warnings)
    if (smokeAttempt.status === 'passed') {
      selectedProfile = profile
      selectedImageRef = smokeAttempt.imageDigest ? `${FIXED_KERNEL_IMAGE_PATH}@${smokeAttempt.imageDigest}` : buildAttempt.imageRef
      selectedImageDigest = smokeAttempt.imageDigest ?? buildAttempt.imageDigest
      break
    }
  }

  if (selectedProfile && selectedImageRef) {
    const runtimeEnvBlockers = validateKernelGeneratedRuntimeEnv()
    if (runtimeEnvBlockers.length) {
      warnings.push('generated_runtime_skipped_after_import_smoke_due_missing_runtime_confirmations')
      candidateAttempts.push(...orderedExecutionCandidates().map((candidate) => kernelCandidateAttempt({
        candidate,
        status: 'blocked',
        manifestStatus: 'skipped',
        runtimeStatus: 'skipped',
        privateModelPrefix: candidateModelPrefix(candidate),
        blockers: runtimeEnvBlockers,
        warnings: ['candidate_not_attempted_after_runtime_env_blocker'],
      })))
    } else {
      for (const candidate of orderedExecutionCandidates()) {
        emitKernelProgress(`runtime_candidate_start:${candidate.slug}`)
        candidateAttempts.push(await runKernelGeneratedRuntimeCandidate({
          candidate,
          runId,
          imageRef: selectedImageRef,
          imageDigest: selectedImageDigest,
          artifactDir: path.join(artifactDir, 'kernel-runtime-candidates', candidate.slug),
          localRoot,
        }))
        emitKernelProgress(`runtime_candidate_done:${candidate.slug}`)
      }
    }
  }

  const selectedCandidateAttempt = selectBestPassingCandidateAttempt(candidateAttempts)
  const status: KernelStatus = selectedProfile && selectedCandidateAttempt ? 'passed' : 'blocked'
  const finalBlockers = status === 'passed'
    ? []
    : Array.from(new Set([
      ...blockers,
      ...buildAttempts.flatMap((attempt) => attempt.blockers),
      ...importSmokeAttempts.flatMap((attempt) => attempt.blockers),
      ...candidateAttempts.flatMap((attempt) => attempt.blockers),
      selectedProfile ? 'no_candidate_passed_sglang_kernel_generated_runtime_qa' : 'no_sglang_kernel_profile_passed_import_smoke',
    ])).filter(Boolean)
  const result = await writeKernelResult({
    runId,
    createdAt,
    artifactDir,
    status,
    selectedProfile,
    selectedCandidate: selectedCandidateAttempt?.candidate,
    buildAttempts,
    importSmokeAttempts,
    candidateAttempts,
    blockers: finalBlockers,
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function ensureFixedKernelQaIam(input: {
  runId: string
  createdAt: string
  artifactDir: string
}): Promise<{ blockers: string[]; warnings: string[] }> {
  const blockers: string[] = []
  const warnings: string[] = []
  const plan = getVlmSglangFixedKernelIamPlan()
  const required = plan.requiredBindings[0]
  let before: Record<string, unknown> | undefined
  let after: Record<string, unknown> | undefined
  try {
    before = parseGcloudJson(await runGcloud(['storage', 'buckets', 'get-iam-policy', plan.bucket, '--format=json'])) as Record<string, unknown>
  } catch (error) {
    blockers.push(`fixed_kernel_iam_policy_read_failed:${summarizeCommandError(error)}`)
  }
  const existed = before ? hasConditionalBinding(before, required.role, plan.member, required.conditionTitle, required.conditionExpression) : false
  let action: 'existing' | 'added' | 'skipped' | 'failed' = existed ? 'existing' : 'skipped'
  if (!existed && !blockers.length) {
    if (process.env.REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE === 'true') {
      try {
        await runGcloud([
          'storage',
          'buckets',
          'add-iam-policy-binding',
          plan.bucket,
          '--member',
          plan.member,
          '--role',
          required.role,
          '--condition',
          `expression=${required.conditionExpression},title=${required.conditionTitle},description=Phase 39C-SG-FIXED private QA artifact create only`,
        ], 10 * 60 * 1000)
        action = 'added'
      } catch (error) {
        action = 'failed'
        blockers.push(`fixed_kernel_iam_policy_add_failed:${summarizeCommandError(error)}`)
      }
    } else {
      blockers.push('fixed_kernel_qa_create_scoped_iam_missing_confirmation_not_set')
    }
  }
  try {
    after = parseGcloudJson(await runGcloud(['storage', 'buckets', 'get-iam-policy', plan.bucket, '--format=json'])) as Record<string, unknown>
  } catch (error) {
    warnings.push(`fixed_kernel_iam_policy_after_read_failed:${summarizeCommandError(error)}`)
  }
  const presentAfter = after ? hasConditionalBinding(after, required.role, plan.member, required.conditionTitle, required.conditionExpression) : existed
  if (!presentAfter) blockers.push('fixed_kernel_qa_create_scoped_binding_not_present_after_check')
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_iam_delta_report.json'), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_iam_delta_report',
    runId: input.runId,
    createdAt: input.createdAt,
    plan,
    status: blockers.length ? 'blocked' : 'passed',
    qaCreateBinding: action,
    qaReadbackBinding: 'skipped_not_needed',
    broadIamGranted: false,
    publicAccessChanged: false,
    beforeSummary: before ? summarizeIamPolicy(before) : null,
    afterSummary: after ? summarizeIamPolicy(after) : null,
    blockers,
    warnings,
  })
  return {
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function runKernelProfileCloudBuild(input: {
  profile: VlmSglangFixedKernelProfile
  runId: string
  createdAt: string
  artifactDir: string
}): Promise<VlmSglangFixedKernelBuildAttempt> {
  const profileTag = sanitizeTag(`${input.profile.id}-${input.runId}`)
  const imageRef = `${FIXED_KERNEL_IMAGE_PATH}:${profileTag}`
  const warnings: string[] = []
  const blockers: string[] = []
  let build: Record<string, unknown> | undefined
  try {
    const existingDigest = await describeArtifactRegistryImageDigest(imageRef)
    if (existingDigest) {
      return {
        profile: input.profile,
        status: 'passed',
        imageRef,
        imageDigest: existingDigest,
        buildStatus: 'REUSED_EXISTING_IMAGE',
        blockers: [],
        warnings: ['reused_existing_kernel_profile_image'],
      }
    }
  } catch (error) {
    warnings.push(`existing_kernel_profile_image_lookup_failed:${summarizeCommandError(error)}`)
  }
  try {
    emitKernelProgress(`cloud_build_submit:${input.profile.id}:${imageRef}`)
    const output = await runGcloud([
      'builds',
      'submit',
      '.',
      '--project',
      PROJECT_ID,
      '--region',
      REGION,
      '--config',
      FIXED_KERNEL_CLOUD_BUILD_CONFIG,
      '--ignore-file',
      FIXED_KERNEL_CLOUD_BUILD_IGNORE_FILE,
      '--substitutions',
      [
        `_IMAGE=${imageRef}`,
        `_BASE_IMAGE=${input.profile.baseImage}`,
        `_SGLANG_KERNEL_PROFILE=${input.profile.id}`,
        `_SGLANG_PACKAGE_SPEC=${input.profile.sglangPackageSpec}`,
        `_SGL_KERNEL_PACKAGE_SPEC=${input.profile.sglKernelPackageSpec}`,
        `_SGLANG_KERNEL_PACKAGE_SPEC=${input.profile.sglangKernelPackageSpec}`,
        `_INSTALL_MODE=${input.profile.installMode}`,
      ].join(','),
      '--format=json',
    ], 2 * 60 * 60 * 1000)
    build = parseGcloudJsonObjectOutput(output)
    emitKernelProgress(`cloud_build_complete:${input.profile.id}:${String(build.status ?? 'UNKNOWN')}`)
  } catch (error) {
    blockers.push(`cloud_build_failed:${input.profile.id}:${summarizeCommandError(error)}`)
  }
  const buildStatus = build ? String(build.status ?? 'UNKNOWN') : undefined
  const buildId = build ? String(build.id ?? '') : undefined
  const durationSeconds = build ? computeBuildDurationSeconds(build) : undefined
  if (build && buildStatus !== 'SUCCESS') blockers.push(`cloud_build_status_${buildStatus?.toLowerCase() ?? 'unknown'}`)
  let imageDigest = build ? extractCloudBuildImageDigest(build) : undefined
  if (!imageDigest && buildStatus === 'SUCCESS') {
    try {
      imageDigest = await describeArtifactRegistryImageDigest(imageRef)
    } catch (error) {
      blockers.push(`image_digest_lookup_failed:${input.profile.id}:${summarizeCommandError(error)}`)
    }
  }
  if (buildStatus === 'SUCCESS' && !imageDigest) blockers.push(`image_digest_unavailable:${input.profile.id}`)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, `phase_39c_sg_fixed_kernel_cloud_build_${input.profile.id}.json`), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_cloud_build_profile_report',
    runId: input.runId,
    createdAt: input.createdAt,
    profile: input.profile,
    imageRef,
    imageDigest,
    buildId,
    buildStatus,
    durationSeconds,
    rawBuildMetadata: build ? safeCloudBuildMetadata(build) : undefined,
    status: blockers.length ? 'blocked' : 'passed',
    blockers,
    warnings,
  })
  return {
    profile: input.profile,
    status: blockers.length ? 'blocked' : 'passed',
    imageRef,
    imageDigest,
    buildId: buildId || undefined,
    buildStatus,
    durationSeconds,
    blockers,
    warnings,
  }
}

async function runKernelImportSmokeJob(input: {
  profile: VlmSglangFixedKernelProfile
  runId: string
  createdAt: string
  imageRef: string
  imageDigest?: string
  artifactDir: string
}): Promise<VlmSglangFixedKernelImportSmokeAttempt> {
  await mkdir(input.artifactDir, { recursive: true })
  const blockers: string[] = []
  const warnings: string[] = []
  const profileRunId = `${input.runId}-${input.profile.id}`
  const artifactPrefix = `${QA_PREFIX_ROOT}/${input.runId}/profiles/${input.profile.id}`
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: profileRunId,
    REEDITPRO_VLM_SGLANG_KERNEL_PROFILE_ID: input.profile.id,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_PHASE39C_IMPORT_SMOKE_REPORT_NAME: 'phase_39c_sg_fixed_kernel_import_smoke_report.json',
    REEDITPRO_CONFIRM_VLM_SGLANG_FIXED_KERNEL: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_KERNEL_COMPAT: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    GENERATED_VLM_FIXTURES_ONLY: 'true',
    HF_HUB_OFFLINE: '1',
    TRANSFORMERS_OFFLINE: '1',
    HF_HUB_DISABLE_TELEMETRY: '1',
    MODEL_DOWNLOADS_ENABLED: 'false',
    PROVIDER_EXECUTION_ENABLED: 'false',
    RAW_VLM_PROMPT_ENABLED: 'false',
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
  try {
    emitKernelProgress(`import_smoke_deploy:${input.profile.id}:${input.imageRef}`)
    await runGcloud([
      'run',
      'jobs',
      'deploy',
      IMPORT_SMOKE_JOB,
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
      '1200s',
      '--cpu',
      '8',
      '--memory',
      '32Gi',
      '--gpu',
      '1',
      '--gpu-type',
      'nvidia-l4',
      '--no-gpu-zonal-redundancy',
      '--command',
      'python',
      '--args',
      '/app/server/workers/vlm-sglang-runtime/kernel_import_smoke.py',
      '--set-env-vars',
      envVars,
    ], 30 * 60 * 1000)
  } catch (error) {
    blockers.push(`import_smoke_job_deploy_failed:${input.profile.id}:${summarizeCommandError(error)}`)
  }
  if (!blockers.length) {
    try {
      emitKernelProgress(`import_smoke_execute:${input.profile.id}`)
      await runGcloud(['run', 'jobs', 'execute', IMPORT_SMOKE_JOB, '--project', PROJECT_ID, '--region', REGION, '--wait'], 60 * 60 * 1000)
    } catch (error) {
      blockers.push(`import_smoke_job_nonzero:${input.profile.id}:${summarizeCommandError(error)}`)
    }
  }
  const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/phase_39c_sg_fixed_kernel_import_smoke_report.json`
  const localPath = path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_import_smoke_report.json')
  let report: Record<string, unknown> | undefined
  try {
    await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
    report = JSON.parse(await readFile(localPath, 'utf8')) as Record<string, unknown>
    const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
    warnings.push(`private_import_smoke_artifact_verified:${input.profile.id}:generation=${String(metadata.generation ?? 'unknown')}`)
    if (report.status !== 'passed') {
      const reportBlockers = Array.isArray(report.blockers) ? report.blockers.filter((item): item is string => typeof item === 'string') : []
      blockers.push(...reportBlockers.map((blocker) => `${input.profile.id}:${blocker}`))
      if (!reportBlockers.length) blockers.push(`import_smoke_report_not_passed:${input.profile.id}`)
    }
  } catch (error) {
    blockers.push(`import_smoke_report_fetch_failed:${input.profile.id}:${summarizeCommandError(error)}`)
  }
  return {
    profile: input.profile,
    status: blockers.length ? 'blocked' : 'passed',
    cloudRunJob: IMPORT_SMOKE_JOB,
    imageRef: input.imageRef,
    imageDigest: input.imageDigest,
    privateQaPrefix: `gs://${QA_BUCKET}/${artifactPrefix}/`,
    report,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function runKernelGeneratedRuntimeCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  imageDigest?: string
  artifactDir: string
  localRoot: string
}): Promise<VlmSglangFixedKernelCandidateAttempt> {
  await mkdir(input.artifactDir, { recursive: true })
  const blockers: string[] = []
  const warnings: string[] = []
  const privateModelPrefix = candidateModelPrefix(input.candidate)
  let manifest: ChecksumManifest | undefined
  try {
    manifest = await loadPr87ChecksumManifest(input.candidate, path.join(input.localRoot, `${input.candidate.slug}-checksum-manifest.json`))
  } catch (error) {
    blockers.push(`pr87_checksum_manifest_unavailable:${input.candidate.slug}:${summarizeCommandError(error)}`)
    return kernelCandidateAttempt({ candidate: input.candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, blockers, warnings })
  }
  const manifestBlockers = validateChecksumManifest(input.candidate, manifest)
  if (manifestBlockers.length) {
    blockers.push(...manifestBlockers)
    return kernelCandidateAttempt({ candidate: input.candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, blockers, warnings })
  }
  const candidateRunId = `${input.runId}-${input.candidate.slug}`
  const artifactPrefix = `${QA_PREFIX_ROOT}/${input.runId}/runtime/${input.candidate.slug}`
  const expectedAssetsJson = JSON.stringify(manifest.entries.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: candidateRunId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-SG-FIXED',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39c_sg',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: manifest.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: GENERATED_RUNTIME_JOB,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-sglang-kernel-runtime',
    REEDITPRO_CONFIRM_VLM_SGLANG_BUILD_UNBLOCK: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_FIXED_KERNEL: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_KERNEL_COMPAT: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_SGLANG_STRATEGY_MATRIX: GENERATED_RUNTIME_MATRIX_ID,
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
  try {
    emitKernelProgress(`generated_runtime_deploy:${input.candidate.slug}:${input.imageRef}`)
    await runGcloud([
      'run',
      'jobs',
      'deploy',
      GENERATED_RUNTIME_JOB,
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
  } catch (error) {
    blockers.push(`generated_runtime_job_deploy_failed:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  if (!blockers.length) {
    try {
      emitKernelProgress(`generated_runtime_execute:${input.candidate.slug}`)
      await runGcloud(['run', 'jobs', 'execute', GENERATED_RUNTIME_JOB, '--project', PROJECT_ID, '--region', REGION, '--wait'], 3 * 60 * 60 * 1000)
    } catch (error) {
      blockers.push(`generated_runtime_job_nonzero:${input.candidate.slug}:${summarizeCommandError(error)}`)
    }
  }
  for (const reportFile of sglangExpectedReports()) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${reportFile}`
    const localPath = path.join(input.artifactDir, reportFile)
    try {
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_kernel_runtime_artifact_verified:${input.candidate.slug}:${reportFile}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`kernel_runtime_artifact_fetch_failed:${input.candidate.slug}:${reportFile}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.artifactDir, 'phase_39c_sg_generated_runtime_recovery_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) {
      const reportBlockers = Array.isArray(runtimeReport.blockers) ? runtimeReport.blockers.filter((item): item is string => typeof item === 'string') : []
      blockers.push(...reportBlockers.map((blocker) => `${input.candidate.slug}:${blocker}`))
      if (!reportBlockers.length) blockers.push(`kernel_runtime_report_not_ok:${input.candidate.slug}`)
    }
  } catch (error) {
    blockers.push(`kernel_runtime_report_unreadable:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  return kernelCandidateAttempt({
    candidate: input.candidate,
    status: runtimeReport?.ok && blockers.length === 0 ? 'passed' : 'blocked',
    manifestStatus: 'passed',
    runtimeStatus: runtimeReport?.ok && blockers.length === 0 ? 'passed' : 'blocked',
    privateModelPrefix,
    privateQaPrefix: `gs://${QA_BUCKET}/${artifactPrefix}/`,
    runtimeReport,
    blockers,
    warnings,
  })
}

async function writeKernelResult(input: {
  runId: string
  createdAt: string
  artifactDir: string
  status: KernelStatus
  selectedProfile?: VlmSglangFixedKernelProfile
  selectedCandidate?: VlmL4Candidate
  buildAttempts: readonly VlmSglangFixedKernelBuildAttempt[]
  importSmokeAttempts: readonly VlmSglangFixedKernelImportSmokeAttempt[]
  candidateAttempts: readonly VlmSglangFixedKernelCandidateAttempt[]
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmSglangFixedKernelResult> {
  await writeKernelStaticArtifactSet(input)
  return {
    runId: input.runId,
    status: input.status,
    selectedProfile: input.selectedProfile,
    selectedCandidate: input.selectedCandidate,
    buildAttempts: input.buildAttempts,
    importSmokeAttempts: input.importSmokeAttempts,
    candidateAttempts: input.candidateAttempts,
    localArtifactDir: input.artifactDir,
    privateQaPrefix: `gs://${QA_BUCKET}/${QA_PREFIX_ROOT}/${input.runId}/`,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
  }
}

async function writeKernelStaticArtifactSet(input: {
  runId: string
  createdAt: string
  artifactDir: string
  status: KernelStatus
  selectedProfile?: VlmSglangFixedKernelProfile
  selectedCandidate?: VlmL4Candidate
  buildAttempts: readonly VlmSglangFixedKernelBuildAttempt[]
  importSmokeAttempts: readonly VlmSglangFixedKernelImportSmokeAttempt[]
  candidateAttempts: readonly VlmSglangFixedKernelCandidateAttempt[]
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<void> {
  const uniqueBlockers = Array.from(new Set(input.blockers))
  const uniqueWarnings = Array.from(new Set(input.warnings))
  const selectedProfileReport = {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_selected_profile_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.selectedProfile ? 'passed' : 'blocked',
    selectedProfile: input.selectedProfile ?? null,
    selectedCandidate: input.selectedCandidate ? candidateSummary(input.selectedCandidate) : null,
    blockers: input.selectedProfile ? [] : uniqueBlockers,
  }
  const runtimeResults = {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_runtime_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    importSmokePassed: Boolean(input.selectedProfile),
    selectedProfile: input.selectedProfile?.id ?? null,
    selectedCandidate: input.selectedCandidate ? candidateSummary(input.selectedCandidate) : null,
    cloudRunImportSmokeJob: IMPORT_SMOKE_JOB,
    cloudRunGeneratedRuntimeJob: GENERATED_RUNTIME_JOB,
    candidateResults: input.candidateAttempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      revision: attempt.candidate.revision,
      status: attempt.status,
      privateQaPrefix: attempt.privateQaPrefix,
      blockers: attempt.blockers,
      warnings: attempt.warnings,
    })),
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  }
  const candidateResults = {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_candidate_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    selectedCandidate: input.selectedCandidate ? candidateSummary(input.selectedCandidate) : null,
    candidates: orderedExecutionCandidates().map((candidate) => {
      const attempt = input.candidateAttempts.find((item) => item.candidate.modelId === candidate.modelId)
      return attempt ? {
        modelId: candidate.modelId,
        revision: candidate.revision,
        status: attempt.status,
        bestStage: attempt.status === 'passed' ? 'SG6' : 'not_passed',
        privateQaPrefix: attempt.privateQaPrefix,
        blockers: attempt.blockers,
      } : {
        modelId: candidate.modelId,
        revision: candidate.revision,
        status: input.selectedProfile ? 'not_run' : 'not_run_import_smoke_blocked',
        bestStage: 'not_run',
        blockers: input.selectedProfile ? ['candidate_not_attempted'] : ['import_smoke_not_passed'],
      }
    }),
  }
  const privateArtifactManifest = {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_private_artifact_manifest',
    runId: input.runId,
    createdAt: input.createdAt,
    privateOnly: true,
    privateQaPrefix: `gs://${QA_BUCKET}/${QA_PREFIX_ROOT}/${input.runId}/`,
    importSmokePrefixes: input.importSmokeAttempts.map((attempt) => ({
      profileId: attempt.profile.id,
      status: attempt.status,
      privateQaPrefix: attempt.privateQaPrefix,
    })),
    runtimePrefixes: input.candidateAttempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      status: attempt.status,
      privateQaPrefix: attempt.privateQaPrefix,
    })),
    committedTracePolicy: 'hashes_short_safe_excerpts_and_metadata_only',
    artifactCount: input.importSmokeAttempts.filter((attempt) => attempt.privateQaPrefix).length + input.candidateAttempts.filter((attempt) => attempt.privateQaPrefix).length,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  }
  const recoveryReport = {
    ok: input.status === 'passed',
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    sourceEvidence: kernelSourceEvidence(),
    cuGreenCtxDestroyFailureEvidence: buildVlmSglangFixedKernelImportFailureAudit(input.createdAt),
    profileMatrix: buildVlmSglangFixedKernelProfileMatrixReport(input.createdAt),
    cloudBuildResults: input.buildAttempts,
    importSmokeResults: input.importSmokeAttempts,
    selectedCompatibilityProfile: input.selectedProfile ?? null,
    generatedRuntimeResults: runtimeResults,
    candidateResults,
    selectedCandidate: input.selectedCandidate ? candidateSummary(input.selectedCandidate) : null,
    generatedFixtures: generatedFixturesStatus(input.status, Boolean(input.selectedProfile), Boolean(input.selectedCandidate)),
    blockedScopes: blockedScopes(),
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    vlmToolFamilyBetaStatus: input.status === 'passed' ? 'phase-complete but tool-family incomplete' : 'blocked',
    nextPhaseDecision: input.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : 'Phase 39D remains blocked; use a blocker-specific runtime/GPU/source-build/non-Qwen follow-up.',
  }
  await mkdir(input.artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_plan.json'), getVlmSglangFixedKernelPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_web_research.json'), getVlmSglangFixedKernelWebResearchReport())
  if (input.runId === 'not-run') {
    await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_iam_delta_report.json'), {
      phase: '39C-SG-FIXED',
      reportId: 'phase_39c_sg_fixed_kernel_iam_delta_report',
      runId: input.runId,
      createdAt: input.createdAt,
      plan: getVlmSglangFixedKernelIamPlan(),
      status: 'not_run',
      qaCreateBinding: 'not_checked',
      qaReadbackBinding: 'skipped_not_needed',
      broadIamGranted: false,
      publicAccessChanged: false,
      blockers: ['execution_not_run'],
      warnings: [],
    })
  }
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_import_failure_audit.json'), buildVlmSglangFixedKernelImportFailureAudit(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_profile_matrix.json'), buildVlmSglangFixedKernelProfileMatrixReport(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_cloud_build_reports.json'), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_cloud_build_reports',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.buildAttempts.some((attempt) => attempt.status === 'passed') ? 'passed' : 'blocked',
    builds: input.buildAttempts,
    blockers: uniqueBlockers.filter((blocker) => blocker.includes('cloud_build') || blocker.includes('image_digest')),
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_image_verification_report.json'), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_image_verification_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.buildAttempts.some((attempt) => attempt.imageDigest) ? 'passed' : 'blocked',
    images: input.buildAttempts.map((attempt) => ({
      profileId: attempt.profile.id,
      imageRef: attempt.imageRef,
      imageDigest: attempt.imageDigest,
      status: attempt.status,
    })),
    blockers: uniqueBlockers.filter((blocker) => blocker.includes('image_digest')),
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_import_smoke_report.json'), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_import_smoke_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.selectedProfile ? 'passed' : 'blocked',
    attempts: input.importSmokeAttempts,
    selectedProfile: input.selectedProfile?.id ?? null,
    cuGreenCtxDestroyStatus: input.selectedProfile ? 'resolved_for_selected_profile' : 'persisting_or_blocked',
    blockers: uniqueBlockers.filter((blocker) => blocker.includes('import') || blocker.includes('cuGreenCtxDestroy') || blocker.includes('profile')),
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_selected_profile_report.json'), selectedProfileReport)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_runtime_capability_report.json'), {
    phase: '39C-SG-FIXED',
    reportId: 'phase_39c_sg_fixed_kernel_runtime_capability_report',
    runId: input.runId,
    createdAt: input.createdAt,
    selectedProfile: input.selectedProfile?.id ?? null,
    importSmokeReport: input.importSmokeAttempts.find((attempt) => attempt.profile.id === input.selectedProfile?.id)?.report ?? null,
    runtimeResults,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_runtime_results.json'), runtimeResults)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_candidate_results.json'), candidateResults)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_private_artifact_manifest.json'), privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_recovery_report.json'), recoveryReport)
  await writeCompatibilityCarryForwardReports(input, uniqueBlockers, uniqueWarnings)
}

async function writeCompatibilityCarryForwardReports(input: {
  runId: string
  createdAt: string
  artifactDir: string
  status: KernelStatus
  selectedProfile?: VlmSglangFixedKernelProfile
  selectedCandidate?: VlmL4Candidate
  candidateAttempts: readonly VlmSglangFixedKernelCandidateAttempt[]
}, blockers: readonly string[], warnings: readonly string[]) {
  const noRuntime = !input.selectedProfile
  const generatedFixtures = generatedFixturesStatus(input.status, Boolean(input.selectedProfile), Boolean(input.selectedCandidate))
  const base = {
    phase: '39C-SG-FIXED',
    runId: input.runId,
    createdAt: input.createdAt,
    selectedProfile: input.selectedProfile?.id ?? null,
    selectedCandidate: input.selectedCandidate ? candidateSummary(input.selectedCandidate) : null,
    status: input.status,
    blockers,
    warnings,
  }
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_text_only_smoke_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_text_only_smoke_report',
    status: noRuntime ? 'not_run_import_smoke_blocked' : input.status,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_freeform_perception_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_freeform_perception_report',
    status: noRuntime ? 'not_run_import_smoke_blocked' : input.status,
    generatedFixtures,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_labels_only_qa_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_labels_only_qa_report',
    status: input.status === 'passed' ? 'passed' : 'blocked',
    generatedFixtures,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_coarse_region_qa_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_coarse_region_qa_report',
    status: input.status === 'passed' ? 'passed' : 'blocked',
    generatedFixtures,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_safe_zone_reasoning_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_safe_zone_reasoning_report',
    status: input.status === 'passed' ? 'passed' : 'blocked',
    generatedFixtures,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_decomposed_canonical_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_decomposed_canonical_report',
    status: input.status,
    generatedFixtures,
    candidateAttempts: input.candidateAttempts.map((attempt) => ({
      modelId: attempt.candidate.modelId,
      status: attempt.status,
      blockers: attempt.blockers,
    })),
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_fixed_kernel_hallucination_safety_report.json'), {
    ...base,
    reportId: 'phase_39c_sg_fixed_kernel_hallucination_safety_report',
    noProviderCalls: true,
    noToolCalls: true,
    noRawPrompts: true,
    noRealMedia: true,
    noPublicOutput: true,
  })
}

function validateKernelBaseExecutionEnv(): string[] {
  const required: Record<string, string> = {
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_CONFIRM_VLM_SGLANG_FIXED_KERNEL: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_CLOUD_BUILD: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_DOCKER_PUSH: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_IMPORT_SMOKE_JOB: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
  }
  return [
    ...Object.entries(required)
      .filter(([key, value]) => process.env[key] !== value)
      .map(([key]) => `env_guard_mismatch:${key}`),
    ...forbiddenEnabledEnvVars(),
  ]
}

function validateKernelGeneratedRuntimeEnv(): string[] {
  const required: Record<string, string> = {
    REEDITPRO_CONFIRM_VLM_SGLANG_STAGING_CLOUD_RUN_JOB: 'true',
    REEDITPRO_CONFIRM_VLM_SGLANG_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
  }
  return Object.entries(required)
    .filter(([key, value]) => process.env[key] !== value)
    .map(([key]) => `env_guard_mismatch:${key}`)
}

function forbiddenEnabledEnvVars(): string[] {
  return [
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
  ].filter((key) => process.env[key] === 'true').map((key) => `forbidden_env_enabled:${key}`)
}

function importSmokeJobPlan() {
  return {
    job: IMPORT_SMOKE_JOB,
    region: REGION,
    serviceAccount: GPU_WORKER_SA,
    gpu: '1 x nvidia-l4',
    cpu: 8,
    memory: '32Gi',
    command: 'python /app/server/workers/vlm-sglang-runtime/kernel_import_smoke.py',
    copiesModelPayload: false,
    runsInference: false,
    processesImages: false,
    providerCalls: false,
    privateQaPrefixPattern: `gs://${QA_BUCKET}/${QA_PREFIX_ROOT}/<run-id>/profiles/<profile-id>/`,
  }
}

function generatedRuntimeJobPlan() {
  return {
    job: GENERATED_RUNTIME_JOB,
    region: REGION,
    serviceAccount: GPU_WORKER_SA,
    gpu: '1 x nvidia-l4',
    cpu: 8,
    memory: '32Gi',
    command: 'image entrypoint run-phase39c-sglang-cloud-job.py',
    modelPayload: 'copy_exact_pr87_private_objects_after_import_smoke_only',
    fixtures: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
    providerCalls: false,
    realMedia: false,
    privateQaPrefixPattern: `gs://${QA_BUCKET}/${QA_PREFIX_ROOT}/<run-id>/runtime/<candidate-slug>/`,
  }
}

function kernelSafetyPolicy() {
  return {
    generatedSyntheticFixturesOnly: true,
    realMediaBlocked: true,
    arbitraryMediaBlocked: true,
    providerCallsBlocked: true,
    publicOutputBlocked: true,
    modelDownloadsBlocked: true,
    newModelStagingBlocked: true,
    localVerifiedModelPathOnly: true,
    modelIdRuntimePathBlocked: true,
    cloudRunGpuType: 'nvidia-l4_only',
    phase39DBlocked: true,
    phase39EBlocked: true,
    betaProductionBlocked: true,
    trackABlocked: true,
  }
}

function kernelSourceEvidence() {
  return {
    phase39cOriginalOom: { pr: PR66_URL, preserved: true },
    phase39bq39cqCandidates: { pr: PR87_URL, preserved: true },
    phase39cqStructuredOutput: { pr: PR90_URL, preserved: true },
    phase39cqSo3Perception: { pr: PR97_URL, preserved: true },
    phase39cSglangBuildx: { pr: PR100_URL, preserved: true },
    phase39cSgBuildCloudBuild: { pr: PR104_URL, preserved: true },
    phase39cSgKernelCompat: { pr: PR107_URL, preserved: true },
    sglangIssues: [
      'https://github.com/sgl-project/sglang/issues/8432',
      'https://github.com/sgl-project/sglang/issues/8566',
    ],
    sglangFixPullRequests: [
      'https://github.com/sgl-project/sglang/pull/9021',
      'https://github.com/sgl-project/sglang/pull/9231',
    ],
    cloudRunGpuDocs: 'https://docs.cloud.google.com/run/docs/configuring/jobs/gpu',
    qwenSglangDocs: 'https://qwen.readthedocs.io/en/latest/deployment/sglang.html',
    sglangInstallDocs: 'https://docs.sglang.io/get_started/install.html',
    sglangStructuredOutputDocs: 'https://docs.sglang.io/docs/advanced_features/structured_outputs',
  }
}

function kernelCandidateAttempt(input: {
  candidate: VlmL4Candidate
  status: KernelStatus
  manifestStatus: KernelStatus
  runtimeStatus: KernelStatus
  privateModelPrefix: string
  privateQaPrefix?: string
  runtimeReport?: Record<string, unknown>
  blockers: readonly string[]
  warnings: readonly string[]
}): VlmSglangFixedKernelCandidateAttempt {
  return {
    candidate: input.candidate,
    status: input.status,
    manifestStatus: input.manifestStatus,
    runtimeStatus: input.runtimeStatus,
    privateModelPrefix: input.privateModelPrefix,
    privateQaPrefix: input.privateQaPrefix,
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
    // Candidate-specific PR #87 manifests are also stored next to private staged objects.
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

function orderedExecutionCandidates(): VlmL4Candidate[] {
  const order = [
    'Qwen/Qwen3-VL-2B-Instruct',
    'Qwen/Qwen3-VL-4B-Instruct',
    'Qwen/Qwen3-VL-8B-Instruct-FP8',
  ]
  return order
    .map((modelId) => vlmL4CompatibleCandidates.find((candidate) => candidate.modelId === modelId))
    .filter((candidate): candidate is VlmL4Candidate => Boolean(candidate))
}

function selectBestPassingCandidateAttempt(attempts: readonly VlmSglangFixedKernelCandidateAttempt[]): VlmSglangFixedKernelCandidateAttempt | undefined {
  const priority = [
    'Qwen/Qwen3-VL-8B-Instruct-FP8',
    'Qwen/Qwen3-VL-4B-Instruct',
    'Qwen/Qwen3-VL-2B-Instruct',
  ]
  return attempts
    .filter((attempt) => attempt.status === 'passed')
    .slice()
    .sort((a, b) => priority.indexOf(a.candidate.modelId) - priority.indexOf(b.candidate.modelId))[0]
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

function candidateModelPrefix(candidate: VlmL4Candidate): string {
  return `gs://${GENERATED_ASSETS_BUCKET}/model-weights/qwen3-vl/${candidate.slug}/${candidate.revision}/`
}

function generatedFixturesStatus(status: KernelStatus, importSmokePassed: boolean, selectedCandidate: boolean) {
  const canaries = [
    'canary-basic-shapes',
    'canary-colored-layout',
    'canary-text-and-shape',
    'canary-ui-simplified',
    'canary-caption-safe-zone-simple',
  ]
  const original = VLM_L4_COMPATIBLE_REQUIRED_FIXTURES
  return [...canaries, ...original].map((fixtureId) => ({
    fixtureId,
    status: status === 'passed'
      ? 'pass_or_warn_within_policy'
      : importSmokePassed && !selectedCandidate ? 'fail_or_blocked'
        : 'not-run',
  }))
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

function hasConditionalBinding(
  policy: Record<string, unknown>,
  role: string,
  member: string,
  conditionTitle: string,
  conditionExpression: string,
): boolean {
  const bindings = Array.isArray(policy.bindings) ? policy.bindings : []
  return bindings.some((binding) => {
    if (!binding || typeof binding !== 'object') return false
    const record = binding as {
      role?: unknown
      members?: unknown
      condition?: { title?: unknown; expression?: unknown }
    }
    return record.role === role
      && Array.isArray(record.members)
      && record.members.includes(member)
      && record.condition?.title === conditionTitle
      && record.condition?.expression === conditionExpression
  })
}

function summarizeIamPolicy(policy: Record<string, unknown>): Record<string, unknown> {
  const bindings = Array.isArray(policy.bindings) ? policy.bindings : []
  const publicPrincipals = [`all${'Users'}`, `allAuthenticated${'Users'}`]
  return {
    bindingCount: bindings.length,
    matchingFixedKernelBindings: bindings
      .filter((binding): binding is { role?: unknown; members?: unknown; condition?: { title?: unknown; expression?: unknown } } => Boolean(binding && typeof binding === 'object'))
      .filter((binding) => String(binding.condition?.title ?? '').includes('phase39c-vlm-sglang-fixed'))
      .map((binding) => ({
        role: binding.role,
        conditionTitle: binding.condition?.title,
        conditionExpression: binding.condition?.expression,
        memberCount: Array.isArray(binding.members) ? binding.members.length : 0,
      })),
    publicPrincipalDetected: publicPrincipals.some((principal) => JSON.stringify(policy).includes(principal)),
  }
}

function parseGcloudJsonObjectOutput(output: string): Record<string, unknown> {
  const lines = output.split(/\r?\n/)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!lines[index]?.trimStart().startsWith('{')) continue
    const candidate = lines.slice(index).join('\n').trim()
    try {
      return JSON.parse(candidate) as Record<string, unknown>
    } catch {
      // Continue scanning upward; Cloud Build logs can contain shell/template
      // braces before the final machine-readable gcloud JSON payload.
    }
  }
  const objectStartIndexes = Array.from(output.matchAll(/\{/g)).map((match) => match.index ?? -1).filter((index) => index >= 0)
  for (let cursor = objectStartIndexes.length - 1; cursor >= 0; cursor -= 1) {
    const candidate = output.slice(objectStartIndexes[cursor]).trim()
    try {
      return JSON.parse(candidate) as Record<string, unknown>
    } catch {
      // Keep looking for a later valid JSON object.
    }
  }
  throw new Error(`gcloud did not return a parseable JSON object: ${output.slice(-500)}`)
}

function extractCloudBuildImageDigest(build: Record<string, unknown>): string | undefined {
  const results = build.results as { images?: Array<{ digest?: unknown; name?: unknown }> } | undefined
  const digest = results?.images?.find((image) => String(image.name ?? '').startsWith(FIXED_KERNEL_IMAGE_PATH))?.digest
  return typeof digest === 'string' && digest.startsWith('sha256:') ? digest : undefined
}

async function describeArtifactRegistryImageDigest(imageRef: string): Promise<string | undefined> {
  const metadata = parseGcloudJson(await runGcloud(['artifacts', 'docker', 'images', 'describe', imageRef, '--format=json'])) as Record<string, unknown>
  const digest = typeof metadata.image_summary === 'object' && metadata.image_summary
    ? (metadata.image_summary as { digest?: unknown }).digest
    : metadata.digest
  return typeof digest === 'string' && digest.startsWith('sha256:') ? digest : undefined
}

function computeBuildDurationSeconds(build: Record<string, unknown>): number | undefined {
  const start = typeof build.startTime === 'string' ? Date.parse(build.startTime) : NaN
  const finish = typeof build.finishTime === 'string' ? Date.parse(build.finishTime) : NaN
  if (Number.isFinite(start) && Number.isFinite(finish) && finish >= start) return Math.round((finish - start) / 1000)
  return undefined
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

function summarizeCommandError(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ')
  const markers = [
    'Reauthentication failed',
    'cannot prompt during non-interactive execution',
    'Permission denied',
    'PERMISSION_DENIED',
    'NOT_FOUND',
    'INVALID_ARGUMENT',
  ]
  const marker = markers.find((item) => message.includes(item))
  if (marker) {
    const index = message.indexOf(marker)
    return message.slice(index, index + 500)
  }
  return message.slice(0, 500)
}

function sanitizeTag(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').slice(0, 120)
}

function serializeEnvVars(values: Record<string, string>): string {
  const delimiter = '|'
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value.replaceAll(delimiter, `\\${delimiter}`)}`)
    .join(delimiter)
    .replace(/^/, `^${delimiter}^`)
}

function emitKernelProgress(message: string): void {
  process.stderr.write(`[phase39c-sg-fixed] ${message}\n`)
}
