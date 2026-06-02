import { execFile } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { writeVlmRuntimeJsonArtifact } from '../vlm-runtime/vlm-runtime-artifact-manifest-writer'
import { runVlmSglangFixedKernel, VLM_SGLANG_FIXED_KERNEL_REPORT_DIR } from './fixed-kernel'

const execFileAsync = promisify(execFile)

type ProbeStatus = 'passed' | 'failed' | 'blocked' | 'skipped'
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
  readonly id: string
  readonly status: ProbeStatus
  readonly command: string
  readonly durationMs: number
  readonly outputSummary?: string
  readonly errorSummary?: string
}

interface AuthPreflightReport {
  readonly phase: '39C-SG-AUTH-RERUN'
  readonly reportId: 'phase_39c_sg_auth_preflight_report'
  readonly runId: string
  readonly createdAt: string
  readonly status: ProbeStatus
  readonly authPathUsed: AuthPath
  readonly activePrincipal: string
  readonly tokenOutput: 'not_printed'
  readonly serviceAccountKey: 'not_used_not_created'
  readonly sanitizedConfig: Record<string, unknown>
  readonly environmentPresence: Record<string, boolean>
  readonly probes: readonly CommandProbe[]
  readonly permissionPreflight: Record<string, unknown>
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
}

interface AuthRerunResult {
  readonly phase: '39C-SG-AUTH-RERUN'
  readonly runId: string
  readonly status: ProbeStatus
  readonly authPreflight: AuthPreflightReport
  readonly fixedKernelResult?: Awaited<ReturnType<typeof runVlmSglangFixedKernel>>
  readonly localArtifactDir: string
  readonly privateQaPrefix: string
  readonly blockers: readonly string[]
  readonly warnings: readonly string[]
  readonly vlmToolFamilyBetaStatus: 'blocked' | 'phase-complete but tool-family incomplete'
}

const PROJECT_ID = 'reeditpro'
const REGION = 'us-central1'
const GENERATED_ASSETS_BUCKET = 'reeditpro-staging-reeditpro-generated-assets'
const QA_BUCKET = 'reeditpro-staging-reeditpro-qa-artifacts'
const REPORT_DIR = VLM_SGLANG_FIXED_KERNEL_REPORT_DIR
const FIXED_KERNEL_QA_PREFIX = 'activation/phase39c/generated-vlm-sglang-fixed-kernel'
const AUTH_RERUN_QA_PREFIX = 'activation/phase39c/generated-vlm-sglang-auth-rerun'
const TOOL_READY_SA = 'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com'
const TOKEN_REDACTION = 'not_printed'

const PR66_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/66'
const PR87_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/87'
const PR90_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/90'
const PR97_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/97'
const PR100_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/100'
const PR104_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/104'
const PR107_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/107'
const PR110_URL = 'https://github.com/yuzastudio6-cyber/Reedkt/pull/110'

export const VLM_SGLANG_AUTH_PREFLIGHT_REPORT_DIR = REPORT_DIR

export function getVlmSgAuthPreflightPlan() {
  return {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_preflight_plan',
    createdAt: new Date().toISOString(),
    defaultMode: 'non_mutating',
    sourceEvidence: sourceEvidence(),
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
    requiredConfirmationForAuthPreflightExecute: 'REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT',
    requiredConfirmationForRerun: 'REEDITPRO_CONFIRM_VLM_SG_NONINTERACTIVE_AUTH_RERUN',
    preferredImpersonationServiceAccount: TOOL_READY_SA,
    tokenOutput: TOKEN_REDACTION,
    serviceAccountKeys: 'blocked_not_created_not_committed',
    browserLoginInsideCodex: 'blocked',
    permissionChecks: permissionProbeIds(),
    fixedKernelDelegation: {
      sourcePr: PR110_URL,
      cloudBuildImportSmokeRuntime: 'delegated_to_existing_fixed_kernel_runner_after_auth_and_permission_preflight_pass',
      privateQaPrefix: `gs://${QA_BUCKET}/${FIXED_KERNEL_QA_PREFIX}/<run-id>/`,
      authRerunMetadataPrefix: `gs://${QA_BUCKET}/${AUTH_RERUN_QA_PREFIX}/<run-id>/`,
    },
    blockedScopes: blockedScopes(),
  }
}

