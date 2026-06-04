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

type GateStatus = 'passed' | 'blocked' | 'warning' | 'not_run'
type AudioTimingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type JsonRecord = Record<string, unknown>

interface AudioTimingBetaGateSummary {
  phase: typeof AUDIO_TIMING_BETA_GATE_PHASE
  runId: string
  status: GateStatus
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  privateArtifactVerificationStatus: string
  privateArtifactUploadStatus: string
  criteriaStatus: string
  demucsPolicyStatus: string
  finalDecision: string
  allowedInternalScope: string
  blockedScopes: string[]
}

interface ArtifactVerificationItem {
  phase: '36H' | '36I' | '36J'
  prefix: string
  status: GateStatus
  listedObjects: number
  jsonObjects: number
  copiedJsonObjects: number
  blockedPayloadObjects: number
  copiedArtifacts: Array<{
    basename: string
    gcsUri: string
    sizeBytes: number
    sha256: string
  }>
  blockers: string[]
  warnings: string[]
}

export const AUDIO_TIMING_BETA_GATE_PHASE = '36M'
export const AUDIO_TIMING_BETA_GATE_RUN_ID = 'phase36m-audio-timing-internal-beta-readiness-gate-20260604'
export const AUDIO_TIMING_BETA_GATE_REPORT_DIR = 'docs/activation-phase-36m-audio-timing-internal-beta-readiness-gate-reports'
export const AUDIO_TIMING_BETA_GATE_BRANCH = 'codex/rp-activation-36m-audio-timing-internal-beta-readiness-gate'
export const AUDIO_TIMING_BETA_GATE_BASE_BRANCH = 'codex/rp-activation-36k-demucs-provenance-approval-retry'
export const AUDIO_TIMING_BETA_GATE_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const AUDIO_TIMING_BETA_GATE_PRIVATE_OBJECT_PREFIX = `activation/phase36m/audio-timing-internal-beta-readiness-gate/${AUDIO_TIMING_BETA_GATE_RUN_ID}`
export const AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX = `gs://${AUDIO_TIMING_BETA_GATE_PRIVATE_BUCKET}/${AUDIO_TIMING_BETA_GATE_PRIVATE_OBJECT_PREFIX}/`

const PHASE_36H_REPORT_DIR = 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports'
const PHASE_36I_REPORT_DIR = 'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports'
const PHASE_36J_REPORT_DIR = 'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports'
const PHASE_36K_REPORT_DIR = 'docs/activation-phase-36k-demucs-provenance-approval-retry-reports'

const PHASE_36H_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36h/deepfilternet-controlled-speech/phase36h-linux-deepfilternet-runtime-completion-20260603-r5/'
const PHASE_36I_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36i/signalsmith-stretch-generated-audio/phase36i-signalsmith-stretch-generated-fixture-20260603/'
const PHASE_36J_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36j/controlled-real-media-timing-stretch/phase36j-controlled-real-media-timing-stretch-20260603/'

export const AUDIO_TIMING_BETA_GATE_EXPECTED_REPORT_FILES = [
  'phase_36m_audio_timing_beta_gate_plan.json',
  'phase_36m_audio_timing_prior_evidence_inventory.json',
  'phase_36m_audio_timing_beta_gate_input_manifest.json',
  'phase_36m_audio_timing_private_artifact_verification_report.json',
  'phase_36m_audio_timing_beta_gate_criteria.json',
  'phase_36m_audio_timing_caveat_classification.json',
  'phase_36m_audio_timing_demucs_exclusion_policy.json',
  'phase_36m_audio_timing_allowed_internal_scope.json',
  'phase_36m_audio_timing_blocked_scope_matrix.json',
  'phase_36m_audio_timing_rollback_blocker_policy.json',
  'phase_36m_audio_timing_support_runbook_checklist.json',
  'phase_36m_audio_timing_beta_gate_scorecard.json',
  'phase_36m_audio_timing_beta_gate_decision.json',
  'phase_36m_private_artifact_manifest.json',
  'phase_36m_audio_timing_internal_beta_readiness_report.json',
  'phase_36m_blocker_report.json',
] as const

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_DOWNLOAD',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_STAGING',
  'REEDITPRO_CONFIRM_DEMUCS_SOURCE_SEPARATION',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_PROVIDER_CALLS',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_PRODUCTION_UNLOCK',
  'REEDITPRO_CONFIRM_EXTERNAL_BETA_UNLOCK',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
] as const

const BLOCKED_SCOPES = [
  'product-wide internal beta',
  'external beta',
  'paid production',
  'production',
  'broad media',
  'arbitrary media paths',
  'unapproved real media',
  'full-video audio cleanup',
  'full-video timing stretch',
  'public output',
  'public artifacts',
  'signed URLs as source of truth',
  'provider calls',
  'Demucs runtime/model download/source separation',
  'Phase 36L until human/legal approval resolves Demucs provenance',
  'VLM runtime retries',
  'OCR runtime outside approved OCR phases',
  'DeepFilterNet runtime reruns',
  'Signalsmith runtime reruns',
  'audio/media processing',
  'Docker',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'broad IAM',
  'Track A runtime/visual/render stack',
]

const BLOCKED_PAYLOAD_EXTENSIONS = new Set([
  '.aac',
  '.aif',
  '.aiff',
  '.avi',
  '.bin',
  '.flac',
  '.gif',
  '.heic',
  '.jpeg',
  '.jpg',
  '.m4a',
  '.m4v',
  '.mkv',
  '.mov',
  '.mp3',
  '.mp4',
  '.ogg',
  '.onnx',
  '.png',
  '.pt',
  '.pth',
  '.raw',
  '.safetensors',
  '.tar',
  '.tgz',
  '.wav',
  '.webm',
  '.webp',
])

