import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, readdir, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const DEEPFILTERNET_RUNTIME_HARDENING_PHASE = '36H'
export const DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID = 'phase36h-deepfilternet-runtime-hardening-controlled-speech-20260603'
export const DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR = 'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports'
export const DEEPFILTERNET_RUNTIME_HARDENING_BRANCH = 'codex/rp-activation-36h-deepfilternet-runtime-hardening-controlled-speech'
export const DEEPFILTERNET_RUNTIME_HARDENING_BASE_BRANCH = 'codex/rp-activation-46e-media-data-internal-beta-readiness-gate'
export const DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_OBJECT_PREFIX = `activation/phase36h/deepfilternet-controlled-speech/${DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID}`
export const DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX = `gs://${DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_BUCKET}/${DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_OBJECT_PREFIX}/`

const PHASE_36G_REPORT = 'docs/activation-phase-36g-audio-stack-demucs-results.md'
const PHASE_36C_REPORT = 'docs/activation-phase-36c-deepfilternet-runtime-verification-results.md'
const PHASE_36D_REPORT = 'docs/activation-phase-36d-real-video-deepfilternet-audio-cleanup-results.md'
const PHASE_46C_SAMPLE_REPORT = 'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_controlled_sample_evidence.json'
const WORKER_PATH = 'server/workers/deepfilternet-runtime-hardening/run_deepfilternet_runtime_hardening.py'

const DEEPFILTERNET_ARTIFACT_PREFIX = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/'
const DEEPFILTERNET_CLI_FILE = 'deep-filter-0.5.6-x86_64-unknown-linux-musl'
const DEEPFILTERNET_MODEL_ARCHIVE = 'DeepFilterNet3_onnx.tar.gz'
const DEEPFILTERNET_CLI_SHA256 = '70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da'
const DEEPFILTERNET_MODEL_SHA256 = 'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'
const DEEPFILTERNET_AGGREGATE_SHA256 = 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b'

const CONTROLLED_SAMPLE = {
  sampleId: 'phase37d-phase32-color-export-safe-zone-window-v1',
  chainId: 'controlled-real-video-chain-phase28-through-phase32-v1',
  sourceGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4',
  sourceSha256: '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa',
  windowStartSeconds: 6.9,
  windowEndSeconds: 8.9,
  maxDurationSeconds: 2.0,
}

type PhaseStatus = 'passed' | 'blocked' | 'warning' | 'not_run' | 'skipped'
type AudioTimingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'
type JsonRecord = Record<string, unknown>

interface DeepFilterNetRuntimeHardeningSummary {
  phase: typeof DEEPFILTERNET_RUNTIME_HARDENING_PHASE
  runId: string
  status: PhaseStatus
  audioTimingToolFamilyBetaStatus: AudioTimingBetaStatus
  sourceEvidenceStatus: string
  licenseEvidenceStatus: string
  runtimeEvidenceStatus: string
  phase36gEvidenceStatus: string
  runtimePreflightStatus: string
  generatedFixtureStatus: string
  controlledExtractionStatus: string
  controlledEnhancementStatus: string
  privateArtifactStatus: string
  nextPhaseDecision: string
}

export const DEEPFILTERNET_RUNTIME_HARDENING_EXPECTED_REPORT_FILES = [
  'phase_36h_deepfilternet_runtime_plan.json',
  'phase_36h_deepfilternet_source_evidence.json',
  'phase_36h_deepfilternet_license_evidence.json',
  'phase_36h_deepfilternet_runtime_evidence.json',
  'phase_36h_deepfilternet_dependency_risk_report.json',
  'phase_36h_deepfilternet_runtime_preflight.json',
  'phase_36h_deepfilternet_generated_audio_fixture_manifest.json',
  'phase_36h_deepfilternet_generated_audio_qa_report.json',
  'phase_36h_controlled_audio_sample_evidence.json',
  'phase_36h_controlled_audio_plan.json',
  'phase_36h_controlled_audio_extraction_report.json',
  'phase_36h_controlled_deepfilternet_qa_report.json',
  'phase_36h_audio_metrics_report.json',
  'phase_36h_private_artifact_manifest.json',
  'phase_36h_deepfilternet_runtime_hardening_report.json',
  'phase_36h_audio_timing_beta_status_report.json',
  'phase_36h_blocker_report.json',
] as const

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]