export function buildVlmSgAuthPreflightStaticReport() {
  return {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_recovery_report',
    createdAt: new Date().toISOString(),
    status: 'blocked',
    sourceEvidence: sourceEvidence(),
    authStatus: 'not_run',
    permissionPreflight: 'not_run',
    cloudBuild: 'not_run',
    importSmoke: 'not_run',
    generatedRuntime: 'not_run',
    selectedProfile: null,
    selectedCandidate: null,
    blockers: ['auth_preflight_not_run'],
    blockedScopes: blockedScopes(),
    vlmToolFamilyBetaStatus: 'blocked',
  }
}

export async function writeVlmSgAuthPreflightStaticArtifacts(artifactDir = REPORT_DIR): Promise<void> {
  const createdAt = new Date().toISOString()
  await mkdir(artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_auth_preflight_plan.json'), getVlmSgAuthPreflightPlan())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_auth_preflight_report.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_preflight_report',
    runId: 'not-run',
    createdAt,
    status: 'blocked',
    authPathUsed: 'none',
    activePrincipal: 'not_checked',
    tokenOutput: TOKEN_REDACTION,
    serviceAccountKey: 'not_used_not_created',
    sanitizedConfig: {},
    environmentPresence: environmentPresence(),
    probes: [],
    permissionPreflight: { status: 'not_run' },
    blockers: ['auth_preflight_not_run'],
    warnings: [],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_auth_failure_report.json'), authFailureReport({
    runId: 'not-run',
    createdAt,
    blockers: ['auth_preflight_not_run'],
    warnings: [],
    authPathUsed: 'none',
    activePrincipal: 'not_checked',
  }))
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39c_sg_auth_rerun_permission_preflight.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_permission_preflight',
    runId: 'not-run',
    createdAt,
    status: 'not_run',
    probes: [],
    blockers: ['auth_preflight_not_run'],
  })
  await writeAuthRerunBlockedArtifacts({
    runId: 'not-run',
    createdAt,
    artifactDir,
    authPreflight: null,
    fixedKernelResult: undefined,
    blockers: ['auth_preflight_not_run'],
    warnings: [],
  })
}

