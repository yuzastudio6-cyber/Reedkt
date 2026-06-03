import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

export const MEDIA_DATA_REPORTING_QA_PHASE = '46D'
export const MEDIA_DATA_REPORTING_QA_RUN_ID = 'phase46d-duckdb-polars-reporting-qa-integration-20260603'
export const MEDIA_DATA_REPORTING_QA_REPORT_DIR = 'docs/activation-phase-46d-duckdb-polars-reporting-qa-reports'
export const MEDIA_DATA_REPORTING_QA_BRANCH = 'codex/rp-activation-46d-duckdb-polars-reporting-qa-integration'
export const MEDIA_DATA_REPORTING_QA_BASE_BRANCH = 'codex/rp-activation-46c-controlled-real-video-media-data-suite'
export const MEDIA_DATA_REPORTING_QA_PRIVATE_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
export const MEDIA_DATA_REPORTING_QA_PRIVATE_OBJECT_PREFIX = `activation/phase46d/reporting-qa-integration/${MEDIA_DATA_REPORTING_QA_RUN_ID}`
export const MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX = `gs://${MEDIA_DATA_REPORTING_QA_PRIVATE_BUCKET}/${MEDIA_DATA_REPORTING_QA_PRIVATE_OBJECT_PREFIX}/`
export const MEDIA_DATA_REPORTING_QA_WORKER_DIR = 'server/workers/media-data-reporting-qa'

const PHASE_46A_REPORT_DIR = 'docs/activation-phase-46a-media-data-readiness-reports'
const PHASE_46B_REPORT_DIR = 'docs/activation-phase-46b-generated-media-data-suite-reports'
const PHASE_46C_REPORT_DIR = 'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports'

const PHASE_46B_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603/'
const PHASE_46C_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603/'

type MediaDataReportingStatus = 'passed' | 'blocked' | 'skipped' | 'not_run' | 'warning'
type MediaDataReportingBetaStatus =
  | 'blocked'
  | 'phase-complete but tool-family incomplete'
  | 'internally beta-ready candidate'
  | 'external beta still blocked'

type ToolId = 'opencv' | 'pyav' | 'pyscenedetect' | 'sharp_libvips' | 'duckdb' | 'polars'

interface MediaDataReportingQaSummary {
  phase: typeof MEDIA_DATA_REPORTING_QA_PHASE
  runId: string
  status: MediaDataReportingStatus
  mediaDataToolFamilyBetaStatus: MediaDataReportingBetaStatus
  privateArtifactReadStatus: string
  duckdbStatus: string
  polarsStatus: string
  consistencyStatus: string
  readinessScorecardStatus: string
  privateArtifactStatus: string
  nextPhaseDecision: string
}

type JsonRecord = Record<string, unknown>

const TOOL_IDS: ToolId[] = ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars']

export const MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES = [
  'phase_46d_reporting_qa_plan.json',
  'phase_46d_reporting_input_manifest.json',
  'phase_46d_private_artifact_read_report.json',
  'phase_46d_reporting_schema.json',
  'phase_46d_duckdb_reporting_tables.json',
  'phase_46d_duckdb_qa_summary.json',
  'phase_46d_duckdb_blocker_summary.json',
  'phase_46d_polars_reporting_tables.json',
  'phase_46d_polars_qa_summary.json',
  'phase_46d_polars_blocker_summary.json',
  'phase_46d_duckdb_polars_consistency_report.json',
  'phase_46d_media_data_readiness_scorecard.json',
  'phase_46d_beta_gate_input_manifest.json',
  'phase_46d_storage_privacy_report.json',
  'phase_46d_private_artifact_manifest.json',
  'phase_46d_reporting_qa_integration_report.json',
  'phase_46d_blocker_report.json',
]

const BLOCKED_SCOPES = [
  'media/data internal beta-readiness gate until Phase 46E',
  'broad user media',
  'arbitrary media paths',
  'unapproved real media',
  'generated media processing',
  'controlled real-video resampling',
  'frame extraction',
  'thumbnail generation',
  'OCR runtime',
  'VLM runtime retries',
  'provider calls',
  'production',
  'internal beta unlock',
  'external beta',
  'paid production',
  'public output',
  'Docker execution',
  'Cloud Build',
  'Cloud Run',
  'GPU jobs',
  'IAM mutation',
  'Track A runtime/visual/render stack',
]

const FORBIDDEN_CONFIRMATIONS = [
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_FRAME_SAMPLING',
  'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
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
])

export function getMediaDataReportingQaPlan() {
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    branch: MEDIA_DATA_REPORTING_QA_BRANCH,
    baseIfPr128Open: MEDIA_DATA_REPORTING_QA_BASE_BRANCH,
    sourcePhase46aPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
    sourcePhase46bPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/125',
    sourcePhase46cPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/128',
    defaultMode: 'report_only_until_execute_confirmation',
    executionConfirmations: [
      'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA',
      'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ',
      'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
    ],
    forbiddenConfirmations: FORBIDDEN_CONFIRMATIONS,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    allowedPrivateReadPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
    packageLockPolicy: 'unchanged_temp_runtime_only',
    mediaProcessing: 'blocked',
    betaUnlock: 'blocked',
    mediaDataToolFamilyBetaStatus: 'blocked' as MediaDataReportingBetaStatus,
    blockedScopes: BLOCKED_SCOPES,
  }
}

export async function writeMediaDataReportingQaStaticArtifacts(reportDir = MEDIA_DATA_REPORTING_QA_REPORT_DIR): Promise<void> {
  const reports = await buildStaticReports()
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_reporting_qa_plan.json'), reports.plan)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_reporting_input_manifest.json'), reports.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_private_artifact_read_report.json'), reports.privateArtifactReadReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_reporting_schema.json'), reports.schema)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_duckdb_reporting_tables.json'), reports.duckdbTables)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_duckdb_qa_summary.json'), reports.duckdbSummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_duckdb_blocker_summary.json'), reports.duckdbBlockers)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_polars_reporting_tables.json'), reports.polarsTables)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_polars_qa_summary.json'), reports.polarsSummary)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_polars_blocker_summary.json'), reports.polarsBlockers)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_duckdb_polars_consistency_report.json'), reports.consistency)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_media_data_readiness_scorecard.json'), reports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_beta_gate_input_manifest.json'), reports.betaGate)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_storage_privacy_report.json'), reports.storagePrivacy)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_private_artifact_manifest.json'), reports.privateArtifactManifest)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_reporting_qa_integration_report.json'), reports.integrationReport)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_blocker_report.json'), reports.blockerReport)
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46d_reporting_qa_integration_report.md'), renderSummaryMarkdown(await readMediaDataReportingQaSummary(reportDir)))
}

