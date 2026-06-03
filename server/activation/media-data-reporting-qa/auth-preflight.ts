import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import {
  MEDIA_DATA_REPORTING_QA_PRIVATE_BUCKET,
  MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
  MEDIA_DATA_REPORTING_QA_REPORT_DIR,
  executeMediaDataReportingQa,
  readMediaDataReportingQaSummary,
} from '.'
import {
  writeVlmRuntimeJsonArtifact,
  writeVlmRuntimeTextArtifact,
} from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'

const execFileAsync = promisify(execFile)

type ProbeStatus = 'passed' | 'failed' | 'blocked' | 'skipped' | 'not_run'
type AuthPath =
  | 'active_account'
  | 'configured_impersonation'
  | 'explicit_impersonation'
  | 'access_token_file'
  | 'env_access_token'
  | 'wif_credential_file'
  | 'attached_service_account'
  | 'none'

interface CommandProbe {
  id: string
  status: ProbeStatus
  command: string
  durationMs: number
  outputSummary?: string
  errorSummary?: string
}

interface AuthPreflightReport {
  phase: '46D-AUTH-RERUN'
  reportId: 'phase_46d_auth_preflight_report'
  runId: string
  createdAt: string
  status: ProbeStatus
  authPathUsed: AuthPath
  activePrincipal: string
  tokenOutput: 'not_printed'
  serviceAccountKey: 'not_used_not_created'
  sanitizedConfig: Record<string, unknown>
  environmentPresence: Record<string, boolean>
  probes: CommandProbe[]
  permissionPreflight: Record<string, unknown>
  blockers: string[]
  warnings: string[]
}

interface AuthRerunResult {
  phase: '46D-AUTH-RERUN'
  runId: string
  status: ProbeStatus
  authPreflight: AuthPreflightReport
  localArtifactDir: string
  privateArtifactPrefix: string
  mediaDataToolFamilyBetaStatus: 'blocked' | 'phase-complete but tool-family incomplete'
  blockers: string[]
  warnings: string[]
}

type JsonRecord = Record<string, unknown>

const PROJECT_ID = 'reeditpro'
const TOOL_READY_SA = 'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com'
const TOKEN_OUTPUT = 'not_printed'
const AUTH_RERUN_RUN_ID = 'phase46d-auth-rerun-duckdb-polars-reporting-qa-20260603'
const PHASE_46B_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603/'
const PHASE_46C_PRIVATE_GCS_PREFIX = 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603/'
const MEDIA_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.tiff', '.bmp'])
const AUTH_REPORT_FILES = [
  'phase_46d_auth_preflight_plan.json',
  'phase_46d_auth_preflight_report.json',
  'phase_46d_auth_failure_report.json',
  'phase_46d_operator_auth_action_runbook.md',
  'phase_46d_auth_rerun_permission_preflight.json',
  'phase_46d_private_metadata_access_report.json',
  'phase_46d_auth_rerun_reporting_input_manifest.json',
  'phase_46d_auth_rerun_duckdb_reporting_tables.json',
  'phase_46d_auth_rerun_polars_reporting_tables.json',
  'phase_46d_auth_rerun_consistency_report.json',
  'phase_46d_auth_rerun_readiness_scorecard.json',
  'phase_46d_auth_rerun_private_artifact_manifest.json',
  'phase_46d_auth_rerun_recovery_report.json',
]