export async function runVlmSgAuthPreflight(input: {
  execute: boolean
  runId?: string
  artifactDir?: string
}): Promise<AuthPreflightReport> {
  if (!input.execute) throw new Error('Pass --execute to run guarded noninteractive gcloud auth preflight.')
  if (process.env.REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT !== 'true') {
    throw new Error('env_guard_mismatch:REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT')
  }
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39c-sg-auth-${timestampTag(createdAt)}`
  const artifactDir = input.artifactDir ?? REPORT_DIR
  await mkdir(artifactDir, { recursive: true })
  const report = await buildAuthPreflightReport({ runId, createdAt })
  await writeAuthPreflightArtifacts({ artifactDir, report })
  return report
}

export async function runVlmSgAuthRerun(input: {
  execute: boolean
  keepTemp?: boolean
  runId?: string
  artifactDir?: string
}): Promise<AuthRerunResult> {
  if (!input.execute) throw new Error('Pass --execute to run guarded Phase 39C-SG-AUTH-RERUN.')
  if (process.env.REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT !== 'true') {
    throw new Error('env_guard_mismatch:REEDITPRO_CONFIRM_VLM_SG_AUTH_PREFLIGHT')
  }
  if (process.env.REEDITPRO_CONFIRM_VLM_SG_NONINTERACTIVE_AUTH_RERUN !== 'true') {
    throw new Error('env_guard_mismatch:REEDITPRO_CONFIRM_VLM_SG_NONINTERACTIVE_AUTH_RERUN')
  }
  const createdAt = new Date().toISOString()
  const runId = input.runId ?? `phase39c-sg-auth-rerun-${timestampTag(createdAt)}`
  const artifactDir = input.artifactDir ?? REPORT_DIR
  await mkdir(artifactDir, { recursive: true })
  const authPreflight = await buildAuthPreflightReport({ runId, createdAt })
  await writeAuthPreflightArtifacts({ artifactDir, report: authPreflight })
  if (authPreflight.status !== 'passed') {
    return writeAuthRerunBlockedArtifacts({
      runId,
      createdAt,
      artifactDir,
      authPreflight,
      fixedKernelResult: undefined,
      blockers: authPreflight.blockers,
      warnings: authPreflight.warnings,
    })
  }
  const fixedKernelResult = await runVlmSglangFixedKernel({
    execute: true,
    keepTemp: input.keepTemp,
    runId,
    artifactDir,
  })
  const blockers = fixedKernelResult.status === 'passed' ? [] : fixedKernelResult.blockers
  const result = await writeAuthRerunBlockedArtifacts({
    runId,
    createdAt,
    artifactDir,
    authPreflight,
    fixedKernelResult,
    blockers,
    warnings: fixedKernelResult.warnings,
  })
  return {
    ...result,
    status: fixedKernelResult.status,
    fixedKernelResult,
    vlmToolFamilyBetaStatus: fixedKernelResult.vlmToolFamilyBetaStatus,
  }
}

async function buildAuthPreflightReport(input: {
  runId: string
  createdAt: string
}): Promise<AuthPreflightReport> {
  const probes: CommandProbe[] = []
  const warnings: string[] = []
  const blockers: string[] = []
  const versionProbe = await probeCommand('gcloud_version', ['--version'], { includeOutputSummary: true, prependAuthArgs: false })
  probes.push(versionProbe)
  if (versionProbe.status !== 'passed') blockers.push('gcloud_cli_unavailable')
  const activeAccountProbe = await probeGcloud('active_account', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], { includeOutputSummary: true })
  probes.push(activeAccountProbe)
  const activePrincipal = activeAccountProbe.status === 'passed' ? lastNonEmptyLine(activeAccountProbe.outputSummary ?? '') || 'none' : 'unavailable'
  const projectProbe = await probeGcloud('active_project', ['config', 'get-value', 'project'], { includeOutputSummary: true })
  probes.push(projectProbe)
  const activeProject = projectProbe.status === 'passed' ? lastNonEmptyLine(projectProbe.outputSummary ?? '') : ''
  if (activeProject !== PROJECT_ID) blockers.push(`gcloud_project_mismatch:${activeProject || 'unset'}`)
  const configProbe = await probeGcloud('sanitized_config', ['config', 'list', '--format=json'], { includeOutputSummary: true })
  probes.push(configProbe)
  const sanitizedConfig = parseAndSanitizeConfig(configProbe.outputSummary)
  const configuredImpersonation = readNestedString(sanitizedConfig, ['auth', 'impersonate_service_account'])
  const configuredTokenFile = readNestedString(sanitizedConfig, ['auth', 'access_token_file'])
  const authPathUsed = resolveAuthPath({ configuredImpersonation, configuredTokenFile })
  const tokenProbe = await probeGcloud('print_access_token_redacted', ['auth', 'print-access-token'], { suppressOutput: true })
  probes.push(tokenProbe)
  if (tokenProbe.status !== 'passed') blockers.push(`noninteractive_access_token_unavailable:${tokenProbe.errorSummary ?? 'unknown'}`)
  const adcTokenProbe = await probeGcloud('adc_print_access_token_redacted', ['auth', 'application-default', 'print-access-token'], { suppressOutput: true })
  probes.push(adcTokenProbe)
  if (adcTokenProbe.status !== 'passed') warnings.push(`application_default_credentials_token_unavailable:${adcTokenProbe.errorSummary ?? 'unknown'}`)
  const permissionProbes = await runPermissionProbes()
  probes.push(...permissionProbes)
  const permissionBlockers = permissionProbes
    .filter((probe) => probe.status !== 'passed')
    .map((probe) => `permission_preflight_failed:${probe.id}:${probe.errorSummary ?? 'unknown'}`)
  blockers.push(...permissionBlockers)
  const status: ProbeStatus = blockers.length ? 'blocked' : 'passed'
  return {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_preflight_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status,
    authPathUsed: status === 'passed' ? authPathUsed : 'none',
    activePrincipal,
    tokenOutput: TOKEN_REDACTION,
    serviceAccountKey: 'not_used_not_created',
    sanitizedConfig,
    environmentPresence: environmentPresence(),
    probes,
    permissionPreflight: {
      status: permissionBlockers.length ? 'blocked' : 'passed',
      requiredProject: PROJECT_ID,
      probes: permissionProbes.map(({ id, status, errorSummary }) => ({ id, status, errorSummary })),
      blockers: permissionBlockers,
    },
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function runPermissionProbes(): Promise<CommandProbe[]> {
  return [
    await probeGcloud('services_list', ['services', 'list', '--project', PROJECT_ID, '--limit=1', '--format=json'], { suppressOutput: true }),
    await probeGcloud('cloud_builds_list', ['builds', 'list', '--project', PROJECT_ID, '--limit=1', '--format=json'], { suppressOutput: true }),
    await probeGcloud('artifact_registry_describe', ['artifacts', 'repositories', 'describe', 'reeditpro-staging-workers', '--project', PROJECT_ID, '--location', REGION, '--format=json'], { suppressOutput: true }),
    await probeGcloud('cloud_run_jobs_list', ['run', 'jobs', 'list', '--project', PROJECT_ID, '--region', REGION, '--format=json'], { suppressOutput: true }),
    await probeGcloud('generated_assets_bucket_describe', ['storage', 'buckets', 'describe', `gs://${GENERATED_ASSETS_BUCKET}`, '--format=json'], { suppressOutput: true }),
    await probeGcloud('qa_artifacts_bucket_describe', ['storage', 'buckets', 'describe', `gs://${QA_BUCKET}`, '--format=json'], { suppressOutput: true }),
    await probeGcloud('qa_artifacts_iam_policy_read', ['storage', 'buckets', 'get-iam-policy', `gs://${QA_BUCKET}`, '--format=json'], { suppressOutput: true }),
  ]
}

