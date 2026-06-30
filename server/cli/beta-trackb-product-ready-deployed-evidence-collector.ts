import { readFileSync } from 'node:fs'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  runBetaToolsLocalAcceptedEvidenceCollectorFromEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorEnv,
  type BetaToolsLocalAcceptedEvidenceCollectorFetch,
  type BetaToolsLocalAcceptedEvidenceCollectorRunResult,
} from './beta-tools-local-accepted-evidence-collector'
import type { LibassSyntheticBurninCommandRunner } from './beta-tools-libass-synthetic-burnin-qa-preflight'

const RECONCILIATION_PATH = 'docs/beta-readiness/trackb-product-ready-source-reconciliation/2026-06-30-trackb-product-ready-source-reconciliation.json'
const LOCAL_ACCEPTED_BUNDLE_PATH = 'docs/beta-readiness/local-accepted-evidence-bundle/2026-06-29-current-source-16-tool-local-accepted-evidence-bundle.json'
const EXPECTED_DECISION = 'beta_trackb_product_ready_source_reconciliation_passed_ready_for_deployed_product_ready_evidence_collection'
const EXPECTED_TRACKB_DECISION = 'trackb_media_oss_product_beta_runtime_product_ready_closeout_passed_all_16_tools_ready_for_ranked_tools_call_lane'
const REQUIRED_TRACKB_PRODUCT_READY_COUNT = 16

export interface BetaTrackBProductReadyDeployedEvidenceCollectorEnv extends BetaToolsLocalAcceptedEvidenceCollectorEnv {
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_API_BASE_URL?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_BEARER_TOKEN?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_WORKSPACE_ID?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_PROJECT_ID?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_SOURCE_SHA?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_SOURCE_ID?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_CORE_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_TRACKB_PRODUCT_READY_LIBASS_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL?: string
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN?: string
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID?: string
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID?: string
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA?: string
}

export interface BetaTrackBProductReadyDeployedEvidenceCollectorResult {
  ok: boolean
  decision: 'beta_trackb_product_ready_deployed_evidence_collector_passed_product_ready_readback_16'
  endpointBaseUrl: string
  sourceReconciliation: {
    path: string
    decision: string
    productReadyCloseoutPr: number
    trackBProductReadySourceCount: number
    activeBetaProductReadyDeployedEvidenceCount: number
  }
  toolEvidence: BetaToolsLocalAcceptedEvidenceCollectorRunResult
  readbackRequirements: {
    requiredProductReadyLocalOssCount: 16
    readbackProductReadyLocalOssCount: number
    productReadyLocalOssCountSatisfied: boolean
  }
  remainingGateBlockers: string[]
  warnings: string[]
}

export async function runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv(
  env: BetaTrackBProductReadyDeployedEvidenceCollectorEnv,
  fetchImpl: BetaToolsLocalAcceptedEvidenceCollectorFetch = fetch as BetaToolsLocalAcceptedEvidenceCollectorFetch,
  libassRunner?: LibassSyntheticBurninCommandRunner,
): Promise<BetaTrackBProductReadyDeployedEvidenceCollectorResult> {
  const reconciliation = loadReconciliation()
  const localBundle = loadRecord(LOCAL_ACCEPTED_BUNDLE_PATH)
  const sourceGaps = validateSourceTruth(reconciliation, localBundle)
  const normalized = normalizeEnv(env, localBundle)
  const missing = missingConfiguration(normalized)
  const secretLikePaths = collectSecretLikePaths({
    apiBaseUrl: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL,
    workspaceId: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    projectId: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    sourceId: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID,
    sourceSha: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    notes: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES,
    containerImage: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE,
  }, 'betaTrackBProductReadyDeployedEvidenceCollector')
  if (missing.length > 0 || sourceGaps.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`Track B product-ready deployed evidence collector inputs are incomplete: ${[
      ...missing,
      ...sourceGaps,
      ...secretLikePaths,
    ].join('; ')}`)
  }

  const toolEvidence = await runBetaToolsLocalAcceptedEvidenceCollectorFromEnv(
    normalized,
    fetchImpl,
    libassRunner,
  )
  const readbackProductReadyLocalOssCount = toolEvidence.operatorReadback.currentGate.productReadyLocalOssCount ?? 0
  const productReadyLocalOssCountSatisfied = readbackProductReadyLocalOssCount >= REQUIRED_TRACKB_PRODUCT_READY_COUNT
  if (!productReadyLocalOssCountSatisfied) {
    throw new Error(`Track B product-ready deployed readback count ${readbackProductReadyLocalOssCount} is below required count ${REQUIRED_TRACKB_PRODUCT_READY_COUNT}.`)
  }

  return {
    ok: toolEvidence.ok && productReadyLocalOssCountSatisfied,
    decision: 'beta_trackb_product_ready_deployed_evidence_collector_passed_product_ready_readback_16',
    endpointBaseUrl: normalized.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL ?? '',
    sourceReconciliation: {
      path: RECONCILIATION_PATH,
      decision: stringValue(reconciliation.decision) ?? '',
      productReadyCloseoutPr: numberValue(recordValue(reconciliation.productReadyCloseout).pullRequest),
      trackBProductReadySourceCount: numberValue(recordValue(reconciliation.trackBProductReadyTotals).productReadyForRankedToolCallLane),
      activeBetaProductReadyDeployedEvidenceCount: numberValue(recordValue(reconciliation.activeBetaDeployedEvidenceTotals).productReadyLocalOssRecordedInActiveBetaEvidence),
    },
    toolEvidence,
    readbackRequirements: {
      requiredProductReadyLocalOssCount: REQUIRED_TRACKB_PRODUCT_READY_COUNT,
      readbackProductReadyLocalOssCount,
      productReadyLocalOssCountSatisfied,
    },
    remainingGateBlockers: [
      'platform_billing_deployment_evidence_pending',
      'launch_owner_approval_evidence_pending',
      'final_external_beta_go_no_go_readback_pending',
      'real_user_media_beta_scope_approval_pending',
      'paid_production_scope_approval_pending',
    ],
    warnings: [
      'This collector records product-ready local OSS evidence only through the existing deployed tool-evidence path and final operator readback.',
      'It does not run user media, dispatch workers, call providers, write Supabase directly, enable external beta, enable real-user-media beta, enable paid production, create public artifacts, or create signed URLs.',
      'External beta still requires platform evidence, launch owner approvals, and final go/no-go readback after tool evidence is recorded.',
    ],
  }
}

