import { buildBetaReadinessBackendOperatorStatus, buildBetaReadinessReport } from '../beta-readiness'
import { createToolExecutionGatewayService, type ToolExecutionGatewayDispatchResult } from '../services/tool-execution-gateway-service'
import type { ServiceContext } from '../types'
import {
  createToolCostMeteringService,
  resetMockToolCostStore,
  type ToolCostEvent,
  type ToolCostEstimate,
  type ToolCostSummary,
  type ToolCostUsageCategory,
} from '../tool-cost-metering'
import {
  TRACK_B_ADAPTER_TOOL_IDS,
  getTrackBAdapterContract,
  type TrackBAdapterContract,
  type TrackBAdapterToolId,
} from '../trackb-adapters'
import {
  clearMockWorkerRuntimeArtifactPipelineState,
} from '../workers/production/production-worker-artifact-pipeline'
import type { ProductionStorageBucketPurpose, ToolArtifactType } from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'

export const TRACKB_INTERNAL_BETA_E2E_DECISION =
  'trackb_milestone8_internal_beta_e2e_passed_ready_for_controlled_internal_beta' as const

export interface TrackBInternalBetaE2EOptions {
  workspaceId?: string
  projectId?: string
  editPlanId?: string
  mediaAssetId?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  approvedReservationRemainingCredits?: number
  sourceSha?: string
}

export interface TrackBInternalBetaSyntheticFixture {
  workspaceId: string
  projectId: string
  fixtureId: string
  fixtureKind: 'synthetic_private_trackb_edit'
  userMediaUsed: false
  realToolExecution: false
  storageRoot: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  sourceClips: Array<{
    id: string
    artifactType: ToolArtifactType
    storageBucketPurpose: ProductionStorageBucketPurpose
    storageObjectPath: string
    isPrivate: true
    sourceOfTruth: true
  }>
}

export interface TrackBInternalBetaToolRun {
  toolId: TrackBAdapterToolId
  jobId: string
  workerType: ProductionWorkerRuntimeType
  gatewayStatus: ToolExecutionGatewayDispatchResult['gateway']['status']
  adapterStatus: string
  workerStatus: string
  qaStatus: 'passed' | 'blocked'
  privateInputCount: number
  privateOutputCount: number
  costEstimate: {
    lowCredits: number
    expectedCredits: number
    highCredits: number
    rateCardVersion: string
    serviceFeeIncluded: false
  }
  costEvent: {
    id: string
    replayed: boolean
    billableToUser: boolean
    actualInternalCostCents: number
    toolCostCredits: number
  }
  blockers: string[]
  warnings: string[]
}

export interface TrackBInternalBetaOperatorDashboard {
  status: 'ready_for_controlled_internal_beta' | 'blocked'
  decision: typeof TRACKB_INTERNAL_BETA_E2E_DECISION | 'blocked'
  internalBetaCanRunControlledToolAssistedEdits: boolean
  externalBetaAllowed: false
  realUserMediaBetaAllowed: false
  paidProductionAllowed: false
  productReadyLocalOssCount: 0
  totalTrackBTools: number
  dispatchedToolCount: number
  qaPassedToolCount: number
  artifactCount: number
  billableCostEventCount: number
  nonBillableCostEventCount: number
  actualToolCostCredits: number
  gatewayReplayChecked: boolean
  costEventReplayChecked: boolean
  blockedScopes: string[]
  nextActions: string[]
}

export interface TrackBInternalBetaE2EResult {
  ok: boolean
  runId: string
  sourceSha: string
  fixture: TrackBInternalBetaSyntheticFixture
  toolRuns: TrackBInternalBetaToolRun[]
  outputManifest: {
    artifactCount: number
    privateArtifactCount: number
    publicArtifactCount: number
    signedUrlArtifactCount: number
  }
  qaSummary: {
    allAdapterQaPassed: boolean
    allWorkerJobsCompleted: boolean
    allArtifactsPrivate: boolean
    noRealToolExecution: boolean
    noRealUserMedia: boolean
  }
  costSummary: ToolCostSummary
  operatorDashboard: TrackBInternalBetaOperatorDashboard
  betaOperatorStatusSnapshot: {
    readyForExternalBeta: boolean
    readyForRealUserMediaBeta: boolean
    readyForPaidProduction: boolean
    safeBlockerReductionAllowed: boolean
  }
  warnings: string[]
}

