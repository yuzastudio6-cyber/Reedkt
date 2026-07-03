import assert from 'node:assert/strict'

import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateInput,
} from '../beta-readiness'
import { recordMockProductionToolExecutionReadinessEvidencePacket } from '../beta-readiness/production-tool-execution-readiness-evidence-store'
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
import { createMediaFoundationFixture } from '../workers/media'

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
const storedProductionEvidence = productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId)
const storedProductionEvidencePacket = recordMockProductionToolExecutionReadinessEvidencePacket(
  'tool-execution-gateway-smoke-production-readiness-packet',
  {
    readinessInput: storedProductionEvidence,
    readinessReport: evaluateProductionToolExecutionReadinessGate(storedProductionEvidence),
  },
  context.auth!.userId,
).packet

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

const productionReadyMissingEvidencePacket = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-missing-evidence-packet',
  executionMode: 'production_ready',
  productionReadinessEvidencePacketId: 'production-tool-execution-readiness-evidence-missing',
})
assert.equal(productionReadyMissingEvidencePacket.gateway.status, 'blocked', 'production_ready dispatch should block when the stored evidence packet cannot be found')
assert.equal(productionReadyMissingEvidencePacket.workerResult, undefined, 'missing production evidence packet should not dispatch a worker')
assert.ok(
  productionReadyMissingEvidencePacket.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_EVIDENCE_PACKET_NOT_FOUND'),
  'missing production evidence packet should identify the packet lookup blocker',
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

const productionReadyAmbiguousEvidence = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-ambiguous-evidence',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  productionReadinessEvidencePacketId: storedProductionEvidencePacket.id,
})
assert.equal(productionReadyAmbiguousEvidence.gateway.status, 'blocked', 'production_ready dispatch should block ambiguous inline plus stored evidence')
assert.equal(productionReadyAmbiguousEvidence.workerResult, undefined, 'ambiguous production readiness evidence should not dispatch a worker')
assert.ok(
  productionReadyAmbiguousEvidence.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_EVIDENCE_AMBIGUOUS'),
  'ambiguous production readiness evidence should identify the ambiguity blocker',
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

const productionReadyPlaceholderBlocked = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-placeholder-blocked',
  executionMode: 'production_ready',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
})
assert.equal(productionReadyPlaceholderBlocked.gateway.status, 'blocked', 'production_ready dispatch should not allow placeholder adapters')
assert.equal(productionReadyPlaceholderBlocked.workerResult, undefined, 'placeholder adapter must block before worker dispatch')
assert.equal(productionReadyPlaceholderBlocked.toolCostEvents, undefined, 'placeholder adapter must block before billing audit events')
assert.ok(
  productionReadyPlaceholderBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED'),
  'placeholder adapter blocker should be explicit',
)

