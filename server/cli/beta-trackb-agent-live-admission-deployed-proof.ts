import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import {
  buildTrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeToolContract,
} from '../beta-readiness/trackb-agent-runtime-readiness'
import {
  runBetaReadinessOperatorStatusApiFromEnv,
} from './beta-readiness-operator-status-api'
import type { ProductionToolId } from '../tool-registry'
import type { TrackBAgentToolExecutionResult } from '../agents/trackb-agent-tool-execution'

const REQUIRED_TRACKB_TOOL_COUNT = 16
const FRONTEND_PREVIEW_TOOL_ID = 'hyperframe'

export interface BetaTrackBAgentLiveAdmissionDeployedProofEnv {
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CONFIRM_DEPLOYED_PROOF?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_API_BASE_URL?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_BEARER_TOKEN?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_WORKSPACE_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_PROJECT_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_SOURCE_SHA?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_IDEMPOTENCY_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_SNAPSHOT_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_TOOL_EXECUTION_PLAN_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_JOB_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_EDIT_PLAN_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_MEDIA_ASSET_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_STORAGE_REFERENCE_PREFIX?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_PREVIEW_STATE_REFERENCE?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_ESTIMATE_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_RESERVATION_ID?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_RESERVATION_REMAINING_CREDITS?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_ESTIMATED_FINAL_VIDEO_DURATION_SECONDS?: string
  REEDITPRO_BETA_TRACKB_AGENT_LIVE_PRODUCT_EDIT_LEVEL?: string
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL?: string
  REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN?: string
  REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID?: string
  REEDITPRO_BETA_EXTERNAL_PROJECT_ID?: string
  REEDITPRO_BETA_EXTERNAL_SOURCE_SHA?: string
}

export type BetaTrackBAgentLiveAdmissionDeployedProofFetch = (
  url: string,
  init: {
    method: 'GET' | 'POST'
    headers: Record<string, string>
    body?: string
  },
) => Promise<{ status: number; json(): Promise<unknown> }>

export interface BetaTrackBAgentLiveAdmissionDeployedProofResult {
  ok: boolean
  decision: 'beta_trackb_agent_live_admission_deployed_proof_passed_backend_worker_admission'
  endpointBaseUrl: string
  sourceSha: string
  operatorReadback: {
    evidenceSource?: string
    evidencePacketCount?: number
    productReadyLocalOssCount?: number
    externalBetaToolExecutionAllowed?: boolean
    productionToolExecutionAllowed?: boolean
  }
  routePath: '/v1/agent-tools/trackb/execute'
  requiredToolCount: 16
  backendLiveAdmissionToolCount: number
  frontendPreviewBoundaryToolCount: number
  completedToolCount: number
  paymentScope: 'credit_references_required_but_no_live_billing_or_settlement'
  serviceFeeIncluded: false
  toolResults: BetaTrackBAgentLiveAdmissionProofToolResult[]
  remainingGateBlockers: string[]
  warnings: string[]
}

export interface BetaTrackBAgentLiveAdmissionProofToolResult {
  toolId: ProductionToolId
  agentInvocationId: string
  status: number
  idempotencyKey: string
  mode: 'deployed_live_execution' | 'frontend_preview_boundary'
  completed: boolean
  liveExecutionReady: boolean
  decision?: string
  workerDispatchMode?: string
  workerResultStatus?: string
  billableToUser?: boolean
  serviceFeeIncluded?: boolean
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
  editPlanId: string
  mediaAssetId: string
  storageReferencePrefix?: string
  previewStateReference?: string
  creditEstimateId: string
  creditReservationId: string
  approvedReservationRemainingCredits: number
  estimatedFinalVideoDurationSeconds: number
  productEditLevel: 'normal' | 'premium' | 'ultra_premium'
}