interface DispatchPreparedToolInput {
  toolId: TrackBAdapterToolId
  contract: TrackBAdapterContract
  estimate: ToolCostEstimate
  dispatchInput: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string }
}

export async function runTrackBInternalBetaE2E(
  options: TrackBInternalBetaE2EOptions = {},
): Promise<TrackBInternalBetaE2EResult> {
  clearMockWorkerRuntimeArtifactPipelineState()
  resetMockToolCostStore()

  const runId = `trackb-internal-beta-e2e-${new Date().toISOString().replace(/[:.]/g, '-')}`
  const workspaceId = options.workspaceId ?? 'workspace-trackb-internal-beta'
  const projectId = options.projectId ?? 'project-trackb-synthetic-edit'
  const sourceSha = options.sourceSha ?? 'local-stack'
  const approvedPlanSnapshotId = options.approvedPlanSnapshotId ?? 'approved-snapshot-trackb-internal-beta'
  const creditEstimateId = options.creditEstimateId ?? 'credit-estimate-trackb-internal-beta'
  const creditReservationId = options.creditReservationId ?? 'credit-reservation-trackb-internal-beta'
  const editPlanId = options.editPlanId ?? 'edit-plan-trackb-internal-beta'
  const mediaAssetId = options.mediaAssetId ?? 'media-synthetic-trackb-fixture'
  const approvedReservationRemainingCredits = options.approvedReservationRemainingCredits ?? 512
  const context = buildMockServiceContext(runId)
  const gatewayService = createToolExecutionGatewayService(context)
  const costService = createToolCostMeteringService(context)
  const fixture = buildSyntheticFixture({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditEstimateId,
    creditReservationId,
  })

  const preparedTools: DispatchPreparedToolInput[] = TRACK_B_ADAPTER_TOOL_IDS.map((toolId, index) => {
    const contract = getTrackBAdapterContract(toolId)
    const estimate = costService.estimateToolCost(buildCostEstimateInput({
      contract,
      toolId,
      approvedReservationRemainingCredits,
    })).estimate

    return {
      toolId,
      contract,
      estimate,
      dispatchInput: {
        workspaceId,
        projectId,
        jobId: `${runId}-${index + 1}-${toolId}`,
        toolExecutionPlanId: `plan-${runId}-${index + 1}-${toolId}`,
        editPlanId,
        mediaAssetId,
        approvedPlanSnapshotId,
        creditEstimateId,
        creditReservationId,
        approvedReservationRemainingCredits,
        estimatedHighCredits: estimate.highCredits,
        workerType: contract.workerType,
        executionMode: 'mock_safe',
        adapterId: `${contract.workerType}_placeholder` as ToolExecutionGatewayDispatchBody['adapterId'],
        trackBAdapterToolId: toolId,
        trackBAdapterExecutionMode: 'bounded_execution',
        requestedToolIds: [toolId],
        requestedRecipeIds: [`${toolId}-synthetic-internal-beta-recipe`],
        artifactReferences: buildRequiredInputArtifacts({
          contract,
          workspaceId,
          projectId,
          runId,
          toolId,
        }),
        requiredQualityGateTypes: uniqueGateTypes(contract),
        attempt: 1,
        maxAttempts: 2,
        metadata: {
          milestone: 'trackb_internal_beta_e2e',
          fixtureKind: 'synthetic_private_trackb_edit',
          sourceSha,
        },
        apiIdempotencyKey: `api-idempotency-${runId}-${toolId}`,
      },
    }
  })

  const toolRuns: TrackBInternalBetaToolRun[] = []
  const warnings: string[] = []
  let gatewayReplayChecked = false
  let costEventReplayChecked = false

  for (const [index, prepared] of preparedTools.entries()) {
    const dispatch = await gatewayService.dispatchApprovedToolCall(prepared.dispatchInput)
    const costEventInput = buildCostEventInput({
      dispatch,
      estimate: prepared.estimate,
      prepared,
    })
    const costEventWrite = await costService.emitToolCostEvent(
      costEventInput,
      `tool-cost-idempotency-${runId}-${prepared.toolId}`,
    )

    if (index === 0) {
      const replayDispatch = await gatewayService.dispatchApprovedToolCall(prepared.dispatchInput)
      gatewayReplayChecked = replayDispatch.workerRuntimeArtifactPipeline?.replayed === true

      const replayCost = await costService.emitToolCostEvent(
        costEventInput,
        `tool-cost-idempotency-${runId}-${prepared.toolId}`,
      )
      costEventReplayChecked = replayCost.replayed === true
    }

    warnings.push(...dispatch.warnings, ...costEventWrite.warnings)
    toolRuns.push(buildToolRunSummary({
      dispatch,
      estimate: prepared.estimate,
      costEvent: costEventWrite.event,
      costEventReplayed: costEventWrite.replayed,
      prepared,
    }))
  }

  const manifest = await gatewayService.getProjectToolOutputManifest({ workspaceId, projectId })
  const costSummary = (await costService.getToolCostSummary({ workspaceId, projectId })).summary
  const outputManifest = summarizeOutputManifest(manifest.outputManifest.artifactRecords)
  const qaSummary = {
    allAdapterQaPassed: toolRuns.every((tool) => tool.qaStatus === 'passed'),
    allWorkerJobsCompleted: toolRuns.every((tool) => tool.workerStatus === 'completed'),
    allArtifactsPrivate: outputManifest.publicArtifactCount === 0 && outputManifest.signedUrlArtifactCount === 0,
    noRealToolExecution: toolRuns.every((tool) => tool.warnings.some((warning) => /no binary|no frontend tool execution|no signed URLs|mock-safe/i.test(warning))) &&
      toolRuns.every((tool) => tool.adapterStatus === 'bounded_execution_ready'),
    noRealUserMedia: fixture.userMediaUsed === false && fixture.sourceClips.every((clip) => clip.storageObjectPath.includes('/synthetic-fixtures/')),
  }
  const betaReport = buildBetaReadinessReport({
    e2eDryRunPassed: true,
    boundedToolExecutionReady: qaSummary.allAdapterQaPassed,
    productionReadinessBlocked: true,
  })
  const betaOperatorStatus = buildBetaReadinessBackendOperatorStatus(betaReport, {
    workspaceId,
    evidencePacketCount: toolRuns.length,
  })
  const operatorDashboard = buildOperatorDashboard({
    toolRuns,
    outputManifest,
    costSummary,
    qaSummary,
    gatewayReplayChecked,
    costEventReplayChecked,
  })
  const ok = operatorDashboard.internalBetaCanRunControlledToolAssistedEdits

  return {
    ok,
    runId,
    sourceSha,
    fixture,
    toolRuns,
    outputManifest,
    qaSummary,
    costSummary,
    operatorDashboard,
    betaOperatorStatusSnapshot: {
      readyForExternalBeta: betaOperatorStatus.readyForExternalBeta,
      readyForRealUserMediaBeta: betaOperatorStatus.readyForRealUserMediaBeta,
      readyForPaidProduction: betaOperatorStatus.readyForPaidProduction,
      safeBlockerReductionAllowed: betaOperatorStatus.currentGate.safeBlockerReductionAllowed,
    },
    warnings: [...new Set(warnings)],
  }
}

