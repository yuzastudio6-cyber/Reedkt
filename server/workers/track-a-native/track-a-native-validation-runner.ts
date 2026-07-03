import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { QualityGateType } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionToolId } from '../../tool-registry'

export type TrackANativeValidationAdapterId =
  | 'tool_readiness_worker_streamer_render_pipeline_support'
  | 'tool_readiness_worker_mkvtoolnix_container_validation'
  | 'tool_readiness_worker_gpac_mp4box_packaging_validation'

export type TrackANativeValidationCapabilityId =
  | 'streamer_render_pipeline_support'
  | 'mkvtoolnix_container_validation'
  | 'gpac_mp4box_packaging_validation'

export type TrackANativeValidationMode = 'dry_run' | 'production_ready'

export interface TrackANativeValidationInput {
  workspaceId: string
  projectId: string
  mediaAssetId?: string
  jobId: string
  approvedSnapshotId: string
  toolExecutionPlanId: string
  idempotencyKey: string
  requestedToolIds: ProductionToolId[]
  storageReferenceIds: string[]
  request: Record<string, unknown>
}

export interface TrackANativeValidationResult {
  status: 'completed' | 'blocked'
  mode: TrackANativeValidationMode
  adapterId: TrackANativeValidationAdapterId
  capabilityId: TrackANativeValidationCapabilityId
  toolId: ProductionToolId
  tasks: string[]
  artifactRecords: ToolArtifact[]
  qaResults: QualityGateResult[]
  blockers: string[]
  warnings: string[]
  noRuntimeExecution: true
  noMediaProcessing: true
  noPublicArtifacts: true
  blocksFinalExport: true
}

const adapterContracts: Record<TrackANativeValidationAdapterId, {
  capabilityId: TrackANativeValidationCapabilityId
  toolId: ProductionToolId
  qaGateType: QualityGateType
  tasks: readonly string[]
}> = {
  tool_readiness_worker_streamer_render_pipeline_support: {
    capabilityId: 'streamer_render_pipeline_support',
    toolId: 'gstreamer',
    qaGateType: 'render_timeline_integrity',
    tasks: ['validate_render_pipeline_support', 'validate_backend_boundary', 'validate_no_media_output'],
  },
  tool_readiness_worker_mkvtoolnix_container_validation: {
    capabilityId: 'mkvtoolnix_container_validation',
    toolId: 'mkvtoolnix',
    qaGateType: 'export_codec_format',
    tasks: ['validate_container_manifest', 'validate_cleanup_evidence', 'validate_no_media_processing'],
  },
  tool_readiness_worker_gpac_mp4box_packaging_validation: {
    capabilityId: 'gpac_mp4box_packaging_validation',
    toolId: 'gpac_mp4box',
    qaGateType: 'export_codec_format',
    tasks: ['validate_package_source_provenance', 'validate_mp4box_binary_presence', 'validate_no_packaging_execution'],
  },
}

