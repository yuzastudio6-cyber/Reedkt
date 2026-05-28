import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { RealVideoColorAnalysisSummary, RealVideoColorGradeRecipe, RealVideoColorRuntimeReport } from './real-video-color-correction-types'

export function buildPhase32ColorQaSummary(input: {
  colorExportExists: boolean
  inputDurationSeconds?: number
  outputDurationSeconds?: number
  outputHasAudio?: boolean
  outputVideoCodec?: string
  outputAudioCodec?: string
  analysis: RealVideoColorAnalysisSummary
  recipe: RealVideoColorGradeRecipe
}): RealVideoColorRuntimeReport['qa'] {
  const durationDelta = input.inputDurationSeconds === undefined || input.outputDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.outputDurationSeconds - input.inputDurationSeconds)
  const hasBlockingExposureRisk = input.analysis.overexposedRisk === 'high' || input.analysis.underexposedRisk === 'high'
  const gates: QualityGateResult[] = [
    gate('color_exposure', !hasBlockingExposureRisk || input.recipe.decision === 'minimal_correction', input.recipe.reason),
    warnGate('color_skin_tone', 'No face/skin analysis ran; skin tone QA is warning-only for Phase 32.'),
    gate('color_export_space', input.outputVideoCodec === 'h264', 'Private color export uses an MP4-compatible H.264 video stream.'),
    warnGate('color_shot_match', 'Single controlled clip only; shot matching is not applicable beyond continuity review.'),
    gate('export_codec_format', input.outputVideoCodec === 'h264' && input.outputAudioCodec === 'aac', 'Private color export uses H.264/AAC MP4.'),
    gate('export_duration_sync', durationDelta <= 0.75, `Export duration delta ${durationDelta.toFixed(3)}s remains within tolerance.`),
    gate('audio_sync', Boolean(input.outputHasAudio) && durationDelta <= 0.75, 'Audio stream was preserved from the Phase 31 export.'),
  ]
  const blockersBeforeFinal = gates.filter((item) => item.blocking)
  gates.push(gate('final_delivery', input.colorExportExists && blockersBeforeFinal.length === 0, 'Private Phase 32 color-reviewed final delivery exists with no blocking color QA findings.'))
  const blockers = gates
    .filter((item) => item.blocking)
    .flatMap((item) => item.issues.length ? item.issues.map((issue) => `${item.gateType}: ${issue.message}`) : [`${item.gateType}: blocking gate`])
  const warnings = gates
    .filter((item) => item.status === 'warning')
    .flatMap((item) => item.issues.length ? item.issues.map((issue) => `${item.gateType}: ${issue.message}`) : [`${item.gateType}: warning`])
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateType: QualityGateResult['gateType'], passed: boolean, message: string): QualityGateResult {
  return {
    id: `phase32-gate-${gateType}`,
    workspaceId: 'activation-phase32',
    projectId: 'reeditpro',
    mediaAssetId: 'phase31-20260528T13060-audio-normalized-export',
    toolExecutionPlanId: 'activation-phase32-color-correction',
    recipeId: gateType === 'final_delivery' ? 'private_color_corrected_export' : 'ffmpeg_clean_color_correction',
    gateType,
    status: passed ? 'passed' : 'blocked',
    score: passed ? 0.95 : 0.2,
    threshold: 0.8,
    required: true,
    blocking: !passed,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: gateType === 'final_delivery' ? 'qa_worker' : 'render_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: passed ? [] : [{ code: `${gateType}_failed`, message, severity: 'blocking' }],
    recommendations: [{ action: passed ? 'continue' : 'block_final_export', reason: message, priority: passed ? 'low' : 'urgent' }],
    fallbackRequired: !passed,
    blocksPreview: false,
    blocksFinalExport: !passed,
    humanReviewRequired: false,
  }
}

function warnGate(gateType: QualityGateResult['gateType'], message: string): QualityGateResult {
  return {
    ...gate(gateType, true, message),
    status: 'warning',
    score: 0.78,
    issues: [{ code: `${gateType}_warning`, message, severity: 'warning' }],
    recommendations: [{ action: 'continue', reason: message, priority: 'normal' }],
    humanReviewRequired: true,
  }
}