function permissionProbeIds(): string[] {
  return [
    'services_list',
    'cloud_builds_list',
    'artifact_registry_describe',
    'cloud_run_jobs_list',
    'generated_assets_bucket_describe',
    'qa_artifacts_bucket_describe',
    'qa_artifacts_iam_policy_read',
  ]
}

async function writeAuthPreflightArtifacts(input: {
  artifactDir: string
  report: AuthPreflightReport
}): Promise<void> {
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_preflight_plan.json'), getVlmSgAuthPreflightPlan())
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_preflight_report.json'), input.report)
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_failure_report.json'), authFailureReport({
    runId: input.report.runId,
    createdAt: input.report.createdAt,
    blockers: input.report.blockers,
    warnings: input.report.warnings,
    authPathUsed: input.report.authPathUsed,
    activePrincipal: input.report.activePrincipal,
  }))
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_permission_preflight.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_permission_preflight',
    runId: input.report.runId,
    createdAt: input.report.createdAt,
    status: input.report.permissionPreflight.status,
    authPathUsed: input.report.authPathUsed,
    activePrincipal: input.report.activePrincipal,
    tokenOutput: TOKEN_REDACTION,
    probes: input.report.permissionPreflight.probes,
    blockers: input.report.permissionPreflight.blockers,
  })
}