const BLOCKED_SCOPES = [
  'Phase 36I Signalsmith Stretch until implemented',
  'Phase 36J controlled timing/stretch until Signalsmith generated evidence exists',
  'Demucs until provenance/legal approval',
  'Demucs download/runtime/source separation',
  'broad media',
  'arbitrary media paths',
  'unapproved real media',
  'full-video audio cleanup',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta unlock',
  'external beta',
  'paid production',
  'public output',
  'Docker/Cloud Build/Cloud Run unless separately approved',
  'GPU jobs',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

export function getDeepFilterNetRuntimeHardeningPlan() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    branch: DEEPFILTERNET_RUNTIME_HARDENING_BRANCH,
    baseIfPr138Open: DEEPFILTERNET_RUNTIME_HARDENING_BASE_BRANCH,
    sourcePhase36gPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/50',
    sourcePhase46ePr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/138',
    deepFilterNetSource: {
      github: 'https://github.com/Rikorose/DeepFilterNet',
      pypi: 'https://pypi.org/project/deepfilternet/',
    },
    approvedRuntimeArtifacts: {
      prefix: DEEPFILTERNET_ARTIFACT_PREFIX,
      cliFile: DEEPFILTERNET_CLI_FILE,
      modelArchive: DEEPFILTERNET_MODEL_ARCHIVE,
      cliSha256: DEEPFILTERNET_CLI_SHA256,
      modelArchiveSha256: DEEPFILTERNET_MODEL_SHA256,
      aggregateSha256: DEEPFILTERNET_AGGREGATE_SHA256,
      runtimePathPolicy: 'approved_private_binary_and_model_only',
    },
    controlledSample: CONTROLLED_SAMPLE,
    executionConfirmations: [
      'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
      'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    privateArtifactPrefix: DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    noArbitraryMedia: true,
    noBroadMedia: true,
    noDemucs: true,
    noSignalsmith: true,
    noVlm: true,
    noOcr: true,
    noTrackA: true,
    audioTimingToolFamilyBetaStatus: 'blocked' as AudioTimingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export async function writeDeepFilterNetRuntimeHardeningStaticArtifacts(reportDir = DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR): Promise<void> {
  const reports = await buildReports({
    mode: 'static',
    reportDir,
    preflight: buildNotRunPreflight(),
    workerResult: buildNotRunWorkerResult(),
    privateUpload: buildPrivateUploadReport('not_run', 'Execution confirmation not supplied.'),
  })
  await writeReports(reports, reportDir)
}

export async function readDeepFilterNetRuntimeHardeningSummary(reportDir = DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR): Promise<DeepFilterNetRuntimeHardeningSummary> {
  const reportPath = path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.json')
  if (!existsSync(reportPath)) return buildSummary('not_run', 'blocked')
  const report = await readJson(reportPath)
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: toStatus(report.status, 'not_run'),
    audioTimingToolFamilyBetaStatus: toBetaStatus(report.audioTimingToolFamilyBetaStatus, 'blocked'),
    sourceEvidenceStatus: String(report.sourceEvidenceStatus ?? 'unknown'),
    licenseEvidenceStatus: String(report.licenseEvidenceStatus ?? 'unknown'),
    runtimeEvidenceStatus: String(report.runtimeEvidenceStatus ?? 'unknown'),
    phase36gEvidenceStatus: String(report.phase36gEvidenceStatus ?? 'unknown'),
    runtimePreflightStatus: String(report.runtimePreflightStatus ?? 'unknown'),
    generatedFixtureStatus: String(report.generatedFixtureStatus ?? 'unknown'),
    controlledExtractionStatus: String(report.controlledExtractionStatus ?? 'unknown'),
    controlledEnhancementStatus: String(report.controlledEnhancementStatus ?? 'unknown'),
    privateArtifactStatus: String(report.privateArtifactStatus ?? 'unknown'),
    nextPhaseDecision: String(report.nextPhaseDecision ?? 'Run Phase 36H DeepFilterNet runtime hardening.'),
  }
}

export async function executeDeepFilterNetRuntimeHardening(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<DeepFilterNetRuntimeHardeningSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase36h-deepfilternet-runtime-hardening', DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID)
  const artifactDir = path.join(runtimeRoot, 'private-artifacts')
  const localArtifactDir = path.join(runtimeRoot, 'approved-deepfilternet-artifacts')
  await mkdir(artifactDir, { recursive: true })
  await mkdir(localArtifactDir, { recursive: true })

  const preflight = await runRuntimePreflight()
  let workerResult: JsonRecord = buildNotRunWorkerResult(preflight.blockers)

  if (preflight.status === 'passed') {
    const cliPath = path.join(localArtifactDir, DEEPFILTERNET_CLI_FILE)
    const modelPath = path.join(localArtifactDir, DEEPFILTERNET_MODEL_ARCHIVE)
    await copyGcsObject(`${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_CLI_FILE}`, cliPath)
    await copyGcsObject(`${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_MODEL_ARCHIVE}`, modelPath)
    await chmod(cliPath, 0o755)
    const cliSha256 = await sha256File(cliPath)
    const modelSha256 = await sha256File(modelPath)
    if (cliSha256 !== DEEPFILTERNET_CLI_SHA256) preflight.blockers.push('deepfilternet_cli_sha256_mismatch')
    if (modelSha256 !== DEEPFILTERNET_MODEL_SHA256) preflight.blockers.push('deepfilternet_model_archive_sha256_mismatch')

    if (preflight.blockers.length === 0) {
      const controlledVideoPath = path.join(runtimeRoot, 'controlled-source.mp4')
      await copyGcsObject(CONTROLLED_SAMPLE.sourceGcsUri, controlledVideoPath)
      const controlledSha256 = await sha256File(controlledVideoPath)
      if (controlledSha256 !== CONTROLLED_SAMPLE.sourceSha256) {
        preflight.blockers.push('controlled_sample_sha256_mismatch')
      } else {
        const workerInputPath = path.join(runtimeRoot, 'worker-input.json')
        await writeVlmRuntimeJsonArtifact(workerInputPath, {
          runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
          deepFilterBinaryPath: cliPath,
          deepFilterModelPath: modelPath,
          controlledVideoPath,
          outputDir: artifactDir,
          controlledSample: CONTROLLED_SAMPLE,
        })
        workerResult = await runWorker(workerInputPath, artifactDir)
      }
    }
  }

  const preliminaryReports = await buildReports({
    mode: 'execute',
    reportDir,
    preflight,
    workerResult,
    privateUpload: buildPrivateUploadReport('not_run', 'Upload runs after report generation.'),
  })
  await writeReports(preliminaryReports, reportDir)
  const privateUpload = await uploadPrivateArtifacts(reportDir, artifactDir)
  const finalReports = await buildReports({
    mode: 'execute',
    reportDir,
    preflight,
    workerResult,
    privateUpload,
  })
  await writeReports(finalReports, reportDir)
  if (privateUpload.status === 'passed') {
    await uploadPrivateArtifacts(reportDir, artifactDir)
  }

  return readDeepFilterNetRuntimeHardeningSummary(reportDir)
}

export function getDeepFilterNetRuntimeHardeningIamPlan() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'no_iam_mutation_allowed',
    privateArtifactPrefix: DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    requiredExistingAccess: [
      `${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_CLI_FILE}`,
      `${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_MODEL_ARCHIVE}`,
      CONTROLLED_SAMPLE.sourceGcsUri,
      DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    ],
    notes: [
      'Phase 36H does not mutate IAM.',
      'If private reads/uploads fail, report the exact blocker and keep Phase 36H incomplete.',
    ],
  }
}