const AUTH_FORBIDDEN_CONFIRMATIONS = [
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

export function getMediaDataReportingQaAuthPreflightPlan() {
  return {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_preflight_plan',
    runId: AUTH_RERUN_RUN_ID,
    sourcePhase39cDecisionPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/120',
    sourcePhase46aPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/123',
    sourcePhase46bPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/125',
    sourcePhase46cPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/128',
    sourcePhase46dPr: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/132',
    defaultMode: 'non_mutating_until_execute_confirmation',
    requiredConfirmationForAuthPreflightExecute: 'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT',
    requiredConfirmationForReportingRerun: 'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA',
    requiredConfirmationForPrivateMetadataRead: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ',
    requiredConfirmationForPrivateArtifactUpload: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
    preferredImpersonationServiceAccount: TOOL_READY_SA,
    authResolutionOrder: [
      'existing_active_noninteractive_gcloud_account',
      'configured_auth_impersonate_service_account',
      'REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT_explicit_flag',
      'REEDITPRO_GCP_ACCESS_TOKEN_FILE_or_auth_access_token_file',
      'CLOUDSDK_AUTH_ACCESS_TOKEN',
      'REEDITPRO_GCP_WIF_CREDENTIAL_FILE_or_GOOGLE_APPLICATION_CREDENTIALS',
      'attached_service_account_environment',
      'blocked_operator_action_required',
    ],
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKeys: 'blocked_not_created_not_committed',
    browserLoginInsideCodex: 'blocked',
    allowedPrivateReadPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    privateReads: 'json_metadata_only',
    mediaProcessing: 'blocked',
    permissionChecks: permissionProbeIds(),
    authRerunReportFiles: AUTH_REPORT_FILES,
    packageLockPolicy: 'unchanged',
    mediaDataToolFamilyBetaStatus: 'blocked',
    blockedScopes: blockedScopes(),
  }
}

export async function writeMediaDataReportingQaAuthStaticArtifacts(reportDir = MEDIA_DATA_REPORTING_QA_REPORT_DIR): Promise<void> {
  const createdAt = new Date().toISOString()
  await mkdir(reportDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_auth_preflight_plan.json'), getMediaDataReportingQaAuthPreflightPlan())
  const preflight = buildBlockedAuthPreflight({ runId: AUTH_RERUN_RUN_ID, createdAt, blocker: 'auth_preflight_not_run' })
  await writeAuthPreflightArtifacts(reportDir, preflight)
  await writeAuthRerunBlockedArtifacts({
    reportDir,
    runId: AUTH_RERUN_RUN_ID,
    createdAt,
    authPreflight: preflight,
    metadataAccessReport: buildPrivateMetadataAccessReport({
      runId: AUTH_RERUN_RUN_ID,
      createdAt,
      status: 'not_run',
      blockers: ['auth_preflight_not_run'],
      warnings: [],
      probes: [],
    }),
    blockers: ['auth_preflight_not_run'],
    warnings: [],
  })
}

export async function readMediaDataReportingQaAuthRerunSummary(reportDir = MEDIA_DATA_REPORTING_QA_REPORT_DIR): Promise<JsonRecord> {
  try {
    return JSON.parse(await readFile(path.join(reportDir, 'phase_46d_auth_rerun_recovery_report.json'), 'utf8')) as JsonRecord
  } catch {
    return {
      phase: '46D-AUTH-RERUN',
      runId: AUTH_RERUN_RUN_ID,
      status: 'blocked',
      authStatus: 'not_run',
      privateMetadataReadStatus: 'not_run',
      duckdbStatus: 'not_run',
      polarsStatus: 'not_run',
      consistencyStatus: 'not_run',
      privateArtifactStatus: 'not_run',
      mediaDataToolFamilyBetaStatus: 'blocked',
      blockers: ['auth_rerun_report_missing'],
    }
  }
}

export async function runMediaDataReportingQaAuthPreflight(input: {
  execute: boolean
  reportDir?: string
  runId?: string
}): Promise<AuthPreflightReport> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 46D auth preflight.')
  requireAuthPreflightConfirmation()
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? AUTH_RERUN_RUN_ID
  const reportDir = input.reportDir ?? MEDIA_DATA_REPORTING_QA_REPORT_DIR
  await mkdir(reportDir, { recursive: true })
  const report = await buildAuthPreflightReport({ runId, createdAt })
  await writeAuthPreflightArtifacts(reportDir, report)
  return report
}

export async function runMediaDataReportingQaAuthRerun(input: {
  execute: boolean
  keepTemp?: boolean
  reportDir?: string
  runId?: string
}): Promise<AuthRerunResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 46D auth rerun.')
  requireAuthPreflightConfirmation()
  requireReportingRerunConfirmations()
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? AUTH_RERUN_RUN_ID
  const reportDir = input.reportDir ?? MEDIA_DATA_REPORTING_QA_REPORT_DIR
  await mkdir(reportDir, { recursive: true })
  const authPreflight = await buildAuthPreflightReport({ runId, createdAt })
  await writeAuthPreflightArtifacts(reportDir, authPreflight)

  if (authPreflight.status !== 'passed') {
    const metadataAccessReport = buildPrivateMetadataAccessReport({
      runId,
      createdAt,
      status: 'blocked',
      blockers: authPreflight.blockers,
      warnings: authPreflight.warnings,
      probes: [],
    })
    return writeAuthRerunBlockedArtifacts({
      reportDir,
      runId,
      createdAt,
      authPreflight,
      metadataAccessReport,
      blockers: authPreflight.blockers,
      warnings: authPreflight.warnings,
    })
  }

  const metadataAccessReport = await runPrivateMetadataAccessPreflight({ runId, createdAt, reportDir })
  if (metadataAccessReport.status !== 'passed') {
    return writeAuthRerunBlockedArtifacts({
      reportDir,
      runId,
      createdAt,
      authPreflight,
      metadataAccessReport,
      blockers: asStringArray(metadataAccessReport.blockers),
      warnings: [...authPreflight.warnings, ...asStringArray(metadataAccessReport.warnings)],
    })
  }

  const summary = await executeMediaDataReportingQa({ reportDir, keepTemp: input.keepTemp })
  await writeAuthRerunPassedOrBlockedArtifacts({ reportDir, runId, createdAt, authPreflight, metadataAccessReport })
  const recovery = await readMediaDataReportingQaAuthRerunSummary(reportDir)
  return {
    phase: '46D-AUTH-RERUN',
    runId,
    status: String(recovery.status ?? summary.status) as ProbeStatus,
    authPreflight,
    localArtifactDir: reportDir,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    mediaDataToolFamilyBetaStatus: String(recovery.mediaDataToolFamilyBetaStatus ?? summary.mediaDataToolFamilyBetaStatus) as AuthRerunResult['mediaDataToolFamilyBetaStatus'],
    blockers: asStringArray(recovery.blockers),
    warnings: asStringArray(recovery.warnings),
  }
}