export function runTrackANativeValidation(input: TrackANativeValidationInput): TrackANativeValidationResult {
  const adapterId = stringValue(input.request.gatewayAdapterId)
  const contract = adapterId && isTrackANativeValidationAdapterId(adapterId)
    ? adapterContracts[adapterId]
    : undefined
  const mode = input.request.mode === 'production_ready' ? 'production_ready' : 'dry_run'
  const capabilityId = stringValue(input.request.capabilityId)
  const tasks = Array.isArray(input.request.tasks) ? input.request.tasks.map(String) : []
  const blockers: string[] = []
  const warnings: string[] = []

  if (!adapterId || !contract) {
    blockers.push('Track A native validation requires a reviewed gateway adapter id.')
  }

  if (contract && capabilityId !== contract.capabilityId) {
    blockers.push(`Expected capability ${contract.capabilityId}, received ${capabilityId ?? 'missing'}.`)
  }

  if (contract && (input.requestedToolIds.length !== 1 || input.requestedToolIds[0] !== contract.toolId)) {
    blockers.push(`Expected requested tool ${contract.toolId}.`)
  }

  const expectedTasks = contract?.tasks ?? []
  const unexpectedTasks = tasks.filter((task) => !expectedTasks.some((expectedTask) => expectedTask === task))
  const missingTasks = expectedTasks.filter((task) => !tasks.includes(task))
  if (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0) {
    blockers.push(`Task scope mismatch: missing ${missingTasks.join(', ') || 'none'}, unexpected ${unexpectedTasks.join(', ') || 'none'}.`)
  }

  const sourceEvidenceIds = Array.isArray(input.request.sourceEvidenceIds)
    ? input.request.sourceEvidenceIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : []
  if (sourceEvidenceIds.length === 0) {
    blockers.push('Accepted Track A source evidence is required.')
  }

  const forbiddenFlags = [
    'allowMediaProcessing',
    'allowPublicDelivery',
    'allowUserMedia',
    'runToolBinary',
    'runMediaCommand',
    'allowFrontendExecution',
    'allowFinalExport',
    'useTemporaryAccessLinkSourceTruth',
  ].filter((key) => input.request[key] === true)
  if (forbiddenFlags.length > 0) {
    blockers.push(`Forbidden Track A native validation scope flags enabled: ${forbiddenFlags.join(', ')}.`)
  }

  if (adapterId === 'tool_readiness_worker_streamer_render_pipeline_support' && typeof input.request.renderSupportManifestId !== 'string') {
    blockers.push('streamer_render_pipeline_support requires renderSupportManifestId.')
  }

  if (adapterId === 'tool_readiness_worker_mkvtoolnix_container_validation' && typeof input.request.privateArtifactManifestId !== 'string') {
    blockers.push('mkvtoolnix_container_validation requires privateArtifactManifestId.')
  }

  if (adapterId === 'tool_readiness_worker_gpac_mp4box_packaging_validation') {
    const gpacRequirements = {
      officialAptSourceApproved: true,
      repoSourceClass: 'official_gpac_apt_debian_bookworm_main',
      gatewayRepoUriValidated: true,
      codename: 'bookworm',
      component: 'main',
      packageName: 'gpac',
      binaryPath: '/usr/bin/MP4Box',
    }
    for (const [key, value] of Object.entries(gpacRequirements)) {
      if (input.request[key] !== value) {
        blockers.push(`gpac_mp4box_packaging_validation requires ${key}=${String(value)}.`)
      }
    }
  }

  const status = blockers.length > 0 ? 'blocked' : 'completed'
  const fallbackAdapterId: TrackANativeValidationAdapterId = 'tool_readiness_worker_streamer_render_pipeline_support'
  const resolvedAdapterId = contract ? adapterId as TrackANativeValidationAdapterId : fallbackAdapterId
  const resolvedContract = contract ?? adapterContracts[fallbackAdapterId]
  const artifactRecords = status === 'completed'
    ? [buildQaArtifact(input, resolvedAdapterId, resolvedContract.capabilityId, resolvedContract.toolId)]
    : []
  const qaResults = [buildQaResult(input, resolvedContract.qaGateType, resolvedContract.capabilityId, status, blockers, artifactRecords)]

  if (mode !== 'production_ready') {
    warnings.push('Track A native validation ran in dry-run mode; production-ready adapter evidence was not asserted.')
  }

  return {
    status,
    mode,
    adapterId: resolvedAdapterId,
    capabilityId: resolvedContract.capabilityId,
    toolId: resolvedContract.toolId,
    tasks,
    artifactRecords,
    qaResults,
    blockers,
    warnings,
    noRuntimeExecution: true,
    noMediaProcessing: true,
    noPublicArtifacts: true,
    blocksFinalExport: true,
  }
}

export function isTrackANativeValidationAdapterId(value: string): value is TrackANativeValidationAdapterId {
  return Object.prototype.hasOwnProperty.call(adapterContracts, value)
}

function buildQaArtifact(
  input: TrackANativeValidationInput,
  adapterId: TrackANativeValidationAdapterId,
  capabilityId: TrackANativeValidationCapabilityId,
  toolId: ProductionToolId,
): ToolArtifact {
  const fileName = `${capabilityId}-qa-report.json`
  return {
    id: `track-a-native-validation:${input.jobId}:${capabilityId}:qa-report`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId ?? 'media-asset-not-required',
    toolRunId: input.jobId,
    artifactType: 'qa_report',
    storageBucketPurpose: 'qa_artifacts',
    storageObjectPath: `workspaces/${input.workspaceId}/projects/${input.projectId}/track-a-native-validation/${input.jobId}/${fileName}`,
    contentType: 'application/json',
    createdAt: new Date().toISOString(),
    isPrivate: true,
    metadata: {
      adapterId,
      capabilityId,
      toolId,
      approvedSnapshotId: input.approvedSnapshotId,
      idempotencyKey: input.idempotencyKey,
      noRuntimeExecution: true,
      noMediaProcessing: true,
      noPublicArtifacts: true,
    },
    previewAllowed: false,
    sourceOfTruth: true,
  }
}

function buildQaResult(
  input: TrackANativeValidationInput,
  gateType: QualityGateType,
  capabilityId: TrackANativeValidationCapabilityId,
  status: 'completed' | 'blocked',
  blockers: string[],
  artifacts: ToolArtifact[],
): QualityGateResult {
  return {
    id: `track-a-native-validation:${input.jobId}:${capabilityId}:qa`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId ?? 'media-asset-not-required',
    toolExecutionPlanId: input.toolExecutionPlanId,
    recipeId: `${capabilityId}-validation-recipe`,
    gateType,
    status: status === 'completed' ? 'passed' : 'blocked',
    required: true,
    blocking: status !== 'completed',
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'tool_readiness_worker',
    inputArtifactIds: input.storageReferenceIds,
    outputArtifactIds: artifacts.map((artifact) => artifact.id),
    issues: blockers.map((message) => ({
      code: 'track_a_native_validation_blocker',
      message,
      severity: 'blocking',
    })),
    recommendations: status === 'completed'
      ? []
      : [{
        action: 'resolve_track_a_native_validation_scope',
        reason: 'Supply the approved source-evidence and private artifact/provenance metadata before retrying.',
        priority: 'high',
      }],
    fallbackRequired: status !== 'completed',
    blocksPreview: false,
    blocksFinalExport: true,
    humanReviewRequired: status !== 'completed',
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
