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

export type VlmPerceptionCanaryStatus = 'passed' | 'blocked' | 'skipped'
export type VlmPerceptionCanaryStageId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

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

export interface VlmPerceptionCanaryAttempt {
  readonly candidate: VlmL4Candidate
  readonly status: VlmPerceptionCanaryStatus
  readonly selected: boolean
  readonly manifestStatus: VlmPerceptionCanaryStatus
  readonly runtimeStatus: VlmPerceptionCanaryStatus
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

export interface VlmPerceptionCanaryResult {
  readonly runId: string
  readonly selectedCandidate?: VlmL4Candidate
  readonly attempts: readonly VlmPerceptionCanaryAttempt[]
  readonly status: VlmPerceptionCanaryStatus
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
const IMAGE_PATH = 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/vlm-runtime-phase39c-perception-canary'
const JOB_NAME = 'reeditpro-stg-vlm-runtime-phase39c-perception-canary'
const LOCAL_ROOT = '/tmp/reeditpro-vlm-perception-canary'
const REPORT_DIR = 'docs/activation-phase-39cq-so3-vlm-perception-canary-reports'
const MATRIX_ID = 'phase39c-qwen-so3-perception-canary-v1'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const PR90_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90'

export const VLM_PERCEPTION_CANARY_REPORT_DIR = REPORT_DIR
export const VLM_PERCEPTION_CANARY_MATRIX_ID = MATRIX_ID

export const vlmPerceptionCanaryCandidateExecutionOrder = [
  'Qwen/Qwen3-VL-2B-Instruct',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
] as const

export const vlmPerceptionCanaryCandidateSelectionPriority = [
  'Qwen/Qwen3-VL-8B-Instruct-FP8',
  'Qwen/Qwen3-VL-4B-Instruct',
  'Qwen/Qwen3-VL-2B-Instruct',
] as const

export const vlmPerceptionCanaryFixtures = [
  'canary-basic-shapes',
  'canary-colored-layout',
  'canary-text-and-shape',
  'canary-ui-simplified',
  'canary-caption-safe-zone-simple',
] as const

export const vlmPerceptionCanaryStages = [
  {
    id: 'P0',
    name: 'image transport sanity',
    passCounting: true,
    description: 'Verifies deterministic generated image dimensions, hashes, and private trace policy before model inference.',
  },
  {
    id: 'P1',
    name: 'freeform perception canary',
    passCounting: false,
    description: 'Captures safe trace hashes/excerpts for simple shape/text/UI perception. Diagnostic only and never pass-counting.',
  },
  {
    id: 'P2',
    name: 'labels-only structured output',
    passCounting: true,
    description: 'Checks whether the candidate can name expected labels through direct structured output.',
  },
  {
    id: 'P3',
    name: 'coarse-region structured output',
    passCounting: true,
    description: 'Checks broad zones rather than normalized boxes: top, bottom, left, right, center, lower_third, upper_third.',
  },
  {
    id: 'P4',
    name: 'safe-zone reasoning output',
    passCounting: true,
    description: 'Checks that safe-zone decisions are bounded and not unknown.',
  },
  {
    id: 'P5',
    name: 'composed canonical report',
    passCounting: true,
    description: 'Composes the canonical Phase 39C-Q-SO3 decision from P2/P3/P4 only.',
  },
] as const satisfies readonly {
  readonly id: VlmPerceptionCanaryStageId
  readonly name: string
  readonly passCounting: boolean
  readonly description: string
}[]

export function getVlmPerceptionCanaryPlan() {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_canary_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    sourceEvidence: sourceEvidence(),
    candidatePolicy: {
      allowedCandidates: vlmL4CompatibleCandidates.map(candidateSummary),
      executionOrder: vlmPerceptionCanaryCandidateExecutionOrder,
      selectionPriority: vlmPerceptionCanaryCandidateSelectionPriority,
      newModelDownloadsAllowed: false,
      modelUploadsAllowed: false,
      communityQuantizationsAllowed: false,
      modelIdRuntimePathAllowed: false,
    },
    qaDesign: {
      matrixId: MATRIX_ID,
      canaryFixtures: vlmPerceptionCanaryFixtures,
      requiredGeneratedFixturesAfterCanaryPass: VLM_L4_COMPATIBLE_REQUIRED_FIXTURES,
      stages: vlmPerceptionCanaryStages,
      coarseZones: ['top', 'bottom', 'left', 'right', 'center', 'lower_third', 'upper_third'],
      thresholds: {
        canaryLabelRecall: 0.8,
        canaryCoarseRegionAccuracy: 0.8,
        generatedFixtureLabelRecall: 0.6,
        generatedFixtureCoarseRegionAccuracy: 0.6,
        safeZoneDecisionUnknownAllowed: false,
        ambiguousFixtureMustRequireManualReview: true,
      },
      diagnosticTraceCanPassPhase: false,
      normalizedBoxesRequiredInFirstPass: false,
      aliasMatchingEnabled: true,
    },
    execution: executionPolicy(),
    confirmationsRequiredForExecution: [
      'REEDITPRO_CONFIRM_VLM_PERCEPTION_CANARY_RERUN',
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

export function getVlmPerceptionCanaryIamPlan() {
  const qaPrefix = 'activation/phase39c/generated-vlm-perception-canary/'
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_canary_iam_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    requiredConfirmationForMissingScopedBindings: 'REEDITPRO_CONFIRM_VLM_PHASE39C_SCOPED_IAM_UPDATE',
    member: `serviceAccount:${GPU_WORKER_SA}`,
    broadIamRejected: true,
    publicPrincipalsRejected: true,
    notes: [
      'Phase 39C-Q-SO3 reuses PR #87 exact private model objects; no new model download or model upload is allowed.',
      'The runtime copies exact object paths from the PR #87 checksum manifest and does not rely on broad bucket listing.',
    ],
    plans: [
      ...vlmL4CompatibleCandidates.map((candidate) => ({
        bindingId: `phase39cq-so3-model-read-${candidate.slug}`,
        bucket: GENERATED_ASSETS_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: `phase39cq-so3-model-read-${candidate.slug}`,
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${GENERATED_ASSETS_BUCKET}/objects/${candidateObjectPrefix(candidate)}')`,
        description: 'GPU worker may read only already staged official Qwen candidate objects from PR #87.',
        required: true,
      })),
      {
        bindingId: 'phase39cq-so3-qa-create',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectCreator',
        conditionTitle: 'phase39cq-so3-qa-create',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may create private Phase 39C-Q-SO3 QA artifacts only under the approved prefix.',
        required: true,
      },
      {
        bindingId: 'phase39cq-so3-qa-readback',
        bucket: QA_BUCKET,
        role: 'roles/storage.objectViewer',
        conditionTitle: 'phase39cq-so3-qa-readback',
        conditionExpression: `resource.name.startsWith('projects/_/buckets/${QA_BUCKET}/objects/${qaPrefix}')`,
        description: 'GPU worker may read back private Phase 39C-Q-SO3 QA artifacts only to verify upload metadata.',
        required: true,
      },
    ],
  }
}

export function getVlmPerceptionCanaryCostSummary() {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_canary_cost_summary',
    createdAt: new Date().toISOString(),
    cloudRunShape: { region: REGION, gpu: 'nvidia-l4', gpuCount: 1, cpu: 8, memory: '32Gi' },
    candidateExecutionOrder: vlmPerceptionCanaryCandidateExecutionOrder,
    matrixId: MATRIX_ID,
    generatedFixturesOnly: true,
    modelDownloadCost: 'none_new_models_reuse_pr87_private_assets',
    stagingGpuCostRisk: 'bounded_l4_perception_canary_then_decomposed_generated_fixture_qa',
    stopEarlyPolicy: 'stop candidate after failed P1/P2 canaries; continue to next candidate',
    production: 'blocked',
    beta: 'blocked',
    broadMedia: 'blocked',
  }
}

export function buildVlmPerceptionCanaryStaticReport() {
  return {
    ok: false,
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_canary_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: sourceEvidence(),
    perceptionFailureAudit: perceptionFailureAudit(),
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

export async function writeVlmPerceptionCanaryStaticArtifacts(artifactDir = REPORT_DIR): Promise<void> {
  await mkdir(artifactDir, { recursive: true })
  const createdAt = new Date().toISOString()
  const plan = getVlmPerceptionCanaryPlan()
  const report = buildVlmPerceptionCanaryStaticReport()
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_perception_canary_plan.json'), plan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_perception_failure_audit.json'), perceptionFailureAudit(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_canary_fixture_manifest.json'), canaryFixtureManifest(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_fixture_calibration_report.json'), fixtureCalibrationReport(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_label_alias_map.json'), aliasMap(createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_freeform_trace_manifest.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_freeform_trace_manifest',
    createdAt,
    traceCount: 0,
    traces: [],
    status: 'blocked',
    blockers: ['execution_not_run'],
    fullRawTraceCommitted: false,
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_labels_only_qa_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_labels_only_qa_report',
    createdAt,
    status: 'blocked',
    canaryLabelRecall: 0,
    fixtureLabelRecall: 0,
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_coarse_region_qa_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_coarse_region_qa_report',
    createdAt,
    status: 'blocked',
    canaryCoarseRegionAccuracy: 0,
    fixtureCoarseRegionAccuracy: 0,
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_safe_zone_reasoning_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_safe_zone_reasoning_report',
    createdAt,
    status: 'blocked',
    safeZoneDecisionUnknownAllowed: false,
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_decomposed_canonical_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_decomposed_canonical_report',
    createdAt,
    status: 'blocked',
    blockers: ['execution_not_run'],
    stages: vlmPerceptionCanaryStages,
    passRequires: decomposedQaPolicy().passRequires,
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_candidate_results.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_candidate_results',
    createdAt,
    status: 'blocked',
    candidates: vlmL4CompatibleCandidates.map((candidate) => ({
      modelId: candidate.modelId,
      revision: candidate.revision,
      status: 'not_run',
      blockers: ['execution_not_run'],
    })),
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_runtime_results.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_runtime_results',
    createdAt,
    runtimeStatus: 'blocked',
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_hallucination_safety_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_hallucination_safety_report',
    createdAt,
    noProviderCalls: true,
    noToolCalls: true,
    noRawPrompts: true,
    noRealMedia: true,
    noPublicOutput: true,
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_private_artifact_manifest.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_private_artifact_manifest',
    createdAt,
    privateOnly: true,
    artifactCount: 0,
    artifacts: [],
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so3_perception_canary_recovery_report.json'), report)
}

export async function runVlmPerceptionCanaryRecovery(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  safeArtifactDir?: string
}): Promise<VlmPerceptionCanaryResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-Q-SO3 perception canary recovery.')
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39cq-so3-${createdAt.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`
  const localRoot = path.join(LOCAL_ROOT, runId)
  const safeArtifactDir = input.safeArtifactDir ?? REPORT_DIR
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })
  await mkdir(safeArtifactDir, { recursive: true })

  const envBlockers = validateExecutionEnv()
  const attempts: VlmPerceptionCanaryAttempt[] = []
  const warnings: string[] = []
  if (envBlockers.length) {
    return writeCombinedPerceptionCanaryReport({
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
    return writeCombinedPerceptionCanaryReport({
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
    const attempt = await attemptPerceptionCanaryCandidate({
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
  const status: VlmPerceptionCanaryStatus = selectedAttempt ? 'passed' : 'blocked'
  const blockers = status === 'passed'
    ? []
    : Array.from(new Set(attempts.flatMap((attempt) => attempt.blockers))).filter(Boolean)
  const result = await writeCombinedPerceptionCanaryReport({
    runId,
    createdAt,
    selectedCandidate: selectedAttempt?.candidate,
    attempts,
    status,
    localArtifactDir: safeArtifactDir,
    privateQaPrefix: selectedAttempt?.privateQaPrefix,
    imageDigest,
    blockers: blockers.length ? blockers : ['no_candidate_passed_perception_canary_decomposed_qa'],
    warnings,
  })
  if (!input.keepTemp) await rm(localRoot, { recursive: true, force: true })
  return result
}

async function attemptPerceptionCanaryCandidate(input: {
  candidate: VlmL4Candidate
  runId: string
  imageRef: string
  imageDigest?: string
  candidateReportDir: string
  localRoot: string
}): Promise<VlmPerceptionCanaryAttempt> {
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
    return perceptionAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const manifestBlockers = validateChecksumManifest(candidate, manifest)
  if (manifestBlockers.length) {
    blockers.push(...manifestBlockers)
    return perceptionAttempt({ candidate, status: 'blocked', manifestStatus: 'blocked', runtimeStatus: 'skipped', privateModelPrefix, imageRef, imageDigest, blockers, warnings })
  }
  const runtimeRunId = `${runId}-${candidate.slug}`
  const privateQaPrefix = `gs://${QA_BUCKET}/${perceptionQaObjectPrefix(runtimeRunId)}/`
  let runtimeReport: Record<string, unknown> | undefined
  try {
    const runtime = await runPerceptionCanaryCloudRunJob({
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
    blockers.push(`perception_canary_l4_runtime_failed:${summarizeCommandError(error)}`)
  }
  const passed = Boolean(runtimeReport?.ok) && blockers.length === 0
  const qa = runtimeReport?.qa as { canaryLabelRecall?: unknown; canaryCoarseRegionAccuracy?: unknown; fixtureLabelRecall?: unknown; fixtureCoarseRegionAccuracy?: unknown } | undefined
  return perceptionAttempt({
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
    blockers: passed ? [] : blockers.length ? blockers : ['perception_canary_runtime_report_not_ok'],
    warnings,
  })
}

async function runPerceptionCanaryCloudRunJob(input: {
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
  const artifactPrefix = perceptionQaObjectPrefix(input.runId)
  const expectedAssetsJson = JSON.stringify(input.manifest.entries.map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })))
  const envVars = serializeEnvVars({
    GCP_PROJECT_ID: PROJECT_ID,
    GCP_REGION: REGION,
    REEDITPRO_ENV: ENV,
    REEDITPRO_PHASE39C_RUN_ID: input.runId,
    REEDITPRO_VLM_RUNTIME_PHASE: '39C-Q-SO3',
    REEDITPRO_VLM_REPORT_PREFIX: 'phase_39cq_so3',
    REEDITPRO_VLM_MODEL_ID: input.candidate.modelId,
    REEDITPRO_VLM_MODEL_REVISION: input.candidate.revision,
    REEDITPRO_VLM_MODEL_GCS_PATH: candidateModelPrefix(input.candidate),
    REEDITPRO_VLM_AGGREGATE_SHA256: input.manifest.aggregateSha256,
    REEDITPRO_VLM_EXPECTED_ASSETS_JSON: expectedAssetsJson,
    REEDITPRO_VLM_MODEL_DIR_NAME: input.candidate.slug,
    REEDITPRO_PHASE39C_QA_BUCKET: QA_BUCKET,
    REEDITPRO_PHASE39C_QA_PREFIX: artifactPrefix,
    REEDITPRO_VLM_STAGING_CLOUD_RUN_JOB_NAME: JOB_NAME,
    REEDITPRO_VLM_LOCAL_TEMP_ROOT: '/tmp/reeditpro-vlm-runtime/phase39cq-so3',
    REEDITPRO_CONFIRM_VLM_PERCEPTION_CANARY_RERUN: 'true',
    REEDITPRO_CONFIRM_VLM_PRIVATE_GCS_READ: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE: 'true',
    REEDITPRO_CONFIRM_VLM_RUNTIME_ARTIFACT_UPLOAD: 'true',
    REEDITPRO_CONFIRM_VLM_L4_GPU_EXECUTE: 'true',
    REEDITPRO_VLM_PERCEPTION_CANARY_MATRIX: MATRIX_ID,
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
  for (const fileName of perceptionExpectedReports()) {
    const gcsUri = `gs://${QA_BUCKET}/${artifactPrefix}/${fileName}`
    const localPath = path.join(input.candidateReportDir, fileName)
    try {
      await rm(localPath, { force: true })
      await runGcloud(['storage', 'cp', gcsUri, localPath], 10 * 60 * 1000)
      const metadata = parseGcloudJson(await runGcloud(['storage', 'objects', 'describe', gcsUri, '--format=json'])) as Record<string, unknown>
      warnings.push(`private_perception_canary_artifact_verified:${input.candidate.slug}:${fileName}:generation=${String(metadata.generation ?? 'unknown')}`)
    } catch (error) {
      blockers.push(`perception_canary_artifact_fetch_failed:${input.candidate.slug}:${fileName}:${summarizeCommandError(error)}`)
    }
  }
  let runtimeReport: Record<string, unknown> | undefined
  try {
    runtimeReport = JSON.parse(await readFile(path.join(input.candidateReportDir, 'phase_39cq_so3_perception_canary_recovery_report.json'), 'utf8')) as Record<string, unknown>
    if (!runtimeReport.ok) blockers.push(`perception_canary_runtime_report_not_ok:${input.candidate.slug}`)
  } catch (error) {
    blockers.push(`perception_canary_runtime_report_unreadable:${input.candidate.slug}:${summarizeCommandError(error)}`)
  }
  return { runtimeReport, blockers: Array.from(new Set(blockers)), warnings }
}

async function writeCombinedPerceptionCanaryReport(input: {
  runId: string
  createdAt: string
  selectedCandidate?: VlmL4Candidate
  attempts: readonly VlmPerceptionCanaryAttempt[]
  status: VlmPerceptionCanaryStatus
  localArtifactDir: string
  privateQaPrefix?: string
  imageDigest?: string
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<VlmPerceptionCanaryResult> {
  const fullReport = {
    ok: input.status === 'passed',
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_canary_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    sourceEvidence: sourceEvidence(),
    perceptionFailureAudit: perceptionFailureAudit(input.createdAt),
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
      : 'Do not start Phase 39D; use an evidence-based alternate runtime/candidate path or the exact blocker recorded here.',
  }
  await mkdir(input.localArtifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_perception_canary_plan.json'), getVlmPerceptionCanaryPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_perception_failure_audit.json'), perceptionFailureAudit(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_canary_fixture_manifest.json'), canaryFixtureManifest(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_fixture_calibration_report.json'), fixtureCalibrationReport(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_label_alias_map.json'), aliasMap(input.createdAt))
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_decomposed_canonical_report.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_decomposed_canonical_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    selectedCandidate: fullReport.selectedCandidate,
    passRequires: decomposedQaPolicy().passRequires,
    candidateResults: fullReport.candidateResults,
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_candidate_results.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_candidate_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    selectedCandidate: fullReport.selectedCandidate ?? null,
    candidates: fullReport.candidateResults,
    blockers: fullReport.blockers,
    warnings: fullReport.warnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_runtime_results.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_runtime_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    imageDigest: input.imageDigest,
    cloudRunJob: JOB_NAME,
    region: REGION,
    gpu: 'nvidia-l4',
    cpu: 8,
    memory: '32Gi',
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
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_private_artifact_manifest.json'), {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_private_artifact_manifest',
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
  await writeVlmRuntimeJsonArtifact(path.join(input.localArtifactDir, 'phase_39cq_so3_perception_canary_recovery_report.json'), fullReport)
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

function perceptionAttempt(input: {
  candidate: VlmL4Candidate
  status: VlmPerceptionCanaryStatus
  manifestStatus: VlmPerceptionCanaryStatus
  runtimeStatus: VlmPerceptionCanaryStatus
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
}): VlmPerceptionCanaryAttempt {
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
    // The PR #87 reports can be candidate-specific in GCS; use exact private manifest object when local committed report is not the matching candidate.
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
    REEDITPRO_CONFIRM_VLM_PERCEPTION_CANARY_RERUN: 'true',
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

function sourceEvidence() {
  return {
    phase39cOriginalOom: { pr: PR66_URL, preserved: true, summary: 'Original unquantized BF16 8B evidence remains preserved as Cloud Run L4 OOM before inference.' },
    phase39bq39cqCandidates: { pr: PR87_URL, preserved: true, summary: 'Official Qwen FP8 8B, BF16 4B, and BF16 2B candidates remain the only allowed staged private assets.' },
    phase39cqStructuredOutput: { pr: PR90_URL, preserved: true, summary: 'Structured-output enforcement reached syntactic/debug paths but no candidate passed semantic image QA across required fixtures.' },
  }
}

function executionPolicy() {
  return {
    privateModelBucket: GENERATED_ASSETS_BUCKET,
    privateQaBucket: QA_BUCKET,
    qaPrefixPattern: 'activation/phase39c/generated-vlm-perception-canary/<run-id>/',
    imagePath: IMAGE_PATH,
    cloudRunJob: JOB_NAME,
    gpu: '1 x nvidia-l4',
    cpu: 8,
    memory: '32Gi',
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

function perceptionFailureAudit(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_perception_failure_audit',
    createdAt,
    conclusion: 'The known failures are layered: the original 8B BF16 failed at memory, PR #87 solved candidate staging/runtime reachability but failed JSON/schema QA, and PR #90/SO2 showed structured output can work text-only while image QA still fails semantic perception.',
    failureLayers: [
      { layer: 'memory', evidence: PR66_URL, status: 'preserved_original_bf16_8b_l4_oom' },
      { layer: 'model_staging', evidence: PR87_URL, status: 'passed_private_candidate_staging' },
      { layer: 'syntax', evidence: PR90_URL, status: 'partially_proven_text_only_structured_output' },
      { layer: 'perception', evidence: PR90_URL, status: 'unproven_empty_or_mislocalized_image_objects_invalid_boxes_unknown_safe_zone' },
    ],
    nextMove: 'Use simple perception canaries and decomposed QA before full object-region/safe-zone fixtures.',
  }
}

function canaryFixtureManifest(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_canary_fixture_manifest',
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

function fixtureCalibrationReport(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_fixture_calibration_report',
    createdAt,
    canaryThresholds: {
      labelRecall: 0.8,
      coarseRegionAccuracy: 0.8,
      safeZoneDecisionCannotBeUnknown: true,
    },
    originalFixtureThresholds: {
      labelRecall: 0.6,
      coarseRegionAccuracy: 0.6,
      safeZoneDecisionCannotBeUnknown: true,
      ambiguousFixtureMustRequireManualReview: true,
    },
    normalizedBoxesRequiredForCanaryPass: false,
    diagnosticFreeformCanPassPhase: false,
  }
}

function aliasMap(createdAt = new Date().toISOString()) {
  return {
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_label_alias_map',
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
    phase: '39C-Q-SO3',
    reportId: 'phase_39cq_so3_decomposed_qa_policy',
    passRequires: [
      'P0 image transport sanity passes',
      'P1 freeform traces are captured but do not count as pass evidence',
      'P2 labels-only structured output reaches canary recall >= 0.80',
      'P3 coarse-region structured output reaches canary accuracy >= 0.80',
      'P4 safe-zone decision is not unknown',
      'P5 composed canonical report from P2/P3/P4 passes',
      'After canary pass, all five required generated fixtures pass decomposed thresholds',
      'Ambiguous generated fixture requires manual review or high uncertainty',
      'No provider calls, real media, public output, beta, production, or Track A unlocks',
    ],
  }
}

function orderedExecutionCandidates(): VlmL4Candidate[] {
  return vlmPerceptionCanaryCandidateExecutionOrder
    .map((modelId) => vlmL4CompatibleCandidates.find((candidate) => candidate.modelId === modelId))
    .filter((candidate): candidate is VlmL4Candidate => Boolean(candidate))
}

function selectBestPassingAttempt(attempts: readonly VlmPerceptionCanaryAttempt[]): VlmPerceptionCanaryAttempt | undefined {
  const passed = attempts.filter((attempt) => attempt.status === 'passed')
  if (!passed.length) return undefined
  return passed.slice().sort((a, b) => (
    vlmPerceptionCanaryCandidateSelectionPriority.indexOf(a.candidate.modelId) - vlmPerceptionCanaryCandidateSelectionPriority.indexOf(b.candidate.modelId)
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

function perceptionQaObjectPrefix(runId: string): string {
  return `activation/phase39c/generated-vlm-perception-canary/${runId}`
}

function perceptionExpectedReports(): string[] {
  return [
    'phase_39cq_so3_perception_canary_plan.json',
    'phase_39cq_so3_perception_failure_audit.json',
    'phase_39cq_so3_canary_fixture_manifest.json',
    'phase_39cq_so3_fixture_calibration_report.json',
    'phase_39cq_so3_label_alias_map.json',
    'phase_39cq_so3_freeform_trace_manifest.json',
    'phase_39cq_so3_labels_only_qa_report.json',
    'phase_39cq_so3_coarse_region_qa_report.json',
    'phase_39cq_so3_safe_zone_reasoning_report.json',
    'phase_39cq_so3_decomposed_canonical_report.json',
    'phase_39cq_so3_candidate_results.json',
    'phase_39cq_so3_runtime_results.json',
    'phase_39cq_so3_hallucination_safety_report.json',
    'phase_39cq_so3_private_artifact_manifest.json',
    'phase_39cq_so3_perception_canary_recovery_report.json',
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
    'new model downloads',
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