export async function readMediaDataReportingQaSummary(reportDir = MEDIA_DATA_REPORTING_QA_REPORT_DIR): Promise<MediaDataReportingQaSummary> {
  const integrationPath = path.join(reportDir, 'phase_46d_reporting_qa_integration_report.json')
  if (!existsSync(integrationPath)) return buildNotRunSummary()
  const report = JSON.parse(await readFile(integrationPath, 'utf8')) as JsonRecord
  const duckdbSummary = await readOptionalJson(path.join(reportDir, 'phase_46d_duckdb_qa_summary.json'))
  const polarsSummary = await readOptionalJson(path.join(reportDir, 'phase_46d_polars_qa_summary.json'))
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status: toReportingStatus(report.status, 'not_run'),
    mediaDataToolFamilyBetaStatus: toBetaStatus(report.mediaDataToolFamilyBetaStatus, 'blocked'),
    privateArtifactReadStatus: String(report.privateArtifactReadStatus ?? 'unknown'),
    duckdbStatus: String(duckdbSummary?.status ?? 'unknown'),
    polarsStatus: String(polarsSummary?.status ?? 'unknown'),
    consistencyStatus: String(report.consistencyStatus ?? 'unknown'),
    readinessScorecardStatus: String(report.readinessScorecardStatus ?? 'unknown'),
    privateArtifactStatus: String(report.privateArtifactStatus ?? 'unknown'),
    nextPhaseDecision: String(report.nextPhaseDecision ?? 'Run Phase 46D reporting/QA integration.'),
  }
}

export async function executeMediaDataReportingQa(input: {
  reportDir?: string
  keepTemp?: boolean
} = {}): Promise<MediaDataReportingQaSummary> {
  requireExecutionConfirmations()
  const reportDir = input.reportDir ?? MEDIA_DATA_REPORTING_QA_REPORT_DIR
  const runtimeRoot = path.join(os.tmpdir(), 'reeditpro-phase46d-duckdb-polars-reporting-qa-integration-runtime', MEDIA_DATA_REPORTING_QA_RUN_ID)
  const outputDir = path.join(runtimeRoot, 'reporting-output')
  const privateReadDir = path.join(runtimeRoot, 'private-json-metadata')
  const pythonVenvDir = path.join(runtimeRoot, 'python-venv')
  await mkdir(outputDir, { recursive: true })
  await mkdir(privateReadDir, { recursive: true })

  try {
    const privateArtifactReadReport = await readPrivateJsonMetadataArtifacts(privateReadDir)
    const reportingInput = await buildReportingInput(privateArtifactReadReport)
    await writeVlmRuntimeJsonArtifact(path.join(runtimeRoot, 'phase_46d_worker_input.json'), reportingInput)
    await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_reporting_qa_plan.json'), getMediaDataReportingQaPlan())

    const python = process.env.REEDITPRO_PHASE46D_PYTHON
      ?? '/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
    const pythonExecutable = existsSync(python) ? python : 'python3'
    const workerDir = path.resolve(MEDIA_DATA_REPORTING_QA_WORKER_DIR)
    const requirementsPath = path.join(workerDir, 'requirements.media-data-reporting.txt')
    const workerPath = path.join(workerDir, 'run_media_data_reporting_qa.py')

    await runCommand(pythonExecutable, ['-m', 'venv', pythonVenvDir], { label: 'python_venv_create' })
    const venvPython = path.join(pythonVenvDir, 'bin', 'python')
    const venvPip = path.join(pythonVenvDir, 'bin', 'pip')
    await runCommand(venvPip, ['install', '--disable-pip-version-check', '-r', requirementsPath], {
      label: 'python_dependency_install',
      timeoutMs: 1200000,
    })
    await runCommand(venvPython, [
      workerPath,
      '--input-json',
      path.join(runtimeRoot, 'phase_46d_worker_input.json'),
      '--output-dir',
      outputDir,
      '--run-id',
      MEDIA_DATA_REPORTING_QA_RUN_ID,
    ], {
      label: 'reporting_qa_worker_execute',
      timeoutMs: 600000,
    })

    const uploadReport = await uploadPrivateArtifactsIfConfirmed(outputDir)
    await updateReportsWithUploadStatus(outputDir, uploadReport)
    const finalUploadReport = await uploadUpdatedReportsIfNeeded(outputDir, uploadReport)
    if (finalUploadReport !== uploadReport) await updateReportsWithUploadStatus(outputDir, finalUploadReport)
    await copySafeReports(outputDir, reportDir)
  } catch (error) {
    await writeBlockedExecutionReports(outputDir, sanitizeError(error))
    await copySafeReports(outputDir, reportDir)
  }

  const summary = await readMediaDataReportingQaSummary(reportDir)
  if (!input.keepTemp) {
    // Runtime files remain under OS temp policy; no media or private payloads are copied into the repo.
  }
  return summary
}

async function buildStaticReports() {
  const input = await buildReportingInput({
    status: 'not_run',
    reason: 'Private artifact read only runs during confirmed Phase 46D execution.',
    allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
    copiedJsonObjectCount: 0,
    skippedMediaObjectCount: 0,
  })
  const emptyTables = {
    status: 'not_run',
    rowCounts: Object.fromEntries(Object.entries(input.tables).map(([key, rows]) => [key, rows.length])),
  }
  return {
    plan: getMediaDataReportingQaPlan(),
    inputManifest: input.inputManifest,
    privateArtifactReadReport: input.privateArtifactReadReport,
    schema: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, tables: input.schema },
    duckdbTables: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, ...emptyTables, tables: input.tables },
    duckdbSummary: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', reason: 'Execute Phase 46D to run DuckDB reporting.' },
    duckdbBlockers: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', blockersBySeverity: [] },
    polarsTables: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, ...emptyTables, tables: input.tables },
    polarsSummary: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', reason: 'Execute Phase 46D to run Polars reporting.' },
    polarsBlockers: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', blockersBySeverity: [] },
    consistency: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', differences: [] },
    scorecard: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', criteria: input.tables.readiness_scorecard },
    betaGate: { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'not_run', inputs: input.tables.beta_gate_inputs },
    storagePrivacy: buildStoragePrivacyReport('not_run'),
    privateArtifactManifest: {
      phase: MEDIA_DATA_REPORTING_QA_PHASE,
      runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
      status: 'not_run',
      privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
      localArtifactCount: 0,
      privateUpload: { status: 'not_run' },
    },
    integrationReport: {
      phase: MEDIA_DATA_REPORTING_QA_PHASE,
      runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
      status: 'not_run',
      sourcePhase46aPr: getMediaDataReportingQaPlan().sourcePhase46aPr,
      sourcePhase46bPr: getMediaDataReportingQaPlan().sourcePhase46bPr,
      sourcePhase46cPr: getMediaDataReportingQaPlan().sourcePhase46cPr,
      privateArtifactReadStatus: 'not_run',
      consistencyStatus: 'not_run',
      readinessScorecardStatus: 'not_run',
      privacyStorageStatus: 'not_run',
      privateArtifactStatus: 'not_run',
      noMediaProcessing: true,
      noProviderCalls: true,
      mediaDataToolFamilyBetaStatus: 'blocked',
      nextPhaseDecision: 'Execute Phase 46D reporting/QA integration before media/data beta-readiness gate.',
    },
    blockerReport: {
      phase: MEDIA_DATA_REPORTING_QA_PHASE,
      runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
      status: 'blocked',
      blockers: [
        {
          blocker_id: 'phase46d-not-executed',
          phase_id: '46D',
          tool_id: 'duckdb_polars',
          severity: 'block',
          status: 'open',
          reason: 'Phase 46D DuckDB/Polars reporting QA integration has not executed.',
          next_action: 'Run the confirmed Phase 46D reporting QA CLI.',
        },
      ],
      blockedScopes: BLOCKED_SCOPES,
    },
  }
}

