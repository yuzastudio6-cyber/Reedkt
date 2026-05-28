import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { RealVideoSmartCutNormalizedInput } from './real-video-smart-cut-types'

export function buildPhase29QaSummary(input: {
  normalized: RealVideoSmartCutNormalizedInput
  qaResults: QualityGateResult[]
  previewSkippedReason: string
}): {
  status: 'passed' | 'warning' | 'blocked'
  gates: QualityGateResult[]
  blockers: string[]
  warnings: string[]
} {
  const captionGates = buildCaptionReferenceGates(input.normalized)
  const gates = dedupeGates([...input.qaResults, ...captionGates])
  const blockers = gates
    .filter((gate) => gate.blocking)
    .flatMap((gate) => gate.issues.length ? gate.issues.map((issue) => `${gate.gateType}: ${issue.message}`) : [`${gate.gateType}: blocking gate`])
  const warnings = [
    ...gates
      .filter((gate) => gate.status === 'warning')
      .flatMap((gate) => gate.issues.length ? gate.issues.map((issue) => `${gate.gateType}: ${issue.message}`) : [`${gate.gateType}: warning`]),
    `preview: ${input.previewSkippedReason}`,
    'final_delivery remains not applicable; Phase 29 does not create a final export.',
  ]
  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings: Array.from(new Set(warnings)),
  }
}

function buildCaptionReferenceGates(input: RealVideoSmartCutNormalizedInput): QualityGateResult[] {
  return [
    gate('caption_timing', input.captionSegments.every((caption) => caption.endSeconds > caption.startSeconds), 'Caption segment timing references from Phase 28 remain positive.'),
    gate('caption_readability', input.captionSegments.every((caption) => caption.lines.length <= 2 && caption.lines.every((line) => line.length <= 42)), 'Caption line references from Phase 28 remain within the controlled readability policy.'),
    {
      ...gate('caption_safe_zone', true, 'Safe-zone remains warning-only because Phase 29 does not run face/OCR analysis or burn captions into a rendered video.'),
      status: 'warning',
      score: 0.74,
      issues: [{
        code: 'safe_zone_not_render_checked',
        message: 'Caption safe-zone is not pixel-verified because Phase 29 does not render or run face/OCR analysis.',
        severity: 'warning',
      }],
    },
  ]
}

function gate(gateType: QualityGateResult['gateType'], passed: boolean, message: string): QualityGateResult {
  return {
    id: `phase29-gate-${gateType}`,
    workspaceId: 'activation-phase29',
    projectId: 'reeditpro',
    mediaAssetId: 'phase28-20260528T01552-source-video',
    toolExecutionPlanId: 'activation-phase29-smart-cut-caption',
    recipeId: gateType === 'final_delivery' ? 'final_export_recipe' : 'smart_cut_recipe',
    gateType,
    status: passed ? 'passed' : 'blocked',
    score: passed ? 0.96 : 0.2,
    threshold: 0.8,
    required: true,
    blocking: !passed,
    checkedAt: new Date().toISOString(),
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: passed ? [] : [{ code: `${gateType}_failed`, message, severity: 'blocking' }],
    recommendations: [{ action: passed ? 'continue' : 'block_preview', reason: message, priority: passed ? 'low' : 'urgent' }],
    fallbackRequired: !passed,
    blocksPreview: !passed,
    blocksFinalExport: true,
    humanReviewRequired: gateType === 'caption_safe_zone',
  }
}

function dedupeGates(gates: QualityGateResult[]): QualityGateResult[] {
  const seen = new Set<string>()
  const results: QualityGateResult[] = []
  for (const gate of gates) {
    const key = gate.gateType
    if (seen.has(key)) continue
    seen.add(key)
    results.push(gate)
  }
  return results
}
