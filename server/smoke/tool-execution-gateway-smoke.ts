import assert from 'node:assert/strict'
import path from 'node:path'

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
import type { SmartCutPlan } from '../workers/smart-cut'

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
const staleProductionEvidencePacket = recordMockProductionToolExecutionReadinessEvidencePacket(
  'tool-execution-gateway-smoke-stale-production-readiness-packet',
  {
    readinessInput: {
      ...storedProductionEvidence,
      sourceId: 'tool-execution-gateway-smoke:stale-production-readiness',
    },
    readinessReport: evaluateProductionToolExecutionReadinessGate({
      ...storedProductionEvidence,
      sourceId: 'tool-execution-gateway-smoke:stale-production-readiness',
    }),
  },
  context.auth!.userId,
).packet
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

const productionReadyStaleEvidencePacket = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-production-ready-stale-evidence-packet',
  executionMode: 'production_ready',
  productionReadinessEvidencePacketId: staleProductionEvidencePacket.id,
})
assert.equal(productionReadyStaleEvidencePacket.gateway.status, 'blocked', 'production_ready dispatch should block stale production readiness evidence packets')
assert.equal(productionReadyStaleEvidencePacket.workerResult, undefined, 'stale production evidence packet should not dispatch a worker')
assert.ok(
  productionReadyStaleEvidencePacket.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_EVIDENCE_PACKET_STALE'),
  'stale production evidence packet should identify the latest-packet gate',
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

const persistentInlineEvidenceContext: ServiceContext = {
  ...context,
  env: {
    mockOnly: false,
    allowMockWithoutSupabase: false,
    hasSupabaseAdmin: true,
  } as never,
  clients: {
    ...context.clients,
    admin: createGatewayPersistentReadinessAdminClient(),
  },
  requestId: 'tool-execution-gateway-smoke:persistent-inline-evidence',
}
const persistentInlineEvidenceBlocked = await createToolExecutionGatewayService(persistentInlineEvidenceContext).dispatchApprovedToolCall(productionReadyToolReadinessInput({
  jobId: 'job-production-ready-persistent-inline-evidence-blocked',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
assert.equal(persistentInlineEvidenceBlocked.gateway.status, 'blocked', 'persistent production_ready dispatch should reject inline readiness evidence')
assert.equal(persistentInlineEvidenceBlocked.workerResult, undefined, 'persistent inline readiness evidence must block before worker dispatch')
assert.ok(
  persistentInlineEvidenceBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_READINESS_EVIDENCE_PACKET_REQUIRED'),
  'persistent production_ready dispatch should require a stored readiness evidence packet id',
)

const persistentBillingPreflightPacketId = 'production-readiness-evidence-persistent-billing-preflight-smoke'
const persistentBillingPreflightContext: ServiceContext = {
  ...context,
  env: {
    mockOnly: false,
    allowMockWithoutSupabase: false,
    hasSupabaseAdmin: true,
  } as never,
  clients: {
    ...context.clients,
    admin: createGatewayPersistentReadinessAdminClient({
      productionReadinessRows: [
        productionReadinessPacketRow(persistentBillingPreflightPacketId, productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId)),
      ],
      missingBillingBackend: true,
    }),
  },
  requestId: 'tool-execution-gateway-smoke:persistent-billing-preflight',
}
const persistentBillingPreflightBlocked = await createToolExecutionGatewayService(persistentBillingPreflightContext).dispatchApprovedToolCall(productionReadyToolReadinessInput({
  jobId: 'job-production-ready-persistent-billing-preflight-blocked',
  productionReadinessEvidencePacketId: persistentBillingPreflightPacketId,
}))
assert.equal(persistentBillingPreflightBlocked.gateway.status, 'blocked', 'persistent production_ready dispatch should block before worker dispatch when billing persistence is unavailable')
assert.equal(persistentBillingPreflightBlocked.workerResult, undefined, 'billing backend preflight must block before worker dispatch')
assert.equal(persistentBillingPreflightBlocked.toolCostEvents, undefined, 'billing backend preflight must not emit tool-cost events')
assert.equal(persistentBillingPreflightBlocked.walletSettlements, undefined, 'billing backend preflight must not create wallet settlements')
assert.ok(
  persistentBillingPreflightBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_BILLING_TOOL_COST_EVENTS_BACKEND_UNAVAILABLE'),
  'billing backend preflight should identify missing tool_cost_events persistence',
)
assert.ok(
  persistentBillingPreflightBlocked.gateway.blockers.some((blocker) => blocker.code === 'PRODUCTION_BILLING_WALLET_SETTLEMENT_RPC_UNAVAILABLE'),
  'billing backend preflight should identify missing wallet settlement RPC',
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

const productionReadyTrackANativeDispatches = [
  await service.dispatchApprovedToolCall(productionReadyTrackANativeValidationInput({
    jobId: 'job-production-ready-track-a-streamer-render-support',
    adapterId: 'tool_readiness_worker_streamer_render_pipeline_support',
    requestedToolId: 'gstreamer',
    capabilityId: 'streamer_render_pipeline_support',
    tasks: ['validate_render_pipeline_support', 'validate_backend_boundary', 'validate_no_media_output'],
    extra: {
      renderSupportManifestId: 'render-support-manifest-smoke',
      privateFixtureScopeId: 'track-a-private-fixture-scope-smoke',
    },
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  })),
  await service.dispatchApprovedToolCall(productionReadyTrackANativeValidationInput({
    jobId: 'job-production-ready-track-a-mkvtoolnix-container-validation',
    adapterId: 'tool_readiness_worker_mkvtoolnix_container_validation',
    requestedToolId: 'mkvtoolnix',
    capabilityId: 'mkvtoolnix_container_validation',
    tasks: ['validate_container_manifest', 'validate_cleanup_evidence', 'validate_no_media_processing'],
    extra: {
      privateArtifactManifestId: 'private-artifact-manifest-smoke',
      cleanupEvidenceId: 'cleanup-evidence-smoke',
    },
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  })),
  await service.dispatchApprovedToolCall(productionReadyTrackANativeValidationInput({
    jobId: 'job-production-ready-track-a-gpac-mp4box-packaging-validation',
    adapterId: 'tool_readiness_worker_gpac_mp4box_packaging_validation',
    requestedToolId: 'gpac_mp4box',
    capabilityId: 'gpac_mp4box_packaging_validation',
    tasks: ['validate_package_source_provenance', 'validate_mp4box_binary_presence', 'validate_no_packaging_execution'],
    extra: {
      officialAptSourceApproved: true,
      repoUri: 'https://dist.gpac.io/gpac/linux/debian',
      codename: 'bookworm',
      component: 'main',
      packageName: 'gpac',
      packageVersion: '26.02-rev0-g118e60a90-HEAD',
      architecture: 'arm64',
      binaryPath: '/usr/bin/MP4Box',
      installSourceEvidenceId: 'pr-738-install-source-evidence-smoke',
    },
    productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
  })),
]

for (const dispatch of productionReadyTrackANativeDispatches) {
  const result = dispatch.workerResult?.output?.trackANativeValidationResult as {
    status?: string
    noRuntimeExecution?: boolean
    noMediaProcessing?: boolean
    noPublicArtifacts?: boolean
    artifactRecords?: Array<{ isPrivate?: boolean; sourceOfTruth?: boolean; storageObjectPath?: string }>
    qaResults?: unknown[]
  } | undefined
  assert.equal(dispatch.gateway.status, 'dispatched', `Track A native validation should dispatch: ${JSON.stringify(dispatch.gateway.blockers)}`)
  assert.equal(dispatch.workerResult?.status, 'completed', 'Track A native validation worker should complete')
  assert.equal(dispatch.workerResult?.output?.mockOnly, false, 'Track A native validation production handler should be non-mock')
  assert.equal(dispatch.workerResult?.output?.realToolExecution, true, 'Track A native validation should record reviewed backend handler execution')
  assert.equal(result?.status, 'completed', 'Track A native validation result should complete')
  assert.equal(result?.noRuntimeExecution, true, 'Track A native validation must not run native binaries in this gateway smoke')
  assert.equal(result?.noMediaProcessing, true, 'Track A native validation must not process media in this gateway smoke')
  assert.equal(result?.noPublicArtifacts, true, 'Track A native validation must not produce public artifacts')
  assert.ok((result?.artifactRecords?.length ?? 0) === 1, 'Track A native validation should produce one private QA report artifact')
  assert.ok(
    result?.artifactRecords?.every((artifact) => (
      artifact.isPrivate === true &&
      artifact.sourceOfTruth === true &&
      artifact.storageObjectPath?.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) === true &&
      !artifact.storageObjectPath.includes('signed')
    )),
    'Track A native validation artifacts must be private, source-of-truth, project-scoped, and unsigned',
  )
  assert.ok((result?.qaResults?.length ?? 0) > 0, 'Track A native validation should emit QA gate results')
  assert.equal(dispatch.toolCostEvents?.length, 1, 'Track A native validation should emit one non-billable audit event')
  assert.equal(dispatch.toolCostEvents?.[0]?.billableToUser, false, 'Track A native validation audit event must not bill the user')
  assert.equal(dispatch.walletSettlements?.length, 1, 'Track A native validation should create one non-billable wallet settlement audit row')
  assert.equal(dispatch.walletSettlements?.[0]?.creditsDelta, 0, 'Track A native validation settlement must not spend credits')
}

const productionReadySmartCutTimelineDispatch = await service.dispatchApprovedToolCall(productionReadySmartCutTimelineInput({
  jobId: 'job-production-ready-smart-cut-timeline',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const smartCutTimelineResult = productionReadySmartCutTimelineDispatch.workerResult?.output?.smartCutTimelineExecutionResult as {
  status?: string
  timelineManifest?: unknown
  otioManifest?: unknown
  artifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
  }>
  qaResults?: unknown[]
  blocksFinalExport?: boolean
} | undefined
const smartCutManifestArtifacts = productionReadySmartCutTimelineDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'timeline_manifest' || artifact.artifactType === 'opentimelineio_manifest') ?? []
assert.equal(productionReadySmartCutTimelineDispatch.gateway.status, 'dispatched', 'complete evidence plus smart-cut/timeline adapter should allow backend gateway dispatch')
assert.equal(productionReadySmartCutTimelineDispatch.workerResult?.status, 'completed', 'smart-cut/timeline real handler should complete')
assert.equal(productionReadySmartCutTimelineDispatch.workerResult?.output?.mockOnly, false, 'smart-cut/timeline production handler should be non-mock')
assert.equal(productionReadySmartCutTimelineDispatch.workerResult?.output?.realToolExecution, true, 'smart-cut/timeline production handler should record real backend handler execution')
assert.equal(
  productionReadySmartCutTimelineDispatch.workerResult?.output?.futureHandler,
  'cpu_analysis_worker_smart_cut_timeline_production_handler',
  'smart-cut/timeline production handler should use the reviewed timeline metadata handler',
)
assert.equal(smartCutTimelineResult?.status, 'partial', 'smart-cut/timeline production handler should complete as partial metadata execution, not final export')
assert.ok(smartCutTimelineResult?.timelineManifest, 'smart-cut/timeline production handler should build a timeline manifest')
assert.ok(smartCutTimelineResult?.otioManifest, 'smart-cut/timeline production handler should build an OTIO-style manifest')
assert.equal(smartCutTimelineResult?.blocksFinalExport, true, 'smart-cut/timeline production handler must keep final export blocked')
assert.ok((smartCutTimelineResult?.qaResults?.length ?? 0) > 0, 'smart-cut/timeline production handler should emit QA gate results')
assert.ok(
  smartCutTimelineResult?.artifacts?.some((artifact) => artifact.artifactType === 'timeline_manifest' && artifact.sourceOfTruth === true),
  'smart-cut/timeline result should include a source-of-truth timeline manifest artifact',
)
assert.ok(
  smartCutTimelineResult?.artifacts?.some((artifact) => artifact.artifactType === 'opentimelineio_manifest' && artifact.sourceOfTruth === true),
  'smart-cut/timeline result should include a source-of-truth OTIO-style manifest artifact',
)
assert.ok(smartCutManifestArtifacts.length >= 2, 'worker runtime artifact manifest should include private timeline and OTIO-style artifacts')
assert.ok(
  smartCutManifestArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'smart-cut/timeline artifacts must stay private, source-of-truth, project-scoped, and unsigned',
)
assert.ok(
  (productionReadySmartCutTimelineDispatch.workerResult?.qualityGateResults.length ?? 0) > 0,
  'smart-cut/timeline worker result should preserve QA gate results',
)
assert.equal(productionReadySmartCutTimelineDispatch.toolCostEvents?.length, 1, 'smart-cut/timeline dispatch should emit one gateway tool-cost event for OpenTimelineIO metadata work')
assert.equal(productionReadySmartCutTimelineDispatch.toolCostEvents?.[0]?.toolId, 'opentimelineio', 'smart-cut/timeline dispatch should scope billing audit to OpenTimelineIO')
assert.equal(productionReadySmartCutTimelineDispatch.toolCostEvents?.[0]?.billableToUser, true, 'smart-cut/timeline event should be billable only after approval/reservation/readiness gates')
assert.equal(productionReadySmartCutTimelineDispatch.toolCostEvents?.[0]?.metadata.serviceFeeIncluded, false, 'smart-cut/timeline cost event must exclude service fees')
assert.equal(productionReadySmartCutTimelineDispatch.walletSettlements?.length, 1, 'smart-cut/timeline dispatch should create one wallet settlement audit row')
assert.equal(productionReadySmartCutTimelineDispatch.walletSettlements?.[0]?.creditsDelta, -productionReadySmartCutTimelineDispatch.toolCostEvents![0].toolCostCredits, 'smart-cut/timeline wallet settlement should spend the emitted tool-cost credits')

const productionReadyAudioMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyAudioMetadataInput({
  jobId: 'job-production-ready-audio-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const audioMetadataResult = productionReadyAudioMetadataDispatch.workerResult?.output?.audioExecutionResult as {
  status?: string
  executionPlan?: unknown
  cleanedAudioArtifact?: unknown
  separatedStemArtifacts?: unknown[]
  soundSyncArtifact?: unknown
  artifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
  }>
  qaResults?: unknown[]
  blocksFinalExport?: boolean
  skippedReasons?: Array<{ tool?: string }>
} | undefined
const audioMetadataArtifacts = productionReadyAudioMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'audio_analysis_json') ?? []
assert.equal(
  productionReadyAudioMetadataDispatch.gateway.status,
  'dispatched',
  `complete evidence plus audio metadata adapter should allow backend gateway dispatch: ${JSON.stringify(productionReadyAudioMetadataDispatch.gateway.blockers)}`,
)
assert.equal(productionReadyAudioMetadataDispatch.workerResult?.status, 'completed', 'audio metadata real handler should complete')
assert.equal(productionReadyAudioMetadataDispatch.workerResult?.output?.mockOnly, false, 'audio metadata production handler should be non-mock')
assert.equal(productionReadyAudioMetadataDispatch.workerResult?.output?.realToolExecution, true, 'audio metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyAudioMetadataDispatch.workerResult?.output?.futureHandler,
  'cpu_analysis_worker_audio_metadata_production_handler',
  'audio metadata production handler should use the reviewed audio metadata handler',
)
assert.equal(audioMetadataResult?.status, 'partial', 'audio metadata production handler should complete as partial metadata execution, not final mux/export')
assert.ok(audioMetadataResult?.executionPlan, 'audio metadata production handler should build an audio execution plan')
assert.ok(audioMetadataResult?.soundSyncArtifact, 'audio metadata production handler should build SoundSync cue metadata')
assert.equal(audioMetadataResult?.cleanedAudioArtifact, undefined, 'audio metadata production handler must not create cleaned audio')
assert.equal(audioMetadataResult?.separatedStemArtifacts?.length ?? 0, 0, 'audio metadata production handler must not create separated stems')
assert.equal(audioMetadataResult?.blocksFinalExport, true, 'audio metadata production handler must keep final mux/export blocked')
assert.ok((audioMetadataResult?.qaResults?.length ?? 0) > 0, 'audio metadata production handler should emit audio QA results')
assert.ok(
  audioMetadataResult?.artifacts?.some((artifact) => artifact.artifactType === 'audio_analysis_json' && artifact.sourceOfTruth === true),
  'audio metadata result should include source-of-truth audio analysis metadata',
)
assert.ok(audioMetadataArtifacts.length >= 1, 'worker runtime artifact manifest should include private audio metadata artifacts')
assert.ok(
  audioMetadataArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'audio metadata artifacts must stay private, source-of-truth, project-scoped, and unsigned',
)
assert.ok(
  (productionReadyAudioMetadataDispatch.workerResult?.qualityGateResults.length ?? 0) > 0,
  'audio metadata worker result should preserve QA gate results',
)
assert.ok(
  audioMetadataResult?.skippedReasons?.some((reason) => reason.tool === 'ffmpeg'),
  'audio metadata handler should record FFmpeg command metadata skips instead of running audio commands',
)
assert.equal(productionReadyAudioMetadataDispatch.toolCostEvents?.length, 1, 'audio metadata dispatch should emit one gateway cost event for AudioFlux metadata work')
assert.deepEqual(
  productionReadyAudioMetadataDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
  ['audioflux'],
  'audio metadata dispatch should scope billing audit events to AudioFlux',
)
assert.ok(
  productionReadyAudioMetadataDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
  'audio metadata tool cost events should be billable tool-cost-only events after approval/reservation gates',
)
assert.equal(productionReadyAudioMetadataDispatch.walletSettlements?.length, 1, 'audio metadata dispatch should create a wallet settlement for the AudioFlux tool-cost event')
assert.ok(
  productionReadyAudioMetadataDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
  'audio metadata wallet settlements should spend user credits only for the completed real handler',
)

const productionReadyColorMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyColorMetadataInput({
  jobId: 'job-production-ready-color-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const colorMetadataResult = productionReadyColorMetadataDispatch.workerResult?.output?.colorExecutionResult as {
  status?: string
  colorAnalysisSummary?: unknown
  colorGradeRecipeArtifact?: unknown
  artifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
  }>
  qaResults?: unknown[]
  blocksFinalExport?: boolean
  skippedReasons?: Array<{ tool?: string }>
} | undefined
const colorMetadataArtifacts = productionReadyColorMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'color_analysis_json' || artifact.artifactType === 'color_grade_recipe') ?? []
assert.equal(productionReadyColorMetadataDispatch.gateway.status, 'dispatched', 'complete evidence plus color metadata adapter should allow backend gateway dispatch')
assert.equal(productionReadyColorMetadataDispatch.workerResult?.status, 'completed', 'color metadata real handler should complete')
assert.equal(productionReadyColorMetadataDispatch.workerResult?.output?.mockOnly, false, 'color metadata production handler should be non-mock')
assert.equal(productionReadyColorMetadataDispatch.workerResult?.output?.realToolExecution, true, 'color metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyColorMetadataDispatch.workerResult?.output?.futureHandler,
  'cpu_analysis_worker_color_metadata_production_handler',
  'color metadata production handler should use the reviewed color metadata handler',
)
assert.equal(colorMetadataResult?.status, 'partial', 'color metadata production handler should complete as partial metadata execution, not final export')
assert.ok(colorMetadataResult?.colorAnalysisSummary, 'color metadata production handler should build a color analysis summary')
assert.ok(colorMetadataResult?.colorGradeRecipeArtifact, 'color metadata production handler should build a color grade recipe artifact')
assert.equal(colorMetadataResult?.blocksFinalExport, true, 'color metadata production handler must keep final export blocked')
assert.ok((colorMetadataResult?.qaResults?.length ?? 0) > 0, 'color metadata production handler should emit color QA results')
assert.ok(
  colorMetadataResult?.artifacts?.some((artifact) => artifact.artifactType === 'color_analysis_json' && artifact.sourceOfTruth === true),
  'color metadata result should include a source-of-truth color analysis artifact',
)
assert.ok(
  colorMetadataResult?.artifacts?.some((artifact) => artifact.artifactType === 'color_grade_recipe' && artifact.sourceOfTruth === true),
  'color metadata result should include a source-of-truth color grade recipe artifact',
)
assert.ok(colorMetadataArtifacts.length >= 2, 'worker runtime artifact manifest should include private color analysis and grade recipe artifacts')
assert.ok(
  colorMetadataArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'color metadata artifacts must stay private, source-of-truth, project-scoped, and unsigned',
)
assert.ok(
  (productionReadyColorMetadataDispatch.workerResult?.qualityGateResults.length ?? 0) > 0,
  'color metadata worker result should preserve QA gate results',
)
assert.ok(
  colorMetadataResult?.skippedReasons?.some((reason) => reason.tool === 'opencolorio') &&
    colorMetadataResult.skippedReasons.some((reason) => reason.tool === 'openimageio'),
  'color metadata handler should record native OpenColorIO/OpenImageIO transform skips instead of running media transforms',
)
assert.equal(productionReadyColorMetadataDispatch.toolCostEvents?.length, 2, 'color metadata dispatch should emit gateway cost events for OpenColorIO and OpenImageIO metadata work')
assert.deepEqual(
  productionReadyColorMetadataDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
  ['opencolorio', 'openimageio'],
  'color metadata dispatch should scope billing audit events to OpenColorIO and OpenImageIO',
)
assert.ok(
  productionReadyColorMetadataDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
  'color metadata tool cost events should be billable tool-cost-only events after approval/reservation gates',
)
assert.equal(productionReadyColorMetadataDispatch.walletSettlements?.length, 2, 'color metadata dispatch should create wallet settlements for both tool-cost events')
assert.ok(
  productionReadyColorMetadataDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
  'color metadata wallet settlements should spend user credits only for the completed real handler',
)

const productionReadyFinalRenderMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyFinalRenderMetadataInput({
  jobId: 'job-production-ready-final-render-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const finalRenderMetadataResult = productionReadyFinalRenderMetadataDispatch.workerResult?.output?.finalRenderExecutionResult as {
  status?: string
  executionManifest?: { renderMode?: string; finalDeliveryCandidate?: boolean; revideoUsed?: boolean }
  commandPlans?: Array<{ tool?: string; executes?: boolean }>
  renderArtifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
    previewAllowed?: boolean
  }>
  previewArtifact?: unknown
  finalExportArtifact?: unknown
  qaResults?: Array<{ gateType?: string; status?: string; blocking?: boolean }>
  finalDeliveryAllowed?: boolean
  blocksFinalExport?: boolean
  skippedReasons?: Array<{ tool?: string }>
} | undefined
const finalRenderManifestArtifacts = productionReadyFinalRenderMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'render_manifest') ?? []
assert.equal(productionReadyFinalRenderMetadataDispatch.gateway.status, 'dispatched', 'complete evidence plus final-render metadata adapter should allow backend gateway dispatch')
assert.equal(productionReadyFinalRenderMetadataDispatch.workerResult?.status, 'completed', 'final-render metadata real handler should complete')
assert.equal(productionReadyFinalRenderMetadataDispatch.workerResult?.output?.mockOnly, false, 'final-render metadata production handler should be non-mock')
assert.equal(productionReadyFinalRenderMetadataDispatch.workerResult?.output?.realToolExecution, true, 'final-render metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyFinalRenderMetadataDispatch.workerResult?.output?.futureHandler,
  'render_worker_final_render_metadata_production_handler',
  'final-render metadata production handler should use the reviewed render metadata handler',
)
assert.equal(finalRenderMetadataResult?.status, 'partial', 'final-render metadata production handler should complete as partial metadata execution, not preview/export')
assert.equal(finalRenderMetadataResult?.executionManifest?.renderMode, 'command_plan_only', 'final-render metadata handler must use command_plan_only render mode')
assert.equal(finalRenderMetadataResult?.executionManifest?.finalDeliveryCandidate, false, 'command-plan metadata must not become a final delivery candidate')
assert.equal(finalRenderMetadataResult?.executionManifest?.revideoUsed, false, 'final-render metadata handler must not use Revideo')
assert.ok((finalRenderMetadataResult?.commandPlans?.length ?? 0) >= 3, 'final-render metadata handler should build Remotion, FFmpeg, and libass command plans')
assert.ok(
  finalRenderMetadataResult?.commandPlans?.every((plan) => plan.executes === false),
  'final-render metadata command plans must be non-executing',
)
assert.ok(
  finalRenderMetadataResult?.renderArtifacts?.some((artifact) => artifact.artifactType === 'render_manifest' && artifact.sourceOfTruth === true),
  'final-render metadata result should include a source-of-truth render manifest artifact',
)
assert.equal(finalRenderMetadataResult?.previewArtifact, undefined, 'final-render metadata handler must not create preview video artifacts')
assert.equal(finalRenderMetadataResult?.finalExportArtifact, undefined, 'final-render metadata handler must not create final export artifacts')
assert.equal(finalRenderMetadataResult?.finalDeliveryAllowed, false, 'final-render metadata handler must not allow final delivery')
assert.equal(finalRenderMetadataResult?.blocksFinalExport, true, 'final-render metadata handler must keep final export blocked')
assert.ok(
  finalRenderMetadataResult?.qaResults?.some((gate) => gate.gateType === 'final_delivery' && gate.status !== 'passed' && gate.blocking === true),
  'final-render metadata handler should preserve a blocking final_delivery gate',
)
assert.ok(finalRenderManifestArtifacts.length >= 1, 'worker runtime artifact manifest should include private render manifest metadata')
assert.ok(
  finalRenderManifestArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.previewAllowed === false &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'final-render metadata artifacts must stay private, source-of-truth, non-preview, project-scoped, and unsigned',
)
assert.ok(
  (productionReadyFinalRenderMetadataDispatch.workerResult?.qualityGateResults.length ?? 0) > 0,
  'final-render metadata worker result should preserve QA gate results',
)
assert.deepEqual(
  finalRenderMetadataResult?.skippedReasons?.map((reason) => reason.tool).sort(),
  ['ffmpeg', 'libass', 'remotion'],
  'final-render metadata handler should record command-plan skips instead of executing render tools',
)
assert.equal(productionReadyFinalRenderMetadataDispatch.toolCostEvents?.length, 3, 'final-render metadata dispatch should emit gateway cost events for Remotion, FFmpeg, and libass metadata work')
assert.deepEqual(
  productionReadyFinalRenderMetadataDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
  ['ffmpeg', 'libass', 'remotion'],
  'final-render metadata dispatch should scope billing audit events to Remotion, FFmpeg, and libass',
)
assert.ok(
  productionReadyFinalRenderMetadataDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
  'final-render metadata tool cost events should be billable tool-cost-only events after approval/reservation gates',
)
assert.equal(productionReadyFinalRenderMetadataDispatch.walletSettlements?.length, 3, 'final-render metadata dispatch should create wallet settlements for render metadata cost events')
assert.ok(
  productionReadyFinalRenderMetadataDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
  'final-render metadata wallet settlements should spend user credits only for the completed real handler',
)

const productionReadyFinalRenderQaMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyFinalRenderQaMetadataInput({
  jobId: 'job-production-ready-final-render-qa-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const finalRenderQaMetadataResult = productionReadyFinalRenderQaMetadataDispatch.workerResult?.output?.finalRenderExecutionResult as {
  status?: string
  executionManifest?: { renderMode?: string; finalDeliveryCandidate?: boolean; revideoUsed?: boolean }
  commandPlans?: Array<{ tool?: string; executes?: boolean }>
  renderArtifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
    previewAllowed?: boolean
  }>
  previewArtifact?: unknown
  finalExportArtifact?: unknown
  qaResults?: Array<{ gateType?: string; status?: string; blocking?: boolean }>
  finalDeliveryAllowed?: boolean
  blocksFinalExport?: boolean
  skippedReasons?: Array<{ tool?: string }>
} | undefined
const finalRenderQaManifestArtifacts = productionReadyFinalRenderQaMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'render_manifest') ?? []
assert.equal(productionReadyFinalRenderQaMetadataDispatch.gateway.status, 'dispatched', 'complete evidence plus final-render QA metadata adapter should allow backend gateway dispatch')
assert.equal(productionReadyFinalRenderQaMetadataDispatch.workerResult?.status, 'completed', 'final-render QA metadata real handler should complete')
assert.equal(productionReadyFinalRenderQaMetadataDispatch.workerResult?.output?.mockOnly, false, 'final-render QA metadata production handler should be non-mock')
assert.equal(productionReadyFinalRenderQaMetadataDispatch.workerResult?.output?.realToolExecution, true, 'final-render QA metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyFinalRenderQaMetadataDispatch.workerResult?.output?.futureHandler,
  'qa_worker_final_render_qa_metadata_production_handler',
  'final-render QA metadata production handler should use the reviewed QA metadata handler',
)
assert.equal(finalRenderQaMetadataResult?.status, 'partial', 'final-render QA metadata handler should complete as partial metadata execution, not preview/export')
assert.equal(finalRenderQaMetadataResult?.executionManifest?.renderMode, 'command_plan_only', 'final-render QA metadata handler must use command_plan_only render mode')
assert.equal(finalRenderQaMetadataResult?.executionManifest?.finalDeliveryCandidate, false, 'QA metadata must not become a final delivery candidate')
assert.equal(finalRenderQaMetadataResult?.executionManifest?.revideoUsed, false, 'final-render QA metadata handler must not use Revideo')
assert.ok((finalRenderQaMetadataResult?.commandPlans?.length ?? 0) >= 3, 'final-render QA metadata handler should build Remotion, FFmpeg, and libass command plans')
assert.ok(
  finalRenderQaMetadataResult?.commandPlans?.every((plan) => plan.executes === false),
  'final-render QA metadata command plans must be non-executing',
)
assert.equal(finalRenderQaMetadataResult?.previewArtifact, undefined, 'final-render QA metadata handler must not create preview video artifacts')
assert.equal(finalRenderQaMetadataResult?.finalExportArtifact, undefined, 'final-render QA metadata handler must not create final export artifacts')
assert.equal(finalRenderQaMetadataResult?.finalDeliveryAllowed, false, 'final-render QA metadata handler must not allow final delivery')
assert.equal(finalRenderQaMetadataResult?.blocksFinalExport, true, 'final-render QA metadata handler must keep final export blocked')
assert.ok(
  finalRenderQaMetadataResult?.qaResults?.some((gate) => gate.gateType === 'final_delivery' && gate.status !== 'passed' && gate.blocking === true),
  'final-render QA metadata handler should preserve a blocking final_delivery gate',
)
assert.ok(finalRenderQaManifestArtifacts.length >= 1, 'worker runtime artifact manifest should include private final-render QA manifest metadata')
assert.ok(
  finalRenderQaManifestArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.previewAllowed === false &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'final-render QA metadata artifacts must stay private, source-of-truth, non-preview, project-scoped, and unsigned',
)
assert.deepEqual(
  finalRenderQaMetadataResult?.skippedReasons?.map((reason) => reason.tool).sort(),
  ['ffmpeg', 'libass', 'remotion'],
  'final-render QA metadata handler should record command-plan skips instead of executing render tools',
)
assert.deepEqual(
  productionReadyFinalRenderQaMetadataDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
  ['ffmpeg', 'libass', 'remotion'],
  'final-render QA metadata dispatch should scope billing audit events to Remotion, FFmpeg, and libass',
)
assert.equal(productionReadyFinalRenderQaMetadataDispatch.walletSettlements?.length, 3, 'final-render QA metadata dispatch should create wallet settlements for render QA metadata cost events')

const productionReadyCaptionMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyCaptionMetadataInput({
  jobId: 'job-production-ready-caption-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const captionMetadataResult = productionReadyCaptionMetadataDispatch.workerResult?.output?.captionExecutionResult as {
  status?: string
  captionSegments?: unknown[]
  captionFiles?: Array<{ format?: string; localFilePath?: string }>
  artifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
    previewAllowed?: boolean
  }>
  qaResults?: Array<{ gateType?: string }>
  skippedReasons?: unknown[]
} | undefined
const captionMetadataArtifacts = productionReadyCaptionMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'caption_segments_json' || artifact.artifactType === 'qa_report') ?? []
const captionMetadataQaGateTypes = new Set(captionMetadataResult?.qaResults?.map((gate) => gate.gateType) ?? [])
assert.equal(productionReadyCaptionMetadataDispatch.gateway.status, 'dispatched', 'complete evidence plus caption metadata adapter should allow backend gateway dispatch')
assert.equal(productionReadyCaptionMetadataDispatch.workerResult?.status, 'completed', 'caption metadata real handler should complete')
assert.equal(productionReadyCaptionMetadataDispatch.workerResult?.output?.mockOnly, false, 'caption metadata production handler should be non-mock')
assert.equal(productionReadyCaptionMetadataDispatch.workerResult?.output?.realToolExecution, true, 'caption metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyCaptionMetadataDispatch.workerResult?.output?.futureHandler,
  'render_worker_caption_metadata_production_handler',
  'caption metadata production handler should use the reviewed caption metadata handler',
)
assert.equal(captionMetadataResult?.status, 'completed', 'caption metadata production handler should complete metadata-only caption generation')
assert.ok((captionMetadataResult?.captionSegments?.length ?? 0) > 0, 'caption metadata handler should build caption segments from supplied approved transcript timing')
assert.deepEqual(
  captionMetadataResult?.captionFiles?.map((file) => file.format).sort(),
  ['ass', 'srt', 'webvtt'],
  'caption metadata handler should build the reviewed SRT, WebVTT, and ASS caption file metadata set',
)
assert.ok(
  captionMetadataResult?.captionFiles?.every((file) => file.localFilePath === undefined),
  'caption metadata handler must not write local caption files in production_ready mode',
)
assert.ok((captionMetadataResult?.qaResults?.length ?? 0) >= 4, 'caption metadata handler should emit caption QA gate results')
assert.ok(
  captionMetadataQaGateTypes.has('caption_readability') &&
    captionMetadataQaGateTypes.has('caption_timing') &&
    captionMetadataQaGateTypes.has('caption_safe_zone') &&
    captionMetadataQaGateTypes.has('transcript_alignment'),
  'caption metadata handler should preserve readability, timing, safe-zone, and transcript-alignment QA gates',
)
assert.equal(captionMetadataResult?.skippedReasons?.length ?? 0, 0, 'caption metadata handler should not skip into preview/render paths')
assert.ok(captionMetadataArtifacts.length >= 4, 'worker runtime artifact manifest should include private caption files, segments, and QA artifacts')
assert.ok(
  captionMetadataArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.previewAllowed === false &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'caption metadata artifacts must stay private, source-of-truth, non-preview, project-scoped, and unsigned',
)
assert.ok(
  (productionReadyCaptionMetadataDispatch.workerResult?.qualityGateResults.length ?? 0) >= 4,
  'caption metadata worker result should preserve QA gate results',
)
assert.equal(productionReadyCaptionMetadataDispatch.toolCostEvents?.length, 1, 'caption metadata dispatch should emit one gateway cost event for libass metadata work')
assert.equal(productionReadyCaptionMetadataDispatch.toolCostEvents?.[0]?.toolId, 'libass', 'caption metadata dispatch should scope billing audit to libass')
assert.equal(productionReadyCaptionMetadataDispatch.toolCostEvents?.[0]?.billableToUser, true, 'caption metadata event should be billable only after approval/reservation/readiness gates')
assert.equal(productionReadyCaptionMetadataDispatch.toolCostEvents?.[0]?.metadata.serviceFeeIncluded, false, 'caption metadata cost event must exclude service fees')
assert.equal(productionReadyCaptionMetadataDispatch.walletSettlements?.length, 1, 'caption metadata dispatch should create one wallet settlement audit row')
assert.equal(productionReadyCaptionMetadataDispatch.walletSettlements?.[0]?.creditsDelta, -productionReadyCaptionMetadataDispatch.toolCostEvents![0].toolCostCredits, 'caption metadata wallet settlement should spend the emitted tool-cost credits')

