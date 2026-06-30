import {
  buildTrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeToolContract,
} from '../beta-readiness/trackb-agent-runtime-readiness'
import { findForbiddenWorkerPayloadEntries } from '../workers/production/production-worker-artifact-policy'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import { runProductionToolReadiness } from '../workers/production-readiness'
import { buildHyperframeTimelineBridge } from '../workers/timeline/hyperframe-timeline-bridge'
import { buildTrackBSyntheticTimelineManifest } from '../workers/timeline/trackb-synthetic-timeline-manifest'
import type { ProductionToolReadinessResult } from '../workers/production-readiness'
import type {
  ProductionWorkerExecutionResult,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type { ProductionToolId } from '../tool-registry'

export type TrackBAgentToolExecutionMode =
  | 'mock_safe_worker_dispatch'
  | 'frontend_preview_boundary'
  | 'bounded_runtime_probe'
  | 'bounded_execution_rehearsal'
  | 'deployed_live_execution'

export type TrackBAgentToolExecutionStatus =
  | 'completed'
  | 'blocked'

export interface TrackBAgentToolExecutionInput {
  workspaceId: string
  projectId: string
  jobId: string
  agentInvocationId: string
  action: string
  approvedSnapshotId: string
  toolExecutionPlanId: string
  toolId?: ProductionToolId
  editPlanId?: string
  mediaAssetId?: string
  mediaAnalysisReportId?: string
  mode?: TrackBAgentToolExecutionMode
  requestedRecipeIds?: string[]
  storageReferenceIds?: string[]
  approvedPreviewStateReference?: string
  requiredQualityGateIds?: string[]
  requiredQualityGateTypes?: ProductionWorkerJobPayload['requiredQualityGateTypes']
  renderMode?: ProductionWorkerJobPayload['renderMode']
  creditEstimateId?: string
  creditReservationId?: string
  workerInstanceId?: string
  attempt?: number
  maxAttempts?: number
  metadata?: Record<string, unknown>
  apiIdempotencyKey?: string
}

export interface TrackBAgentToolExecutionOptions {
  readinessReport?: TrackBAgentRuntimeReadinessReport
}

export interface TrackBAgentToolExecutionResult {
  status: TrackBAgentToolExecutionStatus
  decision: string
  toolId?: ProductionToolId
  agentInvocationId: string
  mode: TrackBAgentToolExecutionMode
  liveExecutionReady: boolean
  paymentScope: 'excluded_from_this_runtime_boundary'
  serviceFeeIncluded: false
  workerPayload?: ProductionWorkerJobPayload
  workerResult?: ProductionWorkerExecutionResult
  runtimeReadinessProof?: TrackBAgentRuntimeReadinessProof
  previewBoundary?: {
    approvedPreviewStateReference: string
    workerDispatchSkipped: true
    reason: string
  }
  previewRehearsal?: {
    toolId: 'hyperframe'
    status: 'completed'
    routeClass: 'timeline_bridge_bounded_rehearsal'
    workerDispatchSkipped: true
    productRuntimeExecution: false
    mediaProcessing: false
    userMediaProcessed: false
    artifactFileWritten: false
    publicArtifactCreated: false
    proof: {
      bridgeType: string
      timelineId: string
      clipCount: number
      editDecisionCount: number
      sourceReferenceCount: number
      approvedPreviewStateReference: string
    }
  }
  blockedReason?: string
  warnings: string[]
}

export interface TrackBAgentRuntimeReadinessProof {
  toolId: ProductionToolId
  probeKind: 'command_import_package_metadata_only'
  mediaProcessing: false
  productRuntimeExecution: false
  backendEvidenceRecorded: false
  status: ProductionToolReadinessResult['status']
  checkedAt: string
  checkModes: string[]
  commandChecks: ProductionToolReadinessResult['commandChecks']
  pythonImportChecks: ProductionToolReadinessResult['pythonImportChecks']
  nodePackageChecks: ProductionToolReadinessResult['nodePackageChecks']
  warnings: string[]
}

export async function executeTrackBAgentTool(
  input: TrackBAgentToolExecutionInput,
  options: TrackBAgentToolExecutionOptions = {},
): Promise<TrackBAgentToolExecutionResult> {
  const report = options.readinessReport ?? buildTrackBAgentRuntimeReadinessReport()
  const contract = findContract(report.contracts, input.agentInvocationId, input.toolId)
  if (!contract) {
    return blocked(input, input.mode ?? 'mock_safe_worker_dispatch', 'unknown_trackb_agent_invocation', [
      'Agent invocation must match one of the 16 Track B media OSS runtime contracts.',
    ])
  }

  const mode = input.mode ?? contract.admittedModes[0] ?? 'mock_safe_worker_dispatch'
  const commonWarnings = [
    ...report.warnings,
    ...contract.blockedActionScope.map((scope) => `Blocked live scope remains: ${scope}.`),
  ]

  const invalidMode = validateMode(contract, mode, report.liveAgentExecutionReady)
  if (invalidMode) {
    return blocked(input, mode, invalidMode, commonWarnings, contract)
  }

  if (!contract.supportedActions.includes(input.action)) {
    return blocked(input, mode, `Unsupported action ${input.action} for ${contract.toolId}.`, commonWarnings, contract)
  }

  const forbiddenFindings = findForbiddenWorkerPayloadEntries({
    storageReferenceIds: input.storageReferenceIds ?? [],
    approvedPreviewStateReference: input.approvedPreviewStateReference,
    metadata: input.metadata ?? {},
  })
  if (forbiddenFindings.length > 0) {
    return blocked(input, mode, `Agent tool payload contains forbidden raw prompt, signed URL, or secret fields: ${forbiddenFindings.join(', ')}`, commonWarnings, contract)
  }

  if (mode === 'frontend_preview_boundary') {
    if (!input.approvedPreviewStateReference) {
      return blocked(input, mode, 'Frontend preview boundary requires approvedPreviewStateReference.', commonWarnings, contract)
    }

    return {
      status: 'completed',
      decision: 'trackb_agent_tool_execution_frontend_preview_boundary_admitted',
      toolId: contract.toolId,
      agentInvocationId: contract.agentInvocationId,
      mode,
      liveExecutionReady: report.liveAgentExecutionReady,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
      previewBoundary: {
        approvedPreviewStateReference: input.approvedPreviewStateReference,
        workerDispatchSkipped: true,
        reason: 'Hyperframe is admitted only as an approved frontend preview/timeline handoff boundary.',
      },
      warnings: commonWarnings,
    }
  }

  if (mode === 'bounded_runtime_probe') {
    const proof = buildRuntimeReadinessProof(contract.toolId)
    const proofPassed = isRuntimeReadinessProofAcceptable(proof)
    return {
      status: proofPassed ? 'completed' : 'blocked',
      decision: proofPassed
        ? 'trackb_agent_tool_execution_bounded_runtime_probe_completed'
        : 'trackb_agent_tool_execution_bounded_runtime_probe_blocked',
      toolId: contract.toolId,
      agentInvocationId: contract.agentInvocationId,
      mode,
      liveExecutionReady: report.liveAgentExecutionReady,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
      runtimeReadinessProof: proof,
      blockedReason: proofPassed ? undefined : `Bounded runtime probe for ${contract.toolId} returned status ${proof.status}.`,
      warnings: [
        ...commonWarnings,
        ...proof.warnings,
        'Bounded runtime probe uses command/import/package-metadata checks only; it does not process media, dispatch product runtime work, write backend evidence, or enable beta/production.',
      ],
    }
  }

  if (mode === 'bounded_execution_rehearsal' && contract.toolId === 'hyperframe') {
    if (!input.approvedPreviewStateReference) {
      return blocked(input, mode, 'Hyperframe bounded rehearsal requires approvedPreviewStateReference.', commonWarnings, contract)
    }

    const timelineManifest = buildTrackBSyntheticTimelineManifest({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      approvedSnapshotId: input.approvedSnapshotId,
      mediaAssetId: input.mediaAssetId,
      timelineId: `timeline-trackb-hyperframe-rehearsal-${input.jobId}`,
    })
    const bridge = buildHyperframeTimelineBridge(timelineManifest)
    return {
      status: 'completed',
      decision: 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed',
      toolId: contract.toolId,
      agentInvocationId: contract.agentInvocationId,
      mode,
      liveExecutionReady: report.liveAgentExecutionReady,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
      previewBoundary: {
        approvedPreviewStateReference: input.approvedPreviewStateReference,
        workerDispatchSkipped: true,
        reason: 'Hyperframe bounded rehearsal validates the approved preview/timeline bridge without backend worker dispatch.',
      },
      previewRehearsal: {
        toolId: 'hyperframe',
        status: 'completed',
        routeClass: 'timeline_bridge_bounded_rehearsal',
        workerDispatchSkipped: true,
        productRuntimeExecution: false,
        mediaProcessing: false,
        userMediaProcessed: false,
        artifactFileWritten: false,
        publicArtifactCreated: false,
        proof: {
          bridgeType: bridge.bridgeType,
          timelineId: bridge.timelineId,
          clipCount: bridge.clips.length,
          editDecisionCount: bridge.editDecisions.length,
          sourceReferenceCount: timelineManifest.sourceReferences.length,
          approvedPreviewStateReference: input.approvedPreviewStateReference,
        },
      },
      warnings: [
        ...commonWarnings,
        'Hyperframe bounded rehearsal is payment-independent and preview-boundary-only.',
        'No user media, backend worker dispatch, artifact write, Supabase/GCS write, beta, or production scope was attempted.',
      ],
    }
  }

  if (!input.storageReferenceIds || input.storageReferenceIds.length === 0) {
    return blocked(input, mode, 'Worker dispatch requires at least one private storage reference ID/path.', commonWarnings, contract)
  }

  const payload = buildWorkerPayload(input, contract, mode, report)
  const workerResult = await dispatchProductionWorkerJob({ payload, workerInstanceId: input.workerInstanceId })
  const completed = isWorkerResultCompletedForMode(mode, workerResult)
  return {
    status: completed ? 'completed' : 'blocked',
    decision: workerDecision(mode, completed),
    toolId: contract.toolId,
    agentInvocationId: contract.agentInvocationId,
    mode,
    liveExecutionReady: report.liveAgentExecutionReady,
    paymentScope: 'excluded_from_this_runtime_boundary',
    serviceFeeIncluded: false,
    workerPayload: payload,
    workerResult,
    blockedReason: completed ? undefined : workerResult.error?.message ?? workerRecipeBlockedReason(workerResult) ?? 'Worker dispatch did not complete.',
    warnings: [...commonWarnings, ...workerResult.warnings],
  }
}

function buildRuntimeReadinessProof(toolId: ProductionToolId): TrackBAgentRuntimeReadinessProof {
  const readiness = runProductionToolReadiness({
    realCheckMode: true,
    strict: false,
    toolIds: [toolId],
  })
  const result = readiness.results.find((item) => item.toolId === toolId)
  if (!result) {
    return {
      toolId,
      probeKind: 'command_import_package_metadata_only',
      mediaProcessing: false,
      productRuntimeExecution: false,
      backendEvidenceRecorded: false,
      status: 'missing',
      checkedAt: new Date().toISOString(),
      checkModes: [],
      commandChecks: [],
      pythonImportChecks: [],
      nodePackageChecks: [],
      warnings: [`No scoped production-readiness result was returned for ${toolId}.`],
    }
  }

  return {
    toolId,
    probeKind: 'command_import_package_metadata_only',
    mediaProcessing: false,
    productRuntimeExecution: false,
    backendEvidenceRecorded: false,
    status: result.status,
    checkedAt: result.checkedAt,
    checkModes: readiness.coreToolReadiness?.results
      .filter((item) => item.toolId === toolId || (toolId === 'ffmpeg' && item.toolId === 'ffmpeg_lgpl_policy'))
      .map((item) => item.checkKind) ?? [],
    commandChecks: result.commandChecks,
    pythonImportChecks: result.pythonImportChecks,
    nodePackageChecks: result.nodePackageChecks,
    warnings: result.warnings,
  }
}

function isRuntimeReadinessProofAcceptable(proof: TrackBAgentRuntimeReadinessProof): boolean {
  return proof.status === 'passed' || proof.status === 'warning'
}

function findContract(
  contracts: TrackBAgentRuntimeToolContract[],
  agentInvocationId: string,
  toolId?: ProductionToolId,
): TrackBAgentRuntimeToolContract | undefined {
  return contracts.find((contract) => (
    contract.agentInvocationId === agentInvocationId &&
    (!toolId || contract.toolId === toolId)
  ))
}

function validateMode(
  contract: TrackBAgentRuntimeToolContract,
  mode: TrackBAgentToolExecutionMode,
  liveExecutionReady: boolean,
): string | undefined {
  if (mode === 'deployed_live_execution') {
    if (!liveExecutionReady) {
      return 'Live Track B agent execution requires deployed product-ready evidence and operator-status readback for all 16 tools.'
    }
    return contract.admittedModes.includes('deployed_live_execution')
      ? undefined
      : `Mode deployed_live_execution is not admitted for ${contract.toolId}.`
  }

  if (!contract.admittedModes.includes(mode)) {
    return `Mode ${mode} is not admitted for ${contract.toolId}.`
  }

  return undefined
}

function buildWorkerPayload(
  input: TrackBAgentToolExecutionInput,
  contract: TrackBAgentRuntimeToolContract,
  mode: TrackBAgentToolExecutionMode,
  report: TrackBAgentRuntimeReadinessReport,
): ProductionWorkerJobPayload {
  const agentRecipeMetadata = buildDefaultTrackBWorkerRecipeMetadata(input, contract, mode)
  const candidate: ProductionWorkerJobPayload = {
    jobId: input.jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    editPlanId: input.editPlanId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    mediaAnalysisReportId: input.mediaAnalysisReportId,
    workerType: contract.workerType as ProductionWorkerRuntimeType,
    executionMode: workerExecutionMode(mode),
    idempotencyKey: '',
    attempt: input.attempt ?? 1,
    maxAttempts: input.maxAttempts ?? 1,
    requestedToolIds: [contract.toolId],
    requestedRecipeIds: input.requestedRecipeIds?.length
      ? input.requestedRecipeIds
      : [`trackb_${contract.toolId}_${input.action}`],
    storageReferenceIds: input.storageReferenceIds ?? [],
    creditReservationId: input.creditReservationId,
    renderMode: input.renderMode,
    requiredQualityGateIds: input.requiredQualityGateIds,
    requiredQualityGateTypes: input.requiredQualityGateTypes,
    createdAt: new Date().toISOString(),
    metadata: {
      ...(input.metadata ?? {}),
      ...agentRecipeMetadata,
      creditEstimateId: input.creditEstimateId ?? stringMetadata(input.metadata, 'creditEstimateId'),
      agentInvocationId: contract.agentInvocationId,
      agentAction: input.action,
      agentExecutionMode: mode,
      trackBProductReadyRuntimeEvidenceAccepted: mode === 'deployed_live_execution' && report.liveAgentExecutionReady,
      trackBDeployedEvidenceSource: report.sourceEvidence.deployedEvidenceSource,
      trackBDeployedEvidenceRecordedToolCount: report.deployedEvidenceRecordedToolCount,
      trackBDeployedEvidenceWorkspaceId: report.sourceEvidence.deployedEvidenceWorkspaceId,
      apiIdempotencyKey: input.apiIdempotencyKey,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
    },
  }
  return { ...candidate, idempotencyKey: buildWorkerIdempotencyKey(candidate) }
}

const EXPLICIT_WORKER_RECIPE_KEYS = [
  'mediaFoundation',
  'speechFoundation',
  'captionFoundation',
  'speechCaptionExecution',
  'smartCutFoundation',
  'smartCutTimelineExecution',
  'timelineFoundation',
  'audioFoundation',
  'audioExecution',
  'colorExecution',
  'maskComposition',
  'enhancementSlowMotion',
  'finalRenderExecution',
  'finalRenderQA',
  'trackBAgentToolRecipe',
]

function buildDefaultTrackBWorkerRecipeMetadata(
  input: TrackBAgentToolExecutionInput,
  contract: TrackBAgentRuntimeToolContract,
  mode: TrackBAgentToolExecutionMode,
): Record<string, unknown> {
  if (hasExplicitWorkerRecipe(input.metadata)) return {}

  const common = trackBAgentToolRecipe(contract.toolId, input.action)
  switch (contract.toolId) {
    case 'ffmpeg':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'synthetic_video_null_bounded_rehearsal')
      }
      return {
        finalRenderExecution: {
          mode: 'dry_run',
          renderEngine: 'ffmpeg',
          renderMode: 'command_plan_only',
          sourceVideoArtifactIds: input.storageReferenceIds,
          durationSeconds: 8,
          enableRemotionLocalRender: false,
          enableCaptionBurnIn: false,
          allowRevideo: false,
        },
        ...common,
      }
    case 'ffprobe':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'synthetic_stream_probe_bounded_rehearsal')
      }
      return {
        mediaFoundation: mediaFoundationRecipe(input, ['probe', 'build_analysis_report']),
        ...common,
      }
    case 'pyav':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'frame_access_bounded_rehearsal')
      }
      return {
        mediaFoundation: mediaFoundationRecipe(input, ['extract_keyframes', 'extract_representative_frames', 'build_analysis_report']),
        ...common,
      }
    case 'opentimelineio':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'timeline_serialize_bounded_rehearsal')
      }
      return {
        timelineFoundation: {
          mode: 'dry_run',
          mediaDurationSeconds: 8,
          sourceStorageObjectPath: input.storageReferenceIds?.[0],
        },
        ...common,
      }
    case 'remotion':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'composition_manifest_bounded_rehearsal')
      }
      return {
        finalRenderExecution: {
          mode: 'dry_run',
          renderEngine: 'remotion',
          renderMode: 'command_plan_only',
          sourceVideoArtifactIds: input.storageReferenceIds,
          durationSeconds: 8,
          enableRemotionLocalRender: false,
          enableCaptionBurnIn: false,
          allowRevideo: false,
        },
        ...common,
      }
    case 'libass':
      return {
        speechCaptionExecution: {
          mode: 'dry_run',
          buildSpeech: false,
          buildCaptions: true,
          enableCaptionPreview: false,
          captionFormats: ['ass'],
          sourceAudioArtifactId: input.storageReferenceIds?.[0],
        },
        ...common,
      }
    case 'pyscenedetect':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'scene_boundary_bounded_rehearsal')
      }
      return {
        smartCutFoundation: {
          mode: 'dry_run',
          mediaDurationSeconds: 8,
          intent: ['tighten_pacing', 'preserve_story'],
          aggressiveness: 'balanced',
          pacingProfileId: 'natural_clean',
        },
        ...common,
      }
    case 'opencv':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'frame_analysis_bounded_rehearsal')
      }
      return {
        mediaFoundation: mediaFoundationRecipe(input, ['extract_representative_frames', 'build_analysis_report']),
        ...common,
      }
    case 'opencolorio':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'color_config_bounded_rehearsal')
      }
      return {
        colorExecution: {
          mode: 'dry_run',
          sourceVideoArtifactId: input.storageReferenceIds?.[0],
          sourceStorageObjectPath: input.storageReferenceIds?.[0],
          colorGradeStyle: 'documentary_neutral',
          enableFfmpegColorPreview: false,
          enableOpenColorIOExecution: false,
          enableOpenImageIOExecution: false,
          allowFinalExport: false,
        },
        ...common,
      }
    case 'openimageio':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'imagebuf_metadata_bounded_rehearsal')
      }
      return {
        colorExecution: {
          mode: 'dry_run',
          sourceVideoArtifactId: input.storageReferenceIds?.[0],
          sourceStorageObjectPath: input.storageReferenceIds?.[0],
          colorGradeStyle: 'documentary_neutral',
          enableFfmpegColorPreview: false,
          enableOpenColorIOExecution: false,
          enableOpenImageIOExecution: false,
          allowFinalExport: false,
        },
        ...common,
      }
    case 'audioflux':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'audio_feature_bounded_rehearsal')
      }
      return {
        audioFoundation: {
          mode: 'dry_run',
          sourceAudioArtifactId: input.storageReferenceIds?.[0],
          sourceAudioStorageObjectPath: input.storageReferenceIds?.[0],
          approvedDirectiveSummary: 'Track B agent audio analysis dry-run recipe selection.',
          userIntentSummary: 'Verify audio analysis worker admission without real media processing.',
        },
        ...common,
      }
    case 'signalsmith_stretch':
      return {
        audioExecution: {
          mode: 'dry_run',
          sourceAudioArtifactId: input.storageReferenceIds?.[0],
          sourceAudioStorageObjectPath: input.storageReferenceIds?.[0],
          enableFfmpegAudioExecution: false,
          enableModelAudioExecution: false,
          allowModelDownload: false,
          allowFinalMux: false,
        },
        ...common,
      }
    case 'sharp':
      return trackBAgentToolRecipe(
        contract.toolId,
        input.action,
        mode === 'bounded_execution_rehearsal' ? 'image_asset_prepare_bounded_rehearsal' : 'image_asset_prepare_dry_run',
      )
    case 'duckdb':
      return trackBAgentToolRecipe(
        contract.toolId,
        input.action,
        mode === 'bounded_execution_rehearsal' ? 'structured_artifact_query_bounded_rehearsal' : 'structured_artifact_query_dry_run',
      )
    case 'polars':
      return trackBAgentToolRecipe(
        contract.toolId,
        input.action,
        mode === 'bounded_execution_rehearsal' ? 'dataframe_transform_bounded_rehearsal' : 'dataframe_transform_dry_run',
      )
    case 'hyperframe':
      if (mode === 'bounded_execution_rehearsal') {
        return trackBAgentToolRecipe(contract.toolId, input.action, 'timeline_bridge_bounded_rehearsal')
      }
      return {}
  }
}