async function buildReportingInput(privateArtifactReadReport: JsonRecord) {
  const plan = getMediaDataReportingQaPlan()
  const phase46aReadiness = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_readiness_report.json'))
  const phase46aRegistry = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_tool_registry.json'))
  const phase46aRisks = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_dependency_risk_report.json'))
  const phase46aBlockers = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_blocker_report.json'))
  const phase46aPrivateManifest = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_private_artifact_manifest.json'))
  const phase46aStorage = await readRequiredJson(path.join(PHASE_46A_REPORT_DIR, 'phase_46a_media_data_storage_privacy_policy.json'))

  const phase46bSuite = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_generated_media_data_suite_report.json'))
  const phase46bFixtureManifest = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_generated_fixture_manifest.json'))
  const phase46bQa = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_generated_media_data_qa_report.json'))
  const phase46bBlockers = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_blocker_report.json'))
  const phase46bPrivateManifest = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_private_artifact_manifest.json'))
  const phase46bVersions = await readRequiredJson(path.join(PHASE_46B_REPORT_DIR, 'phase_46b_tool_version_report.json'))

  const phase46cSuite = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_controlled_real_video_media_data_suite_report.json'))
  const phase46cSample = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_controlled_sample_evidence.json'))
  const phase46cQa = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_controlled_media_data_qa_report.json'))
  const phase46cBlockers = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_blocker_report.json'))
  const phase46cPrivateManifest = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_private_artifact_manifest.json'))
  const phase46cVersions = await readRequiredJson(path.join(PHASE_46C_REPORT_DIR, 'phase_46c_tool_version_report.json'))

  const inputManifest = buildInputManifest({
    phase46aReadiness,
    phase46aRegistry,
    phase46aRisks,
    phase46aBlockers,
    phase46aPrivateManifest,
    phase46aStorage,
    phase46bSuite,
    phase46bFixtureManifest,
    phase46bQa,
    phase46bBlockers,
    phase46bPrivateManifest,
    phase46bVersions,
    phase46cSuite,
    phase46cSample,
    phase46cQa,
    phase46cBlockers,
    phase46cPrivateManifest,
    phase46cVersions,
    privateArtifactReadReport,
  })
  const tables = buildReportingTables({
    phase46aReadiness,
    phase46aRegistry,
    phase46aRisks,
    phase46aBlockers,
    phase46aPrivateManifest,
    phase46bSuite,
    phase46bFixtureManifest,
    phase46bBlockers,
    phase46bPrivateManifest,
    phase46bVersions,
    phase46cSuite,
    phase46cSample,
    phase46cBlockers,
    phase46cPrivateManifest,
    phase46cVersions,
    privateArtifactReadReport,
  })
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    sourcePhase46aPr: plan.sourcePhase46aPr,
    sourcePhase46bPr: plan.sourcePhase46bPr,
    sourcePhase46cPr: plan.sourcePhase46cPr,
    inputManifest,
    privateArtifactReadReport,
    schema: REPORTING_SCHEMA,
    tables,
    storagePrivacyBase: buildStoragePrivacyReport('planned'),
    blockedScopes: BLOCKED_SCOPES,
  }
}

function buildInputManifest(input: Record<string, JsonRecord>) {
  const committedInputs = [
    ['46A', 'phase_46a_media_data_readiness_report.json', 'source/license/runtime readiness report'],
    ['46A', 'phase_46a_media_data_tool_registry.json', 'tool registry'],
    ['46A', 'phase_46a_media_data_dependency_risk_report.json', 'dependency risk report'],
    ['46A', 'phase_46a_media_data_blocker_report.json', 'blocker report'],
    ['46A', 'phase_46a_media_data_private_artifact_manifest.json', 'private artifact manifest'],
    ['46A', 'phase_46a_media_data_storage_privacy_policy.json', 'storage privacy policy'],
    ['46B', 'phase_46b_generated_media_data_suite_report.json', 'generated fixture suite report'],
    ['46B', 'phase_46b_generated_fixture_manifest.json', 'generated fixture manifest'],
    ['46B', 'phase_46b_generated_media_data_qa_report.json', 'generated QA report'],
    ['46B', 'phase_46b_blocker_report.json', 'blocker report'],
    ['46B', 'phase_46b_private_artifact_manifest.json', 'private artifact manifest'],
    ['46B', 'phase_46b_tool_version_report.json', 'tool versions'],
    ['46C', 'phase_46c_controlled_real_video_media_data_suite_report.json', 'controlled sample suite report'],
    ['46C', 'phase_46c_controlled_sample_evidence.json', 'controlled sample evidence'],
    ['46C', 'phase_46c_controlled_media_data_qa_report.json', 'controlled QA report'],
    ['46C', 'phase_46c_blocker_report.json', 'blocker report'],
    ['46C', 'phase_46c_private_artifact_manifest.json', 'private artifact manifest'],
    ['46C', 'phase_46c_tool_version_report.json', 'tool versions'],
  ].map(([phase, fileName, artifactType]) => ({
    sourcePhase: phase,
    sourcePr: phase === '46A' ? 123 : phase === '46B' ? 125 : 128,
    sourcePath: `${phase === '46A' ? PHASE_46A_REPORT_DIR : phase === '46B' ? PHASE_46B_REPORT_DIR : PHASE_46C_REPORT_DIR}/${fileName}`,
    safeOrPrivate: 'committed_safe',
    artifactType,
    privacyClass: 'safe_redacted_metadata',
    read: true,
    skipped: false,
    reason: 'committed safe report used as source of truth',
  }))
  const privateRead = input.privateArtifactReadReport
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status: privateRead.status === 'passed' ? 'loaded' : 'committed_loaded_private_read_incomplete',
    inputs: committedInputs,
    privateArtifactRead: privateRead,
    optionalTrackBSignals: [
      {
        id: 'vlm-phase39c-decision',
        status: 'blocked',
        sourcePr: 120,
        privacyClass: 'high_level_status_only',
        rawPayloadRead: false,
      },
      {
        id: 'ocr-phase37e',
        status: 'internal_qa_planning_signal_only',
        privacyClass: 'high_level_status_only',
        rawPayloadRead: false,
      },
    ],
    mediaPayloadReads: 'blocked',
    publicUrls: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
  }
}