function normalizeEnv(
  env: BetaTrackBProductReadyDeployedEvidenceCollectorEnv,
  localBundle: Record<string, unknown>,
): BetaToolsLocalAcceptedEvidenceCollectorEnv {
  const coreToolIds = stringArray(localBundle.coreAcceptedToolIds).join(',')
  const libassEvidence = recordValue(localBundle.libassEvidence)
  const apiBaseUrl = clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID)
  const sourceSha = clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA)

  return {
    ...env,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL: apiBaseUrl,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN: bearerToken,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID: workspaceId,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID: projectId,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA: sourceSha,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID: clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_SOURCE_ID) ??
      clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID) ??
      'trackb-product-ready-deployed-evidence-collector',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES) ??
      'Track B product-ready source truth from PR #987 deployed evidence recording; no user media.',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY: clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_CORE_IDEMPOTENCY_KEY) ??
      clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY),
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY: clean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_LIBASS_IDEMPOTENCY_KEY) ??
      clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY),
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS) ?? coreToolIds,
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_LIBASS_ACCEPTED_EVIDENCE: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK: 'true',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_BOUNDED_ACCEPTED_TOOL_COUNT: String(REQUIRED_TRACKB_PRODUCT_READY_COUNT),
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT: String(REQUIRED_TRACKB_PRODUCT_READY_COUNT),
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_MODE) ?? 'docker',
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE) ??
      stringValue(libassEvidence.containerImage),
    REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_RETAIN_TEMP_OUTPUTS: 'false',
  }
}

function missingConfiguration(env: BetaTrackBProductReadyDeployedEvidenceCollectorEnv): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_TRACKB_PRODUCT_READY_CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE)
      ? undefined
      : 'REEDITPRO_BETA_TRACKB_PRODUCT_READY_CONFIRM_DEPLOYED_EVIDENCE_SEQUENCE=true is required before recording product-ready deployed evidence.',
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function validateSourceTruth(
  reconciliation: Record<string, unknown>,
  localBundle: Record<string, unknown>,
): string[] {
  const closeout = recordValue(reconciliation.productReadyCloseout)
  const totals = recordValue(reconciliation.trackBProductReadyTotals)
  return [
    reconciliation.decision === EXPECTED_DECISION ? undefined : 'Track B product-ready reconciliation decision drift.',
    closeout.pullRequest === 987 ? undefined : 'Track B product-ready closeout PR #987 is missing.',
    closeout.state === 'MERGED' ? undefined : 'Track B product-ready closeout PR #987 must be merged.',
    closeout.decision === EXPECTED_TRACKB_DECISION ? undefined : 'Track B product-ready closeout decision drift.',
    numberValue(totals.productReadyForRankedToolCallLane) === REQUIRED_TRACKB_PRODUCT_READY_COUNT
      ? undefined
      : 'Track B source product-ready count must be 16.',
    numberValue(localBundle.locallyAcceptedToolCount) === REQUIRED_TRACKB_PRODUCT_READY_COUNT
      ? undefined
      : 'Local accepted evidence bundle must cover 16 tools.',
    localBundle.readyToRecordDeployedEvidence === true ? undefined : 'Local accepted evidence bundle is not ready to record deployed evidence.',
  ].filter((item): item is string => Boolean(item))
}

function loadReconciliation(): Record<string, unknown> {
  return loadRecord(RECONCILIATION_PATH)
}

function loadRecord(path: string): Record<string, unknown> {
  return recordValue(JSON.parse(readFileSync(path, 'utf8')))
}

function missingEnv(env: BetaToolsLocalAcceptedEvidenceCollectorEnv, name: keyof BetaToolsLocalAcceptedEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaTrackBProductReadyDeployedEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Track B product-ready deployed evidence collector failed.')
    process.exitCode = 1
  }
}