export async function runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv(
  env: BetaTrackBAgentLiveAdmissionDeployedProofEnv,
  fetchImpl: BetaTrackBAgentLiveAdmissionDeployedProofFetch = fetch as BetaTrackBAgentLiveAdmissionDeployedProofFetch,
): Promise<BetaTrackBAgentLiveAdmissionDeployedProofResult> {
  const sourceReport = buildTrackBAgentRuntimeReadinessReport()
  const normalized = normalizeEnv(env)
  const missing = missingConfiguration(env, normalized)
  const sourceGaps = validateSourceTruth(sourceReport)
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
    creditEstimateId: normalized.creditEstimateId,
    creditReservationId: normalized.creditReservationId,
  }, 'betaTrackBAgentLiveAdmissionDeployedProof')

  if (missing.length > 0 || sourceGaps.length > 0 || secretLikePaths.length > 0) {
    throw new Error(`Track B agent live-admission deployed proof inputs are incomplete: ${[
      ...missing,
      ...sourceGaps,
      ...secretLikePaths,
    ].join('; ')}`)
  }

  const operatorReadback = await runBetaReadinessOperatorStatusApiFromEnv({
    REEDITPRO_BETA_STATUS_API_BASE_URL: normalized.apiBaseUrl,
    REEDITPRO_BETA_STATUS_BEARER_TOKEN: normalized.bearerToken,
    REEDITPRO_BETA_STATUS_WORKSPACE_ID: normalized.workspaceId,
  }, fetchImpl)
  const readbackCount = operatorReadback.currentGate.productReadyLocalOssCount ?? 0
  if (readbackCount < REQUIRED_TRACKB_TOOL_COUNT) {
    throw new Error(`Track B live-admission proof requires operator-status productReadyLocalOssCount ${REQUIRED_TRACKB_TOOL_COUNT}; readback returned ${readbackCount}.`)
  }

  const endpointBaseUrl = normalized.apiBaseUrl.replace(/\/+$/, '')
  const endpoint = `${endpointBaseUrl}/v1/agent-tools/trackb/execute`
  const toolResults: BetaTrackBAgentLiveAdmissionProofToolResult[] = []

  for (const contract of sourceReport.contracts) {
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
    toolResults.push(summarizeRouteResponse(contract, response.status, idempotencyKey, payload))
  }

  const failed = toolResults.filter((result) => !result.completed)
  if (failed.length > 0) {
    throw new Error(`Track B live-admission deployed proof failed for ${failed.map((result) => `${result.toolId}:${result.decision ?? result.status}`).join(', ')}.`)
  }

  const backendLiveAdmissionToolCount = toolResults.filter((result) => result.mode === 'deployed_live_execution').length
  const frontendPreviewBoundaryToolCount = toolResults.filter((result) => result.mode === 'frontend_preview_boundary').length

  return {
    ok: toolResults.length === REQUIRED_TRACKB_TOOL_COUNT && failed.length === 0,
    decision: 'beta_trackb_agent_live_admission_deployed_proof_passed_backend_worker_admission',
    endpointBaseUrl,
    sourceSha: normalized.sourceSha,
    operatorReadback: {
      evidenceSource: operatorReadback.evidenceSource,
      evidencePacketCount: operatorReadback.evidencePacketCount,
      productReadyLocalOssCount: operatorReadback.currentGate.productReadyLocalOssCount,
      externalBetaToolExecutionAllowed: operatorReadback.currentGate.externalBetaToolExecutionAllowed,
      productionToolExecutionAllowed: operatorReadback.currentGate.productionToolExecutionAllowed,
    },
    routePath: '/v1/agent-tools/trackb/execute',
    requiredToolCount: REQUIRED_TRACKB_TOOL_COUNT,
    backendLiveAdmissionToolCount,
    frontendPreviewBoundaryToolCount,
    completedToolCount: toolResults.length,
    paymentScope: 'credit_references_required_but_no_live_billing_or_settlement',
    serviceFeeIncluded: false,
    toolResults,
    remainingGateBlockers: [
      'real_user_media_beta_scope_approval_pending',
      'paid_production_scope_approval_pending',
      'live_tool_binary_execution_not_run_by_this_proof',
    ],
    warnings: [
      'This proof requires stored deployed evidence readback for all 16 Track B tools before any live-admission route POST.',
      'Backend Track B tools are posted in deployed_live_execution mode only to prove worker admission; the current worker dispatcher remains placeholder/mock-safe and does not run real tool binaries or media processing.',
      'Hyperframe remains frontend_preview_boundary and is never posted as backend deployed_live_execution.',
      'Credit estimate/reservation references are required for the worker guard, but this proof does not run Stripe, Supabase wallet mutation, settlement, spend/release/refund, public artifact delivery, external beta user media, paid production, or ReEditPro service-fee billing.',
    ],
  }
}