export function getDeepFilterNetRuntimeHardeningCostSummary() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'local_bounded_runtime',
    estimatedCloudCostUsd: 0,
    costDrivers: [
      'private GCS read of two approved DeepFilterNet artifacts if preflight passes',
      'private GCS read of one approved controlled sample if generated fixture passes',
      'private GCS metadata/audio QA artifact upload if confirmed',
    ],
    noDocker: true,
    noCloudRun: true,
    noCloudBuild: true,
    noGpu: true,
    noProviderCalls: true,
  }
}

async function buildReports(input: {
  mode: 'static' | 'execute'
  reportDir: string
  preflight: JsonRecord
  workerResult: JsonRecord
  privateUpload: JsonRecord
}) {
  const sourceEvidence = buildSourceEvidence()
  const licenseEvidence = buildLicenseEvidence()
  const runtimeEvidence = buildRuntimeEvidence(input.preflight)
  const dependencyRisk = buildDependencyRisk(input.preflight)
  const phaseEvidence = await loadPhaseEvidence()
  const generatedManifest = buildGeneratedFixtureManifest(input.workerResult)
  const generatedQa = buildGeneratedQa(input.workerResult)
  const controlledSampleEvidence = buildControlledSampleEvidence(phaseEvidence)
  const controlledPlan = buildControlledPlan(input.workerResult)
  const extractionReport = buildControlledExtractionReport(input.workerResult)
  const controlledQa = buildControlledQa(input.workerResult)
  const audioMetrics = buildAudioMetricsReport(input.workerResult)
  const statusInputs = [
    sourceEvidence.status,
    licenseEvidence.status,
    runtimeEvidence.status,
    phaseEvidence.phase36gStatus,
    input.preflight.status,
    generatedQa.status,
    extractionReport.status,
    controlledQa.status,
    input.privateUpload.status,
  ]
  const passed = statusInputs.every((status) => status === 'passed')
  const blockers = uniqueStrings([
    ...collectBlockers(sourceEvidence),
    ...collectBlockers(licenseEvidence),
    ...collectBlockers(runtimeEvidence),
    ...collectBlockers(phaseEvidence),
    ...collectBlockers(input.preflight),
    ...collectBlockers(generatedQa),
    ...collectBlockers(extractionReport),
    ...collectBlockers(controlledQa),
    ...collectBlockers(input.privateUpload),
  ])
  const privateArtifactManifest = await buildPrivateArtifactManifest(input.reportDir, input.privateUpload)
  const hardeningReport = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: passed ? 'passed' : 'blocked',
    sourceEvidenceStatus: sourceEvidence.status,
    licenseEvidenceStatus: licenseEvidence.status,
    runtimeEvidenceStatus: runtimeEvidence.status,
    phase36gEvidenceStatus: phaseEvidence.phase36gStatus,
    runtimePreflightStatus: input.preflight.status,
    generatedFixtureStatus: generatedQa.status,
    controlledExtractionStatus: extractionReport.status,
    controlledEnhancementStatus: controlledQa.status,
    privateArtifactStatus: input.privateUpload.status,
    controlledSampleId: CONTROLLED_SAMPLE.sampleId,
    controlledAudioWindow: {
      startSeconds: CONTROLLED_SAMPLE.windowStartSeconds,
      endSeconds: CONTROLLED_SAMPLE.windowEndSeconds,
      durationSeconds: CONTROLLED_SAMPLE.maxDurationSeconds,
    },
    audioTimingToolFamilyBetaStatus: passed ? 'phase-complete but tool-family incomplete' : 'blocked',
    blockers,
    warnings: [
      'Phase 36H is bounded to generated audio and one approved private controlled sample only.',
      'Signalsmith Stretch remains blocked until Phase 36I.',
      'Demucs remains blocked pending provenance/legal approval.',
    ],
    nextPhaseDecision: passed
      ? 'Proceed to Phase 36I Signalsmith Stretch approval/runtime/generated fixture.'
      : 'Resolve the exact Phase 36H blocker before Phase 36I if DeepFilterNet hardening is required first.',
    blockedScopes: BLOCKED_SCOPES,
  }
  const betaStatus = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: hardeningReport.status,
    audioTimingToolFamilyBetaStatus: hardeningReport.audioTimingToolFamilyBetaStatus,
    internalBetaReady: false,
    externalBetaReady: false,
    productionReady: false,
    phase36IStatus: 'blocked_until_later_prompt',
    phase36JStatus: 'blocked_until_signalsmith_generated_evidence',
    demucsStatus: 'blocked_pending_provenance_legal_approval',
  }
  const blockerReport = {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: blockers.length === 0 ? 'passed_no_required_blockers' : 'blocked',
    blockers,
    blockedScopes: BLOCKED_SCOPES,
  }
  return {
    plan: getDeepFilterNetRuntimeHardeningPlan(),
    sourceEvidence,
    licenseEvidence,
    runtimeEvidence,
    dependencyRisk,
    runtimePreflight: input.preflight,
    generatedManifest,
    generatedQa,
    controlledSampleEvidence,
    controlledPlan,
    extractionReport,
    controlledQa,
    audioMetrics,
    privateArtifactManifest,
    hardeningReport,
    betaStatus,
    blockerReport,
  }
}

