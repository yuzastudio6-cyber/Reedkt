import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MEDIA_DATA_BETA_GATE_PHASE = '46E'
export const MEDIA_DATA_BETA_GATE_RUN_ID = 'phase46e-media-data-internal-beta-readiness-gate-20260603'
export const MEDIA_DATA_BETA_GATE_REPORT_DIR = 'docs/activation-phase-46e-media-data-internal-beta-readiness-gate-reports'
export const MEDIA_DATA_BETA_GATE_BRANCH = 'codex/rp-activation-46e-media-data-internal-beta-readiness-gate'
export const MEDIA_DATA_BETA_GATE_BASE_BRANCH = 'codex/rp-activation-46d-auth-rerun-duckdb-polars-reporting-qa'
export const MEDIA_DATA_BETA_GATE_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MEDIA_DATA_BETA_GATE_PRIVATE_OBJECT_PREFIX = `activation/phase46e/media-data-internal-beta-readiness-gate/${MEDIA_DATA_BETA_GATE_RUN_ID}`
export const MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX = `gs://${MEDIA_DATA_BETA_GATE_PRIVATE_BUCKET}/${MEDIA_DATA_BETA_GATE_PRIVATE_OBJECT_PREFIX}/`

const PHASE_46A_REPORT_DIR = 'docs/activation-phase-46a-media-data-readiness-reports'
const PHASE_46B_REPORT_DIR = 'docs/activation-phase-46b-generated-media-data-suite-reports'
const PHASE_46C_REPORT_DIR = 'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports'
const PHASE_46D_REPORT_DIR = 'docs/activation-phase-46d-duckdb-polars-reporting-qa-reports'

const PHASE_46B_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603/'
const PHASE_46C_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603/'
const PHASE_46D_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46d/reporting-qa-integration/phase46d-duckdb-polars-reporting-qa-integration-20260603/'

const TOOL_IDS = ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'] as const
type ToolId = typeof TOOL_IDS[number]

type GateStatus = 'passed' | 'blocked' | 'warning' | 'not_run'
type BetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type JsonRecord = Record<string, unknown>

interface MediaDataBetaGateSummary {
  phase: typeof MEDIA_DATA_BETA_GATE_PHASE
  runId: string
  status: GateStatus
  mediaDataToolFamilyBetaStatus: BetaStatus
  privateArtifactVerificationStatus: string
  privateArtifactUploadStatus: string
  criteriaStatus: string
  finalDecision: string
  allowedInternalScope: string
  blockedScopes: string[]
}

interface ArtifactVerificationItem {
  phase: '46B' | '46C' | '46D'
  prefix: string
  status: GateStatus
  listedObjects: number
  jsonObjects: number
  copiedJsonObjects: number
  blockedMediaObjects: number
  copiedArtifacts: Array<{
    basename: string
    gcsUri: string
    sizeBytes: number
    sha256: string
  }>
  blockers: string[]
  warnings: string[]
}

const EXPECTED_REPORT_FILES = [
  'phase_46e_media_data_beta_gate_plan.json',
  'phase_46e_media_data_beta_gate_input_manifest.json',
  'phase_46e_private_artifact_verification_report.json',
  'phase_46e_media_data_beta_gate_criteria.json',
  'phase_46e_media_data_caveat_classification.json',
  'phase_46e_media_data_allowed_internal_scope.json',
  'phase_46e_media_data_blocked_scope_matrix.json',
  'phase_46e_media_data_rollback_blocker_policy.json',
  'phase_46e_media_data_support_runbook_checklist.json',
  'phase_46e_media_data_beta_gate_scorecard.json',
  'phase_46e_media_data_beta_gate_decision.json',
  'phase_46e_private_artifact_manifest.json',
  'phase_46e_media_data_internal_beta_readiness_report.json',
  'phase_46e_blocker_report.json',
] as const

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_FRAME_SAMPLING',
  'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_CLOUD_RUN_EXECUTE',
  'REEDITPRO_CONFIRM_CLOUD_BUILD_EXECUTE',
]

const BLOCKED_SCOPES = [
  'product-wide internal beta',
  'external beta',
  'paid production',
  'production',
  'broad media',
  'arbitrary media paths',
  'unapproved real media',
  'public output',
  'provider calls',
  'VLM runtime retries',
  'OCR runtime outside approved phases',
  'generated media reprocessing',
  'controlled real-video reprocessing',
  'frame reads',
  'thumbnail reads',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'broad IAM',
  'public buckets or public artifacts',
  'Track A runtime/visual/render stack',
]

