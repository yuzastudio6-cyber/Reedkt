import { findForbiddenWorkerPayloadEntries, validateProductionStorageReference } from '../workers/production/production-worker-artifact-policy'
import type { ProductionWorkerStorageReferenceInput } from '../workers/production/production-worker-types'
import { getTrackBAdapterContract } from './trackb-adapter-contracts'
import {
  trackBAdapterRequestSchema,
  trackBAdapterResultSchema,
  type TrackBAdapterRequest,
  type TrackBAdapterResult,
  type TrackBAdapterToolId,
  type TrackBArtifactManifestEntry,
} from './trackb-adapter-schemas'

export interface TrackBAdapterBlocker {
  code: string
  message: string
  details?: Record<string, unknown>
}

export function runTrackBAdapter(input: TrackBAdapterRequest): TrackBAdapterResult {
  const request = trackBAdapterRequestSchema.parse(input)
  const contract = getTrackBAdapterContract(request.toolId)
  const blockers: TrackBAdapterBlocker[] = []
  const warnings = [
    'Track B adapter pack is contract-only and mock-safe in Milestone 5; no binary, media, provider, Docker, or worker runtime execution occurred.',
  ]

  if (request.workerType !== contract.workerType) {
    blockers.push({
      code: 'TRACKB_ADAPTER_WORKER_MISMATCH',
      message: `${request.toolId} adapter requires ${contract.workerType}, not ${request.workerType}.`,
      details: { expectedWorkerType: contract.workerType, requestedWorkerType: request.workerType },
    })
  }

  if (!contract.allowedExecutionModes.includes(request.executionMode)) {
    blockers.push({
      code: 'TRACKB_ADAPTER_MODE_NOT_ALLOWED',
      message: `${request.toolId} does not allow ${request.executionMode}.`,
      details: { allowedExecutionModes: contract.allowedExecutionModes },
    })
  }

  blockers.push(...validateInputArtifactManifests(request))
  blockers.push(...validateRequiredInputCoverage(request))
  blockers.push(...validateMetadata(request.metadata))

  const outputManifest = blockers.length === 0
    ? buildOutputManifest(request, contract.outputManifest.map((artifact) => artifact.artifactType))
    : []

  const qaChecks = contract.qaChecks.map((check) => ({
    checkId: check.checkId,
    status: blockers.length === 0 ? 'passed' as const : 'blocked' as const,
    required: check.required,
    gateType: check.gateType,
    message: blockers.length === 0
      ? `${check.description} Passed by Track B adapter contract validation.`
      : `${check.description} Blocked until adapter request issues are resolved.`,
    details: {
      toolId: request.toolId,
      executionMode: request.executionMode,
      boundedExecutionScope: contract.boundedExecutionScope,
    },
  }))

  const result: TrackBAdapterResult = {
    adapterPackVersion: 'trackb-adapter-pack-v1',
    toolId: request.toolId,
    displayName: contract.displayName,
    workerType: contract.workerType,
    executionMode: request.executionMode,
    status: blockers.length > 0
      ? 'blocked'
      : request.executionMode === 'dry_run'
        ? 'dry_run_ready'
        : 'bounded_execution_ready',
    mockSafe: true,
    realToolExecution: false,
    inputManifest: request.inputArtifacts,
    outputManifest,
    qaChecks,
    blockers,
    resultSummary: blockers.length > 0
      ? `${contract.displayName} Track B adapter blocked before dispatch.`
      : `${contract.displayName} Track B adapter ${request.executionMode} contract validated with private manifests and QA checks.`,
    warnings,
  }

  return trackBAdapterResultSchema.parse(result)
}

export function isTrackBAdapterToolId(value: string): value is TrackBAdapterToolId {
  return [
    'ffmpeg',
    'ffprobe',
    'pyav',
    'opentimelineio',
    'remotion',
    'libass',
    'sharp',
    'paddleocr',
    'pyscenedetect',
    'opencv',
    'opencolorio',
    'openimageio',
    'audioflux',
    'signalsmith_stretch',
    'd3',
    'echarts',
  ].includes(value)
}