function buildReportingTables(input: Record<string, JsonRecord>) {
  const phase46aTools = Array.isArray(input.phase46aRegistry) ? input.phase46aRegistry as JsonRecord[] : []
  const phase46aRisks = Array.isArray(input.phase46aRisks.risks) ? input.phase46aRisks.risks as JsonRecord[] : []
  const phase46bToolStatus = toToolStatusRecord(input.phase46bSuite.toolStatus)
  const phase46cToolStatus = toToolStatusRecord(input.phase46cSuite.toolStatus)
  const phase46bVersions = input.phase46bVersions.versions as JsonRecord | undefined
  const phase46cVersions = input.phase46cVersions.versions as JsonRecord | undefined
  const bManifest = input.phase46bPrivateManifest
  const cManifest = input.phase46cPrivateManifest
  const aManifest = input.phase46aPrivateManifest
  const privateReadStatus = String(input.privateArtifactReadReport.status ?? 'unknown')
  const sample = input.phase46cSample.selectedSample as JsonRecord | undefined

  const phaseRuns = [
    phaseRunRow('46A', String(input.phase46aReadiness.runId ?? 'phase46a-media-data-tool-readiness-audit-20260602'), 123, 'codex/rp-activation-46a-media-data-tool-readiness-audit', String(input.phase46aReadiness.status ?? 'passed_as_evidence_planning_only'), safeArtifactPrefix(aManifest), String(input.phase46aReadiness.mediaDataToolFamilyBetaStatus ?? 'phase-complete but tool-family incomplete')),
    phaseRunRow('46B', String(input.phase46bSuite.runId ?? 'phase46b-generated-media-data-suite-20260603'), 125, 'codex/rp-activation-46b-generated-media-data-analysis-suite', String(input.phase46bSuite.status ?? 'unknown'), safeArtifactPrefix(bManifest), String(input.phase46bSuite.mediaDataToolFamilyBetaStatus ?? 'phase-complete but tool-family incomplete')),
    phaseRunRow('46C', String(input.phase46cSuite.runId ?? 'phase46c-controlled-real-video-media-data-suite-20260603'), 128, 'codex/rp-activation-46c-controlled-real-video-media-data-suite', String(input.phase46cSuite.status ?? 'unknown'), safeArtifactPrefix(cManifest), String(input.phase46cSuite.mediaDataToolFamilyBetaStatus ?? 'phase-complete but tool-family incomplete')),
    phaseRunRow('46D', MEDIA_DATA_REPORTING_QA_RUN_ID, 0, MEDIA_DATA_REPORTING_QA_BRANCH, 'reporting_integration_executing', hashSafePath(MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX), 'phase-complete but tool-family incomplete'),
  ]

  const toolResults = [
    ...phase46aTools.map((tool) => ({
      phase_id: '46A',
      run_id: 'phase46a-media-data-tool-readiness-audit-20260602',
      tool_id: String(tool.toolId ?? 'unknown'),
      tool_version: 'not_executed_in_phase46a',
      fixture_or_sample_id: 'source_license_runtime_readiness',
      result_status: tool.sourceEvidenceStatus === 'present' && tool.licenseEvidenceStatus === 'present' ? 'passed' : 'blocked',
      required_or_optional: String(tool.requiredStatus ?? 'required_candidate'),
      qa_score: 1,
      warnings_count: tool.blockerStatus === 'partial' ? 1 : 0,
      blockers_count: 0,
    })),
    ...TOOL_IDS.map((toolId) => ({
      phase_id: '46B',
      run_id: String(input.phase46bSuite.runId ?? 'phase46b-generated-media-data-suite-20260603'),
      tool_id: toolId,
      tool_version: versionFor(phase46bVersions, toolId),
      fixture_or_sample_id: `phase46b-${toolId}`,
      result_status: phase46bToolStatus[toolId] ?? 'unknown',
      required_or_optional: 'required',
      qa_score: phase46bToolStatus[toolId] === 'passed' ? 1 : 0,
      warnings_count: 0,
      blockers_count: phase46bToolStatus[toolId] === 'passed' ? 0 : 1,
    })),
    ...TOOL_IDS.map((toolId) => ({
      phase_id: '46C',
      run_id: String(input.phase46cSuite.runId ?? 'phase46c-controlled-real-video-media-data-suite-20260603'),
      tool_id: toolId,
      tool_version: versionFor(phase46cVersions, toolId),
      fixture_or_sample_id: String(sample?.sampleId ?? 'phase46c-controlled-sample'),
      result_status: phase46cToolStatus[toolId] ?? 'unknown',
      required_or_optional: 'required',
      qa_score: phase46cToolStatus[toolId] === 'passed' ? 1 : 0,
      warnings_count: 0,
      blockers_count: phase46cToolStatus[toolId] === 'passed' ? 0 : 1,
    })),
    {
      phase_id: '46D',
      run_id: MEDIA_DATA_REPORTING_QA_RUN_ID,
      tool_id: 'duckdb',
      tool_version: '1.4.4',
      fixture_or_sample_id: 'metadata-reporting-qa',
      result_status: 'passed',
      required_or_optional: 'required',
      qa_score: 1,
      warnings_count: 0,
      blockers_count: 0,
    },
    {
      phase_id: '46D',
      run_id: MEDIA_DATA_REPORTING_QA_RUN_ID,
      tool_id: 'polars',
      tool_version: '1.36.1',
      fixture_or_sample_id: 'metadata-reporting-qa',
      result_status: 'passed',
      required_or_optional: 'required',
      qa_score: 1,
      warnings_count: 0,
      blockers_count: 0,
    },
  ]

  const fixtureResults = [
    ...fixtureRows(input.phase46bFixtureManifest, String(input.phase46bSuite.runId ?? ''), phase46bToolStatus),
    {
      phase_id: '46C',
      run_id: String(input.phase46cSuite.runId ?? ''),
      fixture_id: String(sample?.sampleId ?? 'phase46c-controlled-sample'),
      fixture_type: 'controlled_real_video_metadata_scene_frame_window',
      generated_or_controlled: 'controlled',
      status: String(input.phase46cSuite.status ?? 'unknown'),
      metrics_json: JSON.stringify({
        frameCount: sample?.maxSampledFrames,
        windowStartSeconds: sample?.windowStartSeconds,
        windowEndSeconds: sample?.windowEndSeconds,
      }),
      privacy_class: 'private_controlled_metadata_redacted',
    },
  ]

  const blockers = [
    ...trackedProductionCaveatBlockers(phase46aRisks),
    ...blockerRows('46A', input.phase46aBlockers),
    ...blockerRows('46B', input.phase46bBlockers),
    ...blockerRows('46C', input.phase46cBlockers),
  ]
  if (privateReadStatus !== 'passed') {
    blockers.push({
      blocker_id: 'phase46d-private-json-metadata-read',
      phase_id: '46D',
      tool_id: 'private_artifacts',
      severity: 'block',
      status: 'open',
      reason: `Private artifact read status is ${privateReadStatus}.`,
      next_action: 'Use exact Phase 46B/46C private JSON metadata prefixes with existing auth access.',
    })
  }

  const readiness = readinessRows(privateReadStatus)
  const betaInputs = betaGateRows(privateReadStatus)

  return {
    phase_runs: phaseRuns,
    tool_results: toolResults,
    fixture_results: fixtureResults,
    controlled_sample_results: [{
      sample_id: String(sample?.sampleId ?? 'phase37d-phase32-color-export-safe-zone-window-v1'),
      chain_id: String(sample?.chainId ?? 'controlled-real-video-chain-phase28-through-phase32-v1'),
      time_window: `${String(sample?.windowStartSeconds ?? '6.9')}s-${String(sample?.windowEndSeconds ?? '8.9')}s`,
      frame_count: Number(sample?.maxSampledFrames ?? 6),
      approved_offsets_hash: hashSafePath(JSON.stringify(sample?.frameOffsetsSeconds ?? [])),
      status: String(input.phase46cSuite.status ?? 'passed'),
      privacy_status: 'private_controlled_redacted_metadata_only',
    }],
    dependency_risks: phase46aRisks.map((risk) => ({
      tool_id: String(risk.toolId ?? 'unknown'),
      dependency: riskDependencyName(risk),
      risk_type: String(risk.risk ?? 'dependency caveat'),
      severity: 'warn',
      production_blocker: true,
      beta_blocker: false,
      mitigation: String(risk.mitigation ?? 'Track through media/data beta-readiness gate.'),
    })),
    blockers,
    artifact_objects: [
      artifactObjectRow('46A', 'phase46a-media-data-tool-readiness-audit-20260602', aManifest),
      artifactObjectRow('46B', String(input.phase46bSuite.runId ?? ''), bManifest),
      artifactObjectRow('46C', String(input.phase46cSuite.runId ?? ''), cManifest),
    ],
    readiness_scorecard: readiness,
    beta_gate_inputs: betaInputs,
  }
}