async function buildAuthPreflightReport(input: {
  runId: string
  createdAt: string
}): Promise<AuthPreflightReport> {
  const probes: CommandProbe[] = []
  const blockers: string[] = []
  const warnings: string[] = []

  const versionProbe = await probeGcloud('gcloud_version', ['--version'], { includeOutputSummary: true, prependAuthArgs: false })
  probes.push(versionProbe)
  if (versionProbe.status !== 'passed') blockers.push('gcloud_cli_unavailable')

  const accountProbe = await probeGcloud('active_account', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], { includeOutputSummary: true })
  probes.push(accountProbe)
  const activePrincipal = accountProbe.status === 'passed' ? lastNonEmptyLine(accountProbe.outputSummary ?? '') || 'none' : 'unavailable'

  const projectProbe = await probeGcloud('active_project', ['config', 'get-value', 'project'], { includeOutputSummary: true })
  probes.push(projectProbe)
  const project = projectProbe.status === 'passed' ? lastNonEmptyLine(projectProbe.outputSummary ?? '') : ''
  if (project !== PROJECT_ID) blockers.push(`gcloud_project_mismatch:${project || 'unset'}`)

  const configProbe = await probeGcloud('sanitized_config', ['config', 'list', '--format=json'], { includeOutputSummary: true })
  probes.push(configProbe)
  const sanitizedConfig = parseAndSanitizeConfig(configProbe.outputSummary)
  const configuredImpersonation = readNestedString(sanitizedConfig, ['auth', 'impersonate_service_account'])
  const configuredTokenFile = readNestedString(sanitizedConfig, ['auth', 'access_token_file'])
  const authPathUsed = resolveAuthPath({ configuredImpersonation, configuredTokenFile })

  const tokenProbe = await probeGcloud('print_access_token_redacted', ['auth', 'print-access-token'], { suppressOutput: true })
  probes.push(tokenProbe)
  if (tokenProbe.status !== 'passed') blockers.push(`noninteractive_access_token_unavailable:${tokenProbe.errorSummary ?? 'unknown'}`)

  const adcProbe = await probeGcloud('adc_print_access_token_redacted', ['auth', 'application-default', 'print-access-token'], { suppressOutput: true })
  probes.push(adcProbe)
  if (adcProbe.status !== 'passed') warnings.push(`application_default_credentials_token_unavailable:${adcProbe.errorSummary ?? 'unknown'}`)

  const permissionProbes = await runPermissionProbes()
  probes.push(...permissionProbes)
  const permissionBlockers = permissionProbes
    .filter((probe) => probe.status !== 'passed')
    .map((probe) => `permission_preflight_failed:${probe.id}:${probe.errorSummary ?? 'unknown'}`)
  blockers.push(...permissionBlockers)

  const uniqueBlockers = Array.from(new Set(blockers))
  const uniqueWarnings = Array.from(new Set(warnings))
  return {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_preflight_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: uniqueBlockers.length ? 'blocked' : 'passed',
    authPathUsed: uniqueBlockers.length ? 'none' : authPathUsed,
    activePrincipal,
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKey: 'not_used_not_created',
    sanitizedConfig,
    environmentPresence: environmentPresence(),
    probes,
    permissionPreflight: {
      status: permissionBlockers.length ? 'blocked' : 'passed',
      project: PROJECT_ID,
      probes: permissionProbes.map(({ id, status, errorSummary }) => ({ id, status, errorSummary })),
      blockers: permissionBlockers,
    },
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  }
}

async function runPermissionProbes(): Promise<CommandProbe[]> {
  return [
    await probeGcloud('qa_artifacts_bucket_describe', ['storage', 'buckets', 'describe', `gs://${MEDIA_DATA_REPORTING_QA_PRIVATE_BUCKET}`, '--format=json'], { suppressOutput: true }),
    await probeGcloud('phase46b_exact_metadata_prefix_list', ['storage', 'ls', '--recursive', PHASE_46B_PRIVATE_GCS_PREFIX], { suppressOutput: true }),
    await probeGcloud('phase46c_exact_metadata_prefix_list', ['storage', 'ls', '--recursive', PHASE_46C_PRIVATE_GCS_PREFIX], { suppressOutput: true }),
  ]
}

