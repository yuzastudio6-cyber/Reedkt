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
  realSmartCutTimelineDispatchCovered: productionReadySmartCutTimelineDispatch.gateway.status === 'dispatched',
  realSmartCutTimelineHandler: productionReadySmartCutTimelineDispatch.workerResult?.output?.futureHandler,
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