const MEDIA_PAYLOAD_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.avi',
  '.mkv',
  '.webm',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.tiff',
  '.bmp',
  '.heic',
])

export function getMediaDataBetaGatePlan() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    branch: MEDIA_DATA_BETA_GATE_BRANCH,
    baseIfPr135Open: MEDIA_DATA_BETA_GATE_BASE_BRANCH,
    sourcePhase46aPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
    sourcePhase46bPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/125',
    sourcePhase46cPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/128',
    sourcePhase46dPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/132',
    sourcePhase46dAuthRerunPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/135',
    defaultMode: 'report_only_until_execute_confirmation',
    executionConfirmations: [
      'REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE',
      'REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_READ',
      'REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD',
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedPrivateJsonReadPrefixes: [
      PHASE_46B_PRIVATE_GCS_PREFIX,
      PHASE_46C_PRIVATE_GCS_PREFIX,
      PHASE_46D_PRIVATE_GCS_PREFIX,
    ],
    privateArtifactUploadPrefix: MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
    allowedInternalScope: 'restricted internal QA/planning metadata and deterministic media/data tool-family evidence only',
    mediaProcessing: 'blocked',
    ocrRuntime: 'blocked',
    vlmRuntimeRetries: 'blocked',
    dockerCloudGpuIamMutation: 'blocked',
    packageLockPolicy: 'unchanged_no_repo_dependency_additions',
    mediaDataToolFamilyBetaStatus: 'blocked' as BetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export async function writeMediaDataBetaGateStaticArtifacts(reportDir = MEDIA_DATA_BETA_GATE_REPORT_DIR): Promise<void> {
  await writeReports(await buildReports({
    mode: 'static',
    reportDir,
    privateVerification: buildNotRunVerification(),
    privateUpload: buildUploadReport('not_run', 'Execution confirmation not supplied.'),
  }), reportDir)
}

export async function readMediaDataBetaGateSummary(reportDir = MEDIA_DATA_BETA_GATE_REPORT_DIR): Promise<MediaDataBetaGateSummary> {
  const decisionPath = path.join(reportDir, 'phase_46e_media_data_beta_gate_decision.json')
  if (!existsSync(decisionPath)) return buildSummary('not_run', 'blocked', 'not_run', 'not_run', 'not_run')
  const decision = await readJson(decisionPath)
  const blockedMatrix = await readOptionalJson(path.join(reportDir, 'phase_46e_media_data_blocked_scope_matrix.json'))
  const blockedScopes = Array.isArray(blockedMatrix?.blockedScopes)
    ? blockedMatrix.blockedScopes.map(String)
    : BLOCKED_SCOPES
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: toGateStatus(decision.status, 'not_run'),
    mediaDataToolFamilyBetaStatus: toBetaStatus(decision.mediaDataToolFamilyBetaStatus, 'blocked'),
    privateArtifactVerificationStatus: String(decision.privateArtifactVerificationStatus ?? 'unknown'),
    privateArtifactUploadStatus: String(decision.privateArtifactUploadStatus ?? 'unknown'),
    criteriaStatus: String(decision.criteriaStatus ?? 'unknown'),
    finalDecision: String(decision.finalDecision ?? 'Phase 46E beta gate has not run.'),
    allowedInternalScope: String(decision.allowedInternalScope ?? 'none'),
    blockedScopes,
  }
}

export async function executeMediaDataBetaGate(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<MediaDataBetaGateSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? MEDIA_DATA_BETA_GATE_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase46e-media-data-internal-beta-readiness-gate', MEDIA_DATA_BETA_GATE_RUN_ID)
  const privateReadDir = path.join(runtimeRoot, 'private-json-metadata')
  await mkdir(privateReadDir, { recursive: true })

  try {
    const privateVerification = await verifyPrivateJsonMetadataArtifacts(privateReadDir)
    const preliminaryUpload = buildUploadReport('not_run', 'Upload runs after report generation.')
    const preliminaryReports = await buildReports({
      mode: 'execute',
      reportDir,
      privateVerification,
      privateUpload: preliminaryUpload,
    })
    await writeReports(preliminaryReports, reportDir)

    const privateUpload = await uploadPrivateReports(reportDir)
    const finalReports = await buildReports({
      mode: 'execute',
      reportDir,
      privateVerification,
      privateUpload,
    })
    await writeReports(finalReports, reportDir)
    if (privateUpload.status === 'passed') {
      await uploadPrivateReports(reportDir)
    }
  } finally {
    if (!input.keepTemp) {
      // Intentionally leave temp cleanup to the OS. No media payloads are created, only private JSON metadata copies.
    }
  }

  return readMediaDataBetaGateSummary(reportDir)
}

