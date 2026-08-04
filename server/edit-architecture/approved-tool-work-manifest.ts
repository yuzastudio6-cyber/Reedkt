import { createHash } from 'node:crypto'

import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'
import type { ReEditProCanonicalEditLevel } from '../../src/types/edit-level'
import type { ToolStrategyPlanItem } from '../../src/types/reeditpro'
import {
  getFallbackChainsForTool,
  getProductionToolProfile,
  getToolQAPolicy,
  isProductionToolId,
  resolveProfessionalToolAdapterContract,
  type ProductionRegistryWorkerType,
  type ProductionToolExecutionMode,
  type ProductionToolId,
  type ProductionToolInputType,
  type ProductionToolOutputType,
} from '../tool-registry'
import {
  createMockToolCostStore,
  emitProductionToolCostEvent,
  type ToolRuntimeComputeLevel,
} from '../tool-cost-metering'

export const APPROVED_TOOL_WORK_MANIFEST_VERSION = 'approved-tool-work-manifest-v1' as const
export const APPROVED_TOOL_OPERATION_EVIDENCE_VERSION = 'approved-tool-operation-evidence-v1' as const

const approvedToolOperationCostEvidenceStore = createMockToolCostStore()

export type ApprovedToolWorkManifestStatus =
  | 'ready_for_private_internal_execution'
  | 'ready_for_private_internal_preview_with_degraded_plans'
  | 'blocked_structural_inconsistency'

export type ApprovedCoreToolOperationKind =
  | 'source_media_private_process'
  | 'processed_media_private_qa_probe'
  | 'final_private_render'
  | 'final_delivery_private_qa_probe'

export type ApprovedToolWorkOperationDisposition =
  | 'executable_private_internal'
  | 'degraded_planning_only'
  | 'blocked_by_manifest_validation'

export interface ApprovedToolWorkManifestRef {
  manifestId: string
  manifestVersion: typeof APPROVED_TOOL_WORK_MANIFEST_VERSION
  fingerprintSha256: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  immutable: true
}

export interface ApprovedToolWorkSourceReferences {
  toolStrategyItemIds: string[]
  toolStrategyStepIds: string[]
  professionalSkillIds: string[]
  backendIntentIds: string[]
  renderStrategyItemIds: string[]
  colorOperationIds: string[]
  audioOperationIds: string[]
  workItemIds: string[]
}

export interface ApprovedToolWorkOperation {
  operationId: string
  operationKind: ApprovedCoreToolOperationKind | 'approved_tool_strategy' | 'approved_professional_adapter'
  source: 'core_private_pipeline' | 'tool_strategy_plan' | 'professional_skill_plan'
  toolId: ProductionToolId
  label: string
  disposition: ApprovedToolWorkOperationDisposition
  backendOwned: true
  privateArtifactsOnly: true
  publicExecutionAllowed: false
  productionExecutionAllowed: false
  approvedSnapshotRequired: true
  creditReservationRequired: true
  segmentIds: string[]
  assetPlanItemIds: string[]
  rendererLayerIds: string[]
  sourceReferences: ApprovedToolWorkSourceReferences
  settings: Record<string, unknown>
  inputTypes: ProductionToolInputType[]
  outputTypes: ProductionToolOutputType[]
  runner: {
    runnerId: string
    workerType: ProductionRegistryWorkerType
    executionMode: ProductionToolExecutionMode
    binaryOrPackage: string
    actualMediaOperationImplemented: boolean
    readinessEvidenceRequired: boolean
  }
  qa: {
    gateTypes: string[]
    requiredBeforePreview: string[]
    requiredBeforeFinalExport: string[]
    approvedPlanChecks: string[]
  }
  fallback: Array<{
    chainId: string
    trigger: string
    actions: string[]
  }>
  cost: {
    source: 'mock_safe_internal_tool_cost_evidence'
    actualInternalToolCostOnly: true
    emitOnlyAfterActualWork: true
    billableToUser: false
    serviceFeeIncluded: false
    walletMutationAllowed: false
    settlementAllowed: false
  }
  warnings: string[]
}

export interface ApprovedToolWorkManifest {
  manifestId: string
  manifestVersion: typeof APPROVED_TOOL_WORK_MANIFEST_VERSION
  fingerprintSha256: string
  immutable: true
  source: 'approved_plan_snapshot_server_reconciliation'
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  productEditLevel: ReEditProCanonicalEditLevel
  executionScope: 'private_internal_only'
  status: ApprovedToolWorkManifestStatus
  operations: ApprovedToolWorkOperation[]
  coreOperationIds: Record<ApprovedCoreToolOperationKind, string>
  reconciliation: {
    toolStrategyItemCount: number
    professionalSkillCount: number
    professionalAdapterCount: number
    renderStrategyItemCount: number
    colorOperationCount: number
    audioOperationCount: number
    workItemCount: number
    segmentCount: number
    assetPlanItemCount: number
    rendererLayerCount: number
    executableOperationCount: number
    degradedOperationCount: number
    blockedOperationCount: number
  }
  blockers: string[]
  warnings: string[]
  externalReleaseBlocks: string[]
}

export interface ApprovedToolOperationCostEvidence {
  source: 'mock_safe_nonbillable_internal_tool_cost_event'
  eventId: string
  idempotencyKey: string
  actualInternalCostMicros: number
  actualInternalCostCents: number
  toolCostCredits: number
  billableToUser: false
  serviceFeeIncluded: false
  nonBillableReason: 'private_internal_test_execution_no_wallet_settlement'
  walletMutationExecuted: false
  settlementExecuted: false
  rateCardVersion: string
}

export interface ApprovedToolOperationEvidence {
  evidenceVersion: typeof APPROVED_TOOL_OPERATION_EVIDENCE_VERSION
  evidenceId: string
  operationId: string
  operationInstanceId: string
  manifestRef: ApprovedToolWorkManifestRef
  toolId: ProductionToolId
  status:
    | 'actual_private_media_work_completed'
    | 'actual_private_media_qa_completed'
    | 'actual_private_artifact_work_completed'
  actualToolExecuted: true
  privateInternalRuntimeExecuted: true
  productionRuntimeExecuted: false
  mediaProcessingExecuted: boolean
  mediaBytesProcessed: boolean
  artifactBytesProduced?: boolean
  backendOwned: true
  privateArtifact: true
  publicArtifact: false
  signedUrl: null
  outputArtifactId: string
  outputSha256?: string
  outputByteSize?: number
  mediaProbe?: {
    hasVideo: boolean
    hasAudio: boolean
    width?: number
    height?: number
    durationSeconds?: number
  }
  imageProbe?: {
    mimeType: 'image/png'
    pngSignatureValid: true
    width: number
    height: number
    sourceSpecSha256: string
    networkRequestCount: 0
  }
  qaChecks: string[]
  costEvidence: ApprovedToolOperationCostEvidence
  completedAt: string
}

