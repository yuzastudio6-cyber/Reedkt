import {
  runBetaReadinessExternalBetaEvidenceCollectorFromEnv,
  type BetaReadinessExternalBetaEvidenceCollectorEnv,
  type BetaReadinessExternalBetaEvidenceCollectorFetch,
  type BetaReadinessExternalBetaEvidenceCollectorRunResult,
} from './beta-readiness-external-beta-evidence-collector'
import {
  runBetaReadinessOperatorStatusApiFromEnv,
  type BetaReadinessOperatorStatusApiEnv,
  type BetaReadinessOperatorStatusApiFetch,
  type BetaReadinessOperatorStatusApiRunResult,
} from './beta-readiness-operator-status-api'
import {
  runBetaReadinessScopeApprovalSequenceFromEnv,
  type BetaReadinessScopeApprovalSequenceEnv,
  type BetaReadinessScopeApprovalSequenceFetch,
  type BetaReadinessScopeApprovalSequenceRunResult,
} from './beta-readiness-scope-approval-sequence'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { LibassSyntheticBurninCommandRunner } from './beta-tools-libass-synthetic-burnin-qa-preflight'

export interface BetaReadinessPaidProductionEvidenceCollectorEnv extends
  BetaReadinessExternalBetaEvidenceCollectorEnv,
  BetaReadinessScopeApprovalSequenceEnv,
  BetaReadinessOperatorStatusApiEnv {
  REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL?: string
  REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN?: string
  REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID?: string
  REEDITPRO_BETA_PAID_PRODUCTION_PROJECT_ID?: string
  REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA?: string
  REEDITPRO_BETA_PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE?: string
}

export interface BetaReadinessPaidProductionEvidenceCollectorRunResult {
  ok: boolean
  endpointBaseUrl: string
  steps: {
    externalBetaEvidence: BetaReadinessExternalBetaEvidenceCollectorRunResult
    scopeApprovals: BetaReadinessScopeApprovalSequenceRunResult
    finalOperatorStatus: BetaReadinessOperatorStatusApiRunResult
  }
  readinessRequirements: {
    finalExternalBetaReady: boolean
    finalRealUserMediaBetaReady: boolean
    finalPaidProductionReady: boolean
  }
  warnings: string[]
}

export type BetaReadinessPaidProductionEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessPaidProductionEvidenceCollectorFromEnv(
  env: BetaReadinessPaidProductionEvidenceCollectorEnv,
  fetchImpl: BetaReadinessPaidProductionEvidenceCollectorFetch = fetch as BetaReadinessPaidProductionEvidenceCollectorFetch,
  libassRunner?: LibassSyntheticBurninCommandRunner,
): Promise<BetaReadinessPaidProductionEvidenceCollectorRunResult> {
  const normalized = normalizePaidProductionCollectorEnv(env)
  const missing = missingPaidProductionCollectorConfiguration(normalized)
  const secretLikePaths = collectSecretLikePaths({
    apiBaseUrl: normalized.REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL,
    workspaceId: normalized.REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID,
    projectId: normalized.REEDITPRO_BETA_PAID_PRODUCTION_PROJECT_ID,
    sourceSha: normalized.REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA,
  }, 'betaReadinessPaidProductionEvidenceCollector')
  if (missing.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`Paid production evidence collector inputs are incomplete: ${[...missing, ...secretLikePaths].join('; ')}`)
  }

  const externalBetaEvidence = await runBetaReadinessExternalBetaEvidenceCollectorFromEnv({
    ...normalized,
    REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY: 'true',
  }, fetchImpl as BetaReadinessExternalBetaEvidenceCollectorFetch, libassRunner)
  const scopeApprovals = await runBetaReadinessScopeApprovalSequenceFromEnv({
    ...normalized,
    REEDITPRO_BETA_SCOPE_SEQUENCE_REQUIRE_PAID_PRODUCTION_READY: 'true',
  }, fetchImpl as BetaReadinessScopeApprovalSequenceFetch)
  const finalOperatorStatus = await runBetaReadinessOperatorStatusApiFromEnv({
    REEDITPRO_BETA_STATUS_API_BASE_URL: requiredResolvedBaseUrl(normalized),
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: requiredEnv(normalized, 'REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN'),
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: requiredEnv(normalized, 'REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID'),
    REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY: 'true',
    REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY: 'true',
    REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY: 'true',
  } satisfies BetaReadinessOperatorStatusApiEnv, fetchImpl as BetaReadinessOperatorStatusApiFetch)

  const finalExternalBetaReady = finalOperatorStatus.readyForExternalBeta === true
  const finalRealUserMediaBetaReady = finalOperatorStatus.readyForRealUserMediaBeta === true
  const finalPaidProductionReady = finalOperatorStatus.readyForPaidProduction === true
  const ok = externalBetaEvidence.ok &&
    scopeApprovals.ok &&
    finalOperatorStatus.ok &&
    finalExternalBetaReady &&
    finalRealUserMediaBetaReady &&
    finalPaidProductionReady

  return {
    ok,
    endpointBaseUrl: requiredResolvedBaseUrl(normalized),
    steps: {
      externalBetaEvidence,
      scopeApprovals,
      finalOperatorStatus,
    },
    readinessRequirements: {
      finalExternalBetaReady,
      finalRealUserMediaBetaReady,
      finalPaidProductionReady,
    },
    warnings: [
      'This collector sequences evidence and readbacks only; it does not run user media, charge users, dispatch workers, call providers, deploy production, write Supabase directly, or create public artifacts.',
      'The final operator status must report external beta, real-user-media beta, and paid production ready before this collector passes.',
      'All lower-level collectors keep their own idempotency, approval, evidence, and secret-safety requirements.',
    ],
  }
}

