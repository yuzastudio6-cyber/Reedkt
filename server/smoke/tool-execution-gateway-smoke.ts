import assert from 'node:assert/strict'

import type { ProductionToolExecutionReadinessGateInput } from '../beta-readiness'
import {
  rateLimitPolicy,
  resetMockProductionGatewayOpsControlState,
  setMockProductionGatewayOpsControlState,
  workerConcurrencyPolicy,
} from '../cost-controls'
import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import { resetMockToolCostStore, resetMockToolCostWalletSettlementStore } from '../tool-cost-metering'
import type { ServiceContext } from '../types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'

const context: ServiceContext = {
  env: {
    mockOnly: true,
    allowMockWithoutSupabase: true,
  } as never,
  clients: {
    admin: null,
    public: null,
  },
  requestId: 'tool-execution-gateway-smoke',
  auth: {
    userId: 'user-smoke',
    email: 'user-smoke@reeditpro.local',
    isMockUser: true,
  },
}

resetMockToolCostStore()
resetMockToolCostWalletSettlementStore()
resetMockProductionGatewayOpsControlState()

const baseInput: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } = {
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobId: 'job-smoke',
  toolExecutionPlanId: 'tool-execution-plan-smoke',
  editPlanId: 'edit-plan-smoke',
  mediaAssetId: 'media-smoke',
  approvedPlanSnapshotId: 'approved-snapshot-smoke',
  creditEstimateId: 'credit-estimate-smoke',
  creditReservationId: 'credit-reservation-smoke',
  approvedReservationRemainingCredits: 50,
  estimatedHighCredits: 5,
  workerType: 'cpu_analysis_worker',
  executionMode: 'mock_safe',
  requestedToolIds: ['ffprobe'],
  requestedRecipeIds: ['media-probe-recipe'],
  artifactReferences: [{
    id: 'artifact-source-media',
    storageBucketPurpose: 'source_media',
    storageObjectPath: 'workspaces/workspace-smoke/projects/project-smoke/source/source-media.mp4',
    isPrivate: true,
    sourceOfTruth: true,
  }],
  attempt: 1,
  maxAttempts: 1,
  metadata: {
    gatewaySmoke: true,
  },
  apiIdempotencyKey: 'api-idempotency-smoke',
}

const service = createToolExecutionGatewayService(context)

const dispatched = await service.dispatchApprovedToolCall(baseInput)
assert.equal(dispatched.gateway.status, 'dispatched', 'valid request should dispatch through the backend gateway')
assert.equal(dispatched.gateway.blockers.length, 0, 'valid request should not include blockers')
assert.ok(dispatched.gateway.workerIdempotencyKey?.startsWith('prod-worker:'), 'gateway should create stable worker idempotency key')
assert.equal(dispatched.workerResult?.status, 'completed', 'mock-safe production dispatcher should complete placeholder route')
assert.equal(dispatched.workerResult?.output?.mockOnly, true, 'gateway dispatch should stay mock-safe')
assert.equal(dispatched.workerResult?.output?.futureHandler, 'cpu_analysis_worker_placeholder', 'gateway should dispatch only the allowed placeholder adapter')
assert.ok(
  dispatched.warnings.some((warning) => warning.includes('no frontend tool execution')),
  'gateway should confirm frontend direct execution did not occur',
)

const overBudget = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-over-budget',
  approvedReservationRemainingCredits: 1,
})
assert.equal(overBudget.gateway.status, 'blocked', 'over-budget request should block')
assert.ok(
  overBudget.gateway.blockers.some((blocker) => blocker.gateName === 'cost_credit_gate'),
  'over-budget request should identify the cost/credit gate',
)
assert.equal(overBudget.workerResult, undefined, 'blocked gateway request should not dispatch a worker')

const adapterMismatch = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-adapter-mismatch',
  adapterId: 'render_worker_placeholder',
})
assert.equal(adapterMismatch.gateway.status, 'blocked', 'wrong adapter should block')
assert.ok(
  adapterMismatch.gateway.blockers.some((blocker) => blocker.gateName === 'adapter_dispatch'),
  'wrong adapter should identify adapter dispatch blocker',
)

const unfinishedLane = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-unfinished-lane',
  requestedToolIds: ['hyperframe'],
  workerType: 'render_worker',
  adapterId: 'render_worker_placeholder',
})
assert.equal(unfinishedLane.gateway.status, 'blocked', 'frontend-preview or unfinished lanes should block backend dispatch')
assert.ok(
  unfinishedLane.gateway.blockers.some((blocker) => blocker.gateName === 'tool_readiness'),
  'unfinished lane should identify tool readiness blocker',
)