export function createApprovedToolWorkManifest(input: {
  workspaceId: string
  approvedSnapshot: ApprovedPlanSnapshot
  creditReservationId: string
}): ApprovedToolWorkManifest {
  const { approvedSnapshot } = input
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.workspaceId.trim()) blockers.push('Approved tool-work manifest requires a non-empty workspace ID.')
  if (!input.creditReservationId.trim()) blockers.push('Approved tool-work manifest requires a non-empty credit reservation ID.')
  if (!approvedSnapshot.id.trim()) blockers.push('Approved tool-work manifest requires a non-empty approved snapshot ID.')
  if (!approvedSnapshot.projectId.trim()) blockers.push('Approved tool-work manifest requires a non-empty project ID.')
  if (!approvedSnapshot.creditEstimateId.trim()) blockers.push('Approved tool-work manifest requires a non-empty credit estimate ID.')
  if (!approvedSnapshot.editingAgentExecutionPlan) {
    blockers.push('Approved tool-work manifest requires the frozen editing-agent execution graph.')
  } else if (approvedSnapshot.editingAgentExecutionPlan.workItems.length < 1) {
    blockers.push('Approved tool-work manifest requires at least one approved execution work item.')
  }
  const segmentIds = idSet(approvedSnapshot.segments)
  const assetPlanItemIds = new Set([
    ...ids(approvedSnapshot.visualAssetPlan),
    ...ids(approvedSnapshot.visualAssetPlanDomain),
  ])
  const rendererLayerIds = new Set([
    ...ids(approvedSnapshot.rendererLayers),
    ...ids(approvedSnapshot.rendererLayersDomain),
  ])
  const renderStrategyItemIds = idSet(approvedSnapshot.renderStrategyPlan?.items)
  const toolStrategyItemIds = idSet(approvedSnapshot.toolStrategyPlan?.items)
  const workItemIds = idSet(approvedSnapshot.editingAgentExecutionPlan?.workItems)

  collectDuplicateIdBlockers('tool strategy item', approvedSnapshot.toolStrategyPlan?.items, blockers)
  collectDuplicateIdBlockers('render strategy item', approvedSnapshot.renderStrategyPlan?.items, blockers)
  collectDuplicateIdBlockers('editing work item', approvedSnapshot.editingAgentExecutionPlan?.workItems, blockers)
  collectDuplicateIdBlockers('editing asset manifest item', approvedSnapshot.editingAgentExecutionPlan?.assetManifest, blockers)
  validateToolStrategyStructure({
    approvedSnapshot,
    segmentIds,
    assetPlanItemIds,
    renderStrategyItemIds,
    blockers,
    warnings,
  })
  validateExecutionGraphLinks({
    approvedSnapshot,
    segmentIds,
    assetPlanItemIds,
    rendererLayerIds,
    toolStrategyItemIds,
    workItemIds,
    blockers,
    warnings,
  })

  const coreOperationIds: Record<ApprovedCoreToolOperationKind, string> = {
    source_media_private_process: approvedCoreToolOperationId(approvedSnapshot.id, 'source_media_private_process'),
    processed_media_private_qa_probe: approvedCoreToolOperationId(approvedSnapshot.id, 'processed_media_private_qa_probe'),
    final_private_render: approvedCoreToolOperationId(approvedSnapshot.id, 'final_private_render'),
    final_delivery_private_qa_probe: approvedCoreToolOperationId(approvedSnapshot.id, 'final_delivery_private_qa_probe'),
  }
  const operations: ApprovedToolWorkOperation[] = [
    createCoreOperation({
      approvedSnapshot,
      operationId: coreOperationIds.source_media_private_process,
      operationKind: 'source_media_private_process',
      toolId: 'ffmpeg',
      label: 'Process approved source ranges into private review media',
      segmentIds: [...segmentIds],
      assetPlanItemIds: [...assetPlanItemIds],
      rendererLayerIds: [],
      workItemIds: workIdsByType(approvedSnapshot, ['prepare_source_trim', 'process_video_asset']),
      settings: {
        approvedSourceRangeRequired: true,
        privateOutputOnly: true,
        publicArtifactAllowed: false,
        fitMode: 'contain',
      },
      qaChecks: ['approved source order', 'approved trim range', 'private artifact checksum'],
    }),
    createCoreOperation({
      approvedSnapshot,
      operationId: coreOperationIds.processed_media_private_qa_probe,
      operationKind: 'processed_media_private_qa_probe',
      toolId: 'ffprobe',
      label: 'Probe private processed media before preview assembly',
      segmentIds: [...segmentIds],
      assetPlanItemIds: [...assetPlanItemIds],
      rendererLayerIds: [],
      workItemIds: workIdsByType(approvedSnapshot, ['run_asset_qa']),
      settings: {
        requireVideoStream: true,
        requirePositiveDuration: true,
        privateArtifactOnly: true,
      },
      qaChecks: ['video stream present', 'duration present', 'artifact checksum and byte size match'],
    }),
    createCoreOperation({
      approvedSnapshot,
      operationId: coreOperationIds.final_private_render,
      operationKind: 'final_private_render',
      toolId: 'ffmpeg',
      label: 'Render the approved private review timeline',
      segmentIds: [...segmentIds],
      assetPlanItemIds: [...assetPlanItemIds],
      rendererLayerIds: [...rendererLayerIds],
      workItemIds: workIdsByType(approvedSnapshot, ['render_remotion_preview', 'render_final_export']),
      settings: {
        approvedTimingRequired: true,
        approvedCaptionTimingRequired: true,
        approvedColorPlanOnly: true,
        voiceFirstAudioPolish: true,
        privateOutputOnly: true,
      },
      qaChecks: ['approved timing trace', 'approved caption trace', 'private final artifact checksum'],
    }),
    createCoreOperation({
      approvedSnapshot,
      operationId: coreOperationIds.final_delivery_private_qa_probe,
      operationKind: 'final_delivery_private_qa_probe',
      toolId: 'ffprobe',
      label: 'Probe the private final render for delivery QA',
      segmentIds: [...segmentIds],
      assetPlanItemIds: [],
      rendererLayerIds: [...rendererLayerIds],
      workItemIds: workIdsByType(approvedSnapshot, ['run_final_qa']),
      settings: {
        requireVideoStream: true,
        requireAudioStream: true,
        requireFrameDimensions: true,
        requirePositiveDuration: true,
        privateInternalDeliveryOnly: true,
      },
      qaChecks: ['video and audio streams present', 'frame dimensions present', 'duration matches approved timeline'],
    }),
  ]

  for (const item of approvedSnapshot.toolStrategyPlan?.items ?? []) {
    operations.push(...createToolStrategyOperations(item, approvedSnapshot, blockers, warnings))
  }
  operations.push(...createProfessionalAdapterOperations(approvedSnapshot, blockers, warnings))

  const duplicateOperationIds = duplicateStrings(operations.map((operation) => operation.operationId))
  if (duplicateOperationIds.length > 0) {
    blockers.push(`Duplicate approved tool operation IDs: ${duplicateOperationIds.join(', ')}.`)
  }

  const normalizedBlockers = unique(blockers)
  const blocked = normalizedBlockers.length > 0
  const normalizedOperations = operations.map((operation) => blocked
    ? { ...operation, disposition: 'blocked_by_manifest_validation' as const }
    : operation)
  const degradedOperationCount = normalizedOperations.filter((operation) => operation.disposition === 'degraded_planning_only').length
  const status: ApprovedToolWorkManifestStatus = blocked
    ? 'blocked_structural_inconsistency'
    : degradedOperationCount > 0
      ? 'ready_for_private_internal_preview_with_degraded_plans'
      : 'ready_for_private_internal_execution'
  if (!approvedSnapshot.settingsSnapshot?.edit_level && !approvedSnapshot.compiledIntent?.resolvedSettings.editLevel) {
    warnings.push('The approved snapshot omits an edit level; nonbillable internal cost evidence uses the conservative Normal profile.')
  }
  const payload = {
    manifestVersion: APPROVED_TOOL_WORK_MANIFEST_VERSION,
    immutable: true as const,
    source: 'approved_plan_snapshot_server_reconciliation' as const,
    workspaceId: input.workspaceId,
    projectId: approvedSnapshot.projectId,
    editSessionId: approvedSnapshot.editSessionId,
    approvedPlanSnapshotId: approvedSnapshot.id,
    creditEstimateId: approvedSnapshot.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: canonicalEditLevel(approvedSnapshot),
    executionScope: 'private_internal_only' as const,
    status,
    operations: normalizedOperations,
    coreOperationIds,
    reconciliation: {
      toolStrategyItemCount: approvedSnapshot.toolStrategyPlan?.items.length ?? 0,
      professionalSkillCount: approvedSnapshot.professionalSkillPlan?.selectedSkills.length ?? 0,
      professionalAdapterCount: normalizedOperations.filter((operation) => operation.source === 'professional_skill_plan').length,
      renderStrategyItemCount: approvedSnapshot.renderStrategyPlan?.items.length ?? 0,
      colorOperationCount: countColorOperations(approvedSnapshot),
      audioOperationCount: countAudioOperations(approvedSnapshot),
      workItemCount: approvedSnapshot.editingAgentExecutionPlan?.workItems.length ?? 0,
      segmentCount: segmentIds.size,
      assetPlanItemCount: assetPlanItemIds.size,
      rendererLayerCount: rendererLayerIds.size,
      executableOperationCount: normalizedOperations.filter((operation) => operation.disposition === 'executable_private_internal').length,
      degradedOperationCount,
      blockedOperationCount: normalizedOperations.filter((operation) => operation.disposition === 'blocked_by_manifest_validation').length,
    },
    blockers: normalizedBlockers,
    warnings: unique([
      ...warnings,
      ...(degradedOperationCount > 0
        ? [`${degradedOperationCount} approved future adapter/tool operation(s) remain planning-only and cannot claim media execution.`]
        : []),
    ]),
    externalReleaseBlocks: [
      'This manifest authorizes private internal evidence only; public artifact URL issuance remains blocked.',
      'External beta and production require deployment, security, storage, cost, legal, and operational evidence.',
      'Tool-cost evidence is nonbillable internal evidence and never mutates wallets or settles charges.',
    ],
  }
  const fingerprintSha256 = sha256(stableStringify(payload))
  const manifest: ApprovedToolWorkManifest = {
    manifestId: `approved-tool-work-manifest:${safeId(approvedSnapshot.id)}:${fingerprintSha256.slice(0, 16)}`,
    fingerprintSha256,
    ...payload,
  }
  return deepFreeze(manifest)
}