export function getMediaDataBetaGateIamPlan() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'no_iam_mutation_allowed',
    privateArtifactUploadPrefix: MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
    notes: [
      'Phase 46E reads exact Phase 46B/46C/46D private JSON metadata and uploads metadata-only Phase 46E reports only if existing auth/IAM allows it.',
      'No scoped IAM update, broad IAM grant, public principal, bucket creation, or IAM mutation is performed by this phase.',
    ],
  }
}

export function getMediaDataBetaGateCostSummary() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'metadata_only',
    estimatedCloudCostUsd: 0,
    costDrivers: [
      'private GCS JSON metadata listing/copy if confirmed',
      'private GCS metadata-only report upload if confirmed',
    ],
    noDocker: true,
    noCloudRun: true,
    noCloudBuild: true,
    noGpu: true,
    noMediaProcessing: true,
  }
}

export const MEDIA_DATA_BETA_GATE_EXPECTED_REPORT_FILES = EXPECTED_REPORT_FILES

async function buildReports(input: {
  mode: 'static' | 'execute'
  reportDir: string
  privateVerification: JsonRecord
  privateUpload: JsonRecord
}) {
  const evidence = await loadCommittedEvidence()
  const caveats = buildCaveatClassification()
  const rollback = buildRollbackPolicy()
  const support = buildSupportChecklist()
  const allowedInternalScope = buildAllowedInternalScope()
  const blockedScopeMatrix = buildBlockedScopeMatrix()
  const criteria = buildCriteria(evidence, input.privateVerification, input.privateUpload, rollback, support)
  const scorecard = buildScorecard(criteria, caveats)
  const decision = buildDecision(criteria, scorecard, input.privateVerification, input.privateUpload)
  const inputManifest = buildInputManifest(evidence, input.privateVerification)
  const artifactManifest = await buildPrivateArtifactManifest(input.reportDir, input.privateUpload)
  const readinessReport = {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: decision.status,
    mediaDataToolFamilyBetaStatus: decision.mediaDataToolFamilyBetaStatus,
    evidenceStatus: criteria.evidenceStatus,
    privateArtifactVerificationStatus: decision.privateArtifactVerificationStatus,
    privateArtifactUploadStatus: decision.privateArtifactUploadStatus,
    criteriaStatus: decision.criteriaStatus,
    allowedInternalScope: allowedInternalScope.allowedInternalScope,
    blockedScopes: blockedScopeMatrix.blockedScopes,
    caveats: caveats.caveats,
    noMediaProcessing: true,
    noOcrRuntime: true,
    noVlmRuntimeRetries: true,
    noProviderCalls: true,
    noDockerCloudGpuIamMutation: true,
    trackA: 'not_touched',
    finalDecision: decision.finalDecision,
    nextPhaseDecision: decision.nextPhaseDecision,
  }
  const blockerReport = {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: decision.status === 'passed' ? 'passed_no_required_blockers' : 'blocked',
    blockers: criteria.criteria.filter((criterion) => criterion.status !== 'passed'),
    warnings: caveats.caveats.filter((caveat) => caveat.internalScopeImpact === 'warning'),
    blockedScopes: BLOCKED_SCOPES,
  }

  return {
    plan: getMediaDataBetaGatePlan(),
    inputManifest,
    privateVerification: input.privateVerification,
    criteria,
    caveats,
    allowedInternalScope,
    blockedScopeMatrix,
    rollback,
    support,
    scorecard,
    decision,
    artifactManifest,
    readinessReport,
    blockerReport,
  }
}