function buildMockServiceContext(runId: string): ServiceContext {
  return {
    env: {
      mockOnly: true,
      allowMockWithoutSupabase: true,
    } as never,
    clients: {
      admin: null,
      public: null,
    },
    requestId: runId,
    auth: {
      userId: 'user-trackb-internal-beta',
      email: 'trackb-internal-beta@reeditpro.local',
      isMockUser: true,
    },
  }
}

function buildSyntheticFixture(input: {
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
}): TrackBInternalBetaSyntheticFixture {
  const storageRoot = `workspaces/${input.workspaceId}/projects/${input.projectId}/synthetic-fixtures/milestone8`

  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    fixtureId: 'trackb-synthetic-fixture-milestone8',
    fixtureKind: 'synthetic_private_trackb_edit',
    userMediaUsed: false,
    realToolExecution: false,
    storageRoot,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    sourceClips: [
      {
        id: 'synthetic-source-video',
        artifactType: 'source_media',
        storageBucketPurpose: 'source_media',
        storageObjectPath: `${storageRoot}/source/synthetic-source-video.mp4`,
        isPrivate: true,
        sourceOfTruth: true,
      },
      {
        id: 'synthetic-source-frame',
        artifactType: 'representative_frame',
        storageBucketPurpose: 'analysis_artifacts',
        storageObjectPath: `${storageRoot}/analysis/synthetic-source-frame.png`,
        isPrivate: true,
        sourceOfTruth: true,
      },
    ],
  }
}