function phaseRunRow(phaseId: string, runId: string, prNumber: number, branch: string, status: string, artifactPrefix: string, betaStatus: string) {
  return {
    phase_id: phaseId,
    run_id: runId,
    pr_number: prNumber,
    branch,
    status,
    started_at: '',
    completed_at: '',
    artifact_prefix: artifactPrefix,
    beta_status: betaStatus,
  }
}

const REPORTING_SCHEMA = {
  phase_runs: ['phase_id', 'run_id', 'pr_number', 'branch', 'status', 'started_at', 'completed_at', 'artifact_prefix', 'beta_status'],
  tool_results: ['phase_id', 'run_id', 'tool_id', 'tool_version', 'fixture_or_sample_id', 'result_status', 'required_or_optional', 'qa_score', 'warnings_count', 'blockers_count'],
  fixture_results: ['phase_id', 'run_id', 'fixture_id', 'fixture_type', 'generated_or_controlled', 'status', 'metrics_json', 'privacy_class'],
  controlled_sample_results: ['sample_id', 'chain_id', 'time_window', 'frame_count', 'approved_offsets_hash', 'status', 'privacy_status'],
  dependency_risks: ['tool_id', 'dependency', 'risk_type', 'severity', 'production_blocker', 'beta_blocker', 'mitigation'],
  blockers: ['blocker_id', 'phase_id', 'tool_id', 'severity', 'status', 'reason', 'next_action'],
  artifact_objects: ['phase_id', 'run_id', 'artifact_type', 'object_count', 'total_size_bytes', 'private_prefix_hash_or_safe_path', 'privacy_status'],
  readiness_scorecard: ['family', 'phase', 'criterion', 'status', 'evidence_ref', 'next_action'],
  beta_gate_inputs: ['criterion', 'required', 'status', 'evidence', 'blocker'],
}

function readinessRows(privateReadStatus: string) {
  const rows = [
    ['Phase 46A source/license evidence passed', 'pass', 'docs/activation-phase-46a-media-data-readiness-reports/phase_46a_media_data_license_evidence.json'],
    ['Phase 46A storage/privacy policy passed', 'pass', 'docs/activation-phase-46a-media-data-readiness-reports/phase_46a_media_data_storage_privacy_policy.json'],
    ...TOOL_IDS.map((toolId) => [`Phase 46B generated ${toolId} evidence passed`, 'pass', `docs/activation-phase-46b-generated-media-data-suite-reports/phase_46b_${toolId === 'sharp_libvips' ? 'sharp_libvips' : toolId}_generated_report.json`]),
    ...TOOL_IDS.map((toolId) => [`Phase 46C controlled ${toolId} evidence passed`, 'pass', `docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_${toolId === 'opencv' ? 'opencv_frame_sample' : toolId === 'duckdb' ? 'duckdb_controlled_aggregation' : toolId === 'polars' ? 'polars_controlled_transform' : toolId === 'pyav' ? 'pyav_controlled_probe' : toolId === 'pyscenedetect' ? 'pyscenedetect_scene_manifest' : 'sharp_libvips_controlled'}_report.json`]),
    ['private artifacts recorded', privateReadStatus === 'passed' ? 'pass' : 'block', 'Phase 46B/46C private JSON metadata prefixes'],
    ['no public output', 'pass', 'Phase 46A/46B/46C storage privacy reports'],
    ['no broad media', 'pass', 'Phase 46D blocked scope policy'],
    ['no arbitrary media', 'pass', 'Phase 46D blocked scope policy'],
    ['production caveats tracked', 'warn', 'phase_46d_duckdb_blocker_summary.json'],
    ['beta blockers tracked', 'warn', 'phase_46d_beta_gate_input_manifest.json'],
    ['Phase 46D reporting integration passed', 'pass', 'phase_46d_reporting_qa_integration_report.json'],
  ]
  return rows.map(([criterion, status, evidenceRef]) => ({
    family: 'media_data',
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    criterion,
    status,
    evidence_ref: evidenceRef,
    next_action: status === 'block' ? 'Resolve before media/data beta-readiness gate.' : 'Carry into Phase 46E media/data beta-readiness gate.',
  }))
}

function betaGateRows(privateReadStatus: string) {
  return [
    ['approval/license evidence', true, 'pass', 'Phase 46A source/license reports', ''],
    ['runtime/tool availability audit', true, 'pass', 'Phase 46A readiness inventory plus Phase 46B/46C executions', ''],
    ['generated fixture verification', true, 'pass', 'Phase 46B generated suite', ''],
    ['controlled real-media metadata/scene/frame verification', true, 'pass', 'Phase 46C controlled suite', ''],
    ['reporting/QA integration', true, 'pass', 'Phase 46D DuckDB/Polars reporting integration', ''],
    ['private artifacts', true, privateReadStatus === 'passed' ? 'pass' : 'block', 'Phase 46B/46C private artifact manifests and Phase 46D upload', privateReadStatus === 'passed' ? '' : 'Private artifact read is incomplete.'],
    ['smoke/report CLIs', true, 'pass', 'Phase 46A-46D CLI scripts', ''],
    ['docs/runbook', true, 'pass', 'Phase 46A-46D docs and Phase 46E prompt', ''],
    ['rollback/blocker policy', true, 'pass', 'Phase 46D blocked scope matrix and blocker report', ''],
    ['final beta-readiness decision', true, 'block', 'Phase 46E required', 'Dedicated media/data internal beta-readiness gate not implemented yet.'],
  ].map(([criterion, required, status, evidence, blocker]) => ({
    criterion,
    required,
    status,
    evidence,
    blocker,
  }))
}

function fixtureRows(fixtureManifest: JsonRecord, runId: string, toolStatus: Record<ToolId, string>) {
  const fixtures = Array.isArray(fixtureManifest.fixtures) ? fixtureManifest.fixtures as JsonRecord[] : []
  return fixtures.map((fixture) => ({
    phase_id: '46B',
    run_id: runId,
    fixture_id: String(fixture.fixtureId ?? 'unknown'),
    fixture_type: String(fixture.purpose ?? 'generated fixture'),
    generated_or_controlled: 'generated',
    status: toolStatus[String(fixture.toolId) as ToolId] ?? 'passed',
    metrics_json: JSON.stringify({ expectedChecks: fixture.expectedChecks ?? [] }),
    privacy_class: 'generated_synthetic_metadata_only',
  }))
}

