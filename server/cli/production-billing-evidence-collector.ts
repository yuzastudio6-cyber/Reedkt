import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionBillingEvidenceCollectorEnv {
  REEDITPRO_PRODUCTION_BILLING_API_BASE_URL?: string
  REEDITPRO_PRODUCTION_BILLING_BEARER_TOKEN?: string
  REEDITPRO_PRODUCTION_BILLING_WORKSPACE_ID?: string
  REEDITPRO_PRODUCTION_BILLING_PROJECT_ID?: string
  REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA?: string
  REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY?: string
  REEDITPRO_PRODUCTION_BILLING_SETTLEMENT_IDEMPOTENCY_KEY?: string
  REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE?: string
  REEDITPRO_PRODUCTION_BILLING_REQUIRE_REPLAY_READBACK?: string
  REEDITPRO_PRODUCTION_BILLING_CREDIT_ESTIMATE_ID?: string
  REEDITPRO_PRODUCTION_BILLING_CREDIT_RESERVATION_ID?: string
  REEDITPRO_PRODUCTION_BILLING_APPROVED_RESERVATION_REMAINING_CREDITS?: string
}

export interface ProductionBillingEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded'
  endpointBaseUrl?: string
  readyForRouteEvidence: boolean
  routeEvidenceConfirmationRequired: boolean
  requestPlan: {
    eventEndpoint?: string
    settlementEndpointTemplate?: string
    summaryEndpoint?: string
    workspaceId: string
    projectId: string
    sourceShaPresent: boolean
  }
  evidence?: {
    event: ProductionBillingEventSummary
    eventReplay: ProductionBillingEventSummary
    settlement: ProductionBillingSettlementSummary
    settlementReplay: ProductionBillingSettlementSummary
    summary: ProductionBillingProjectSummary
  }
  checks: {
    toolCostEventWriteVerified: boolean
    toolCostEventIdempotentReplayVerified: boolean
    projectSummaryReadbackVerified: boolean
    walletSettlementVerified: boolean
    walletSettlementReplayVerified: boolean
    creditReservationRequired: boolean
    stripeBoundaryPreserved: boolean
    serviceFeeExcluded: boolean
    noSilentChargeVerified: boolean
  }
  warnings: string[]
}

export interface ProductionBillingEventSummary {
  ok: boolean
  status: number
  endpoint: string
  replayed?: boolean
  eventId?: string
  workspaceId?: string
  projectId?: string
  creditEstimateId?: string | null
  creditReservationId?: string | null
  toolCostCredits?: number
  billableToUser?: boolean
  stripeCallAttempted?: boolean
  serviceFeeIncluded?: boolean
  warnings: string[]
}

export interface ProductionBillingSettlementSummary {
  ok: boolean
  status: number
  endpoint: string
  replayed?: boolean
  settlementId?: string
  walletMutationMode?: string
  statusLabel?: string
  creditsDelta?: number
  creditReservationId?: string | null
  stripeCallAttempted?: boolean
  serviceFeeIncluded?: boolean
  warnings: string[]
}

export interface ProductionBillingProjectSummary {
  ok: boolean
  status: number
  endpoint: string
  billableEventCount?: number
  actualToolCostCredits?: number
  eventCount?: number
  warnings: string[]
}