async function writeAuthRerunBlockedArtifacts(input: {
  runId: string
  createdAt: string
  artifactDir: string
  authPreflight: AuthPreflightReport | null
  fixedKernelResult: Awaited<ReturnType<typeof runVlmSglangFixedKernel>> | undefined
  blockers: readonly string[]
  warnings: readonly string[]
}): Promise<AuthRerunResult> {
  const uniqueBlockers = Array.from(new Set(input.blockers))
  const uniqueWarnings = Array.from(new Set(input.warnings))
  const fixed = input.fixedKernelResult
  const status: ProbeStatus = fixed?.status === 'passed' ? 'passed' : uniqueBlockers.length ? 'blocked' : 'skipped'
  const recovery = {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_recovery_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status,
    sourceEvidence: sourceEvidence(),
    auth: input.authPreflight ? {
      status: input.authPreflight.status,
      authPathUsed: input.authPreflight.authPathUsed,
      activePrincipal: input.authPreflight.activePrincipal,
      tokenOutput: TOKEN_REDACTION,
      serviceAccountKey: 'not_used_not_created',
      permissionPreflight: input.authPreflight.permissionPreflight,
    } : { status: 'not_run' },
    fixedKernel: fixed ? {
      status: fixed.status,
      selectedProfile: fixed.selectedProfile?.id ?? null,
      selectedCandidate: fixed.selectedCandidate?.modelId ?? null,
      privateQaPrefix: fixed.privateQaPrefix,
      buildAttempts: fixed.buildAttempts,
      importSmokeAttempts: fixed.importSmokeAttempts,
      candidateAttempts: fixed.candidateAttempts,
    } : {
      status: 'not_run',
      reason: 'auth_or_permission_preflight_blocked',
    },
    scopedIamStatus: fixed ? 'delegated_to_fixed_kernel_runner' : 'not_run_auth_blocked',
    cloudBuild: fixed ? summarizeFixedBuilds(fixed.buildAttempts) : 'not_run_auth_blocked',
    importSmoke: fixed ? summarizeFixedImportSmoke(fixed.importSmokeAttempts) : 'not_run_auth_blocked',
    generatedRuntime: fixed ? summarizeFixedRuntime(fixed.candidateAttempts) : 'not_run_auth_blocked',
    privateQaPrefix: fixed?.privateQaPrefix ?? `gs://${QA_BUCKET}/${AUTH_RERUN_QA_PREFIX}/${input.runId}/`,
    blockedScopes: blockedScopes(),
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    vlmToolFamilyBetaStatus: fixed?.vlmToolFamilyBetaStatus ?? 'blocked',
    nextPhaseDecision: fixed?.status === 'passed'
      ? 'Phase 39D controlled real-frame VLM remains blocked until a later bounded private controlled sample prompt.'
      : nextBlockedAction(uniqueBlockers),
  }
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_iam_delta_report.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_iam_delta_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: fixed ? 'delegated' : 'not_run',
    fixedKernelIamDeltaReport: 'phase_39c_sg_fixed_kernel_iam_delta_report.json',
    qaCreateBinding: fixed ? 'see_fixed_kernel_iam_delta_report' : 'not_run_auth_blocked',
    qaReadbackBinding: 'skipped_not_needed',
    broadIamGranted: false,
    publicAccessChanged: false,
    blockers: fixed ? [] : uniqueBlockers,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_cloud_build_report.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_cloud_build_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: fixed ? (fixed.buildAttempts.some((attempt) => attempt.status === 'passed') ? 'passed' : 'blocked') : 'not_run',
    buildAttempts: fixed?.buildAttempts ?? [],
    blockers: fixed ? fixed.blockers.filter((blocker) => blocker.includes('cloud_build') || blocker.includes('image_digest')) : uniqueBlockers,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_import_smoke_report.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_import_smoke_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: fixed ? (fixed.selectedProfile ? 'passed' : 'blocked') : 'not_run',
    attempts: fixed?.importSmokeAttempts ?? [],
    selectedProfile: fixed?.selectedProfile?.id ?? null,
    cuGreenCtxDestroyStatus: fixed?.selectedProfile ? 'resolved_for_selected_profile' : fixed ? 'persisting_or_blocked' : 'not_tested',
    blockers: fixed ? fixed.blockers.filter((blocker) => blocker.includes('import') || blocker.includes('cuGreenCtxDestroy') || blocker.includes('profile')) : uniqueBlockers,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_runtime_results.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_runtime_results',
    runId: input.runId,
    createdAt: input.createdAt,
    status,
    selectedProfile: fixed?.selectedProfile?.id ?? null,
    selectedCandidate: fixed?.selectedCandidate?.modelId ?? null,
    candidateAttempts: fixed?.candidateAttempts ?? [],
    generatedRuntimeRan: Boolean(fixed?.candidateAttempts.length),
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_private_artifact_manifest.json'), {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_rerun_private_artifact_manifest',
    runId: input.runId,
    createdAt: input.createdAt,
    privateOnly: true,
    authRerunMetadataPrefix: `gs://${QA_BUCKET}/${AUTH_RERUN_QA_PREFIX}/${input.runId}/`,
    fixedKernelPrivateQaPrefix: fixed?.privateQaPrefix ?? null,
    artifactCount: fixed ? fixed.importSmokeAttempts.filter((attempt) => attempt.privateQaPrefix).length + fixed.candidateAttempts.filter((attempt) => attempt.privateQaPrefix).length : 0,
    credentialsUploaded: false,
    tokensUploaded: false,
    modelFilesUploaded: false,
    realMediaUploaded: false,
    publicArtifactsCreated: false,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  })
  await writeVlmRuntimeJsonArtifact(path.join(input.artifactDir, 'phase_39c_sg_auth_rerun_recovery_report.json'), recovery)
  return {
    phase: '39C-SG-AUTH-RERUN',
    runId: input.runId,
    status,
    authPreflight: input.authPreflight ?? await readAuthPreflightFallback(input.artifactDir),
    fixedKernelResult: fixed,
    localArtifactDir: input.artifactDir,
    privateQaPrefix: fixed?.privateQaPrefix ?? `gs://${QA_BUCKET}/${AUTH_RERUN_QA_PREFIX}/${input.runId}/`,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    vlmToolFamilyBetaStatus: fixed?.vlmToolFamilyBetaStatus ?? 'blocked',
  }
}