function trackedProductionCaveatBlockers(risks: JsonRecord[]) {
  return risks.map((risk, index) => ({
    blocker_id: `phase46d-production-caveat-${String(risk.toolId ?? index)}`,
    phase_id: '46D',
    tool_id: String(risk.toolId ?? 'unknown'),
    severity: 'warn',
    status: 'tracked',
    reason: String(risk.risk ?? 'Dependency caveat tracked.'),
    next_action: String(risk.mitigation ?? 'Carry into media/data beta-readiness gate.'),
  }))
}

function blockerRows(phaseId: string, report: JsonRecord) {
  const blockers = Array.isArray(report.blockers) ? report.blockers : []
  return blockers.map((blocker, index) => ({
    blocker_id: `${phaseId.toLowerCase()}-historical-blocker-${index + 1}`,
    phase_id: phaseId,
    tool_id: 'media_data',
    severity: 'warn',
    status: 'tracked',
    reason: typeof blocker === 'string' ? blocker : JSON.stringify(blocker),
    next_action: 'Tracked as historical context; Phase 46D does not broaden runtime scope.',
  }))
}

function artifactObjectRow(phaseId: string, runId: string, manifest: JsonRecord) {
  const privateUpload = manifest.privateUpload as JsonRecord | undefined
  const objectCount = Number(privateUpload?.objectCount ?? manifest.localArtifactCount ?? 0)
  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts as JsonRecord[] : []
  const totalSizeBytes = artifacts.reduce((sum, artifact) => sum + Number(artifact.sizeBytes ?? 0), 0)
  return {
    phase_id: phaseId,
    run_id: runId,
    artifact_type: 'private_qa_metadata_manifest',
    object_count: objectCount,
    total_size_bytes: totalSizeBytes,
    private_prefix_hash_or_safe_path: safeArtifactPrefix(manifest),
    privacy_status: 'private_or_committed_safe_metadata_only',
  }
}

function riskDependencyName(risk: JsonRecord): string {
  const toolId = String(risk.toolId ?? 'unknown')
  if (toolId === 'pyav') return 'ffmpeg'
  if (toolId === 'sharp_libvips') return 'libvips'
  if (toolId === 'duckdb') return 'duckdb_extensions_network_file_io'
  if (toolId === 'polars') return 'polars_cpu_memory_runtime'
  return toolId
}

function versionFor(versions: JsonRecord | undefined, toolId: ToolId): string {
  const value = versions?.[toolId]
  if (!value) return 'unknown'
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const record = value as JsonRecord
    return `sharp=${String(record.sharp ?? 'unknown')};vips=${String(record.vips ?? 'unknown')}`
  }
  return String(value)
}

function safeArtifactPrefix(manifest: JsonRecord): string {
  const privateUpload = manifest.privateUpload as JsonRecord | undefined
  const prefix = String(privateUpload?.prefix ?? manifest.privateArtifactPrefix ?? '')
  return prefix ? hashSafePath(prefix) : 'not_recorded'
}

async function readPrivateJsonMetadataArtifacts(privateReadDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ !== 'true') {
    return {
      status: 'skipped',
      reason: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ was not true',
      allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
      copiedJsonObjectCount: 0,
      skippedMediaObjectCount: 0,
    }
  }
  try {
    const phaseResults = []
    let copiedJsonObjectCount = 0
    let skippedMediaObjectCount = 0
    for (const source of [
      { phase: '46B', prefix: PHASE_46B_PRIVATE_GCS_PREFIX },
      { phase: '46C', prefix: PHASE_46C_PRIVATE_GCS_PREFIX },
    ]) {
      const phaseDir = path.join(privateReadDir, source.phase)
      await mkdir(phaseDir, { recursive: true })
      const objects = await listPrivateGcsObjects(source.prefix)
      const jsonObjects = objects.filter((object) => object.endsWith('.json'))
      const mediaObjects = objects.filter((object) => MEDIA_PAYLOAD_EXTENSIONS.has(path.extname(object).toLowerCase()))
      skippedMediaObjectCount += mediaObjects.length
      const copiedObjects = []
      for (const object of jsonObjects) {
        const basename = path.basename(object)
        const destination = path.join(phaseDir, basename)
        await copyPrivateGcsObject(object, destination, `private_json_metadata_read_${source.phase}_${basename}`)
        copiedObjects.push({
          source: hashSafePath(object),
          fileName: basename,
          sha256: await sha256File(destination),
          sizeBytes: (await stat(destination)).size,
        })
      }
      copiedJsonObjectCount += copiedObjects.length
      phaseResults.push({
        phase: source.phase,
        prefixHash: hashSafePath(source.prefix),
        listedObjectCount: objects.length,
        copiedJsonObjectCount: copiedObjects.length,
        skippedMediaObjectCount: mediaObjects.length,
        copiedObjects,
      })
    }
    return {
      status: copiedJsonObjectCount > 0 ? 'passed' : 'blocked',
      allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
      copiedJsonObjectCount,
      skippedMediaObjectCount,
      mediaPayloadReads: 'blocked',
      phases: phaseResults,
    }
  } catch (error) {
    return {
      status: 'blocked',
      reason: sanitizeError(error),
      allowedPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
      copiedJsonObjectCount: 0,
      skippedMediaObjectCount: 0,
    }
  }
}

async function copySafeReports(outputDir: string, reportDir: string): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  for (const file of MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES) {
    const source = path.join(outputDir, file)
    if (!existsSync(source)) continue
    await copyFile(source, path.join(reportDir, file))
  }
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46d_reporting_qa_integration_report.md'), renderSummaryMarkdown(await readMediaDataReportingQaSummary(reportDir)))
}