const unsafeArtifact = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-unsafe-artifact',
  artifactReferences: [{
    ...baseInput.artifactReferences[0],
    storageObjectPath: 'https://storage.example.com/signed/source.mp4?X-Goog-Signature=abc',
  }],
})
assert.equal(unsafeArtifact.gateway.status, 'blocked', 'signed URL artifact should block')
assert.ok(
  unsafeArtifact.gateway.blockers.some((blocker) => blocker.gateName === 'artifact_privacy'),
  'signed URL artifact should identify artifact privacy blocker',
)

const rawMetadata = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-raw-metadata',
  metadata: {
    rawPrompt: 'run this directly',
  },
})
assert.equal(rawMetadata.gateway.status, 'blocked', 'raw prompt metadata should block')
assert.ok(
  rawMetadata.gateway.blockers.some((blocker) => blocker.gateName === 'metadata_safety'),
  'raw prompt metadata should identify metadata safety blocker',
)

const reservedRouterMetadata = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-reserved-router-metadata',
  metadata: {
    mediaFoundation: {
      mode: 'fixture',
    },
  },
})
assert.equal(reservedRouterMetadata.gateway.status, 'blocked', 'reserved worker router metadata should block')
assert.equal(reservedRouterMetadata.workerResult, undefined, 'reserved router metadata should not dispatch a worker')
assert.ok(
  reservedRouterMetadata.gateway.blockers.some((blocker) => blocker.code === 'RESERVED_ADAPTER_METADATA'),
  'reserved router metadata should identify adapter metadata blocker',
)

const productionReadyMissingEvidence = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-missing-evidence',
  executionMode: 'production_ready',
})
assert.equal(productionReadyMissingEvidence.gateway.status, 'blocked', 'production_ready dispatch should require production readiness evidence')
assert.equal(productionReadyMissingEvidence.workerResult, undefined, 'production_ready without readiness evidence should not dispatch a worker')
assert.ok(
  productionReadyMissingEvidence.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_GATE_REQUIRED'),
  'production_ready without readiness evidence should identify the production readiness gate',
)

const productionReadyBlockedEvidence = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-blocked-evidence',
  executionMode: 'production_ready',
  productionReadinessEvidence: {
    sourceId: 'tool-execution-gateway-smoke:blocked-production-readiness',
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
  },
})
assert.equal(productionReadyBlockedEvidence.gateway.status, 'blocked', 'incomplete production readiness evidence should block production_ready dispatch')
assert.equal(productionReadyBlockedEvidence.productionReadinessReport?.status, 'blocked', 'blocked production evidence should include a blocked report')
assert.ok(
  productionReadyBlockedEvidence.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_GATE_BLOCKED'),
  'incomplete production readiness evidence should identify the production readiness gate blocker',
)

const productionReadyMismatchedEvidence = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-mismatched-evidence',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture('other-workspace', baseInput.projectId),
})
assert.equal(productionReadyMismatchedEvidence.gateway.status, 'blocked', 'production readiness evidence must match the gateway workspace/project')
assert.equal(productionReadyMismatchedEvidence.productionReadinessReport?.status, 'ready_for_paid_production', 'matching is enforced by the gateway in addition to the gate report')
assert.ok(
  productionReadyMismatchedEvidence.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_WORKSPACE_MISMATCH'),
  'mismatched production evidence should identify workspace mismatch',
)