async function runPrivateMetadataAccessPreflight(input: {
  runId: string
  createdAt: string
  reportDir: string
}): Promise<JsonRecord> {
  const probes: CommandProbe[] = []
  const blockers: string[] = []
  const warnings: string[] = []
  for (const source of [
    { phase: '46B', prefix: PHASE_46B_PRIVATE_GCS_PREFIX },
    { phase: '46C', prefix: PHASE_46C_PRIVATE_GCS_PREFIX },
  ]) {
    const listProbe = await probeGcloud(`${source.phase.toLowerCase()}_json_metadata_list`, ['storage', 'ls', '--recursive', source.prefix], { includeOutputSummary: true })
    const listedObjects = listProbe.status === 'passed' ? parseGcsObjectList(listProbe.outputSummary ?? '') : []
    const mediaObjects = listedObjects.filter((object) => MEDIA_EXTENSIONS.has(path.extname(object).toLowerCase()))
    const jsonObjects = listedObjects.filter((object) => object.endsWith('.json'))
    probes.push({
      ...listProbe,
      outputSummary: listProbe.status === 'passed'
        ? `listed=${listedObjects.length};json=${jsonObjects.length};mediaSkipped=${mediaObjects.length}`
        : listProbe.outputSummary,
    })
    if (listProbe.status !== 'passed') blockers.push(`${source.phase.toLowerCase()}_private_metadata_list_failed:${listProbe.errorSummary ?? 'unknown'}`)
    if (jsonObjects.length === 0 && listProbe.status === 'passed') blockers.push(`${source.phase.toLowerCase()}_private_json_metadata_missing`)
  }

  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD === 'true') {
    const probePath = path.join(os.tmpdir(), `${input.runId}-metadata-upload-probe.json`)
    await writeFile(probePath, JSON.stringify({
      phase: '46D-AUTH-RERUN',
      runId: input.runId,
      createdAt: input.createdAt,
      probe: 'metadata_only_upload_access',
      mediaPayload: false,
      tokenOutput: TOKEN_OUTPUT,
    }, null, 2))
    const destination = `${MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX}phase_46d_auth_rerun_upload_probe.json`
    const uploadProbe = await probeGcloud('phase46d_metadata_upload_probe', ['storage', 'cp', probePath, destination], { suppressOutput: true })
    probes.push(uploadProbe)
    if (uploadProbe.status !== 'passed') blockers.push(`phase46d_private_metadata_upload_failed:${uploadProbe.errorSummary ?? 'unknown'}`)
  } else {
    probes.push({
      id: 'phase46d_metadata_upload_probe',
      status: 'skipped',
      command: 'gcloud storage cp <metadata-probe> <phase46d-private-prefix>',
      durationMs: 0,
      errorSummary: 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD was not true',
    })
    blockers.push('phase46d_private_metadata_upload_confirmation_missing')
  }

  const report = buildPrivateMetadataAccessReport({
    runId: input.runId,
    createdAt: input.createdAt,
    status: blockers.length ? 'blocked' : 'passed',
    blockers,
    warnings,
    probes,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_private_metadata_access_report.json'), report)
  return report
}

function buildPrivateMetadataAccessReport(input: {
  runId: string
  createdAt: string
  status: ProbeStatus
  blockers: string[]
  warnings: string[]
  probes: CommandProbe[]
}) {
  return {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_private_metadata_access_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: input.status,
    allowedPrivateReadPrefixes: [PHASE_46B_PRIVATE_GCS_PREFIX, PHASE_46C_PRIVATE_GCS_PREFIX],
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    privateReads: 'json_metadata_only',
    mediaFileReads: 'blocked',
    frameReads: 'blocked',
    thumbnailReads: 'blocked',
    broadBucketReads: 'blocked',
    signedUrlsAsSourceOfTruth: 'blocked',
    probes: input.probes,
    blockers: Array.from(new Set(input.blockers)),
    warnings: Array.from(new Set(input.warnings)),
  }
}

async function writeAuthPreflightArtifacts(reportDir: string, report: AuthPreflightReport): Promise<void> {
  await mkdir(reportDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_auth_preflight_plan.json'), getMediaDataReportingQaAuthPreflightPlan())
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_auth_preflight_report.json'), report)
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_auth_failure_report.json'), authFailureReport(report))
  await writeVlmRuntimeTextArtifact(path.join(reportDir, 'phase_46d_operator_auth_action_runbook.md'), renderOperatorRunbook(report))
  await writeVlmRuntimeJsonArtifact(path.join(reportDir, 'phase_46d_auth_rerun_permission_preflight.json'), {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_rerun_permission_preflight',
    runId: report.runId,
    createdAt: report.createdAt,
    status: report.permissionPreflight.status,
    authPathUsed: report.authPathUsed,
    activePrincipal: report.activePrincipal,
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKey: 'not_used_not_created',
    probes: report.permissionPreflight.probes,
    blockers: report.permissionPreflight.blockers,
  })
}

async function writeAuthRerunPassedOrBlockedArtifacts(input: {
  reportDir: string
  runId: string
  createdAt: string
  authPreflight: AuthPreflightReport
  metadataAccessReport: JsonRecord
}): Promise<void> {
  const mainSummary = await readMediaDataReportingQaSummary(input.reportDir)
  const mainReports = await readMainPhase46dReports(input.reportDir)
  const blockers = collectRerunBlockers(input.authPreflight, input.metadataAccessReport, mainReports)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_reporting_input_manifest.json'), {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_rerun_reporting_input_manifest',
    runId: input.runId,
    createdAt: input.createdAt,
    authPreflight: summarizeAuth(input.authPreflight),
    privateMetadataAccess: input.metadataAccessReport,
    sourcePhase46dInputManifest: mainReports.inputManifest,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_duckdb_reporting_tables.json'), mainReports.duckdbTables)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_polars_reporting_tables.json'), mainReports.polarsTables)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_consistency_report.json'), mainReports.consistency)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_readiness_scorecard.json'), mainReports.scorecard)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_private_artifact_manifest.json'), mainReports.privateManifest)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_recovery_report.json'), {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_rerun_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: mainSummary.status,
    auth: summarizeAuth(input.authPreflight),
    privateMetadataAccess: input.metadataAccessReport,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    privateArtifactReadStatus: mainSummary.privateArtifactReadStatus,
    privateArtifactStatus: mainSummary.privateArtifactStatus,
    duckdbStatus: mainSummary.duckdbStatus,
    polarsStatus: mainSummary.polarsStatus,
    consistencyStatus: mainSummary.consistencyStatus,
    readinessScorecardStatus: mainSummary.readinessScorecardStatus,
    mediaDataToolFamilyBetaStatus: mainSummary.mediaDataToolFamilyBetaStatus,
    noMediaProcessing: true,
    noProviderCalls: true,
    noVlmRuntimeRetry: true,
    noOcrRuntime: true,
    trackA: 'not_touched',
    blockers,
    warnings: [...input.authPreflight.warnings, ...collectTrackedWarnings(mainReports)],
    nextPhaseDecision: mainSummary.status === 'passed'
      ? 'Proceed to media/data internal beta-readiness gate, Phase 46E.'
      : 'Resolve Phase 46D auth-rerun blockers before media/data beta-readiness gate.',
    blockedScopes: blockedScopes(),
  })
}