function buildRequiredInputArtifacts(input: {
  contract: TrackBAdapterContract
  workspaceId: string
  projectId: string
  runId: string
  toolId: TrackBAdapterToolId
}): ToolExecutionGatewayDispatchBody['artifactReferences'] {
  return input.contract.inputManifest
    .filter((artifact) => artifact.required)
    .map((artifact, index) => ({
      id: `${input.toolId}-synthetic-input-${index + 1}`,
      storageBucketPurpose: artifact.storageBucketPurpose,
      storageObjectPath: `workspaces/${input.workspaceId}/projects/${input.projectId}/synthetic-fixtures/milestone8/${input.runId}/${input.toolId}/${artifact.artifactType}.${artifactFileExtension(artifact.artifactType)}`,
      isPrivate: true,
      sourceOfTruth: true,
    }))
}

function artifactFileExtension(artifactType: ToolArtifactType): string {
  if (artifactType.endsWith('_json') || artifactType.endsWith('_manifest') || artifactType === 'qa_report') return 'json'
  if (artifactType.includes('audio')) return 'wav'
  if (artifactType.includes('image') || artifactType.includes('frame')) return 'png'
  if (artifactType.includes('video') || artifactType === 'source_media') return 'mp4'
  return 'artifact'
}

function uniqueGateTypes(contract: TrackBAdapterContract): ToolExecutionGatewayDispatchBody['requiredQualityGateTypes'] {
  return [...new Set(contract.qaChecks.map((check) => check.gateType).filter(Boolean))] as NonNullable<ToolExecutionGatewayDispatchBody['requiredQualityGateTypes']>
}

function buildCostEstimateInput(input: {
  contract: TrackBAdapterContract
  toolId: TrackBAdapterToolId
  approvedReservationRemainingCredits: number
}) {
  const category = usageCategoryForTool(input.toolId)
  const providerType = input.toolId === 'remotion'
    ? 'deterministic_renderer' as const
    : 'cloud_run_job' as const

  return {
    toolId: input.toolId,
    toolName: input.contract.displayName,
    usageCategory: category,
    computeLevel: input.contract.workerType === 'render_worker' ? 'standard' as const : 'economy' as const,
    providerType,
    providerName: 'reeditpro_internal_worker',
    qualityLevel: 'preview' as const,
    inputVideoSeconds: ['ffmpeg', 'ffprobe', 'pyav', 'pyscenedetect'].includes(input.toolId) ? 12 : 0,
    outputVideoSeconds: input.toolId === 'ffmpeg' ? 12 : 0,
    inputAudioSeconds: ['audioflux', 'signalsmith_stretch'].includes(input.toolId) ? 12 : 0,
    outputAudioSeconds: input.toolId === 'signalsmith_stretch' ? 12 : 0,
    imageCount: ['sharp', 'paddleocr', 'opencv', 'opencolorio', 'openimageio'].includes(input.toolId) ? 2 : 0,
    estimatedRuntimeSeconds: input.contract.workerType === 'render_worker' ? 45 : 30,
    renderDurationSeconds: input.toolId === 'remotion' ? 12 : 0,
    resolution: '1920x1080',
    frameRate: 30,
    vcpuCount: input.contract.workerType === 'render_worker' ? 2 : 1,
    memoryGiB: input.contract.workerType === 'render_worker' ? 2 : 1,
    outputStorageGiBHours: 0.01,
    approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    assumptions: [
      'Synthetic private fixture only.',
      'No real user media, provider call, live billing, or production execution.',
    ],
    metadata: {
      milestone: 'trackb_internal_beta_e2e',
      serviceFeeIncluded: false,
    },
  }
}