export type ProductionBillingEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runProductionBillingEvidenceCollectorFromEnv(
  env: ProductionBillingEvidenceCollectorEnv,
  fetchImpl: ProductionBillingEvidenceCollectorFetch = fetch as ProductionBillingEvidenceCollectorFetch,
): Promise<ProductionBillingEvidenceCollectorRunResult> {
  const workspaceId = clean(env.REEDITPRO_PRODUCTION_BILLING_WORKSPACE_ID) ?? 'workspace-production-billing-evidence'
  const projectId = clean(env.REEDITPRO_PRODUCTION_BILLING_PROJECT_ID) ?? 'project-production-billing-evidence'
  const endpointBaseUrl = clean(env.REEDITPRO_PRODUCTION_BILLING_API_BASE_URL)?.replace(/\/+$/, '')
  const requestPlan = {
    eventEndpoint: endpointBaseUrl ? `${endpointBaseUrl}/v1/tool-costs/events` : undefined,
    settlementEndpointTemplate: endpointBaseUrl ? `${endpointBaseUrl}/v1/tool-costs/events/:toolCostEventId/settle` : undefined,
    summaryEndpoint: endpointBaseUrl ? `${endpointBaseUrl}/v1/projects/${encodeURIComponent(projectId)}/tool-cost-summary?workspaceId=${encodeURIComponent(workspaceId)}` : undefined,
    workspaceId,
    projectId,
    sourceShaPresent: Boolean(clean(env.REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA)),
  }
  const checks = emptyChecks()
  const confirmRouteEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE)
  const secretLikeConfigPaths = collectSecretLikePaths({
    apiBaseUrl: env.REEDITPRO_PRODUCTION_BILLING_API_BASE_URL,
    workspaceId,
    projectId,
    sourceSha: env.REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA,
    eventIdempotencyKey: env.REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY,
    settlementIdempotencyKey: env.REEDITPRO_PRODUCTION_BILLING_SETTLEMENT_IDEMPOTENCY_KEY,
  }, 'productionBillingEvidenceCollector')

  if (secretLikeConfigPaths.length > 0) {
    throw new Error(`Production billing evidence collector inputs contain secret-like values: ${secretLikeConfigPaths.join('; ')}`)
  }

  if (!confirmRouteEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      endpointBaseUrl,
      readyForRouteEvidence: true,
      routeEvidenceConfirmationRequired: true,
      requestPlan,
      checks,
      warnings: [
        'Dry-run only: REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE=true is required before backend event/settlement/summary calls.',
        'This collector uses backend billing routes only; it does not call Stripe, run tools, dispatch workers, process media, or write Supabase directly.',
      ],
    }
  }

  const missing = missingCollectorConfiguration(env)
  if (missing.length > 0) {
    throw new Error(`Production billing evidence collector inputs are incomplete: ${missing.join('; ')}`)
  }

  const bearerToken = requiredEnv(env, 'REEDITPRO_PRODUCTION_BILLING_BEARER_TOKEN')
  const eventIdempotencyKey = requiredEnv(env, 'REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY')
  const settlementIdempotencyKey = requiredEnv(env, 'REEDITPRO_PRODUCTION_BILLING_SETTLEMENT_IDEMPOTENCY_KEY')
  const baseUrl = requiredEnv(env, 'REEDITPRO_PRODUCTION_BILLING_API_BASE_URL').replace(/\/+$/, '')
  const eventEndpoint = `${baseUrl}/v1/tool-costs/events`
  const eventBody = buildEventBody(env, workspaceId, projectId)
  const event = summarizeEventResponse(eventEndpoint, await postJson(fetchImpl, eventEndpoint, bearerToken, eventIdempotencyKey, eventBody))
  const eventReplay = summarizeEventResponse(eventEndpoint, await postJson(fetchImpl, eventEndpoint, bearerToken, eventIdempotencyKey, eventBody))

  if (!event.ok || !event.eventId || event.toolCostCredits === undefined || !event.creditReservationId || event.billableToUser !== true) {
    throw new Error('Production billing event route did not return a billable event with a credit reservation.')
  }
  if (eventReplay.replayed !== true || eventReplay.eventId !== event.eventId) {
    throw new Error('Production billing event idempotent replay did not return the original event.')
  }

  const settlementBody = {
    workspaceId,
    projectId,
    creditEstimateId: event.creditEstimateId,
    creditReservationId: event.creditReservationId,
    toolCostCredits: event.toolCostCredits,
    billableToUser: true,
    failureCategory: 'none',
    settlementType: 'spend',
    metadata: {
      sourceId: 'production-billing-evidence-collector',
      sourceSha: clean(env.REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA),
      productionBillingEvidenceCollector: true,
      stripeCallAttempted: false,
      serviceFeeIncluded: false,
    },
  }
  const settlementEndpoint = `${baseUrl}/v1/tool-costs/events/${encodeURIComponent(event.eventId)}/settle`
  const settlement = summarizeSettlementResponse(settlementEndpoint, await postJson(fetchImpl, settlementEndpoint, bearerToken, settlementIdempotencyKey, settlementBody))
  const settlementReplay = summarizeSettlementResponse(settlementEndpoint, await postJson(fetchImpl, settlementEndpoint, bearerToken, settlementIdempotencyKey, settlementBody))

  const summaryEndpoint = `${baseUrl}/v1/projects/${encodeURIComponent(projectId)}/tool-cost-summary?workspaceId=${encodeURIComponent(workspaceId)}`
  const summary = summarizeProjectSummaryResponse(summaryEndpoint, await getJson(fetchImpl, summaryEndpoint, bearerToken))
  const resultChecks = {
    toolCostEventWriteVerified: event.ok && event.replayed === false,
    toolCostEventIdempotentReplayVerified: eventReplay.ok && eventReplay.replayed === true && eventReplay.eventId === event.eventId,
    projectSummaryReadbackVerified: summary.ok && (summary.eventCount ?? 0) > 0 && (summary.actualToolCostCredits ?? 0) >= (event.toolCostCredits ?? 0),
    walletSettlementVerified: settlement.ok && settlement.replayed === false && settlement.creditsDelta === -event.toolCostCredits,
    walletSettlementReplayVerified: settlementReplay.ok && settlementReplay.replayed === true && settlementReplay.settlementId === settlement.settlementId,
    creditReservationRequired: Boolean(event.creditReservationId && settlement.creditReservationId === event.creditReservationId),
    stripeBoundaryPreserved: event.stripeCallAttempted === false && settlement.stripeCallAttempted === false,
    serviceFeeExcluded: event.serviceFeeIncluded === false && settlement.serviceFeeIncluded === false,
    noSilentChargeVerified: Boolean(event.creditEstimateId && event.creditReservationId && settlement.creditsDelta === -event.toolCostCredits),
  }
  const ok = Object.values(resultChecks).every(Boolean)
  if (!ok && env.REEDITPRO_PRODUCTION_BILLING_REQUIRE_REPLAY_READBACK !== 'false') {
    throw new Error('Production billing evidence collector did not verify every required event, settlement, replay, and summary check.')
  }

  return {
    ok,
    mode: 'recorded',
    endpointBaseUrl: baseUrl,
    readyForRouteEvidence: true,
    routeEvidenceConfirmationRequired: false,
    requestPlan: {
      ...requestPlan,
      eventEndpoint,
      settlementEndpointTemplate: `${baseUrl}/v1/tool-costs/events/:toolCostEventId/settle`,
      summaryEndpoint,
    },
    evidence: {
      event,
      eventReplay,
      settlement,
      settlementReplay,
      summary,
    },
    checks: resultChecks,
    warnings: [
      ...event.warnings,
      ...eventReplay.warnings,
      ...settlement.warnings,
      ...settlementReplay.warnings,
      ...summary.warnings,
      'Production billing evidence collector used backend routes only; it did not call Stripe, run tools, dispatch workers, process media, or write Supabase directly.',
    ],
  }
}