function validateInputArtifactManifests(request: TrackBAdapterRequest): TrackBAdapterBlocker[] {
  const blockers: TrackBAdapterBlocker[] = []
  const expectedPrefix = `workspaces/${request.workspaceId}/projects/${request.projectId}/`

  for (const artifact of request.inputArtifacts) {
    try {
      validateProductionStorageReference(artifact as ProductionWorkerStorageReferenceInput)
    } catch (error) {
      blockers.push({
        code: 'TRACKB_ADAPTER_PRIVATE_ARTIFACT_REQUIRED',
        message: error instanceof Error ? error.message : 'Input artifact failed private manifest validation.',
        details: { artifactId: artifact.id },
      })
      continue
    }

    if (!artifact.storageObjectPath.startsWith(expectedPrefix)) {
      blockers.push({
        code: 'TRACKB_ADAPTER_ARTIFACT_PROJECT_MISMATCH',
        message: 'Input artifact path must be scoped to the adapter workspace/project.',
        details: { artifactId: artifact.id, expectedPrefix },
      })
    }
  }

  return blockers
}

function validateRequiredInputCoverage(request: TrackBAdapterRequest): TrackBAdapterBlocker[] {
  const contract = getTrackBAdapterContract(request.toolId)
  const blockers: TrackBAdapterBlocker[] = []
  const availableTypes = new Set(request.inputArtifacts.map((artifact) => artifact.artifactType))
  const availablePurposes = new Set(request.inputArtifacts.map((artifact) => artifact.storageBucketPurpose))

  for (const requirement of contract.inputManifest.filter((item) => item.required)) {
    if (!availableTypes.has(requirement.artifactType) && !availablePurposes.has(requirement.storageBucketPurpose)) {
      blockers.push({
        code: 'TRACKB_ADAPTER_REQUIRED_INPUT_MISSING',
        message: `${request.toolId} requires ${requirement.artifactType} or ${requirement.storageBucketPurpose} input manifest coverage.`,
        details: {
          requiredArtifactType: requirement.artifactType,
          requiredStorageBucketPurpose: requirement.storageBucketPurpose,
        },
      })
    }
  }

  return blockers
}

function validateMetadata(metadata: Record<string, unknown> | undefined): TrackBAdapterBlocker[] {
  if (!metadata) return []

  const findings = findForbiddenWorkerPayloadEntries(metadata)
  if (findings.length === 0) return []

  return [{
    code: 'TRACKB_ADAPTER_FORBIDDEN_METADATA',
    message: 'Track B adapter metadata must not contain raw prompts, signed URLs, provider keys, service-role keys, or secret-like payloads.',
    details: { findings },
  }]
}

function buildOutputManifest(
  request: TrackBAdapterRequest,
  artifactTypes: TrackBArtifactManifestEntry['artifactType'][],
): TrackBArtifactManifestEntry[] {
  return artifactTypes.map((artifactType, index) => {
    const purpose = outputPurposeForArtifactType(artifactType)
    const suffix = artifactType.endsWith('_json') || artifactType === 'qa_report' || artifactType.endsWith('_manifest')
      ? 'json'
      : 'artifact'

    return {
      id: `${request.jobId}-${request.toolId}-output-${index + 1}`,
      artifactType,
      storageBucketPurpose: purpose,
      storageObjectPath: `workspaces/${request.workspaceId}/projects/${request.projectId}/tool-results/${request.jobId}/${request.toolId}/${artifactType}.${suffix}`,
      contentType: suffix === 'json' ? 'application/json' : 'application/octet-stream',
      isPrivate: true,
      sourceOfTruth: true,
      description: `Planned private ${artifactType} output for ${request.toolId}.`,
      producedByToolId: request.toolId,
    }
  })
}

function outputPurposeForArtifactType(artifactType: TrackBArtifactManifestEntry['artifactType']): TrackBArtifactManifestEntry['storageBucketPurpose'] {
  switch (artifactType) {
    case 'proxy_video':
      return 'proxy_media'
    case 'preview_video':
      return 'previews'
    case 'final_export':
      return 'final_exports'
    case 'transcript_json':
    case 'word_timestamps_json':
    case 'caption_segments_json':
      return 'transcripts'
    case 'mask_image':
    case 'mask_sequence':
    case 'rgba_cutout':
      return 'masks'
    case 'keyframe_image':
    case 'representative_frame':
    case 'cleaned_audio':
    case 'separated_audio_stem':
    case 'graded_preview':
    case 'enhanced_video':
    case 'interpolated_video':
      return 'generated_assets'
    case 'qa_report':
      return 'qa_artifacts'
    case 'temp_file':
      return 'worker_temp'
    default:
      return 'analysis_artifacts'
  }
}
