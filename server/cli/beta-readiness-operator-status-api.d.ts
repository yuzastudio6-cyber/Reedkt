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

export function runBetaReadinessOperatorStatusApiFromEnv(
  env: BetaReadinessOperatorStatusApiEnv,
  fetchImpl?: BetaReadinessOperatorStatusApiFetch,
): Promise<BetaReadinessOperatorStatusApiRunResult>

export function buildOperatorStatusEndpoint(baseUrl: string, workspaceId?: string): string

export function summarizeOperatorStatusApiResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaReadinessOperatorStatusApiRunResult
