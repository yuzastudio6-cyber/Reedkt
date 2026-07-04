import {
  buildProductionToolExecutionReadinessEvidencePreflight,
  buildProductionToolExecutionReadinessGateInput,
  type ProductionToolExecutionReadinessEvidencePreflightEnv,
  type ProductionToolExecutionReadinessEvidencePreflightReport,
} from './production-tool-execution-readiness-evidence-preflight'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'

export interface ProductionToolExecutionReadinessEvidenceCollectorEnv
  extends ProductionToolExecutionReadinessEvidencePreflightEnv {
  REEDITPRO_PRODUCTION_READINESS_API_BASE_URL?: string
  REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN?: string
  REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY?: string
  REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE?: string
  REEDITPRO_PRODUCTION_READINESS_REQUIRE_RECORDED_READBACK?: string
}

export interface ProductionToolExecutionReadinessEvidenceCollectorRunResult {
  ok: boolean
  mode: 'dry_run' | 'recorded'
  endpointBaseUrl?: string
  readyForRecord: boolean
  recordConfirmationRequired: boolean
  preflight: ProductionToolExecutionReadinessEvidencePreflightReport
  record?: ProductionToolExecutionReadinessEvidenceRecordSummary
  readback?: ProductionToolExecutionReadinessEvidenceReadbackSummary
  warnings: string[]
}

export interface ProductionToolExecutionReadinessEvidenceRecordSummary {
  ok: boolean
  status: number
  endpoint: string
  replayed?: boolean
  evidencePacketId?: string
  workspaceId?: string
  gateStatus?: string
  productionToolExecutionAllowed?: boolean
  paidProductionAllowed?: boolean
  blockers?: number
  warnings: string[]
}

export interface ProductionToolExecutionReadinessEvidenceReadbackSummary {
  ok: boolean
  status: number
  endpoint: string
  evidencePacketCount?: number
  latestEvidencePacketId?: string
  latestGateStatus?: string
  latestProductionToolExecutionAllowed?: boolean
  latestPaidProductionAllowed?: boolean
  recordedEvidencePacketPresent?: boolean
  recordedEvidencePacketLatest?: boolean
  warnings: string[]
}

export type ProductionToolExecutionReadinessEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export async function runProductionToolExecutionReadinessEvidenceCollectorFromEnv(
  env: ProductionToolExecutionReadinessEvidenceCollectorEnv,
  fetchImpl: ProductionToolExecutionReadinessEvidenceCollectorFetch = fetch as ProductionToolExecutionReadinessEvidenceCollectorFetch,
): Promise<ProductionToolExecutionReadinessEvidenceCollectorRunResult> {
  const preflight = buildProductionToolExecutionReadinessEvidencePreflight(env)
  const confirmRecordEvidence = parseBoolean(env.REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE)
  const requireRecordedReadback = env.REEDITPRO_PRODUCTION_READINESS_REQUIRE_RECORDED_READBACK !== 'false'

  if (!preflight.ok) {
    return {
      ok: false,
      mode: 'dry_run',
      readyForRecord: false,
      recordConfirmationRequired: true,
      preflight,
      warnings: [
        ...preflight.warnings,
        'Production readiness evidence was not sent to the backend because local preflight did not pass.',
      ],
    }
  }

  if (!confirmRecordEvidence) {
    return {
      ok: true,
      mode: 'dry_run',
      readyForRecord: true,
      recordConfirmationRequired: true,
      preflight,
      endpointBaseUrl: clean(env.REEDITPRO_PRODUCTION_READINESS_API_BASE_URL)?.replace(/\/+$/, ''),
      warnings: [
        ...preflight.warnings,
        'Dry-run only: REEDITPRO_PRODUCTION_READINESS_CONFIRM_RECORD_EVIDENCE=true is required before backend evidence POST/readback.',
      ],
    }
  }

  const missing = missingCollectorConfiguration(env)
  const secretLikeConfigPaths = collectSecretLikePaths({
    apiBaseUrl: env.REEDITPRO_PRODUCTION_READINESS_API_BASE_URL,
    idempotencyKey: env.REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY,
    sourceId: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_ID,
    sourceSha: env.REEDITPRO_PRODUCTION_READINESS_SOURCE_SHA,
    workspaceId: env.REEDITPRO_PRODUCTION_READINESS_WORKSPACE_ID,
    projectId: env.REEDITPRO_PRODUCTION_READINESS_PROJECT_ID,
  }, 'productionToolExecutionReadinessEvidenceCollector')
  if (missing.length > 0 || secretLikeConfigPaths.length > 0) {
    throw new Error(`Production readiness evidence collector inputs are incomplete: ${[...missing, ...secretLikeConfigPaths].join('; ')}`)
  }

  const endpointBaseUrl = requiredEnv(env, 'REEDITPRO_PRODUCTION_READINESS_API_BASE_URL').replace(/\/+$/, '')
  const bearerToken = requiredEnv(env, 'REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN')
  const idempotencyKey = requiredEnv(env, 'REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY')
  const request = buildProductionToolExecutionReadinessGateInput(env)
  const recordEndpoint = `${endpointBaseUrl}/v1/beta-readiness/production-tool-execution-readiness/evidence`
  const recordResponse = await fetchImpl(recordEndpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(request),
  })
  const record = summarizeRecordResponse(recordEndpoint, recordResponse.status, await recordResponse.json())
  if (record.ok !== true || record.productionToolExecutionAllowed !== true || record.paidProductionAllowed !== true) {
    throw new Error('Production readiness evidence record did not return a passing production gate report.')
  }

  const readbackEndpoint = `${recordEndpoint}?workspaceId=${encodeURIComponent(request.workspaceId)}`
  const readbackResponse = await fetchImpl(readbackEndpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
  })
  const readback = summarizeReadbackResponse(
    readbackEndpoint,
    readbackResponse.status,
    await readbackResponse.json(),
    record.evidencePacketId,
  )
  if (
    requireRecordedReadback &&
    (
      readback.ok !== true ||
      readback.latestProductionToolExecutionAllowed !== true ||
      readback.latestPaidProductionAllowed !== true ||
      readback.recordedEvidencePacketPresent !== true ||
      readback.recordedEvidencePacketLatest !== true
    )
  ) {
    throw new Error('Production readiness evidence readback did not confirm the recorded passing production gate report as the latest exact evidence packet id.')
  }

  return {
    ok: true,
    mode: 'recorded',
    endpointBaseUrl,
    readyForRecord: true,
    recordConfirmationRequired: false,
    preflight,
    record,
    readback,
    warnings: [
      ...preflight.warnings,
      ...record.warnings,
      ...readback.warnings,
      'Production readiness evidence was recorded through the backend route only; this does not run tools, dispatch workers, mutate wallets, call Stripe, process media, or activate production.',
    ],
  }
}