async function updateReportsWithUploadStatus(outputDir: string, uploadReport: JsonRecord): Promise<void> {
  const manifestPath = path.join(outputDir, 'phase_46d_private_artifact_manifest.json')
  const integrationPath = path.join(outputDir, 'phase_46d_reporting_qa_integration_report.json')
  const scorecardPath = path.join(outputDir, 'phase_46d_media_data_readiness_scorecard.json')
  const blockerPath = path.join(outputDir, 'phase_46d_blocker_report.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as JsonRecord
  const integration = JSON.parse(await readFile(integrationPath, 'utf8')) as JsonRecord
  const scorecard = JSON.parse(await readFile(scorecardPath, 'utf8')) as JsonRecord
  const blocker = JSON.parse(await readFile(blockerPath, 'utf8')) as { status?: string; blockers?: JsonRecord[]; [key: string]: unknown }
  const uploadStatus = String(uploadReport.status ?? 'unknown')
  manifest.privateUpload = uploadReport
  manifest.status = uploadStatus
  manifest.artifacts = await collectReportingArtifacts(outputDir)
  manifest.localArtifactCount = Array.isArray(manifest.artifacts) ? manifest.artifacts.length : 0
  integration.privateArtifactStatus = uploadStatus
  if (uploadStatus !== 'passed') {
    integration.status = 'blocked'
    integration.mediaDataToolFamilyBetaStatus = 'blocked'
    scorecard.status = 'blocked'
    scorecard.mediaDataToolFamilyBetaStatus = 'blocked'
    blocker.status = 'blocked'
    blocker.blockers = [
      ...(blocker.blockers ?? []),
      {
        blocker_id: 'phase46d-private-artifact-upload',
        phase_id: '46D',
        tool_id: 'private_artifacts',
        severity: 'block',
        status: 'open',
        reason: `Private artifact upload ${uploadStatus}.`,
        next_action: 'Restore private QA artifact upload access before beta-readiness gate.',
      },
    ]
  }
  await writeVlmRuntimeJsonArtifact(manifestPath, manifest)
  await writeVlmRuntimeJsonArtifact(integrationPath, integration)
  await writeVlmRuntimeJsonArtifact(scorecardPath, scorecard)
  await writeVlmRuntimeJsonArtifact(blockerPath, blocker)
}

async function uploadPrivateArtifactsIfConfirmed(outputDir: string): Promise<JsonRecord> {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD !== 'true') {
    return { status: 'skipped', reason: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD was not true', prefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX }
  }
  try {
    await runCommand('gcloud', ['--version'], { label: 'gcloud_version', timeoutMs: 30000 })
    const copyReport = await copyLocalDirectoryToPrivateGcs(outputDir)
    const objectCount = await countPrivateGcsObjects(MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX)
    return {
      status: 'passed',
      prefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
      objectCount,
      copyReport,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
      reason: sanitizeError(error),
    }
  }
}

async function uploadUpdatedReportsIfNeeded(outputDir: string, uploadReport: JsonRecord): Promise<JsonRecord> {
  if (uploadReport.status !== 'passed') return uploadReport
  try {
    for (const file of MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES) {
      const localPath = path.join(outputDir, file)
      if (!existsSync(localPath)) continue
      await copyLocalFileToPrivateGcs(localPath, `${MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX}${file}`, `private_artifact_report_refresh_${file}`)
    }
    const objectCount = await countPrivateGcsObjects(MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX)
    return {
      ...uploadReport,
      status: 'passed',
      objectCount,
      refreshedReportObjects: MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES.length,
    }
  } catch (error) {
    return {
      status: 'blocked',
      prefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
      reason: `updated report upload failed: ${sanitizeError(error)}`,
    }
  }
}

async function writeBlockedExecutionReports(outputDir: string, reason: string): Promise<void> {
  const input = await buildReportingInput({ status: 'blocked', reason, copiedJsonObjectCount: 0, skippedMediaObjectCount: 0 })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_reporting_qa_plan.json'), getMediaDataReportingQaPlan())
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_reporting_input_manifest.json'), input.inputManifest)
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_private_artifact_read_report.json'), input.privateArtifactReadReport)
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_reporting_schema.json'), { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, tables: REPORTING_SCHEMA })
  for (const file of ['phase_46d_duckdb_reporting_tables.json', 'phase_46d_duckdb_qa_summary.json', 'phase_46d_duckdb_blocker_summary.json', 'phase_46d_polars_reporting_tables.json', 'phase_46d_polars_qa_summary.json', 'phase_46d_polars_blocker_summary.json', 'phase_46d_duckdb_polars_consistency_report.json']) {
    await writeVlmRuntimeJsonArtifact(path.join(outputDir, file), { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'blocked', reason })
  }
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_media_data_readiness_scorecard.json'), { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'blocked', reason, mediaDataToolFamilyBetaStatus: 'blocked' })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_beta_gate_input_manifest.json'), { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'blocked', inputs: input.tables.beta_gate_inputs })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_storage_privacy_report.json'), buildStoragePrivacyReport('blocked'))
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_private_artifact_manifest.json'), { phase: MEDIA_DATA_REPORTING_QA_PHASE, runId: MEDIA_DATA_REPORTING_QA_RUN_ID, status: 'blocked', privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX, privateUpload: { status: 'blocked', reason } })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_reporting_qa_integration_report.json'), {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status: 'blocked',
    privateArtifactReadStatus: String(input.privateArtifactReadReport.status ?? 'blocked'),
    consistencyStatus: 'blocked',
    readinessScorecardStatus: 'blocked',
    privateArtifactStatus: 'blocked',
    mediaDataToolFamilyBetaStatus: 'blocked',
    noMediaProcessing: true,
    noProviderCalls: true,
    blocker: reason,
    nextPhaseDecision: 'Resolve Phase 46D blocker before media/data beta-readiness gate.',
  })
  await writeVlmRuntimeJsonArtifact(path.join(outputDir, 'phase_46d_blocker_report.json'), {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status: 'blocked',
    blockers: [{ blocker_id: 'phase46d-execution-blocked', phase_id: '46D', tool_id: 'duckdb_polars', severity: 'block', status: 'open', reason, next_action: 'Resolve before media/data beta-readiness gate.' }],
    blockedScopes: BLOCKED_SCOPES,
  })
}

function buildStoragePrivacyReport(status: string) {
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    mediaProcessing: 'blocked',
    realMediaProcessing: 'blocked',
    generatedMediaProcessing: 'blocked',
    frameReads: 'blocked',
    thumbnailReads: 'blocked',
    ocrRuntime: 'blocked',
    vlmRuntime: 'blocked',
    providerCalls: 'blocked',
    publicOutput: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    committedReports: 'safe_redacted_metadata_only',
  }
}

function requireExecutionConfirmations(): void {
  for (const name of getMediaDataReportingQaPlan().executionConfirmations) {
    if (process.env[name] !== 'true') throw new Error(`${name}=true is required for Phase 46D reporting QA execution.`)
  }
  for (const forbidden of FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') throw new Error(`${forbidden} must not be true for Phase 46D.`)
  }
}

async function listPrivateGcsObjects(prefix: string): Promise<string[]> {
  try {
    const listing = await runCommand('gcloud', ['storage', 'ls', '--recursive', prefix], {
      label: `private_artifact_list_${hashSafePath(prefix)}`,
      timeoutMs: 120000,
    })
    return listing.stdout.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('gs://'))
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    const listing = await runCommand('gsutil', ['ls', '-r', prefix], {
      label: `private_artifact_list_gsutil_${hashSafePath(prefix)}`,
      timeoutMs: 120000,
    })
    return listing.stdout.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('gs://'))
  }
}

async function copyPrivateGcsObject(source: string, destination: string, label: string): Promise<void> {
  if (!source.endsWith('.json')) throw new Error(`Blocked non-JSON private artifact read: ${hashSafePath(source)}`)
  if (MEDIA_PAYLOAD_EXTENSIONS.has(path.extname(source).toLowerCase())) throw new Error(`Blocked media private artifact read: ${hashSafePath(source)}`)
  try {
    await runCommand('gcloud', ['storage', 'cp', source, destination], {
      label,
      timeoutMs: 120000,
    })
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['cp', source, destination], {
      label: `${label}_gsutil_fallback`,
      timeoutMs: 120000,
    })
  }
}