function normalizeEnv(env: BetaTrackBAgentLiveAdmissionDeployedProofEnv): NormalizedEnv {
  const apiBaseUrl = clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_API_BASE_URL) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_API_BASE_URL)
  const bearerToken = clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_BEARER_TOKEN) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN)
  const workspaceId = clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_WORKSPACE_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID)
  const projectId = clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_PROJECT_ID) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_PROJECT_ID)
  const sourceSha = clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_SOURCE_SHA) ??
    clean(env.REEDITPRO_BETA_EXTERNAL_SOURCE_SHA)
  const sourcePrefix = sourceSha?.slice(0, 12) ?? 'source-missing'

  return {
    apiBaseUrl: apiBaseUrl ?? '',
    bearerToken: bearerToken ?? '',
    workspaceId: workspaceId ?? '',
    projectId: projectId ?? '',
    sourceSha: sourceSha ?? '',
    idempotencyPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_IDEMPOTENCY_PREFIX) ??
      `trackb-agent-live-admission-${sourcePrefix}`,
    approvedSnapshotId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_SNAPSHOT_ID) ??
      `approved-snapshot-trackb-agent-live-admission-${sourcePrefix}`,
    toolExecutionPlanPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_TOOL_EXECUTION_PLAN_PREFIX) ??
      `tool-exec-trackb-agent-live-admission-${sourcePrefix}`,
    jobPrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_JOB_PREFIX) ??
      `job-trackb-agent-live-admission-${sourcePrefix}`,
    editPlanId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_EDIT_PLAN_ID) ??
      `edit-plan-trackb-agent-live-admission-${sourcePrefix}`,
    mediaAssetId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_MEDIA_ASSET_ID) ??
      `media-asset-trackb-agent-live-admission-${sourcePrefix}`,
    storageReferencePrefix: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_STORAGE_REFERENCE_PREFIX),
    previewStateReference: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_PREVIEW_STATE_REFERENCE),
    creditEstimateId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_ESTIMATE_ID) ?? '',
    creditReservationId: clean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_RESERVATION_ID) ?? '',
    approvedReservationRemainingCredits: positiveNumber(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_APPROVED_RESERVATION_REMAINING_CREDITS) ?? 250,
    estimatedFinalVideoDurationSeconds: positiveNumber(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_ESTIMATED_FINAL_VIDEO_DURATION_SECONDS) ?? 30,
    productEditLevel: productEditLevel(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_PRODUCT_EDIT_LEVEL),
  }
}

function missingConfiguration(
  env: BetaTrackBAgentLiveAdmissionDeployedProofEnv,
  normalized: NormalizedEnv,
): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_TRACKB_AGENT_LIVE_CONFIRM_DEPLOYED_PROOF)
      ? undefined
      : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_CONFIRM_DEPLOYED_PROOF=true is required before deployed live-admission proof.',
    normalized.apiBaseUrl ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_API_BASE_URL or REEDITPRO_BETA_EXTERNAL_API_BASE_URL is required.',
    normalized.bearerToken ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_BEARER_TOKEN or REEDITPRO_BETA_EXTERNAL_BEARER_TOKEN is required.',
    normalized.workspaceId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_WORKSPACE_ID or REEDITPRO_BETA_EXTERNAL_WORKSPACE_ID is required.',
    normalized.projectId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_PROJECT_ID or REEDITPRO_BETA_EXTERNAL_PROJECT_ID is required.',
    normalized.sourceSha ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_SOURCE_SHA or REEDITPRO_BETA_EXTERNAL_SOURCE_SHA is required.',
    normalized.creditEstimateId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_ESTIMATE_ID is required.',
    normalized.creditReservationId ? undefined : 'REEDITPRO_BETA_TRACKB_AGENT_LIVE_CREDIT_RESERVATION_ID is required.',
  ].filter((item): item is string => Boolean(item))
}

function validateSourceTruth(report: ReturnType<typeof buildTrackBAgentRuntimeReadinessReport>): string[] {
  return [
    report.toolCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B live-admission proof requires exactly 16 tools.',
    report.agentContractsReady ? undefined : 'Track B agent contracts are not ready.',
    report.paymentIndependentRuntimeReady ? undefined : 'Track B payment-independent runtime admission is not ready.',
    report.productReadySourceCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B source product-ready count must be 16 before live-admission proof.',
    report.localAcceptedToolCount === REQUIRED_TRACKB_TOOL_COUNT ? undefined : 'Track B local accepted evidence count must be 16 before live-admission proof.',
  ].filter((item): item is string => Boolean(item))
}