function buildEventBody(
  env: ProductionBillingEvidenceCollectorEnv,
  workspaceId: string,
  projectId: string,
): Record<string, unknown> {
  const creditEstimateId = clean(env.REEDITPRO_PRODUCTION_BILLING_CREDIT_ESTIMATE_ID) ?? 'production-billing-evidence-credit-estimate'
  const creditReservationId = clean(env.REEDITPRO_PRODUCTION_BILLING_CREDIT_RESERVATION_ID) ?? 'production-billing-evidence-credit-reservation'
  return {
    workspaceId,
    projectId,
    editPlanId: 'production-billing-evidence-edit-plan',
    jobId: 'production-billing-evidence-job',
    creditEstimateId,
    creditReservationId,
    toolId: 'production-billing-evidence-tool',
    toolName: 'Production billing evidence route proof',
    usageCategory: 'qa',
    providerType: 'cloud_run_job',
    qualityLevel: 'production',
    startedAt: '2026-07-03T00:00:00.000Z',
    completedAt: '2026-07-03T00:00:12.000Z',
    wallClockMs: 12_000,
    billableToUser: true,
    approvedReservationRemainingCredits: parseCredits(env.REEDITPRO_PRODUCTION_BILLING_APPROVED_RESERVATION_REMAINING_CREDITS) ?? 25,
    vcpuCount: 1,
    memoryGiB: 1,
    metadata: {
      sourceId: 'production-billing-evidence-collector',
      sourceSha: clean(env.REEDITPRO_PRODUCTION_BILLING_SOURCE_SHA),
      productionBillingEvidenceCollector: true,
      stripeCallAttempted: false,
      serviceFeeIncluded: false,
      liveToolExecution: false,
    },
  }
}

async function postJson(
  fetchImpl: ProductionBillingEvidenceCollectorFetch,
  endpoint: string,
  bearerToken: string,
  idempotencyKey: string,
  body: Record<string, unknown>,
): Promise<{ status: number; payload: unknown }> {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

async function getJson(
  fetchImpl: ProductionBillingEvidenceCollectorFetch,
  endpoint: string,
  bearerToken: string,
): Promise<{ status: number; payload: unknown }> {
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
  })
  return { status: response.status, payload: await response.json() }
}