function normalizePaidProductionCollectorEnv(
  env: BetaReadinessPaidProductionEvidenceCollectorEnv,
): BetaReadinessPaidProductionEvidenceCollectorEnv {
  const apiBaseUrl = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_STATUS_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_STATUS_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID)
  const sourceSha = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA)

  return {
    ...env,
    REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL: apiBaseUrl,
    REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN: bearerToken,
    REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID: workspaceId,
    REEDITPRO_BETA_PAID_PRODUCTION_PROJECT_ID: projectId,
    REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA: sourceSha,
    REEDITPRO_BETA_EXTERNAL_API_BASE_URL: clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID) ?? workspaceId,
    REEDITPRO_BETA_EXTERNAL_PROJECT_ID: clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID) ?? projectId,
    REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA) ?? sourceSha,
    REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_WORKSPACE_ID) ?? workspaceId,
    REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_PROJECT_ID) ?? projectId,
    REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA: clean(env.REEDITPRO_BETA_SCOPE_SEQUENCE_SOURCE_SHA) ?? sourceSha,
    REEDITPRO_BETA_STATUS_API_BASE_URL: clean(env.REEDITPRO_BETA_STATUS_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: clean(env.REEDITPRO_BETA_STATUS_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID) ?? workspaceId,
  }
}

function missingPaidProductionCollectorConfiguration(env: BetaReadinessPaidProductionEvidenceCollectorEnv): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE)
      ? undefined
      : 'REEDITPRO_BETA_PAID_PRODUCTION_CONFIRM_EVIDENCE_SEQUENCE=true is required before sequencing external-beta and paid-production evidence.',
    missingEnv(env, 'REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_PAID_PRODUCTION_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_PAID_PRODUCTION_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_PAID_PRODUCTION_SOURCE_SHA'),
  ].filter((item): item is string => Boolean(item))
}

function missingEnv(env: BetaReadinessPaidProductionEvidenceCollectorEnv, name: keyof BetaReadinessPaidProductionEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: BetaReadinessPaidProductionEvidenceCollectorEnv, name: keyof BetaReadinessPaidProductionEvidenceCollectorEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function requiredResolvedBaseUrl(env: BetaReadinessPaidProductionEvidenceCollectorEnv): string {
  const value = clean(env.REEDITPRO_BETA_PAID_PRODUCTION_API_BASE_URL)
  if (!value) throw new Error('Resolved paid production API base URL is missing.')
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
    const result = await runBetaReadinessPaidProductionEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Paid production evidence collector failed.')
    process.exitCode = 1
  }
}