function buildCostEventInput(input: {
  dispatch: ToolExecutionGatewayDispatchResult
  estimate: ToolCostEstimate
  prepared: DispatchPreparedToolInput
}) {
  const startedAt = new Date(Date.now() - 90_000).toISOString()
  const completedAt = new Date().toISOString()

  return {
    workspaceId: input.dispatch.gateway.workspaceId,
    projectId: input.dispatch.gateway.projectId,
    editPlanId: input.prepared.dispatchInput.editPlanId,
    jobId: input.dispatch.gateway.jobId,
    creditEstimateId: input.dispatch.gateway.creditEstimateId,
    creditReservationId: input.dispatch.gateway.creditReservationId,
    toolId: input.prepared.toolId,
    toolName: input.prepared.contract.displayName,
    usageCategory: usageCategoryForTool(input.prepared.toolId),
    providerType: input.estimate.providerType,
    providerName: input.estimate.providerName,
    qualityLevel: 'preview' as const,
    startedAt,
    completedAt,
    wallClockMs: 90_000,
    billableMs: 90_000,
    vcpuCount: input.estimate.providerType === 'deterministic_renderer' ? 2 : 1,
    memoryGiB: input.estimate.providerType === 'deterministic_renderer' ? 2 : 1,
    inputVideoSeconds: input.estimate.inputVideoSeconds,
    outputVideoSeconds: input.estimate.outputVideoSeconds,
    inputAudioSeconds: input.estimate.inputAudioSeconds,
    outputAudioSeconds: input.estimate.outputAudioSeconds,
    imageCount: input.estimate.imageCount,
    renderDurationSeconds: input.estimate.providerType === 'deterministic_renderer' ? 12 : 0,
    outputResolution: '1920x1080',
    outputFrameRate: 30,
    estimatedInternalCostCents: input.estimate.expectedInternalCostCents,
    retryAttempt: input.prepared.dispatchInput.attempt,
    failureCategory: 'none' as const,
    billableToUser: true,
    approvedReservationRemainingCredits: input.prepared.dispatchInput.approvedReservationRemainingCredits,
    outputStorageGiBHours: 0.01,
    metadata: {
      milestone: 'trackb_internal_beta_e2e',
      jobId: input.dispatch.gateway.jobId,
      syntheticFixtureOnly: true,
    },
  }
}

function buildToolRunSummary(input: {
  dispatch: ToolExecutionGatewayDispatchResult
  estimate: ToolCostEstimate
  costEvent: ToolCostEvent
  costEventReplayed: boolean
  prepared: DispatchPreparedToolInput
}): TrackBInternalBetaToolRun {
  const adapterQaPassed = input.dispatch.trackBAdapterResult?.qaChecks.every((check) => check.status === 'passed') === true
  const privateOutputCount = input.dispatch.workerRuntimeArtifactPipeline?.outputManifest.length ?? 0
  return {
    toolId: input.prepared.toolId,
    jobId: input.dispatch.gateway.jobId,
    workerType: input.prepared.contract.workerType,
    gatewayStatus: input.dispatch.gateway.status,
    adapterStatus: input.dispatch.trackBAdapterResult?.status ?? 'missing_adapter_result',
    workerStatus: input.dispatch.workerResult?.status ?? 'missing_worker_result',
    qaStatus: adapterQaPassed && input.dispatch.gateway.blockers.length === 0 ? 'passed' : 'blocked',
    privateInputCount: input.prepared.dispatchInput.artifactReferences.length,
    privateOutputCount,
    costEstimate: {
      lowCredits: input.estimate.lowCredits,
      expectedCredits: input.estimate.expectedCredits,
      highCredits: input.estimate.highCredits,
      rateCardVersion: input.estimate.rateCardVersion,
      serviceFeeIncluded: false,
    },
    costEvent: {
      id: input.costEvent.id,
      replayed: input.costEventReplayed,
      billableToUser: input.costEvent.billableToUser,
      actualInternalCostCents: input.costEvent.actualInternalCostCents,
      toolCostCredits: input.costEvent.toolCostCredits,
    },
    blockers: input.dispatch.gateway.blockers.map((blocker) => `${blocker.gateName}:${blocker.code}`),
    warnings: input.dispatch.warnings,
  }
}

