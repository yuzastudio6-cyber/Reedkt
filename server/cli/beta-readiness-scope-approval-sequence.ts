import {
  runBetaReadinessOperatorStatusApiFromEnv,
  type BetaReadinessOperatorStatusApiEnv,
  type BetaReadinessOperatorStatusApiFetch,
  type BetaReadinessOperatorStatusApiRunResult,
} from './beta-readiness-operator-status-api'
import {
  runBetaReadinessScopeApprovalEvidenceFromEnv,
  type BetaReadinessScopeApprovalEvidenceEnv,
  type BetaReadinessScopeApprovalEvidenceFetch,
  type BetaReadinessScopeApprovalEvidenceRunResult,
} from './beta-readiness-scope-approval-evidence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaReadinessScopeApprovalSequenceEnv extends
  BetaReadinessScopeApprovalEvidenceEnv,
  BetaReadinessOperatorStatusApiEnv {
  REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_REAL_USER_MEDIA_BETA?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_PAID_PRODUCTION?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE?: string
  REEDITPRO_BETA_SCOPE_SEQUENCE_REQUIRE_PAID_PRODUCTION_READY?: string
}

export interface BetaReadinessScopeApprovalSequenceRunResult {
  ok: boolean
  endpointBaseUrl: string
  steps: {
    realUserMediaBetaApproval: BetaReadinessScopeApprovalEvidenceRunResult
    paidProductionApproval: BetaReadinessScopeApprovalEvidenceRunResult
    finalOperatorStatus: BetaReadinessOperatorStatusApiRunResult
  }
  readinessRequirements: {
    paidProductionReadyRequired: boolean
    finalExternalBetaReady: boolean
    finalRealUserMediaBetaReady: boolean
    finalPaidProductionReady: boolean
  }
  warnings: string[]
}

export type BetaReadinessScopeApprovalSequenceFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessScopeApprovalSequenceFromEnv(
  env: BetaReadinessScopeApprovalSequenceEnv,
  fetchImpl: BetaReadinessScopeApprovalSequenceFetch = fetch as BetaReadinessScopeApprovalSequenceFetch,
): Promise<BetaReadinessScopeApprovalSequenceRunResult> {
  const normalized = normalizeScopeApprovalSequenceEnv(env)
  const missing = missingScopeApprovalSequenceConfiguration(normalized)
  const secretLikePaths = collectSecretLikePaths({
    workspaceId: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID,
    projectId: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID,
    sourceId: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID,
    sourceSha: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA,
    realUserMediaBetaEvidence: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE,
    paidProductionEvidence: normalized.REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE,
  }, 'betaReadinessScopeApprovalSequence')
  if (missing.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`Scope approval sequence inputs are incomplete: ${[...missing, ...secretLikePaths].join('; ')}`)
  }

  const realUserMediaBetaApproval = await runBetaReadinessScopeApprovalEvidenceFromEnv(
    buildScopeApprovalEnv(normalized, 'real_user_media_beta'),
    fetchImpl as BetaReadinessScopeApprovalEvidenceFetch,
  )
  const paidProductionApproval = await runBetaReadinessScopeApprovalEvidenceFromEnv(
    buildScopeApprovalEnv(normalized, 'paid_production'),
    fetchImpl as BetaReadinessScopeApprovalEvidenceFetch,
  )
  const finalOperatorStatus = await runBetaReadinessOperatorStatusApiFromEnv({
    REEDITPRO_BETA_STATUS_API_BASE_URL: requiredResolvedBaseUrl(normalized),
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: requiredEnv(normalized, 'REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN'),
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: requiredEnv(normalized, 'REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID'),
    REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY: 'true',
    REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY: 'true',
    REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY: requirePaidProductionReady(normalized) ? 'true' : undefined,
  } satisfies BetaReadinessOperatorStatusApiEnv, fetchImpl as BetaReadinessOperatorStatusApiFetch)

  const finalExternalBetaReady = finalOperatorStatus.readyForExternalBeta === true
  const finalRealUserMediaBetaReady = finalOperatorStatus.readyForRealUserMediaBeta === true
  const finalPaidProductionReady = finalOperatorStatus.readyForPaidProduction === true
  const ok = realUserMediaBetaApproval.ok &&
    realUserMediaBetaApproval.targetReady === true &&
    paidProductionApproval.ok &&
    paidProductionApproval.targetReady === true &&
    finalOperatorStatus.ok &&
    finalExternalBetaReady &&
    finalRealUserMediaBetaReady &&
    (!requirePaidProductionReady(normalized) || finalPaidProductionReady)

  return {
    ok,
    endpointBaseUrl: requiredResolvedBaseUrl(normalized),
    steps: {
      realUserMediaBetaApproval,
      paidProductionApproval,
      finalOperatorStatus,
    },
    readinessRequirements: {
      paidProductionReadyRequired: requirePaidProductionReady(normalized),
      finalExternalBetaReady,
      finalRealUserMediaBetaReady,
      finalPaidProductionReady,
    },
    warnings: [
      'This sequence records scope approval evidence only after deployed prerequisite readbacks pass.',
      'It does not run tools, process media, charge users, dispatch workers, call providers, write Supabase directly, deploy production, or create public artifacts.',
      'Paid production approval evidence is posted only after the real-user-media beta approval readback is ready.',
    ],
  }
}