function hasExplicitWorkerRecipe(metadata: Record<string, unknown> | undefined): boolean {
  return EXPLICIT_WORKER_RECIPE_KEYS.some((key) => metadata?.[key] !== undefined)
}

function mediaFoundationRecipe(
  input: TrackBAgentToolExecutionInput,
  tasks: string[],
): Record<string, unknown> {
  return {
    mode: 'dry_run',
    sourceStorageObjectId: input.storageReferenceIds?.[0],
    sourceStorageObjectPath: input.storageReferenceIds?.[0],
    tasks,
  }
}

function trackBAgentToolRecipe(
  toolId: ProductionToolId,
  action: string,
  routeClass = 'mapped_worker_dry_run',
): Record<string, unknown> {
  return {
    trackBAgentToolRecipe: {
      toolId,
      action,
      routeClass,
      plannedHandler: `trackb_agent_${toolId}_${action}`,
      notes: [
        'Default Track B agent recipe selection only.',
        'No real tool binary execution, user media processing, public artifact, or production delivery is performed by this metadata.',
      ],
    },
  }
}

function workerDecision(mode: TrackBAgentToolExecutionMode, completed: boolean): string {
  if (mode === 'deployed_live_execution') {
    return completed
      ? 'trackb_agent_tool_execution_deployed_live_execution_completed'
      : 'trackb_agent_tool_execution_deployed_live_execution_blocked'
  }

  if (mode === 'bounded_execution_rehearsal') {
    return completed
      ? 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed'
      : 'trackb_agent_tool_execution_bounded_execution_rehearsal_blocked'
  }

  return completed
    ? 'trackb_agent_tool_execution_mock_safe_worker_dispatch_completed'
    : 'trackb_agent_tool_execution_mock_safe_worker_dispatch_blocked'
}