const productionReadyDispatch = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-dispatch',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
})
assert.equal(productionReadyDispatch.gateway.status, 'dispatched', 'complete production readiness evidence should allow the backend gateway path')
assert.equal(productionReadyDispatch.productionReadinessReport?.status, 'ready_for_paid_production', 'dispatched production_ready request should include the passing readiness report')
assert.equal(productionReadyDispatch.workerResult?.status, 'completed', 'complete production readiness evidence should reach only the placeholder worker route')
assert.equal(productionReadyDispatch.workerResult?.output?.mockOnly, true, 'production_ready smoke must still use the mock-safe placeholder output')
assert.equal(productionReadyDispatch.toolCostEvents?.length, 1, 'production_ready dispatch should emit one gateway tool-cost event for the requested tool')
assert.equal(productionReadyDispatch.toolCostEvents?.[0]?.toolId, 'ffprobe', 'gateway tool-cost event should be scoped to the requested tool')
assert.equal(productionReadyDispatch.toolCostEvents?.[0]?.billableToUser, true, 'completed production_ready gateway event should be billable after approval/reservation gates')
assert.equal(productionReadyDispatch.toolCostEvents?.[0]?.metadata.serviceFeeIncluded, false, 'gateway billing metadata must keep service fees excluded')
assert.equal(productionReadyDispatch.walletSettlements?.length, 1, 'production_ready dispatch should create one wallet settlement audit row')
assert.equal(productionReadyDispatch.walletSettlements?.[0]?.toolCostEventId, productionReadyDispatch.toolCostEvents?.[0]?.id, 'wallet settlement should reference the emitted tool-cost event')
assert.equal(productionReadyDispatch.walletSettlements?.[0]?.stripeCallAttempted, false, 'gateway wallet settlement must preserve Stripe isolation')
assert.equal(productionReadyDispatch.walletSettlements?.[0]?.serviceFeeIncluded, false, 'gateway wallet settlement must exclude service fees')
assert.equal(productionReadyDispatch.walletSettlements?.[0]?.creditsDelta, -productionReadyDispatch.toolCostEvents![0].toolCostCredits, 'completed production_ready gateway settlement should spend the tool event credits')

setMockProductionGatewayOpsControlState({
  activeKillSwitches: {
    globalGeneration: true,
  },
})
const productionReadyKillSwitchBlocked = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-kill-switch-blocked',
  toolExecutionPlanId: 'tool-execution-plan-kill-switch-blocked',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
})
assert.equal(productionReadyKillSwitchBlocked.gateway.status, 'blocked', 'active production kill switch should block production_ready gateway dispatch')
assert.equal(productionReadyKillSwitchBlocked.workerResult, undefined, 'active production kill switch should block before worker dispatch')
assert.equal(productionReadyKillSwitchBlocked.toolCostEvents, undefined, 'active production kill switch should block before billing audit events')
assert.ok(
  productionReadyKillSwitchBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_GLOBAL_KILL_SWITCH_ACTIVE'),
  'active production kill switch should identify the kill-switch blocker',
)

const nowMs = Date.now()
setMockProductionGatewayOpsControlState({
  workspaceJobCreationTimestamps: Array.from({ length: rateLimitPolicy.perWorkspaceJobCreationPerHour }, (_, index) => ({
    workspaceId: baseInput.workspaceId,
    createdAtMs: nowMs - index,
  })),
})
const productionReadyRateLimitBlocked = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-rate-limit-blocked',
  toolExecutionPlanId: 'tool-execution-plan-rate-limit-blocked',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
})
assert.equal(productionReadyRateLimitBlocked.gateway.status, 'blocked', 'workspace production rate limit should block production_ready gateway dispatch')
assert.equal(productionReadyRateLimitBlocked.workerResult, undefined, 'workspace production rate limit should block before worker dispatch')
assert.ok(
  productionReadyRateLimitBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_WORKSPACE_RATE_LIMIT_EXCEEDED'),
  'workspace production rate limit should identify rate-limit blocker',
)

setMockProductionGatewayOpsControlState({
  projectActiveJobs: [{
    projectId: baseInput.projectId,
    count: rateLimitPolicy.perProjectConcurrentJobs,
  }],
  workerActiveJobs: [{
    workerType: baseInput.workerType,
    count: workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[baseInput.workerType],
  }],
})
const productionReadyConcurrencyBlocked = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-concurrency-blocked',
  toolExecutionPlanId: 'tool-execution-plan-concurrency-blocked',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
})
assert.equal(productionReadyConcurrencyBlocked.gateway.status, 'blocked', 'production concurrency limits should block production_ready gateway dispatch')
assert.equal(productionReadyConcurrencyBlocked.workerResult, undefined, 'production concurrency limits should block before worker dispatch')
assert.ok(
  productionReadyConcurrencyBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_PROJECT_CONCURRENCY_LIMIT_EXCEEDED'),
  'production project concurrency blocker should be reported',
)
assert.ok(
  productionReadyConcurrencyBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_WORKER_CONCURRENCY_LIMIT_EXCEEDED'),
  'production worker concurrency blocker should be reported',
)
resetMockProductionGatewayOpsControlState()

await assert.rejects(
  () => createToolExecutionGatewayService({
    ...context,
    auth: undefined,
  }).dispatchApprovedToolCall(baseInput),
  /Authenticated user context is required/,
  'service should enforce auth even though the route also uses requireAuth',
)