function authFailureReport(input: {
  runId: string
  createdAt: string
  blockers: readonly string[]
  warnings: readonly string[]
  authPathUsed: AuthPath
  activePrincipal: string
}) {
  const blocked = input.blockers.length > 0
  return {
    phase: '39C-SG-AUTH-RERUN',
    reportId: 'phase_39c_sg_auth_failure_report',
    runId: input.runId,
    createdAt: input.createdAt,
    status: blocked ? 'blocked' : 'passed',
    authPathUsed: input.authPathUsed,
    activePrincipal: input.activePrincipal,
    tokenOutput: TOKEN_REDACTION,
    serviceAccountKey: 'not_used_not_created',
    blockers: input.blockers,
    warnings: input.warnings,
    operatorActions: blocked ? operatorActions(input.blockers) : [],
  }
}

async function readAuthPreflightFallback(artifactDir: string): Promise<AuthPreflightReport> {
  try {
    return JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_sg_auth_preflight_report.json'), 'utf8')) as AuthPreflightReport
  } catch {
    const createdAt = new Date().toISOString()
    return {
      phase: '39C-SG-AUTH-RERUN',
      reportId: 'phase_39c_sg_auth_preflight_report',
      runId: 'unknown',
      createdAt,
      status: 'blocked',
      authPathUsed: 'none',
      activePrincipal: 'unknown',
      tokenOutput: TOKEN_REDACTION,
      serviceAccountKey: 'not_used_not_created',
      sanitizedConfig: {},
      environmentPresence: environmentPresence(),
      probes: [],
      permissionPreflight: { status: 'unknown' },
      blockers: ['auth_preflight_report_unreadable'],
      warnings: [],
    }
  }
}

async function probeGcloud(id: string, args: string[], options: {
  suppressOutput?: boolean
  includeOutputSummary?: boolean
} = {}): Promise<CommandProbe> {
  return probeCommand(id, buildPreflightGcloudArgs(args), {
    ...options,
    prependAuthArgs: false,
  })
}

async function probeCommand(id: string, args: string[], options: {
  suppressOutput?: boolean
  includeOutputSummary?: boolean
  prependAuthArgs?: boolean
} = {}): Promise<CommandProbe> {
  const started = Date.now()
  try {
    const { stdout } = await execFileAsync('gcloud', options.prependAuthArgs === false ? args : buildPreflightGcloudArgs(args), {
      timeout: 30 * 1000,
      maxBuffer: 8 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    })
    return {
      id,
      status: 'passed',
      command: safeCommand(args),
      durationMs: Date.now() - started,
      outputSummary: options.suppressOutput ? TOKEN_REDACTION : options.includeOutputSummary ? summarizeSafeOutput(stdout) : undefined,
    }
  } catch (error) {
    return {
      id,
      status: 'failed',
      command: safeCommand(args),
      durationMs: Date.now() - started,
      errorSummary: summarizeCommandError(error),
    }
  }
}

function buildPreflightGcloudArgs(args: string[]): string[] {
  const authArgs = ['--quiet']
  const impersonateServiceAccount = process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT?.trim()
  if (impersonateServiceAccount) authArgs.push('--impersonate-service-account', impersonateServiceAccount)
  const accessTokenFile = process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE?.trim()
  if (accessTokenFile) authArgs.push('--access-token-file', accessTokenFile)
  return [...authArgs, ...args]
}