async function writeAuthRerunBlockedArtifacts(input: {
  reportDir: string
  runId: string
  createdAt: string
  authPreflight: AuthPreflightReport
  metadataAccessReport: JsonRecord
  blockers: string[]
  warnings: string[]
}): Promise<AuthRerunResult> {
  const uniqueBlockers = Array.from(new Set(input.blockers))
  const uniqueWarnings = Array.from(new Set(input.warnings))
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_private_metadata_access_report.json'), input.metadataAccessReport)
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_reporting_input_manifest.json'), {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_rerun_reporting_input_manifest',
    runId: input.runId,
    createdAt: input.createdAt,
    status: 'blocked',
    auth: summarizeAuth(input.authPreflight),
    privateMetadataAccess: input.metadataAccessReport,
    mainPhase46dExecution: 'not_run_auth_or_access_blocked',
  })
  for (const [file, subject] of [
    ['phase_46d_auth_rerun_duckdb_reporting_tables.json', 'duckdb'],
    ['phase_46d_auth_rerun_polars_reporting_tables.json', 'polars'],
    ['phase_46d_auth_rerun_consistency_report.json', 'duckdb_polars_consistency'],
    ['phase_46d_auth_rerun_readiness_scorecard.json', 'readiness_scorecard'],
    ['phase_46d_auth_rerun_private_artifact_manifest.json', 'private_artifacts'],
  ] as const) {
    await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, file), {
      phase: '46D-AUTH-RERUN',
      runId: input.runId,
      createdAt: input.createdAt,
      subject,
      status: 'blocked',
      reason: 'auth_or_private_metadata_access_preflight_blocked',
      blockers: uniqueBlockers,
    })
  }
  await writeVlmRuntimeJsonArtifact(path.join(input.reportDir, 'phase_46d_auth_rerun_recovery_report.json'), {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_rerun_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: 'blocked',
    auth: summarizeAuth(input.authPreflight),
    privateMetadataAccess: input.metadataAccessReport,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    privateArtifactStatus: 'blocked',
    duckdbStatus: 'not_run',
    polarsStatus: 'not_run',
    consistencyStatus: 'not_run',
    readinessScorecardStatus: 'blocked',
    mediaDataToolFamilyBetaStatus: 'blocked',
    noMediaProcessing: true,
    noProviderCalls: true,
    noVlmRuntimeRetry: true,
    noOcrRuntime: true,
    trackA: 'not_touched',
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    operatorActions: operatorActions(uniqueBlockers),
    nextPhaseDecision: 'Resolve Phase 46D auth/access blockers before media/data beta-readiness gate.',
    blockedScopes: blockedScopes(),
  })
  return {
    phase: '46D-AUTH-RERUN',
    runId: input.runId,
    status: 'blocked',
    authPreflight: input.authPreflight,
    localArtifactDir: input.reportDir,
    privateArtifactPrefix: MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
    mediaDataToolFamilyBetaStatus: 'blocked',
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  }
}