const productionReadyCaptionQaMetadataDispatch = await service.dispatchApprovedToolCall(productionReadyCaptionQaMetadataInput({
  jobId: 'job-production-ready-caption-qa-metadata',
  productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
}))
const captionQaMetadataResult = productionReadyCaptionQaMetadataDispatch.workerResult?.output?.captionExecutionResult as {
  status?: string
  captionSegments?: unknown[]
  captionFiles?: Array<{ format?: string; localFilePath?: string }>
  artifacts?: Array<{
    artifactType?: string
    storageObjectPath?: string
    isPrivate?: boolean
    sourceOfTruth?: boolean
    previewAllowed?: boolean
  }>
  qaResults?: Array<{ gateType?: string }>
  skippedReasons?: unknown[]
} | undefined
const captionQaGateTypes = new Set(captionQaMetadataResult?.qaResults?.map((gate) => gate.gateType) ?? [])
const captionQaArtifacts = productionReadyCaptionQaMetadataDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
  .filter((artifact) => artifact.artifactType === 'caption_segments_json' || artifact.artifactType === 'qa_report') ?? []
assert.equal(
  productionReadyCaptionQaMetadataDispatch.gateway.status,
  'dispatched',
  `complete evidence plus caption QA metadata adapter should allow backend gateway dispatch: ${JSON.stringify(productionReadyCaptionQaMetadataDispatch.gateway.blockers)}`,
)
assert.equal(productionReadyCaptionQaMetadataDispatch.workerResult?.status, 'completed', 'caption QA metadata real handler should complete')
assert.equal(productionReadyCaptionQaMetadataDispatch.workerResult?.output?.mockOnly, false, 'caption QA metadata production handler should be non-mock')
assert.equal(productionReadyCaptionQaMetadataDispatch.workerResult?.output?.realToolExecution, true, 'caption QA metadata production handler should record real backend handler execution')
assert.equal(
  productionReadyCaptionQaMetadataDispatch.workerResult?.output?.futureHandler,
  'qa_worker_caption_metadata_production_handler',
  'caption QA metadata production handler should use the reviewed QA metadata handler',
)
assert.equal(captionQaMetadataResult?.status, 'completed', 'caption QA metadata production handler should complete metadata-only caption QA')
assert.ok((captionQaMetadataResult?.captionSegments?.length ?? 0) > 0, 'caption QA metadata handler should build caption segments from supplied approved transcript timing')
assert.ok(
  captionQaGateTypes.has('caption_readability') &&
    captionQaGateTypes.has('caption_timing') &&
    captionQaGateTypes.has('caption_safe_zone') &&
    captionQaGateTypes.has('transcript_alignment'),
  'caption QA metadata handler should preserve readability, timing, safe-zone, and transcript-alignment QA gates',
)
assert.ok(
  captionQaMetadataResult?.captionFiles?.every((file) => file.localFilePath === undefined),
  'caption QA metadata handler must not write local caption files in production_ready mode',
)
assert.equal(captionQaMetadataResult?.skippedReasons?.length ?? 0, 0, 'caption QA metadata handler should not skip into preview/render paths')
assert.ok(captionQaArtifacts.length >= 4, 'worker runtime artifact manifest should include private caption QA metadata artifacts')
assert.ok(
  captionQaArtifacts.every((artifact) => (
    artifact.isPrivate === true &&
    artifact.sourceOfTruth === true &&
    artifact.previewAllowed === false &&
    artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
    !artifact.storageObjectPath.includes('signed')
  )),
  'caption QA metadata artifacts must stay private, source-of-truth, non-preview, project-scoped, and unsigned',
)
assert.equal(productionReadyCaptionQaMetadataDispatch.toolCostEvents?.length, 1, 'caption QA metadata dispatch should emit one gateway cost event for libass metadata work')
assert.equal(productionReadyCaptionQaMetadataDispatch.toolCostEvents?.[0]?.toolId, 'libass', 'caption QA metadata dispatch should scope billing audit to libass')
assert.equal(productionReadyCaptionQaMetadataDispatch.toolCostEvents?.[0]?.billableToUser, true, 'caption QA metadata event should be billable only after approval/reservation/readiness gates')
assert.equal(productionReadyCaptionQaMetadataDispatch.walletSettlements?.length, 1, 'caption QA metadata dispatch should create one wallet settlement audit row')