console.log(JSON.stringify({
  ok: true,
  route: 'POST /v1/tool-executions/dispatch',
  dispatchedStatus: dispatched.gateway.status,
  futureHandler: dispatched.workerResult?.output?.futureHandler,
  blockersCovered: [
    overBudget.gateway.blockers[0]?.gateName,
    adapterMismatch.gateway.blockers[0]?.gateName,
    unfinishedLane.gateway.blockers[0]?.gateName,
    unsafeArtifact.gateway.blockers[0]?.gateName,
    rawMetadata.gateway.blockers[0]?.gateName,
    reservedRouterMetadata.gateway.blockers[0]?.gateName,
    productionReadyMissingEvidence.gateway.blockers[0]?.gateName,
    productionReadyBlockedEvidence.gateway.blockers[0]?.gateName,
    productionReadyMismatchedEvidence.gateway.blockers[0]?.gateName,
  ],
}, null, 2))

function productionEvidenceFixture(
  workspaceId: string,
  projectId: string,
): ProductionToolExecutionReadinessGateInput {
  const notes = (label: string) => [`${label} verified in tool execution gateway smoke fixture.`]

  return {
    sourceId: 'tool-execution-gateway-smoke:complete-production-readiness',
    sourceSha: '82f60e0a4d5d4707543a29f026a30f77c75b61fa',
    workspaceId,
    projectId,
    supabasePersistence: {
      environment: 'production',
      toolCostEventsMigrationDeployed: true,
      betaReadinessEvidenceMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      explicitDataApiGrantsVerified: true,
      betaEvidenceBackendOnlyAccessVerified: true,
      backupPitrApproved: true,
      securityAdvisorReviewed: true,
      performanceAdvisorReviewed: true,
      storagePoliciesVerified: true,
      notes: notes('Supabase persistence'),
    },
    toolCostLedger: {
      toolCostEventWriteVerified: true,
      ledgerAppendOnlyVerified: true,
      idempotentReplayVerified: true,
      projectSummaryReadbackVerified: true,
      notes: notes('Tool cost ledger'),
    },
    walletSettlement: {
      reservationVerified: true,
      spendVerified: true,
      releaseVerified: true,
      refundVerified: true,
      settlementRpcVerified: true,
      settlementRpcServiceRoleOnlyVerified: true,
      idempotentSettlementReplayVerified: true,
      noSilentChargeVerified: true,
      notes: notes('Wallet settlement'),
    },
    stripeBoundary: {
      billingOwnerApproved: true,
      noStripeFromToolCostSurface: true,
      serviceFeeExcludedFromToolEvents: true,
      stripeWebhookSeparatedFromToolLedger: true,
      notes: notes('Stripe boundary'),
    },
    observability: {
      dashboardsDeployed: true,
      alertsDeployed: true,
      alertRoutingVerified: true,
      billingQaMonitoringVerified: true,
      notes: notes('Observability and alerts'),
    },
    operationsControls: {
      rollbackPlanApproved: true,
      killSwitchesVerified: true,
      rateLimitsVerified: true,
      concurrencyLimitsVerified: true,
      incidentRunbookApproved: true,
      notes: notes('Operations controls'),
    },
    toolEvidence: {
      sourceId: 'tool-execution-gateway-smoke:tool-evidence',
      sourceSha: '82f60e0a4d5d4707543a29f026a30f77c75b61fa',
      allProductionToolsAccepted: true,
      modelWeightLicenseReviewApproved: true,
      notes: notes('Production tool evidence'),
    },
    hardSafety: {
      approvedPlanSnapshotRequired: true,
      creditEstimateAndReservationRequired: true,
      idempotencyRequired: true,
      rawPromptsRejected: true,
      secretsRejected: true,
      temporaryAccessLinksRejectedAsSourceTruth: true,
      frontendHeavyExecutionBlocked: true,
      licenseAndModelWeightReviewRequired: true,
      silentBillingBlocked: true,
      notes: notes('Hard safety invariants'),
    },
    finalOwnerSignoff: {
      deploymentOwnerApproved: true,
      securityOwnerApproved: true,
      storagePrivacyOwnerApproved: true,
      legalOwnerApproved: true,
      supportOwnerApproved: true,
      billingOwnerApproved: true,
      operationsOwnerApproved: true,
      realUserMediaBetaApproved: true,
      privateMediaApproval: true,
      artifactPrivacyEvidenceReady: true,
      paidProductionApproved: true,
      finalDeliveryShareApproved: true,
      notes: notes('Final owner signoff'),
    },
  }
}