async function writeReports(reports: Awaited<ReturnType<typeof buildReports>>, reportDir: string): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_source_evidence.json'), reports.sourceEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_license_evidence.json'), reports.licenseEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_evidence.json'), reports.runtimeEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_dependency_risk_report.json'), reports.dependencyRisk)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_preflight.json'), reports.runtimePreflight)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_generated_audio_fixture_manifest.json'), reports.generatedManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_generated_audio_qa_report.json'), reports.generatedQa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_sample_evidence.json'), reports.controlledSampleEvidence)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_plan.json'), reports.controlledPlan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_audio_extraction_report.json'), reports.extractionReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_controlled_deepfilternet_qa_report.json'), reports.controlledQa)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_audio_metrics_report.json'), reports.audioMetrics)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.json'), reports.hardeningReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_audio_timing_beta_status_report.json'), reports.betaStatus)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_36h_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_36h_deepfilternet_runtime_hardening_report.md'), renderHardeningMarkdown(reports.hardeningReport))
}

async function loadPhaseEvidence() {
  const phase36g = existsSync(PHASE_36G_REPORT) ? await readFile(PHASE_36G_REPORT, 'utf8') : ''
  const phase36c = existsSync(PHASE_36C_REPORT) ? await readFile(PHASE_36C_REPORT, 'utf8') : ''
  const phase36d = existsSync(PHASE_36D_REPORT) ? await readFile(PHASE_36D_REPORT, 'utf8') : ''
  const phase46c = existsSync(PHASE_46C_SAMPLE_REPORT) ? await readJson(PHASE_46C_SAMPLE_REPORT) : null
  const blockers: string[] = []
  if (!phase36g.includes('DeepFilterNet remains active') || !phase36g.includes('Demucs') || !phase36g.includes('blocked')) blockers.push('phase36g_evidence_missing_or_ambiguous')
  if (!phase36c.includes('Phase 36C') || !phase36c.includes('DeepFilterNet') || !phase36c.includes('completed')) blockers.push('phase36c_generated_runtime_evidence_missing')
  if (!phase36d.includes('Phase 36D') || !phase36d.includes('real-video') || !phase36d.includes('completed')) blockers.push('phase36d_controlled_runtime_evidence_missing')
  if (!isRecord(phase46c) || getNestedString(phase46c, ['selectedSample', 'sampleId']) !== CONTROLLED_SAMPLE.sampleId) blockers.push('phase46c_controlled_sample_evidence_missing')
  return {
    status: blockers.length === 0 ? 'passed' : 'blocked',
    phase36gStatus: blockers.includes('phase36g_evidence_missing_or_ambiguous') ? 'blocked' : 'loaded',
    phase36cStatus: blockers.includes('phase36c_generated_runtime_evidence_missing') ? 'blocked' : 'loaded',
    phase36dStatus: blockers.includes('phase36d_controlled_runtime_evidence_missing') ? 'blocked' : 'loaded',
    phase46cSampleStatus: blockers.includes('phase46c_controlled_sample_evidence_missing') ? 'blocked' : 'loaded',
    sourceFiles: [PHASE_36G_REPORT, PHASE_36C_REPORT, PHASE_36D_REPORT, PHASE_46C_SAMPLE_REPORT],
    blockers,
  }
}

