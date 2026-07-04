import { findForbiddenWorkerPayloadEntries, validateProductionStorageReference } from '../workers/production/production-worker-artifact-policy'
import type { ProductionWorkerStorageReferenceInput } from '../workers/production/production-worker-types'
import { getReadyAudioAdapterContract } from './ready-audio-adapter-contracts'
import {
  READY_AUDIO_ADAPTER_TOOL_IDS,
  readyAudioAdapterRequestSchema,
  readyAudioAdapterResultSchema,
  type ReadyAudioAdapterRequest,
  type ReadyAudioAdapterResult,
  type ReadyAudioAdapterToolId,
  type ReadyAudioArtifactManifestEntry,
} from './ready-audio-adapter-schemas'

export interface ReadyAudioAdapterBlocker {
  code: string
  message: string
  details?: Record<string, unknown>
}

export function runReadyAudioAdapter(input: ReadyAudioAdapterRequest): ReadyAudioAdapterResult {
  const request = readyAudioAdapterRequestSchema.parse(input)
  const contract = getReadyAudioAdapterContract(request.toolId)
  const blockers: ReadyAudioAdapterBlocker[] = []
  const warnings = [
    'Ready audio adapter pack is contract-only and mock-safe; no binary, package import, media processing, provider, Docker, or worker runtime execution occurred.',
    'Guided chat should summarize the audio work and avoid raw tool/library names by default.',
  ]

  if (request.workerType !== contract.workerType) {
    blockers.push({
      code: 'READY_AUDIO_ADAPTER_WORKER_MISMATCH',
      message: `${request.toolId} adapter requires ${contract.workerType}, not ${request.workerType}.`,
      details: { expectedWorkerType: contract.workerType, requestedWorkerType: request.workerType },
    })
  }

  if (!contract.allowedExecutionModes.includes(request.executionMode)) {
    blockers.push({
      code: 'READY_AUDIO_ADAPTER_MODE_NOT_ALLOWED',
      message: `${request.toolId} does not allow ${request.executionMode}.`,
      details: { allowedExecutionModes: contract.allowedExecutionModes },
    })
  }

  if (contract.licenseReviewRequired) {
    blockers.push({
      code: 'READY_AUDIO_ADAPTER_LICENSE_REVIEW_REQUIRED',
      message: `${request.toolId} remains blocked until owner/license review approves backend execution.`,
      details: { toolId: request.toolId },
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
      ? `${check.description} Passed by ready-audio adapter contract validation.`
      : `${check.description} Blocked until ready-audio adapter request issues are resolved.`,
    details: {
      toolId: request.toolId,
      executionMode: request.executionMode,
      boundedExecutionScope: contract.boundedExecutionScope,
    },
  }))

  const result: ReadyAudioAdapterResult = {
    adapterPackVersion: 'ready-audio-adapter-pack-v1',
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
    userFacingActivity: contract.userFacingActivity,
    resultSummary: blockers.length > 0
      ? `${contract.userFacingActivity} adapter blocked before dispatch.`
      : `${contract.userFacingActivity} adapter ${request.executionMode} contract validated with private manifests and QA checks.`,
    warnings,
  }

  return readyAudioAdapterResultSchema.parse(result)
}

export function isReadyAudioAdapterToolId(value: string): value is ReadyAudioAdapterToolId {
  return (READY_AUDIO_ADAPTER_TOOL_IDS as readonly string[]).includes(value)
}