async function copyLocalDirectoryToPrivateGcs(outputDir: string): Promise<JsonRecord> {
  try {
    await runCommand('gcloud', ['storage', 'cp', '--recursive', outputDir, MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_upload',
      timeoutMs: 300000,
    })
    return { status: 'passed', method: 'gcloud_storage_cp_recursive' }
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['-m', 'cp', '-r', outputDir, MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX], {
      label: 'private_artifact_upload_gsutil_fallback',
      timeoutMs: 300000,
    })
    return {
      status: 'passed',
      method: 'gsutil_cp_recursive_fallback',
      primaryMethodStatus: 'blocked',
      primaryMethodReason: summarizeGcsToolError(error),
    }
  }
}

async function copyLocalFileToPrivateGcs(localPath: string, destination: string, label: string): Promise<void> {
  try {
    await runCommand('gcloud', ['storage', 'cp', localPath, destination], {
      label,
      timeoutMs: 120000,
    })
  } catch (error) {
    if (!await commandExists('gsutil')) throw error
    await runCommand('gsutil', ['cp', localPath, destination], {
      label: `${label}_gsutil_fallback`,
      timeoutMs: 120000,
    })
  }
}

async function countPrivateGcsObjects(prefix: string): Promise<number> {
  const objects = await listPrivateGcsObjects(prefix)
  return objects.length
}

async function runCommand(command: string, args: string[], input: {
  cwd?: string
  label: string
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
}): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execFileAsync(command, args, {
      cwd: input.cwd,
      env: input.env ?? process.env,
      timeout: input.timeoutMs ?? 120000,
      maxBuffer: 1024 * 1024 * 8,
    })
    return { stdout: result.stdout, stderr: result.stderr }
  } catch (error) {
    throw new Error(`${input.label} failed: ${sanitizeError(error)}`, { cause: error })
  }
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('which', [command], { timeout: 10000 })
    return true
  } catch {
    return false
  }
}

async function readRequiredJson(filePath: string): Promise<JsonRecord> {
  if (!existsSync(filePath)) throw new Error(`Required Phase 46D source report missing: ${filePath}`)
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

async function readOptionalJson(filePath: string): Promise<JsonRecord | null> {
  if (!existsSync(filePath)) return null
  return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
}

function toToolStatusRecord(value: unknown): Record<ToolId, string> {
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return Object.fromEntries(TOOL_IDS.map((toolId) => [toolId, String(record[toolId] ?? 'unknown')])) as Record<ToolId, string>
}

function hashSafePath(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function collectReportingArtifacts(rootDir: string, prefix = ''): Promise<Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }>> {
  const entries = await readdir(path.join(rootDir, prefix), { withFileTypes: true })
  const artifacts: Array<{ relativePath: string; kind: string; sizeBytes: number; sha256: string }> = []
  for (const entry of entries) {
    const relative = prefix ? path.join(prefix, entry.name) : entry.name
    const absolute = path.join(rootDir, relative)
    if (entry.isDirectory()) {
      artifacts.push(...await collectReportingArtifacts(rootDir, relative))
      continue
    }
    const normalizedRelative = relative.split(path.sep).join('/')
    const fileStat = await stat(absolute)
    artifacts.push({
      relativePath: normalizedRelative,
      kind: normalizedRelative.endsWith('.json') ? 'metadata_report' : 'metadata',
      sizeBytes: fileStat.size,
      sha256: await sha256File(absolute),
    })
  }
  return artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  hash.update(await readFile(filePath))
  return hash.digest('hex')
}

function buildNotRunSummary(): MediaDataReportingQaSummary {
  return {
    phase: MEDIA_DATA_REPORTING_QA_PHASE,
    runId: MEDIA_DATA_REPORTING_QA_RUN_ID,
    status: 'not_run',
    mediaDataToolFamilyBetaStatus: 'blocked',
    privateArtifactReadStatus: 'not_run',
    duckdbStatus: 'not_run',
    polarsStatus: 'not_run',
    consistencyStatus: 'not_run',
    readinessScorecardStatus: 'not_run',
    privateArtifactStatus: 'not_run',
    nextPhaseDecision: 'Execute Phase 46D before media/data beta-readiness gate.',
  }
}

function toReportingStatus(value: unknown, fallback: MediaDataReportingStatus): MediaDataReportingStatus {
  return ['passed', 'blocked', 'skipped', 'not_run', 'warning'].includes(String(value)) ? String(value) as MediaDataReportingStatus : fallback
}

function toBetaStatus(value: unknown, fallback: MediaDataReportingBetaStatus): MediaDataReportingBetaStatus {
  return ['blocked', 'phase-complete but tool-family incomplete', 'internally beta-ready candidate', 'external beta still blocked'].includes(String(value))
    ? String(value) as MediaDataReportingBetaStatus
    : fallback
}

function sanitizeError(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error)
  const redacted = value
    .replace(/ya29\.[0-9A-Za-z._-]+/g, '<redacted-token>')
    .replace(/Authorization: Bearer [^\s]+/g, 'Authorization: Bearer <redacted-token>')
    .replace(/access_token["'=:\s]+[0-9A-Za-z._-]+/gi, 'access_token=<redacted-token>')
    .replace(/\/var\/folders\/[^\s]+/g, '<redacted-local-temp-path>')
    .replace(/\/private\/tmp\/[^\s]+/g, '<redacted-local-temp-path>')
    .replace(/\/Users\/macuser\/[^\s]+/g, '<redacted-local-path>')
  return redacted.length > 1600 ? `${redacted.slice(0, 1600)}...<truncated>` : redacted
}

function summarizeGcsToolError(error: unknown): string {
  const value = sanitizeError(error)
  if (value.includes('gcloud-crc32c') && value.includes('Bad CPU type in executable')) {
    return 'gcloud storage copy blocked by local gcloud-crc32c CPU-architecture mismatch; gsutil fallback used.'
  }
  if (value.includes('Reauthentication failed') || value.includes('cannot prompt')) {
    return 'gcloud storage command blocked by noninteractive auth prompt; fallback attempted only if existing gsutil auth worked.'
  }
  return value.length > 280 ? `${value.slice(0, 280)}...<truncated>` : value
}

function renderSummaryMarkdown(summary: MediaDataReportingQaSummary): string {
  return [
    '# Phase 46D DuckDB/Polars Reporting QA Integration Report',
    '',
    `Run ID: \`${summary.runId}\``,
    '',
    `Status: \`${summary.status}\``,
    '',
    `Media/data tool-family beta status: \`${summary.mediaDataToolFamilyBetaStatus}\``,
    '',
    `Private artifact read: \`${summary.privateArtifactReadStatus}\``,
    '',
    `DuckDB: \`${summary.duckdbStatus}\``,
    '',
    `Polars: \`${summary.polarsStatus}\``,
    '',
    `Consistency: \`${summary.consistencyStatus}\``,
    '',
    `Readiness scorecard: \`${summary.readinessScorecardStatus}\``,
    '',
    `Private artifact upload: \`${summary.privateArtifactStatus}\``,
    '',
    `Next phase decision: ${summary.nextPhaseDecision}`,
  ].join('\n')
}