function buildRouteBody(contract: TrackBAgentRuntimeToolContract, env: NormalizedEnv): Record<string, unknown> {
  const isPreview = contract.toolId === FRONTEND_PREVIEW_TOOL_ID
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
    mode: isPreview ? 'frontend_preview_boundary' : 'deployed_live_execution',
    storageReferenceIds: isPreview
      ? undefined
      : [storageReferenceFor(contract, env)],
    approvedPreviewStateReference: isPreview
      ? env.previewStateReference ?? `preview_state/workspaces/${env.workspaceId}/projects/${env.projectId}/trackb-agent-live-admission/hyperframe-approved-state`
      : undefined,
    creditEstimateId: isPreview ? undefined : env.creditEstimateId,
    creditReservationId: isPreview ? undefined : env.creditReservationId,
    metadata: {
      evidenceSourceSha: env.sourceSha,
      evidenceMode: isPreview
        ? 'trackb_agent_live_admission_frontend_preview_boundary'
        : 'trackb_agent_deployed_live_admission_proof',
      productEditLevel: env.productEditLevel,
      approvedPlanStatus: 'approved',
      estimateStatus: 'approved',
      estimatedFinalVideoDurationSeconds: env.estimatedFinalVideoDurationSeconds,
      approvedReservationRemainingCredits: env.approvedReservationRemainingCredits,
      serviceFeeIncluded: false,
      liveToolBinaryExecutionRunByThisProof: false,
      userMediaProcessedByThisProof: false,
    },
  }
}

function storageReferenceFor(contract: TrackBAgentRuntimeToolContract, env: NormalizedEnv): string {
  const prefix = env.storageReferencePrefix ??
    `source_media/workspaces/${env.workspaceId}/projects/${env.projectId}/trackb-agent-live-admission`
  return `${prefix}/${contract.toolId}/private-source-reference`
}

function summarizeRouteResponse(
  contract: TrackBAgentRuntimeToolContract,
  status: number,
  idempotencyKey: string,
  payload: unknown,
): BetaTrackBAgentLiveAdmissionProofToolResult {
  const execution = recordValue(recordValue(recordValue(payload).data).trackBAgentToolExecution) as Partial<TrackBAgentToolExecutionResult>
  const isPreview = contract.toolId === FRONTEND_PREVIEW_TOOL_ID
  const workerPayload = recordValue(execution.workerPayload)
  const workerResult = recordValue(execution.workerResult)
  const toolCostMetadata = recordValue(workerResult.toolCostMetadata)
  const emittedEvents = Array.isArray(toolCostMetadata.emittedEvents) ? toolCostMetadata.emittedEvents : []
  const firstEvent = recordValue(emittedEvents[0])
  const completed = isPreview
    ? status === 202 && execution.status === 'completed' && recordValue(execution.previewBoundary).workerDispatchSkipped === true
    : status === 202 &&
      execution.status === 'completed' &&
      execution.liveExecutionReady === true &&
      workerPayload.executionMode === 'production_ready' &&
      workerResult.status === 'completed'

  return {
    toolId: contract.toolId,
    agentInvocationId: contract.agentInvocationId,
    status,
    idempotencyKey,
    mode: isPreview ? 'frontend_preview_boundary' : 'deployed_live_execution',
    completed,
    liveExecutionReady: execution.liveExecutionReady === true,
    decision: stringValue(execution.decision),
    workerDispatchMode: stringValue(workerPayload.executionMode),
    workerResultStatus: stringValue(workerResult.status),
    billableToUser: booleanValue(firstEvent.billableToUser),
    serviceFeeIncluded: booleanValue(toolCostMetadata.serviceFeeIncluded) ?? booleanValue(execution.serviceFeeIncluded),
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

function positiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function productEditLevel(value: string | undefined): NormalizedEnv['productEditLevel'] {
  return value === 'premium' || value === 'ultra_premium' ? value : 'normal'
}

function recordValue(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runBetaTrackBAgentLiveAdmissionDeployedProofFromEnv(process.env)
    console.log(JSON.stringify(result, null, 2))
    if (!result.ok) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Track B agent live-admission deployed proof failed.')
    process.exitCode = 1
  }
}