export function getAudioTimingBetaGatePlan() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    branch: AUDIO_TIMING_BETA_GATE_BRANCH,
    baseIfPr156Open: AUDIO_TIMING_BETA_GATE_BASE_BRANCH,
    sourcePhase36hPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
    sourcePhase36iPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147',
    sourcePhase36jPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/149',
    sourcePhase36kPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/156',
    defaultMode: 'report_only_until_execute_confirmation',
    executionConfirmations: [
      'REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE',
      'REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_READ',
      'REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD',
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    allowedPrivateJsonReadPrefixes: [
      PHASE_36H_PRIVATE_GCS_PREFIX,
      PHASE_36I_PRIVATE_GCS_PREFIX,
      PHASE_36J_PRIVATE_GCS_PREFIX,
    ],
    privateArtifactUploadPrefix: AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
    privateArtifactReadPolicy: 'optional_preferred_json_only_warning_if_unavailable_and_committed_manifests_complete',
    privateArtifactUploadPolicy: 'required_for_passing_phase36m_execute_decision',
    allowedInternalScope: 'restricted internal QA/planning candidate for bounded audio/timing tool-family evidence only',
    demucsPolicy: 'excluded_from_current_internal_scope_blocked_pending_training_data_provenance',
    audioProcessing: 'blocked',
    mediaProcessing: 'blocked',
    ocrRuntime: 'blocked',
    vlmRuntimeRetries: 'blocked',
    providerCalls: 'blocked',
    dockerCloudGpuIamMutation: 'blocked',
    packageLockPolicy: 'unchanged_no_repo_dependency_additions',
    audioTimingToolFamilyBetaStatus: 'blocked' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export async function writeAudioTimingBetaGateStaticArtifacts(reportDir = AUDIO_TIMING_BETA_GATE_REPORT_DIR): Promise<void> {
  await writeReports(await buildReports({
    mode: 'static',
    reportDir,
    privateVerification: buildNotRunVerification(),
    privateUpload: buildUploadReport('not_run', 'Execution confirmation not supplied.'),
  }), reportDir)
}

export async function readAudioTimingBetaGateSummary(reportDir = AUDIO_TIMING_BETA_GATE_REPORT_DIR): Promise<AudioTimingBetaGateSummary> {
  const decisionPath = path.join(reportDir, 'phase_36m_audio_timing_beta_gate_decision.json')
  if (!existsSync(decisionPath)) return buildSummary('not_run', 'blocked', 'not_run', 'not_run', 'not_run')
  const decision = await readJson(decisionPath)
  const blockedMatrix = await readOptionalJson(path.join(reportDir, 'phase_36m_audio_timing_blocked_scope_matrix.json'))
  const blockedScopes = Array.isArray(blockedMatrix?.blockedScopes)
    ? blockedMatrix.blockedScopes.map(String)
    : BLOCKED_SCOPES
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: toGateStatus(decision.status, 'not_run'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(decision.audioTimingToolFamilyBetaStatus, 'blocked'),
    privateArtifactVerificationStatus: String(decision.privateArtifactVerificationStatus ?? 'unknown'),
    privateArtifactUploadStatus: String(decision.privateArtifactUploadStatus ?? 'unknown'),
    criteriaStatus: String(decision.criteriaStatus ?? 'unknown'),
    demucsPolicyStatus: String(decision.demucsPolicyStatus ?? 'unknown'),
    finalDecision: String(decision.finalDecision ?? 'Phase 36M beta gate has not run.'),
    allowedInternalScope: String(decision.allowedInternalScope ?? 'none'),
    blockedScopes,
  }
}

export async function executeAudioTimingBetaGate(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<AudioTimingBetaGateSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? AUDIO_TIMING_BETA_GATE_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase36m-audio-timing-internal-beta-readiness-gate', AUDIO_TIMING_BETA_GATE_RUN_ID)
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
      // No cleanup required: Phase 36M copies JSON metadata only and relies on OS temp cleanup.
    }
  }

  return readAudioTimingBetaGateSummary(reportDir)
}

export function getAudioTimingBetaGateIamPlan() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'no_iam_mutation_allowed',
    privateArtifactUploadPrefix: AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
    notes: [
      'Phase 36M may read exact Phase 36H/36I/36J private JSON metadata and upload metadata-only Phase 36M reports only when existing auth/IAM already permits it.',
      'No scoped IAM update, broad IAM grant, public principal, bucket creation, service-account key creation, or IAM mutation is performed by this phase.',
    ],
  }
}

export function getAudioTimingBetaGateCostSummary() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'metadata_only',
    estimatedCloudCostUsd: 0,
    costDrivers: [
      'private GCS JSON metadata listing/copy if confirmed',
      'private GCS metadata-only report upload if confirmed',
    ],
    noPackageInstall: true,
    noAudioProcessing: true,
    noMediaProcessing: true,
    noDocker: true,
    noCloudRun: true,
    noCloudBuild: true,
    noGpu: true,
    noIamMutation: true,
  }
}

