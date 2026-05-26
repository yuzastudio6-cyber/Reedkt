import { existsSync } from 'node:fs'
import {
  evaluateModelWeightManifestForMode,
  getGpuModelWeightManifestTemplate,
} from '../../model-weights'
import {
  buildStaticProductionReadinessReport,
} from '../readiness-validation'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
} from '../media/media-path-safety'
import {
  assertWorkerPayloadHasApprovedSnapshot,
  assertWorkerPayloadHasIdempotencyKey,
  assertWorkerPayloadHasNoRawPrompt,
  assertWorkerPayloadHasNoSignedUrls,
} from '../production/production-worker-gates'
import { assertWorkerPayloadHasNoForbiddenFields, findForbiddenWorkerPayloadEntries } from '../production/production-worker-artifact-policy'
import type { SpeechExecutionInput } from '../speech-caption/speech-caption-pipeline-types'

const allowedManifestId = 'faster_whisper_model'

export interface SpeechExecutionPolicyResult {
  allowed: boolean
  modelWeightStatus: 'not_required' | 'approved' | 'needs_review' | 'blocked' | 'missing' | 'dry_run'
  warnings: string[]
  blockingReasons: string[]
}

export function assertNoForbiddenSpeechExecutionFields(input: unknown): void {
  const findings = findForbiddenWorkerPayloadEntries(input)
  if (findings.length > 0) {
    throw new Error(`Speech execution input contains forbidden raw prompt, signed URL, or secret fields: ${findings.join(', ')}`)
  }
}

export function validateSpeechExecutionPolicy(input: SpeechExecutionInput): SpeechExecutionPolicyResult {
  assertNoForbiddenSpeechExecutionFields(input)

  if (input.workerPayload) {
    assertWorkerPayloadHasApprovedSnapshot(input.workerPayload)
    assertWorkerPayloadHasIdempotencyKey(input.workerPayload)
    assertWorkerPayloadHasNoRawPrompt(input.workerPayload)
    assertWorkerPayloadHasNoSignedUrls(input.workerPayload)
    assertWorkerPayloadHasNoForbiddenFields(input.workerPayload)
  }

  if (input.allowModelDownload) {
    throw new Error('allowModelDownload=true is blocked in Milestone 13.')
  }

  if (input.arbitraryArgs?.length) {
    throw new Error('Arbitrary faster-whisper command args are not allowed.')
  }

  for (const [label, value] of [
    ['sourceAudioLocalPath', input.sourceAudioLocalPath],
    ['outputDirectory', input.outputDirectory],
    ['localModelPath', input.localModelPath],
  ] as const) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }

  const warnings: string[] = []
  const blockingReasons: string[] = []

  if (input.mode === 'dry_run' || input.mode === 'container_ready') {
    return {
      allowed: true,
      modelWeightStatus: input.mode === 'dry_run' ? 'dry_run' : 'needs_review',
      warnings: [`${input.mode} does not execute faster-whisper.`],
      blockingReasons: [],
    }
  }

  if (input.mode === 'production_blocked') {
    return {
      allowed: false,
      modelWeightStatus: 'blocked',
      warnings: [],
      blockingReasons: ['production_blocked mode refuses real transcription.'],
    }
  }

  if (input.mode === 'local_dev') {
    if (!input.enableRealTranscription) {
      warnings.push('local_dev real transcription is disabled; no faster-whisper command will run.')
    }
    if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) {
      warnings.push('local_dev source audio is unavailable; transcription will skip.')
    }
    if (!input.localModelPath || !existsSync(input.localModelPath)) {
      warnings.push('local_dev model path is unavailable; no model download will be attempted.')
    }
    return {
      allowed: true,
      modelWeightStatus: input.modelWeightManifestId ? 'needs_review' : 'missing',
      warnings,
      blockingReasons: [],
    }
  }

  if (!input.approvedSnapshotId) blockingReasons.push('production_ready requires approvedSnapshotId.')
  if (!input.toolExecutionPlanId) blockingReasons.push('production_ready requires toolExecutionPlanId.')
  if (!input.idempotencyKey) blockingReasons.push('production_ready requires idempotencyKey.')
  if (input.modelWeightManifestId !== allowedManifestId) {
    blockingReasons.push('production_ready faster-whisper requires approved faster_whisper_model manifest.')
  }

  const manifest = input.modelWeightManifestId === allowedManifestId
    ? getGpuModelWeightManifestTemplate(allowedManifestId)
    : undefined
  const evaluation = evaluateModelWeightManifestForMode(manifest, 'production_ready')
  blockingReasons.push(...evaluation.blockingReasons)
  warnings.push(...evaluation.warnings)

  const readiness = buildStaticProductionReadinessReport()
  const speechBlockers = readiness.blockerSummaries.filter((blocker) => blocker.toolId === 'faster_whisper')
  if (speechBlockers.some((blocker) => blocker.severity === 'hard_blocker')) {
    blockingReasons.push('M12 readiness report still has faster-whisper/model-weight hard blockers.')
  }

  return {
    allowed: blockingReasons.length === 0,
    modelWeightStatus: evaluation.allowedForProduction ? 'approved' : manifest ? 'needs_review' : 'missing',
    warnings,
    blockingReasons,
  }
}
