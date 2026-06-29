import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { ProductionToolId } from '../tool-registry'
import type { BetaReadinessEvidencePacketInput } from '../beta-readiness/beta-readiness-evidence-store'
import {
  runBetaReadinessOperatorStatusApiFromEnv,
  type BetaReadinessOperatorStatusApiRunResult,
} from './beta-readiness-operator-status-api'
import {
  buildBetaToolsCoreRealCheckEvidenceRequest,
  summarizeCoreRealCheckEvidenceResponse,
  type BetaToolsCoreRealCheckEvidenceRunResult,
} from './beta-tools-core-real-check-evidence'
import {
  runBetaToolsLocalAcceptedEvidenceBundle,
  type BetaToolsLocalAcceptedEvidenceBundleEnv,
} from './beta-tools-local-accepted-evidence-bundle'
import type { LibassSyntheticBurninCommandRunner } from './beta-tools-libass-synthetic-burnin-qa-preflight'

export interface BetaToolsLocalAcceptedEvidenceCollectorEnv extends BetaToolsLocalAcceptedEvidenceBundleEnv {
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK?: string
  REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT?: string
}

export interface BetaToolsLocalAcceptedEvidenceCollectorRunResult {
  ok: boolean
  endpointBaseUrl: string
  noBackendEvidenceRecorded: false
  localBundle: {
    ok: boolean
    locallyAcceptedToolIds: ProductionToolId[]
    locallyAcceptedToolCount: number
    readyToRecordDeployedEvidence: boolean
  }
  coreEvidence: BetaToolsCoreRealCheckEvidenceRunResult
  libassEvidence: {
    ok: boolean
    status: number
    endpoint: string
    replayed?: boolean
    evidencePacketId?: string
    acceptedToolIds: string[]
    acceptedToolCount: number
    productReadyLocalOssCount?: number
  }
  operatorReadback: BetaReadinessOperatorStatusApiRunResult
  readbackRequirements: {
    requireOperatorReadback: boolean
    requiredProductReadyLocalOssCount: number
    productReadyLocalOssCountSatisfied: boolean
  }
  remainingGateBlockers: string[]
  warnings: string[]
}

export type BetaToolsLocalAcceptedEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaToolsLocalAcceptedEvidenceCollectorFromEnv(
  env: BetaToolsLocalAcceptedEvidenceCollectorEnv,
  fetchImpl: BetaToolsLocalAcceptedEvidenceCollectorFetch = fetch as BetaToolsLocalAcceptedEvidenceCollectorFetch,
  libassRunner?: LibassSyntheticBurninCommandRunner,
): Promise<BetaToolsLocalAcceptedEvidenceCollectorRunResult> {
  const missing = missingCollectorConfiguration(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES,
    containerImage: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_CONTAINER_IMAGE,
  }, 'betaToolsLocalAcceptedEvidenceCollector')
  if (missing.length > 0 || secretLikeInputPaths.length > 0) {
    throw new Error(`Local accepted evidence collector inputs are incomplete: ${[...missing, ...secretLikeInputPaths].join('; ')}`)
  }

  const localBundle = runBetaToolsLocalAcceptedEvidenceBundle(env, libassRunner)
  if (!localBundle.ok || !localBundle.readyToRecordDeployedEvidence) {
    throw new Error('Local accepted evidence bundle is not ready to record deployed evidence.')
  }
  const libassEvidencePacket = localBundle.libassPreview.evidencePacket
  if (!libassEvidencePacket?.acceptedToolEvidence?.some((record) => record.toolId === 'libass')) {
    throw new Error('Local accepted evidence bundle did not produce accepted libass evidence.')
  }

  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN')
  const coreEvidence = await postCoreEvidence(env, baseUrl, bearerToken, fetchImpl)
  const libassEvidence = await postGenericEvidence(
    libassEvidencePacket,
    baseUrl,
    bearerToken,
    requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY'),
    fetchImpl,
  )
  const operatorReadback = await runBetaReadinessOperatorStatusApiFromEnv({
    REEDITPRO_BETA_STATUS_API_BASE_URL: baseUrl,
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: bearerToken,
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID'),
  }, fetchImpl)
  const requireOperatorReadback = parseBoolean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK)
  const requiredProductReadyLocalOssCount = parseRequiredCount(
    env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT,
    localBundle.locallyAcceptedToolCount,
  )
  const readbackCount = operatorReadback.currentGate.productReadyLocalOssCount ?? 0
  const productReadyLocalOssCountSatisfied = readbackCount >= requiredProductReadyLocalOssCount

  if (requireOperatorReadback && !productReadyLocalOssCountSatisfied) {
    throw new Error(`Operator status readback product-ready local OSS count ${readbackCount} is below required count ${requiredProductReadyLocalOssCount}.`)
  }

  return {
    ok: coreEvidence.ok &&
      libassEvidence.ok &&
      operatorReadback.ok &&
      (!requireOperatorReadback || productReadyLocalOssCountSatisfied),
    endpointBaseUrl: baseUrl,
    noBackendEvidenceRecorded: false,
    localBundle: {
      ok: localBundle.ok,
      locallyAcceptedToolIds: localBundle.locallyAcceptedToolIds,
      locallyAcceptedToolCount: localBundle.locallyAcceptedToolCount,
      readyToRecordDeployedEvidence: localBundle.readyToRecordDeployedEvidence,
    },
    coreEvidence,
    libassEvidence,
    operatorReadback,
    readbackRequirements: {
      requireOperatorReadback,
      requiredProductReadyLocalOssCount,
      productReadyLocalOssCountSatisfied,
    },
    remainingGateBlockers: [
      'platform_billing_deployment_evidence_pending',
      'launch_owner_approval_evidence_pending',
      'final_external_beta_go_no_go_readback_pending',
    ],
    warnings: [
      'This collector records only accepted tool evidence; it does not record platform evidence or launch approval evidence.',
      'Core checks run through the deployed backend core real-check route; libass evidence is recorded only after the local synthetic bundle passes.',
      'No user media, provider call, worker dispatch, direct Supabase write, external beta activation, paid production activation, or public artifact is authorized by this collector.',
    ],
  }
}