const productionReadyToolReadinessDispatch = await service.dispatchApprovedToolCall(productionReadyToolReadinessInput({
  jobId: 'job-production-ready-tool-readiness-core-checks',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const toolReadinessResult = productionReadyToolReadinessDispatch.workerResult?.output?.toolReadinessResult as {
  realCheckMode?: boolean
  results?: unknown[]
  report?: { overallStatus?: string }
} | undefined
assert.equal(productionReadyToolReadinessDispatch.gateway.status, 'dispatched', 'complete evidence plus real tool-readiness adapter should dispatch')
assert.equal(productionReadyToolReadinessDispatch.workerResult?.status, 'completed', 'tool-readiness real handler should complete')
assert.equal(productionReadyToolReadinessDispatch.workerResult?.output?.mockOnly, false, 'tool-readiness production handler should be non-mock')
assert.equal(productionReadyToolReadinessDispatch.workerResult?.output?.realToolExecution, true, 'tool-readiness production handler should record real backend handler execution')
assert.equal(
  productionReadyToolReadinessDispatch.workerResult?.output?.futureHandler,
  'tool_readiness_worker_core_checks_production_handler',
  'tool-readiness production handler should use the reviewed core checks handler',
)
assert.equal(toolReadinessResult?.realCheckMode, true, 'tool-readiness handler should run real readiness checks in production_ready mode')
assert.ok((toolReadinessResult?.results?.length ?? 0) > 0, 'tool-readiness handler should return command/import/package readiness results')
assert.equal(productionReadyToolReadinessDispatch.toolCostEvents?.length, 2, 'tool-readiness dispatch should emit audit events for requested readiness tools')
assert.ok(
  productionReadyToolReadinessDispatch.toolCostEvents?.every((event) => event.billableToUser === false),
  'tool-readiness audit events must not bill the user',
)
assert.equal(productionReadyToolReadinessDispatch.walletSettlements?.length, 2, 'tool-readiness dispatch should create non-billable wallet settlement audit rows')
assert.ok(
  productionReadyToolReadinessDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === false && settlement.creditsDelta === 0),
  'tool-readiness wallet settlement audit rows must not spend user credits',
)

const mediaProbeFixture = await createMediaFoundationFixture({ timeoutMs: 20_000 })
let productionReadyRealDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
let productionReadyStoredPacketDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>>

if (mediaProbeFixture.ok) {
  try {
    productionReadyRealDispatch = await service.dispatchApprovedToolCall(productionReadyMediaProbeInput({
      jobId: 'job-production-ready-real-media-probe',
      productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
      sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
    }))
    assert.equal(productionReadyRealDispatch.gateway.status, 'dispatched', 'complete evidence plus real media-probe adapter should allow backend gateway dispatch')
    assert.equal(productionReadyRealDispatch.productionReadinessReport?.status, 'ready_for_paid_production', 'real production_ready request should include the passing readiness report')
    assert.equal(productionReadyRealDispatch.workerResult?.status, 'completed', 'real media-probe handler should complete')
    assert.equal(productionReadyRealDispatch.workerResult?.output?.mockOnly, false, 'production_ready media probe should use non-mock backend handler output')
    assert.equal(productionReadyRealDispatch.workerResult?.output?.realToolExecution, true, 'production_ready media probe should record real tool execution')
    assert.equal(
      productionReadyRealDispatch.workerResult?.output?.futureHandler,
      'cpu_analysis_worker_media_probe_production_handler',
      'production_ready media probe should use the reviewed media-probe handler',
    )
    assert.ok(
      productionReadyRealDispatch.workerResult?.output?.mediaFoundationResult &&
        typeof productionReadyRealDispatch.workerResult.output.mediaFoundationResult === 'object' &&
        'probe' in productionReadyRealDispatch.workerResult.output.mediaFoundationResult,
      'production_ready media probe should include ffprobe result evidence',
    )
    assert.equal(productionReadyRealDispatch.toolCostEvents?.length, 1, 'real production_ready dispatch should emit one gateway tool-cost event for the requested tool')
    assert.equal(productionReadyRealDispatch.toolCostEvents?.[0]?.toolId, 'ffprobe', 'gateway tool-cost event should be scoped to the requested tool')
    assert.equal(productionReadyRealDispatch.toolCostEvents?.[0]?.billableToUser, true, 'completed real production_ready gateway event should be billable after approval/reservation gates')
    assert.equal(productionReadyRealDispatch.toolCostEvents?.[0]?.metadata.serviceFeeIncluded, false, 'gateway billing metadata must keep service fees excluded')
    assert.equal(productionReadyRealDispatch.walletSettlements?.length, 1, 'real production_ready dispatch should create one wallet settlement audit row')
    assert.equal(productionReadyRealDispatch.walletSettlements?.[0]?.toolCostEventId, productionReadyRealDispatch.toolCostEvents?.[0]?.id, 'wallet settlement should reference the emitted tool-cost event')
    assert.equal(productionReadyRealDispatch.walletSettlements?.[0]?.stripeCallAttempted, false, 'gateway wallet settlement must preserve Stripe isolation')
    assert.equal(productionReadyRealDispatch.walletSettlements?.[0]?.serviceFeeIncluded, false, 'gateway wallet settlement must exclude service fees')
    assert.equal(productionReadyRealDispatch.walletSettlements?.[0]?.creditsDelta, -productionReadyRealDispatch.toolCostEvents![0].toolCostCredits, 'completed real production_ready gateway settlement should spend the tool event credits')

    productionReadyStoredPacketDispatch = await service.dispatchApprovedToolCall({
      ...productionReadyMediaProbeInput({
        jobId: 'job-production-ready-stored-packet-dispatch',
        sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
      }),
      productionReadinessEvidencePacketId: storedProductionEvidencePacket.id,
    })
    assert.equal(productionReadyStoredPacketDispatch.gateway.status, 'dispatched', 'stored production readiness evidence packet should allow the real backend gateway path')
    assert.equal(productionReadyStoredPacketDispatch.gateway.productionReadinessEvidencePacketId, storedProductionEvidencePacket.id, 'gateway result should echo the durable evidence packet id')
    assert.equal(productionReadyStoredPacketDispatch.productionReadinessReport?.status, 'ready_for_paid_production', 'stored production readiness packet should include the passing readiness report')
    assert.equal(productionReadyStoredPacketDispatch.workerResult?.status, 'completed', 'stored production readiness packet should reach the real media-probe handler')
    assert.equal(productionReadyStoredPacketDispatch.toolCostEvents?.length, 1, 'stored production readiness packet dispatch should emit one gateway tool-cost event')
    assert.equal(
      productionReadyStoredPacketDispatch.workerResult?.output?.mockOnly,
      false,
      'stored production readiness packet dispatch should use non-mock media-probe handler output',
    )
    assert.equal(
      productionReadyStoredPacketDispatch.workerRuntimeArtifactPipeline?.job.productionReadinessEvidencePacketId,
      storedProductionEvidencePacket.id,
      'worker runtime job record should preserve the durable production readiness evidence packet id',
    )
    assert.equal(productionReadyStoredPacketDispatch.walletSettlements?.length, 1, 'stored production readiness packet dispatch should create one wallet settlement audit row')
  } finally {
    await mediaProbeFixture.fixture.cleanup()
  }
} else {
  productionReadyStoredPacketDispatch = await service.dispatchApprovedToolCall({
    ...productionReadyMediaProbeInput({
      jobId: 'job-production-ready-stored-packet-dispatch',
      sourceLocalPath: '/tmp/reeditpro-production-media-probe-not-run.mp4',
    }),
    productionReadinessEvidencePacketId: storedProductionEvidencePacket.id,
  })
  assert.equal(productionReadyStoredPacketDispatch.gateway.status, 'blocked', 'stored packet real dispatch should not run when fixture tools are unavailable')
}

setMockProductionGatewayOpsControlState({
  activeKillSwitches: {
    globalGeneration: true,
  },
})
const productionReadyKillSwitchBlocked = await service.dispatchApprovedToolCall({
  ...productionReadyMediaProbeInput({
    jobId: 'job-production-ready-kill-switch-blocked',
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  }),
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
  ...productionReadyMediaProbeInput({
    jobId: 'job-production-ready-rate-limit-blocked',
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  }),
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
  ...productionReadyMediaProbeInput({
    jobId: 'job-production-ready-concurrency-blocked',
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  }),
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
    productionReadyMissingEvidencePacket.gateway.blockers[0]?.gateName,
    productionReadyBlockedEvidence.gateway.blockers[0]?.gateName,
    productionReadyAmbiguousEvidence.gateway.blockers[0]?.gateName,
    productionReadyMismatchedEvidence.gateway.blockers[0]?.gateName,
  ],
  storedProductionReadinessEvidencePacketId: storedProductionEvidencePacket.id,
  productionReadyPlaceholderBlocked: productionReadyPlaceholderBlocked.gateway.status,
  toolReadinessHandler: productionReadyToolReadinessDispatch.workerResult?.output?.futureHandler,
  toolReadinessBillable: productionReadyToolReadinessDispatch.toolCostEvents?.map((event) => event.billableToUser),
  realMediaProbeDispatchCovered: Boolean(productionReadyRealDispatch),
  realMediaProbeHandler: productionReadyRealDispatch?.workerResult?.output?.futureHandler,
}, null, 2))