function buildSourceEvidence() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'passed',
    accessedAt: '2026-06-03',
    sources: [
      {
        url: 'https://github.com/Rikorose/DeepFilterNet',
        evidence: 'Official repository describes DeepFilterNet as a low-complexity full-band 48 kHz speech enhancement framework and documents the deep-filter binary path.',
      },
      {
        url: 'https://pypi.org/project/deepfilternet/',
        evidence: 'PyPI lists deepfilternet 0.5.6, released Aug 31 2023, Python >=3.8,<4.0, MIT metadata, source and wheel hashes.',
      },
    ],
    selectedRuntimePath: 'approved_private_v0.5.6_linux_x86_64_musl_cli_and_deepfilternet3_onnx_archive',
    blockers: [],
    warnings: ['PyPI package metadata is source evidence only for Phase 36H; runtime uses approved private Phase 36B artifacts.'],
  }
}

function buildLicenseEvidence() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'passed',
    licenseDecision: 'source_license_evidence_refreshed_not_production_legal_approval',
    repositoryLicenses: ['MIT', 'Apache-2.0'],
    pypiLicense: 'MIT',
    sourceUrls: [
      'https://github.com/Rikorose/DeepFilterNet',
      'https://github.com/Rikorose/DeepFilterNet/blob/main/LICENSE-MIT',
      'https://github.com/Rikorose/DeepFilterNet/blob/main/LICENSE-APACHE',
      'https://pypi.org/project/deepfilternet/',
    ],
    blockers: [],
    warnings: ['Production legal review remains separate from Phase 36H bounded internal evidence.'],
  }
}

function buildRuntimeEvidence(preflight: JsonRecord) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: preflight.status === 'passed' ? 'passed' : 'blocked',
    packageVersionEvidence: 'deepfilternet 0.5.6 on PyPI; runtime uses approved Phase 36B private binary/model artifacts.',
    approvedArtifacts: {
      prefix: DEEPFILTERNET_ARTIFACT_PREFIX,
      cliFile: DEEPFILTERNET_CLI_FILE,
      modelArchive: DEEPFILTERNET_MODEL_ARCHIVE,
      cliSha256: DEEPFILTERNET_CLI_SHA256,
      modelArchiveSha256: DEEPFILTERNET_MODEL_SHA256,
      aggregateSha256: DEEPFILTERNET_AGGREGATE_SHA256,
    },
    localRuntimePlatform: preflight.platform,
    localRuntimeArch: preflight.arch,
    binaryCompatibility: preflight.binaryCompatibility,
    noRuntimeAutoDownload: true,
    blockers: collectBlockers(preflight),
    warnings: ['The approved private CLI artifact is Linux x86_64 musl; non-Linux hosts block execution unless a separate approved runtime is used.'],
  }
}