export function approvedToolWorkManifestRef(manifest: ApprovedToolWorkManifest): ApprovedToolWorkManifestRef {
  return {
    manifestId: manifest.manifestId,
    manifestVersion: manifest.manifestVersion,
    fingerprintSha256: manifest.fingerprintSha256,
    approvedPlanSnapshotId: manifest.approvedPlanSnapshotId,
    creditReservationId: manifest.creditReservationId,
    immutable: true,
  }
}

export function approvedCoreToolOperationId(
  approvedPlanSnapshotId: string,
  operationKind: ApprovedCoreToolOperationKind,
): string {
  const toolId = operationKind === 'source_media_private_process' || operationKind === 'final_private_render'
    ? 'ffmpeg'
    : 'ffprobe'
  return `tool-work:${safeId(approvedPlanSnapshotId)}:core:${toolId}:${operationKind}`
}

export function requireApprovedCoreToolOperation(
  manifest: ApprovedToolWorkManifest,
  operationKind: ApprovedCoreToolOperationKind,
): ApprovedToolWorkOperation {
  if (manifest.status === 'blocked_structural_inconsistency') {
    throw new Error(`Approved tool-work manifest is blocked: ${manifest.blockers.join(' ')}`)
  }
  const operationId = manifest.coreOperationIds[operationKind]
  const operation = manifest.operations.find((candidate) => candidate.operationId === operationId)
  if (!operation || operation.source !== 'core_private_pipeline' || operation.disposition !== 'executable_private_internal') {
    throw new Error(`Approved core tool operation ${operationKind} is missing or not executable for private internal work.`)
  }
  return operation
}

export function requireApprovedExecutableToolStrategyOperation(
  manifest: ApprovedToolWorkManifest,
  operationId: string,
  expectedToolId?: ProductionToolId,
): ApprovedToolWorkOperation {
  if (manifest.status === 'blocked_structural_inconsistency') {
    throw new Error(`Approved tool-work manifest is blocked: ${manifest.blockers.join(' ')}`)
  }
  const operation = manifest.operations.find((candidate) => candidate.operationId === operationId)
  if (
    !operation ||
    operation.source !== 'tool_strategy_plan' ||
    operation.operationKind !== 'approved_tool_strategy' ||
    operation.disposition !== 'executable_private_internal'
  ) {
    throw new Error(`Approved tool-strategy operation ${operationId} is missing or not executable for private internal work.`)
  }
  if (expectedToolId && operation.toolId !== expectedToolId) {
    throw new Error(`Approved tool-strategy operation ${operationId} expected ${expectedToolId}, received ${operation.toolId}.`)
  }
  return operation
}