function productionEvidenceFixture(
  workspaceId: string,
  projectId: string,
): ProductionToolExecutionReadinessGateInput {
  return {
    sourceId: 'tool-execution-gateway-smoke:complete-production-readiness',
    sourceSha: '82f60e0a4d5d4707543a29f026a30f77c75b61fa',
    workspaceId,
    projectId,
    supabasePersistence: {
      ...reviewedProductionEvidence('Supabase persistence'),
      environment: 'production',
      toolCostEventsMigrationDeployed: true,
      betaReadinessEvidenceMigrationDeployed: true,
      productionReadinessEvidenceMigrationDeployed: true,
      serviceRoleWritePathVerified: true,
      rlsMemberReadPathVerified: true,
      explicitDataApiGrantsVerified: true,
      betaEvidenceBackendOnlyAccessVerified: true,
      productionEvidenceBackendOnlyAccessVerified: true,
      backupPitrApproved: true,
      securityAdvisorReviewed: true,
      performanceAdvisorReviewed: true,
      storagePoliciesVerified: true,
    },
    toolCostLedger: {
      ...reviewedProductionEvidence('Tool cost ledger'),
      toolCostEventWriteVerified: true,
      ledgerAppendOnlyVerified: true,
      idempotentReplayVerified: true,
      projectSummaryReadbackVerified: true,
    },
    walletSettlement: {
      ...reviewedProductionEvidence('Wallet settlement'),
      reservationVerified: true,
      spendVerified: true,
      releaseVerified: true,
      refundVerified: true,
      settlementRpcVerified: true,
      settlementRpcServiceRoleOnlyVerified: true,
      idempotentSettlementReplayVerified: true,
      noSilentChargeVerified: true,
    },
    stripeBoundary: {
      ...reviewedProductionEvidence('Stripe boundary'),
      billingOwnerApproved: true,
      noStripeFromToolCostSurface: true,
      serviceFeeExcludedFromToolEvents: true,
      stripeWebhookSeparatedFromToolLedger: true,
    },
    observability: {
      ...reviewedProductionEvidence('Observability and alerts'),
      dashboardsDeployed: true,
      alertsDeployed: true,
      alertRoutingVerified: true,
      billingQaMonitoringVerified: true,
    },
    operationsControls: {
      ...reviewedProductionEvidence('Operations controls'),
      rollbackPlanApproved: true,
      killSwitchesVerified: true,
      rateLimitsVerified: true,
      concurrencyLimitsVerified: true,
      incidentRunbookApproved: true,
    },
    toolEvidence: {
      ...reviewedProductionEvidence('Production tool evidence'),
      sourceId: 'tool-execution-gateway-smoke:tool-evidence',
      sourceSha: '82f60e0a4d5d4707543a29f026a30f77c75b61fa',
      allProductionToolsAccepted: true,
      modelWeightLicenseReviewApproved: true,
    },
    hardSafety: {
      ...reviewedProductionEvidence('Hard safety invariants'),
      approvedPlanSnapshotRequired: true,
      creditEstimateAndReservationRequired: true,
      idempotencyRequired: true,
      rawPromptsRejected: true,
      secretsRejected: true,
      temporaryAccessLinksRejectedAsSourceTruth: true,
      frontendHeavyExecutionBlocked: true,
      licenseAndModelWeightReviewRequired: true,
      silentBillingBlocked: true,
    },
    finalOwnerSignoff: {
      ...reviewedProductionEvidence('Final owner signoff'),
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
    },
  }
}