async function readMainPhase46dReports(reportDir: string) {
  return {
    inputManifest: await readJsonIfExists(path.join(reportDir, 'phase_46d_reporting_input_manifest.json')),
    duckdbTables: await readJsonIfExists(path.join(reportDir, 'phase_46d_duckdb_reporting_tables.json')),
    polarsTables: await readJsonIfExists(path.join(reportDir, 'phase_46d_polars_reporting_tables.json')),
    consistency: await readJsonIfExists(path.join(reportDir, 'phase_46d_duckdb_polars_consistency_report.json')),
    scorecard: await readJsonIfExists(path.join(reportDir, 'phase_46d_media_data_readiness_scorecard.json')),
    privateManifest: await readJsonIfExists(path.join(reportDir, 'phase_46d_private_artifact_manifest.json')),
    blockerReport: await readJsonIfExists(path.join(reportDir, 'phase_46d_blocker_report.json')),
  }
}

async function readJsonIfExists(filePath: string): Promise<JsonRecord> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as JsonRecord
  } catch {
    return { status: 'missing', file: path.basename(filePath) }
  }
}

function collectRerunBlockers(auth: AuthPreflightReport, metadata: JsonRecord, reports: Awaited<ReturnType<typeof readMainPhase46dReports>>): string[] {
  const blockerReportStatus = String(reports.blockerReport.status ?? 'unknown')
  const reportBlockers = Array.isArray(reports.blockerReport.blockers)
    ? reports.blockerReport.blockers.filter((entry) => {
      if (!entry || typeof entry !== 'object') return blockerReportStatus === 'blocked'
      const record = entry as JsonRecord
      return String(record.severity ?? '') === 'block' && String(record.status ?? '') !== 'tracked'
    })
    : []
  const blockers = [
    ...auth.blockers,
    ...asStringArray(metadata.blockers),
    ...asStringArray(reportBlockers),
  ]
  return Array.from(new Set(blockers))
}

function collectTrackedWarnings(reports: Awaited<ReturnType<typeof readMainPhase46dReports>>): string[] {
  if (!Array.isArray(reports.blockerReport.blockers)) return []
  return reports.blockerReport.blockers
    .filter((entry) => entry && typeof entry === 'object')
    .filter((entry) => {
      const record = entry as JsonRecord
      return String(record.severity ?? '') === 'warn' || String(record.status ?? '') === 'tracked'
    })
    .map((entry) => {
      const record = entry as JsonRecord
      return `${String(record.blocker_id ?? 'tracked-warning')}:${String(record.reason ?? 'tracked warning')}`
    })
}

function summarizeAuth(report: AuthPreflightReport) {
  return {
    status: report.status,
    authPathUsed: report.authPathUsed,
    activePrincipal: report.activePrincipal,
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKey: 'not_used_not_created',
    permissionPreflight: report.permissionPreflight,
  }
}

function authFailureReport(report: AuthPreflightReport): JsonRecord {
  return {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_failure_report',
    runId: report.runId,
    createdAt: report.createdAt,
    status: report.blockers.length ? 'blocked' : 'passed',
    authPathUsed: report.authPathUsed,
    activePrincipal: report.activePrincipal,
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKey: 'not_used_not_created',
    blockers: report.blockers,
    warnings: report.warnings,
    operatorActions: report.blockers.length ? operatorActions(report.blockers) : [],
  }
}

function buildBlockedAuthPreflight(input: { runId: string; createdAt: string; blocker: string }): AuthPreflightReport {
  return {
    phase: '46D-AUTH-RERUN',
    reportId: 'phase_46d_auth_preflight_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: 'blocked',
    authPathUsed: 'none',
    activePrincipal: 'not_checked',
    tokenOutput: TOKEN_OUTPUT,
    serviceAccountKey: 'not_used_not_created',
    sanitizedConfig: {},
    environmentPresence: environmentPresence(),
    probes: [],
    permissionPreflight: { status: 'not_run', blockers: [input.blocker] },
    blockers: [input.blocker],
    warnings: [],
  }
}

async function probeGcloud(id: string, args: string[], options: {
  suppressOutput?: boolean
  includeOutputSummary?: boolean
  prependAuthArgs?: boolean
} = {}): Promise<CommandProbe> {
  const started = Date.now()
  const finalArgs = options.prependAuthArgs === false ? args : buildGcloudArgs(args)
  try {
    const result = await execFileAsync('gcloud', finalArgs, {
      timeout: 45_000,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, CLOUDSDK_CORE_DISABLE_PROMPTS: '1' },
    })
    return {
      id,
      status: 'passed',
      command: safeCommand(finalArgs),
      durationMs: Date.now() - started,
      outputSummary: options.suppressOutput ? TOKEN_OUTPUT : options.includeOutputSummary ? summarizeSafeOutput(result.stdout) : undefined,
    }
  } catch (error) {
    return {
      id,
      status: 'failed',
      command: safeCommand(finalArgs),
      durationMs: Date.now() - started,
      errorSummary: summarizeCommandError(error),
    }
  }
}