function buildDependencyRisk(preflight: JsonRecord) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'warning',
    risks: [
      'Approved DeepFilterNet CLI artifact is Linux x86_64 musl; local host compatibility must be verified before execution.',
      'FFmpeg is required only for bounded controlled audio extraction.',
      'No Demucs source-separation dependency is allowed.',
      'No Signalsmith Stretch dependency is allowed.',
      'No PyPI DeepFilterNet runtime fallback is used in Phase 36H unless a later approved follow-up changes policy.',
    ],
    preflightSummary: {
      ffmpeg: preflight.ffmpegStatus,
      python: preflight.pythonStatus,
      gcloud: preflight.gcloudStatus,
    },
  }
}

async function runRuntimePreflight() {
  const platform = process.platform
  const arch = process.arch
  const binaryCompatible = platform === 'linux' && arch === 'x64'
  const [python, ffmpeg, gcloud, activeProject, cliObject, modelObject, controlledObject] = await Promise.all([
    runCommand('python3', ['--version']),
    runCommand('ffmpeg', ['-version']),
    runCommand('gcloud', ['--version']),
    runCommand('gcloud', ['--quiet', 'config', 'get-value', 'project']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', `${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_CLI_FILE}`, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', `${DEEPFILTERNET_ARTIFACT_PREFIX}${DEEPFILTERNET_MODEL_ARCHIVE}`, '--format=value(size)']),
    runCommand('gcloud', ['--quiet', 'storage', 'objects', 'describe', CONTROLLED_SAMPLE.sourceGcsUri, '--format=value(size)']),
  ])
  const blockers: string[] = []
  if (!binaryCompatible) blockers.push(`approved_deepfilternet_binary_platform_incompatible:${platform}_${arch}`)
  if (python.status !== 'passed') blockers.push('python_unavailable')
  if (ffmpeg.status !== 'passed') blockers.push('ffmpeg_unavailable_for_bounded_audio_extraction')
  if (gcloud.status !== 'passed') blockers.push('gcloud_unavailable')
  if (!activeProject.stdout.includes('reeditpro')) blockers.push('gcloud_project_not_reeditpro')
  if (cliObject.status !== 'passed' || Number(cliObject.stdout.trim()) <= 0) blockers.push('approved_deepfilternet_cli_private_object_unavailable')
  if (modelObject.status !== 'passed' || Number(modelObject.stdout.trim()) <= 0) blockers.push('approved_deepfilternet_model_private_object_unavailable')
  if (controlledObject.status !== 'passed' || Number(controlledObject.stdout.trim()) <= 0) blockers.push('approved_controlled_audio_sample_missing')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    platform,
    arch,
    binaryCompatibility: binaryCompatible ? 'passed' : 'blocked_linux_x64_required',
    pythonStatus: python.status,
    ffmpegStatus: ffmpeg.status,
    gcloudStatus: gcloud.status,
    artifactObjectStatus: cliObject.status === 'passed' && modelObject.status === 'passed' ? 'passed' : 'blocked',
    controlledObjectStatus: controlledObject.status,
    noRuntimeAutoDownload: true,
    blockers,
    warnings: ['Preflight does not process media.'],
  }
}

function buildNotRunPreflight() {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'not_run',
    blockers: ['runtime_preflight_not_run'],
    warnings: ['Run with --execute and required confirmations to perform preflight.'],
  }
}

function buildNotRunWorkerResult(blockers: string[] = []) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: 'not_run',
    generatedFixture: { status: 'not_run', blockers },
    controlledExtraction: { status: 'not_run', blockers },
    controlledEnhancement: { status: 'not_run', blockers },
    metrics: { status: 'not_run' },
    artifacts: [],
    blockers,
  }
}

function buildGeneratedFixtureManifest(workerResult: JsonRecord) {
  const generated = getRecord(workerResult, 'generatedFixture')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    fixtureId: 'phase36h-generated-noisy-speechlike-48khz-v1',
    generatedOnly: true,
    sampleRate: 48000,
    channels: 1,
    durationSeconds: 3,
    status: generated.status ?? 'not_run',
    artifacts: generated.artifacts ?? [],
    noRealVoice: true,
    noProviderCalls: true,
  }
}

function buildGeneratedQa(workerResult: JsonRecord) {
  const generated = getRecord(workerResult, 'generatedFixture')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: generated.status ?? 'blocked',
    metrics: generated.metrics ?? null,
    blockers: generated.blockers ?? collectBlockers(workerResult),
    gates: generated.gates ?? [],
  }
}