function normalizeScopeApprovalSequenceEnv(
  env: BetaReadinessScopeApprovalSequenceEnv,
): BetaReadinessScopeApprovalSequenceEnv {
  const apiBaseUrl = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_STATUS_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_STATUS_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID)
  const sourceId = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID) ??
    'beta-readiness-scope-approval-sequence'
  const sourceSha = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA)
  const realEvidence = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE)
  const paidEvidence = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE) ??
    clean(env.REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE)

  return {
    ...env,
    REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL: apiBaseUrl,
    REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN: bearerToken,
    REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID: workspaceId,
    REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID: projectId,
    REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID: sourceId,
    REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA: sourceSha,
    REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE: realEvidence,
    REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE: paidEvidence,
  }
}

function buildScopeApprovalEnv(
  env: BetaReadinessScopeApprovalSequenceEnv,
  mode: 'real_user_media_beta' | 'paid_production',
): BetaReadinessScopeApprovalEvidenceEnv {
  const sourceId = requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_ID')
  const shared = {
    REEDITPRO_BETA_SCOPE_APPROVAL_API_BASE_URL: requiredResolvedBaseUrl(env),
    REEDITPRO_BETA_SCOPE_APPROVAL_BEARER_TOKEN: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN'),
    REEDITPRO_BETA_SCOPE_APPROVAL_WORKSPACE_ID: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID'),
    REEDITPRO_BETA_SCOPE_APPROVAL_PROJECT_ID: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID),
    REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_SHA: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA'),
    REEDITPRO_BETA_SCOPE_APPROVAL_REQUIRE_TARGET_READY: 'true',
  }

  if (mode === 'real_user_media_beta') {
    return {
      ...shared,
      REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID: `${sourceId}:real-user-media-beta`,
      REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_IDEMPOTENCY_KEY'),
      REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'real_user_media_beta',
      REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_REAL_USER_MEDIA_BETA: 'true',
      REEDITPRO_BETA_SCOPE_APPROVAL_REAL_USER_MEDIA_BETA_EVIDENCE: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE'),
    }
  }

  return {
    ...shared,
    REEDITPRO_BETA_SCOPE_APPROVAL_SOURCE_ID: `${sourceId}:paid-production`,
    REEDITPRO_BETA_SCOPE_APPROVAL_IDEMPOTENCY_KEY: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_IDEMPOTENCY_KEY'),
    REEDITPRO_BETA_SCOPE_APPROVAL_MODE: 'paid_production',
    REEDITPRO_BETA_SCOPE_APPROVAL_CONFIRM_PAID_PRODUCTION: 'true',
    REEDITPRO_BETA_SCOPE_APPROVAL_PAID_PRODUCTION_EVIDENCE: requiredEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE'),
  }
}

function missingScopeApprovalSequenceConfiguration(env: BetaReadinessScopeApprovalSequenceEnv): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE)
      ? undefined
      : 'REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_APPROVAL_SEQUENCE=true is required.',
    parseBoolean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_REAL_USER_MEDIA_BETA)
      ? undefined
      : 'REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_REAL_USER_MEDIA_BETA=true is required.',
    parseBoolean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_PAID_PRODUCTION)
      ? undefined
      : 'REEDITPRO_BETA_SCOPE_SEQUENCE_CONFIRM_PAID_PRODUCTION=true is required.',
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_IDEMPOTENCY_KEY'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_IDEMPOTENCY_KEY'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_REAL_USER_MEDIA_BETA_EVIDENCE'),
    missingEnv(env, 'REEDITPRO_BETA_SCOPE_SEQUENCE_PAID_PRODUCTION_EVIDENCE'),
  ].filter((item): item is string => Boolean(item))
}

function requirePaidProductionReady(env: BetaReadinessScopeApprovalSequenceEnv): boolean {
  return env.REEDITPRO_BETA_SCOPE_SEQUENCE_REQUIRE_PAID_PRODUCTION_READY !== 'false'
}

function missingEnv(env: BetaReadinessScopeApprovalSequenceEnv, name: keyof BetaReadinessScopeApprovalSequenceEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: BetaReadinessScopeApprovalSequenceEnv, name: keyof BetaReadinessScopeApprovalSequenceEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function requiredResolvedBaseUrl(env: BetaReadinessScopeApprovalSequenceEnv): string {
  const value = clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL)
  if (!value) throw new Error('Resolved scope approval sequence API base URL is missing.')
  return value.replace(/\/+$/, '')
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaReadinessScopeApprovalSequenceFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta readiness scope approval sequence failed.')
    process.exitCode = 1
  }
}