function buildGcloudArgs(args: string[]): string[] {
  const authArgs = ['--quiet']
  const impersonate = process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT?.trim()
  if (impersonate) {
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.gserviceaccount\.com$/.test(impersonate)) {
      throw new Error('invalid_REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT_email')
    }
    authArgs.push('--impersonate-service-account', impersonate)
  }
  const accessTokenFile = process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE?.trim()
  if (accessTokenFile) authArgs.push('--access-token-file', accessTokenFile)
  return [...authArgs, ...args]
}

function requireAuthPreflightConfirmation(): void {
  if (process.env.REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT !== 'true') {
    throw new Error('env_guard_mismatch:REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT')
  }
  for (const forbidden of AUTH_FORBIDDEN_CONFIRMATIONS) {
    if (process.env[forbidden] === 'true') throw new Error(`${forbidden} must not be true for Phase 46D-AUTH-RERUN.`)
  }
}

function requireReportingRerunConfirmations(): void {
  for (const confirmation of [
    'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA',
    'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ',
    'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
  ]) {
    if (process.env[confirmation] !== 'true') throw new Error(`env_guard_mismatch:${confirmation}`)
  }
}

function permissionProbeIds(): string[] {
  return [
    'qa_artifacts_bucket_describe',
    'phase46b_exact_metadata_prefix_list',
    'phase46c_exact_metadata_prefix_list',
    'phase46d_metadata_upload_probe_when_confirmed',
  ]
}

function resolveAuthPath(input: { configuredImpersonation?: string; configuredTokenFile?: string }): AuthPath {
  if (process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT) return 'explicit_impersonation'
  if (input.configuredImpersonation) return 'configured_impersonation'
  if (process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE || input.configuredTokenFile) return 'access_token_file'
  if (process.env.CLOUDSDK_AUTH_ACCESS_TOKEN) return 'env_access_token'
  if (process.env.REEDITPRO_GCP_WIF_CREDENTIAL_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS) return 'wif_credential_file'
  if (process.env.K_SERVICE || process.env.GCE_METADATA_HOST || process.env.GOOGLE_CLOUD_PROJECT) return 'attached_service_account'
  return 'active_account'
}

function parseAndSanitizeConfig(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    return sanitizeObject(JSON.parse(value) as JsonRecord)
  } catch {
    return { parseStatus: 'unavailable' }
  }
}

function sanitizeObject(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object') return {}
  const result: JsonRecord = {}
  for (const [key, raw] of Object.entries(value as JsonRecord)) {
    if (/token|secret|credential|password|key/i.test(key)) {
      result[key] = raw ? 'set_redacted' : raw
      continue
    }
    if (typeof raw === 'string') result[key] = sanitizeScalar(raw)
    else if (raw && typeof raw === 'object') result[key] = sanitizeObject(raw)
    else result[key] = raw
  }
  return result
}

function readNestedString(value: Record<string, unknown>, keys: string[]): string | undefined {
  let current: unknown = value
  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as JsonRecord)[key]
  }
  return typeof current === 'string' && current !== 'set_redacted' ? current : undefined
}

function environmentPresence(): Record<string, boolean> {
  return {
    REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT: Boolean(process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT),
    REEDITPRO_GCP_ACCESS_TOKEN_FILE: Boolean(process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE),
    CLOUDSDK_AUTH_ACCESS_TOKEN: Boolean(process.env.CLOUDSDK_AUTH_ACCESS_TOKEN),
    REEDITPRO_GCP_WIF_CREDENTIAL_FILE: Boolean(process.env.REEDITPRO_GCP_WIF_CREDENTIAL_FILE),
    GOOGLE_APPLICATION_CREDENTIALS: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    CLOUD_SHELL: Boolean(process.env.CLOUD_SHELL),
    K_SERVICE: Boolean(process.env.K_SERVICE),
    GCE_METADATA_HOST: Boolean(process.env.GCE_METADATA_HOST),
    GOOGLE_CLOUD_PROJECT: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
  }
}

function parseGcsObjectList(output: string): string[] {
  return output.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('gs://'))
}

function safeCommand(args: string[]): string {
  return ['gcloud', ...args].map((arg) => sanitizeScalar(arg)).join(' ')
}

function summarizeSafeOutput(value: string): string {
  return sanitizeScalar(value.trim()).slice(0, 2000)
}

function summarizeCommandError(error: unknown): string {
  const err = error as { stdout?: string; stderr?: string; message?: string }
  return sanitizeScalar([err.message, err.stderr, err.stdout].filter(Boolean).join('\n')).slice(0, 2000)
}