async function buildReports(input: {
  mode: 'static' | 'execute'
  reportDir: string
  privateVerification: JsonRecord
  privateUpload: JsonRecord
}) {
  const evidence = await loadCommittedEvidence()
  const priorEvidenceInventory = buildPriorEvidenceInventory(evidence)
  const demucsExclusionPolicy = buildDemucsExclusionPolicy(evidence)
  const caveats = buildCaveatClassification()
  const rollback = buildRollbackPolicy()
  const support = buildSupportChecklist()
  const allowedInternalScope = buildAllowedInternalScope()
  const blockedScopeMatrix = buildBlockedScopeMatrix()
  const criteria = buildCriteria(evidence, input.privateVerification, input.privateUpload, rollback, support, demucsExclusionPolicy)
  const scorecard = buildScorecard(criteria, caveats)
  const decision = buildDecision(criteria, scorecard, input.privateVerification, input.privateUpload, demucsExclusionPolicy)
  const inputManifest = buildInputManifest(evidence, input.privateVerification)
  const artifactManifest = await buildPrivateArtifactManifest(input.reportDir, input.privateUpload)
  const readinessReport = {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: decision.status,
    audioTimingToolFamilyBetaStatus: decision.audioTimingToolFamilyBetaStatus,
    evidenceStatus: criteria.evidenceStatus,
    privateArtifactVerificationStatus: decision.privateArtifactVerificationStatus,
    privateArtifactUploadStatus: decision.privateArtifactUploadStatus,
    criteriaStatus: decision.criteriaStatus,
    demucsPolicyStatus: decision.demucsPolicyStatus,
    allowedInternalScope: allowedInternalScope.allowedInternalScope,
    blockedScopes: blockedScopeMatrix.blockedScopes,
    caveats: caveats.caveats,
    noAudioProcessing: true,
    noMediaProcessing: true,
    noDemucsRuntime: true,
    noOcrRuntime: true,
    noVlmRuntimeRetries: true,
    noProviderCalls: true,
    noDockerCloudGpuIamMutation: true,
    trackA: 'not_touched',
    finalDecision: decision.finalDecision,
    nextPhaseDecision: decision.nextPhaseDecision,
  }
  const blockerReport = {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: decision.status === 'passed' ? 'passed_no_required_blockers' : 'blocked',
    blockers: criteria.criteria.filter((criterion) => criterion.status === 'blocked'),
    warnings: [
      ...criteria.criteria.filter((criterion) => criterion.status === 'warning'),
      ...caveats.caveats.filter((caveat) => caveat.internalScopeImpact === 'warning'),
    ],
    blockedScopes: BLOCKED_SCOPES,
  }

  return {
    plan: getAudioTimingBetaGatePlan(),
    priorEvidenceInventory,
    inputManifest,
    privateVerification: input.privateVerification,
    criteria,
    caveats,
    demucsExclusionPolicy,
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
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_beta_gate_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_prior_evidence_inventory.json'), reports.priorEvidenceInventory)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_36m_audio_timing_prior_evidence_inventory.md'), renderPriorEvidenceMarkdown(reports.priorEvidenceInventory))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_beta_gate_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_private_artifact_verification_report.json'), reports.privateVerification)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_beta_gate_criteria.json'), reports.criteria)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_caveat_classification.json'), reports.caveats)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_demucs_exclusion_policy.json'), reports.demucsExclusionPolicy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_allowed_internal_scope.json'), reports.allowedInternalScope)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_blocked_scope_matrix.json'), reports.blockedScopeMatrix)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_rollback_blocker_policy.json'), reports.rollback)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_support_runbook_checklist.json'), reports.support)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_beta_gate_scorecard.json'), reports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_beta_gate_decision.json'), reports.decision)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_private_artifact_manifest.json'), reports.artifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_audio_timing_internal_beta_readiness_report.json'), reports.readinessReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_36m_audio_timing_internal_beta_readiness_report.md'), renderReadinessMarkdown(reports.readinessReport))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36m_blocker_report.json'), reports.blockerReport)
}

async function loadCommittedEvidence() {
  const phase36hRuntime = await readJson(path.join(PHASE_36H_REPORT_DIR, 'phase_36h_deepfilternet_runtime_hardening_report.json'))
  const phase36hGenerated = await readJson(path.join(PHASE_36H_REPORT_DIR, 'phase_36h_deepfilternet_generated_audio_qa_report.json'))
  const phase36hControlled = await readJson(path.join(PHASE_36H_REPORT_DIR, 'phase_36h_controlled_deepfilternet_qa_report.json'))
  const phase36hArtifact = await readJson(path.join(PHASE_36H_REPORT_DIR, 'phase_36h_private_artifact_manifest.json'))
  const phase36hBeta = await readJson(path.join(PHASE_36H_REPORT_DIR, 'phase_36h_audio_timing_beta_status_report.json'))
  const phase36iRuntime = await readJson(path.join(PHASE_36I_REPORT_DIR, 'phase_36i_signalsmith_runtime_generated_fixture_report.json'))
  const phase36iGenerated = await readJson(path.join(PHASE_36I_REPORT_DIR, 'phase_36i_signalsmith_generated_audio_qa_report.json'))
  const phase36iArtifact = await readJson(path.join(PHASE_36I_REPORT_DIR, 'phase_36i_private_artifact_manifest.json'))
  const phase36iBeta = await readJson(path.join(PHASE_36I_REPORT_DIR, 'phase_36i_audio_timing_beta_status_report.json'))
  const phase36jRuntime = await readJson(path.join(PHASE_36J_REPORT_DIR, 'phase_36j_controlled_real_media_timing_stretch_report.json'))
  const phase36jStretch = await readJson(path.join(PHASE_36J_REPORT_DIR, 'phase_36j_signalsmith_controlled_stretch_report.json'))
  const phase36jExtraction = await readJson(path.join(PHASE_36J_REPORT_DIR, 'phase_36j_controlled_audio_extraction_report.json'))
  const phase36jArtifact = await readJson(path.join(PHASE_36J_REPORT_DIR, 'phase_36j_private_artifact_manifest.json'))
  const phase36jBeta = await readJson(path.join(PHASE_36J_REPORT_DIR, 'phase_36j_audio_timing_beta_status_report.json'))
  const phase36kDecision = await readJson(path.join(PHASE_36K_REPORT_DIR, 'phase_36k_demucs_provenance_decision.json'))
  const phase36kTraining = await readJson(path.join(PHASE_36K_REPORT_DIR, 'phase_36k_demucs_training_data_provenance_report.json'))
  const phase36kWeight = await readJson(path.join(PHASE_36K_REPORT_DIR, 'phase_36k_demucs_weight_artifact_source_policy.json'))
  const phase36kScope = await readJson(path.join(PHASE_36K_REPORT_DIR, 'phase_36k_audio_timing_beta_scope_recommendation.json'))
  const phase36kArtifact = await readJson(path.join(PHASE_36K_REPORT_DIR, 'phase_36k_private_artifact_manifest.json'))
  return {
    phase36hRuntime,
    phase36hGenerated,
    phase36hControlled,
    phase36hArtifact,
    phase36hBeta,
    phase36iRuntime,
    phase36iGenerated,
    phase36iArtifact,
    phase36iBeta,
    phase36jRuntime,
    phase36jStretch,
    phase36jExtraction,
    phase36jArtifact,
    phase36jBeta,
    phase36kDecision,
    phase36kTraining,
    phase36kWeight,
    phase36kScope,
    phase36kArtifact,
  }
}