const mediaProbeFixture = await createMediaFoundationFixture({ timeoutMs: 20_000 })
let productionReadyRealDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
let productionReadyAudioExtractDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
let productionReadyProxyDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
let productionReadyKeyframesDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
let productionReadyRepresentativeFramesDispatch: Awaited<ReturnType<typeof service.dispatchApprovedToolCall>> | undefined
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

    productionReadyAudioExtractDispatch = await service.dispatchApprovedToolCall(productionReadyAudioExtractInput({
      jobId: 'job-production-ready-real-audio-extract',
      productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
      sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
      outputRoot: path.join(mediaProbeFixture.fixture.tempDir, 'audio-extract-output'),
    }))
    const audioExtractResult = productionReadyAudioExtractDispatch.workerResult?.output?.mediaFoundationResult as {
      audio?: { status?: string }
      artifactRecords?: Array<{
        artifactType?: string
        storageObjectPath?: string
        isPrivate?: boolean
        sourceOfTruth?: boolean
        contentType?: string
      }>
    } | undefined
    const audioManifestArtifacts = productionReadyAudioExtractDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
      .filter((artifact) => artifact.artifactType === 'extracted_audio') ?? []
    assert.equal(productionReadyAudioExtractDispatch.gateway.status, 'dispatched', 'complete evidence plus real audio-extract adapter should allow backend gateway dispatch')
    assert.equal(productionReadyAudioExtractDispatch.workerResult?.status, 'completed', 'audio-extract real handler should complete')
    assert.equal(productionReadyAudioExtractDispatch.workerResult?.output?.mockOnly, false, 'audio-extract production handler should be non-mock')
    assert.equal(productionReadyAudioExtractDispatch.workerResult?.output?.realToolExecution, true, 'audio-extract production handler should record real tool execution')
    assert.equal(
      productionReadyAudioExtractDispatch.workerResult?.output?.futureHandler,
      'cpu_analysis_worker_media_audio_extract_production_handler',
      'audio-extract production handler should use the reviewed FFmpeg audio extract handler',
    )
    assert.equal(audioExtractResult?.audio?.status, 'created', 'audio-extract production handler should create an extracted audio artifact')
    assert.ok(audioExtractResult?.artifactRecords?.some((artifact) => artifact.artifactType === 'extracted_audio'), 'audio-extract result should include an extracted audio artifact record')
    assert.ok(audioManifestArtifacts.length > 0, 'worker runtime artifact manifest should include the private extracted audio artifact')
    assert.ok(
      audioManifestArtifacts.every((artifact) => (
        artifact.isPrivate === true &&
        artifact.sourceOfTruth === true &&
        artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
        !artifact.storageObjectPath.includes('signed')
      )),
      'extracted audio artifacts must stay private, source-of-truth, project-scoped, and unsigned',
    )
    assert.equal(productionReadyAudioExtractDispatch.toolCostEvents?.length, 2, 'audio-extract dispatch should emit gateway cost events for ffmpeg and ffprobe')
    assert.deepEqual(
      productionReadyAudioExtractDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
      ['ffmpeg', 'ffprobe'],
      'audio-extract dispatch should scope billing audit events to ffmpeg and ffprobe',
    )
    assert.ok(
      productionReadyAudioExtractDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
      'audio-extract tool cost events should be billable tool-cost-only events after approval/reservation gates',
    )
    assert.equal(productionReadyAudioExtractDispatch.walletSettlements?.length, 2, 'audio-extract dispatch should create wallet settlements for both tool-cost events')
    assert.ok(
      productionReadyAudioExtractDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
      'audio-extract wallet settlements should spend user credits only for the completed real handler',
    )

    productionReadyProxyDispatch = await service.dispatchApprovedToolCall(productionReadyProxyInput({
      jobId: 'job-production-ready-real-proxy',
      productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
      sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
      outputRoot: path.join(mediaProbeFixture.fixture.tempDir, 'proxy-output'),
    }))
    const proxyResult = productionReadyProxyDispatch.workerResult?.output?.mediaFoundationResult as {
      proxy?: { status?: string }
      artifactRecords?: Array<{
        artifactType?: string
        storageObjectPath?: string
        isPrivate?: boolean
        sourceOfTruth?: boolean
        previewAllowed?: boolean
      }>
    } | undefined
    const proxyManifestArtifacts = productionReadyProxyDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
      .filter((artifact) => artifact.artifactType === 'proxy_video') ?? []
    assert.equal(productionReadyProxyDispatch.gateway.status, 'dispatched', 'complete evidence plus real proxy adapter should allow backend gateway dispatch')
    assert.equal(productionReadyProxyDispatch.workerResult?.status, 'completed', 'proxy real handler should complete')
    assert.equal(productionReadyProxyDispatch.workerResult?.output?.mockOnly, false, 'proxy production handler should be non-mock')
    assert.equal(productionReadyProxyDispatch.workerResult?.output?.realToolExecution, true, 'proxy production handler should record real tool execution')
    assert.equal(
      productionReadyProxyDispatch.workerResult?.output?.futureHandler,
      'cpu_analysis_worker_media_proxy_production_handler',
      'proxy production handler should use the reviewed FFmpeg proxy handler',
    )
    assert.equal(proxyResult?.proxy?.status, 'created', 'proxy production handler should create a private proxy artifact')
    assert.ok(proxyResult?.artifactRecords?.some((artifact) => artifact.artifactType === 'proxy_video'), 'proxy result should include a proxy artifact record')
    assert.ok(proxyManifestArtifacts.length > 0, 'worker runtime artifact manifest should include the private proxy artifact')
    assert.ok(
      proxyManifestArtifacts.every((artifact) => (
        artifact.isPrivate === true &&
        artifact.sourceOfTruth === true &&
        artifact.previewAllowed === true &&
        artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
        !artifact.storageObjectPath.includes('signed')
      )),
      'proxy artifacts must stay private, source-of-truth, preview-eligible, project-scoped, and unsigned',
    )
    assert.equal(productionReadyProxyDispatch.toolCostEvents?.length, 2, 'proxy dispatch should emit gateway cost events for ffmpeg and ffprobe')
    assert.deepEqual(
      productionReadyProxyDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
      ['ffmpeg', 'ffprobe'],
      'proxy dispatch should scope billing audit events to ffmpeg and ffprobe',
    )
    assert.ok(
      productionReadyProxyDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
      'proxy tool cost events should be billable tool-cost-only events after approval/reservation gates',
    )
    assert.equal(productionReadyProxyDispatch.walletSettlements?.length, 2, 'proxy dispatch should create wallet settlements for both tool-cost events')
    assert.ok(
      productionReadyProxyDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
      'proxy wallet settlements should spend user credits only for the completed real handler',
    )

    productionReadyKeyframesDispatch = await service.dispatchApprovedToolCall(productionReadyKeyframesInput({
      jobId: 'job-production-ready-real-keyframes',
      productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
      sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
      outputRoot: path.join(mediaProbeFixture.fixture.tempDir, 'keyframes-output'),
    }))
    const keyframesResult = productionReadyKeyframesDispatch.workerResult?.output?.mediaFoundationResult as {
      keyframes?: { status?: string; artifacts?: unknown[] }
      artifactRecords?: Array<{
        artifactType?: string
        storageObjectPath?: string
        isPrivate?: boolean
        sourceOfTruth?: boolean
      }>
    } | undefined
    const keyframeManifestArtifacts = productionReadyKeyframesDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
      .filter((artifact) => artifact.artifactType === 'keyframe_image') ?? []
    assert.equal(productionReadyKeyframesDispatch.gateway.status, 'dispatched', 'complete evidence plus real keyframe adapter should allow backend gateway dispatch')
    assert.equal(productionReadyKeyframesDispatch.workerResult?.status, 'completed', 'keyframe real handler should complete')
    assert.equal(productionReadyKeyframesDispatch.workerResult?.output?.mockOnly, false, 'keyframe production handler should be non-mock')
    assert.equal(productionReadyKeyframesDispatch.workerResult?.output?.realToolExecution, true, 'keyframe production handler should record real tool execution')
    assert.equal(
      productionReadyKeyframesDispatch.workerResult?.output?.futureHandler,
      'cpu_analysis_worker_media_keyframes_production_handler',
      'keyframe production handler should use the reviewed FFmpeg keyframe handler',
    )
    assert.equal(keyframesResult?.keyframes?.status, 'created', 'keyframe production handler should create private keyframe artifacts')
    assert.ok((keyframesResult?.keyframes?.artifacts?.length ?? 0) > 0, 'keyframe result should include at least one keyframe artifact summary')
    assert.ok(keyframesResult?.artifactRecords?.some((artifact) => artifact.artifactType === 'keyframe_image'), 'keyframe result should include keyframe artifact records')
    assert.ok(keyframeManifestArtifacts.length > 0, 'worker runtime artifact manifest should include private keyframe artifacts')
    assert.ok(
      keyframeManifestArtifacts.every((artifact) => (
        artifact.isPrivate === true &&
        artifact.sourceOfTruth === true &&
        artifact.previewAllowed === false &&
        artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
        !artifact.storageObjectPath.includes('signed')
      )),
      'keyframe artifacts must stay private, source-of-truth, non-preview, project-scoped, and unsigned',
    )
    assert.equal(productionReadyKeyframesDispatch.toolCostEvents?.length, 2, 'keyframe dispatch should emit gateway cost events for ffmpeg and ffprobe')
    assert.deepEqual(
      productionReadyKeyframesDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
      ['ffmpeg', 'ffprobe'],
      'keyframe dispatch should scope billing audit events to ffmpeg and ffprobe',
    )
    assert.ok(
      productionReadyKeyframesDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
      'keyframe tool cost events should be billable tool-cost-only events after approval/reservation gates',
    )
    assert.equal(productionReadyKeyframesDispatch.walletSettlements?.length, 2, 'keyframe dispatch should create wallet settlements for both tool-cost events')
    assert.ok(
      productionReadyKeyframesDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
      'keyframe wallet settlements should spend user credits only for the completed real handler',
    )

    productionReadyRepresentativeFramesDispatch = await service.dispatchApprovedToolCall(productionReadyRepresentativeFramesInput({
      jobId: 'job-production-ready-real-representative-frames',
      productionReadinessEvidence: productionEvidenceFixture(baseInput.workspaceId, baseInput.projectId),
      sourceLocalPath: mediaProbeFixture.fixture.sourceVideoPath,
      outputRoot: path.join(mediaProbeFixture.fixture.tempDir, 'representative-frames-output'),
    }))
    const representativeFramesResult = productionReadyRepresentativeFramesDispatch.workerResult?.output?.mediaFoundationResult as {
      representativeFrames?: { status?: string; artifacts?: unknown[] }
      artifactRecords?: Array<{
        artifactType?: string
        storageObjectPath?: string
        isPrivate?: boolean
        sourceOfTruth?: boolean
        previewAllowed?: boolean
      }>
    } | undefined
    const representativeManifestArtifacts = productionReadyRepresentativeFramesDispatch.workerRuntimeArtifactPipeline?.mergedOutputManifest.artifactRecords
      .filter((artifact) => artifact.artifactType === 'representative_frame') ?? []
    assert.equal(productionReadyRepresentativeFramesDispatch.gateway.status, 'dispatched', 'complete evidence plus real representative-frame adapter should allow backend gateway dispatch')
    assert.equal(productionReadyRepresentativeFramesDispatch.workerResult?.status, 'completed', 'representative-frame real handler should complete')
    assert.equal(productionReadyRepresentativeFramesDispatch.workerResult?.output?.mockOnly, false, 'representative-frame production handler should be non-mock')
    assert.equal(productionReadyRepresentativeFramesDispatch.workerResult?.output?.realToolExecution, true, 'representative-frame production handler should record real tool execution')
    assert.equal(
      productionReadyRepresentativeFramesDispatch.workerResult?.output?.futureHandler,
      'cpu_analysis_worker_media_representative_frames_production_handler',
      'representative-frame production handler should use the reviewed FFmpeg representative-frame handler',
    )
    assert.equal(representativeFramesResult?.representativeFrames?.status, 'created', 'representative-frame production handler should create private representative-frame artifacts')
    assert.ok((representativeFramesResult?.representativeFrames?.artifacts?.length ?? 0) > 0, 'representative-frame result should include at least one frame artifact summary')
    assert.ok(representativeFramesResult?.artifactRecords?.some((artifact) => artifact.artifactType === 'representative_frame'), 'representative-frame result should include frame artifact records')
    assert.ok(representativeManifestArtifacts.length > 0, 'worker runtime artifact manifest should include private representative-frame artifacts')
    assert.ok(
      representativeManifestArtifacts.every((artifact) => (
        artifact.isPrivate === true &&
        artifact.sourceOfTruth === true &&
        artifact.previewAllowed === true &&
        artifact.storageObjectPath.startsWith(`workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/`) &&
        !artifact.storageObjectPath.includes('signed')
      )),
      'representative-frame artifacts must stay private, source-of-truth, preview-eligible, project-scoped, and unsigned',
    )
    assert.equal(productionReadyRepresentativeFramesDispatch.toolCostEvents?.length, 2, 'representative-frame dispatch should emit gateway cost events for ffmpeg and ffprobe')
    assert.deepEqual(
      productionReadyRepresentativeFramesDispatch.toolCostEvents?.map((event) => event.toolId).sort(),
      ['ffmpeg', 'ffprobe'],
      'representative-frame dispatch should scope billing audit events to ffmpeg and ffprobe',
    )
    assert.ok(
      productionReadyRepresentativeFramesDispatch.toolCostEvents?.every((event) => event.billableToUser === true && event.metadata.serviceFeeIncluded === false),
      'representative-frame tool cost events should be billable tool-cost-only events after approval/reservation gates',
    )
    assert.equal(productionReadyRepresentativeFramesDispatch.walletSettlements?.length, 2, 'representative-frame dispatch should create wallet settlements for both tool-cost events')
    assert.ok(
      productionReadyRepresentativeFramesDispatch.walletSettlements?.every((settlement) => settlement.billableToUser === true && settlement.creditsDelta < 0),
      'representative-frame wallet settlements should spend user credits only for the completed real handler',
    )

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
assert.equal(
  productionReadyStoredPacketDispatch.gateway.productionOpsControls?.allowed,
  true,
  'stored production readiness packet dispatch should expose successful production ops-control admission',
)
assert.equal(
  productionReadyStoredPacketDispatch.gateway.productionOpsControls?.snapshot.persistentBackendChecked,
  false,
  'mock/local production ops-control admission should identify in-memory counter mode',
)

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
assert.equal(
  productionReadyKillSwitchBlocked.gateway.productionOpsControls?.allowed,
  false,
  'active production kill switch should expose blocked production ops-control admission',
)
assert.equal(
  productionReadyKillSwitchBlocked.gateway.productionOpsControls?.snapshot.activeKillSwitches.globalGeneration,
  true,
  'active production kill switch should expose the exact kill-switch snapshot',
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
assert.equal(
  productionReadyRateLimitBlocked.gateway.productionOpsControls?.allowed,
  false,
  'workspace production rate limit should expose blocked production ops-control admission',
)
assert.equal(
  productionReadyRateLimitBlocked.gateway.productionOpsControls?.snapshot.workspaceJobCreationCountLastHour,
  rateLimitPolicy.perWorkspaceJobCreationPerHour,
  'workspace production rate limit should expose the counter used by the admission decision',
)
assert.equal(
  productionReadyRateLimitBlocked.gateway.productionOpsControls?.snapshot.workspaceJobCreationLimitPerHour,
  rateLimitPolicy.perWorkspaceJobCreationPerHour,
  'workspace production rate limit should expose the configured admission limit',
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
assert.equal(
  productionReadyConcurrencyBlocked.gateway.productionOpsControls?.allowed,
  false,
  'production concurrency limits should expose blocked production ops-control admission',
)
assert.equal(
  productionReadyConcurrencyBlocked.gateway.productionOpsControls?.snapshot.projectActiveJobCount,
  rateLimitPolicy.perProjectConcurrentJobs,
  'production project concurrency should expose the project active job count',
)
assert.equal(
  productionReadyConcurrencyBlocked.gateway.productionOpsControls?.snapshot.workerActiveJobCount,
  workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[baseInput.workerType],
  'production worker concurrency should expose the worker active job count',
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
    persistentInlineEvidenceBlocked.gateway.blockers[0]?.gateName,
  ],
  storedProductionReadinessEvidencePacketId: storedProductionEvidencePacket.id,
  productionReadyPlaceholderBlocked: productionReadyPlaceholderBlocked.gateway.status,
  toolReadinessHandler: productionReadyToolReadinessDispatch.workerResult?.output?.futureHandler,
  toolReadinessBillable: productionReadyToolReadinessDispatch.toolCostEvents?.map((event) => event.billableToUser),
  realSmartCutTimelineDispatchCovered: productionReadySmartCutTimelineDispatch.gateway.status === 'dispatched',
  realSmartCutTimelineHandler: productionReadySmartCutTimelineDispatch.workerResult?.output?.futureHandler,
  realAudioMetadataDispatchCovered: productionReadyAudioMetadataDispatch.gateway.status === 'dispatched',
  realAudioMetadataHandler: productionReadyAudioMetadataDispatch.workerResult?.output?.futureHandler,
  realColorMetadataDispatchCovered: productionReadyColorMetadataDispatch.gateway.status === 'dispatched',
  realColorMetadataHandler: productionReadyColorMetadataDispatch.workerResult?.output?.futureHandler,
  realCaptionMetadataDispatchCovered: productionReadyCaptionMetadataDispatch.gateway.status === 'dispatched',
  realCaptionMetadataHandler: productionReadyCaptionMetadataDispatch.workerResult?.output?.futureHandler,
  realCaptionQaMetadataDispatchCovered: productionReadyCaptionQaMetadataDispatch.gateway.status === 'dispatched',
  realCaptionQaMetadataHandler: productionReadyCaptionQaMetadataDispatch.workerResult?.output?.futureHandler,
  realFinalRenderMetadataDispatchCovered: productionReadyFinalRenderMetadataDispatch.gateway.status === 'dispatched',
  realFinalRenderMetadataHandler: productionReadyFinalRenderMetadataDispatch.workerResult?.output?.futureHandler,
  realFinalRenderQaMetadataDispatchCovered: productionReadyFinalRenderQaMetadataDispatch.gateway.status === 'dispatched',
  realFinalRenderQaMetadataHandler: productionReadyFinalRenderQaMetadataDispatch.workerResult?.output?.futureHandler,
  realMediaProbeDispatchCovered: Boolean(productionReadyRealDispatch),
  realMediaProbeHandler: productionReadyRealDispatch?.workerResult?.output?.futureHandler,
  realMediaAudioExtractDispatchCovered: Boolean(productionReadyAudioExtractDispatch),
  realMediaAudioExtractHandler: productionReadyAudioExtractDispatch?.workerResult?.output?.futureHandler,
  realMediaProxyDispatchCovered: Boolean(productionReadyProxyDispatch),
  realMediaProxyHandler: productionReadyProxyDispatch?.workerResult?.output?.futureHandler,
  realMediaKeyframesDispatchCovered: Boolean(productionReadyKeyframesDispatch),
  realMediaKeyframesHandler: productionReadyKeyframesDispatch?.workerResult?.output?.futureHandler,
  realMediaRepresentativeFramesDispatchCovered: Boolean(productionReadyRepresentativeFramesDispatch),
  realMediaRepresentativeFramesHandler: productionReadyRepresentativeFramesDispatch?.workerResult?.output?.futureHandler,
  realTrackANativeValidationDispatchCount: productionReadyTrackANativeDispatches.length,
  realTrackANativeValidationHandlers: productionReadyTrackANativeDispatches.map((dispatch) => dispatch.workerResult?.output?.futureHandler),
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

interface GatewayPersistentReadinessAdminClientOptions {
  productionReadinessRows?: ReturnType<typeof productionReadinessPacketRow>[]
  missingBillingBackend?: boolean
}

function createGatewayPersistentReadinessAdminClient(
  options: GatewayPersistentReadinessAdminClientOptions = {},
): ServiceContext['clients']['admin'] {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {}
      const builder = {
        select() {
          return builder
        },
        eq(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        gte(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        gt(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        ilike(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        in(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        async maybeSingle() {
          return { data: gatewayPersistentRow(table, filters), error: null }
        },
        async order() {
          if (table === 'production_tool_execution_readiness_evidence_packets') {
            return {
              data: (options.productionReadinessRows ?? [])
                .filter((row) => row.workspace_id === filters.workspace_id)
                .sort((a, b) => a.created_at.localeCompare(b.created_at)),
              error: null,
            }
          }
          return { data: [], error: null }
        },
        async limit() {
          if (options.missingBillingBackend && table === 'tool_cost_events') {
            return { data: null, error: { code: '42P01', message: 'relation "tool_cost_events" does not exist' } }
          }
          if (options.missingBillingBackend && table === 'tool_cost_wallet_settlements') {
            return { data: null, error: { code: '42P01', message: 'relation "tool_cost_wallet_settlements" does not exist' } }
          }
          return { data: [], error: null }
        },
      }
      return builder
    },
    async rpc(functionName: string) {
      assert.equal(functionName, 'settle_tool_cost_event', 'gateway billing preflight should probe the settlement RPC by name')
      if (options.missingBillingBackend) {
        return { data: null, error: { code: '42883', message: 'function settle_tool_cost_event does not exist' } }
      }
      return { data: null, error: { code: 'P0001', message: 'tool cost event not found: billing preflight sentinel' } }
    },
  } as never
}

function productionReadinessPacketRow(
  packetId: string,
  readinessInput: ProductionToolExecutionReadinessGateInput,
) {
  return {
    id: packetId,
    workspace_id: readinessInput.workspaceId,
    project_id: readinessInput.projectId,
    idempotency_key: `${packetId}:idempotency`,
    source_id: readinessInput.sourceId,
    source_sha: readinessInput.sourceSha ?? null,
    created_at: '2026-07-03T00:00:00.000Z',
    created_by_user_id: 'user-smoke',
    readiness_input: readinessInput,
    readiness_report: evaluateProductionToolExecutionReadinessGate(readinessInput),
  }
}

function gatewayPersistentRow(table: string, filters: Record<string, unknown>) {
  if (table === 'projects' && filters.id === baseInput.projectId && filters.workspace_id === baseInput.workspaceId) {
    return {
      id: baseInput.projectId,
      workspace_id: baseInput.workspaceId,
    }
  }

  if (table === 'workspace_members' && filters.workspace_id === baseInput.workspaceId && filters.user_id === 'user-smoke') {
    return { user_id: 'user-smoke' }
  }

  if (table === 'approved_plan_snapshots' && filters.id === baseInput.approvedPlanSnapshotId) {
    return {
      id: baseInput.approvedPlanSnapshotId,
      workspace_id: baseInput.workspaceId,
      project_id: baseInput.projectId,
      edit_plan_id: baseInput.editPlanId,
      credit_estimate_id: baseInput.creditEstimateId,
      credit_reservation_id: baseInput.creditReservationId,
      snapshot_status: 'approved',
    }
  }

  if (table === 'credit_reservations' && filters.id === baseInput.creditReservationId) {
    return {
      id: baseInput.creditReservationId,
      workspace_id: baseInput.workspaceId,
      project_id: baseInput.projectId,
      edit_plan_id: baseInput.editPlanId,
      credit_estimate_id: baseInput.creditEstimateId,
      status: 'reserved',
    }
  }

  return null
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

function productionReadySmartCutTimelineInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_smart_cut_timeline',
    requestedToolIds: ['opentimelineio'],
    requestedRecipeIds: ['smart-cut-timeline-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    requiredQualityGateTypes: ['cut_smoothness', 'transcript_alignment', 'render_timeline_integrity', 'export_duration_sync'],
    metadata: {
      gatewaySmoke: true,
      smartCutTimelineExecution: {
        mode: 'production_ready',
        tasks: ['build_execution_plan', 'build_timeline_manifest', 'build_otio_manifest', 'build_qa_report'],
        smartCutPlan: buildGatewaySmokeSmartCutPlan(),
        sourceVideoArtifactId: baseInput.artifactReferences[0]!.id,
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        mediaDurationSeconds: 7,
        fps: 30,
        allowFinalExport: false,
        enableProxyPreview: false,
        readinessReport: {
          overallStatus: 'passed',
          blockerSummaries: [],
          blockers: [],
          warnings: [],
        },
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyAudioMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_audio_metadata',
    requestedToolIds: ['audioflux'],
    requestedRecipeIds: ['audio-metadata-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    requiredQualityGateTypes: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
    metadata: {
      gatewaySmoke: true,
      audioExecution: {
        mode: 'production_ready',
        tasks: ['build_audio_analysis', 'build_loudness_plan', 'build_soundsync_cues', 'build_audio_qa_report'],
        sourceAudioArtifactId: baseInput.artifactReferences[0]!.id,
        sourceAudioStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        audioAnalysis: {
          durationSeconds: 7,
          peakDb: -3,
          integratedLufs: -16,
          truePeakDb: -1.2,
          clippingDetected: false,
          silenceSegments: [],
          noiseLevel: 0.04,
          speechPresence: 'present',
          musicDetected: false,
          musicSpeechOverlap: false,
          advancedAnalysisRan: true,
          issues: [],
        },
        audioCleanupPlan: {
          id: 'audio-metadata-cleanup-none-smoke',
          cleanupStrength: 'none',
          selectedPrimaryTool: 'none',
          fallbackTools: [],
          operations: [],
          reasons: ['Metadata-only production handler does not request cleanup.'],
          risks: [],
          expectedArtifacts: ['audio_analysis_json', 'qa_report'],
          requiredQAGates: ['audio_loudness', 'audio_sync', 'audio_naturalness', 'music_over_voice'],
        },
        loudnessPlan: {
          targetLufs: -16,
          truePeakDb: -1,
          shouldNormalize: false,
          reason: 'Audio metadata fixture already matches target loudness.',
          warnings: [],
        },
        musicDuckingPlan: {
          enabled: false,
          duckingDb: 0,
          attackMs: 120,
          releaseMs: 350,
          reason: 'No music/speech overlap in metadata-only fixture.',
          voiceFirst: true,
          warnings: [],
        },
        soundSyncCuePlan: {
          cues: [{
            cueId: 'audio-metadata-cue-smoke',
            cueType: 'caption_emphasis',
            timeSeconds: 0.5,
            durationSeconds: 1.1,
            reason: 'Approved metadata-only SoundSync cue.',
            confidence: 0.8,
            source: 'manual_metadata',
          }],
          beatDetectionRan: false,
          warnings: [],
        },
        readinessReport: {
          overallStatus: 'passed',
          blockerSummaries: [],
          blockers: [],
          warnings: [],
        },
        enableFfmpegAudioExecution: false,
        enableModelAudioExecution: false,
        allowModelDownload: false,
        allowFinalMux: false,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyColorMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_color_metadata',
    requestedToolIds: ['opencolorio', 'openimageio'],
    requestedRecipeIds: ['color-metadata-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    requiredQualityGateTypes: ['color_exposure', 'color_skin_tone', 'color_export_space', 'color_shot_match'],
    metadata: {
      gatewaySmoke: true,
      colorExecution: {
        mode: 'production_ready',
        tasks: ['build_color_analysis', 'build_color_grade_recipe', 'build_color_qa_report'],
        sourceVideoArtifactId: baseInput.artifactReferences[0]!.id,
        representativeFrameArtifactIds: ['representative-frame-artifact-color-smoke-a', 'representative-frame-artifact-color-smoke-b'],
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        colorGradeStyle: 'premium_clean',
        colorIntensity: 0.35,
        lutStrength: 0.25,
        mockAnalysis: {
          representativeFrameCount: 2,
          colorSpaceAssumption: 'bt709',
          transferAssumption: 'bt709',
          hdrDetected: false,
          underexposed: false,
          overexposed: false,
          whiteBalanceIssue: true,
          shotMismatch: true,
          skinToneRisk: 'low',
          highlightRisk: 'low',
          shadowRisk: 'low',
          saturationRisk: 'low',
          confidence: 0.88,
          advancedAnalysisRan: false,
        },
        readinessReport: {
          overallStatus: 'passed',
          blockerSummaries: [],
          blockers: [],
          warnings: [],
        },
        allowFinalExport: false,
        enableFfmpegColorPreview: false,
        enableOpenColorIOExecution: false,
        enableOpenImageIOExecution: false,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyFinalRenderMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    workerType: 'render_worker',
    renderMode: 'qa_probe',
    executionMode: 'production_ready',
    adapterId: 'render_worker_final_render_metadata',
    requestedToolIds: ['remotion', 'ffmpeg', 'libass'],
    requestedRecipeIds: ['final-render-metadata-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    requiredQualityGateTypes: ['render_asset_integrity', 'render_timeline_integrity', 'export_codec_format', 'export_duration_sync', 'final_delivery'],
    metadata: {
      gatewaySmoke: true,
      finalRenderExecution: {
        mode: 'production_ready',
        tasks: ['build_render_manifest', 'build_command_plans', 'build_render_qa_report', 'build_delivery_qa_report'],
        timelineManifestId: 'timeline-manifest-gateway-smoke',
        renderManifestId: 'render-manifest-gateway-smoke',
        sourceVideoArtifactIds: [baseInput.artifactReferences[0]!.id],
        proxyVideoArtifactIds: ['proxy-video-artifact-gateway-smoke'],
        captionArtifactIds: ['caption-artifact-gateway-smoke'],
        audioArtifactIds: ['audio-artifact-gateway-smoke'],
        colorArtifactIds: ['color-artifact-gateway-smoke'],
        renderEngine: 'hybrid',
        renderMode: 'command_plan_only',
        canvas: { width: 1920, height: 1080, aspectRatio: '16:9' },
        fps: 30,
        durationSeconds: 7,
        exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p' },
        enableLocalDevRender: false,
        enableRemotionLocalRender: false,
        enableCaptionBurnIn: false,
        allowRevideo: false,
        readinessReport: {
          overallStatus: 'passed',
          blockerSummaries: [],
          blockers: [],
          warnings: [],
        },
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyFinalRenderQaMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  const request = productionReadyFinalRenderMetadataInput(input)
  const metadata = { ...(request.metadata ?? {}) } as Record<string, unknown>
  metadata.finalRenderQA = metadata.finalRenderExecution
  delete metadata.finalRenderExecution
  return {
    ...request,
    workerType: 'qa_worker',
    adapterId: 'qa_worker_final_render_qa_metadata',
    requestedRecipeIds: ['final-render-qa-metadata-production-handler-recipe'],
    metadata,
  }
}

function productionReadyCaptionMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    workerType: 'render_worker',
    renderMode: 'qa_probe',
    executionMode: 'production_ready',
    adapterId: 'render_worker_caption_metadata',
    requestedToolIds: ['libass'],
    requestedRecipeIds: ['caption-metadata-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    requiredQualityGateTypes: ['caption_readability', 'caption_timing', 'caption_safe_zone', 'transcript_alignment'],
    artifactReferences: [{
      id: 'artifact-approved-word-timestamps',
      storageBucketPurpose: 'transcripts',
      storageObjectPath: `workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/media/${baseInput.mediaAssetId}/transcripts/word-timestamps.json`,
      isPrivate: true,
      sourceOfTruth: true,
    }],
    metadata: {
      gatewaySmoke: true,
      speechCaptionExecution: {
        mode: 'production_ready',
        tasks: ['build_caption_segments', 'build_caption_files', 'build_caption_qa_report'],
        buildSpeech: false,
        buildCaptions: true,
        enableRealTranscription: false,
        allowModelDownload: false,
        enableCaptionPreview: false,
        buildPreview: false,
        captionFormats: ['srt', 'webvtt', 'ass'],
        captionStyle: 'clean_subtitle',
        platform: 'internal-beta-fixture',
        aspectRatio: '16:9',
        transcriptArtifactId: 'artifact-approved-transcript',
        wordTimestampArtifactId: 'artifact-approved-word-timestamps',
        transcriptSegments: [{
          segmentId: 'caption-metadata-segment-1',
          startSeconds: 0,
          endSeconds: 2.55,
          text: 'Caption metadata is generated from approved timing.',
          confidence: 0.96,
          words: [{
            word: 'Caption',
            startSeconds: 0,
            endSeconds: 0.42,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'metadata',
            startSeconds: 0.42,
            endSeconds: 0.92,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'is',
            startSeconds: 0.92,
            endSeconds: 1.08,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'generated',
            startSeconds: 1.08,
            endSeconds: 1.65,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'from',
            startSeconds: 1.65,
            endSeconds: 1.85,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'approved',
            startSeconds: 1.85,
            endSeconds: 2.25,
            segmentId: 'caption-metadata-segment-1',
          }, {
            word: 'timing.',
            startSeconds: 2.25,
            endSeconds: 2.55,
            segmentId: 'caption-metadata-segment-1',
          }],
        }],
        wordTimestamps: [{
          word: 'Caption',
          startSeconds: 0,
          endSeconds: 0.42,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'metadata',
          startSeconds: 0.42,
          endSeconds: 0.92,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'is',
          startSeconds: 0.92,
          endSeconds: 1.08,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'generated',
          startSeconds: 1.08,
          endSeconds: 1.65,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'from',
          startSeconds: 1.65,
          endSeconds: 1.85,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'approved',
          startSeconds: 1.85,
          endSeconds: 2.25,
          segmentId: 'caption-metadata-segment-1',
        }, {
          word: 'timing.',
          startSeconds: 2.25,
          endSeconds: 2.55,
          segmentId: 'caption-metadata-segment-1',
        }],
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyCaptionQaMetadataInput(input: {
  jobId: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  const request = productionReadyCaptionMetadataInput(input)
  return {
    ...request,
    workerType: 'qa_worker',
    adapterId: 'qa_worker_caption_metadata',
    requestedRecipeIds: ['caption-qa-metadata-production-handler-recipe'],
  }
}

function productionReadyAudioExtractInput(input: {
  jobId: string
  sourceLocalPath: string
  outputRoot: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_media_audio_extract',
    requestedToolIds: ['ffmpeg', 'ffprobe'],
    requestedRecipeIds: ['media-audio-extract-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      mediaFoundation: {
        mode: 'production_ready',
        tasks: ['probe', 'extract_audio', 'build_analysis_report'],
        sourceStorageObjectId: 'source-storage-object-smoke',
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        sourceLocalPath: input.sourceLocalPath,
        outputRoot: input.outputRoot,
        contentType: 'video/mp4',
        ffprobeBin: 'ffprobe',
        ffmpegBin: 'ffmpeg',
        timeoutMs: 20_000,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function buildGatewaySmokeSmartCutPlan(): SmartCutPlan {
  return {
    id: 'smart-cut-plan-gateway-smoke',
    workspaceId: baseInput.workspaceId,
    projectId: baseInput.projectId,
    mediaAssetId: baseInput.mediaAssetId!,
    sourceDurationSeconds: 7,
    targetDurationSeconds: 6.2,
    intent: ['remove_dead_space', 'preserve_story'],
    aggressiveness: 'balanced',
    pacingProfile: {
      profileId: 'natural_clean',
      maxSilenceSeconds: 1.2,
      minSegmentDurationSeconds: 1.2,
      targetCutsPerMinuteMin: 4,
      targetCutsPerMinuteMax: 8,
      emotionalPausePolicy: 'protect',
      notes: [],
    },
    segmentCandidates: [{
      candidateId: 'candidate-hook',
      candidateType: 'transcript',
      source: 'transcript',
      startSeconds: 0,
      endSeconds: 3,
      text: 'This is the hook.',
      transcriptSegmentIds: ['seg-hook'],
      captionIds: [],
      wordCount: 4,
      evidence: {
        hasTranscript: true,
        hasWordTimestamps: false,
        hasSilence: false,
        hasSceneBoundary: false,
        hasCaption: false,
        fillerLabels: [],
        repeatedTakeCandidateIds: [],
      },
      risks: ['none'],
      protected: true,
      reason: 'Approved hook candidate.',
    }, {
      candidateId: 'candidate-payoff',
      candidateType: 'transcript',
      source: 'transcript',
      startSeconds: 3.8,
      endSeconds: 7,
      text: 'This is the payoff.',
      transcriptSegmentIds: ['seg-payoff'],
      captionIds: [],
      wordCount: 4,
      evidence: {
        hasTranscript: true,
        hasWordTimestamps: false,
        hasSilence: false,
        hasSceneBoundary: false,
        hasCaption: false,
        fillerLabels: [],
        repeatedTakeCandidateIds: [],
      },
      risks: ['none'],
      protected: false,
      reason: 'Approved payoff candidate.',
    }],
    segmentScores: [],
    keepSegments: [{
      decisionId: 'keep-hook',
      candidateId: 'candidate-hook',
      startSeconds: 0,
      endSeconds: 3,
      reason: 'Preserve hook and context.',
      score: 0.94,
      confidence: 0.94,
      protected: true,
    }, {
      decisionId: 'keep-payoff',
      candidateId: 'candidate-payoff',
      startSeconds: 3.8,
      endSeconds: 7,
      reason: 'Preserve payoff and call to action.',
      score: 0.91,
      confidence: 0.91,
      protected: false,
    }],
    removeSegments: [{
      decisionId: 'remove-pause',
      candidateId: 'candidate-pause',
      startSeconds: 3,
      endSeconds: 3.8,
      reason: 'Remove approved dead-space pause between hook and payoff.',
      score: 0.88,
      confidence: 0.87,
      risks: ['none'],
    }],
    cutBoundaries: [{
      boundaryId: 'boundary-hook-end',
      sourceTimeSeconds: 3,
      adjustedTimeSeconds: 3,
      paddingBeforeSeconds: 0,
      paddingAfterSeconds: 0,
      risks: ['none'],
      safe: true,
      reason: 'Approved clean end of hook.',
    }, {
      boundaryId: 'boundary-payoff-start',
      sourceTimeSeconds: 3.8,
      adjustedTimeSeconds: 3.8,
      paddingBeforeSeconds: 0,
      paddingAfterSeconds: 0,
      risks: ['none'],
      safe: true,
      reason: 'Approved start of payoff.',
    }],
    protectedSegments: [],
    rejectedCandidates: [],
    meaningFindings: [],
    warnings: [],
    confidence: 0.91,
    qaChecks: ['cut_smoothness', 'transcript_alignment', 'render_timeline_integrity'],
    requiredQualityGates: ['cut_smoothness', 'transcript_alignment', 'audio_sync', 'render_timeline_integrity'],
  }
}

function productionReadyProxyInput(input: {
  jobId: string
  sourceLocalPath: string
  outputRoot: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_media_proxy',
    requestedToolIds: ['ffmpeg', 'ffprobe'],
    requestedRecipeIds: ['media-proxy-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      mediaFoundation: {
        mode: 'production_ready',
        tasks: ['probe', 'create_proxy', 'build_analysis_report'],
        sourceStorageObjectId: 'source-storage-object-smoke',
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        sourceLocalPath: input.sourceLocalPath,
        outputRoot: input.outputRoot,
        contentType: 'video/mp4',
        ffprobeBin: 'ffprobe',
        ffmpegBin: 'ffmpeg',
        timeoutMs: 20_000,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyKeyframesInput(input: {
  jobId: string
  sourceLocalPath: string
  outputRoot: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_media_keyframes',
    requestedToolIds: ['ffmpeg', 'ffprobe'],
    requestedRecipeIds: ['media-keyframes-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      mediaFoundation: {
        mode: 'production_ready',
        tasks: ['probe', 'extract_keyframes', 'build_analysis_report'],
        sourceStorageObjectId: 'source-storage-object-smoke',
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        sourceLocalPath: input.sourceLocalPath,
        outputRoot: input.outputRoot,
        contentType: 'video/mp4',
        ffprobeBin: 'ffprobe',
        ffmpegBin: 'ffmpeg',
        timeoutMs: 20_000,
        maxKeyframeCount: 3,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}

function productionReadyRepresentativeFramesInput(input: {
  jobId: string
  sourceLocalPath: string
  outputRoot: string
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    executionMode: 'production_ready',
    adapterId: 'cpu_analysis_worker_media_representative_frames',
    requestedToolIds: ['ffmpeg', 'ffprobe'],
    requestedRecipeIds: ['media-representative-frames-production-handler-recipe'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      mediaFoundation: {
        mode: 'production_ready',
        tasks: ['probe', 'extract_representative_frames', 'build_analysis_report'],
        sourceStorageObjectId: 'source-storage-object-smoke',
        sourceStorageObjectPath: baseInput.artifactReferences[0]!.storageObjectPath,
        sourceLocalPath: input.sourceLocalPath,
        outputRoot: input.outputRoot,
        contentType: 'video/mp4',
        ffprobeBin: 'ffprobe',
        ffmpegBin: 'ffmpeg',
        timeoutMs: 20_000,
        maxRepresentativeFrameCount: 3,
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

function productionReadyTrackANativeValidationInput(input: {
  jobId: string
  adapterId:
    | 'tool_readiness_worker_streamer_render_pipeline_support'
    | 'tool_readiness_worker_mkvtoolnix_container_validation'
    | 'tool_readiness_worker_gpac_mp4box_packaging_validation'
  requestedToolId: 'gstreamer' | 'mkvtoolnix' | 'gpac_mp4box'
  capabilityId: 'streamer_render_pipeline_support' | 'mkvtoolnix_container_validation' | 'gpac_mp4box_packaging_validation'
  tasks: string[]
  extra: Record<string, unknown>
  productionReadinessEvidence?: ProductionToolExecutionReadinessGateInput
  productionReadinessEvidencePacketId?: string
}): ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } {
  return {
    ...baseInput,
    jobId: input.jobId,
    mediaAssetId: 'track-a-native-validation-media-not-required',
    toolExecutionPlanId: `${baseInput.toolExecutionPlanId}-${input.jobId}`,
    workerType: 'tool_readiness_worker',
    executionMode: 'production_ready',
    adapterId: input.adapterId,
    requestedToolIds: [input.requestedToolId],
    requestedRecipeIds: [`${input.capabilityId}-production-handler-recipe`],
    artifactReferences: [{
      id: `${input.capabilityId}-private-input-manifest`,
      storageBucketPurpose: 'qa_artifacts',
      storageObjectPath: `workspaces/${baseInput.workspaceId}/projects/${baseInput.projectId}/track-a-native-validation/${input.jobId}/input-manifest.json`,
      isPrivate: true,
      sourceOfTruth: true,
    }],
    requiredQualityGateTypes: input.requestedToolId === 'gstreamer'
      ? ['render_timeline_integrity']
      : ['export_codec_format'],
    productionReadinessEvidence: input.productionReadinessEvidence,
    productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
    metadata: {
      gatewaySmoke: true,
      trackANativeValidation: {
        mode: 'production_ready',
        capabilityId: input.capabilityId,
        tasks: input.tasks,
        sourceEvidenceIds: [
          'pr-652-controlled-synthetic-proof',
          'pr-673-controlled-generated-private-fixture-execution',
          'pr-682-generated-private-fixture-qa',
          'pr-738-gpac-install-source-execution',
        ],
        allowMediaProcessing: false,
        allowPublicDelivery: false,
        allowUserMedia: false,
        runToolBinary: false,
        runMediaCommand: false,
        allowFrontendExecution: false,
        allowFinalExport: false,
        useTemporaryAccessLinkSourceTruth: false,
        ...input.extra,
      },
    },
    apiIdempotencyKey: `${baseInput.apiIdempotencyKey}-${input.jobId}`,
  }
}
