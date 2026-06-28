import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  runBetaPlatformStagingEvidenceProbeFromEnv,
  type BetaPlatformStagingEvidenceProbeEnv,
  type BetaPlatformStagingEvidenceProbeRunResult,
  type StagingEvidenceFetch,
} from './beta-platform-staging-evidence-probe'
import {
  runBetaReadinessLaunchApprovalEvidenceFromEnv,
  type BetaReadinessLaunchApprovalEvidenceEnv,
  type BetaReadinessLaunchApprovalEvidenceFetch,
  type BetaReadinessLaunchApprovalEvidenceRunResult,
} from './beta-readiness-launch-approval-evidence'
import {
  runBetaReadinessOperatorStatusApiFromEnv,
  type BetaReadinessOperatorStatusApiEnv,
  type BetaReadinessOperatorStatusApiFetch,
  type BetaReadinessOperatorStatusApiRunResult,
} from './beta-readiness-operator-status-api'
import {
  runBetaToolsLocalAcceptedEvidenceCollectorFromEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorFetch,
  type BetaToolsLocalAcceptedEvidenceCollectorRunResult,
} from './beta-tools-local-accepted-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from './beta-tools-libass-synthetic-burnin-qa-preflight'

export interface BetaReadinessExternalBetaEvidenceCollectorEnv extends
  BetaToolsLocalAcceptedEvidenceCollectorEnv,
  BetaPlatformStagingEvidenceProbeEnv,
  BetaReadinessLaunchApprovalEvidenceEnv,
  BetaReadinessOperatorStatusApiEnv {
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL?: string
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN?: string
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID?: string
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID?: string
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA?: string
  REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE?: string
  REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY?: string
}

export interface BetaReadinessExternalBetaEvidenceCollectorRunResult {
  ok: boolean
  endpointBaseUrl: string
  steps: {
    toolEvidence: BetaToolsLocalAcceptedEvidenceCollectorRunResult
    platformEvidence: BetaPlatformStagingEvidenceProbeRunResult
    launchApprovalEvidence: BetaReadinessLaunchApprovalEvidenceRunResult
    finalOperatorStatus: BetaReadinessOperatorStatusApiRunResult
  }
  readinessRequirements: {
    externalBetaReadyRequired: boolean
    finalExternalBetaReady: boolean
    finalRealUserMediaBetaReady: boolean
    finalPaidProductionReady: boolean
  }
  remainingBlockedScopes: string[]
  warnings: string[]
}

export type BetaReadinessExternalBetaEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessExternalBetaEvidenceCollectorFromEnv(
  env: BetaReadinessExternalBetaEvidenceCollectorEnv,
  fetchImpl: BetaReadinessExternalBetaEvidenceCollectorFetch = fetch as BetaReadinessExternalBetaEvidenceCollectorFetch,
  libassRunner?: LibassSyntheticBurninCommandRunner,
): Promise<BetaReadinessExternalBetaEvidenceCollectorRunResult> {
  const normalized = normalizeExternalBetaCollectorEnv(env)
  const missing = missingExternalBetaCollectorConfiguration(normalized)
  const secretLikePaths = collectSecretLikePaths({
    apiBaseUrl: normalized.REEDITPRO_BETA_EXTERNAL_API_BASE_URL,
    workspaceId: normalized.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID,
    projectId: normalized.REEDITPRO_BETA_EXTERNAL_PROJECT_ID,
    sourceSha: normalized.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA,
  }, 'betaReadinessExternalBetaEvidenceCollector')
  if (missing.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`External beta evidence collector inputs are incomplete: ${[...missing, ...secretLikePaths].join('; ')}`)
  }

  const toolEvidence = await runBetaToolsLocalAcceptedEvidenceCollectorFromEnv(
    normalized,
    fetchImpl as BetaToolsLocalAcceptedEvidenceCollectorFetch,
    libassRunner,
  )
  const platformEvidence = await runBetaPlatformStagingEvidenceProbeFromEnv({
    ...normalized,
    REEDITPRO_BETA_PLATFORM_REQUIRE_READY: 'true',
  }, fetchImpl as StagingEvidenceFetch)
  const launchApprovalEvidence = await runBetaReadinessLaunchApprovalEvidenceFromEnv({
    ...normalized,
    REEDITPRO_BETA_LAUNCH_REQUIRE_EXTERNAL_BETA_READY: requireExternalBetaReady(normalized) ? 'true' : undefined,
  }, fetchImpl as BetaReadinessLaunchApprovalEvidenceFetch)
  const finalOperatorStatus = await runBetaReadinessOperatorStatusApiFromEnv({
    ...normalized,
    REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY: requireExternalBetaReady(normalized) ? 'true' : undefined,
    REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY: undefined,
    REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY: undefined,
  }, fetchImpl as BetaReadinessOperatorStatusApiFetch)

  const finalExternalBetaReady = finalOperatorStatus.readyForExternalBeta === true
  const finalRealUserMediaBetaReady = finalOperatorStatus.readyForRealUserMediaBeta === true
  const finalPaidProductionReady = finalOperatorStatus.readyForPaidProduction === true
  const ok = toolEvidence.ok &&
    platformEvidence.ok &&
    platformEvidence.evidencePacketReady &&
    launchApprovalEvidence.ok &&
    launchApprovalEvidence.externalBetaAllowed === true &&
    finalOperatorStatus.ok &&
    (!requireExternalBetaReady(normalized) || finalExternalBetaReady)

  return {
    ok,
    endpointBaseUrl: requiredResolvedBaseUrl(normalized),
    steps: {
      toolEvidence,
      platformEvidence,
      launchApprovalEvidence,
      finalOperatorStatus,
    },
    readinessRequirements: {
      externalBetaReadyRequired: requireExternalBetaReady(normalized),
      finalExternalBetaReady,
      finalRealUserMediaBetaReady,
      finalPaidProductionReady,
    },
    remainingBlockedScopes: [
      'real_user_media_beta_scope_approval',
      'paid_production_scope_approval',
      'public_launch_or_production_claims',
    ],
    warnings: [
      'This collector sequences existing evidence commands and final readback only; it does not enable real-user-media beta, paid production, public launch, provider calls, worker dispatch, or product runtime execution.',
      'The final operator-status readback must report external beta ready before this collector passes.',
      'Bearer tokens remain in authorization headers only and are not included in request bodies or summaries.',
    ],
  }
}