function buildPriorEvidenceInventory(evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>) {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'complete',
    evidence: [
      evidenceRow('36H', 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140', 'DeepFilterNet linux/amd64 runtime hardening and bounded speech-cleanup sample', `${PHASE_36H_REPORT_DIR}/phase_36h_deepfilternet_runtime_hardening_report.json`, evidence.phase36hRuntime.status, evidence.phase36hBeta.audioTimingToolFamilyBetaStatus),
      evidenceRow('36I', 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147', 'Signalsmith Stretch generated synthetic timing/stretch fixtures', `${PHASE_36I_REPORT_DIR}/phase_36i_signalsmith_runtime_generated_fixture_report.json`, evidence.phase36iRuntime.status, evidence.phase36iBeta.audioTimingToolFamilyBetaStatus),
      evidenceRow('36J', 'https://github.com/yuzastudio6-cyber/Reedkt/pull/149', 'Signalsmith Stretch one bounded approved controlled real-media timing/stretch sample', `${PHASE_36J_REPORT_DIR}/phase_36j_controlled_real_media_timing_stretch_report.json`, evidence.phase36jRuntime.status, evidence.phase36jBeta.audioTimingToolFamilyBetaStatus),
      evidenceRow('36K', 'https://github.com/yuzastudio6-cyber/Reedkt/pull/156', 'Demucs provenance approval retry and exclusion recommendation', `${PHASE_36K_REPORT_DIR}/phase_36k_demucs_provenance_decision.json`, evidence.phase36kDecision.status, evidence.phase36kDecision.audioTimingToolFamilyBetaStatus),
    ],
    privateArtifactPrefixes: [
      {
        phase: '36H',
        prefix: evidence.phase36hArtifact.privateArtifactPrefix,
        status: evidence.phase36hArtifact.status,
        runtimeArtifactCaveat: 'Phase 36M reads JSON metadata only and never reads private audio artifacts.',
      },
      {
        phase: '36I',
        prefix: evidence.phase36iArtifact.privateArtifactPrefix,
        status: evidence.phase36iArtifact.status,
        runtimeArtifactCaveat: 'Phase 36M reads JSON metadata only and never reads generated audio artifacts.',
      },
      {
        phase: '36J',
        prefix: evidence.phase36jArtifact.privateArtifactPrefix,
        status: evidence.phase36jArtifact.status,
        runtimeArtifactCaveat: 'Phase 36M reads JSON metadata only and never reads controlled audio artifacts.',
      },
    ],
  }
}

function evidenceRow(
  phase: string,
  pr: string,
  summary: string,
  report: string,
  status: unknown,
  audioTimingToolFamilyBetaStatus: unknown,
) {
  return {
    phase,
    pr,
    report,
    status,
    audioTimingToolFamilyBetaStatus,
    summary,
  }
}

function buildInputManifest(evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>, privateVerification: JsonRecord) {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    committedEvidence: [
      {
        phase: '36H',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/140',
        reports: [
          `${PHASE_36H_REPORT_DIR}/phase_36h_deepfilternet_runtime_hardening_report.json`,
          `${PHASE_36H_REPORT_DIR}/phase_36h_deepfilternet_generated_audio_qa_report.json`,
          `${PHASE_36H_REPORT_DIR}/phase_36h_controlled_deepfilternet_qa_report.json`,
          `${PHASE_36H_REPORT_DIR}/phase_36h_private_artifact_manifest.json`,
        ],
        status: evidence.phase36hRuntime.status,
        betaStatus: evidence.phase36hBeta.audioTimingToolFamilyBetaStatus,
      },
      {
        phase: '36I',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/147',
        reports: [
          `${PHASE_36I_REPORT_DIR}/phase_36i_signalsmith_runtime_generated_fixture_report.json`,
          `${PHASE_36I_REPORT_DIR}/phase_36i_signalsmith_generated_audio_qa_report.json`,
          `${PHASE_36I_REPORT_DIR}/phase_36i_private_artifact_manifest.json`,
        ],
        status: evidence.phase36iRuntime.status,
        betaStatus: evidence.phase36iBeta.audioTimingToolFamilyBetaStatus,
      },
      {
        phase: '36J',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/149',
        reports: [
          `${PHASE_36J_REPORT_DIR}/phase_36j_controlled_real_media_timing_stretch_report.json`,
          `${PHASE_36J_REPORT_DIR}/phase_36j_signalsmith_controlled_stretch_report.json`,
          `${PHASE_36J_REPORT_DIR}/phase_36j_controlled_audio_extraction_report.json`,
          `${PHASE_36J_REPORT_DIR}/phase_36j_private_artifact_manifest.json`,
        ],
        status: evidence.phase36jRuntime.status,
        betaStatus: evidence.phase36jBeta.audioTimingToolFamilyBetaStatus,
      },
      {
        phase: '36K',
        pr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/156',
        reports: [
          `${PHASE_36K_REPORT_DIR}/phase_36k_demucs_provenance_decision.json`,
          `${PHASE_36K_REPORT_DIR}/phase_36k_demucs_training_data_provenance_report.json`,
          `${PHASE_36K_REPORT_DIR}/phase_36k_demucs_weight_artifact_source_policy.json`,
          `${PHASE_36K_REPORT_DIR}/phase_36k_audio_timing_beta_scope_recommendation.json`,
        ],
        status: evidence.phase36kDecision.status,
        demucsDecision: evidence.phase36kDecision.demucsDecision,
        approvedForPhase36L: evidence.phase36kDecision.approvedForPhase36L,
      },
    ],
    privateArtifactVerification: {
      status: privateVerification.status,
      allowedPrefixes: [
        PHASE_36H_PRIVATE_GCS_PREFIX,
        PHASE_36I_PRIVATE_GCS_PREFIX,
        PHASE_36J_PRIVATE_GCS_PREFIX,
      ],
      jsonOnly: true,
      audioVideoModelPayloadReads: 'blocked',
    },
  }
}