export function createApprovedToolOperationEvidence(input: {
  manifest: ApprovedToolWorkManifest
  operationKind: ApprovedCoreToolOperationKind
  operationInstanceId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  outputArtifactId: string
  outputSha256?: string
  outputByteSize?: number
  outputSeconds?: number
  megapixelFrames?: number
  elapsedMilliseconds?: number
  mediaProcessingExecuted: boolean
  mediaBytesProcessed: boolean
  mediaProbe?: ApprovedToolOperationEvidence['mediaProbe']
  qaChecks: string[]
  completedAt: string
}): ApprovedToolOperationEvidence {
  const operation = requireApprovedCoreToolOperation(input.manifest, input.operationKind)
  if (input.workspaceId !== input.manifest.workspaceId || input.projectId !== input.manifest.projectId) {
    throw new Error('Approved tool-operation evidence workspace/project scope does not match its immutable manifest.')
  }
  if (input.creditReservationId !== input.manifest.creditReservationId) {
    throw new Error('Approved tool-operation evidence credit reservation does not match its immutable manifest.')
  }
  if (operation.toolId !== 'ffmpeg' && operation.toolId !== 'ffprobe') {
    throw new Error(`Core private operation ${operation.operationId} must use FFmpeg or ffprobe.`)
  }
  if (operation.toolId === 'ffmpeg' && (!input.mediaProcessingExecuted || !input.mediaBytesProcessed)) {
    throw new Error(`FFmpeg operation ${operation.operationId} must only emit evidence after actual private media bytes were processed.`)
  }
  if (operation.toolId === 'ffprobe' && (input.mediaProcessingExecuted || input.mediaBytesProcessed)) {
    throw new Error(`ffprobe operation ${operation.operationId} is inspection-only and cannot claim media processing.`)
  }
  if (!input.operationInstanceId.trim() || !input.outputArtifactId.trim()) {
    throw new Error(`Approved tool operation ${operation.operationId} requires non-empty operation-instance and output-artifact IDs.`)
  }
  if (!input.outputSha256 || !/^[a-f0-9]{64}$/i.test(input.outputSha256)) {
    throw new Error(`Approved tool operation ${operation.operationId} requires a valid output SHA-256 artifact proof.`)
  }
  if (!Number.isFinite(input.outputByteSize) || (input.outputByteSize ?? 0) <= 0) {
    throw new Error(`Approved tool operation ${operation.operationId} requires a positive output byte-size artifact proof.`)
  }
  if (operation.toolId === 'ffmpeg' && (!Number.isFinite(input.outputSeconds) || (input.outputSeconds ?? 0) <= 0)) {
    throw new Error(`FFmpeg operation ${operation.operationId} requires a positive output duration proof.`)
  }
  if (operation.toolId === 'ffprobe' && !input.mediaProbe) {
    throw new Error(`ffprobe operation ${operation.operationId} requires a completed media-probe payload.`)
  }
  const operationEvidenceDigest = sha256(stableStringify({
    manifestFingerprintSha256: input.manifest.fingerprintSha256,
    creditReservationId: input.manifest.creditReservationId,
    operationInstanceId: input.operationInstanceId,
  }))
  const idempotencyKey = `tool-cost-evidence:${operationEvidenceDigest}`
  const usage = operation.toolId === 'ffmpeg'
    ? {
        sourceKind: 'deterministic_renderer' as const,
        deterministicRenderer: {
          requestCount: 1,
          outputSeconds: Math.max(0, input.outputSeconds ?? 0),
          megapixelFrames: Math.max(0, input.megapixelFrames ?? 0),
          computeLevel: 'standard' as ToolRuntimeComputeLevel,
        },
        riskLevel: 'low' as const,
      }
    : {
        sourceKind: 'infrastructure_runtime' as const,
        runtime: {
          wallTimeMilliseconds: Math.max(1, Math.round(input.elapsedMilliseconds ?? 1)),
          renderSeconds: 0,
          vcpuCount: 1,
          memoryGib: 0.25,
          gpuCount: 0,
          computeLevel: 'economy' as ToolRuntimeComputeLevel,
        },
        riskLevel: 'low' as const,
      }
  const costResult = emitProductionToolCostEvent({
    toolId: operation.toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.manifest.approvedPlanSnapshotId,
    creditEstimateId: input.manifest.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: input.manifest.productEditLevel,
    usage,
    idempotencyKey,
    billableToUser: false,
    nonBillableReason: 'private_internal_test_execution_no_wallet_settlement',
    metadata: {
      operationId: operation.operationId,
      operationInstanceId: input.operationInstanceId,
      outputArtifactId: input.outputArtifactId,
      actualPrivateInternalWorkCompleted: true,
      mediaProcessingExecuted: input.mediaProcessingExecuted,
      privateArtifact: true,
      publicArtifact: false,
    },
    store: approvedToolOperationCostEvidenceStore,
  })
  if (!costResult.ok) {
    throw new Error(`Unable to create nonbillable internal tool-cost evidence: ${costResult.error.message}`)
  }
  const event = costResult.data.event
  return deepFreeze({
    evidenceVersion: APPROVED_TOOL_OPERATION_EVIDENCE_VERSION,
    evidenceId: `tool-operation-evidence:${operationEvidenceDigest}`,
    operationId: operation.operationId,
    operationInstanceId: input.operationInstanceId,
    manifestRef: approvedToolWorkManifestRef(input.manifest),
    toolId: operation.toolId,
    status: operation.toolId === 'ffmpeg'
      ? 'actual_private_media_work_completed'
      : 'actual_private_media_qa_completed',
    actualToolExecuted: true,
    privateInternalRuntimeExecuted: true,
    productionRuntimeExecuted: false,
    mediaProcessingExecuted: input.mediaProcessingExecuted,
    mediaBytesProcessed: input.mediaBytesProcessed,
    backendOwned: true,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    outputArtifactId: input.outputArtifactId,
    ...(input.outputSha256 ? { outputSha256: input.outputSha256 } : {}),
    ...(typeof input.outputByteSize === 'number' ? { outputByteSize: input.outputByteSize } : {}),
    ...(input.mediaProbe ? { mediaProbe: input.mediaProbe } : {}),
    qaChecks: unique(input.qaChecks),
    costEvidence: {
      source: 'mock_safe_nonbillable_internal_tool_cost_event',
      eventId: event.id,
      idempotencyKey,
      actualInternalCostMicros: event.actualInternalCostMicros,
      actualInternalCostCents: event.actualInternalCostCents,
      toolCostCredits: event.toolCostCredits,
      billableToUser: false,
      serviceFeeIncluded: false,
      nonBillableReason: 'private_internal_test_execution_no_wallet_settlement',
      walletMutationExecuted: false,
      settlementExecuted: false,
      rateCardVersion: event.rateCardVersion,
    },
    completedAt: input.completedAt,
  })
}

export function createApprovedPrivateArtifactToolOperationEvidence(input: {
  manifest: ApprovedToolWorkManifest
  operationId: string
  operationInstanceId: string
  workspaceId: string
  projectId: string
  creditReservationId: string
  outputArtifactId: string
  outputSha256: string
  outputByteSize: number
  sourceSpecSha256: string
  elapsedMilliseconds: number
  imageProbe: NonNullable<ApprovedToolOperationEvidence['imageProbe']>
  qaChecks: string[]
  completedAt: string
}): ApprovedToolOperationEvidence {
  const operation = requireApprovedExecutableToolStrategyOperation(input.manifest, input.operationId, 'playwright')
  if (input.workspaceId !== input.manifest.workspaceId || input.projectId !== input.manifest.projectId) {
    throw new Error('Approved private artifact evidence workspace/project scope does not match its immutable manifest.')
  }
  if (input.creditReservationId !== input.manifest.creditReservationId) {
    throw new Error('Approved private artifact evidence credit reservation does not match its immutable manifest.')
  }
  if (!input.operationInstanceId.trim() || !input.outputArtifactId.trim()) {
    throw new Error(`Approved tool operation ${operation.operationId} requires non-empty operation-instance and output-artifact IDs.`)
  }
  if (!/^[a-f0-9]{64}$/i.test(input.outputSha256) || !/^[a-f0-9]{64}$/i.test(input.sourceSpecSha256)) {
    throw new Error(`Approved tool operation ${operation.operationId} requires valid output and source-spec SHA-256 proofs.`)
  }
  if (!Number.isFinite(input.outputByteSize) || input.outputByteSize <= 0) {
    throw new Error(`Approved tool operation ${operation.operationId} requires a positive output byte-size artifact proof.`)
  }
  if (
    input.imageProbe.mimeType !== 'image/png' ||
    input.imageProbe.pngSignatureValid !== true ||
    input.imageProbe.width !== 640 ||
    input.imageProbe.height !== 360 ||
    input.imageProbe.sourceSpecSha256 !== input.sourceSpecSha256 ||
    input.imageProbe.networkRequestCount !== 0
  ) {
    throw new Error(`Approved Playwright operation ${operation.operationId} requires validated fixed-size zero-network PNG evidence.`)
  }
  const operationEvidenceDigest = sha256(stableStringify({
    manifestFingerprintSha256: input.manifest.fingerprintSha256,
    operationId: operation.operationId,
    operationInstanceId: input.operationInstanceId,
    sourceSpecSha256: input.sourceSpecSha256,
    outputSha256: input.outputSha256,
  }))
  const idempotencyKey = `tool-cost-evidence:${operationEvidenceDigest}`
  const costResult = emitProductionToolCostEvent({
    toolId: operation.toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedPlanSnapshotId: input.manifest.approvedPlanSnapshotId,
    creditEstimateId: input.manifest.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: input.manifest.productEditLevel,
    usage: {
      sourceKind: 'infrastructure_runtime',
      runtime: {
        wallTimeMilliseconds: Math.max(1, Math.round(input.elapsedMilliseconds)),
        renderSeconds: 0,
        vcpuCount: 1,
        memoryGib: 1,
        gpuCount: 0,
        computeLevel: 'economy',
      },
      riskLevel: 'low',
    },
    idempotencyKey,
    billableToUser: false,
    nonBillableReason: 'private_internal_test_execution_no_wallet_settlement',
    metadata: {
      operationId: operation.operationId,
      operationInstanceId: input.operationInstanceId,
      outputArtifactId: input.outputArtifactId,
      sourceSpecSha256: input.sourceSpecSha256,
      actualPrivateInternalWorkCompleted: true,
      mediaProcessingExecuted: false,
      artifactBytesProduced: true,
      networkRequestCount: 0,
      privateArtifact: true,
      publicArtifact: false,
    },
    store: approvedToolOperationCostEvidenceStore,
  })
  if (!costResult.ok) {
    throw new Error(`Unable to create nonbillable internal tool-cost evidence: ${costResult.error.message}`)
  }
  const event = costResult.data.event
  return deepFreeze({
    evidenceVersion: APPROVED_TOOL_OPERATION_EVIDENCE_VERSION,
    evidenceId: `tool-operation-evidence:${operationEvidenceDigest}`,
    operationId: operation.operationId,
    operationInstanceId: input.operationInstanceId,
    manifestRef: approvedToolWorkManifestRef(input.manifest),
    toolId: operation.toolId,
    status: 'actual_private_artifact_work_completed',
    actualToolExecuted: true,
    privateInternalRuntimeExecuted: true,
    productionRuntimeExecuted: false,
    mediaProcessingExecuted: false,
    mediaBytesProcessed: false,
    artifactBytesProduced: true,
    backendOwned: true,
    privateArtifact: true,
    publicArtifact: false,
    signedUrl: null,
    outputArtifactId: input.outputArtifactId,
    outputSha256: input.outputSha256,
    outputByteSize: input.outputByteSize,
    imageProbe: stableJsonValue(input.imageProbe) as NonNullable<ApprovedToolOperationEvidence['imageProbe']>,
    qaChecks: unique(input.qaChecks),
    costEvidence: {
      source: 'mock_safe_nonbillable_internal_tool_cost_event',
      eventId: event.id,
      idempotencyKey,
      actualInternalCostMicros: event.actualInternalCostMicros,
      actualInternalCostCents: event.actualInternalCostCents,
      toolCostCredits: event.toolCostCredits,
      billableToUser: false,
      serviceFeeIncluded: false,
      nonBillableReason: 'private_internal_test_execution_no_wallet_settlement',
      walletMutationExecuted: false,
      settlementExecuted: false,
      rateCardVersion: event.rateCardVersion,
    },
    completedAt: input.completedAt,
  })
}