function buildControlledSampleEvidence(phaseEvidence: JsonRecord) {
  const blockers = collectBlockers(phaseEvidence).filter((blocker) => blocker.includes('phase46c'))
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    selectedSample: CONTROLLED_SAMPLE,
    sourceEvidence: [PHASE_46C_SAMPLE_REPORT, PHASE_36D_REPORT],
    privacyStatus: 'private_gcs_only',
    publicUrlStatus: 'blocked',
    signedUrlAsSourceOfTruth: 'blocked',
    blockers,
  }
}

function buildControlledPlan(workerResult: JsonRecord) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: collectBlockers(workerResult).length === 0 ? 'passed' : 'blocked',
    selectedSample: CONTROLLED_SAMPLE,
    maxDurationSeconds: CONTROLLED_SAMPLE.maxDurationSeconds,
    extractionPolicy: 'bounded_audio_window_only_48khz_mono_temp_wav',
    fullVideoCleanup: 'blocked',
    arbitraryMedia: 'blocked',
  }
}

function buildControlledExtractionReport(workerResult: JsonRecord) {
  const extraction = getRecord(workerResult, 'controlledExtraction')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: extraction.status ?? 'blocked',
    selectedSample: CONTROLLED_SAMPLE,
    extractionMetrics: extraction.metrics ?? null,
    blockers: extraction.blockers ?? collectBlockers(workerResult),
  }
}

function buildControlledQa(workerResult: JsonRecord) {
  const enhancement = getRecord(workerResult, 'controlledEnhancement')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: enhancement.status ?? 'blocked',
    metrics: enhancement.metrics ?? null,
    gates: enhancement.gates ?? [],
    blockers: enhancement.blockers ?? collectBlockers(workerResult),
    noRawAudioCommitted: true,
    noTranscriptCommitted: true,
  }
}

function buildAudioMetricsReport(workerResult: JsonRecord) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: workerResult.status ?? 'not_run',
    generatedMetrics: getRecord(workerResult, 'generatedFixture').metrics ?? null,
    controlledExtractionMetrics: getRecord(workerResult, 'controlledExtraction').metrics ?? null,
    controlledEnhancementMetrics: getRecord(workerResult, 'controlledEnhancement').metrics ?? null,
  }
}

async function runWorker(inputJson: string, artifactDir: string) {
  const python = process.env.REEDITPRO_PHASE36H_PYTHON ?? 'python3'
  const run = await runCommand(python, [WORKER_PATH, '--input-json', inputJson, '--output-dir', artifactDir], 20 * 60 * 1000)
  const resultPath = path.join(artifactDir, 'phase_36h_worker_result.json')
  if (run.status !== 'passed' || !existsSync(resultPath)) {
    return {
      ...buildNotRunWorkerResult([`deepfilternet_worker_failed:${run.stderrSummary || run.stdoutSummary}`]),
      status: 'blocked',
    }
  }
  return readJson(resultPath)
}

async function uploadPrivateArtifacts(reportDir: string, artifactDir: string) {
  if (process.env.REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return buildPrivateUploadReport('blocked', 'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD=true is required.')
  }
  const uploadReports = await runCommand('gcloud', ['--quiet', 'storage', 'cp', '--recursive', reportDir, `${DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX}reports/`], 120000)
  let uploadArtifacts = buildCommandResult('passed', '', '', 0)
  if (existsSync(artifactDir) && (await collectFiles(artifactDir)).length > 0) {
    uploadArtifacts = await runCommand('gcloud', ['--quiet', 'storage', 'cp', '--recursive', artifactDir, `${DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX}runtime-artifacts/`], 120000)
  }
  const listing = await runCommand('gcloud', ['--quiet', 'storage', 'ls', '--recursive', DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX])
  const objects = listing.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const blockers: string[] = []
  if (uploadReports.status !== 'passed') blockers.push('phase36h_private_report_upload_failed')
  if (uploadArtifacts.status !== 'passed') blockers.push('phase36h_private_runtime_artifact_upload_failed')
  if (listing.status !== 'passed') blockers.push('phase36h_private_artifact_listing_failed')
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    privateArtifactPrefix: DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    objectCount: objects.length,
    blockers,
  }
}

function buildPrivateUploadReport(status: PhaseStatus, reason: string) {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status,
    privateArtifactPrefix: DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    objectCount: 0,
    blockers: status === 'passed' ? [] : [reason],
    reason,
  }
}

