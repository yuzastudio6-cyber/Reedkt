import type { BiRefNetMaskQaGate, BiRefNetRuntimeExecutionReport } from './birefnet-runtime-types'

export function buildBiRefNetMaskQaSummary(input: {
  maskWidth?: number
  maskHeight?: number
  fixtureWidth: number
  fixtureHeight: number
  nonZeroRatio?: number
  cutoutProduced?: boolean
}): { status: 'passed' | 'warning' | 'blocked'; gates: BiRefNetMaskQaGate[]; blockers: string[]; warnings: string[] } {
  const blockers: string[] = []
  const warnings: string[] = ['Temporal mask stability is not applicable in Phase 33C because only one generated image is used.']
  const dimensionsMatch = input.maskWidth === input.fixtureWidth && input.maskHeight === input.fixtureHeight
  const nonEmpty = typeof input.nonZeroRatio === 'number' && input.nonZeroRatio > 0.005
  const notFullFrame = typeof input.nonZeroRatio === 'number' && input.nonZeroRatio < 0.995
  if (!dimensionsMatch) blockers.push('Mask dimensions do not match the generated fixture image.')
  if (!nonEmpty) blockers.push('Mask appears empty.')
  if (!notFullFrame) blockers.push('Mask appears to be full-frame only.')

  const gates: BiRefNetMaskQaGate[] = [
    {
      gateId: 'mask_edge_quality',
      status: nonEmpty && notFullFrame ? 'passed' : 'blocked',
      summary: nonEmpty && notFullFrame ? 'Mask has foreground/background separation on the generated fixture.' : 'Mask has insufficient foreground/background separation.',
    },
    {
      gateId: 'mask_subject_coverage',
      status: nonEmpty && notFullFrame ? 'passed' : 'blocked',
      summary: typeof input.nonZeroRatio === 'number' ? `Mask non-zero ratio is ${input.nonZeroRatio.toFixed(4)}.` : 'Mask coverage ratio is missing.',
    },
    {
      gateId: 'render_asset_integrity',
      status: dimensionsMatch && input.cutoutProduced ? 'passed' : 'blocked',
      summary: dimensionsMatch && input.cutoutProduced ? 'Mask and RGBA cutout artifacts were produced with matching dimensions.' : 'Mask/cutout artifact integrity failed.',
    },
    {
      gateId: 'mask_temporal_stability',
      status: 'not_applicable',
      summary: 'Single generated image runtime verification does not make temporal mask stability claims.',
    },
  ]

  return {
    status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'passed',
    gates,
    blockers,
    warnings,
  }
}

export function validateBiRefNetRuntimeExecutionReport(report?: BiRefNetRuntimeExecutionReport): string[] {
  if (!report) return ['BiRefNet runtime execution report is missing.']
  const blockers: string[] = []
  if (!report.ok) blockers.push('BiRefNet runtime job did not report ok=true.')
  if (report.model.manifestId !== 'birefnet_main_staging_v1') blockers.push('Runtime did not use the approved BiRefNet manifest.')
  if (report.model.revision !== 'e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4') blockers.push('Runtime revision does not match Phase 33B evidence.')
  if (report.model.aggregateSha256 !== '1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7') blockers.push('Runtime model checksum does not match Phase 33B evidence.')
  if (!report.gpu.cudaAvailable || report.gpu.type !== 'nvidia-l4') blockers.push('Runtime did not confirm nvidia-l4 CUDA availability.')
  if (!report.fixture.generated) blockers.push('Runtime did not use a generated fixture image.')
  if (report.mask.status !== 'completed') blockers.push('BiRefNet mask generation did not complete.')
  if (report.qa.status === 'blocked') blockers.push('BiRefNet mask QA has blocking failures.')
  if (report.safety.providerExecuted) blockers.push('Provider execution was reported.')
  if (report.safety.modelDownloadedExternally) blockers.push('External model download was reported.')
  if (report.safety.realMediaUsed || report.safety.realVideoFrameUsed) blockers.push('Real media/frame use was reported.')
  if (report.safety.sam2Used) blockers.push('SAM2 use was reported.')
  if (report.safety.textBehindSubjectExecuted) blockers.push('Text-behind-subject execution was reported.')
  if (report.safety.secretValuesUsed) blockers.push('Secret value use was reported.')
  if (report.safety.publicAccessEnabled) blockers.push('Public access was reported.')
  if (report.safety.rtxPro6000Used) blockers.push('RTX PRO 6000 use was reported.')
  if (report.safety.revideoUsed) blockers.push('Revideo use was reported.')
  return blockers
}