function workerExecutionMode(mode: TrackBAgentToolExecutionMode): ProductionWorkerJobPayload['executionMode'] {
  if (mode === 'deployed_live_execution') return 'production_ready'
  if (mode === 'bounded_execution_rehearsal') return 'bounded_rehearsal'
  return 'mock_safe'
}

function isWorkerResultCompletedForMode(
  mode: TrackBAgentToolExecutionMode,
  workerResult: ProductionWorkerExecutionResult,
): boolean {
  if (workerResult.status !== 'completed') return false
  if (mode !== 'bounded_execution_rehearsal') return true
  const recipeResult = workerResult.output?.trackBAgentToolRecipeResult
  return Boolean(
    recipeResult &&
    typeof recipeResult === 'object' &&
    (recipeResult as Record<string, unknown>).status === 'completed' &&
    (recipeResult as Record<string, unknown>).realToolBinaryExecution === true &&
    (recipeResult as Record<string, unknown>).productRuntimeExecution === false &&
    (recipeResult as Record<string, unknown>).mediaProcessing === false,
  )
}

function workerRecipeBlockedReason(workerResult: ProductionWorkerExecutionResult): string | undefined {
  const recipeResult = workerResult.output?.trackBAgentToolRecipeResult
  if (!recipeResult || typeof recipeResult !== 'object') return undefined
  const blockedReason = (recipeResult as Record<string, unknown>).blockedReason
  return typeof blockedReason === 'string' && blockedReason.length > 0 ? blockedReason : undefined
}

function stringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function blocked(
  input: Pick<TrackBAgentToolExecutionInput, 'agentInvocationId'>,
  mode: TrackBAgentToolExecutionMode,
  reason: string,
  warnings: string[],
  contract?: TrackBAgentRuntimeToolContract,
): TrackBAgentToolExecutionResult {
  return {
    status: 'blocked',
    decision: 'trackb_agent_tool_execution_blocked_before_worker_dispatch',
    toolId: contract?.toolId,
    agentInvocationId: input.agentInvocationId,
    mode,
    liveExecutionReady: false,
    paymentScope: 'excluded_from_this_runtime_boundary',
    serviceFeeIncluded: false,
    blockedReason: reason,
    warnings,
  }
}