function summarizeEventResponse(endpoint: string, response: { status: number; payload: unknown }): ProductionBillingEventSummary {
  const data = isRecord(response.payload) && isRecord(response.payload.data) ? response.payload.data : {}
  const event = isRecord(data.event) ? data.event : {}
  const metadata = isRecord(event.metadata) ? event.metadata : {}
  return {
    ok: isRecord(response.payload) && response.payload.ok === true,
    status: response.status,
    endpoint,
    replayed: booleanValue(data.replayed),
    eventId: stringValue(event.id),
    workspaceId: stringValue(event.workspaceId),
    projectId: stringValue(event.projectId),
    creditEstimateId: nullableStringValue(event.creditEstimateId),
    creditReservationId: nullableStringValue(event.creditReservationId),
    toolCostCredits: numberValue(event.toolCostCredits),
    billableToUser: booleanValue(event.billableToUser),
    stripeCallAttempted: metadata.stripeCallAttempted === false ? false : booleanValue(metadata.stripeCallAttempted),
    serviceFeeIncluded: metadata.serviceFeeIncluded === false ? false : booleanValue(metadata.serviceFeeIncluded),
    warnings: stringArray(isRecord(response.payload) ? response.payload.warnings : undefined),
  }
}

function summarizeSettlementResponse(endpoint: string, response: { status: number; payload: unknown }): ProductionBillingSettlementSummary {
  const data = isRecord(response.payload) && isRecord(response.payload.data) ? response.payload.data : {}
  const settlement = isRecord(data.settlement) ? data.settlement : {}
  return {
    ok: isRecord(response.payload) && response.payload.ok === true,
    status: response.status,
    endpoint,
    replayed: booleanValue(data.replayed),
    settlementId: stringValue(settlement.id),
    walletMutationMode: stringValue(settlement.walletMutationMode),
    statusLabel: stringValue(settlement.status),
    creditsDelta: numberValue(settlement.creditsDelta),
    creditReservationId: nullableStringValue(settlement.creditReservationId),
    stripeCallAttempted: settlement.stripeCallAttempted === false ? false : booleanValue(settlement.stripeCallAttempted),
    serviceFeeIncluded: settlement.serviceFeeIncluded === false ? false : booleanValue(settlement.serviceFeeIncluded),
    warnings: stringArray(isRecord(response.payload) ? response.payload.warnings : undefined),
  }
}

function summarizeProjectSummaryResponse(endpoint: string, response: { status: number; payload: unknown }): ProductionBillingProjectSummary {
  const data = isRecord(response.payload) && isRecord(response.payload.data) ? response.payload.data : {}
  const summary = isRecord(data.summary) ? data.summary : {}
  const events = Array.isArray(summary.events) ? summary.events : []
  return {
    ok: isRecord(response.payload) && response.payload.ok === true,
    status: response.status,
    endpoint,
    billableEventCount: numberValue(summary.billableEventCount),
    actualToolCostCredits: numberValue(summary.actualToolCostCredits),
    eventCount: events.length,
    warnings: stringArray(isRecord(response.payload) ? response.payload.warnings : undefined),
  }
}

function missingCollectorConfiguration(env: ProductionBillingEvidenceCollectorEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_PROJECT_ID'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_EVENT_IDEMPOTENCY_KEY'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_BILLING_SETTLEMENT_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function emptyChecks(): ProductionBillingEvidenceCollectorRunResult['checks'] {
  return {
    toolCostEventWriteVerified: false,
    toolCostEventIdempotentReplayVerified: false,
    projectSummaryReadbackVerified: false,
    walletSettlementVerified: false,
    walletSettlementReplayVerified: false,
    creditReservationRequired: false,
    stripeBoundaryPreserved: false,
    serviceFeeExcluded: false,
    noSilentChargeVerified: false,
  }
}

function missingEnv(env: ProductionBillingEvidenceCollectorEnv, name: keyof ProductionBillingEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: ProductionBillingEvidenceCollectorEnv, name: keyof ProductionBillingEvidenceCollectorEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function parseCredits(value: string | undefined): number | undefined {
  const parsed = Number(clean(value))
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined
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

function nullableStringValue(value: unknown): string | null | undefined {
  if (value === null) return null
  return stringValue(value)
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runProductionBillingEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Production billing evidence collector failed.')
    process.exitCode = 1
  }
}