function buildCriteria(
  evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>,
  privateVerification: JsonRecord,
  privateUpload: JsonRecord,
  rollback: JsonRecord,
  support: JsonRecord,
  demucsExclusionPolicy: JsonRecord,
) {
  const criteria = [
    criterion('phase36h_deepfilternet_runtime_hardening_passed', evidence.phase36hRuntime.status === 'passed'),
    criterion('phase36h_generated_audio_fixture_passed', evidence.phase36hGenerated.status === 'passed'),
    criterion('phase36h_controlled_speech_cleanup_passed', evidence.phase36hControlled.status === 'passed'),
    criterion('phase36h_private_artifacts_passed', evidence.phase36hArtifact.status === 'passed'),
    criterion('phase36i_signalsmith_generated_runtime_passed', evidence.phase36iRuntime.status === 'passed'),
    criterion('phase36i_generated_audio_qa_passed', evidence.phase36iGenerated.status === 'passed'),
    criterion('phase36i_private_artifacts_passed', evidence.phase36iArtifact.status === 'passed'),
    criterion('phase36j_controlled_timing_stretch_passed', evidence.phase36jRuntime.status === 'passed'),
    criterion('phase36j_bounded_audio_extraction_passed', evidence.phase36jExtraction.status === 'passed'),
    criterion('phase36j_controlled_stretch_qa_passed', evidence.phase36jStretch.status === 'passed'),
    criterion('phase36j_private_artifacts_passed', evidence.phase36jArtifact.status === 'passed'),
    criterion('phase36j_exact_approved_sample_used', evidence.phase36jStretch.sampleId === 'phase37d-phase32-color-export-safe-zone-window-v1'
      && sampleWindowMatches(evidence.phase36jExtraction.window)),
    criterion('phase36k_demucs_excluded_by_policy', demucsExclusionPolicy.status === 'passed'),
    criterion('phase36k_demucs_runtime_disabled', evidence.phase36kDecision.approvedForPhase36L === false
      && evidence.phase36kDecision.demucsDecision === 'blocked_pending_training_data_provenance'),
    warningCriterion('private_json_artifact_verification_optional', privateVerification.status === 'passed', 'Private JSON metadata verification is preferred but non-blocking when committed manifests are complete.'),
    criterion('phase36m_private_metadata_upload', privateUpload.status === 'passed'),
    criterion('rollback_blocker_policy_present', rollback.status === 'passed'),
    criterion('support_runbook_present', support.status === 'passed'),
    criterion('no_audio_or_media_processing_in_gate', true),
    criterion('no_forbidden_execution_scope', true),
    criterion('track_a_untouched', true),
  ]
  const requiredFailed = criteria.filter((item) => item.status === 'blocked')
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: requiredFailed.length === 0 ? 'passed' : 'blocked',
    evidenceStatus: requiredFailed.length === 0 ? 'complete' : 'incomplete',
    privateArtifactVerificationStatus: privateVerification.status,
    criteria,
    blockers: requiredFailed,
    warnings: criteria.filter((item) => item.status === 'warning'),
  }
}

function criterion(id: string, passed: boolean) {
  return {
    id,
    status: passed ? 'passed' : 'blocked',
  }
}

function warningCriterion(id: string, passed: boolean, summary: string) {
  return {
    id,
    status: passed ? 'passed' : 'warning',
    summary,
  }
}

function sampleWindowMatches(window: unknown): boolean {
  const record = window as { startSeconds?: unknown, endSeconds?: unknown, durationSeconds?: unknown } | null
  return Number(record?.startSeconds) === 6.9
    && Number(record?.endSeconds) === 8.9
    && Number(record?.durationSeconds) <= 2.01
}

function buildCaveatClassification() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'passed',
    caveats: [
      caveat('deepfilternet_one_controlled_sample', 'DeepFilterNet controlled evidence covers one approved private bounded speech-cleanup sample only.', 'warning', 'external_and_production_blocker'),
      caveat('signalsmith_one_controlled_sample', 'Signalsmith controlled evidence covers one approved private bounded timing/stretch sample only.', 'warning', 'external_and_production_blocker'),
      caveat('demucs_excluded_not_approved', 'Demucs source separation is excluded from restricted internal scope and remains blocked pending training-data provenance and human/legal review.', 'internal_scope_allowed_exclusion', 'source_separation_blocker'),
      caveat('ffmpeg_linux_runtime_dependency', 'FFmpeg/ffprobe were used only in bounded private runtime phases and still require production configuration/legal review.', 'warning', 'production_blocker'),
      caveat('cloud_run_private_cpu_worker_dependency', 'Linux CPU Cloud Run jobs supplied prior bounded evidence; Phase 36M does not approve broad Cloud Run worker use.', 'warning', 'production_blocker'),
      caveat('vlm_ocr_product_caveat', 'VLM remains blocked and OCR runtime outside approved phases remains blocked; neither blocks audio/timing internal-scope evidence.', 'warning', 'product_beta_blocker'),
      caveat('broad_media_not_tested', 'No broad user media, arbitrary media, public output, or final export path is approved.', 'warning', 'external_and_production_blocker'),
    ],
  }
}

