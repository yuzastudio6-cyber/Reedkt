import {
  buildBetaReadinessScopeApprovalEvidencePacket,
  type BetaReadinessScopeApprovalEvidenceEnv,
  type BetaReadinessScopeApprovalMode,
} from './beta-readiness-scope-approval-evidence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaReadinessScopeApprovalEvidencePreflightReport {
  ok: boolean
  mode?: BetaReadinessScopeApprovalMode
  readyToRecordScopeApprovalEvidence: boolean
  plannedEvidenceEndpoint?: string
  plannedPrerequisiteEndpoint?: string
  prerequisiteGate?: 'external_beta' | 'real_user_media_beta'
  missingConfiguration: string[]
  confirmationGaps: string[]
  missingEvidenceNotes: string[]
  rejectedScope: string[]
  secretLikeInputPaths: string[]
  warnings: string[]
}

export function buildBetaReadinessScopeApprovalEvidencePreflight(
  env: BetaReadinessScopeApprovalEvidenceEnv,
): BetaReadinessScopeApprovalEvidencePreflightReport {
  const mode = parseMode(env.REEDITPRO_BETA_SCOPE_APPROVAL_MODE)
  const missingConfiguration = requiredEnvNames(env)
  const confirmationGaps = mode ? confirmationGapsFor(mode, env) : []
  const missingEvidenceNotes = mode ? missingEvidenceFor(mode, env) : []
  const rejectedScope = mode ? rejectedScopeFor(mode, env) : ['REEDITPRO_BETA_SCOPE_APPROVAL_MODE must be real_user_media_beta or paid_production.']
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA,
    realUserMediaBetaEvidence: env.REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE,
    paidProductionEvidence: env.REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE,
  }, 'betaReadinessScopeApprovalEvidencePreflight')

  let buildError: string | undefined
  if (
    mode &&
    missingConfiguration.length === 0 &&
    confirmationGaps.length === 0 &&
    missingEvidenceNotes.length === 0 &&
    rejectedScope.length === 0 &&
    secretLikeInputPaths.length === 0
  ) {
    try {
      buildBetaReadinessScopeApprovalEvidencePacket(env)
    } catch (error) {
      buildError = error instanceof Error ? error.message : 'Scope approval evidence packet build failed.'
    }
  }

  const readyToRecordScopeApprovalEvidence = !buildError &&
    Boolean(mode) &&
    missingConfiguration.length === 0 &&
    confirmationGaps.length === 0 &&
    missingEvidenceNotes.length === 0 &&
    rejectedScope.length === 0 &&
    secretLikeInputPaths.length === 0

  return {
    ok: readyToRecordScopeApprovalEvidence,
    mode,
    readyToRecordScopeApprovalEvidence,
    plannedEvidenceEndpoint: buildEvidenceEndpoint(env),
    plannedPrerequisiteEndpoint: buildPrerequisiteEndpoint(env),
    prerequisiteGate: mode === 'real_user_media_beta' ? 'external_beta' : mode === 'paid_production' ? 'real_user_media_beta' : undefined,
    missingConfiguration,
    confirmationGaps,
    missingEvidenceNotes: buildError ? [...missingEvidenceNotes, buildError] : missingEvidenceNotes,
    rejectedScope,
    secretLikeInputPaths,
    warnings: [
      'No-network scope approval evidence preflight only; no backend request was made and no evidence was recorded.',
      'Real-user-media beta approval requires external beta to already be ready in deployed operator status.',
      'Paid production approval requires real-user-media beta to already be ready in deployed operator status.',
      'Passing this preflight does not run tools, process media, charge users, enable production, or bypass final go/no-go readback.',
    ],
  }
}

function requiredEnvNames(env: BetaReadinessScopeApprovalEvidenceEnv): string[] {
  return [
    'REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL',
    'REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN',
    'REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID',
    'REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY',
    'REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA',
    'REEDITPRO_BETA_SCOPE_APPROVAL_MODE',
  ].filter((name) => !clean(env[name as keyof BetaReadinessScopeApprovalEvidenceEnv]))
    .map((name) => `${name} is required.`)
}

function confirmationGapsFor(
  mode: BetaReadinessScopeApprovalMode,
  env: BetaReadinessScopeApprovalEvidenceEnv,
): string[] {
  if (mode === 'real_user_media_beta') {
    return parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA)
      ? []
      : ['REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA=true is required.']
  }

  return parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION)
    ? []
    : ['REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION=true is required.']
}

function missingEvidenceFor(
  mode: BetaReadinessScopeApprovalMode,
  env: BetaReadinessScopeApprovalEvidenceEnv,
): string[] {
  if (mode === 'real_user_media_beta') {
    return clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE)
      ? []
      : ['REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE is required.']
  }

  return clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE)
    ? []
    : ['REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE is required.']
}

function rejectedScopeFor(
  mode: BetaReadinessScopeApprovalMode,
  env: BetaReadinessScopeApprovalEvidenceEnv,
): string[] {
  if (mode === 'real_user_media_beta' && parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION)) {
    return ['Paid production approval is not part of the real-user-media beta scope approval lane.']
  }
  if (mode === 'paid_production' && parseBoolean(env.REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA)) {
    return ['Real-user-media beta approval must be recorded before the paid production scope approval lane.']
  }
  return []
}

function parseMode(value: string | undefined): BetaReadinessScopeApprovalMode | undefined {
  if (value === 'real_user_media_beta' || value === 'paid_production') return value
  return undefined
}

function buildEvidenceEndpoint(env: BetaReadinessScopeApprovalEvidenceEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL)
  if (!baseUrl) return undefined
  return `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/evidence`
}

function buildPrerequisiteEndpoint(env: BetaReadinessScopeApprovalEvidenceEnv): string | undefined {
  const baseUrl = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL)
  const workspaceId = clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID)
  if (!baseUrl || !workspaceId) return undefined
  return `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/operator-status?workspaceId=${encodeURIComponent(workspaceId)}`
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessScopeApprovalEvidencePreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.readyToRecordScopeApprovalEvidence) {
    process.exitCode = 1
  }
}
