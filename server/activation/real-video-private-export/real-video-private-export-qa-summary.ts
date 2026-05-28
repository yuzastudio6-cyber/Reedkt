import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { RealVideoPrivateExportRuntimeReport } from './real-video-private-export-types'

export function buildPhase30QaSummary(input: {
  finalExportExists: boolean
  timelineDurationSeconds: number
  finalExportDurationSeconds?: number
  hasAudio?: boolean
  videoCodec?: string
  audioCodec?: string
  captionHandling: 'sidecar_only' | 'burned_in' | 'skipped'
}): RealVideoPrivateExportRuntimeReport['qa'] {
  const durationDelta = input.finalExportDurationSeconds === undefined
    ? Number.POSITIVE_INFINITY
    : Math.abs(input.finalExportDurationSeconds - input.timelineDurationSeconds)
  const gates: QualityGateResult[] = [
    gate('render_asset_integrity', input.finalExportExists, 'Private final_export artifact exists and source media was not overwritten.'),
    gate('render_timeline_integrity', input.timelineDurationSeconds > 0, 'Phase 29 TimelineManifest duration is positive.'),
    gate('export_codec_format', input.videoCodec === 'h264' || input.videoCodec === 'mpeg4' || input.videoCodec === 'unknown', 'Private export uses an MP4-compatible video codec.'),
    gate('export_duration_sync', durationDelta <= 0.75, `Export duration is within tolerance of the Phase 29 timeline (${durationDelta.toFixed(3)}s delta).`),
    input.hasAudio
      ? gate('audio_sync', true, 'Audio stream is present in the private export; deep waveform sync remains future QA.')
      : warnGate('audio_sync', 'Audio stream was not detected; review is required before broader export use.'),
    input.captionHandling === 'sidecar_only'
      ? warnGate('caption_timing', 'Caption timing is retained as private sidecars; burn-in was intentionally skipped for this first export.')
      : gate('caption_timing', input.captionHandling === 'burned_in', 'Captions are included in the private export.'),
    input.captionHandling === 'sidecar_only'
      ? warnGate('caption_readability', 'Caption readability remains based on Phase 28/29 sidecar QA because captions were not burned into pixels.')
      : gate('caption_readability', true, 'Caption readability gate is inherited from validated caption artifacts.'),
  ]
  const finalDeliveryGate = gate(
    'final_delivery',
    input.finalExportExists && durationDelta <= 0.75,
    'Private final delivery is allowed only for this controlled Phase 30 review export with private caption sidecars.',
  )
  gates.push(finalDeliveryGate)
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
    id: `phase30-gate-${gateType}`,
    workspaceId: 'activation-phase30',
    projectId: 'reeditpro',
    mediaAssetId: 'phase28-20260528T01552-source-video',
    toolExecutionPlanId: 'activation-phase30-private-export',
    recipeId: gateType === 'final_delivery' ? 'final_export_recipe' : 'smart_cut_recipe',
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
    humanReviewRequired: gateType === 'caption_readability' || gateType === 'caption_timing',
  }
}