function resolveAuthPath(input: {
  configuredImpersonation?: string
  configuredTokenFile?: string
}): AuthPath {
  if (process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT) return 'explicit_impersonation'
  if (input.configuredImpersonation) return 'configured_impersonation'
  if (process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE || input.configuredTokenFile) return 'access_token_file'
  if (process.env.CLOUDSDK_AUTH_ACCESS_TOKEN) return 'env_access_token'
  if (process.env.REEDITPRO_GCP_WIF_CREDENTIAL_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS) return 'wif_credential_file'
  if (process.env.K_SERVICE || process.env.GCE_METADATA_HOST || process.env.GOOGLE_CLOUD_PROJECT) return 'attached_service_account'
  return 'active_account'
}

function parseAndSanitizeConfig(outputSummary?: string): Record<string, unknown> {
  if (!outputSummary) return {}
  try {
    return sanitizeObject(JSON.parse(outputSummary) as Record<string, unknown>)
  } catch {
    return { parseStatus: 'unavailable' }
  }
}

function sanitizeObject(value: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (/token|secret|password|credential|key/i.test(key)) {
      redacted[key] = item ? 'present_redacted' : item
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      redacted[key] = sanitizeObject(item as Record<string, unknown>)
    } else {
      redacted[key] = item
    }
  }
  return redacted
}

function readNestedString(record: Record<string, unknown>, pathParts: string[]): string | undefined {
  let current: unknown = record
  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' && current !== 'present_redacted' ? current : undefined
}

function environmentPresence(): Record<string, boolean> {
  return {
    REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT: Boolean(process.env.REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT),
    REEDITPRO_GCP_ACCESS_TOKEN_FILE: Boolean(process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE),
    CLOUDSDK_AUTH_ACCESS_TOKEN: Boolean(process.env.CLOUDSDK_AUTH_ACCESS_TOKEN),
    REEDITPRO_GCP_WIF_CREDENTIAL_FILE: Boolean(process.env.REEDITPRO_GCP_WIF_CREDENTIAL_FILE),
    GOOGLE_APPLICATION_CREDENTIALS: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    K_SERVICE: Boolean(process.env.K_SERVICE),
    GCE_METADATA_HOST: Boolean(process.env.GCE_METADATA_HOST),
    GOOGLE_CLOUD_PROJECT: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
  }
}

function sourceEvidence() {
  return {
    phase39cOriginalOom: { pr: PR66_URL, preserved: true },
    phase39bq39cqCandidates: { pr: PR87_URL, preserved: true },
    phase39cqStructuredOutput: { pr: PR90_URL, preserved: true },
    phase39cqSo3Perception: { pr: PR97_URL, preserved: true },
    phase39cSglangBuildx: { pr: PR100_URL, preserved: true },
    phase39cSgBuildCloudBuild: { pr: PR104_URL, preserved: true },
    phase39cSgKernelCompat: { pr: PR107_URL, preserved: true },
    phase39cSgFixedKernel: { pr: PR110_URL, preserved: true },
    googleCloudAuthDocs: 'https://docs.cloud.google.com/docs/authentication/gcloud',
    googleCloudServiceAccountImpersonationDocs: 'https://docs.cloud.google.com/docs/authentication/use-service-account-impersonation',
    googleCloudIamServiceAccountImpersonationDocs: 'https://docs.cloud.google.com/iam/docs/service-account-impersonation',
    googleCloudServiceAccountKeyBestPractices: 'https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys',
    googleCloudGcloudReference: 'https://docs.cloud.google.com/sdk/gcloud/reference',
  }
}