function createCoreOperation(input: {
  approvedSnapshot: ApprovedPlanSnapshot
  operationId: string
  operationKind: ApprovedCoreToolOperationKind
  toolId: 'ffmpeg' | 'ffprobe'
  label: string
  segmentIds: string[]
  assetPlanItemIds: string[]
  rendererLayerIds: string[]
  workItemIds: string[]
  settings: Record<string, unknown>
  qaChecks: string[]
}): ApprovedToolWorkOperation {
  const profile = requiredProfile(input.toolId)
  const qaPolicy = getToolQAPolicy(input.toolId)
  return {
    operationId: input.operationId,
    operationKind: input.operationKind,
    source: 'core_private_pipeline',
    toolId: input.toolId,
    label: input.label,
    disposition: 'executable_private_internal',
    backendOwned: true,
    privateArtifactsOnly: true,
    publicExecutionAllowed: false,
    productionExecutionAllowed: false,
    approvedSnapshotRequired: true,
    creditReservationRequired: true,
    segmentIds: unique(input.segmentIds),
    assetPlanItemIds: unique(input.assetPlanItemIds),
    rendererLayerIds: unique(input.rendererLayerIds),
    sourceReferences: emptySourceReferences({ workItemIds: input.workItemIds }),
    settings: stableJsonValue(input.settings) as Record<string, unknown>,
    inputTypes: [...profile.inputTypes],
    outputTypes: [...profile.outputTypes],
    runner: {
      runnerId: `backend-private-${input.toolId}-binary-runner`,
      workerType: profile.workerType,
      executionMode: profile.executionMode,
      binaryOrPackage: input.toolId,
      actualMediaOperationImplemented: true,
      readinessEvidenceRequired: true,
    },
    qa: {
      gateTypes: [...qaPolicy.gateTypes],
      requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
      requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
      approvedPlanChecks: unique(input.qaChecks),
    },
    fallback: fallbackForTool(input.toolId),
    cost: nonbillableCostPolicy(),
    warnings: [
      'Executable means bounded authenticated private-internal work only; it does not authorize public delivery or production runtime.',
    ],
  }
}

function createToolStrategyOperations(
  item: ToolStrategyPlanItem,
  approvedSnapshot: ApprovedPlanSnapshot,
  blockers: string[],
  warnings: string[],
): ApprovedToolWorkOperation[] {
  return unique(item.selectedToolIds).flatMap((rawToolId): ApprovedToolWorkOperation[] => {
    if (rawToolId === 'custom') {
      warnings.push(`Tool strategy item ${item.id} references a custom tool; it remains degraded planning-only until a server contract exists.`)
      return []
    }
    if (!isProductionToolId(rawToolId)) {
      blockers.push(`Tool strategy item ${item.id} references unknown production tool ${rawToolId}.`)
      return []
    }
    const profile = requiredProfile(rawToolId)
    const qaPolicy = getToolQAPolicy(rawToolId)
    const matchingSteps = item.steps.filter((step) => step.toolId === rawToolId)
    const settings = Object.fromEntries(matchingSteps.flatMap((step) => step.settings.map((setting) => [setting.settingId, stableJsonValue(setting.value)])))
    const rendererLayerIds = rendererLayerIdsForToolStrategyItem(approvedSnapshot, item.id)
    const workItemIds = workItemsForToolStrategyItem(approvedSnapshot, item.id)
    const executablePrivatePlaywrightCapture = rawToolId === 'playwright' && isExecutablePrivatePlaywrightCaptureStrategy({
      item,
      approvedSnapshot,
      settings,
      matchingSteps,
      rendererLayerIds,
      workItemIds,
    })
    return [{
      operationId: `tool-work:${safeId(approvedSnapshot.id)}:strategy:${safeId(item.id)}:${rawToolId}`,
      operationKind: 'approved_tool_strategy',
      source: 'tool_strategy_plan',
      toolId: rawToolId,
      label: item.label,
      disposition: executablePrivatePlaywrightCapture ? 'executable_private_internal' : 'degraded_planning_only',
      backendOwned: true,
      privateArtifactsOnly: true,
      publicExecutionAllowed: false,
      productionExecutionAllowed: false,
      approvedSnapshotRequired: true,
      creditReservationRequired: true,
      segmentIds: item.segmentId ? [item.segmentId] : [],
      assetPlanItemIds: item.assetPlanItemId ? [item.assetPlanItemId] : [],
      rendererLayerIds,
      sourceReferences: emptySourceReferences({
        toolStrategyItemIds: [item.id],
        toolStrategyStepIds: matchingSteps.map((step) => step.id),
        renderStrategyItemIds: item.renderStrategyItemId ? [item.renderStrategyItemId] : [],
        workItemIds,
        colorOperationIds: colorOperationIdsForTool(approvedSnapshot, rawToolId),
        audioOperationIds: audioOperationIdsForTool(approvedSnapshot, rawToolId),
      }),
      settings,
      inputTypes: executablePrivatePlaywrightCapture ? ['html', 'json_data'] : [...profile.inputTypes],
      outputTypes: executablePrivatePlaywrightCapture ? ['image_asset', 'qa_report'] : [...profile.outputTypes],
      runner: {
        runnerId: executablePrivatePlaywrightCapture
          ? 'backend-private-playwright-approved-html-capture-runner'
          : `approved-planned-${rawToolId}-runner`,
        workerType: profile.workerType,
        executionMode: profile.executionMode,
        binaryOrPackage: rawToolId,
        actualMediaOperationImplemented: executablePrivatePlaywrightCapture,
        readinessEvidenceRequired: true,
      },
      qa: {
        gateTypes: [...qaPolicy.gateTypes],
        requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
        requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
        approvedPlanChecks: unique([
          ...item.qaChecks,
          ...matchingSteps.flatMap((step) => step.qaChecks),
        ]),
      },
      fallback: fallbackForTool(rawToolId),
      cost: nonbillableCostPolicy(),
      warnings: executablePrivatePlaywrightCapture
        ? [
            'Executable means fixed-template, zero-network, private-internal Playwright artifact work only.',
            'URL navigation, raw HTML/JS/CSS, credentials, public artifacts, staging, external beta, and production remain blocked.',
          ]
        : [
            `Approved strategy status ${item.status}; no media processing is claimed for this planned operation.`,
            'A server-owned operation runner, private artifact contract, QA result, and actual-work cost evidence are still required.',
          ],
    }]
  })
}