function normalizeExternalBetaCollectorEnv(
  env: BetaReadinessExternalBetaEvidenceCollectorEnv,
): BetaReadinessExternalBetaEvidenceCollectorEnv {
  const apiBaseUrl = clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_STATUS_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_LAUNCH_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_PLATFORM_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_STATUS_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_LAUNCH_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_PLATFORM_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_LAUNCH_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_PLATFORM_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_LAUNCH_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_PLATFORM_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID)
  const sourceSha = clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_LAUNCH_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_PLATFORM_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA)

  return {
    ...env,
    REEDITPRO_BETA_EXTERNAL_API_BASE_URL: apiBaseUrl,
    REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN: bearerToken,
    REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID: workspaceId,
    REEDITPRO_BETA_EXTERNAL_PROJECT_ID: projectId,
    REEDITPRO_BETA_EXTERNAL_SOURCE_SHA: sourceSha,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID) ?? workspaceId,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID) ?? projectId,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA) ?? sourceSha,
    REEDITPRO_BETA_PLATFORM_API_BASE_URL: clean(env.REEDITPRO_BETA_PLATFORM_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_PLATFORM_BEARER_TOKEN: clean(env.REEDITPRO_BETA_PLATFORM_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_PLATFORM_WORKSPACE_ID: clean(env.REEDITPRO_BETA_PLATFORM_WORKSPACE_ID) ?? workspaceId,
    REEDITPRO_BETA_PLATFORM_PROJECT_ID: clean(env.REEDITPRO_BETA_PLATFORM_PROJECT_ID) ?? projectId,
    REEDITPRO_BETA_PLATFORM_SOURCE_SHA: clean(env.REEDITPRO_BETA_PLATFORM_SOURCE_SHA) ?? sourceSha,
    REEDITPRO_BETA_LAUNCH_API_BASE_URL: clean(env.REEDITPRO_BETA_LAUNCH_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_LAUNCH_BEARER_TOKEN: clean(env.REEDITPRO_BETA_LAUNCH_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_LAUNCH_WORKSPACE_ID: clean(env.REEDITPRO_BETA_LAUNCH_WORKSPACE_ID) ?? workspaceId,
    REEDITPRO_BETA_LAUNCH_PROJECT_ID: clean(env.REEDITPRO_BETA_LAUNCH_PROJECT_ID) ?? projectId,
    REEDITPRO_BETA_LAUNCH_SOURCE_SHA: clean(env.REEDITPRO_BETA_LAUNCH_SOURCE_SHA) ?? sourceSha,
    REEDITPRO_BETA_STATUS_API_BASE_URL: clean(env.REEDITPRO_BETA_STATUS_API_BASE_URL) ?? apiBaseUrl,
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: clean(env.REEDITPRO_BETA_STATUS_BEARER_TOKEN) ?? bearerToken,
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID) ?? workspaceId,
  }
}

function missingExternalBetaCollectorConfiguration(env: BetaReadinessExternalBetaEvidenceCollectorEnv): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE)
      ? undefined
      : 'REEDITPRO_BETA_EXTERNAL_CONFIRM_EVIDENCE_SEQUENCE=true is required before sequencing evidence writes.',
    missingEnv(env, 'REEDITPRO_BETA_EXTERNAL_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_EXTERNAL_SOURCE_SHA'),
  ].filter((item): item is string => Boolean(item))
}

function requireExternalBetaReady(env: BetaReadinessExternalBetaEvidenceCollectorEnv): boolean {
  return env.REEDITPRO_BETA_EXTERNAL_REQUIRE_EXTERNAL_BETA_READY !== 'false'
}

function missingEnv(env: BetaReadinessExternalBetaEvidenceCollectorEnv, name: keyof BetaReadinessExternalBetaEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredResolvedBaseUrl(env: BetaReadinessExternalBetaEvidenceCollectorEnv): string {
  const value = clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL)
  if (!value) throw new Error('Resolved external beta API base URL is missing.')
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
    const result = await runBetaReadinessExternalBetaEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'External beta evidence collector failed.')
    process.exitCode = 1
  }
}