function operatorActions(blockers: readonly string[]): string[] {
  if (blockers.some((blocker) => blocker.includes('noninteractive_access_token_unavailable') || blocker.includes('Reauthentication failed'))) {
    return [
      'Run gcloud auth login --no-launch-browser or gcloud auth application-default login outside Codex if a user-account flow is intended.',
      'Or configure service-account impersonation for reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com with roles/iam.serviceAccountTokenCreator on the caller.',
      'Or run from Cloud Shell/CI/a Google-managed runner with an attached service account that already has the required scoped permissions.',
      'Or provide a short-lived access-token file/env or Workload Identity Federation credential through the secure environment.',
    ]
  }
  if (blockers.some((blocker) => blocker.includes('permission_preflight_failed'))) {
    return [
      'Grant only the missing scoped Cloud Build, Artifact Registry, Cloud Run Job, and private bucket permissions to the already selected principal.',
      'Do not grant Owner, Editor, Storage Admin, public principals, or service-account keys.',
    ]
  }
  return ['Review the blocker list and rerun auth preflight after the missing noninteractive auth or scoped permission is supplied.']
}

function nextBlockedAction(blockers: readonly string[]): string {
  if (blockers.some((blocker) => blocker.includes('noninteractive_access_token_unavailable') || blocker.includes('auth'))) {
    return 'Noninteractive GCP auth remains blocked; complete the operator auth action runbook before another runtime rerun.'
  }
  if (blockers.some((blocker) => blocker.includes('import') || blocker.includes('cuGreenCtxDestroy'))) {
    return 'Import smoke remains blocked; use a different approved GPU/runtime CUDA environment or human-approved SGLang source-build investigation.'
  }
  if (blockers.some((blocker) => blocker.includes('generated') || blocker.includes('candidate'))) {
    return 'Generated runtime remains blocked; use evidence-specific fixture/QA redesign or non-Qwen VLM approval only after approval.'
  }
  return 'Phase 39C remains blocked; continue with the exact blocker-specific follow-up recorded in reports.'
}

function summarizeFixedBuilds(buildAttempts: Awaited<ReturnType<typeof runVlmSglangFixedKernel>>['buildAttempts']) {
  return buildAttempts.map((attempt) => ({
    profileId: attempt.profile.id,
    status: attempt.status,
    buildId: attempt.buildId,
    buildStatus: attempt.buildStatus,
    imageDigest: attempt.imageDigest,
    blockers: attempt.blockers,
  }))
}

function summarizeFixedImportSmoke(importSmokeAttempts: Awaited<ReturnType<typeof runVlmSglangFixedKernel>>['importSmokeAttempts']) {
  return importSmokeAttempts.map((attempt) => ({
    profileId: attempt.profile.id,
    status: attempt.status,
    imageDigest: attempt.imageDigest,
    privateQaPrefix: attempt.privateQaPrefix,
    blockers: attempt.blockers,
  }))
}

function summarizeFixedRuntime(candidateAttempts: Awaited<ReturnType<typeof runVlmSglangFixedKernel>>['candidateAttempts']) {
  return candidateAttempts.map((attempt) => ({
    modelId: attempt.candidate.modelId,
    status: attempt.status,
    privateQaPrefix: attempt.privateQaPrefix,
    blockers: attempt.blockers,
  }))
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
    'new Qwen model downloads',
    'service-account keys',
    'Track A runtime/visual/render stack',
  ]
}

function summarizeCommandError(error: unknown): string {
  const maybe = error as { message?: string; stderr?: string; stdout?: string }
  const raw = String(maybe?.stderr || maybe?.stdout || maybe?.message || error)
  return raw
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[access-token-redacted]')
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/g, '"refresh_token":"[redacted]"')
    .replace(/\s+/g, ' ')
    .slice(0, 800)
}

function summarizeSafeOutput(output: string): string {
  return output
    .replace(/ya29\.[A-Za-z0-9._-]+/g, '[access-token-redacted]')
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted]"')
    .replace(/"refresh_token"\s*:\s*"[^"]+"/g, '"refresh_token":"[redacted]"')
    .trim()
    .slice(0, 4000)
}

function safeCommand(args: string[]): string {
  return ['gcloud', ...args]
    .map((arg) => {
      if (arg === process.env.REEDITPRO_GCP_ACCESS_TOKEN_FILE) return '[access-token-file-redacted]'
      if (/token|secret|credential/i.test(arg)) return arg.replace(/=.*/, '=[redacted]')
      return arg
    })
    .join(' ')
}

function lastNonEmptyLine(value: string): string {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) ?? ''
}

function timestampTag(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '').slice(0, 15)
}