function missingCollectorConfiguration(env: ProductionToolExecutionReadinessEvidenceCollectorEnv): string[] {
  return [
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_API_BASE_URL'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_BEARER_TOKEN'),
    missingEnv(env, 'REEDITPRO_PRODUCTION_READINESS_IDEMPOTENCY_KEY'),
  ].filter((item): item is string => Boolean(item))
}

function summarizeRecordResponse(
  endpoint: string,
  status: number,
  payload: unknown,
): ProductionToolExecutionReadinessEvidenceRecordSummary {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packet = isRecord(data.packet) ? data.packet : {}
  const report = isRecord(data.report) ? data.report : {}
  return {
    ok: isSuccessfulStatus(status) && isRecord(payload) && payload.ok === true,
    status,
    endpoint,
    replayed: booleanValue(data.replayed),
    evidencePacketId: stringValue(packet.id),
    workspaceId: stringValue(packet.workspaceId),
    gateStatus: stringValue(report.status),
    productionToolExecutionAllowed: booleanValue(report.productionToolExecutionAllowed),
    paidProductionAllowed: booleanValue(report.paidProductionAllowed),
    blockers: Array.isArray(report.blockers) ? report.blockers.length : undefined,
    warnings: stringArray(isRecord(payload) ? payload.warnings : undefined),
  }
}

function summarizeReadbackResponse(
  endpoint: string,
  status: number,
  payload: unknown,
  recordedEvidencePacketId?: string,
): ProductionToolExecutionReadinessEvidenceReadbackSummary {
  const data = isRecord(payload) && isRecord(payload.data) ? payload.data : {}
  const packets = Array.isArray(data.packets) ? data.packets.filter(isRecord) : []
  const latestPacket = isRecord(data.latestPacket)
    ? data.latestPacket
    : packets.length > 0
      ? packets[packets.length - 1]
      : {}
  const latestReport = isRecord(data.latestReport) ? data.latestReport : {}
  const readinessSummary = isRecord(data.readinessSummary) ? data.readinessSummary : {}
  const latestEvidencePacketId = stringValue(readinessSummary.latestEvidencePacketId) ?? stringValue(latestPacket.id)
  const packetIds = packets.map((packet) => stringValue(packet.id)).filter((id): id is string => Boolean(id))
  const recordedEvidencePacketPresent = recordedEvidencePacketId
    ? packetIds.includes(recordedEvidencePacketId) || latestEvidencePacketId === recordedEvidencePacketId
    : undefined
  const recordedEvidencePacketLatest = recordedEvidencePacketId
    ? latestEvidencePacketId === recordedEvidencePacketId
    : undefined
  return {
    ok: isSuccessfulStatus(status) && isRecord(payload) && payload.ok === true,
    status,
    endpoint,
    evidencePacketCount: numberValue(data.evidencePacketCount),
    latestEvidencePacketId,
    latestGateStatus: stringValue(latestReport.status),
    latestProductionToolExecutionAllowed: booleanValue(latestReport.productionToolExecutionAllowed),
    latestPaidProductionAllowed: booleanValue(latestReport.paidProductionAllowed),
    recordedEvidencePacketPresent,
    recordedEvidencePacketLatest,
    warnings: stringArray(isRecord(payload) ? payload.warnings : undefined),
  }
}

function missingEnv(env: ProductionToolExecutionReadinessEvidenceCollectorEnv, name: keyof ProductionToolExecutionReadinessEvidenceCollectorEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: ProductionToolExecutionReadinessEvidenceCollectorEnv, name: keyof ProductionToolExecutionReadinessEvidenceCollectorEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function isSuccessfulStatus(status: number): boolean {
  return status >= 200 && status < 300
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
    const result = await runProductionToolExecutionReadinessEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Production readiness evidence collector failed.')
    process.exitCode = 1
  }
}