function validateInputArtifactManifests(request: ReadyAudioAdapterRequest): ReadyAudioAdapterBlocker[] {
  const blockers: ReadyAudioAdapterBlocker[] = []
  const expectedPrefix = `workspaces/${request.workspaceId}/projects/${request.projectId}/`

  for (const artifact of request.inputArtifacts) {
    try {
      validateProductionStorageReference(artifact as ProductionWorkerStorageReferenceInput)
    } catch (error) {
      blockers.push({
        code: 'READY_AUDIO_ADAPTER_PRIVATE_ARTIFACT_REQUIRED',
        message: error instanceof Error ? error.message : 'Input artifact failed private manifest validation.',
        details: { artifactId: artifact.id },
      })
      continue
    }

    if (!artifact.storageObjectPath.startsWith(expectedPrefix)) {
      blockers.push({
        code: 'READY_AUDIO_ADAPTER_ARTIFACT_PROJECT_MISMATCH',
        message: 'Input artifact path must be scoped to the adapter workspace/project.',
        details: { artifactId: artifact.id, expectedPrefix },
      })
    }
  }

  return blockers
}

function validateRequiredInputCoverage(request: ReadyAudioAdapterRequest): ReadyAudioAdapterBlocker[] {
  const contract = getReadyAudioAdapterContract(request.toolId)
  const blockers: ReadyAudioAdapterBlocker[] = []
  const availableTypes = new Set(request.inputArtifacts.map((artifact) => artifact.artifactType))
  const availablePurposes = new Set(request.inputArtifacts.map((artifact) => artifact.storageBucketPurpose))

  for (const requirement of contract.inputManifest.filter((item) => item.required)) {
    if (!availableTypes.has(requirement.artifactType) && !availablePurposes.has(requirement.storageBucketPurpose)) {
      blockers.push({
        code: 'READY_AUDIO_ADAPTER_REQUIRED_INPUT_MISSING',
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

function validateMetadata(metadata: Record<string, unknown> | undefined): ReadyAudioAdapterBlocker[] {
  if (!metadata) return []

  const findings = findForbiddenWorkerPayloadEntries(metadata)
  if (findings.length === 0) return []

  return [{
    code: 'READY_AUDIO_ADAPTER_FORBIDDEN_METADATA',
    message: 'Ready audio adapter metadata must not contain raw prompts, signed URLs, provider keys, service-role keys, or secret-like payloads.',
    details: { findings },
  }]
}

function buildOutputManifest(
  request: ReadyAudioAdapterRequest,
  artifactTypes: ReadyAudioArtifactManifestEntry['artifactType'][],
): ReadyAudioArtifactManifestEntry[] {
  return artifactTypes.map((artifactType, index) => {
    const purpose = outputPurposeForArtifactType(artifactType)
    const suffix = artifactType.endsWith('_json') || artifactType === 'qa_report' || artifactType.endsWith('_manifest')
      ? 'json'
      : 'artifact'

    return {
      id: `${request.jobId}-${request.toolId}-ready-audio-output-${index + 1}`,
      artifactType,
      storageBucketPurpose: purpose,
      storageObjectPath: `workspaces/${request.workspaceId}/projects/${request.projectId}/tool-results/${request.jobId}/ready-audio/${request.toolId}/${artifactType}.${suffix}`,
      contentType: suffix === 'json' ? 'application/json' : 'application/octet-stream',
      isPrivate: true,
      sourceOfTruth: true,
      description: `Planned private ${artifactType} output for ${request.toolId}.`,
      producedByToolId: request.toolId,
    }
  })
}

function outputPurposeForArtifactType(artifactType: ReadyAudioArtifactManifestEntry['artifactType']): ReadyAudioArtifactManifestEntry['storageBucketPurpose'] {
  switch (artifactType) {
    case 'cleaned_audio':
    case 'separated_audio_stem':
    case 'keyframe_image':
    case 'representative_frame':
      return 'generated_assets'
    case 'qa_report':
      return 'qa_artifacts'
    case 'transcript_json':
    case 'word_timestamps_json':
    case 'caption_segments_json':
      return 'transcripts'
    case 'proxy_video':
      return 'proxy_media'
    case 'preview_video':
      return 'previews'
    case 'final_export':
      return 'final_exports'
    case 'temp_file':
      return 'worker_temp'
    default:
      return 'analysis_artifacts'
  }
}
