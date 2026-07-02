import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface BetaToolsCoreRealCheckEvidenceEnv {
  REEDITPRO_BETA_TOOLS_API_BASE_URL?: string
  REEDITPRO_BETA_TOOLS_BEARER_TOKEN?: string
  REEDITPRO_BETA_TOOLS_WORKSPACE_ID?: string
  REEDITPRO_BETA_TOOLS_PROJECT_ID?: string
  REEDITPRO_BETA_TOOLS_SOURCE_ID?: string
  REEDITPRO_BETA_TOOLS_SOURCE_SHA?: string
  REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY?: string
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES?: string
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS?: string
  REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS?: string
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS?: string
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE?: string
  REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE?: string
}

export interface BetaToolsCoreRealCheckEvidenceRequest {
  workspaceId: string
  projectId?: string
  sourceId: string
  sourceSha?: string
  notes: string[]
  acceptProductionReadiness: boolean
  acceptProductReadyLocalOss: boolean
  includeWarnings: boolean
  toolIds?: ProductionToolId[]
}

export interface BetaToolsCoreRealCheckEvidenceRunResult {
  ok: boolean
  status: number
  endpoint: string
  acceptedToolIds: string[]
  acceptedToolCount: number
  skippedToolCount: number
  readinessSummary?: unknown
  toolExecution: {
    productReadyLocalOssCount?: number
    externalBetaToolExecutionAllowed?: boolean
    productionToolExecutionAllowed?: boolean
    blockers?: number
    platformBlockers?: number
  }
  warnings: string[]
}

export type CoreRealCheckEvidenceFetch = (
  url: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runBetaToolsCoreRealCheckEvidenceFromEnv(
  env: BetaToolsCoreRealCheckEvidenceEnv,
  fetchImpl: CoreRealCheckEvidenceFetch = fetch as CoreRealCheckEvidenceFetch,
): Promise<BetaToolsCoreRealCheckEvidenceRunResult> {
  const baseUrl = requiredEnv(env, 'REEDITPRO_BETA_TOOLS_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_BETA_TOOLS_BEARER_TOKEN')
  const idempotencyKey = requiredEnv(env, 'REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY')
  const request = buildBetaToolsCoreRealCheckEvidenceRequest(env)
  assertNoSecretLikeCoreRealCheckRequest(request)
  const endpoint = `${baseUrl}/v1/beta-readiness/evidence/core-real-check`

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(request),
  })
  const payload = await response.json()
  const result = summarizeCoreRealCheckEvidenceResponse(endpoint, response.status, payload)

  if (parseBoolean(env.REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE) && result.acceptedToolCount === 0) {
    throw new Error('Core real-check evidence did not accept any tools.')
  }

  return result
}

export function buildBetaToolsCoreRealCheckEvidenceRequest(
  env: BetaToolsCoreRealCheckEvidenceEnv,
): BetaToolsCoreRealCheckEvidenceRequest {
  const acceptProductionReadiness = parseBoolean(env.REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS)
  const acceptProductReadyLocalOss = parseBoolean(env.REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS)

  if (acceptProductionReadiness && !parseBoolean(env.REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)) {
    throw new Error('Production readiness acceptance requires REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true.')
  }
  if (acceptProductReadyLocalOss && !parseBoolean(env.REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)) {
    throw new Error('Product-ready local OSS acceptance requires REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true.')
  }

  return {
    workspaceId: requiredEnv(env, 'REEDITPRO_BETA_TOOLS_WORKSPACE_ID'),
    projectId: clean(env.REEDITPRO_BETA_TOOLS_PROJECT_ID),
    sourceId: clean(env.REEDITPRO_BETA_TOOLS_SOURCE_ID) ?? 'beta-tools-core-real-check-evidence-cli',
    sourceSha: clean(env.REEDITPRO_BETA_TOOLS_SOURCE_SHA),
    notes: buildNotes(env),
    acceptProductionReadiness,
    acceptProductReadyLocalOss,
    includeWarnings: parseBoolean(env.REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS),
    toolIds: parseToolIds(env.REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS),
  }
}

export function summarizeCoreRealCheckEvidenceResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): BetaToolsCoreRealCheckEvidenceRunResult {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const acceptedToolEvidence = Array.isArray(data.acceptedToolEvidence) ? data.acceptedToolEvidence : []
  const skippedToolResults = Array.isArray(data.skippedToolResults) ? data.skippedToolResults : []
  const acceptedToolIds = acceptedToolEvidence
    .map((record) => (isRecord(record) && typeof record.toolId === 'string' ? record.toolId : undefined))
    .filter((toolId): toolId is string => Boolean(toolId))
  const report = isRecord(data.report) ? data.report : {}
  const toolExecutionReadiness = isRecord(report.toolExecutionReadiness) ? report.toolExecutionReadiness : {}

  return {
    ok: Boolean(isRecord(payload) && payload.ok === true),
    status,
    endpoint,
    acceptedToolIds,
    acceptedToolCount: acceptedToolIds.length,
    skippedToolCount: skippedToolResults.length,
    readinessSummary: data.readinessSummary,
    toolExecution: {
      productReadyLocalOssCount: numberValue(toolExecutionReadiness.productReadyLocalOssCount),
      externalBetaToolExecutionAllowed: booleanValue(toolExecutionReadiness.externalBetaToolExecutionAllowed),
      productionToolExecutionAllowed: booleanValue(toolExecutionReadiness.productionToolExecutionAllowed),
      blockers: Array.isArray(toolExecutionReadiness.blockers) ? toolExecutionReadiness.blockers.length : undefined,
      platformBlockers: Array.isArray(toolExecutionReadiness.platformBlockers) ? toolExecutionReadiness.platformBlockers.length : undefined,
    },
    warnings: stringArray(isRecord(payload) ? payload.warnings : undefined),
  }
}

function buildNotes(env: BetaToolsCoreRealCheckEvidenceEnv): string[] {
  const note = clean(env.REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES)
  return [
    note ?? 'Collected through beta tools core real-check evidence CLI.',
    'Evidence is limited to bounded command/import/package metadata checks; no media processing, provider calls, Docker run, beta activation, or production activation.',
  ]
}

function parseToolIds(value: string | undefined): ProductionToolId[] | undefined {
  const rawToolIds = clean(value)
  if (!rawToolIds) return undefined
  const knownToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
  const parsed = rawToolIds.split(',').map((toolId) => toolId.trim()).filter(Boolean)
  const unknown = parsed.filter((toolId) => !knownToolIds.has(toolId))
  if (unknown.length > 0) {
    throw new Error(`Unknown production tool IDs: ${unknown.join(', ')}`)
  }
  return [...new Set(parsed)] as ProductionToolId[]
}

function assertNoSecretLikeCoreRealCheckRequest(request: BetaToolsCoreRealCheckEvidenceRequest): void {
  const secretPaths = collectSecretLikePaths(request, 'betaToolsCoreRealCheckEvidenceRequest')
  if (secretPaths.length > 0) {
    throw new Error(`Core real-check evidence request contains secret-like fields: ${secretPaths.join(', ')}`)
  }
}

function requiredEnv(env: BetaToolsCoreRealCheckEvidenceEnv, name: keyof BetaToolsCoreRealCheckEvidenceEnv): string {
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaToolsCoreRealCheckEvidenceFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Core real-check evidence CLI failed.')
    process.exitCode = 1
  }
}