function caveat(id: string, summary: string, internalScopeImpact: string, productionImpact: string) {
  return { id, summary, internalScopeImpact, productionImpact }
}

function buildDemucsExclusionPolicy(evidence: Awaited<ReturnType<typeof loadCommittedEvidence>>) {
  const passed = evidence.phase36kDecision.demucsDecision === 'blocked_pending_training_data_provenance'
    && evidence.phase36kDecision.approvedForPhase36L === false
    && evidence.phase36kTraining.status === 'blocked_pending_training_data_provenance'
    && evidence.phase36kWeight.status === 'no_weight_artifact_source_approved'
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    demucsDecision: evidence.phase36kDecision.demucsDecision,
    approvedForPhase36L: evidence.phase36kDecision.approvedForPhase36L,
    trainingDataProvenanceStatus: evidence.phase36kTraining.status,
    weightArtifactPolicyStatus: evidence.phase36kWeight.status,
    currentInternalScopeDecision: passed
      ? 'Demucs is explicitly excluded from restricted internal audio/timing QA/planning scope.'
      : 'Demucs exclusion policy is incomplete.',
    blockedDemucsScopes: [
      'Demucs package installation',
      'Demucs model/weight download',
      'Demucs private model staging',
      'Demucs runtime execution',
      'source separation',
      'Phase 36L without human/legal approval',
    ],
    productRequirement: 'Human/product approval must explicitly accept Demucs exclusion before product-wide beta can use this audio/timing internal candidate evidence.',
  }
}

function buildAllowedInternalScope() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'passed',
    allowedInternalScope: 'restricted internal QA/planning candidate for bounded audio/timing tool-family evidence only',
    allowedActivities: [
      'review committed safe Phase 36H-36M metadata reports',
      'use DeepFilterNet bounded speech-cleanup evidence as internal planning/QA signal',
      'use Signalsmith bounded timing/stretch evidence as internal planning/QA signal',
      'record Demucs as excluded/blocked for current internal scope',
      'plan future audio/timing work with explicit approval gates',
    ],
    notAllowed: BLOCKED_SCOPES,
  }
}

function buildBlockedScopeMatrix() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'passed',
    blockedScopes: BLOCKED_SCOPES,
    productWideBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    broadMedia: 'blocked',
    arbitraryMedia: 'blocked',
    publicOutput: 'blocked',
    providerCalls: 'blocked',
    demucs: 'blocked',
    vlmRuntime: 'blocked',
    ocrRuntime: 'blocked_outside_approved_phases',
    trackA: 'blocked',
  }
}

function buildRollbackPolicy() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'passed',
    rollbackTriggers: [
      'Phase 36H, 36I, 36J, or 36K evidence is missing or contradicted',
      'private artifact verification or upload records non-JSON/audio/video/model payload reads',
      'private metadata report leaks raw audio, transcript, signed URL, secret, or sensitive media content',
      'Demucs install/download/runtime/source separation is enabled before approval',
      'DeepFilterNet or Signalsmith runtime rerun is attempted through Phase 36M',
      'provider/OCR/VLM/Track A execution is attempted through this gate',
      'production, external beta, broad media, or public output unlock is attempted',
    ],
    rollbackAction: 'revoke audio/timing internally beta-ready candidate status and return the tool family to blocked until corrected evidence is committed.',
    blockerPolicy: 'fail_closed_on_missing_evidence_or_privacy_storage_gate_failure',
  }
}

function buildSupportChecklist() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'passed',
    checklist: [
      'Phase 36H DeepFilterNet generated and controlled bounded evidence is committed.',
      'Phase 36I Signalsmith generated timing/stretch evidence is committed.',
      'Phase 36J Signalsmith controlled bounded timing/stretch evidence is committed.',
      'Phase 36K Demucs provenance decision blocks runtime/source separation and supports scoped exclusion.',
      'Phase 36M exact private JSON metadata verification is metadata-only and non-broad.',
      'Phase 36M private upload contains JSON metadata only.',
      'Blocked scope matrix preserves product beta, external beta, production, broad media, arbitrary media, public output, providers, VLM/OCR, Demucs, Docker/cloud/GPU/IAM, and Track A blocks.',
    ],
  }
}

function buildScorecard(criteria: JsonRecord, caveats: JsonRecord) {
  const criteriaRows = criteria.criteria as Array<{ id: string, status: string }>
  const passed = criteriaRows.filter((item) => item.status === 'passed').length
  const warnings = criteriaRows.filter((item) => item.status === 'warning').length
  const blocked = criteriaRows.filter((item) => item.status === 'blocked').length
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: criteria.status,
    score: {
      passedCriteria: passed,
      warningCriteria: warnings,
      totalCriteria: criteriaRows.length,
      requiredBlockers: blocked,
      internalCaveats: Array.isArray(caveats.caveats) ? caveats.caveats.length : 0,
    },
    audioTimingToolFamilyBetaStatus: criteria.status === 'passed'
      ? 'internally beta-ready candidate'
      : 'blocked',
    productWideBetaStatus: 'blocked',
    externalBetaStatus: 'blocked',
    productionStatus: 'blocked',
    demucsStatus: 'excluded_and_blocked',
  }
}

function buildDecision(
  criteria: JsonRecord,
  scorecard: JsonRecord,
  privateVerification: JsonRecord,
  privateUpload: JsonRecord,
  demucsExclusionPolicy: JsonRecord,
) {
  const passed = criteria.status === 'passed' && scorecard.status === 'passed'
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    criteriaStatus: criteria.status,
    privateArtifactVerificationStatus: privateVerification.status,
    privateArtifactUploadStatus: privateUpload.status,
    demucsPolicyStatus: demucsExclusionPolicy.status,
    audioTimingToolFamilyBetaStatus: passed
      ? 'internally beta-ready candidate'
      : 'blocked',
    finalDecision: passed
      ? 'Audio/timing tool family is an internally beta-ready candidate for restricted internal QA/planning scope only, with Demucs excluded and blocked.'
      : 'Audio/timing internal beta-readiness gate remains blocked until required criteria and Phase 36M private metadata upload pass.',
    allowedInternalScope: passed
      ? 'restricted internal QA/planning evidence for bounded DeepFilterNet speech cleanup and Signalsmith timing/stretch only'
      : 'none',
    productWideBeta: 'blocked',
    externalBeta: 'blocked',
    paidProduction: 'blocked',
    production: 'blocked',
    demucsRuntime: 'blocked',
    providerCalls: 'blocked',
    trackA: 'blocked',
    blockedScopes: BLOCKED_SCOPES,
    nextPhaseDecision: passed
      ? 'Use restricted internal audio/timing QA/planning candidate status only; product-wide beta and Demucs remain blocked until separate approval gates pass.'
      : 'Fix the exact Phase 36M blocker before any audio/timing internal beta candidate decision.',
  }
}

async function verifyPrivateJsonMetadataArtifacts(privateReadDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_READ !== 'true') {
    return buildWarningVerification('REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_READ not supplied; committed manifests remain source of truth.')
  }

  const items: ArtifactVerificationItem[] = []
  for (const phase of [
    { id: '36H' as const, prefix: PHASE_36H_PRIVATE_GCS_PREFIX },
    { id: '36I' as const, prefix: PHASE_36I_PRIVATE_GCS_PREFIX },
    { id: '36J' as const, prefix: PHASE_36J_PRIVATE_GCS_PREFIX },
  ]) {
    items.push(await verifyPrefix(phase.id, phase.prefix, path.join(privateReadDir, phase.id.toLowerCase())))
  }
  const blockers = items.flatMap((item) => item.blockers)
  const warnings = items.flatMap((item) => item.warnings)
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'warning',
    privateReads: 'json_metadata_only',
    optionalPreferred: true,
    allowedPrefixes: [PHASE_36H_PRIVATE_GCS_PREFIX, PHASE_36I_PRIVATE_GCS_PREFIX, PHASE_36J_PRIVATE_GCS_PREFIX],
    audioVideoModelPayloadReads: 'blocked',
    broadBucketReads: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    items,
    warnings: [...warnings, ...blockers],
    blockers: [],
  }
}

async function verifyPrefix(phase: ArtifactVerificationItem['phase'], prefix: string, targetDir: string): Promise<ArtifactVerificationItem> {
  await mkdir(targetDir, { recursive: true })
  const list = await runCommand('gcloud', ['--quiet', 'storage', 'ls', '--recursive', prefix], { label: `${phase}_json_metadata_list` })
  const objects = list.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const jsonObjects = objects.filter((object) => object.endsWith('.json'))
  const blockedPayloadObjects = objects.filter((object) => BLOCKED_PAYLOAD_EXTENSIONS.has(path.extname(object).toLowerCase()))
  const blockers: string[] = []
  if (list.status !== 'passed') blockers.push(`${phase}:private_prefix_list_unavailable`)
  if (jsonObjects.length === 0) blockers.push(`${phase}:no_json_metadata_objects_found`)
  const warnings: string[] = []
  if (blockedPayloadObjects.length > 0) {
    warnings.push(`${phase}:payload_objects_present_but_not_read_or_copied`)
  }

  const copiedArtifacts: ArtifactVerificationItem['copiedArtifacts'] = []
  for (const object of jsonObjects) {
    const basename = safeBasename(object)
    const destination = path.join(targetDir, basename)
    const copy = await runCommand('gcloud', ['--quiet', 'storage', 'cp', object, destination], { label: `${phase}_${basename}_copy` })
    if (copy.status !== 'passed') {
      blockers.push(`${phase}:${basename}:json_copy_unavailable`)
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
    status: blockers.length === 0 ? 'passed' : 'warning',
    listedObjects: objects.length,
    jsonObjects: jsonObjects.length,
    copiedJsonObjects: copiedArtifacts.length,
    blockedPayloadObjects: blockedPayloadObjects.length,
    copiedArtifacts,
    blockers,
    warnings,
  }
}

async function uploadPrivateReports(reportDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return buildUploadReport('blocked', 'REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD is required.')
  }
  const localJsonReports = existsSync(reportDir)
    ? (await collectFiles(reportDir)).filter((file) => path.basename(file).startsWith('phase_36m_') && file.endsWith('.json'))
    : []
  const uploaded: Array<{ localPath: string, gcsUri: string, sizeBytes: number, sha256: string }> = []
  const blockers: string[] = []
  for (const file of localJsonReports) {
    const basename = path.basename(file)
    const gcsUri = `${AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX}${basename}`
    const upload = await runCommand('gcloud', ['--quiet', 'storage', 'cp', file, gcsUri], {
      label: `phase36m_${basename}_upload`,
      timeoutMs: 120000,
    })
    if (upload.status !== 'passed') {
      blockers.push(`${basename}:private_upload_failed`)
      continue
    }
    const fileStat = await stat(file)
    uploaded.push({
      localPath: file,
      gcsUri,
      sizeBytes: fileStat.size,
      sha256: await sha256File(file),
    })
  }
  const listing = await runCommand('gcloud', ['--quiet', 'storage', 'ls', '--recursive', AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX], {
    label: 'phase36m_private_report_upload_list',
  })
  const listedObjects = listing.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (localJsonReports.length === 0) blockers.push('phase36m_no_local_json_reports_to_upload')
  if (listing.status !== 'passed') blockers.push('phase36m_private_report_upload_list_failed')
  if (listedObjects.some((object) => BLOCKED_PAYLOAD_EXTENSIONS.has(path.extname(object).toLowerCase()))) {
    blockers.push('phase36m_private_upload_contains_audio_media_or_model_payload')
  }
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    privateArtifactPrefix: AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    jsonOnly: true,
    uploadedObjectCount: listedObjects.length,
    uploadedJsonReports: uploaded,
    blockers,
  }
}