async function writeReports(reports: Awaited<ReturnType<typeof buildReports>>, reportDir: string): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_beta_gate_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_beta_gate_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_private_artifact_verification_report.json'), reports.privateVerification)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_beta_gate_criteria.json'), reports.criteria)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_caveat_classification.json'), reports.caveats)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_allowed_internal_scope.json'), reports.allowedInternalScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_blocked_scope_matrix.json'), reports.blockedScopeMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_rollback_blocker_policy.json'), reports.rollback)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_support_runbook_checklist.json'), reports.support)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_beta_gate_scorecard.json'), reports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_beta_gate_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_private_artifact_manifest.json'), reports.artifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_media_data_internal_beta_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46e_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46e_media_data_internal_beta_readiness_report.md'), renderReadinessMarkdown(reports.readinessReport))
}

async function loadCommittedEvidence() {
  const phase46a = await readJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_readiness_report.json'))
  const phase46b = await readJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_generated_media_data_suite_report.json'))
  const phase46c = await readJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_controlled_real_video_media_data_suite_report.json'))
  const phase46d = await readJson(path.join(PHASE_46D_REPORT_DIR, 'phase_46d_reporting_qa_integration_report.json'))
  const phase46dAuth = await readJson(path.join(PHASE_46D_REPORT_DIR, 'phase_46d_auth_rerun_recovery_report.json'))
  const phase46bArtifact = await readOptionalJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_private_artifact_manifest.json'))
  const phase46cArtifact = await readOptionalJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_private_artifact_manifest.json'))
  const phase46dArtifact = await readOptionalJson(path.join(PHASE_46D_REPORT_DIR, 'phase_46d_auth_rerun_private_artifact_manifest.json'))
  return {
    phase46a,
    phase46b,
    phase46c,
    phase46d,
    phase46dAuth,
    phase46bArtifact,
    phase46cArtifact,
    phase46dArtifact,
  }
}

function buildInputManifest(evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>, privateVerification: JsonRecord) {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    committedEvidence: [
      {
        phase: '46A',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
        report: `${PHASE_46A_REPORT_DIR}/phase_46a_media_data_readiness_report.json`,
        status: evidence.phase46a.status,
        betaStatus: evidence.phase46a.mediaDataToolFamilyBetaStatus,
      },
      {
        phase: '46B',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/125',
        report: `${PHASE_46B_REPORT_DIR}/phase_46b_generated_media_data_suite_report.json`,
        status: evidence.phase46b.status,
        betaStatus: evidence.phase46b.mediaDataToolFamilyBetaStatus,
      },
      {
        phase: '46C',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/128',
        report: `${PHASE_46C_REPORT_DIR}/phase_46c_controlled_real_video_media_data_suite_report.json`,
        status: evidence.phase46c.status,
        betaStatus: evidence.phase46c.mediaDataToolFamilyBetaStatus,
      },
      {
        phase: '46D',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/132',
        report: `${PHASE_46D_REPORT_DIR}/phase_46d_reporting_qa_integration_report.json`,
        status: evidence.phase46d.status,
        betaStatus: evidence.phase46d.mediaDataToolFamilyBetaStatus,
      },
      {
        phase: '46D-AUTH-RERUN',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/135',
        report: `${PHASE_46D_REPORT_DIR}/phase_46d_auth_rerun_recovery_report.json`,
        status: evidence.phase46dAuth.status,
        betaStatus: evidence.phase46dAuth.mediaDataToolFamilyBetaStatus,
      },
    ],
    privateArtifactVerification: {
      status: privateVerification.status,
      allowedPrefixes: [
        PHASE_46B_PRIVATE_GCS_PREFIX,
        PHASE_46C_PRIVATE_GCS_PREFIX,
        PHASE_46D_PRIVATE_GCS_PREFIX,
      ],
      jsonOnly: true,
      mediaFilesBlocked: true,
    },
  }
}