function summarizeOutputManifest(artifacts: Array<{
  isPrivate: boolean
  storageObjectPath: string
}>): TrackBInternalBetaE2EResult['outputManifest'] {
  return {
    artifactCount: artifacts.length,
    privateArtifactCount: artifacts.filter((artifact) => artifact.isPrivate).length,
    publicArtifactCount: artifacts.filter((artifact) => !artifact.isPrivate).length,
    signedUrlArtifactCount: artifacts.filter((artifact) => /https?:\/\/|X-Goog-Signature|X-Amz-Signature/i.test(artifact.storageObjectPath)).length,
  }
}

function buildOperatorDashboard(input: {
  toolRuns: TrackBInternalBetaToolRun[]
  outputManifest: TrackBInternalBetaE2EResult['outputManifest']
  costSummary: ToolCostSummary
  qaSummary: TrackBInternalBetaE2EResult['qaSummary']
  gatewayReplayChecked: boolean
  costEventReplayChecked: boolean
}): TrackBInternalBetaOperatorDashboard {
  const totalTrackBTools = TRACK_B_ADAPTER_TOOL_IDS.length
  const dispatchedToolCount = input.toolRuns.filter((tool) => tool.gatewayStatus === 'dispatched').length
  const qaPassedToolCount = input.toolRuns.filter((tool) => tool.qaStatus === 'passed').length
  const ready = dispatchedToolCount === totalTrackBTools &&
    qaPassedToolCount === totalTrackBTools &&
    input.qaSummary.allWorkerJobsCompleted &&
    input.qaSummary.allArtifactsPrivate &&
    input.qaSummary.noRealToolExecution &&
    input.qaSummary.noRealUserMedia &&
    input.costSummary.billableEventCount === totalTrackBTools &&
    input.gatewayReplayChecked &&
    input.costEventReplayChecked

  return {
    status: ready ? 'ready_for_controlled_internal_beta' : 'blocked',
    decision: ready ? TRACKB_INTERNAL_BETA_E2E_DECISION : 'blocked',
    internalBetaCanRunControlledToolAssistedEdits: ready,
    externalBetaAllowed: false,
    realUserMediaBetaAllowed: false,
    paidProductionAllowed: false,
    productReadyLocalOssCount: 0,
    totalTrackBTools,
    dispatchedToolCount,
    qaPassedToolCount,
    artifactCount: input.outputManifest.artifactCount,
    billableCostEventCount: input.costSummary.billableEventCount,
    nonBillableCostEventCount: input.costSummary.nonBillableEventCount,
    actualToolCostCredits: input.costSummary.actualToolCostCredits,
    gatewayReplayChecked: input.gatewayReplayChecked,
    costEventReplayChecked: input.costEventReplayChecked,
    blockedScopes: [
      'real_user_media_beta',
      'external_beta_user_exposure',
      'paid_production',
      'live_provider_calls',
      'frontend_direct_tool_execution',
      'public_or_signed_url_artifacts',
    ],
    nextActions: ready
      ? [
        'Run this smoke from the final source SHA before controlled internal beta sessions.',
        'Keep synthetic/private fixture scope until explicit real-user-media approval exists.',
        'Use the operator dashboard readout to decide whether to open the next internal-beta monitoring closeout gate.',
      ]
      : [
        'Resolve blocked gateway, QA, artifact, cost, or replay checks before internal beta.',
      ],
  }
}

function usageCategoryForTool(toolId: TrackBAdapterToolId): ToolCostUsageCategory {
  switch (toolId) {
    case 'libass':
      return 'captions'
    case 'audioflux':
    case 'signalsmith_stretch':
      return 'soundsync'
    case 'd3':
    case 'echarts':
    case 'sharp':
      return 'graphic_design'
    case 'remotion':
      return 'rendering'
    case 'ffmpeg':
      return 'export'
    case 'opentimelineio':
      return 'other'
    default:
      return 'media_analysis'
  }
}
