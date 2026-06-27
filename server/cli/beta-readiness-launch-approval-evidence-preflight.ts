import {
  buildBetaReadinessLaunchApprovalEvidencePacket,
  type BetaReadinessLaunchApprovalEvidenceEnv,
} from './beta-readiness-launch-approval-evidence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaReadinessLaunchApprovalEvidencePreflightReport {
  ok: boolean
  readyToRecordLaunchApprovalEvidence: boolean
  plannedEndpoint?: string
  missingConfiguration: string[]
  missingOwnerApprovals: string[]
  missingEvidenceNotes: string[]
  confirmationGaps: string[]
  rejectedScope: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

export function buildBetaReadinessLaunchApprovalEvidencePreflight(
  env: BetaReadinessLaunchApprovalEvidenceEnv,
): BetaReadinessLaunchApprovalEvidencePreflightReport {
  const missingConfiguration = requiredEnvNames(env)
  const missingOwnerApprovals = missingApprovals(env)
  const missingEvidenceNotes = missingEvidence(env)
  const confirmationGaps = parseBoolean(env.REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL)
    ? []
    : ['REEDITPRO_BETA_LAUNCH_CONFIRM_EXTERNAL_BETA_APPROVAL=true is required.']
  const rejectedScope = [
    ...(parseBoolean(env.REEDITPRO_BETA_LAUNCH_APPROVE_REAL_USER_MEDIA_BETA)
      ? ['Real-user-media beta approval is not part of this launch approval evidence lane.']
      : []),
    ...(parseBoolean(env.REEDITPRO_BETA_LAUNCH_APPROVE_PAID_PRODUCTION)
      ? ['Paid production approval is not part of this launch approval evidence lane.']
      : []),
  ]
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_LAUNCH_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_LAUNCH_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_LAUNCH_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_LAUNCH_SOURCE_SHA,
    modelLicenseEvidence: env.REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE,
    deploymentEvidence: env.REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE,
    securityEvidence: env.REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE,
    storageEvidence: env.REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE,
    legalEvidence: env.REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE,
    monitoringEvidence: env.REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE,
    supportEvidence: env.REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE,
  }, 'betaReadinessLaunchApprovalEvidencePreflight')

  let buildError: string | undefined
  if (
    missingConfiguration.length === 0 &&
    missingOwnerApprovals.length === 0 &&
    missingEvidenceNotes.length === 0 &&
    confirmationGaps.length === 0 &&
    rejectedScope.length === 0 &&
    secretLikeInputPaths.length === 0
  ) {
    try {
      buildBetaReadinessLaunchApprovalEvidencePacket(env)
    } catch (error) {
      buildError = error instanceof Error ? error.message : 'Launch approval evidence packet build failed.'
    }
  }

  const readyToRecordLaunchApprovalEvidence = !buildError &&
    missingConfiguration.length === 0 &&
    missingOwnerApprovals.length === 0 &&
    missingEvidenceNotes.length === 0 &&
    confirmationGaps.length === 0 &&
    rejectedScope.length === 0 &&
    secretLikeInputPaths.length === 0

  return {
    ok: readyToRecordLaunchApprovalEvidence,
    readyToRecordLaunchApprovalEvidence,
    plannedEndpoint: buildEndpoint(env),
    missingConfiguration,
    missingOwnerApprovals,
    missingEvidenceNotes: buildError ? [...missingEvidenceNotes, buildError] : missingEvidenceNotes,
    confirmationGaps,
    rejectedScope,
    secretLikeInputPaths,
    warnings: [
      'No-network launch approval evidence preflight only; no backend request was made and no evidence was recorded.',
      'This lane can record external-beta launch approvals only; real-user-media beta and paid production approvals remain separate.',
      'Passing this preflight does not enable beta by itself; tool evidence and deployed platform evidence must also be present.',
    ],
  }
}

function requiredEnvNames(env: BetaReadinessLaunchApprovalEvidenceEnv): string[] {
  return [
    'REEDITPRO_BETA_LAUNCH_API_BASE_URL',
    'REEDITPRO_BETA_LAUNCH_BEARER_TOKEN',
    'REEDITPRO_BETA_LAUNCH_WORKSPACE_ID',
    'REEDITPRO_BETA_LAUNCH_IDEMPOTENCY_KEY',
    'REEDITPRO_BETA_LAUNCH_SOURCE_SHA',
  ].filter((name) => !clean(env[name as keyof BetaReadinessLaunchApprovalEvidenceEnv]))
    .map((name) => `${name} is required.`)
}

function missingApprovals(env: BetaReadinessLaunchApprovalEvidenceEnv): string[] {
  return [
    ['deployment owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_DEPLOYMENT],
    ['security owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_SECURITY],
    ['storage/privacy owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_STORAGE],
    ['model/license owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_MODEL_LICENSES],
    ['legal owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_LEGAL],
    ['monitoring owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_MONITORING],
    ['support owner approval', env.REEDITPRO_BETA_LAUNCH_APPROVE_SUPPORT],
  ].filter(([, value]) => !parseBoolean(value)).map(([label]) => `${label} is required.`)
}

function missingEvidence(env: BetaReadinessLaunchApprovalEvidenceEnv): string[] {
  return [
    ['model/license evidence', env.REEDITPRO_BETA_LAUNCH_MODEL_LICENSE_EVIDENCE],
    ['deployment evidence', env.REEDITPRO_BETA_LAUNCH_DEPLOYMENT_EVIDENCE],
    ['security evidence', env.REEDITPRO_BETA_LAUNCH_SECURITY_EVIDENCE],
    ['storage/privacy evidence', env.REEDITPRO_BETA_LAUNCH_STORAGE_EVIDENCE],
    ['legal evidence', env.REEDITPRO_BETA_LAUNCH_LEGAL_EVIDENCE],
    ['monitoring evidence', env.REEDITPRO_BETA_LAUNCH_MONITORING_EVIDENCE],
    ['support evidence', env.REEDITPRO_BETA_LAUNCH_SUPPORT_EVIDENCE],
  ].filter(([, value]) => !clean(value)).map(([label]) => `${label} is required.`)
}

function buildEndpoint(env: BetaReadinessLaunchApprovalEvidenceEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_LAUNCH_API_BASE_URL)
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/evidence`
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessLaunchApprovalEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyToRecordLaunchApprovalEvidence) {
    process.exitCode = 1
  }
}