function isExecutablePrivatePlaywrightCaptureStrategy(input: {
  item: ToolStrategyPlanItem
  approvedSnapshot: ApprovedPlanSnapshot
  settings: Record<string, unknown>
  matchingSteps: ToolStrategyPlanItem['steps']
  rendererLayerIds: string[]
  workItemIds: string[]
}): boolean {
  const approvedSettingIds = new Set([
    'captureSourceKind',
    'captureTemplateId',
    'captureAuthorizationConfirmed',
    'captureTextTokens',
    'viewportWidth',
    'viewportHeight',
    'deviceScaleFactor',
  ])
  const blockedStrategyStatuses = new Set(['blocked', 'future_only', 'needs_license_review', 'not_available_in_tier'])
  const authorizationSetting = input.matchingSteps
    .flatMap((step) => step.settings)
    .find((setting) => setting.settingId === 'captureAuthorizationConfirmed')
  if (
    input.item.chainId !== 'browser_capture_chain' ||
    input.item.primaryToolId !== 'playwright' ||
    input.settings.captureSourceKind !== 'approved_internal_html_v1' ||
    input.settings.captureTemplateId !== 'reeditpro_private_capture_card_v1' ||
    input.settings.captureAuthorizationConfirmed !== true ||
    authorizationSetting?.value !== true ||
    authorizationSetting?.source !== 'user_request' ||
    blockedStrategyStatuses.has(input.item.status) ||
    input.matchingSteps.some((step) => blockedStrategyStatuses.has(step.status)) ||
    input.settings.url ||
    input.settings.rawHtml ||
    input.settings.html ||
    input.settings.javascript ||
    input.settings.css ||
    input.settings.authHeaders ||
    input.settings.cookies ||
    Object.keys(input.settings).some((settingId) => !approvedSettingIds.has(settingId)) ||
    !isApprovedCaptureTextTokenShape(input.settings.captureTextTokens) ||
    !input.item.segmentId ||
    !input.item.assetPlanItemId ||
    input.rendererLayerIds.length < 1 ||
    input.workItemIds.length < 1
  ) return false

  const assetExists = [
    ...(input.approvedSnapshot.visualAssetPlan ?? []),
    ...(input.approvedSnapshot.visualAssetPlanDomain ?? []),
  ].some((asset) => asset.id === input.item.assetPlanItemId)
  if (!assetExists) return false

  return (input.approvedSnapshot.editingAgentExecutionPlan?.workItems ?? []).some((workItem) =>
    input.workItemIds.includes(workItem.id) &&
    workItem.workItemType === 'capture_browser_asset' &&
    workItem.linkedToolStrategyItemIds.includes(input.item.id) &&
    workItem.linkedSegmentIds.includes(input.item.segmentId ?? '') &&
    workItem.linkedVisualAssetPlanItemIds.includes(input.item.assetPlanItemId ?? '') &&
    workItem.linkedRendererLayerIds.some((layerId) => input.rendererLayerIds.includes(layerId)) &&
    !['blocked', 'failed', 'canceled', 'qa_failed', 'fallback_needed'].includes(workItem.status),
  )
}

function isApprovedCaptureTextTokenShape(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  return keys.length === 4 &&
    keys.every((key) => ['eyebrow', 'title', 'body', 'callout'].includes(key)) &&
    ['eyebrow', 'title', 'body', 'callout'].every((key) => typeof record[key] === 'string' && (record[key] as string).trim().length > 0)
}

function createProfessionalAdapterOperations(
  approvedSnapshot: ApprovedPlanSnapshot,
  blockers: string[],
  warnings: string[],
): ApprovedToolWorkOperation[] {
  const skillPlan = approvedSnapshot.professionalSkillPlan
  if (!skillPlan) return []
  const byCanonicalTool = new Map<ProductionToolId, {
    names: string[]
    skillIds: string[]
    backendIntentIds: string[]
    qaChecks: string[]
    contractMissing: boolean
  }>()
  const adapterNames = unique([
    ...skillPlan.hiddenAdapterToolNames,
    ...skillPlan.selectedSkills.flatMap((skill) => skill.hiddenAdapterToolNames),
    ...skillPlan.backendIntents.flatMap((intent) => intent.hiddenAdapterToolNames),
  ])
  for (const adapterName of adapterNames) {
    const contract = resolveProfessionalToolAdapterContract(adapterName)
    if (!contract) {
      if (!isProductionToolId(adapterName)) {
        blockers.push(`Professional skill plan references adapter ${adapterName} without a canonical server contract.`)
        continue
      }
      warnings.push(`Professional skill plan references registry tool ${adapterName} without an adapter contract; it remains explicitly degraded planning-only.`)
    }
    const canonicalToolId = contract?.canonicalToolId ?? adapterName as ProductionToolId
    const current = byCanonicalTool.get(canonicalToolId) ?? {
      names: [],
      skillIds: [],
      backendIntentIds: [],
      qaChecks: [],
      contractMissing: !contract,
    }
    current.names.push(adapterName)
    current.skillIds.push(...skillPlan.selectedSkills
      .filter((skill) => skill.hiddenAdapterToolNames.includes(adapterName))
      .map((skill) => skill.skillId))
    current.backendIntentIds.push(...skillPlan.backendIntents
      .filter((intent) => intent.hiddenAdapterToolNames.includes(adapterName))
      .map((intent) => intent.intentId))
    current.qaChecks.push(...(contract?.qaGates ?? []), ...skillPlan.qaGateSummary)
    current.contractMissing = current.contractMissing || !contract
    byCanonicalTool.set(canonicalToolId, current)
  }
  return [...byCanonicalTool.entries()].map(([toolId, trace]) => {
    const contract = resolveProfessionalToolAdapterContract(trace.names[0])
    const profile = requiredProfile(toolId)
    const qaPolicy = getToolQAPolicy(toolId)
    if (!contract || !contract.productReady) {
      warnings.push(`Professional adapter ${toolId} is reconciled but remains degraded until its product-readiness evidence is complete.`)
    }
    return {
      operationId: `tool-work:${safeId(approvedSnapshot.id)}:adapter:${toolId}`,
      operationKind: 'approved_professional_adapter',
      source: 'professional_skill_plan',
      toolId,
      label: contract?.userFacingActivity ?? `Prepare approved ${profile.displayName} work`,
      disposition: 'degraded_planning_only',
      backendOwned: true,
      privateArtifactsOnly: true,
      publicExecutionAllowed: false,
      productionExecutionAllowed: false,
      approvedSnapshotRequired: true,
      creditReservationRequired: true,
      segmentIds: [],
      assetPlanItemIds: [],
      rendererLayerIds: [],
      sourceReferences: emptySourceReferences({
        professionalSkillIds: trace.skillIds,
        backendIntentIds: trace.backendIntentIds,
      }),
      settings: {
        adapterContractNames: unique(trace.names),
        executionBoundary: 'backend_approved_after_snapshot',
      },
      inputTypes: [...profile.inputTypes],
      outputTypes: [...profile.outputTypes],
      runner: {
        runnerId: `professional-adapter-${toolId}-runner`,
        workerType: contract?.workerType ?? profile.workerType,
        executionMode: profile.executionMode,
        binaryOrPackage: toolId,
        actualMediaOperationImplemented: false,
        readinessEvidenceRequired: true,
      },
      qa: {
        gateTypes: [...qaPolicy.gateTypes],
        requiredBeforePreview: [...qaPolicy.requiredBeforePreview],
        requiredBeforeFinalExport: [...qaPolicy.requiredBeforeFinalExport],
        approvedPlanChecks: unique(trace.qaChecks),
      },
      fallback: fallbackForTool(toolId),
      cost: nonbillableCostPolicy(),
      warnings: unique([
        ...(contract?.blockerNotes ?? []),
        ...(contract?.productReadiness.blockers ?? []),
        ...(trace.contractMissing ? ['No professional adapter contract exists; registry metadata is planning-only and cannot execute media.'] : []),
        'Package/import/readiness probes are not media processing and are not represented as actual tool operation evidence.',
      ]),
    }
  })
}