async function postCoreEvidence(
  env: BetaToolsLocalAcceptedEvidenceCollectorEnv,
  baseUrl: string,
  bearerToken: string,
  fetchImpl: BetaToolsLocalAcceptedEvidenceCollectorFetch,
): Promise<BetaToolsCoreRealCheckEvidenceRunResult> {
  const endpoint = `${baseUrl}/v1/beta-readiness/evidence/core-real-check`
  const request = buildBetaToolsCoreRealCheckEvidenceRequest({
    REEDITPRO_BETA_TOOLS_WORKSPACE_ID: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_WORKSPACE_ID'),
    REEDITPRO_BETA_TOOLS_PROJECT_ID: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_PROJECT_ID),
    REEDITPRO_BETA_TOOLS_SOURCE_ID: sourceId(env, 'core-real-check'),
    REEDITPRO_BETA_TOOLS_SOURCE_SHA: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_SHA'),
    REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: notes(env),
    REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_TOOL_IDS),
    REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS: 'false',
    REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCTION_READINESS,
    REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE,
    REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_ACCEPT_PRODUCT_READY_LOCAL_OSS,
    REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE,
    REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE: env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE,
  })
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': requiredEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'),
    },
    body: JSON.stringify(request),
  })
  const payload = await response.json()
  const result = summarizeCoreRealCheckEvidenceResponse(endpoint, response.status, payload)
  if (parseBoolean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_CORE_ACCEPTED_EVIDENCE) && result.acceptedToolCount === 0) {
    throw new Error('Deployed core real-check evidence did not accept any tools.')
  }
  return result
}

async function postGenericEvidence(
  packet: BetaReadinessEvidencePacketInput,
  baseUrl: string,
  bearerToken: string,
  idempotencyKey: string,
  fetchImpl: BetaToolsLocalAcceptedEvidenceCollectorFetch,
): Promise<BetaToolsLocalAcceptedEvidenceCollectorRunResult['libassEvidence']> {
  const endpoint = `${baseUrl}/v1/beta-readiness/evidence`
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(packet),
  })
  const payload = await response.json()
  return summarizeGenericEvidenceResponse(endpoint, response.status, payload)
}

function summarizeGenericEvidenceResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaToolsLocalAcceptedEvidenceCollectorRunResult['libassEvidence'] {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packet = isRecord(data.packet) ? data.packet : {}
  const evidence = isRecord(packet.evidence) ? packet.evidence : {}
  const acceptedToolEvidence = Array.isArray(evidence.acceptedToolEvidence) ? evidence.acceptedToolEvidence : []
  const acceptedToolIds = acceptedToolEvidence
    .map((record) => (isRecord(record) && typeof record.toolId === 'string' ? record.toolId : undefined))
    .filter((toolId): toolId is string => Boolean(toolId))
  const report = isRecord(data.report) ? data.report : {}
  const toolExecutionReadiness = isRecord(report.toolExecutionReadiness) ? report.toolExecutionReadiness : {}
  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    replayed: booleanValue(data.replayed),
    evidencePacketId: stringValue(packet.id),
    acceptedToolIds,
    acceptedToolCount: acceptedToolIds.length,
    productReadyLocalOssCount: numberValue(toolExecutionReadiness.productReadyLocalOssCount),
  }
}

function missingCollectorConfiguration(env: BetaToolsLocalAcceptedEvidenceCollectorEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_CORE_IDEMPOTENCY_KEY'),
    missingEnv(env, 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_LIBASS_IDEMPOTENCY_KEY'),
    parseBoolean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK)
      ? undefined
      : 'REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRE_OPERATOR_READBACK=true is required so deployed status readback is verified.',
  ].filter((item): item is string => Boolean(item))
}

function parseRequiredCount(value: string | undefined, fallback: number): number {
  const cleaned = clean(value)
  if (!cleaned) return fallback
  const parsed = Number.parseInt(cleaned, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error('REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_REQUIRED_PRODUCT_READY_LOCAL_OSS_COUNT must be a positive integer.')
  }
  return parsed
}

function missingEnv(env: BetaToolsLocalAcceptedEvidenceCollectorEnv, name: keyof BetaToolsLocalAcceptedEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: BetaToolsLocalAcceptedEvidenceCollectorEnv, name: keyof BetaToolsLocalAcceptedEvidenceCollectorEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function sourceId(env: BetaToolsLocalAcceptedEvidenceCollectorEnv, suffix: string): string {
  const base = clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_SOURCE_ID) ?? 'beta-tools-local-accepted-evidence-collector'
  return `${base}:${suffix}`
}

function notes(env: BetaToolsLocalAcceptedEvidenceCollectorEnv): string {
  return clean(env.REEDITPRO_BETA_TOOLS_LOCAL_BUNDLE_NOTES) ??
    'Deployed accepted evidence collector for local core/libass bundle.'
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaToolsLocalAcceptedEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Local accepted evidence collector failed.')
    process.exitCode = 1
  }
}