async function buildPrivateArtifactManifest(reportDir: string, privateUpload: JsonRecord) {
  const artifacts = []
  if (existsSync(reportDir)) {
    for (const file of await collectFiles(reportDir)) {
      const relativePath = path.relative(reportDir, file).split(path.sep).join('/')
      const fileStat = await stat(file)
      artifacts.push({
        relativePath,
        sizeBytes: fileStat.size,
        sha256: await sha256File(file),
        gcsUri: `${DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX}reports/${relativePath}`,
      })
    }
  }
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status: privateUpload.status ?? 'not_run',
    privateArtifactPrefix: DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
    objectCount: privateUpload.objectCount ?? 0,
    committedSafeReportArtifacts: artifacts,
    rawAudioCommitted: false,
    controlledVideoCommitted: false,
    blockers: privateUpload.blockers ?? [],
  }
}

async function copyGcsObject(source: string, destination: string): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true })
  const result = await runCommand('gcloud', ['--quiet', 'storage', 'cp', source, destination], 120000)
  if (result.status !== 'passed') throw new Error(`Failed to copy ${source}: ${result.stderrSummary}`)
}

function requireExecutionConfirmations(): void {
  for (const required of [
    'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
    'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
  ]) {
    if (process.env[required] !== 'true') throw new Error(`${required}=true is required for Phase 36H execution.`)
  }
  for (const forbidden of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') throw new Error(`Forbidden Phase 36H confirmation is set: ${forbidden}`)
  }
}

async function runCommand(command: string, args: string[], timeoutMs = 60000) {
  const started = Date.now()
  try {
    const result = await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
    })
    return buildCommandResult('passed', result.stdout, result.stderr, Date.now() - started)
  } catch (error) {
    const err = error as { stdout?: string, stderr?: string, message?: string }
    return buildCommandResult('blocked', err.stdout ?? '', err.stderr ?? err.message ?? '', Date.now() - started)
  }
}

function buildCommandResult(status: PhaseStatus, stdout: string, stderr: string, durationMs: number) {
  return {
    status,
    stdout,
    stdoutSummary: stdout.split(/\r?\n/).filter(Boolean).slice(0, 5).join('\n'),
    stderrSummary: stderr.split(/\r?\n/).filter(Boolean).slice(0, 5).join('\n'),
    durationMs,
  }
}

function collectBlockers(value: unknown): string[] {
  if (!isRecord(value)) return []
  if (Array.isArray(value.blockers)) return value.blockers.map(String)
  return []
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

function getRecord(value: unknown, key: string): JsonRecord {
  if (!isRecord(value)) return {}
  const nested = value[key]
  return isRecord(nested) ? nested : {}
}

function getNestedString(value: unknown, keys: string[]): string | undefined {
  let current: unknown = value
  for (const key of keys) current = isRecord(current) ? current[key] : undefined
  return typeof current === 'string' ? current : undefined
}

async function readJson(filePath: string): Promise<JsonRecord> {
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function toStatus(value: unknown, fallback: PhaseStatus): PhaseStatus {
  return value === 'passed' || value === 'blocked' || value === 'warning' || value === 'not_run' || value === 'skipped'
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

function buildSummary(status: PhaseStatus, betaStatus: AudioTimingBetaStatus): DeepFilterNetRuntimeHardeningSummary {
  return {
    phase: DEEPFILTERNET_RUNTIME_HARDENING_PHASE,
    runId: DEEPFILTERNET_RUNTIME_HARDENING_RUN_ID,
    status,
    audioTimingToolFamilyBetaStatus: betaStatus,
    sourceEvidenceStatus: 'not_run',
    licenseEvidenceStatus: 'not_run',
    runtimeEvidenceStatus: 'not_run',
    phase36gEvidenceStatus: 'not_run',
    runtimePreflightStatus: 'not_run',
    generatedFixtureStatus: 'not_run',
    controlledExtractionStatus: 'not_run',
    controlledEnhancementStatus: 'not_run',
    privateArtifactStatus: 'not_run',
    nextPhaseDecision: 'Run Phase 36H DeepFilterNet runtime hardening.',
  }
}

function renderHardeningMarkdown(report: JsonRecord): string {
  return [
    '# Phase 36H DeepFilterNet Runtime Hardening Report',
    '',
    `- Status: ${String(report.status)}`,
    `- Audio/timing tool-family beta status: ${String(report.audioTimingToolFamilyBetaStatus)}`,
    `- Runtime preflight: ${String(report.runtimePreflightStatus)}`,
    `- Generated fixture: ${String(report.generatedFixtureStatus)}`,
    `- Controlled extraction: ${String(report.controlledExtractionStatus)}`,
    `- Controlled enhancement: ${String(report.controlledEnhancementStatus)}`,
    `- Private artifacts: ${String(report.privateArtifactStatus)}`,
    '',
    'Signalsmith Stretch, Demucs, production, beta, broad media, arbitrary media, OCR/VLM, provider calls, public output, and Track A remain blocked.',
  ].join('\n')
}