function validateToolStrategyStructure(input: {
  approvedSnapshot: ApprovedPlanSnapshot
  segmentIds: Set<string>
  assetPlanItemIds: Set<string>
  renderStrategyItemIds: Set<string>
  blockers: string[]
  warnings: string[]
}): void {
  const plan = input.approvedSnapshot.toolStrategyPlan
  if (!plan) return
  const selectedAcrossItems = new Set(plan.items.flatMap((item) => item.selectedToolIds))
  for (const item of plan.items) {
    if (item.segmentId && !input.segmentIds.has(item.segmentId)) {
      input.blockers.push(`Tool strategy item ${item.id} links orphan segment ${item.segmentId}.`)
    }
    if (item.assetPlanItemId && input.assetPlanItemIds.size > 0 && !input.assetPlanItemIds.has(item.assetPlanItemId)) {
      input.blockers.push(`Tool strategy item ${item.id} links orphan visual asset ${item.assetPlanItemId}.`)
    } else if (item.assetPlanItemId && input.assetPlanItemIds.size === 0) {
      input.warnings.push(`Tool strategy item ${item.id} visual-asset link could not be fully reconciled because this compact approved snapshot omitted the visual asset domain.`)
    }
    if (item.renderStrategyItemId && input.renderStrategyItemIds.size > 0 && !input.renderStrategyItemIds.has(item.renderStrategyItemId)) {
      input.blockers.push(`Tool strategy item ${item.id} links orphan render strategy item ${item.renderStrategyItemId}.`)
    } else if (item.renderStrategyItemId && input.renderStrategyItemIds.size === 0) {
      input.warnings.push(`Tool strategy item ${item.id} render-strategy link could not be fully reconciled because this compact approved snapshot omitted the render strategy domain.`)
    }
    if (!item.selectedToolIds.includes(item.primaryToolId)) {
      input.blockers.push(`Tool strategy item ${item.id} primary tool ${item.primaryToolId} is not in selectedToolIds.`)
    }
    collectDuplicateIdBlockers(`tool strategy step in ${item.id}`, item.steps, input.blockers)
    for (const step of item.steps) {
      if (!item.selectedToolIds.includes(step.toolId) && !item.fallbackToolIds.includes(step.toolId)) {
        input.blockers.push(`Tool strategy step ${step.id} tool ${step.toolId} is not selected or approved as fallback by item ${item.id}.`)
      }
    }
  }
  for (const toolId of selectedAcrossItems) {
    if (!plan.toolIdsUsed.includes(toolId)) {
      input.blockers.push(`Tool strategy summary omits selected tool ${toolId}.`)
    }
  }
  for (const toolId of plan.toolIdsUsed) {
    if (!selectedAcrossItems.has(toolId)) {
      input.warnings.push(`Tool strategy summary references ${toolId} without a selected item; it will not receive an executable operation.`)
    }
  }
}

function validateExecutionGraphLinks(input: {
  approvedSnapshot: ApprovedPlanSnapshot
  segmentIds: Set<string>
  assetPlanItemIds: Set<string>
  rendererLayerIds: Set<string>
  toolStrategyItemIds: Set<string>
  workItemIds: Set<string>
  blockers: string[]
  warnings: string[]
}): void {
  const execution = input.approvedSnapshot.editingAgentExecutionPlan
  if (!execution) return
  const assetManifestIds = idSet(execution.assetManifest)
  for (const workItem of execution.workItems) {
    reconcileOptionalLinks(`Work item ${workItem.id} tool strategy`, workItem.linkedToolStrategyItemIds, input.toolStrategyItemIds, 'tool strategy', input.blockers, input.warnings)
    collectOrphanLinks(`Work item ${workItem.id} segment`, workItem.linkedSegmentIds, input.segmentIds, input.blockers)
    reconcileOptionalLinks(`Work item ${workItem.id} visual asset`, workItem.linkedVisualAssetPlanItemIds, input.assetPlanItemIds, 'visual asset', input.blockers, input.warnings)
    reconcileOptionalLinks(`Work item ${workItem.id} renderer layer`, workItem.linkedRendererLayerIds, input.rendererLayerIds, 'renderer layer', input.blockers, input.warnings)
    for (const dependency of workItem.dependencies) {
      if (dependency.dependsOnWorkItemId && !input.workItemIds.has(dependency.dependsOnWorkItemId)) {
        input.blockers.push(`Work item ${workItem.id} dependency ${dependency.id} links orphan work item ${dependency.dependsOnWorkItemId}.`)
      }
      if (dependency.dependsOnAssetId && !assetManifestIds.has(dependency.dependsOnAssetId)) {
        input.blockers.push(`Work item ${workItem.id} dependency ${dependency.id} links orphan asset manifest item ${dependency.dependsOnAssetId}.`)
      }
    }
    for (const output of workItem.expectedOutputs) {
      if (output.linkedAssetManifestId && !assetManifestIds.has(output.linkedAssetManifestId)) {
        input.blockers.push(`Work item ${workItem.id} expected output ${output.id} links orphan asset manifest item ${output.linkedAssetManifestId}.`)
      }
      if (output.linkedRendererLayerId) {
        reconcileOptionalLinks(`Work item ${workItem.id} expected output ${output.id} renderer layer`, [output.linkedRendererLayerId], input.rendererLayerIds, 'renderer layer', input.blockers, input.warnings)
      }
    }
  }
  for (const asset of execution.assetManifest) {
    if (asset.parentWorkItemId && !input.workItemIds.has(asset.parentWorkItemId)) {
      input.blockers.push(`Asset manifest item ${asset.id} links orphan parent work item ${asset.parentWorkItemId}.`)
    }
    collectOrphanLinks(`Asset manifest item ${asset.id} segment`, asset.linkedSegmentIds, input.segmentIds, input.blockers)
    reconcileOptionalLinks(`Asset manifest item ${asset.id} visual asset`, asset.linkedVisualAssetPlanItemIds, input.assetPlanItemIds, 'visual asset', input.blockers, input.warnings)
    reconcileOptionalLinks(`Asset manifest item ${asset.id} renderer layer`, asset.linkedRendererLayerIds, input.rendererLayerIds, 'renderer layer', input.blockers, input.warnings)
  }
}