function reviewedProductionEvidence(label: string) {
  return {
    evidenceArtifactId: `gateway-prod-artifact:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    reviewedBy: 'tool-execution-gateway-smoke-reviewer',
    reviewedAt: '2026-07-02T00:00:00.000Z',
    notes: [`${label} verified in tool execution gateway smoke fixture.`],
  }
}

function productionReadyMediaProbeInput(input: {
  jobId: string
  sourceLocalPath?: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_media_probe',
    requestedToolIds: ['ffprobe'],
    requestedRecipeIds: ['media-probe-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      mediaFoundation: {
        mode: 'production_ready',
        tasks: ['probe', 'build_analysis_report'],
        sourceStorageObjectId: 'source-storage-object-smoke',
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        sourceLocalPath: input.sourceLocalPath ?? '/tmp/reeditpro-production-media-probe-not-run.mp4',
        contentType: 'video/mp4',
        ffprobeBin: 'ffprobe',
        timeoutMs: 20_000,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyToolReadinessInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    workerType: 'tool_readiness_worker',
    executionMode: 'production_ready',
    adapterId: 'tool_readiness_worker_core_checks',
    requestedToolIds: ['ffmpeg', 'ffprobe'],
    requestedRecipeIds: ['core-tool-readiness-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      toolReadiness: {
        mode: 'production_ready',
        strict: false,
        timeoutMs: 15_000,
        maxBuffer: 1024 * 1024,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}