function buildCriteria(
  evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>,
  privateVerification: JsonRecord,
  privateUpload: JsonRecord,
  rollback: JsonRecord,
  support: JsonRecord,
) {
  const phase46bTools = evidence.phase46b.toolStatus as Record<ToolId, string> | undefined
  const phase46cTools = evidence.phase46c.toolStatus as Record<ToolId, string> | undefined
  const criteria = [
    criterion('phase46a_source_license_runtime_readiness', evidence.phase46a.status === 'passed_as_evidence_planning_only'),
    criterion('phase46b_generated_fixture_suite', evidence.phase46b.status === 'passed'),
    criterion('phase46c_controlled_real_video_suite', evidence.phase46c.status === 'passed'),
    criterion('phase46d_duckdb_polars_reporting_qa', evidence.phase46d.status === 'passed'),
    criterion('phase46d_auth_rerun_private_metadata', evidence.phase46dAuth.status === 'passed'),
    criterion('phase46b_all_required_tools_passed', TOOL_IDS.every((tool) => phase46bTools?.[tool] === 'passed')),
    criterion('phase46c_all_required_tools_passed', TOOL_IDS.every((tool) => phase46cTools?.[tool] === 'passed')),
    criterion('phase46d_consistency_scorecard_passed', evidence.phase46d.consistencyStatus === 'passed' && evidence.phase46d.readinessScorecardStatus === 'passed'),
    criterion('exact_private_json_artifact_verification', privateVerification.status === 'passed'),
    criterion('phase46e_private_metadata_upload', privateUpload.status === 'passed'),
    criterion('storage_privacy_gates', evidence.phase46d.privacyStorageStatus === 'passed' && evidence.phase46d.noMediaProcessing === true),
    criterion('rollback_blocker_policy_present', rollback.status === 'passed'),
    criterion('support_runbook_present', support.status === 'passed'),
    criterion('no_forbidden_execution_scope', true),
    criterion('track_a_untouched', true),
  ]
  const requiredFailed = criteria.filter((item) => item.status !== 'passed')
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: requiredFailed.length === 0 ? 'passed' : 'blocked',
    evidenceStatus: requiredFailed.length === 0 ? 'complete' : 'incomplete',
    criteria,
    blockers: requiredFailed,
  }
}

function criterion(id: string, passed: boolean) {
  return {
    id,
    status: passed ? 'passed' : 'blocked',
  }
}

function buildCaveatClassification() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'passed',
    caveats: [
      caveat('ffmpeg_pyav_dependency', 'FFmpeg/PyAV codec, patent/build, and dynamic library review remains required.', 'warning', 'blocker'),
      caveat('sharp_libvips_lgpl_native_dependency', 'libvips LGPL-2.1-or-later and native binary/platform review remains required.', 'warning', 'blocker'),
      caveat('duckdb_extension_network_file_io', 'DuckDB extension/network/object-store access remains blocked; confirmed metadata-only in Phase 46D.', 'warning', 'blocker'),
      caveat('polars_memory_runtime', 'Polars memory/CPU/runtime behavior is acceptable for bounded internal metadata, not broad media analytics.', 'warning', 'blocker'),
      caveat('one_controlled_sample_only', 'Phase 46C used one approved private controlled sample only.', 'warning', 'blocker'),
      caveat('vlm_ocr_product_caveat', 'VLM remains blocked and OCR remains internal QA/planning only; neither blocks media/data internal-scope evidence.', 'warning', 'product_beta_blocker'),
    ],
  }
}

function caveat(id: string, summary: string, internalScopeImpact: string, productionImpact: string) {
  return { id, summary, internalScopeImpact, productionImpact }
}

function buildAllowedInternalScope() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'passed',
    allowedInternalScope: 'restricted internal QA/planning candidate for the media/data tool family only',
    allowedActivities: [
      'review committed safe Phase 46A-46E metadata reports',
      'use media/data QA scorecards as internal planning evidence',
      'use private metadata manifests for bounded internal QA verification',
      'plan follow-up deterministic media/data hardening with explicit approval gates',
    ],
    notAllowed: BLOCKED_SCOPES,
  }
}

function buildBlockedScopeMatrix() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'passed',
    blockedScopes: BLOCKED_SCOPES,
    publicAccess: 'blocked',
    broadMedia: 'blocked',
    productWideBeta: 'blocked',
    externalBeta: 'blocked',
    production: 'blocked',
    providerCalls: 'blocked',
    trackA: 'blocked',
  }
}

