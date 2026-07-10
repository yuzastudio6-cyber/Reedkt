import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaReadinessOperatorStatusApiEnv {
  REEDITPRO_BETA_STATUS_API_BASE_URL?: string
  REEDITPRO_BETA_STATUS_BEARER_TOKEN?: string
  REEDITPRO_BETA_STATUS_WORKSPACE_ID?: string
  REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY?: string
  REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY?: string
  REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY?: string
}

export interface BetaReadinessOperatorStatusApiRunResult {
  ok: boolean
  status: number
  endpoint: string
  evidenceSource?: string
  workspaceId?: string
  evidencePacketCount?: number
  readyForExternalBeta?: boolean
  readyForRealUserMediaBeta?: boolean
  readyForPaidProduction?: boolean
  currentGate: {
    totalTools?: number
    ownerCoverageToolCount?: number
    readinessSpecToolCount?: number
    toolBlockers?: number
    platformBlockers?: number
    productReadyLocalOssCount?: number
    externalBetaToolExecutionAllowed?: boolean
    productionToolExecutionAllowed?: boolean
    blockerPolicy?: string
    blockerForwardProgressPolicy?: {
      intentionalBlanketBlocksAllowed?: boolean
      blockerScope?: string
      safeForwardProgressRequired?: boolean
      nextSafeActionRequiredForBlockers?: boolean
    }
    safeBlockerReductionAllowed?: boolean
    blockedActionScope: string[]
    allowedForwardProgressScopes: string[]
  }
  evidenceGaps: {
    goNoGoBlockers: number
    blockedChecklistItems: string[]
    toolBlockers?: number
    platformBlockers: string[]
  }
  nextActions: string[]
  warnings: string[]
}

export type BetaReadinessOperatorStatusApiFetch = (
  url: string,
  init: {
    method: 'GET'
    headers: Record<string, string>
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaReadinessOperatorStatusApiFromEnv(
  env: BetaReadinessOperatorStatusApiEnv,
  fetchImpl: BetaReadinessOperatorStatusApiFetch = fetch as BetaReadinessOperatorStatusApiFetch,
): Promise<BetaReadinessOperatorStatusApiRunResult> {
  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_STATUS_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_STATUS_BEARER_TOKEN')
  const workspaceId = clean(env.REEDITPRO_BETA_STATUS_WORKSPACE_ID)
  assertNoSecretLikeStatusQuery({ workspaceId })
  const endpoint = buildOperatorStatusEndpoint(baseUrl, workspaceId)

  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
  })
  const payload = await response.json()
  const result = summarizeOperatorStatusApiResponse(endpoint, response.status, payload)

  if (parseBoolean(env.REEDITPRO_BETA_STATUS_REQUIRE_EXTERNAL_BETA_READY) && result.readyForExternalBeta !== true) {
    throw new Error('Operator status reports external beta is not ready.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_STATUS_REQUIRE_REAL_USER_MEDIA_BETA_READY) && result.readyForRealUserMediaBeta !== true) {
    throw new Error('Operator status reports real user media beta is not ready.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_STATUS_REQUIRE_PAID_PRODUCTION_READY) && result.readyForPaidProduction !== true) {
    throw new Error('Operator status reports paid production is not ready.')
  }

  return result
}

export function buildOperatorStatusEndpoint(baseUrl: string, workspaceId?: string): string {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/beta-readiness/operator-status`
  if (!workspaceId) return endpoint
  return `${endpoint}?workspaceId=${encodeURIComponent(workspaceId)}`
}

export function summarizeOperatorStatusApiResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaReadinessOperatorStatusApiRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const operatorStatus = isRecord(data.status) ? data.status : {}
  const currentGate = isRecord(operatorStatus.currentGate) ? operatorStatus.currentGate : {}
  const blockerForwardProgressPolicy = isRecord(currentGate.blockerForwardProgressPolicy)
    ? currentGate.blockerForwardProgressPolicy
    : undefined
  const evidenceGaps = isRecord(operatorStatus.evidenceGaps) ? operatorStatus.evidenceGaps : {}
  const statusWarnings = stringArray(operatorStatus.warnings)
  const responseWarnings = stringArray(isRecord(payload) ? payload.warnings : undefined)

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    evidenceSource: stringValue(operatorStatus.evidenceSource),
    workspaceId: stringValue(operatorStatus.workspaceId),
    evidencePacketCount: numberValue(operatorStatus.evidencePacketCount),
    readyForExternalBeta: booleanValue(operatorStatus.readyForExternalBeta),
    readyForRealUserMediaBeta: booleanValue(operatorStatus.readyForRealUserMediaBeta),
    readyForPaidProduction: booleanValue(operatorStatus.readyForPaidProduction),
    currentGate: {
      totalTools: numberValue(currentGate.totalTools),
      ownerCoverageToolCount: numberValue(currentGate.ownerCoverageToolCount),
      readinessSpecToolCount: numberValue(currentGate.readinessSpecToolCount),
      toolBlockers: numberValue(currentGate.toolBlockers),
      platformBlockers: numberValue(currentGate.platformBlockers),
      productReadyLocalOssCount: numberValue(currentGate.productReadyLocalOssCount),
      externalBetaToolExecutionAllowed: booleanValue(currentGate.externalBetaToolExecutionAllowed),
      productionToolExecutionAllowed: booleanValue(currentGate.productionToolExecutionAllowed),
      blockerPolicy: stringValue(currentGate.blockerPolicy),
      blockerForwardProgressPolicy: blockerForwardProgressPolicy
        ? {
          intentionalBlanketBlocksAllowed: booleanValue(blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed),
          blockerScope: stringValue(blockerForwardProgressPolicy.blockerScope),
          safeForwardProgressRequired: booleanValue(blockerForwardProgressPolicy.safeForwardProgressRequired),
          nextSafeActionRequiredForBlockers: booleanValue(blockerForwardProgressPolicy.nextSafeActionRequiredForBlockers),
        }
        : undefined,
      safeBlockerReductionAllowed: booleanValue(currentGate.safeBlockerReductionAllowed),
      blockedActionScope: stringArray(currentGate.blockedActionScope),
      allowedForwardProgressScopes: stringArray(currentGate.allowedForwardProgressScopes),
    },
    evidenceGaps: {
      goNoGoBlockers: stringArray(evidenceGaps.goNoGoBlockers).length,
      blockedChecklistItems: stringArray(evidenceGaps.blockedChecklistItems),
      toolBlockers: numberValue(evidenceGaps.toolBlockers),
      platformBlockers: stringArray(evidenceGaps.platformBlockers),
    },
    nextActions: stringArray(operatorStatus.nextActions),
    warnings: [...new Set([...statusWarnings, ...responseWarnings])],
  }
}

function assertNoSecretLikeStatusQuery(query: { workspaceId?: string }): void {
  const secretPaths = collectSecretLikePaths(query, 'betaReadinessOperatorStatusQuery')
  if (secretPaths.length > 0) {
    throw new Error(`Operator status query contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function requiredEnv(env: BetaReadinessOperatorStatusApiEnv, name: keyof BetaReadinessOperatorStatusApiEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaReadinessOperatorStatusApiFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Beta readiness operator status API CLI failed.')
    process.exitCode = 1
  }
}
