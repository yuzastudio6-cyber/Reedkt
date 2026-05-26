import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields } from '../production/production-worker-artifact-policy'
import { evaluateModelWeightManifestForMode } from '../../model-weights/model-weight-license-policy'
import { getGpuModelWeightManifestTemplate } from '../../model-weights/model-weight-manifest-templates'
import type { AudioExecutionInput } from './audio-execution-types'

const forbiddenInputKeys = [
  'rawPrompt',
  'promptText',
  'rawUserChat',
  'signedUrl',
  'serviceRoleKey',
  'providerApiKey',
  'secretValue',
] as const

const modelToolManifestMap = {
  deepfilternet: 'deepfilternet_model',
  demucs: 'demucs_model',
} as const

export function validateAudioExecutionPolicy(input: AudioExecutionInput): {
  allowed: boolean
  blockingReasons: string[]
  warnings: string[]
} {
  rejectForbiddenInputFields(input)
  rejectUnsafeReferences(input)

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  const blockingReasons: string[] = []
  const warnings: string[] = []

  if (input.allowModelDownload === true) blockingReasons.push('model_download_blocked')
  if (input.allowFinalMux === true) blockingReasons.push('final_mux_blocked_in_m15a')
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) blockingReasons.push('arbitrary_ffmpeg_args_blocked')
  if (input.mode === 'production_blocked') blockingReasons.push('production_audio_execution_blocked_in_m15a')

  if (input.mode === 'production_ready') {
    for (const [fieldName, value] of [
      ['approvedSnapshotId', input.approvedSnapshotId],
      ['toolExecutionPlanId', input.toolExecutionPlanId],
      ['idempotencyKey', input.idempotencyKey],
      ['sourceAudioArtifactId', input.sourceAudioArtifactId],
    ] as const) {
      if (!value) blockingReasons.push(`${fieldName}_required_for_production_ready`)
    }
    if (input.readinessReport?.overallStatus !== 'passed') blockingReasons.push('audio_readiness_report_not_passed')
    if ((input.readinessReport?.blockers?.length ?? 0) > 0 || (input.readinessReport?.blockerSummaries?.length ?? 0) > 0) {
      blockingReasons.push('audio_readiness_blockers_present')
    }

    const requestedModelTools: Array<keyof typeof modelToolManifestMap> = []
    if (input.audioCleanupPlan?.selectedPrimaryTool === 'deepfilternet') requestedModelTools.push('deepfilternet')
    if (
      input.audioCleanupPlan?.fallbackTools.includes('demucs') === true ||
      input.audioCleanupPlan?.operations.some((operation) => operation.toolId === 'demucs') === true
    ) {
      requestedModelTools.push('demucs')
    }

    for (const toolName of requestedModelTools) {
      const manifestId = modelToolManifestMap[toolName]
      if (!input.modelWeightManifestIds?.includes(manifestId)) {
        blockingReasons.push(`${toolName}_modelWeightManifestId_required`)
        continue
      }
      const policy = evaluateModelWeightManifestForMode(getGpuModelWeightManifestTemplate(manifestId), 'production_ready')
      blockingReasons.push(...policy.blockingReasons.map((reason) => `${toolName}: ${reason}`))
      warnings.push(...policy.warnings)
    }
  }

  if (input.mode === 'local_dev' && input.enableFfmpegAudioExecution !== true) {
    warnings.push('local_dev_ffmpeg_audio_execution_disabled')
  }
  if (input.mode === 'local_dev' && input.enableModelAudioExecution === true) {
    warnings.push('local_dev_model_audio_execution_is_skip_first_and_must_not_download_models')
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
  }
}

function rejectForbiddenInputFields(input: AudioExecutionInput): void {
  for (const key of forbiddenInputKeys) {
    if (input[key] !== undefined) {
      throw new Error(`M15A audio execution rejects forbidden field: ${key}.`)
    }
  }
}

function rejectUnsafeReferences(input: AudioExecutionInput): void {
  const stringFields = [
    ['sourceAudioStorageObjectPath', input.sourceAudioStorageObjectPath],
    ['sourceAudioLocalPath', input.sourceAudioLocalPath],
    ['outputDirectory', input.outputDirectory],
  ] as const
  for (const [label, value] of stringFields) {
    if (!value) continue
    assertNoSignedUrlOrRawUrl(value, label)
    assertNoPathTraversal(value, label)
  }
}