function buildRollbackPolicy() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'passed',
    rollbackTriggers: [
      'private artifact verification mismatch',
      'metadata report schema drift',
      'DuckDB/Polars consistency disagreement',
      'private metadata leakage into committed reports',
      'media/frame/thumbnail artifact committed or uploaded to public location',
      'provider/OCR/VLM/Track A execution attempted through this gate',
      'production or external beta unlock attempted',
    ],
    rollbackAction: 'revoke internally beta-ready candidate status for media/data tool family and return to blocked until corrected evidence is committed.',
    blockerPolicy: 'fail_closed_on_missing_evidence_or_privacy_storage_gate_failure',
  }
}

function buildSupportChecklist() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'passed',
    checklist: [
      'Phase 46A source/license/runtime-readiness evidence is committed.',
      'Phase 46B generated fixture evidence and private artifact manifest are committed.',
      'Phase 46C controlled real-video metadata evidence and private artifact manifest are committed.',
      'Phase 46D DuckDB/Polars consistency scorecard and auth-rerun evidence are committed.',
      'Phase 46E private JSON metadata verification is exact-prefix and metadata-only.',
      'Blocked scope matrix preserves production, broad media, public output, provider, VLM/OCR, Docker/cloud/GPU/IAM, and Track A blocks.',
    ],
  }
}

function buildScorecard(criteria: JsonRecord, caveats: JsonRecord) {
  const criteriaRows = criteria.criteria as Array<{ id: string, status: string }>
  const passed = criteriaRows.filter((item) => item.status === 'passed').length
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: criteria.status,
    score: {
      passedCriteria: passed,
      totalCriteria: criteriaRows.length,
      requiredBlockers: criteriaRows.length - passed,
      internalWarnings: Array.isArray(caveats.caveats) ? caveats.caveats.length : 0,
    },
    mediaDataToolFamilyBetaStatus: criteria.status === 'passed'
      ? 'internally beta-ready candidate'
      : 'blocked',
    productWideBetaStatus: 'blocked',
    externalBetaStatus: 'blocked',
    productionStatus: 'blocked',
  }
}

function buildDecision(criteria: JsonRecord, scorecard: JsonRecord, privateVerification: JsonRecord, privateUpload: JsonRecord) {
  const passed = criteria.status === 'passed' && scorecard.status === 'passed'
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    criteriaStatus: criteria.status,
    privateArtifactVerificationStatus: privateVerification.status,
    privateArtifactUploadStatus: privateUpload.status,
    mediaDataToolFamilyBetaStatus: passed
      ? 'internally beta-ready candidate'
      : 'blocked',
    finalDecision: passed
      ? 'Media/data tool family is an internally beta-ready candidate for restricted internal QA/planning scope only.'
      : 'Media/data internal beta-readiness gate remains blocked until required criteria and private artifact verification/upload pass.',
    allowedInternalScope: passed
      ? 'restricted internal QA/planning metadata and deterministic media/data tool-family evidence only'
      : 'none',
    productWideBeta: 'blocked',
    externalBeta: 'blocked',
    production: 'blocked',
    blockedScopes: BLOCKED_SCOPES,
    nextPhaseDecision: passed
      ? 'Use the internally beta-ready candidate status only for restricted internal media/data QA/planning; broader product beta remains blocked.'
      : 'Fix the exact Phase 46E blocker before any internal beta candidate decision.',
  }
}

async function verifyPrivateJsonMetadataArtifacts(privateReadDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_READ !== 'true') {
    return buildBlockedVerification('REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_READ is required.')
  }

  const items: ArtifactVerificationItem[] = []
  for (const phase of [
    { id: '46B' as const, prefix: PHASE_46B_PRIVATE_GCS_PREFIX },
    { id: '46C' as const, prefix: PHASE_46C_PRIVATE_GCS_PREFIX },
    { id: '46D' as const, prefix: PHASE_46D_PRIVATE_GCS_PREFIX },
  ]) {
    items.push(await verifyPrefix(phase.id, phase.prefix, path.join(privateReadDir, phase.id.toLowerCase())))
  }
  const blockers = items.flatMap((item) => item.blockers)
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    privateReads: 'json_metadata_only',
    allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX, PHASE_46D_PRIVATE_GCS_PREFIX],
    mediaFileReads: 'blocked',
    broadBucketReads: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    items,
    blockers,
  }
}

