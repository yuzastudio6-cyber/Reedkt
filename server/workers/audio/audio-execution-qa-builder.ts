import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  AudioExecutionPlan,
  AudioExecutionValidationResult,
  AudioLoudnessExecutionResult,
  AudioNormalizationExecutionResult,
  AudioCleanupExecutionResult,
} from './audio-execution-types'

export function buildAudioExecutionQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  executionPlan: AudioExecutionPlan
  validation: AudioExecutionValidationResult
  loudnessResult?: AudioLoudnessExecutionResult
  normalizationResult?: AudioNormalizationExecutionResult
  cleanupResult?: AudioCleanupExecutionResult
}): QualityGateResult[] {
  const validationIssues = input.validation.issues.map((item): ProductionToolIssue => ({
    code: item.code,
    message: item.message,
    severity: item.severity,
  }))
  const loudnessIssues = [
    ...validationIssues.filter((issue) => issue.code.includes('loudness') || issue.code.includes('true_peak')),
    ...(input.loudnessResult?.status === 'failed' ? [issue('loudness_execution_failed', input.loudnessResult.errorMessage ?? 'Loudness execution failed.', 'warning')] : []),
    ...(input.executionPlan.loudnessOperationPlan.normalize && input.normalizationResult?.status !== 'completed'
      ? [issue('normalization_planned_not_completed', 'Normalization is planned but has not completed in this mode.', 'warning')]
      : []),
  ]
  const naturalnessIssues = [
    ...validationIssues.filter((item) => item.code.includes('voice') || item.code.includes('model')),
    ...(input.executionPlan.cleanupOperationPlan.strength === 'strong'
      ? [issue('overprocessing_risk', 'Strong cleanup risks voice naturalness and requires review.', 'blocking')]
      : []),
    ...(input.cleanupResult?.skipReasons ?? []).filter((reason) => reason.tool === 'deepfilternet').map((reason) =>
      issue(reason.code, reason.message, 'warning'),
    ),
  ]
  const musicIssues = [
    ...validationIssues.filter((item) => item.code.includes('demucs')),
    ...(input.executionPlan.musicDuckingOperationPlan.enabled
      ? []
      : [issue('music_ducking_not_executed', 'Music ducking remains metadata-only or not needed in M15A.', 'warning')]),
  ]
  const syncIssues = [issue('audio_sync_placeholder', 'Audio sync preservation is a placeholder until final mux/render milestones.', 'info')]

  return [
    buildGate(input, 'audio_loudness', loudnessIssues),
    buildGate(input, 'audio_sync', syncIssues),
    buildGate(input, 'audio_naturalness', naturalnessIssues),
    buildGate(input, 'music_over_voice', musicIssues),
  ]
}

function buildGate(
  input: {
    workspaceId: string
    projectId: string
    mediaAssetId: string
    toolExecutionPlanId?: string
  },
  gateType: QualityGateResult['gateType'],
  issues: ProductionToolIssue[],
): QualityGateResult {
  const blocking = issues.some((item) => item.severity === 'blocking')
  const warning = issues.some((item) => item.severity === 'warning')
  return {
    id: `audio-execution-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'audio-execution-dry-run',
    recipeId: 'audio_cleanup_recipe',
    gateType,
    status: blocking ? 'blocked' : warning ? 'warning' : 'passed',
    score: blocking ? 0.35 : warning ? 0.76 : 0.96,
    threshold: 0.8,
    required: true,
    blocking,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues,
    recommendations: issues.length > 0
      ? [{ action: 'review_audio_execution', reason: `Resolve ${gateType} issues before preview/future export.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed M15A deterministic checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: true,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('naturalness') || item.code.includes('overprocessing')),
  }
}

function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
