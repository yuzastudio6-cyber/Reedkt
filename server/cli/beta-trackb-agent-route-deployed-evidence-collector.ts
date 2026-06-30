import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  buildTrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeToolContract,
} from '../beta-readiness/trackb-agent-runtime-readiness'
import type { ProductionToolId } from '../tool-registry'
import type { TrackBAgentToolExecutionResult } from '../agents/trackb-agent-tool-execution'

const REQUIRED_TRACKB_TOOL_COUNT = 16

export interface BetaTrackBAgentRouteDeployedEvidenceCollectorEnv {
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_API_BASE_URL?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_BEARER_TOKEN?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_WORKSPACE_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PROJECT_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_SOURCE_SHA?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_IDEMPOTENCY_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_APPROVED_SNAPSHOT_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_TOOL_EXECUTION_PLAN_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_JOB_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_EDIT_PLAN_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_MEDIA_ASSET_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_STORAGE_REFERENCE_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PREVIEW_STATE_REFERENCE?: string
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL?: string
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN?: string
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID?: string
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID?: string
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA?: string
}

export type BetaTrackBAgentRouteDeployedEvidenceCollectorFetch = (
  url: string,
  init: {
    method: 'POST'
    headers: Record<string, string>
    body: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export interface BetaTrackBAgentRouteDeployedEvidenceCollectorResult {
  ok: boolean
  decision: 'beta_trackb_agent_route_deployed_evidence_collector_passed_mock_safe_route_proof'
  endpointBaseUrl: string
  sourceSha: string
  routePath: '/v1/agent-tools/trackb/execute'
  requiredToolCount: 16
  routeProofToolCount: number
  liveAgentExecutionReady: false
  productReadyLocalOssCount: number
  productReadyDeployedEvidenceRecordedByThisCollector: false
  paymentScope: 'excluded_from_this_route_proof'
  serviceFeeIncluded: false
  toolResults: BetaTrackBAgentRouteProofResult[]
  remainingGateBlockers: string[]
  warnings: string[]
}

export interface BetaTrackBAgentRouteProofResult {
  toolId: ProductionToolId
  agentInvocationId: string
  status: number
  idempotencyKey: string
  mode: 'mock_safe_worker_dispatch' | 'frontend_preview_boundary'
  completed: boolean
  liveExecutionReady: boolean
  decision?: string
  workerDispatchMode?: string
  previewBoundaryAdmitted?: boolean
}

interface NormalizedEnv {
  apiBaseUrl: string
  bearerToken: string
  workspaceId: string
  projectId: string
  sourceSha: string
  idempotencyPrefix: string
  approvedSnapshotId: string
  toolExecutionPlanPrefix: string
  jobPrefix: string
  editPlanId?: string
  mediaAssetId?: string
  storageReferencePrefix?: string
  previewStateReference?: string
}

export async function runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv(
  env: BetaTrackBAgentRouteDeployedEvidenceCollectorEnv,
  fetchImpl: BetaTrackBAgentRouteDeployedEvidenceCollectorFetch = fetch as BetaTrackBAgentRouteDeployedEvidenceCollectorFetch,
): Promise<BetaTrackBAgentRouteDeployedEvidenceCollectorResult> {
  const report = buildTrackBAgentRuntimeReadinessReport()
  const normalized = normalizeEnv(env)
  const missing = missingConfiguration(env, normalized)
  const sourceGaps = validateSourceTruth(report)
  const secretLikePaths = collectSecretLikePaths({
    apiBaseUrl: normalized.apiBaseUrl,
    workspaceId: normalized.workspaceId,
    projectId: normalized.projectId,
    sourceSha: normalized.sourceSha,
    idempotencyPrefix: normalized.idempotencyPrefix,
    approvedSnapshotId: normalized.approvedSnapshotId,
    toolExecutionPlanPrefix: normalized.toolExecutionPlanPrefix,
    jobPrefix: normalized.jobPrefix,
    editPlanId: normalized.editPlanId,
    mediaAssetId: normalized.mediaAssetId,
    storageReferencePrefix: normalized.storageReferencePrefix,
    previewStateReference: normalized.previewStateReference,
  }, 'betaTrackBAgentRouteDeployedEvidenceCollector')

  if (missing.length > 0 || sourceGaps.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`Track B agent route deployed evidence collector inputs are incomplete: ${[
      ...missing,
      ...sourceGaps,
      ...secretLikePaths,
    ].join('; ')}`)
  }

  const endpointBaseUrl = normalized.apiBaseUrl.replace(/\/+$/, '')
  const endpoint = `${endpointBaseUrl}/v1/agent-tools/trackb/execute`
  const toolResults: BetaTrackBAgentRouteProofResult[] = []

  for (const contract of report.contracts) {
    const idempotencyKey = `${normalized.idempotencyPrefix}-${contract.toolId}`
    const body = buildRouteBody(contract, normalized)
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${normalized.bearerToken}`,
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(body),
    })
    const payload = await response.json()
    const summary = summarizeRouteResponse(contract, response.status, idempotencyKey, payload)
    toolResults.push(summary)
  }

  const failed = toolResults.filter((result) => !result.completed)
  if (failed.length > 0) {
    throw new Error(`Track B deployed agent route proof failed for ${failed.map((result) => result.toolId).join(', ')}.`)
  }

  return {
    ok: toolResults.length === REQUIRED_TRACKB_TOOL_COUNT && failed.length === 0,
    decision: 'beta_trackb_agent_route_deployed_evidence_collector_passed_mock_safe_route_proof',
    endpointBaseUrl,
    sourceSha: normalized.sourceSha,
    routePath: '/v1/agent-tools/trackb/execute',
    requiredToolCount: REQUIRED_TRACKB_TOOL_COUNT,
    routeProofToolCount: toolResults.length,
    liveAgentExecutionReady: false,
    productReadyLocalOssCount: report.productReadyLocalOssCount,
    productReadyDeployedEvidenceRecordedByThisCollector: false,
    paymentScope: 'excluded_from_this_route_proof',
    serviceFeeIncluded: false,
    toolResults,
    remainingGateBlockers: [
      'product_ready_deployed_evidence_recording_pending',
      'operator_status_product_ready_readback_pending',
      'external_beta_user_media_execution_pending',
      'paid_production_execution_pending',
    ],
    warnings: [
      'This collector calls only the deployed Track B agent execution route in mock_safe_worker_dispatch or frontend_preview_boundary mode.',
      'It does not request deployed_live_execution, process user media, run providers, create public artifacts, create signed URLs, enable external beta, enable paid production, or include payment/service-fee approval.',
      'This collector does not record product-ready deployed evidence by itself; operator-status readback must still report all 16 tools before live agent execution is opened.',
    ],
  }
}

function normalizeEnv(env: BetaTrackBAgentRouteDeployedEvidenceCollectorEnv): NormalizedEnv {
  const apiBaseUrl = clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID)
  const sourceSha = clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA)
  const sourcePrefix = sourceSha?.slice(0, 12) ?? 'source-missing'

  return {
    apiBaseUrl: apiBaseUrl ?? '',
    bearerToken: bearerToken ?? '',
    workspaceId: workspaceId ?? '',
    projectId: projectId ?? '',
    sourceSha: sourceSha ?? '',
    idempotencyPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_IDEMPOTENCY_PREFIX) ??
      `trackb-agent-route-proof-${sourcePrefix}`,
    approvedSnapshotId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_APPROVED_SNAPSHOT_ID) ??
      `approved-snapshot-trackb-agent-route-proof-${sourcePrefix}`,
    toolExecutionPlanPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_TOOL_EXECUTION_PLAN_PREFIX) ??
      `tool-exec-trackb-agent-route-proof-${sourcePrefix}`,
    jobPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_JOB_PREFIX) ??
      `job-trackb-agent-route-proof-${sourcePrefix}`,
    editPlanId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_EDIT_PLAN_ID) ??
      `edit-plan-trackb-agent-route-proof-${sourcePrefix}`,
    mediaAssetId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_MEDIA_ASSET_ID) ??
      `media-asset-trackb-agent-route-proof-${sourcePrefix}`,
    storageReferencePrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_STORAGE_REFERENCE_PREFIX),
    previewStateReference: clean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PREVIEW_STATE_REFERENCE),
  }
}

function missingConfiguration(
  env: BetaTrackBAgentRouteDeployedEvidenceCollectorEnv,
  normalized: NormalizedEnv,
): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF)
      ? undefined
      : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_CONFIRM_DEPLOYED_ROUTE_PROOF=true is required before deployed route proof.',
    normalized.apiBaseUrl ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_API_BASE_URL or REEDITPRO_BETA_EXTERNAL_API_BASE_URL is required.',
    normalized.bearerToken ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_BEARER_TOKEN or REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN is required.',
    normalized.workspaceId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_WORKSPACE_ID or REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID is required.',
    normalized.projectId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_PROJECT_ID or REEDITPRO_BETA_EXTERNAL_PROJECT_ID is required.',
    normalized.sourceSha ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_ROUTE_SOURCE_SHA or REEDITPRO_BETA_EXTERNAL_SOURCE_SHA is required.',
  ].filter((item): item is string => Boolean(item))
}

function validateSourceTruth(report: ReturnType<typeof buildTrackBAgentRuntimeReadinessReport>): string[] {
  return [
    report.toolCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B agent route proof requires exactly 16 tools.',
    report.agentContractsReady ? undefined : 'Track B agent contracts are not ready.',
    report.paymentIndependentRuntimeReady ? undefined : 'Track B payment-independent runtime admission is not ready.',
    report.productReadySourceCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B source product-ready count must be 16 before route proof.',
    report.localAcceptedToolCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B local accepted evidence count must be 16 before route proof.',
  ].filter((item): item is string => Boolean(item))
}

function buildRouteBody(contract: TrackBAgentRuntimeToolContract, env: NormalizedEnv): Record<string, unknown> {
  const isPreview = contract.toolId === 'hyperframe'
  return {
    workspaceId: env.workspaceId,
    projectId: env.projectId,
    jobId: `${env.jobPrefix}-${contract.toolId}`,
    agentInvocationId: contract.agentInvocationId,
    toolId: contract.toolId,
    action: contract.supportedActions[0],
    approvedSnapshotId: env.approvedSnapshotId,
    editPlanId: env.editPlanId,
    toolExecutionPlanId: `${env.toolExecutionPlanPrefix}-${contract.toolId}`,
    mediaAssetId: isPreview ? undefined : env.mediaAssetId,
    mode: isPreview ? 'frontend_preview_boundary' : 'mock_safe_worker_dispatch',
    storageReferenceIds: isPreview
      ? undefined
      : [storageReferenceFor(contract, env)],
    approvedPreviewStateReference: isPreview
      ? env.previewStateReference ?? `preview_state/workspaces/${env.workspaceId}/projects/${env.projectId}/trackb-agent-route-proof/hyperframe-approved-state`
      : undefined,
    metadata: {
      evidenceSourceSha: env.sourceSha,
      evidenceMode: 'trackb_agent_deployed_route_mock_safe_proof',
      productReadyDeployedEvidenceRecordedByThisCollector: false,
      serviceFeeIncluded: false,
    },
  }
}

function storageReferenceFor(contract: TrackBAgentRuntimeToolContract, env: NormalizedEnv): string {
  const prefix = env.storageReferencePrefix ??
    `source_media/workspaces/${env.workspaceId}/projects/${env.projectId}/trackb-agent-route-proof`
  return `${prefix}/${contract.toolId}/private-source-reference`
}

function summarizeRouteResponse(
  contract: TrackBAgentRuntimeToolContract,
  status: number,
  idempotencyKey: string,
  payload: unknown,
): BetaTrackBAgentRouteProofResult {
  const execution = recordValue(recordValue(recordValue(payload).data).trackBAgentToolExecution) as Partial<TrackBAgentToolExecutionResult>
  const completed = status === 202 && execution.status === 'completed'
  return {
    toolId: contract.toolId,
    agentInvocationId: contract.agentInvocationId,
    status,
    idempotencyKey,
    mode: contract.toolId === 'hyperframe' ? 'frontend_preview_boundary' : 'mock_safe_worker_dispatch',
    completed,
    liveExecutionReady: execution.liveExecutionReady === true,
    decision: stringValue(execution.decision),
    workerDispatchMode: stringValue(recordValue(execution.workerPayload).executionMode),
    previewBoundaryAdmitted: recordValue(execution.previewBoundary).workerDispatchSkipped === true,
  }
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaTrackBAgentRouteDeployedEvidenceCollectorFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Track B agent route deployed evidence collector failed.')
    process.exitCode = 1
  }
}
