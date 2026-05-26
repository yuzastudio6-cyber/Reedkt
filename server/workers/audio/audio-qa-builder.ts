import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ProductionToolIssue } from '../../../src/backend/contracts/production-tool-runtime-contracts'
import type { AudioAnalysisSummary, AudioCleanupPlan, AudioQAResult, LoudnessNormalizationPlan, MusicDuckingPlan } from './audio-foundation-types'

export function buildAudioQAResults(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId?: string
  audioAnalysis: AudioAnalysisSummary
  cleanupPlan: AudioCleanupPlan
  loudnessPlan: LoudnessNormalizationPlan
  duckingPlan: MusicDuckingPlan
}): AudioQAResult {
  const loudnessIssues = loudnessIssuesFor(input.audioAnalysis, input.loudnessPlan)
  const naturalnessIssues = naturalnessIssuesFor(input.cleanupPlan)
  const musicIssues = input.duckingPlan.enabled || !input.audioAnalysis.musicSpeechOverlap
    ? []
    : [issue('music_over_voice_unresolved', 'Music/speech overlap exists but ducking is not enabled.', 'warning')]
  const syncIssues = [issue('audio_sync_placeholder', 'Audio sync preservation is a placeholder gate until waveform alignment runs.', 'info')]
  const gates = [
    buildGate(input, 'audio_loudness', loudnessIssues),
    buildGate(input, 'audio_sync', syncIssues),
    buildGate(input, 'audio_naturalness', naturalnessIssues),
    buildGate(input, 'music_over_voice', musicIssues),
  ]
  return {
    qualityGateResults: gates,
    issues: gates.flatMap((gate) => gate.issues.map((item) => item.message)),
  }
}

function loudnessIssuesFor(analysis: AudioAnalysisSummary, plan: LoudnessNormalizationPlan): ProductionToolIssue[] {
  const issues: ProductionToolIssue[] = []
  if (analysis.clippingDetected) issues.push(issue('clipping_detected', 'Clipping detected; loudness normalization must not blindly boost clipped audio.', 'warning'))
  if (typeof analysis.integratedLufs !== 'number') issues.push(issue('loudness_not_measured', 'Integrated loudness is not measured; plan is target metadata.', 'warning'))
  if (plan.shouldNormalize) issues.push(issue('normalization_required', 'Audio should be normalized to target loudness before preview/export.', 'warning'))
  return issues
}

function naturalnessIssuesFor(cleanupPlan: AudioCleanupPlan): ProductionToolIssue[] {
  const issues: ProductionToolIssue[] = []
  if (cleanupPlan.cleanupStrength === 'strong') issues.push(issue('overprocessing_risk', 'Strong cleanup risks robotic artifacts and requires human review.', 'blocking'))
  if (cleanupPlan.risks.includes('voice_naturalness_risk')) issues.push(issue('voice_naturalness_risk', 'Cleanup plan may affect voice naturalness.', 'warning'))
  if (cleanupPlan.risks.includes('clipping_requires_review')) issues.push(issue('clipping_requires_review', 'Clipping should be reviewed separately from denoise.', 'warning'))
  return issues
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
    id: `audio-gate-${gateType}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId ?? 'audio-foundation-dry-run',
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
      ? [{ action: 'review_audio_plan', reason: `Resolve ${gateType} issues before preview/export.`, priority: blocking ? 'urgent' : 'normal' }]
      : [{ action: 'continue', reason: `${gateType} passed deterministic Milestone 9 checks.`, priority: 'low' }],
    fallbackRequired: blocking,
    blocksPreview: blocking,
    blocksFinalExport: blocking || warning,
    humanReviewRequired: blocking || issues.some((item) => item.code.includes('clipping') || item.code.includes('naturalness')),
  }
}

function issue(code: string, message: string, severity: ProductionToolIssue['severity']): ProductionToolIssue {
  return { code, message, severity }
}
