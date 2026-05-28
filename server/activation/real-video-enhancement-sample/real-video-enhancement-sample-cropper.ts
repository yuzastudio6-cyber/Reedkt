export function describeRealVideoEnhancementSampleCrop(input: {
  sourceWidth: number
  sourceHeight: number
}): { x: number; y: number; width: number; height: number; reason: string; blockers: string[]; warnings: string[] } {
  const side = Math.min(512, input.sourceWidth, input.sourceHeight)
  const blockers: string[] = []
  const warnings: string[] = []
  if (side < 256) blockers.push('Source frame is too small for the minimum 256x256 Phase 34D sample crop.')
  if (side < 512) warnings.push('Source frame is smaller than the preferred 512x512 sample; using largest centered square fallback.')
  return {
    x: Math.floor((input.sourceWidth - side) / 2),
    y: Math.floor((input.sourceHeight - side) / 2),
    width: side,
    height: side,
    reason: side >= 512 ? 'Centered 512x512 crop from the approved Phase 33D representative frame.' : 'Centered fallback crop from the approved Phase 33D representative frame.',
    blockers,
    warnings,
  }
}