function reconcileOptionalLinks(
  label: string,
  values: string[],
  allowed: Set<string>,
  domainLabel: string,
  blockers: string[],
  warnings: string[],
): void {
  if (values.length < 1) return
  if (allowed.size > 0) {
    collectOrphanLinks(label, values, allowed, blockers)
    return
  }
  warnings.push(`${label} links could not be fully reconciled because this compact approved snapshot omitted the ${domainLabel} domain.`)
}

function collectOrphanLinks(label: string, values: string[], allowed: Set<string>, blockers: string[]): void {
  for (const value of values) {
    if (!allowed.has(value)) blockers.push(`${label} link ${value} is orphaned.`)
  }
}

function collectDuplicateIdBlockers(
  label: string,
  records: Array<{ id: string }> | undefined,
  blockers: string[],
): void {
  const duplicates = duplicateStrings((records ?? []).map((record) => record.id))
  if (duplicates.length > 0) blockers.push(`Duplicate ${label} IDs: ${duplicates.join(', ')}.`)
}

function fallbackForTool(toolId: ProductionToolId): ApprovedToolWorkOperation['fallback'] {
  return getFallbackChainsForTool(toolId).map((chain) => ({
    chainId: chain.chainId,
    trigger: chain.trigger,
    actions: chain.steps.map((step) => step.action),
  }))
}

function requiredProfile(toolId: ProductionToolId) {
  const profile = getProductionToolProfile(toolId)
  if (!profile) throw new Error(`Production tool profile ${toolId} is missing.`)
  return profile
}

function emptySourceReferences(
  partial: Partial<ApprovedToolWorkSourceReferences> = {},
): ApprovedToolWorkSourceReferences {
  return {
    toolStrategyItemIds: unique(partial.toolStrategyItemIds ?? []),
    toolStrategyStepIds: unique(partial.toolStrategyStepIds ?? []),
    professionalSkillIds: unique(partial.professionalSkillIds ?? []),
    backendIntentIds: unique(partial.backendIntentIds ?? []),
    renderStrategyItemIds: unique(partial.renderStrategyItemIds ?? []),
    colorOperationIds: unique(partial.colorOperationIds ?? []),
    audioOperationIds: unique(partial.audioOperationIds ?? []),
    workItemIds: unique(partial.workItemIds ?? []),
  }
}

function nonbillableCostPolicy(): ApprovedToolWorkOperation['cost'] {
  return {
    source: 'mock_safe_internal_tool_cost_evidence',
    actualInternalToolCostOnly: true,
    emitOnlyAfterActualWork: true,
    billableToUser: false,
    serviceFeeIncluded: false,
    walletMutationAllowed: false,
    settlementAllowed: false,
  }
}

function workIdsByType(approvedSnapshot: ApprovedPlanSnapshot, types: string[]): string[] {
  return approvedSnapshot.editingAgentExecutionPlan?.workItems
    .filter((item) => types.includes(item.workItemType))
    .map((item) => item.id) ?? []
}

function workItemsForToolStrategyItem(approvedSnapshot: ApprovedPlanSnapshot, toolStrategyItemId: string): string[] {
  return approvedSnapshot.editingAgentExecutionPlan?.workItems
    .filter((item) => item.linkedToolStrategyItemIds.includes(toolStrategyItemId))
    .map((item) => item.id) ?? []
}

function rendererLayerIdsForToolStrategyItem(approvedSnapshot: ApprovedPlanSnapshot, toolStrategyItemId: string): string[] {
  return unique([
    ...(approvedSnapshot.segmentPlansDomain
      ?.filter((segment) => segment.toolStrategyItemIds?.includes(toolStrategyItemId))
      .flatMap((segment) => segment.rendererLayerIds) ?? []),
    ...(approvedSnapshot.editingAgentExecutionPlan?.workItems
      .filter((item) => item.linkedToolStrategyItemIds.includes(toolStrategyItemId))
      .flatMap((item) => item.linkedRendererLayerIds) ?? []),
  ])
}

function colorOperationIdsForTool(approvedSnapshot: ApprovedPlanSnapshot, toolId: ProductionToolId): string[] {
  const operations = [
    ...(approvedSnapshot.colorPipelinePlan?.projectOperations ?? []),
    ...(approvedSnapshot.colorPipelinePlan?.clipPlans.flatMap((clip) => [...clip.correctionOperations, ...clip.lookOperations]) ?? []),
    ...(approvedSnapshot.colorPipelinePlan?.assetMatchPlans.flatMap((asset) => asset.operations) ?? []),
  ]
  return unique(operations.filter((operation) => productionToolAlias(operation.toolId) === toolId).map((operation) => operation.id))
}

function audioOperationIdsForTool(approvedSnapshot: ApprovedPlanSnapshot, toolId: ProductionToolId): string[] {
  const operations = [
    ...(approvedSnapshot.audioPipelinePlan?.projectOperations ?? []),
    ...(approvedSnapshot.audioPipelinePlan?.clipPlans.flatMap((clip) => [...clip.cleanupOperations, ...clip.loudnessOperations]) ?? []),
  ]
  return unique(operations.filter((operation) => productionToolAlias(operation.toolId) === toolId).map((operation) => operation.id))
}

function productionToolAlias(value: string): ProductionToolId | undefined {
  if (value === 'remotion_preview' || value === 'remotion_timing_preview') return 'remotion'
  return isProductionToolId(value) ? value : undefined
}

function countColorOperations(approvedSnapshot: ApprovedPlanSnapshot): number {
  return unique([
    ...(approvedSnapshot.colorPipelinePlan?.projectOperations.map((operation) => operation.id) ?? []),
    ...(approvedSnapshot.colorPipelinePlan?.clipPlans.flatMap((clip) => [...clip.correctionOperations, ...clip.lookOperations].map((operation) => operation.id)) ?? []),
    ...(approvedSnapshot.colorPipelinePlan?.assetMatchPlans.flatMap((asset) => asset.operations.map((operation) => operation.id)) ?? []),
  ]).length
}

function countAudioOperations(approvedSnapshot: ApprovedPlanSnapshot): number {
  return unique([
    ...(approvedSnapshot.audioPipelinePlan?.projectOperations.map((operation) => operation.id) ?? []),
    ...(approvedSnapshot.audioPipelinePlan?.clipPlans.flatMap((clip) => [...clip.cleanupOperations, ...clip.loudnessOperations].map((operation) => operation.id)) ?? []),
  ]).length
}

function canonicalEditLevel(approvedSnapshot: ApprovedPlanSnapshot): ReEditProCanonicalEditLevel {
  const value = approvedSnapshot.settingsSnapshot?.edit_level ?? approvedSnapshot.compiledIntent?.resolvedSettings.editLevel
  if (value === 'basic') return 'normal'
  if (value === 'pro') return 'premium'
  if (value === 'premium') return 'ultra_premium'
  return 'normal'
}

function ids(records: Array<{ id: string }> | undefined): string[] {
  return (records ?? []).map((record) => record.id).filter(Boolean)
}

function idSet(records: Array<{ id: string }> | undefined): Set<string> {
  return new Set(ids(records))
}

function duplicateStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function safeId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._:-]+/g, '-').slice(0, 120) || 'unknown'
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, stableJsonValue(nestedValue)]))
  }
  if (typeof value === 'function' || typeof value === 'symbol') return String(value)
  if (typeof value === 'bigint') return value.toString()
  return value
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const nestedValue of Object.values(value as Record<string, unknown>)) deepFreeze(nestedValue)
  return Object.freeze(value)
}