function sanitizeScalar(value: string): string {
  return value
    .replace(/ya29\.[0-9A-Za-z._-]+/g, '<redacted-token>')
    .replace(/Authorization: Bearer [^\s]+/g, 'Authorization: Bearer <redacted-token>')
    .replace(/access_token["'=:\s]+[0-9A-Za-z._-]+/gi, 'access_token=<redacted-token>')
    .replace(/refresh_token["'=:\s]+[0-9A-Za-z._-]+/gi, 'refresh_token=<redacted-token>')
    .replace(/private_key["'=:\s]+[^,\n]+/gi, 'private_key=<redacted-secret>')
    .replace(/\/var\/folders\/[^\s]+/g, '<redacted-local-temp-path>')
    .replace(/\/private\/tmp\/[^\s]+/g, '<redacted-local-temp-path>')
    .replace(/\/Users\/macuser\/[^\s]+/g, '<redacted-local-path>')
}

function lastNonEmptyLine(value: string): string {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => typeof entry === 'string' ? entry : JSON.stringify(entry))
}

function operatorActions(blockers: string[]): string[] {
  if (!blockers.length) return []
  const actions = new Set<string>()
  for (const blocker of blockers) {
    if (blocker.includes('noninteractive_access_token_unavailable') || blocker.includes('Reauthentication') || blocker.includes('cannot prompt')) {
      actions.add('Refresh gcloud auth outside Codex with a noninteractive-safe path, or provide service-account impersonation/access-token/WIF credentials through the environment.')
    }
    if (blocker.includes('gcloud_project_mismatch')) actions.add('Set gcloud project to reeditpro for the active noninteractive auth context.')
    if (blocker.includes('permission_preflight_failed') || blocker.includes('private_metadata')) actions.add('Grant only scoped objectViewer/objectCreator permissions for the exact Phase 46B/46C/46D QA artifact prefixes, or run with an already authorized principal.')
  }
  actions.add('Do not create service-account keys, do not run browser login inside Codex, and do not grant broad Storage Admin/Object Admin roles.')
  return Array.from(actions)
}

function renderOperatorRunbook(report: AuthPreflightReport): string {
  return [
    '# Phase 46D Auth-Rerun Operator Action Runbook',
    '',
    `Status: \`${report.status}\``,
    '',
    `Auth path used: \`${report.authPathUsed}\``,
    '',
    `Active principal: \`${report.activePrincipal}\``,
    '',
    'Token output: `not_printed`',
    '',
    'Service-account key: `not_used_not_created`',
    '',
    'Allowed fixes:',
    '',
    '- Use an existing active noninteractive gcloud account.',
    '- Configure service-account impersonation for `reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com` if already permitted.',
    '- Provide a short-lived access-token file or `CLOUDSDK_AUTH_ACCESS_TOKEN` through secure environment wiring.',
    '- Provide a Workload Identity Federation credential file through secure environment wiring.',
    '- Run from Cloud Shell or a runner with an attached service account.',
    '',
    'Blocked fixes:',
    '',
    '- Do not create service-account keys.',
    '- Do not grant broad Storage Admin/Object Admin roles.',
    '- Do not run browser login inside Codex.',
    '- Do not read media, frames, thumbnails, OCR, VLM, or Track A artifacts.',
    '',
    'Current blockers:',
    '',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Recommended operator actions:',
    '',
    ...(operatorActions(report.blockers).length ? operatorActions(report.blockers).map((action) => `- ${action}`) : ['- none']),
  ].join('\n')
}

function blockedScopes(): string[] {
  return [
    'media/data beta-readiness gate until Phase 46E',
    'broad media',
    'arbitrary media paths',
    'unapproved real media',
    'media processing',
    'generated media execution',
    'controlled real-video execution',
    'frame reads',
    'thumbnail reads',
    'OCR runtime',
    'VLM runtime retries',
    'provider calls',
    'production',
    'internal beta unlock',
    'external beta',
    'paid production',
    'public output',
    'Docker',
    'Cloud Build',
    'Cloud Run',
    'GPU jobs',
    'broad IAM',
    'Track A runtime/visual/render stack',
  ]
}

function hashSafe(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function getMediaDataReportingQaAuthSmokeExpectations() {
  return {
    scripts: [
      'activation:media-data-reporting-qa:auth-preflight:plan',
      'activation:media-data-reporting-qa:auth-preflight',
      'activation:media-data-reporting-qa:auth-preflight:report',
      'activation:media-data-reporting-qa:auth-rerun',
      'activation:media-data-reporting-qa:auth-rerun:report',
      'smoke:activation-media-data-reporting-qa-auth-preflight',
    ],
    reportFiles: AUTH_REPORT_FILES,
    exactPrivateReadPrefixHashes: [hashSafe(PHASE_46B_PRIVATE_GCS_PREFIX), hashSafe(PHASE_46C_PRIVATE_GCS_PREFIX)],
    privateArtifactPrefixHash: hashSafe(MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX),
    forbiddenConfirmations: AUTH_FORBIDDEN_CONFIRMATIONS,
  }
}