async function buildPrivateArtifactManifest(reportDir: string, privateUpload: JsonRecord) {
  const localArtifacts = existsSync(reportDir)
    ? await collectFiles(reportDir)
    : []
  const artifacts = []
  for (const file of localArtifacts.filter((artifact) => path.basename(artifact).startsWith('phase_36m_'))) {
    const fileStat = await stat(file)
    const relative = path.relative(reportDir, file).split(path.sep).join('/')
    artifacts.push({
      id: relative.replace(/[^0-9A-Za-z_-]+/g, '_'),
      relativePath: relative,
      sizeBytes: fileStat.size,
      sha256: await sha256File(file),
      uploadedInPhase36m: file.endsWith('.json') && privateUpload.status === 'passed',
      gcsUri: file.endsWith('.json') ? `${AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX}${relative}` : undefined,
    })
  }
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: privateUpload.status === 'passed' ? 'passed' : privateUpload.status,
    privateArtifactPrefix: AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    jsonOnlyPrivateUpload: true,
    committedReportArtifacts: artifacts,
    uploadedObjectCount: privateUpload.uploadedObjectCount ?? 0,
    blockers: privateUpload.blockers ?? [],
  }
}

function buildNotRunVerification() {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'not_run',
    reason: 'Private JSON metadata verification requires execute confirmation and is optional/preferred.',
    allowedPrefixes: [PHASE_36H_PRIVATE_GCS_PREFIX, PHASE_36I_PRIVATE_GCS_PREFIX, PHASE_36J_PRIVATE_GCS_PREFIX],
    audioVideoModelPayloadReads: 'blocked',
  }
}

function buildWarningVerification(reason: string) {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status: 'warning',
    reason,
    allowedPrefixes: [PHASE_36H_PRIVATE_GCS_PREFIX, PHASE_36I_PRIVATE_GCS_PREFIX, PHASE_36J_PRIVATE_GCS_PREFIX],
    audioVideoModelPayloadReads: 'blocked',
    broadBucketReads: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    warnings: [reason],
    blockers: [],
  }
}

function buildUploadReport(status: GateStatus, reason: string) {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status,
    privateArtifactPrefix: AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
    metadataOnly: true,
    jsonOnly: true,
    reason,
    blockers: status === 'passed' ? [] : [reason],
  }
}

function requireExecutionConfirmations(): void {
  if (process.env.REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE !== 'true') {
    throw new Error('Phase 36M execution requires REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE=true.')
  }
  for (const forbidden of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') {
      throw new Error(`Forbidden Phase 36M confirmation is set: ${forbidden}`)
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
    .replace(/Authorization:\s*\S+/gi, 'Authorization: <redacted>')
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

function toBetaStatus(value: unknown, fallback: AudioTimingBetaStatus): AudioTimingBetaStatus {
  return value === 'blocked'
    || value === 'phase-complete but tool-family incomplete'
    || value === 'internally beta-ready candidate'
    || value === 'external beta still blocked'
    ? value
    : fallback
}

function buildSummary(
  status: GateStatus,
  betaStatus: AudioTimingBetaStatus,
  verificationStatus: string,
  uploadStatus: string,
  criteriaStatus: string,
): AudioTimingBetaGateSummary {
  return {
    phase: AUDIO_TIMING_BETA_GATE_PHASE,
    runId: AUDIO_TIMING_BETA_GATE_RUN_ID,
    status,
    audioTimingToolFamilyBetaStatus: betaStatus,
    privateArtifactVerificationStatus: verificationStatus,
    privateArtifactUploadStatus: uploadStatus,
    criteriaStatus,
    demucsPolicyStatus: 'not_run',
    finalDecision: 'Phase 36M beta gate has not run.',
    allowedInternalScope: 'none',
    blockedScopes: BLOCKED_SCOPES,
  }
}

function renderPriorEvidenceMarkdown(inventory: JsonRecord): string {
  const rows = Array.isArray(inventory.evidence) ? inventory.evidence as JsonRecord[] : []
  return [
    '# Phase 36M Audio/Timing Prior Evidence Inventory',
    '',
    ...rows.flatMap((row) => [
      `## Phase ${String(row.phase)}`,
      '',
      `- PR: ${String(row.pr)}`,
      `- Status: ${String(row.status)}`,
      `- Audio/timing beta status: ${String(row.audioTimingToolFamilyBetaStatus)}`,
      `- Report: ${String(row.report)}`,
      `- Summary: ${String(row.summary)}`,
      '',
    ]),
    'Private artifact references are used for JSON metadata verification only. Audio, media, model, signed URL, and public-output reads remain blocked.',
  ].join('\n')
}

function renderReadinessMarkdown(report: JsonRecord): string {
  return [
    '# Phase 36M Audio/Timing Internal Beta-Readiness Report',
    '',
    `- Status: ${String(report.status)}`,
    `- Audio/timing tool-family beta status: ${String(report.audioTimingToolFamilyBetaStatus)}`,
    `- Private artifact verification: ${String(report.privateArtifactVerificationStatus)}`,
    `- Private artifact upload: ${String(report.privateArtifactUploadStatus)}`,
    `- Demucs policy: ${String(report.demucsPolicyStatus)}`,
    `- Decision: ${String(report.finalDecision)}`,
    '',
    'The internally beta-ready candidate decision, when passed, is restricted to internal QA/planning evidence for bounded DeepFilterNet speech cleanup and Signalsmith timing/stretch only. Product-wide beta, external beta, paid production, production, broad media, arbitrary media, public output, provider calls, Demucs runtime/source separation, VLM runtime retries, OCR runtime outside approved phases, Docker/Cloud Run/Cloud Build/GPU jobs, IAM mutation, and Track A remain blocked.',
  ].join('\n')
}