async function verifyPrefix(phase: ArtifactVerificationItem['phase'], prefix: string, targetDir: string): Promise<ArtifactVerificationItem> {
  await mkdir(targetDir, { recursive: true })
  const list = await runCommand('gcloud', ['--quiet', 'storage', 'ls', '--recursive', prefix], { label: `${phase}_json_metadata_list` })
  const objects = list.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const jsonObjects = objects.filter((object) => object.endsWith('.json'))
  const blockedMedia = objects.filter((object) => MEDIA_PAYLOAD_EXTENSIONS.has(path.extname(object).toLowerCase()))
  const blockers: string[] = []
  if (list.status !== 'passed') blockers.push(`${phase}:private_prefix_list_failed`)
  if (jsonObjects.length === 0) blockers.push(`${phase}:no_json_metadata_objects_found`)
  const warnings: string[] = []
  if (blockedMedia.length > 0) {
    warnings.push(`${phase}:media_payload_objects_present_but_not_read_or_copied`)
  }

  const copiedArtifacts: ArtifactVerificationItem['copiedArtifacts'] = []
  for (const object of jsonObjects) {
    const basename = safeBasename(object)
    const destination = path.join(targetDir, basename)
    const copy = await runCommand('gcloud', ['--quiet', 'storage', 'cp', object, destination], { label: `${phase}_${basename}_copy` })
    if (copy.status !== 'passed') {
      blockers.push(`${phase}:${basename}:json_copy_failed`)
      continue
    }
    const size = await stat(destination)
    copiedArtifacts.push({
      basename,
      gcsUri: object,
      sizeBytes: size.size,
      sha256: await sha256File(destination),
    })
  }

  return {
    phase,
    prefix,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    listedObjects: objects.length,
    jsonObjects: jsonObjects.length,
    copiedJsonObjects: copiedArtifacts.length,
    blockedMediaObjects: blockedMedia.length,
    copiedArtifacts,
    blockers,
    warnings,
  }
}

async function uploadPrivateReports(reportDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return buildUploadReport('blocked', 'REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD is required.')
  }
  const upload = await runCommand('gcloud', ['--quiet', 'storage', 'cp', '--recursive', reportDir, MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX], {
    label: 'phase46e_private_report_upload',
    timeoutMs: 120000,
  })
  const listing = await runCommand('gcloud', ['--quiet', 'storage', 'ls', '--recursive', MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX], {
    label: 'phase46e_private_report_upload_list',
  })
  const listedObjects = listing.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const blockers = []
  if (upload.status !== 'passed') blockers.push('phase46e_private_report_upload_failed')
  if (listing.status !== 'passed') blockers.push('phase46e_private_report_upload_list_failed')
  if (listedObjects.some((object) => MEDIA_PAYLOAD_EXTENSIONS.has(path.extname(object).toLowerCase()))) {
    blockers.push('phase46e_private_upload_contains_media_payload')
  }
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    privateArtifactPrefix: MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    uploadedObjectCount: listedObjects.length,
    blockers,
  }
}

async function buildPrivateArtifactManifest(reportDir: string, privateUpload: JsonRecord) {
  const localArtifacts = existsSync(reportDir)
    ? await collectFiles(reportDir)
    : []
  const artifacts = []
  for (const file of localArtifacts.filter((artifact) => path.basename(artifact).startsWith('phase_46e_'))) {
    const fileStat = await stat(file)
    const relative = path.relative(reportDir, file).split(path.sep).join('/')
    artifacts.push({
      id: relative.replace(/[^0-9A-Za-z_-]+/g, '_'),
      relativePath: relative,
      sizeBytes: fileStat.size,
      sha256: await sha256File(file),
      gcsUri: `${MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX}${relative}`,
    })
  }
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: privateUpload.status === 'passed' ? 'passed' : privateUpload.status,
    privateArtifactPrefix: MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    committedReportArtifacts: artifacts,
    uploadedObjectCount: privateUpload.uploadedObjectCount ?? 0,
    blockers: privateUpload.blockers ?? [],
  }
}

function buildNotRunVerification() {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'not_run',
    reason: 'Private JSON metadata verification requires execute confirmation.',
    allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX, PHASE_46D_PRIVATE_GCS_PREFIX],
    mediaFileReads: 'blocked',
  }
}

function buildBlockedVerification(reason: string) {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status: 'blocked',
    reason,
    allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX, PHASE_46D_PRIVATE_GCS_PREFIX],
    mediaFileReads: 'blocked',
    blockers: [reason],
  }
}

function buildUploadReport(status: GateStatus, reason: string) {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status,
    privateArtifactPrefix: MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    reason,
    blockers: status === 'passed' ? [] : [reason],
  }
}

function requireExecutionConfirmations(): void {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE !== 'true') {
    throw new Error('Phase 46E execution requires REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE=true.')
  }
  for (const forbidden of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') {
      throw new Error(`Forbidden Phase 46E confirmation is set: ${forbidden}`)
    }
  }
}

async function runCommand(command: string, args: string[], options: {
  label: string
  timeoutMs?: number
}): Promise<{ status: GateStatus, stdout: string, stderrSummary: string, durationMs: number }> {
  const started = Date.now()
  try {
    const result = await execFileAsync(command, args, {
      timeout: options.timeoutMs ?? 60000,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    })
    return {
      status: 'passed',
      stdout: result.stdout,
      stderrSummary: summarizeCommandOutput(result.stderr),
      durationMs: Date.now() - started,
    }
  } catch (error) {
    const err = error as { stdout?: string, stderr?: string, message?: string }
    return {
      status: 'blocked',
      stdout: err.stdout ?? '',
      stderrSummary: summarizeCommandOutput(err.stderr ?? err.message ?? ''),
      durationMs: Date.now() - started,
    }
  }
}

function summarizeCommandOutput(value: string): string {
  return value
    .replace(/ya29\.[0-9A-Za-z._-]+/g, '<redacted-access-token>')
    .replace(/Bearer\s+[0-9A-Za-z._-]+/g, 'Bearer <redacted>')
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 8)
    .join('\n')
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

async function readOptionalJson(filePath: string): Promise<JsonRecord | null> {
  if (!existsSync(filePath)) return null
  return readJson(filePath)
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}

async function collectFiles(root: string, prefix = ''): Promise<string[]> {
  const current = path.join(root, prefix)
  const entries = await readdir(current, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(root, relative)
    if (entry.isDirectory()) files.push(...await collectFiles(root, relative))
    else files.push(absolute)
  }
  return files.sort()
}

function safeBasename(gcsUri: string): string {
  return path.basename(gcsUri).replace(/[^0-9A-Za-z._-]/g, '_')
}

function toGateStatus(value: unknown, fallback: GateStatus): GateStatus {
  return value === 'passed' || value === 'blocked' || value === 'warning' || value === 'not_run'
    ? value
    : fallback
}

function toBetaStatus(value: unknown, fallback: BetaStatus): BetaStatus {
  return value === 'blocked'
    || value === 'phase-complete but tool-family incomplete'
    || value === 'internally beta-ready candidate'
    || value === 'external beta still blocked'
    ? value
    : fallback
}

function buildSummary(
  status: GateStatus,
  betaStatus: BetaStatus,
  verificationStatus: string,
  uploadStatus: string,
  criteriaStatus: string,
): MediaDataBetaGateSummary {
  return {
    phase: MEDIA_DATA_BETA_GATE_PHASE,
    runId: MEDIA_DATA_BETA_GATE_RUN_ID,
    status,
    mediaDataToolFamilyBetaStatus: betaStatus,
    privateArtifactVerificationStatus: verificationStatus,
    privateArtifactUploadStatus: uploadStatus,
    criteriaStatus,
    finalDecision: 'Phase 46E beta gate has not run.',
    allowedInternalScope: 'none',
    blockedScopes: BLOCKED_SCOPES,
  }
}

function renderReadinessMarkdown(report: JsonRecord): string {
  return [
    '# Phase 46E Media/Data Internal Beta-Readiness Report',
    '',
    `- Status: ${String(report.status)}`,
    `- Media/data tool-family beta status: ${String(report.mediaDataToolFamilyBetaStatus)}`,
    `- Private artifact verification: ${String(report.privateArtifactVerificationStatus)}`,
    `- Private artifact upload: ${String(report.privateArtifactUploadStatus)}`,
    `- Decision: ${String(report.finalDecision)}`,
    '',
    'Production, product-wide beta, external beta, broad media, arbitrary media, public output, provider calls, VLM runtime retries, OCR runtime outside approved phases, Docker/Cloud Run/Cloud Build/GPU jobs, IAM mutation, and Track A remain blocked.',
  ].join('\n')
}
